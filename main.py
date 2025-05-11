import pdfplumber
import pandas as pd
import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI
from langchain_core.output_parsers import StrOutputParser
from docling.document_converter import DocumentConverter
from docling.chunking import HybridChunker
from pathlib import Path
import json
from typing import List, Dict

# Load biến môi trường từ file .env
load_dotenv()

# Đọc nội dung PDF
def extract_text_from_pdf(pdf_path):
    converter = DocumentConverter()
    conv_result = converter.convert(pdf_path)
    output_dir = Path("./output")
    output_dir.mkdir(parents=True, exist_ok=True)
    doc_filename = conv_result.input.file.stem
    
    # Trả về document để sử dụng với HybridChunker
    return conv_result.document

# Sử dụng LangChain + OpenAI để tách câu hỏi và đáp án
def extract_qa_pairs(text, openai_api_key):
    prompt_template = (
        "Hãy trích xuất tất cả các cặp [câu hỏi + đáp án] từ đoạn văn sau. "
        "Trả về kết quả dạng JSON với các trường: 'question', 'answer'.\n"
        "Đoạn văn:\n{text}"
    )
    prompt = PromptTemplate(
        input_variables=["text"],
        template=prompt_template
    )
    llm = OpenAI(openai_api_key=openai_api_key, temperature=0)
    chain = prompt | llm | StrOutputParser()
    result = chain.invoke({"text": text})
    return result

# Trích xuất QA từ nhiều chunk
def extract_qa_from_chunks(chunks, chunker, openai_api_key: str) -> List[Dict]:
    """
    Trích xuất cặp câu hỏi-đáp án từ danh sách các chunk sử dụng HybridChunker
    
    Args:
        chunks: Danh sách các chunk từ HybridChunker
        chunker: Đối tượng HybridChunker để tạo contextualized text
        openai_api_key: OpenAI API key
        
    Returns:
        Danh sách các cặp câu hỏi-đáp án
    """
    all_qa_pairs = []
    
    for i, chunk in enumerate(chunks):
        print(f"Đang xử lý chunk {i+1}/{len(chunks)}...")
        try:
            # Lấy văn bản có context từ chunker
            enriched_text = chunker.contextualize(chunk=chunk)
            
            qa_json = extract_qa_pairs(enriched_text, openai_api_key)
            qa_list = json.loads(qa_json)
            
            # Nếu qa_list là dict thay vì list, chuyển nó thành list
            if isinstance(qa_list, dict):
                if 'question' in qa_list and 'answer' in qa_list:
                    qa_list = [qa_list]
                else:
                    qa_list = list(qa_list.values())
                    
            all_qa_pairs.extend(qa_list)
            print(f"Đã trích xuất {len(qa_list)} cặp Q&A từ chunk {i+1}")
        except Exception as e:
            print(f"Lỗi khi xử lý chunk {i+1}: {str(e)}")
    
    return all_qa_pairs

# Lưu vào CSV
def save_to_csv(qa_list, csv_path):
    df = pd.DataFrame(qa_list)
    df.to_csv(csv_path, index=False)


pdf_path = "thuvienhoclieu.com-Bo-cau-hoi-Olympia.pdf"
csv_path = "olympia_qa.csv"

# Lấy API key từ biến môi trường
openai_api_key = os.getenv("OPENAI_API_KEY")

if not openai_api_key:
    raise ValueError("OPENAI_API_KEY không được tìm thấy. Hãy thêm vào file .env")

print('Start extracting text from pdf')
# Bước 1: Trích xuất document từ PDF
doc = extract_text_from_pdf(pdf_path)
print('Done extracting text from pdf', len(doc))
# Bước 2: Sử dụng HybridChunker để chia nhỏ document
chunker = HybridChunker()
chunks = list(chunker.chunk(dl_doc=doc))
print(f"Đã chia văn bản thành {len(chunks)} chunk")

# Bước 3: Trích xuất cặp Q&A từ từng chunk
qa_list = extract_qa_from_chunks(chunks, chunker, openai_api_key)

# Bước 4: Lưu vào CSV
save_to_csv(qa_list, csv_path)
print(f"Đã lưu {len(qa_list)} cặp Q&A vào {csv_path}")