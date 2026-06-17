from fastapi import FastAPI, Depends, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import shutil
import os
import json # Added for safe markdown streaming

from .database import Base, engine, get_db
from .models import ExamPlan, Question, UserAttempt
from .schemas import AttemptSubmit, QuestionResponse, ProgressItem, ExamPlanResponse, ChatSubmit
from .parser import parse_question_pdf
from .ai_service import stream_evaluation, stream_chat

Base.metadata.create_all(bind=engine)
app = FastAPI(title="AI Practice App Engine")

app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

@app.post("/api/upload")
def upload_exam_materials(plan_title: str = Form(...), question_bank: UploadFile = File(...), db: Session = Depends(get_db)):
    print(f"[DEBUG] /api/upload called: plan_title={plan_title}, filename={question_bank.filename}")
    temp_path = f"temp_{question_bank.filename}"
    with open(temp_path, "wb") as buffer:
        shutil.copyfileobj(question_bank.file, buffer)
    try:
        extracted_questions = parse_question_pdf(temp_path)
        if not extracted_questions:
            raise HTTPException(status_code=400, detail="Could not extract any questions out of this PDF.")
        new_plan = ExamPlan(title=plan_title)
        db.add(new_plan)
        db.commit()
        db.refresh(new_plan)
        for q in extracted_questions:
            db.add(Question(exam_plan_id=new_plan.id, question_number=q["question_number"], text=q["text"], options=q["options"]))
        db.commit()
        return {"exam_plan_id": new_plan.id, "total_questions": len(extracted_questions)}
    finally:
        if os.path.exists(temp_path): os.remove(temp_path)

@app.get("/api/plans", response_model=list[ExamPlanResponse])
def get_all_plans(db: Session = Depends(get_db)):
    print("[DEBUG] /api/plans called")
    return db.query(ExamPlan).order_by(ExamPlan.created_at.desc()).all()

@app.get("/api/plans/{plan_id}", response_model=ExamPlanResponse)
def get_single_plan(plan_id: str, db: Session = Depends(get_db)):
    print(f"[DEBUG] /api/plans/{plan_id} called")
    plan = db.query(ExamPlan).filter(ExamPlan.id == plan_id).first()
    if not plan: raise HTTPException(status_code=404, detail="Plan not found")
    return plan

# NEW DELETE ENDPOINT
@app.delete("/api/plans/{plan_id}")
def delete_plan(plan_id: str, db: Session = Depends(get_db)):
    print(f"[DEBUG] DELETE /api/plans/{plan_id} called")
    plan = db.query(ExamPlan).filter(ExamPlan.id == plan_id).first()
    if not plan: raise HTTPException(status_code=404, detail="Plan not found")
    db.delete(plan)
    db.commit()
    return {"status": "success"}

@app.get("/api/plans/{plan_id}/questions", response_model=list[QuestionResponse])
def get_questions(plan_id: str, db: Session = Depends(get_db)):
    print(f"[DEBUG] /api/plans/{plan_id}/questions called")
    return db.query(Question).filter(Question.exam_plan_id == plan_id).order_by(Question.question_number).all()

@app.get("/api/plans/{plan_id}/progress", response_model=list[ProgressItem])
def get_progress(plan_id: str, db: Session = Depends(get_db)):
    print(f"[DEBUG] /api/plans/{plan_id}/progress called")
    questions = db.query(Question).filter(Question.exam_plan_id == plan_id).order_by(Question.question_number).all()
    attempts = {a.question_id: a for a in db.query(UserAttempt).all()}
    progress = []
    for q in questions:
        status = "gray"
        if q.id in attempts:
            status = "green" if attempts[q.id].is_correct else "red"
        progress.append({"question_id": q.id, "question_number": q.question_number, "status": status})
    return progress

@app.post("/api/evaluate")
async def evaluate_answer(payload: AttemptSubmit, db: Session = Depends(get_db)):
    print(f"[DEBUG] /api/evaluate called: question_id={payload.question_id}, selected_answer={payload.selected_answer}")
    question = db.query(Question).filter(Question.id == payload.question_id).first()
    if not question: raise HTTPException(status_code=404, detail="Question context not found.")
    q_id, q_text, q_options = question.id, question.text, question.options
    db.query(UserAttempt).filter(UserAttempt.question_id == payload.question_id).delete()
    db.commit()

    async def event_generator():
        collected_chunks = []
        async for text_chunk in stream_evaluation(q_text, q_options, payload.selected_answer):
            collected_chunks.append(text_chunk)
            # Send as JSON to protect markdown newlines
            yield f"data: {json.dumps({'text': text_chunk})}\n\n"
            
        full_text = "".join(collected_chunks)
        is_correct = "GRADE: CORRECT" in full_text
        sync_db = next(get_db())
        try:
            print(f"[DEBUG] Saving UserAttempt: question_id={q_id}, is_correct={is_correct}")
            sync_db.add(UserAttempt(question_id=q_id, selected_answer=payload.selected_answer, is_correct=is_correct, explanation=full_text))
            sync_db.commit()
        except: sync_db.rollback()
        finally: sync_db.close()

    return StreamingResponse(event_generator(), media_type="text/event-stream")

# NEW CHAT ENDPOINT
@app.post("/api/chat")
async def ask_followup(payload: ChatSubmit):
    print(f"[DEBUG] /api/chat called: question_text(len)={len(payload.question_text)}, user_message(len)={len(payload.user_message)}")
    async def event_generator():
        async for text_chunk in stream_chat(payload.question_text, payload.ai_explanation, payload.user_message):
            yield f"data: {json.dumps({'text': text_chunk})}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")