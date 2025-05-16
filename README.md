# Olympia Quiz App

Ứng dụng quiz với khả năng nhận diện giọng nói, sử dụng Next.js cho frontend và FastAPI cho backend.

## Tính năng

- Giao diện người dùng hiện đại với TailwindCSS và Shadcn/UI components
- Ghi âm giọng nói và chuyển đổi giọng nói thành văn bản
- Đánh giá câu trả lời bằng AI (OpenAI)
- Hiệu ứng chuyển đổi và âm thanh
- Thiết kế responsive hoạt động trên mọi thiết bị

## Cài đặt

### Backend

1. Khởi động cơ sở dữ liệu:
```bash
cd backend
docker-compose up -d
```

2. Tạo môi trường ảo Python:
```bash
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
# hoặc
.venv\Scripts\activate  # Windows
```

3. Cài đặt dependencies:
```bash
pip install -r requirements.txt
```

4. Tạo file .env và thêm API key:
```
OPENAI_API_KEY=your_openai_api_key_here
```

5. Chạy backend:
```bash
cd backend
uvicorn main:app --reload
```

### Frontend

1. Cài đặt dependencies:
```bash
cd frontend
npm install
```

2. Thêm file âm thanh vào thư mục `/frontend/public/sounds/`:
   - `correct.mp3` - Âm thanh khi trả lời đúng
   - `incorrect.mp3` - Âm thanh khi trả lời sai
   - `recording.mp3` - Âm thanh khi bắt đầu ghi âm
   - `complete.mp3` - Âm thanh khi hoàn thành quiz

3. Chạy frontend:
```bash
npm run dev
```

## Sử dụng

1. Mở trình duyệt và truy cập http://localhost:3000
2. Trên màn hình chào mừng, nhấn nút "Bắt đầu thử thách"
3. Nhấn nút microphone để bắt đầu ghi âm câu trả lời
4. Sau khi microphone dừng ghi âm, nhấn "Kiểm tra đáp án" để xem kết quả
5. Hoàn thành tất cả câu hỏi để xem tổng kết

## Cấu trúc dự án

- `/frontend` - Ứng dụng Next.js
  - `/app` - Next.js app router
  - `/components` - React components
  - `/store` - Zustand state management
  - `/utils` - Utility functions
  - `/public` - Static assets
- `/backend` - Ứng dụng FastAPI
  - `/data` - CSV question data
  - Docker setup cho Supabase/Postgres

## Công nghệ sử dụng

- **Frontend**:
  - Next.js
  - TailwindCSS
  - Shadcn/UI
  - Zustand (State Management)
  - Framer Motion (Animations)
  - Canvas Confetti (Visual Effects)

- **Backend**:
  - FastAPI
  - OpenAI Whisper API
  - Supabase/PostgreSQL
  - Docker
