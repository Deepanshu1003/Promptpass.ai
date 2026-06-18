import os
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://app_user:app_secure_password@localhost:5432/practice_session_db"
)

print(f"[DB INIT] Initializing database engine with URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    print("[DB SESSION] Opening new database connection...")
    db = SessionLocal()
    try:
        yield db
    finally:
        print("[DB SESSION] Closing database connection...")
        db.close()