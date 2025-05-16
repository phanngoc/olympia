import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser
from docling.chunking import HybridChunker
import json
import csv
from typing import List, Dict
from pathlib import Path
from docling.document_converter import DocumentConverter

# Load biến môi trường từ file .env
load_dotenv()

def save_qa_pairs_to_csv(qa_pairs: List[Dict], output_path: str, is_first_chunk: bool = False) -> None:
    """
    Lưu danh sách các cặp Q&A vào file CSV
    
    Args:
        qa_pairs: Danh sách các cặp Q&A dạng [{'question': '...', 'answer': '...'}, ...]
        output_path: Đường dẫn đến file CSV cần lưu
        is_first_chunk: True nếu đây là chunk đầu tiên (để ghi header)
    """
    # Tạo thư mục nếu chưa tồn tại
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Lưu vào file CSV
    mode = 'w' if is_first_chunk else 'a'
    with open(output_path, mode, newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['question', 'answer'])
        if is_first_chunk:
            writer.writeheader()
        writer.writerows(qa_pairs)
    
    print(f"Đã lưu {len(qa_pairs)} cặp Q&A vào file {output_path}")

def process_document_with_chunks(doc, openai_api_key: str = None, output_path: str = None) -> List[Dict]:
    """
    Sử dụng HybridChunker để chia nhỏ document thành các chunk,
    xử lý từng chunk để trích xuất cặp câu hỏi-đáp án bằng OpenAI,
    và trả về danh sách các cặp câu hỏi-đáp án.
    
    Args:
        doc: Document cần xử lý
        openai_api_key: API key của OpenAI. Nếu không cung cấp, sẽ lấy từ biến môi trường.
        output_path: Đường dẫn đến file CSV để lưu kết quả
        
    Returns:
        Danh sách các cặp câu hỏi-đáp án dạng [{'question': '...', 'answer': '...'}, ...]
    """
    # Lấy API key từ tham số hoặc biến môi trường
    if openai_api_key is None:
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY không được tìm thấy. Hãy thêm vào file .env hoặc truyền vào tham số.")
    
    # Bước 1: Sử dụng HybridChunker để chia nhỏ document
    chunker = HybridChunker()
    chunks = list(chunker.chunk(dl_doc=doc))
    print(f"Đã chia văn bản thành {len(chunks)} chunk")
    
    # Bước 2: Xử lý từng chunk để trích xuất cặp câu hỏi-đáp án
    all_qa_pairs = []
    
    for i, chunk in enumerate(chunks):
        print(f"Đang xử lý chunk {i+1}/{len(chunks)}...")
        try:
            # Lấy văn bản có context từ chunker
            enriched_text = chunker.contextualize(chunk=chunk)
            print(f"enriched_text: {i}:", enriched_text)
            
            # Sử dụng LangChain + OpenAI để tách câu hỏi và đáp án
            prompt_template = (
                "Hãy trích xuất tất cả các cặp [câu hỏi + đáp án] từ đoạn văn sau. "
                "Trả về kết quả dạng JSON với các trường: 'question', 'answer'.\n"
                "Đảm bảo trả về JSON đầy đủ và đúng định dạng.\n"
                "Đoạn văn:\n{text}"
            )
            prompt = PromptTemplate(
                input_variables=["text"],
                template=prompt_template
            )
            
            # Sử dụng ChatOpenAI thay vì OpenAI
            llm = ChatOpenAI(
                openai_api_key=openai_api_key,
                temperature=0,
                model="gpt-4o"  # Sử dụng model có context dài hơn
            )
            
            chain = prompt | llm | StrOutputParser()
            qa_json = chain.invoke({"text": enriched_text})
            print(f"qa_json: {i}:", qa_json)
            # trim ```json ở đầu , ``` đầu cuối của qa_json
            qa_json = qa_json.strip('```json').strip('```')
            qa_list = json.loads(qa_json)
            
            # Nếu qa_list là dict thay vì list, chuyển nó thành list
            if isinstance(qa_list, dict):
                if 'question' in qa_list and 'answer' in qa_list:
                    qa_list = [qa_list]
                else:
                    qa_list = list(qa_list.values())
            
            # Lưu kết quả vào CSV ngay sau khi xử lý chunk
            if output_path:
                save_qa_pairs_to_csv(qa_list, output_path, is_first_chunk=(i == 0))
            
            all_qa_pairs.extend(qa_list)
            print(f"Đã trích xuất {len(qa_list)} cặp Q&A từ chunk {i+1}")
        except Exception as e:
            print(f"Lỗi khi xử lý chunk {i+1}: {str(e)}")
    
    return all_qa_pairs

def process_markdown_file(markdown_path: str, openai_api_key: str = None, output_path: str = None) -> List[Dict]:
    """
    Load file markdown và convert sang cụm [question, answer]
    
    Args:
        markdown_path: Đường dẫn đến file markdown
        openai_api_key: API key của OpenAI. Nếu không cung cấp, sẽ lấy từ biến môi trường.
        output_path: Đường dẫn đến file CSV để lưu kết quả
        
    Returns:
        Danh sách các cặp câu hỏi-đáp án dạng [{'question': '...', 'answer': '...'}, ...]
    """
    # Kiểm tra file tồn tại
    if not os.path.exists(markdown_path):
        raise FileNotFoundError(f"Không tìm thấy file markdown tại: {markdown_path}")
    
    # Tạo document từ nội dung markdown
    converter = DocumentConverter()
    doc = converter.convert(source=markdown_path).document
    print('type doc', type(doc))
    
    # Xử lý document để trích xuất cặp câu hỏi-đáp án
    return process_document_with_chunks(doc, openai_api_key, output_path)

# Đọc nội dung PDF
def extract_text_from_pdf(pdf_path, output_dir = None):
    converter = DocumentConverter()
    conv_result = converter.convert(pdf_path)

    if output_dir:
        output_dir.mkdir(parents=True, exist_ok=True)
        doc_filename = conv_result.input.file.stem
        
    # Lưu document thành file markdown
    with open(output_dir / f"{doc_filename}.md", "w") as f:
        f.write(conv_result.document.export_to_markdown())

    # Trả về document để sử dụng với HybridChunker
    return conv_result.document


# Xử lý file markdown
# markdown_path = "output/thuvienhoclieu.com-Bo-cau-hoi-Olympia.md"
# output_path = "./output/qa_pairs.csv"
# qa_pairs = process_markdown_file(markdown_path, output_path=output_path)
# print(f"Tổng số cặp Q&A đã trích xuất từ file markdown: {len(qa_pairs)}")
