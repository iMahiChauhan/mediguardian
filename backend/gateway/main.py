from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi import UploadFile, File
import httpx
import os

from shared.models import SymptomRequest, SymptomResponse
from shared.config import get_settings

settings = get_settings()

app = FastAPI(title="MediGuardian API Gateway")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SYMPTOM_SERVICE_URL = settings.symptom_service_url
AUTH_SERVICE_URL = settings.auth_service_url
HISTORY_SERVICE_URL = settings.history_service_url
REPORT_SERVICE_URL = settings.report_service_url
HOSPITAL_SERVICE_URL = settings.hospital_service_url
CHATBOT_SERVICE_URL = settings.chatbot_service_url

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "api-gateway"}

# --- HOSPITAL ROUTES ---
@app.get("/api/hospitals/search")
async def proxy_hospital_search(q: str = ""):
    async with httpx.AsyncClient() as client:
        try:
            res = await client.get(f"{HOSPITAL_SERVICE_URL}/search", params={"q": q})
            res.raise_for_status()
            return res.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Hospital service unavailable")

# --- CHATBOT ROUTES ---
@app.post("/api/chat/message")
async def proxy_chat(request: Request):
    data = await request.json()
    async with httpx.AsyncClient() as client:
        try:
            res = await client.post(f"{CHATBOT_SERVICE_URL}/chat", json=data)
            res.raise_for_status()
            return res.json()
        except httpx.RequestError:
            raise HTTPException(status_code=503, detail="Chat service unavailable")

# --- REPORTS ROUTES ---
@app.post("/api/reports/analyze")
async def proxy_analyze_report(file: UploadFile = File(...)):
    async with httpx.AsyncClient() as client:
        try:
            files = {'file': (file.filename, await file.read(), file.content_type)}
            response = await client.post(
                f"{REPORT_SERVICE_URL}/analyze-report", 
                files=files
            )
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Report service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Error from report service")

# --- SYMPTOM ROUTES ---
@app.post("/api/symptoms", response_model=SymptomResponse)
async def proxy_symptoms(request: SymptomRequest):
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"{SYMPTOM_SERVICE_URL}/analyze", 
                json=request.model_dump()
            )
            response.raise_for_status()
            symptom_data = response.json()

            if request.user_id:
                try:
                    top_condition = symptom_data["conditions"][0] if symptom_data["conditions"] else None
                    if top_condition:
                        await client.post(
                            f"{HISTORY_SERVICE_URL}/history",
                            json={
                                "user_id": int(request.user_id),
                                "symptoms_text": request.text,
                                "top_condition_name": top_condition["name"],
                                "severity": top_condition["severity"],
                                "is_emergency": symptom_data["is_emergency"]
                            }
                        )
                except Exception as e:
                    print(f"Failed to save history: {e}")

            return symptom_data
        except httpx.RequestError as e:
            raise HTTPException(status_code=503, detail=f"Symptom service unavailable: {e}")
        except httpx.HTTPStatusError as e:
            raise HTTPException(status_code=e.response.status_code, detail="Error from symptom service")

# --- AUTH ROUTES ---
@app.post("/api/auth/register")
async def proxy_register(request: Request):
    data = await request.json()
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{AUTH_SERVICE_URL}/register", json=data)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
        return res.json()

@app.post("/api/auth/login")
async def proxy_login(request: Request):
    form_data = await request.form()
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{AUTH_SERVICE_URL}/login", data=form_data)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
        return res.json()

@app.get("/api/auth/me")
async def proxy_me(request: Request):
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(status_code=401, detail="Not authenticated")
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{AUTH_SERVICE_URL}/me", headers={"Authorization": auth_header})
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=res.json().get("detail", "Error"))
        return res.json()

# --- HISTORY ROUTES ---
@app.get("/api/history/{user_id}")
async def proxy_get_history(user_id: int):
    async with httpx.AsyncClient() as client:
        res = await client.get(f"{HISTORY_SERVICE_URL}/history/{user_id}")
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail="Error fetching history")
        return res.json()
