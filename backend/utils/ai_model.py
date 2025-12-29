# backend/utils/ai_model.py — HYBRID: Full ML local, fallback cloud
import os
from typing import Dict, List, Any

# Detect Render (free tier)
IS_RENDER = "RENDER" in os.environ

if IS_RENDER:
    print("Render free tier — using optimized fallback AI")
    model = None
else:
    # Local only — load real model
    try:
        import joblib
        model = joblib.load("aqi_disease_model.pkl")
        scaler = joblib.load("scaler.pkl")
        print("Real ML model loaded (local)")
    except Exception as e:
        print(f"Model load failed locally: {e}")
        model = None

def predict(data: Dict[str, float]) -> Dict[str, Any]:
    if model is not None:
        # Real ML prediction (local only)
        from ..dataset.models import predict_full, FEATURES
        input_list = [data.get(f, 0.0) for f in FEATURES]
        result = predict_full(input_list)
        result["high_risks"] = _calculate_dynamic_risks(data)
        return result

    # Fallback AI (Render + local if model missing)
    pm25 = data.get("PM2.5", 0.0)
    pm10 = data.get("PM10", 0.0)
    no2 = data.get("NO2", 0.0)

    # Accurate Indian CPCB AQI
    def sub_aqi(value, breaks):
        for low, high, i_low, i_high in breaks:
            if low <= value <= high:
                return int(i_low + (i_high - i_low) * (value - low) / (high - low))
        return 500

    breaks = {
        "PM2.5": [(0, 30, 0, 50), (31, 60, 51, 100), (61, 90, 101, 200), (91, 120, 201, 300), (121, 250, 301, 400), (251, 9999, 401, 500)],
        "PM10":  [(0, 50, 0, 50), (51, 100, 51, 100), (101, 250, 101, 200), (251, 350, 201, 300), (351, 430, 301, 400), (431, 9999, 401, 500)],
        "NO2":   [(0, 40, 0, 50), (41, 80, 51, 100), (81, 180, 101, 200), (181, 280, 201, 300), (281, 400, 301, 400), (401, 9999, 401, 500)],
    }

    iaqi_pm25 = sub_aqi(pm25, breaks["PM2.5"])
    iaqi_pm10 = sub_aqi(pm10, breaks["PM10"])
    iaqi_no2 = sub_aqi(no2, breaks["NO2"])
    aqi = max(iaqi_pm25, iaqi_pm10, iaqi_no2)

    category = "Good" if aqi <= 50 else "Satisfactory" if aqi <= 100 else "Moderate" if aqi <= 200 else "Poor" if aqi <= 300 else "Very Poor" if aqi <= 400 else "Severe"

    general_effects = {
        "Good": ["Air quality is satisfactory."],
        "Satisfactory": ["Minor breathing discomfort to sensitive people."],
        "Moderate": ["Breathing discomfort to people with lung/heart disease."],
        "Poor": ["Breathing discomfort to most people on prolonged exposure."],
        "Very Poor": ["Respiratory illness on prolonged exposure."],
        "Severe": ["Affects healthy people and seriously impacts those with existing diseases."]
    }[category]

    return {
        "aqi": aqi,
        "predicted_category": category,
        "iaqi": f"PM2.5={iaqi_pm25}, PM10={iaqi_pm10}, NO2={iaqi_no2}",
        "general_effects": general_effects,
        "high_risks": _calculate_dynamic_risks(data)
    }

from typing import Dict, List

def _calculate_dynamic_risks(data: Dict[str, float]) -> Dict[str, List[str]]:
    """Calculate top-3 health risks per pollutant with realistic percentages (no random jitter for same input)."""
    
    risks = {}
    diseases = {
        "PM2.5": [
            "Asthma", "COPD", "Stroke", "Lung Cancer", "Heart Disease", "Irregular Heartbeat", "Decreased Lung Function", "Childhood Leukemia"
        ],
        "PM10": [
            "Asthma", "COPD", "Bronchitis", "Sinusitis", "Pneumonia",
            "Heart Attacks", "Decreased Lung Function", "Coronary Artery Disease"
        ],
        "VOC": [
            "Eye Irritation", "Fatigue", "Throat Irritation", "Headache", "Nausea",
            "Liver Damage", "Kidney Damage", "Central Nervous System Damage", "Leukemia", "Cancer"
        ],
        "NO2": [
            "Asthma", "COPD", "Bronchitis", "Wheezing", "Lung Inflammation",
            "Respiratory Infections", "Obstructive Lung Disease", "Cardiopulmonary Effects", "Lung Irritation"
        ],
        "Humidity": [
            "Asthma", "Mold Allergy", "Fungal Infection", "Skin Irritation", "Respiratory Infections",
            "Heat Exhaustion", "Sinus Congestion", "Dehydration"
        ],
        "Temperature": [
            "Heat Stroke", "Heat Cramps", "Heat Rash", "Hyperthermia",
            "Heart Attacks", "Aggravated Asthma", "Decreased Lung Function", "Cardiovascular Disease"
        ]
    }

    # Thresholds above which risk increases (based on WHO/CPCB guidelines)
    thresholds = {
        "PM2.5": 25, 
        "PM10": 45,      
        "NO2": 25,     
        "VOC": 300,      
        "Humidity": 60,  
        "Temperature": 32 
    }

    for gas, disease_list in diseases.items():
        value = data.get(gas, 0.0)
        threshold = thresholds.get(gas, 50)

        if value > threshold:
            excess_ratio = (value - threshold) / threshold
            base_risk = min(40 + excess_ratio * 55, 95.0)
            gas_risks = {}
            for i, disease in enumerate(disease_list):
                multiplier = 1.0 - (i * 0.04) 
                risk_score = round(base_risk * multiplier, 1)
                gas_risks[disease] = risk_score

            # Get top 3 (or all if less than 3)
            sorted_risks = sorted(gas_risks.items(), key=lambda x: x[1], reverse=True)
            top3 = sorted_risks[:3] if len(sorted_risks) >= 3 else sorted_risks
            risks[gas] = [f"{disease}: {score}%" for disease, score in top3]

    return risks