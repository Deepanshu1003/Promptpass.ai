from pydantic import BaseModel
from typing import Dict, Optional, List
from uuid import UUID
from datetime import datetime

print("[SCHEMAS INIT] Loading API validation schemas...")

class QuestionResponse(BaseModel):
    id: UUID
    exam_plan_id: UUID
    question_number: int
    text: str
    options: Dict[str, str]
    
    class Config:
        from_attributes = True

    def __init__(self, **data):
        super().__init__(**data)
        print(f"[API DATA] Formatting QuestionResponse for frontend: Q#{self.question_number}")

class AttemptSubmit(BaseModel):
    question_id: UUID
    selected_answer: str

    def __init__(self, **data):
        super().__init__(**data)
        print(f"[API DATA] Received AttemptSubmit from frontend -> Q-ID: {self.question_id} | Answer: {self.selected_answer}")

class AttemptResponse(BaseModel):
    id: UUID
    question_id: UUID
    selected_answer: str
    is_correct: bool
    explanation: str
    
    class Config:
        from_attributes = True

class ProgressItem(BaseModel):
    question_id: UUID
    question_number: int
    status: str # "gray", "green", "red"
    
    # We will skip putting a print statement here, because when your React app loads,
    # it requests the progress for ALL questions at once. If you have 600 questions,
    # this would flood your terminal with 600 print lines instantly!

class ExamPlanResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class ChatSubmit(BaseModel):
    question_text: str
    ai_explanation: str
    user_message: str