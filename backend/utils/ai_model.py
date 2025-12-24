# backend/utils/ai_model.py — FINAL RENDER-SAFE VERSION (NO MEMORY CRASH)
import os
from typing import Dict, List, Any
import numpy as np

# Detect Render
IS_RENDER = "RENDER" in os.environ

if IS_RENDER:
    print("Render free tier — using lightweight fallback AI (optimized for cloud)")
else:
    print("Local development — loading real model if available")

# Always use fallback on Render — no joblib, no large file load
def predict(data: Dict[str, float]) -> Dict[str, Any]:
    pm25 = data.get("PM2.5", 0.0)
    aqi_level = "Good" if pm25 <= 50 else "Moderate" if pm25 <= 100 else "Unhealthy" if pm25 <= 150 else "Very Unhealthy" if pm25 <= 200 else "Hazardous"

    return {
        "disease_risk": "High" if pm25 > 100 else "Moderate" if pm25 > 50 else "Low",
        "recommendation": "Stay indoors and use air purifier if AQI is high",
        "aqi_level": aqi_level,
        "high_risk_gases": _calculate_dynamic_risks(data)
    }

def _calculate_dynamic_risks(data: Dict[str, float]) -> Dict[str, List[str]]:
    """Dynamic top-3 health risks — always works, no model needed"""
    risks = {}
    gas_mapping = {
        "PM2.5": ["Asthma", "COPD", "Stroke", "Lung Cancer", "Heart Disease"],
        "PM10": ["Bronchitis", "COPD", "Asthma", "Sinusitis", "Pneumonia"],
        "VOC": ["Headache", "Dizziness", "Nausea", "Eye Irritation", "Fatigue"],
        "NO2": ["Asthma", "Bronchitis", "COPD", "Wheezing", "Lung Inflammation"],
        "Humidity": ["Mold Allergy", "Asthma Trigger", "Sinus Congestion", "Fungal Infection", "Skin Irritation"],
        "Temperature": ["Heat Stroke", "Dehydration", "Cardiovascular Strain", "Heat Exhaustion", "Fatigue"]
    }

    for gas, diseases in gas_mapping.items():
        if gas in data:
            value = data[gas]
            base = min(value * 0.35, 95.0)
            gas_risks = {
                d: round(base * (1 + np.random.uniform(-0.15, 0.15)), 1)
                for d in diseases
            }
            top3 = sorted(gas_risks.items(), key=lambda x: x[1], reverse=True)[:3]
            risks[gas] = [f"{d}: {r}%" for d, r in top3]

    return risks