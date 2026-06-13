from fastapi import FastAPI, HTTPException
from shared.models import SymptomRequest, SymptomResponse, Condition, SeverityLevel

app = FastAPI(title="Symptom Service")

@app.get("/health")
def health_check():
    return {"status": "ok", "service": "symptom-service"}

def analyze_symptoms(request: SymptomRequest) -> SymptomResponse:
    text = request.text.lower()
    
    # Emergency rule check
    emergency_keywords = ["chest pain", "can't breathe", "crushing", "radiating arm"]
    if any(keyword in text for keyword in emergency_keywords):
        return SymptomResponse(
            conditions=[
                Condition(
                    name="Myocardial Infarction / Severe Respiratory Distress",
                    confidence=0.95,
                    severity=SeverityLevel.EMERGENCY,
                    recommended_specialist="Emergency Medicine"
                )
            ],
            is_emergency=True,
            emergency_message="Seek emergency medical attention immediately. Call 112 or your local emergency number."
        )

    # Basic mock rules for demonstration
    conditions = []
    
    if "fever" in text or "headache" in text:
        conditions.append(
            Condition(
                name="Viral Infection",
                confidence=0.85,
                severity=SeverityLevel.MEDIUM,
                recommended_specialist="General Physician"
            )
        )
    
    if "cough" in text:
        conditions.append(
            Condition(
                name="Upper Respiratory Tract Infection",
                confidence=0.75,
                severity=SeverityLevel.LOW,
                recommended_specialist="Pulmonologist or General Physician"
            )
        )

    if not conditions:
        conditions.append(
            Condition(
                name="Unknown Condition",
                confidence=0.0,
                severity=SeverityLevel.LOW,
                recommended_specialist="General Physician"
            )
        )
        
    return SymptomResponse(
        conditions=conditions,
        is_emergency=False
    )


@app.post("/analyze", response_model=SymptomResponse)
def analyze_symptoms_endpoint(request: SymptomRequest):
    return analyze_symptoms(request)
