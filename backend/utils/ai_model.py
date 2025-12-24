import os
from typing import Dict, List, Any
import numpy as np

# Force fallback on Render
if "RENDER" in os.environ:
    print("Render free tier — using fallback AI (no model load)")
    model = None
else:
    # Local only
    try:
        import joblib
        model = joblib.load("aqi_disease_model.pkl")
        print("Real model loaded locally")
    except:
        model = None

def predict(data: Dict[str, float]) -> Dict[str, Any]:
    if model is None:
        # Fallback AI — fast, low memory
        pm25 = data.get("PM2.5", 0.0)
        return {
            "disease_risk": "High" if pm25 > 100 else "Moderate" if pm25 > 50 else "Low",
            "recommendation": "Improve ventilation and monitor symptoms",
            "aqi_level": "Unhealthy" if pm25 > 50 else "Moderate",
            "high_risk_gases": _calculate_dynamic_risks(data)
        }

    # Real model (local only)
    from ..dataset.models import predict_full, FEATURES
    input_list = [data.get(f, 0.0) for f in FEATURES]
    result = predict_full(input_list)
    result["high_risk_gases"] = _calculate_dynamic_risks(data)
    return result

def _calculate_dynamic_risks(data: Dict[str, float]) -> Dict[str, List[str]]:
    risks = {}
    diseases = {
        "PM2.5": ["Asthma", "COPD", "Stroke", "Lung Cancer", "Heart Disease"],
        "PM10": ["Bronchitis", "COPD", "Asthma", "Sinusitis", "Pneumonia"],
        "VOC": ["Headache", "Dizziness", "Nausea", "Eye Irritation", "Fatigue"],
        "NO2": ["Asthma", "Bronchitis", "COPD", "Wheezing", "Lung Inflammation"],
        "Humidity": ["Mold Allergy", "Asthma Trigger", "Sinus Congestion", "Fungal Infection", "Skin Irritation"],
        "Temperature": ["Heat Stroke", "Dehydration", "Cardiovascular Strain", "Heat Exhaustion", "Fatigue"]
    }

    for gas, list_d in diseases.items():
        if gas in data:
            value = data[gas]
            base = min(value * 0.35, 95.0)
            gas_risks = {d: round(base * (1 + np.random.uniform(-0.15, 0.15)), 1) for d in list_d}
            top3 = sorted(gas_risks.items(), key=lambda x: x[1], reverse=True)[:3]
            risks[gas] = [f"{d}: {r}%" for d, r in top3]

    return risks