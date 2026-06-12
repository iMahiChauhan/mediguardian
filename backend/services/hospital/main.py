from fastapi import FastAPI, HTTPException
from typing import List
from pydantic import BaseModel

app = FastAPI(title="Hospital Finder Service")

class Hospital(BaseModel):
    id: int
    name: string = ""
    address: string = ""
    distance_miles: float
    specialties: List[str]
    has_emergency_room: bool

class HospitalSearchResponse(BaseModel):
    query: string = ""
    hospitals: List[Hospital]

MOCK_HOSPITALS = [
    {"id": 1, "name": "Mercy General Hospital", "address": "123 Health Ave, City Center", "distance_miles": 1.2, "specialties": ["Cardiology", "Neurology", "General"], "has_emergency_room": True},
    {"id": 2, "name": "Sunrise Medical Clinic", "address": "450 West Side Blvd", "distance_miles": 3.5, "specialties": ["Pediatrics", "Family Medicine"], "has_emergency_room": False},
    {"id": 3, "name": "City Care Emergency Hub", "address": "99 First Responder Way", "distance_miles": 5.0, "specialties": ["Trauma", "Surgery", "Orthopedics"], "has_emergency_room": True},
    {"id": 4, "name": "Valley View Specialty Center", "address": "880 Mountain Rd", "distance_miles": 8.1, "specialties": ["Oncology", "Radiology"], "has_emergency_room": False},
]

@app.get("/search", response_model=HospitalSearchResponse)
def search_hospitals(q: str = ""):
    # In a real app, this would use a Geo-spatial database or Google Maps API
    # Here we mock it by returning the mock list, maybe filtering if `q` matches
    query = q.lower()
    
    results = []
    for h in MOCK_HOSPITALS:
        if query in h["name"].lower() or query in h["address"].lower() or any(query in spec.lower() for spec in h["specialties"]):
            results.append(h)
            
    # If no specific match, just return all as "nearby"
    if not results and query:
        results = MOCK_HOSPITALS
        
    # Sort by distance
    results.sort(key=lambda x: x["distance_miles"])
    
    return {"query": q, "hospitals": results}
