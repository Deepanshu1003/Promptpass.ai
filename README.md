# 📚 Promptpass.ai - AI-Powered Practice & Exam Preparation

An intelligent AI-powered exam practice platform that helps students prepare for exams by uploading question papers, getting AI-evaluated answers, and receiving detailed explanations with follow-up chat support.

---

## ✨ Key Features

- **📄 PDF Question Extraction**: Upload exam PDFs and automatically extract questions using Google Gemini AI vision capabilities
- **🤖 AI-Powered Evaluation**: Get instant AI-based evaluation of student answers with detailed explanations
- **💬 Follow-up Chat**: Ask follow-up questions about answers for deeper understanding
- **📊 Progress Tracking**: Visual progress indicator showing attempted/correct/incorrect questions
- **🗄️ Persistent Storage**: PostgreSQL database to store exam plans, questions, and student attempts
- **⚡ Real-time Streaming**: Server-sent events for streaming AI responses in real-time
- **🔄 Multi-exam Support**: Create and manage multiple exam plans

---

## 🏗️ Technology Stack

### Backend
- **Framework**: FastAPI (Python web framework)
- **Database**: PostgreSQL (relational database)
- **ORM**: SQLAlchemy (SQL toolkit and ORM)
- **AI Service**: Google Generative AI (Gemini 2.0 Flash)
- **PDF Processing**: PDFPlumber & PyMuPDF (fitz)
- **Server**: Uvicorn (ASGI server)

### Database
- **PostgreSQL 16** (containerized)
- **Adminer** for database administration UI

### Frontend
- React.jsx with Vite (to be developed)

---

## 📁 Project Structure

```
Promptpass.ai/
├── docker-compose.yml          # Docker services configuration
├── README.md                   # This file
├── backend/
│   ├── requirements.txt        # Python dependencies
│   ├── frontend/               # Frontend files (to be added)
│   └── app/
│       ├── __init__.py
│       ├── main.py            # FastAPI application & routes
│       ├── database.py        # Database connection & session management
│       ├── models.py          # SQLAlchemy models (ExamPlan, Question, UserAttempt)
│       ├── schemas.py         # Pydantic schemas for API validation
│       ├── parser.py          # PDF parsing & question extraction
│       └── ai_service.py      # Google Gemini AI integration
└── .git/                      # Version control
```

---

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 16+ (for frontend)
- Docker & Docker Compose
- Google Gemini API Key
- PostgreSQL (or use Docker)

### 1. Environment Setup

Create a `.env` file in the backend directory:

```bash
# Google Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration (optional if using docker-compose)
DATABASE_URL=postgresql://app_user:app_secure_password@localhost:5432/practice_session_db
```

### 2. Database Setup (Using Docker)

```bash
# Start PostgreSQL and Adminer services
docker-compose up -d

# Verify services are running
docker-compose ps

# Access Adminer at http://localhost:8080
# - System: PostgreSQL
# - Server: postgres-db
# - Username: app_user
# - Password: app_secure_password
# - Database: practice_session_db
```

### 3. Backend Setup

