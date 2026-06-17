# 📚 Promptpass.ai v1 - Enhanced & Production-Ready

An intelligent AI-powered exam practice platform (Version 1 - Latest) that helps students prepare for exams by uploading question papers, getting AI-evaluated answers, and receiving detailed explanations with follow-up chat support.

> **Version**: v1 (Latest & Recommended)  
> **Status**: Production-Ready  
> **Previous Version**: [v0](../promptpass_ai_v0/README.md)

---

## ✨ v1 Improvements Over v0

| Feature | v0 | v1 | Details |
|---------|----|----|---------|
| PDF Extraction | 2 questions limit | All questions | Generic processing for any PDF size |
| Error Handling | Basic | ✅ Comprehensive | Try-catch blocks and graceful fallbacks |
| DB Queries | All records | ✅ Filtered | Queries only relevant data per exam plan |
| Logging | Limited | ✅ Detailed | [DEBUG], [ERROR], [WARNING] prefixes |
| Production Ready | ❌ | ✅ | Full error handling and optimization |

---

## ✨ v1 Features

- **📄 PDF Question Extraction**: Upload exam PDFs and extract **ALL questions** automatically
- **🤖 AI-Powered Evaluation**: Get instant AI-based evaluation with detailed explanations
- **💬 Follow-up Chat**: Ask follow-up questions for deeper understanding
- **📊 Progress Tracking**: Visual progress indicators (gray/green/red status)
- **🗄️ Persistent Storage**: PostgreSQL database with optimized queries
- **⚡ Real-time Streaming**: Server-sent events for AI responses
- **🔄 Multi-exam Support**: Create and manage multiple exam plans
- **🛡️ Error Handling**: Comprehensive error recovery and logging

---

## ⚡ Quick Start (5 minutes)

```bash
# 1. Start database in background
docker-compose up -d

# 2. Install and run backend (in one terminal)
cd backend
pip install -r requirements.txt
export GEMINI_API_KEY=your_key_here
python -m uvicorn app.main:app --reload

# 3. Install and run frontend (in another terminal)
cd frontend
npm install
npm run dev

# 4. Open http://localhost:5173 in your browser
# 5. Upload a PDF with questions → All questions are extracted and saved!
```

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
- **React 18** with JSX
- **Vite** (modern build tool)
- **React Markdown** (for rendering AI responses)
- **ESLint** for code quality

---

## 📁 Project Structure

```
Promptpass.ai/
├── docker-compose.yml          # Docker services configuration
├── README.md                   # This file
├── backend/
│   ├── requirements.txt        # Python dependencies
│   └── app/
│       ├── __init__.py
│       ├── main.py            # FastAPI application & routes
│       ├── database.py        # Database connection & session management
│       ├── models.py          # SQLAlchemy models (ExamPlan, Question, UserAttempt)
│       ├── schemas.py         # Pydantic schemas for API validation
│       ├── parser.py          # PDF parsing & question extraction
│       └── ai_service.py      # Google Gemini AI integration
├── frontend/
│   ├── package.json           # Node.js dependencies & scripts
│   ├── package-lock.json      # Dependency lock file
│   ├── vite.config.js         # Vite build configuration
│   ├── index.html             # HTML entry point
│   └── src/
│       ├── main.jsx           # React app entry point
│       ├── App.jsx            # Main application component
│       └── PracticeSession.jsx # Practice session UI component
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

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server (runs on http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

The frontend will automatically proxy API requests to `http://localhost:8000` during development.

---

## 🎨 Frontend Components

### **App.jsx**
Main application component that serves as the entry point for the React application. Handles:
- Navigation between different views
- Overall layout and styling
- State management for exam plans and user sessions

### **PracticeSession.jsx**
Core component for the practice experience. Features:
- Question display with multiple choice options
- Real-time AI evaluation with streaming responses
- Follow-up chat interface for asking clarification questions
- Progress tracking visualization
- Answer history and feedback display

### **main.jsx**
React entry point that initializes the application with Vite's client-side hydration.

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

- **Generic PDF Extraction**: Extracts ALL questions from PDFs of any size
- **Robust Error Handling**: Gracefully handles extraction failures with detailed logging
- **Optimized DB Queries**: Filters attempts by exam plan for better performance
- **Streaming Responses**: JSON-wrapped format preserves markdown in AI explanations
- **CORS**: Enabled for all origins (restrict in production)
- **UUID v4**: Used for all database IDs ensuring scalability
- **Vite HMR**: Fast Hot Module Replacement during development
- **React Markdown**: Renders AI explanations with GitHub Flavored Markdown

---

## 📦 Dependencies

