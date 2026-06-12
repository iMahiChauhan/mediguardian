from fastapi import FastAPI, UploadFile, File, HTTPException
import io
from PyPDF2 import PdfReader
import re

app = FastAPI(title="Medical Reports Service")

@app.post("/analyze-report")
async def analyze_report(file: UploadFile = File(...)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"
        
        # Mock NLP Extraction
        results = []
        text_lower = text.lower()
        
        # Look for cholesterol
        if "cholesterol" in text_lower:
            match = re.search(r"cholesterol.*?(\d{3})", text_lower)
            val = int(match.group(1)) if match else 210
            is_high = val > 200
            results.append({
                "metric": "Total Cholesterol",
                "value": f"{val} mg/dL",
                "status": "HIGH" if is_high else "NORMAL",
                "recommendation": "Consult cardiologist regarding diet modifications." if is_high else "Continue healthy lifestyle."
            })
            
        # Look for blood pressure
        if "blood pressure" in text_lower or "bp" in text_lower:
            results.append({
                "metric": "Blood Pressure",
                "value": "135/85 mmHg",
                "status": "ELEVATED",
                "recommendation": "Monitor blood pressure regularly. Reduce sodium intake."
            })
            
        # Look for glucose
        if "glucose" in text_lower or "sugar" in text_lower:
            results.append({
                "metric": "Fasting Glucose",
                "value": "95 mg/dL",
                "status": "NORMAL",
                "recommendation": "Levels are within normal range."
            })
            
        if not results:
            results.append({
                "metric": "General Health",
                "value": "N/A",
                "status": "UNKNOWN",
                "recommendation": "Could not extract specific metrics from this report format."
            })
            
        return {
            "filename": file.filename,
            "extracted_metrics": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process PDF: {str(e)}")
