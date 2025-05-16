Frontend: Next.js + TailwindCSS + Shadcn + Zustand  
Python FastAPI và OpenAI Whisper API để build backend
CSV câu hỏi (Đọc câu hỏi từ CSV) --> API backend --> Frontend hiển thị câu hỏi

Người dùng nói (mic) --> Speech-to-text --> Chuyển text

Text trả lời + Đáp án đúng --> OpenAI GPT --> So sánh & đánh giá

Hiển thị kết quả đúng/sai, và đáp áreadn đúng


Prompt để đánh gía 
prompt = f"""
You are a quiz evaluator. Here is a question and its correct answer. 
Evaluate if the user's answer is correct, even if it is phrased differently but has the same meaning.

Question: {question}
Correct answer: {correct_answer}
User answer: {user_answer}

Respond with only "Correct" or "Incorrect".
"""


| Tính năng              | Mục tiêu |
|------------------------|----------|
| Quản lý câu hỏi        | Đọc câu hỏi từ CSV |
| Nhận câu trả lời nói   | Người chơi nói, chuyển thành text |
| So sánh đáp án         | So sánh text trả lời với đáp án CSV |
| Chấm điểm              | Trả kết quả đúng/sai cho người chơi |


Backend: Supabase (Postgres) (init bằng docker compose)