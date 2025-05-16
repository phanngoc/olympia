from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Body
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import openai
import os
from dotenv import load_dotenv
import whisper
import torch
import tempfile
import json
import random
from sqlmodel import Session, select
from typing import List
from database import get_session, create_db_and_tables, engine
from models import Question, User, UserAnswer

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Initialize Whisper model
device = "cuda" if torch.cuda.is_available() else "cpu"
model = whisper.load_model("medium", device=device)

@app.on_event("startup")
def on_startup():
    pass

@app.get("/")
async def read_root():
    return {"message": "Welcome to the Quiz API"}

@app.get("/questions", response_model=List[Question])
async def get_questions(session: Session = Depends(get_session)):
    questions = session.exec(select(Question)).all()
    return questions

@app.get("/questions/{question_id}", response_model=Question)
async def get_question(question_id: int, session: Session = Depends(get_session)):
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return question

@app.get("/random-question", response_model=Question)
async def get_random_question(session: Session = Depends(get_session)):
    questions = session.exec(select(Question)).all()
    if not questions:
        raise HTTPException(status_code=404, detail="No questions available")
    random_question = random.choice(questions)
    return random_question

@app.post("/questions", response_model=Question)
async def create_question(question: Question, session: Session = Depends(get_session)):
    session.add(question)
    session.commit()
    session.refresh(question)
    return question

MODEL_NAME = "gpt-4o-mini"  # Change to your preferred model
@app.post("/evaluate")
async def evaluate_answer(
    question_id: int = Body(...),
    answer: str = Body(...),
    user_id: int = Body(None),
    session: Session = Depends(get_session)
):
    try:
        question = session.get(Question, question_id)
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
        
        # Use OpenAI to evaluate the answer
        try:
            # Try with response_format first (for newer models)
            response = client.chat.completions.create(
                model=MODEL_NAME,  # Use a model that supports JSON response format
                messages=[
                    {"role": "system", "content": "Bạn là trợ lý đánh giá câu trả lời cho học sinh Việt Nam. Hãy đánh giá câu trả lời một cách linh hoạt, chấp nhận câu trả lời gần đúng. Trả về dưới dạng JSON với 'score' (0-100) và 'feedback' bằng tiếng Việt."},
                    {"role": "user", "content": f"Câu hỏi: {question.question}\nĐáp án đúng: {question.answer}\nCâu trả lời của học sinh: {answer}\nHãy đánh giá câu trả lời và cho điểm, đồng thời đưa ra nhận xét."}
                ],
                response_format={"type": "json_object"}
            )
        except Exception as e:
            # Fallback to standard response without response_format
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": "Bạn là trợ lý đánh giá câu trả lời cho học sinh Việt Nam. Hãy đánh giá câu trả lời một cách linh hoạt, chấp nhận câu trả lời gần đúng. Trả về dưới dạng JSON với 'score' (0-100) và 'feedback' bằng tiếng Việt."},
                    {"role": "user", "content": f"Câu hỏi: {question.question}\nĐáp án đúng: {question.answer}\nCâu trả lời của học sinh: {answer}\nHãy đánh giá câu trả lời và cho điểm, đồng thời đưa ra nhận xét."}
                ]
            )
        
        response_content = response.choices[0].message.content
        if response_content is None:
            raise HTTPException(status_code=500, detail="Failed to get evaluation from OpenAI")
            
        evaluation = json.loads(response_content)
        
        # Save user answer if user_id is provided
        if user_id is not None:
            user_answer = UserAnswer(
                user_id=user_id,
                question_id=question_id,
                answer=answer,
                score=evaluation["score"],
                feedback=evaluation["feedback"]
            )
            session.add(user_answer)
            session.commit()
        
        return evaluation
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transcribe")
async def transcribe_audio(audio_file: UploadFile = File(...)):
    try:
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        # Transcribe audio using Whisper
        result = model.transcribe(temp_file_path)
        
        # Clean up temporary file
        os.unlink(temp_file_path)
        
        return {"transcription": result["text"]}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)