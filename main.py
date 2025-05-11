import pdfplumber
import pandas as pd
import os
from dotenv import load_dotenv
from langchain_core.prompts import PromptTemplate
from langchain_openai import OpenAI
from langchain_core.output_parsers import StrOutputParser
from docling.document_converter import DocumentConverter
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
    text = conv_result.document.export_to_markdown()
    # Export Markdown format:
    with (output_dir / f"{doc_filename}.md").open("w", encoding="utf-8") as fp:
        fp.write(text)

    return text

# Chia nhỏ văn bản thành các chunk
def chunk_text(text: str, chunk_size: int = 4000, overlap: int = 200) -> List[str]:
    """
    Chia văn bản thành các chunk nhỏ hơn với kích thước xác định và có overlap
    
    Args:
        text: Văn bản cần chia
        chunk_size: Kích thước tối đa của mỗi chunk (số ký tự)
        overlap: Số ký tự chồng lấp giữa các chunk
        
    Returns:
        Danh sách các chunk văn bản
    """
    if len(text) <= chunk_size:
        return [text]
    
    chunks = []
    start = 0
    
    while start < len(text):
        # Lấy chunk với kích thước chunk_size
        end = start + chunk_size
        
        if end >= len(text):
            chunks.append(text[start:])
            break
            
        # Tìm vị trí kết thúc của đoạn hoặc câu gần nhất
        # để tránh cắt giữa câu hoặc đoạn
        split_pos = text.rfind("\n\n", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = text.rfind("\n", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = text.rfind(". ", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = text.rfind(" ", start, end)
        if split_pos == -1 or split_pos <= start:
            split_pos = end
            
        chunks.append(text[start:split_pos])
        
        # Di chuyển start về phía trước, trừ đi overlap
        start = split_pos
        if start < len(text) and text[start] in [' ', '\n', '.']:
            start += 1
    
    return chunks

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
def extract_qa_from_chunks(chunks: List[str], openai_api_key: str) -> List[Dict]:
    """
    Trích xuất cặp câu hỏi-đáp án từ danh sách các chunk
    
    Args:
        chunks: Danh sách các chunk văn bản
        openai_api_key: OpenAI API key
        
    Returns:
        Danh sách các cặp câu hỏi-đáp án
    """
    all_qa_pairs = []
    
    for i, chunk in enumerate(chunks):
        print(f"Đang xử lý chunk {i+1}/{len(chunks)}...")
        try:
            qa_json = extract_qa_pairs(chunk, openai_api_key)
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

if __name__ == "__main__":
    pdf_path = "thuvienhoclieu.com-Bo-cau-hoi-Olympia.pdf"
    csv_path = "olympia_qa.csv"
    
    # Lấy API key từ biến môi trường
    openai_api_key = os.getenv("OPENAI_API_KEY")
    
    if not openai_api_key:
        raise ValueError("OPENAI_API_KEY không được tìm thấy. Hãy thêm vào file .env")

    # Bước 1: Trích xuất text từ PDF
    text = extract_text_from_pdf(pdf_path)
    
    # Bước 2: Chia nhỏ văn bản thành các chunk
    chunks = chunk_text(text, chunk_size=4000, overlap=200)
    print(f"Đã chia văn bản thành {len(chunks)} chunk")
    
    # Bước 3: Trích xuất cặp Q&A từ từng chunk
    qa_list = extract_qa_from_chunks(chunks, openai_api_key)

    # Bước 4: Lưu vào CSV
    save_to_csv(qa_list, csv_path)
    print(f"Đã lưu {len(qa_list)} cặp Q&A vào {csv_path}")