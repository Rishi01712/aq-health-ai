#backend/schemas.py
from pydantic import BaseModel
from typing import Dict, List
from datetime import datetime

class SensorInput(BaseModel):
    pm1: float = 0.0
    pm25: float = 0.0
    pm10: float = 0.0
    voc: float = 0.0
    no2: float = 0.0
    humidity: float = 0.0
    temperature: float = 0.0

class AQIOutput(BaseModel):
    aqi: int
    category: str
    iaqi: str

class DiseaseRisk(BaseModel):
    gas: str
    diseases: List[str]

class HealthEffect(BaseModel):
    effect: str

class ModelPrediction(BaseModel):
    input_sensors: Dict[str, float]
    aqi: int
    predicted_category: str
    iaqi: str
    general_effects: List[str]
    high_risk_gases: Dict[str, List[str]]

class LiveData(BaseModel):
    pm1: float
    pm25: float
    pm10: float
    voc: float
    no2: float
    humidity: float
    temperature: float
    timestamp: datetime
    ai_prediction: ModelPrediction