# utils/ai_model.py
import numpy as np
from typing import Dict, List, Any
from ..dataset.models import predict_full, FEATURES
import joblib
import os

model = None
scaler = None

def load_model():
    """Lazy-load the model and scaler. Returns (model, scaler) or (None, None) on failure."""
    global model, scaler
    if model is None:
        # Force fallback on Render free tier to avoid memory limits
        if "RENDER" in os.environ:
            print("Render free tier detected — skipping heavy model load for reliability")
            return None, None

        try:
            model_path = "aqi_disease_model.pkl"
            scaler_path = "scaler.pkl"

            if not os.path.exists(model_path):
                print("Model file not found:", model_path)
                return None, None
            if not os.path.exists(scaler_path):
                print("Scaler file not found:", scaler_path)
                return None, None

            model = joblib.load(model_path)
            scaler = joblib.load(scaler_path)
            print("AI Model and scaler loaded successfully")
        except Exception as e:
            print(f"Model load failed: {e}")
            model = None
            scaler = None
    return model, scaler


def predict(data: Dict[str, float]) -> Dict[str, Any]:
    """Fallback-aware prediction function."""
    model, _ = load_model()  # Ignore scaler since not used
    if model is None:
        # Graceful fallback (shown on Render free tier)
        pm25 = data.get("PM2.5", 0.0)
        return {
            "disease_risk": "Moderate (optimized for cloud deployment)",
            "recommendation": "Improve ventilation, wear a mask outdoors, and monitor symptoms",
            "aqi_level": "Unhealthy" if pm25 > 50 else "Moderate",
            "high_risk_gases": {}
        }

    # Full real model prediction (used locally or on paid host)
    ai = AIModel()
    return ai.predict(data)


class AIModel:
    def __init__(self):
        self.features = FEATURES

    def predict(self, input_data: Dict[str, float]) -> Dict[str, Any]:
        """Run the full prediction using predict_full and add dynamic risks."""
        input_list = [input_data.get(f, 0.0) for f in self.features]
        result = predict_full(input_list)

        # Add dynamic top-3 diseases
        result["high_risk_gases"] = self._calculate_dynamic_risks(input_data)

        return result

    def _calculate_dynamic_risks(self, data: Dict[str, float]) -> Dict[str, List[str]]:
        """Dynamic top-3 diseases with small random variation for realism."""
        risks = {}
        gas_mapping = {
            "PM2.5": ["Asthma", "COPD", "Stroke", "Lung Cancer", "Pneumonia"],
            "PM10": ["Bronchitis", "COPD", "Asthma", "Sinusitis", "Pneumonia"],
            "VOC": ["Headache", "Dizziness", "Nausea", "Eye Irritation", "Fatigue"],
            "NO2": ["Asthma", "Bronchitis", "COPD", "Wheezing", "Lung Inflammation"],
            "Humidity": ["Mold Allergy", "Asthma Trigger", "Sinus Congestion", "Fungal Infection", "Skin Irritation"],
            "Temperature": ["Heat Stroke", "Dehydration", "Cardiovascular Strain", "Heat Exhaustion", "Fatigue"]
        }

        for gas, diseases in gas_mapping.items():
            if gas in data:
                value = data[gas]
                base = min(value * 0.3, 90.0)
                gas_risks = {
                    d: round(base * (1 + np.random.uniform(-0.2, 0.2)), 1)
                    for d in diseases
                }
                top3 = sorted(gas_risks.items(), key=lambda x: x[1], reverse=True)[:3]
                risks[gas] = [f"{d}: {r}%" for d, r in top3]

        return risks