# Olympia Backend

Backend API service for the Olympia quiz application. This service provides API endpoints for question management, audio processing with Whisper, and user answer tracking.

## Tech Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **PostgreSQL**: Relational database (running in Docker)
- **SQLModel**: ORM for database interaction
- **OpenAI Whisper**: For audio transcription
- **OpenAI**: For AI-based scoring and feedback

## Prerequisites

- Python 3.10+ 
- Docker and Docker Compose
- OpenAI API key
- FFmpeg (for audio processing)

## Setup Instructions

### 1. Clone the repository
```bash
git clone <repository-url>
cd olympia/backend
```

### 2. Set up environment variables
Create a `.env` file in the backend directory:

```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=postgresql://olympia:olympia123@localhost:5432/olympia_db
```

### 3. Start PostgreSQL database with Docker
```bash
docker-compose up -d
```

### 4. Set up Python virtual environment
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows, use: .venv\Scripts\activate
```

### 5. Install dependencies
Copy the project's requirements.txt to the backend directory if not already present:
```bash
cp ../requirements.txt .
pip install -r requirements.txt
```

### 6. Verify FFmpeg installation
Make sure FFmpeg is installed on your system, as it's needed for audio processing:

```bash
# On macOS (using Homebrew)
brew install ffmpeg

# On Ubuntu/Debian
sudo apt update
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

## Running the Application

### Start the FastAPI server
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, you can access the auto-generated API documentation:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

- `GET /` - Health check endpoint
- `GET /questions` - Get all questions
- `GET /questions/{question_id}` - Get a specific question
- `POST /upload-audio` - Upload audio for transcription

## Database Schema

The application uses the following models:

- **Question**: Quiz questions and answers
- **User**: User information
- **UserAnswer**: Records of user answers, scores, and feedback

## Troubleshooting

### Database Connection Issues
- Verify that PostgreSQL is running: `docker ps`
- Check database logs: `docker logs backend_postgres_1`
- Ensure your `.env` file has the correct `DATABASE_URL`

### OpenAI API Issues
- Verify your API key is correct in the `.env` file
- Check for rate limiting or quota issues in the OpenAI dashboard

### Whisper Model Issues
- The first run may take time as it downloads the model
- Ensure enough disk space for model storage
- For CUDA errors, check CUDA and PyTorch compatibility