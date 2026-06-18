# 📚 Promptpass.ai v0 - Initial Release

An intelligent AI-powered exam practice platform (Version 0) that helps students prepare for exams by uploading question papers, getting AI-evaluated answers, and receiving detailed explanations with follow-up chat support.

> **Version**: v0 (Original)  
> **Status**: Stable  
> **For Latest Features**: See [v1](../promptpass_ai_v1/README.md)

---

## ⚠️ Important Notes for v0

- **2-Question Limit**: PDF extraction limited to first 2 questions per upload
- **Basic Error Handling**: Limited error recovery
- **All Queries**: Database queries fetch all records (not optimized)
- **For Learning**: Great reference for understanding the initial architecture

**→ For Production Use**: See [v1 (Latest)](../promptpass_ai_v1/README.md) with full features and optimizations

---

## ✨ v0 Features

- **📄 PDF Question Extraction**: Upload exam PDFs (extracts first 2 questions)
- **🤖 AI-Powered Evaluation**: Get instant AI-based evaluation with explanations
- **💬 Follow-up Chat**: Ask follow-up questions for understanding
- **📊 Progress Tracking**: Visual progress indicators
- **🗄️ Persistent Storage**: PostgreSQL database
- **⚡ Real-time Streaming**: Server-sent events for AI responses
- **🔄 Multi-exam Support**: Create and manage multiple exam plans

---

## ⚡ Quick Start (5 minutes)

### Option A: Full Docker Setup (Recommended)
```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services (PostgreSQL + Ollama)
docker-compose up -d

# 3. Download Ollama model (first time only, ~4GB)
docker exec practice_app_ollama ollama pull mistral

# 4. Install frontend and run
cd frontend
npm install
npm run dev

# 5. Open the URL shown in the Vite terminal (usually http://localhost:5173)
# Backend auto-connects to Ollama at http://ollama:11434
```

### Option B: Manual Backend Setup (Development)
```bash
# 1. Start PostgreSQL and Ollama
docker-compose up -d

# 2. Install backend dependencies
cd backend
pip install -r requirements.txt

# 3. Run FastAPI server
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 4. In another terminal, run frontend
cd frontend
npm install
npm run dev

# 5. Open the URL shown in the Vite terminal (usually http://localhost:5173)
```

### Troubleshooting
- If your browser shows `GET http://localhost:8000/api/plans net::ERR_CONNECTION_REFUSED`, the backend is not running on port `8000`.
- Start the backend and verify with:
  ```bash
  curl http://localhost:8000/api/plans
  ```
- If Vite starts on `5174` instead of `5173`, use the actual URL printed in the terminal.
- If the frontend loads but API fetches fail, the React app is running but the backend needs to be started separately.

---

## 🏗️ Technology Stack

### Backend
- **Framework**: FastAPI (Python web framework)
- **Database**: PostgreSQL (relational database)
- **ORM**: SQLAlchemy (SQL toolkit and ORM)
- **AI Service**: Ollama (Local open-source LLM)
- **Default Model**: Mistral 7B (fast, accurate)
- **PDF Processing**: PDFPlumber & PyMuPDF (fitz)
- **Server**: Uvicorn (ASGI server)
- **HTTP Client**: Requests (for Ollama API)

### Database & Services
- **PostgreSQL 16** (containerized)
- **Ollama** (containerized - runs LLM models locally)
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
- PostgreSQL (or use Docker)
- At least 4GB RAM for Ollama

### 1. Environment Setup

Create a `.env` file in the root directory (copy from `.env.example`):

```bash
# Ollama Configuration
OLLAMA_HOST=http://ollama:11434
OLLAMA_MODEL=mistral

# Database Configuration (optional if using docker-compose)
POSTGRES_USER=app_user
POSTGRES_PASSWORD=app_secure_password
POSTGRES_DB=practice_session_db
```

**Notes:**
- `OLLAMA_HOST`: URL where Ollama API listens (Docker: `http://ollama:11434`, Local: `http://localhost:11434`)
- `OLLAMA_MODEL`: Model to use (mistral, llama2, etc.)
- Models are auto-downloaded on first use (4-7GB each)

### 2. Database & Ollama Setup (Using Docker)

```bash
# Start PostgreSQL and Ollama services
docker-compose up -d

# Verify services are running
docker-compose ps

# Download default Ollama model (first time only)
# This downloads ~4GB of data - be patient!
docker exec practice_app_ollama ollama pull mistral

# Verify Ollama is ready
curl http://localhost:11434/api/tags

# Access Adminer at http://localhost:8080
# - System: PostgreSQL
# - Server: postgres-db
# - Username: app_user
# - Password: app_secure_password
# - Database: practice_session_db

# To use a different model:
docker exec practice_app_ollama ollama pull llama2
# Then update .env: OLLAMA_MODEL=llama2
```

**Available Models** (Popular options):
- `mistral` (7B) - Fast, accurate - **Recommended**
- `llama2` (7B) - Good general purpose
- `neural-chat` (7B) - Optimized for chat
- `dolphin-mixtral` (8x7B) - High quality, more VRAM needed

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
OLLAMA_HOST             # Ollama API URL (Default: http://ollama:11434)
OLLAMA_MODEL            # Model name (Default: mistral)
POSTGRES_USER           # Database user (Default: app_user)
POSTGRES_PASSWORD       # Database password (Default: app_secure_password)
POSTGRES_DB             # Database name (Default: practice_session_db)
```

**Ollama Models Performance:**
| Model | Size | Speed | Quality | VRAM Needed |
|-------|------|-------|---------|-------------|
| mistral | 7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 4GB |
| llama2 | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 4GB |
| neural-chat | 7B | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 4GB |
| phi | 2.7B | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | 2GB |python
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

- [ ] Generic PDF extraction (unlimited questions)
- [ ] Comprehensive error handling
- [ ] Optimized database queries
- [ ] User authentication & authorization
- [ ] Advanced analytics & performance tracking
- [ ] Multiple user attempts history with detailed statistics
- [ ] Custom evaluation criteria per exam
- [ ] Export results as PDF
- [ ] Timed practice sessions with countdown timer
- [ ] Leaderboard & competitive features

---

## ⬆️ Upgrade to v1

**v1 includes all v0 features plus:**
- ✅ Extracts ALL questions (no 2-question limit)
- ✅ Comprehensive error handling
- ✅ Optimized database queries
- ✅ Better logging and debugging
- ✅ Production-ready code

See [v1 README](../promptpass_ai_v1/README.md) for details.

---

## 🔗 Related

- [Main README](../../README.md) - Project overview
- [v1 Version](../promptpass_ai_v1/README.md) - Latest version
- [GitHub Repository](https://github.com/Deepanshu1003/Promptpass.ai)

---

**Version**: v0 (Original)  
**Last Updated**: June 17, 2026

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

**Last Updated**: June 17, 2026

## Usage
- Access the frontend application in your web browser at `http://localhost:3000`.
- The backend API can be accessed at `http://localhost:5000`.

## Contributing
Feel free to submit issues or pull requests for improvements or bug fixes.

## License
This project is licensed under the MIT License.