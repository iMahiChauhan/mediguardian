from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"

class SymptomRequest(BaseModel):
    user_id: Optional[str] = None
    text: str = Field(..., description="Natural language description of symptoms")
    age: Optional[int] = None
    gender: Optional[str] = None

class Condition(BaseModel):
    name: str
    confidence: float
    severity: SeverityLevel
    recommended_specialist: str

class SymptomResponse(BaseModel):
    conditions: List[Condition]
    is_emergency: bool
    emergency_message: Optional[str] = None
