# 📚 Promptpass.ai - Multi-Version AI-Powered Exam Platform

An intelligent AI-powered exam practice platform that helps students prepare for exams by uploading question papers, getting AI-evaluated answers, and receiving detailed explanations with follow-up chat support.

> **Note**: This repository contains multiple versions of the project. Choose the version that best fits your needs.

---

## 🚀 Project Structure

```
Promptpass.ai/
├── README.md                      # This file - Project overview
├── promptpass_ai_v0/              # Version 0 - Initial Release
│   ├── README.md                  # v0 specific documentation
│   ├── backend/
│   ├── frontend/
│   └── docker-compose.yml
└── promptpass_ai_v1/              # Version 1 - Enhanced Version (Latest)
    ├── README.md                  # v1 specific documentation
    ├── backend/
    ├── frontend/
    └── docker-compose.yml
```

---

## 🔄 Version Comparison

| Feature | v0 | v1 | Notes |
|---------|----|----|-------|
| PDF Question Extraction | ✅ | ✅ | v1: Improved error handling |
| AI-Powered Evaluation | ✅ | ✅ | Real-time streaming responses |
| Follow-up Chat | ✅ | ✅ | Ask clarification questions |
| Progress Tracking | ✅ | ✅ | Visual status indicators |
| Database Support | ✅ | ✅ | PostgreSQL backend |
| Generic PDF Processing | ❌ | ✅ | v1: Extracts ALL questions |
| Error Handling | Basic | ✅ | v1: Comprehensive error handling |
| DB Query Optimization | ❌ | ✅ | v1: Optimized queries |

---

## ✨ Key Features (All Versions)

- **📄 PDF Question Extraction**: Upload exam PDFs and automatically extract questions using Google Gemini AI vision
- **🤖 AI-Powered Evaluation**: Get instant AI-based evaluation with detailed explanations
- **💬 Follow-up Chat**: Ask follow-up questions for deeper understanding
- **📊 Progress Tracking**: Visual progress indicator (gray/green/red status)
- **🗄️ Persistent Storage**: PostgreSQL database for exam plans, questions, and attempts
- **⚡ Real-time Streaming**: Server-sent events for live AI responses
- **🔄 Multi-exam Support**: Create and manage multiple exam plans

---

## 📦 Recommended Version

### Use **v1 (Latest)** if you want:
- ✅ Extracts ALL questions from PDFs (no limits)
- ✅ Robust error handling and logging
- ✅ Optimized database queries
- ✅ Better performance with large datasets
- ✅ Production-ready code

### Use **v0** if you want:
- ✅ Initial implementation reference
- ✅ Simpler codebase for learning
- ✅ Original architecture study

---

## ⚡ Quick Start (5 minutes)

### Run v1 (Recommended)
```bash
cd promptpass_ai_v1
docker compose up -d

cd backend
pip install -r requirements.txt
export OLLAMA_HOST=http://localhost:11434
export OLLAMA_MODEL=mistral
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

In another terminal:
```bash
cd promptpass_ai_v1/frontend
npm install
npm run dev
```

Then open `http://localhost:5173` in your browser and upload a PDF.

> Optional: For scanned PDFs, install Tesseract OCR on your machine to enable OCR fallback.
> On Ubuntu: `sudo apt-get install tesseract-ocr`

### Run v0 (Alternative)
```bash
cd promptpass_ai_v0
# no docker compose needed for v0 if you run backend and frontend separately
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

cd ../frontend
npm install
npm run dev
```

---

## 📂 Directory Guide

Choose your version and navigate to its directory:

```bash
# For Version 1 (Latest - Recommended)
cd promptpass_ai_v1
cat README.md

# For Version 0 (Original)
cd promptpass_ai_v0
cat README.md
```

---

## 🔐 Environment Variables (Both Versions)

```bash
# Google Gemini API Configuration (Required)
GEMINI_API_KEY=your_gemini_api_key_here

# Database Configuration (Optional - defaults provided)
DATABASE_URL=postgresql://app_user:app_secure_password@localhost:5432/practice_session_db
```

---

## 🐛 Troubleshooting

### Backend Issues
- **"GEMINI_API_KEY missing"**: Set environment variable before running
- **"Database connection refused"**: Ensure PostgreSQL is running with `docker-compose up -d`
- **PDF parsing returns no questions**: Verify PDF has extractable text (not just images)

### Frontend Issues
- **Vite dev server fails**: Check if port 5173 is in use
- **API requests failing**: Verify backend is running on http://localhost:8000
- **React components not rendering**: Clear node_modules and reinstall: `rm -rf node_modules && npm install`

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
- Code follows PEP 8 standards (Python) and ESLint rules (JavaScript)
- All API changes are documented
- Database migrations are provided for schema changes
- Tests are included for new features

---

## 📄 License

This project is part of Promptpass.ai

---

## 🔗 Quick Links

| Version | README | Backend | Frontend |
|---------|--------|---------|----------|
| **v0** | [promptpass_ai_v0/README.md](promptpass_ai_v0/README.md) | [Backend](promptpass_ai_v0/backend) | [Frontend](promptpass_ai_v0/frontend) |
| **v1** | [promptpass_ai_v1/README.md](promptpass_ai_v1/README.md) | [Backend](promptpass_ai_v1/backend) | [Frontend](promptpass_ai_v1/frontend) |

---

**Last Updated**: June 17, 2026
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

**Last Updated**: June 17, 2026

## Usage
- Access the frontend application in your web browser at `http://localhost:3000`.
- The backend API can be accessed at `http://localhost:5000`.

## Contributing
Feel free to submit issues or pull requests for improvements or bug fixes.

## License
This project is licensed under the MIT License.