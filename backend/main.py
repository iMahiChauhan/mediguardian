from fastapi import FastAPI, HTTPException, Request, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from shared.config import get_settings
from shared.database import get_db
from shared.models import SymptomRequest, SymptomResponse
from shared.schemas import HistoryCreate, UserCreate

from services.auth.main import get_current_user, login, register
from services.symptom.main import analyze_symptoms
from services.history.main import create_history_record, get_user_history
from services.report.main import analyze_report
from services.chatbot.main import chat_endpoint, ChatRequest
from services.hospital.main import search_hospitals

settings = get_settings()

app = FastAPI(
    title="MediGuardian API",
    description="Unified API for Vercel + Render deployment",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "mediguardian-api",
        "environment": settings.environment,
    }


@app.get("/api/hospitals/search")
def api_hospital_search(q: str = ""):
    return search_hospitals(q)


@app.post("/api/chat/message")
def api_chat(request: ChatRequest):
    return chat_endpoint(request)


@app.post("/api/reports/analyze")
async def api_analyze_report(file: UploadFile = File(...)):
    return await analyze_report(file)


@app.post("/api/symptoms", response_model=SymptomResponse)
def api_symptoms(request: SymptomRequest, db: Session = Depends(get_db)):
    symptom_data = analyze_symptoms(request)

    if request.user_id and symptom_data.conditions:
        try:
            top_condition = symptom_data.conditions[0]
            create_history_record(
                HistoryCreate(
                    user_id=int(request.user_id),
                    symptoms_text=request.text,
                    top_condition_name=top_condition.name,
                    severity=top_condition.severity.value,
                    is_emergency=symptom_data.is_emergency,
                ),
                db,
            )
        except Exception as exc:
            print(f"Failed to save history: {exc}")

    return symptom_data


@app.post("/api/auth/register")
def api_register(user: UserCreate, db: Session = Depends(get_db)):
    return register(user, db)


@app.post("/api/auth/login")
def api_login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    return login(form_data, db)


@app.get("/api/auth/me")
def api_me(current_user=Depends(get_current_user)):
    return current_user


@app.get("/api/history/{user_id}")
def api_get_history(user_id: int, db: Session = Depends(get_db)):
    return get_user_history(user_id, db)