### Backend
See [backend/requirements.txt](backend/requirements.txt):
- fastapi==0.110.0
- uvicorn==0.28.0
- sqlalchemy==2.0.28
- psycopg2-binary==2.9.9
- pdfplumber==0.11.0
- google-generativeai==0.4.1
- pydantic==2.6.4
- python-multipart==0.0.9

### Frontend
See [frontend/package.json](frontend/package.json):
- **react** (^18.2.0) - UI library
- **react-dom** (^18.2.0) - React DOM rendering
- **react-markdown** (^10.1.0) - Markdown rendering for AI responses
- **remark-gfm** (^4.0.1) - GitHub Flavored Markdown support
- **vite** (^5.2.0) - Build tool and dev server
- **eslint** (^8.57.0) - Code linting

---

## ⚠️ Important Notes

- **API Key Required**: Set `GEMINI_API_KEY` environment variable for AI extraction
- **Development Only**: CORS is open to all origins - restrict in production  
- **Database**: PostgreSQL must be running (use docker-compose for setup)
- **Generic Processing**: Extracts ALL questions regardless of PDF size
- **Node Version**: Requires Node.js 16+ for frontend development
- **Port Conflicts**: Backend runs on 8000, frontend on 5173, PostgreSQL on 5432, Adminer on 8080
- **Error Handling**: Check backend logs for detailed extraction errors

---

## 🔮 Future Enhancements

- [ ] User authentication & authorization
- [ ] Advanced analytics & performance tracking
- [ ] Multiple user attempts history with detailed statistics
- [ ] Custom evaluation criteria per exam
- [ ] Export results as PDF
- [ ] Timed practice sessions with countdown timer
- [ ] Leaderboard & competitive features
- [ ] Mobile app version (React Native)
- [ ] Real-time collaboration features
- [ ] AI-powered hint system
- [ ] Batch PDF uploads with progress tracking
- [ ] Question difficulty classification
- [ ] Topic-based question grouping

---

## 📄 License

This project is part of Promptpass.ai

---

## 🐛 Troubleshooting

### Backend Issues

**"GEMINI_API_KEY missing" error**
- Ensure you've set the environment variable: `export GEMINI_API_KEY=your_key_here`
- Verify your API key is valid at [Google AI Studio](https://aistudio.google.com/)

**"Database connection refused"**
- Make sure PostgreSQL is running: `docker-compose up -d`
- Check if port 5432 is not already in use: `lsof -i :5432`

**PDF parsing returns no questions**
- Ensure PDF has clear text (not scanned images without OCR)
- Check PDF file size isn't too large
- Verify Gemini API key and connection

### Frontend Issues

**Vite dev server fails to start**
- Port 5173 might be in use: `lsof -i :5173`
- Clear node_modules: `rm -rf node_modules && npm install`
- Check Node version: `node --version` (should be 16+)

**API requests failing with CORS errors**
- Verify backend is running on http://localhost:8000
- Check browser console for specific error messages

**React components not rendering**
- Check browser console for JavaScript errors
- Ensure all dependencies installed: `npm install`
- Try clearing browser cache: `Ctrl+Shift+Del` or `Cmd+Shift+Del`

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows PEP 8 standards
- All API changes are documented
- Database migrations are provided
- Tests are included for new features

---

## 🔮 Future Enhancements (v2+)

- [ ] User authentication & authorization
- [ ] Advanced analytics & performance tracking
- [ ] Multiple user attempts history with detailed statistics
- [ ] Custom evaluation criteria per exam
- [ ] Export results as PDF
- [ ] Timed practice sessions with countdown timer
- [ ] Leaderboard & competitive features
- [ ] Mobile app version (React Native)
- [ ] Real-time collaboration features
- [ ] AI-powered hint system
- [ ] Batch PDF uploads with progress tracking
- [ ] Question difficulty classification
- [ ] Topic-based question grouping

---

## 📊 What's New in v1

✅ **Generic PDF Processing** - No more 2-question limit  
✅ **Comprehensive Error Handling** - Try-catch blocks throughout  
✅ **DB Query Optimization** - Filters by exam plan instead of fetching all  
✅ **Better Logging** - [DEBUG], [ERROR], [WARNING] prefixes  
✅ **Production Ready** - Full error recovery and graceful fallbacks  

See [v0 README](../promptpass_ai_v0/README.md) for previous version.

---

## 🔗 Related

- [Main README](../../README.md) - Project overview
- [v0 Version](../promptpass_ai_v0/README.md) - Original version
- [GitHub Repository](https://github.com/Deepanshu1003/Promptpass.ai)

---

**Version**: v1 (Latest & Recommended)  
**Last Updated**: June 17, 2026