import uuid
from sqlalchemy import Column, String, Integer, Boolean, ForeignKey, Text, JSON, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from .database import Base

print("[MODELS INIT] Registering SQLAlchemy schemas...")

class ExamPlan(Base):
    __tablename__ = "exam_plans"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f"[DB MODEL] Creating new ExamPlan memory object: {self.title}")

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    exam_plan_id = Column(UUID(as_uuid=True), ForeignKey("exam_plans.id", ondelete="CASCADE"))
    question_number = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    options = Column(JSON, nullable=False)  # Stores {"A": "Choice A", "B": "Choice B"...}

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f"[DB MODEL] Creating new Question memory object: #{self.question_number}")

class UserAttempt(Base):
    __tablename__ = "user_attempts"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    question_id = Column(UUID(as_uuid=True), ForeignKey("questions.id", ondelete="CASCADE"), unique=True)
    selected_answer = Column(String, nullable=False)
    is_correct = Column(Boolean, nullable=False)
    explanation = Column(Text, nullable=False)
    attempted_at = Column(DateTime(timezone=True), server_default=func.now())

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        print(f"[DB MODEL] Creating new UserAttempt memory object for Q-ID: {self.question_id}")