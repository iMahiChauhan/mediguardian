from fastapi import FastAPI
from pydantic import BaseModel
from typing import Optional
from deep_translator import GoogleTranslator

app = FastAPI(title="Multilingual Medical Chatbot Service")

class ChatRequest(BaseModel):
    user_id: Optional[int] = None
    message: str
    language: str = "en"  # e.g., "hi", "bn", "te", "ta", "mr", "ur", "es", "fr"

class ChatResponse(BaseModel):
    reply: str
    intent: str

def process_english(msg: str) -> tuple[str, str]:
    msg = msg.lower()
    if "ibuprofen" in msg or "medicine" in msg or "dose" in msg or "tylenol" in msg:
        return "Ibuprofen is a nonsteroidal anti-inflammatory drug (NSAID) used to relieve pain, reduce inflammation, and lower fever. Always follow the dosage on the package and consult a doctor if pain persists.", "medicine_query"
    elif "headache" in msg or "migraine" in msg:
        return "Headaches can be caused by stress, dehydration, lack of sleep, or screen time. If it is severe, sudden, or accompanied by vision changes, seek immediate medical attention.", "symptom_query"
    elif "fever" in msg or "hot" in msg:
        return "A fever is usually a sign that your body is fighting an infection. Drink plenty of fluids, rest, and take fever-reducing medication if needed. If it exceeds 103°F (39.4°C), see a doctor.", "symptom_query"
    elif "hello" in msg or "hi" in msg or "greetings" in msg:
        return "Hello! I am your MediGuardian AI assistant. You can ask me about symptoms, medical conditions, or medications.", "greeting"
    else:
        return "I'm a medical AI assistant. While I can't diagnose you, I can provide general medical information about symptoms and medications. Could you provide more details?", "general"

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(request: ChatRequest):
    # 1. Translate user message to English
    try:
        translator_to_en = GoogleTranslator(source='auto', target='en')
        english_msg = translator_to_en.translate(request.message)
    except Exception:
        english_msg = request.message # fallback if network fails
        
    # 2. Process in English
    reply_en, intent = process_english(english_msg)
    
    # Personalization mock
    if request.user_id and intent == "greeting":
        reply_en = "Welcome back! " + reply_en

    # 3. Translate reply back to user's requested language
    if request.language != "en":
        try:
            translator_to_target = GoogleTranslator(source='en', target=request.language)
            final_reply = translator_to_target.translate(reply_en)
        except Exception:
            final_reply = reply_en # fallback
    else:
        final_reply = reply_en

    return {"reply": final_reply, "intent": intent}