```bash
# Navigate to backend
cd backend

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### 4. Frontend Setup (When Available)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 📡 API Endpoints

### Exam Plans
- **POST** `/api/upload` - Upload PDF with exam materials
  - Form data: `plan_title` (string), `question_bank` (PDF file)
  - Returns: `exam_plan_id`, `total_questions`

- **GET** `/api/plans` - Get all exam plans
  - Returns: List of `ExamPlanResponse` objects

- **GET** `/api/plans/{plan_id}` - Get single exam plan
  - Returns: `ExamPlanResponse` object

- **DELETE** `/api/plans/{plan_id}` - Delete exam plan
  - Returns: `{status: "success"}`

### Questions
- **GET** `/api/plans/{plan_id}/questions` - Get all questions in a plan
  - Returns: List of `QuestionResponse` objects

- **GET** `/api/plans/{plan_id}/progress` - Get progress on questions
  - Returns: List of `ProgressItem` objects with status (gray/green/red)

### Evaluation & Chat
- **POST** `/api/evaluate` - Evaluate student answer
  - Body: `{question_id: UUID, selected_answer: string}`
  - Returns: Server-Sent Event stream with AI evaluation

- **POST** `/api/chat` - Ask follow-up question
  - Body: `{question_text: string, ai_explanation: string, user_message: string}`
  - Returns: Server-Sent Event stream with AI response

---

## 🗄️ Database Models

### ExamPlan
```python
- id: UUID (Primary Key)
- title: String (exam name)
- created_at: DateTime (timestamp)
```

### Question
```python
- id: UUID (Primary Key)
- exam_plan_id: UUID (Foreign Key to ExamPlan)
- question_number: Integer
- text: String (question text)
- options: JSON {A: "...", B: "...", C: "...", D: "..."}
```

### UserAttempt
```python
- id: UUID (Primary Key)
- question_id: UUID (Foreign Key to Question, unique)
- selected_answer: String (A/B/C/D)
- is_correct: Boolean
- explanation: Text (AI-generated explanation)
- attempted_at: DateTime
```

---

## 🔐 Environment Variables

```bash
GEMINI_API_KEY          # Google Generative AI API key (required)
DATABASE_URL            # PostgreSQL connection string
                        # Default: postgresql://app_user:app_secure_password@localhost:5432/practice_session_db
```

---

## 📋 API Response Examples

### Upload Exam
```json
{
  "exam_plan_id": "550e8400-e29b-41d4-a716-446655440000",
  "total_questions": 2
}
```

### Get Questions
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "exam_plan_id": "550e8400-e29b-41d4-a716-446655440000",
    "question_number": 1,
    "text": "What is 2 + 2?",
    "options": {
      "A": "3",
      "B": "4",
      "C": "5",
      "D": "6"
    }
  }
]
```

### Progress
```json
[
  {
    "question_id": "550e8400-e29b-41d4-a716-446655440001",
    "question_number": 1,
    "status": "green"  // "gray" (not attempted), "green" (correct), "red" (incorrect)
  }
]
```

---

## 🔄 How It Works

1. **Question Extraction**: PDF uploaded → PyMuPDF converts pages to images → Google Gemini extracts questions as JSON
2. **Storage**: Questions stored in PostgreSQL with reference to the exam plan
3. **Answer Evaluation**: Student submits answer → Google Gemini evaluates with streaming response → Result stored with explanation
4. **Follow-up Chat**: Student can ask questions about the evaluation → AI provides contextual responses

---

## 🛠️ Development Notes

- PDF extraction limits to **2 questions per upload** (for demo/testing)
- Streaming responses use JSON-wrapped format for markdown preservation
- CORS enabled for all origins (development only - restrict in production)
- Database sessions auto-manage with context managers
- All IDs use UUID v4 for scalability

---

## 📦 Dependencies

See [backend/requirements.txt](backend/requirements.txt):
- fastapi==0.110.0
- uvicorn==0.28.0
- sqlalchemy==2.0.28
- psycopg2-binary==2.9.9
- pdfplumber==0.11.0
- google-generativeai==0.4.1
- pydantic==2.6.4
- python-multipart==0.0.9

---

## ⚠️ Important Notes

- **API Key Required**: Set `GEMINI_API_KEY` environment variable to use AI features
- **Development Only**: CORS is open to all origins - restrict in production
- **Database**: PostgreSQL must be running (use docker-compose for easy setup)
- **Demo Limit**: PDF parser limits to 2 questions for demo purposes

---

## 🔮 Future Enhancements

- [ ] Frontend React application
- [ ] User authentication & authorization
- [ ] Analytics & performance tracking
- [ ] Multiple user attempts history
- [ ] Custom evaluation criteria
- [ ] Export results as PDF
- [ ] Timed practice sessions
- [ ] Leaderboard & competitive features

---

## 📄 License

This project is part of Promptpass.ai

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows PEP 8 standards
- All API changes are documented
- Database migrations are provided
- Tests are included for new features

---

**Last Updated**: 2026-06-17

## Usage
- Access the frontend application in your web browser at `http://localhost:3000`.
- The backend API can be accessed at `http://localhost:5000`.

## Contributing
Feel free to submit issues or pull requests for improvements or bug fixes.

## License
This project is licensed under the MIT License.