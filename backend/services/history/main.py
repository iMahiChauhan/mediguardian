from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from shared.database import get_db, SymptomHistory
from shared.schemas import HistoryCreate, HistoryResponse

app = FastAPI(title="History Service")

@app.post("/history", response_model=HistoryResponse)
def create_history_record(record: HistoryCreate, db: Session = Depends(get_db)):
    db_record = SymptomHistory(
        user_id=record.user_id,
        symptoms_text=record.symptoms_text,
        top_condition_name=record.top_condition_name,
        severity=record.severity,
        is_emergency=record.is_emergency
    )
    db.add(db_record)
    db.commit()
    db.refresh(db_record)
    return db_record

@app.get("/history/{user_id}", response_model=List[HistoryResponse])
def get_user_history(user_id: int, db: Session = Depends(get_db)):
    records = db.query(SymptomHistory).filter(SymptomHistory.user_id == user_id).order_by(SymptomHistory.created_at.desc()).all()
    return records
