#utils/ai_model.py
import numpy as np
from typing import Dict, List,Any
from ..dataset.models import predict_full, FEATURES
import requests  
import os

MODEL_URL = "https://file.kiwi/d85ff9c6#spKccRM8XcSu47jgyx6vGw"
MODEL_PATH = "aqi_disease_model.pkl"
SCALER_PATH = "scaler.pkl"

model = None
scaler = None

def download_model_if_missing():
    """Download the model from file.kiwi if not present"""
    if not os.path.exists(MODEL_PATH):
        print("Model not found locally — downloading from file.kiwi...")
        try:
            response = requests.get(MODEL_URL, stream=True)
            response.raise_for_status()
            with open(MODEL_PATH, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
            print("Model successfully downloaded from file.kiwi")
        except Exception as e:
            print(f"Download failed: {e}")
            return False
    return True

def load_model():
    global model, scaler
    if model is None:
        # Download model if missing (only once on startup)
        if not download_model_if_missing():
            print("Using fallback AI — model unavailable")
            return None, None

        try:
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            print("Real AI model loaded successfully from downloaded file")
        except Exception as e:
            print(f"Model load failed: {e}")
            model = None
            scaler = None
    return model, scaler


class AIModel:
    def __init__(self):
        self.features = FEATURES

    def predict(self, input_data: Dict[str, float]) -> Dict[str, Any]:
        """Run your predict_full model."""
        input_list = [input_data.get(f, 0.0) for f in self.features]
        result = predict_full(input_list)

        # Add dynamic top-3 diseases
        result["high_risk_gases"] = self._calculate_dynamic_risks(input_data)

        return result

    def _calculate_dynamic_risks(self, data: Dict[str, float]) -> Dict[str, List[str]]:
        """Dynamic top-3 diseases with random variation."""
        risks = {}
        for gas in ["PM2.5", "PM10", "VOC", "NO2", "Humidity", "Temperature"]:
            if gas in data:
                base = self._base_risk(data[gas])
                diseases = self._get_diseases(gas)
                gas_risks = {
                    d: round(base * (1 + np.random.uniform(-0.2, 0.2)), 1)
                    for d in diseases
                }
                top3 = sorted(gas_risks.items(), key=lambda x: x[1], reverse=True)[:3]
                risks[gas] = [f"{d}: {r}%" for d, r in top3]

        return risks

    def _base_risk(self, value: float) -> float:
        return min(value * 0.3, 90.0)

    def _get_diseases(self, gas: str) -> List[str]:
        diseases = {
            "PM2.5": ["Asthma", "COPD", "Stroke", "Lung Cancer", "Pneumonia"],
            "PM10": ["Bronchitis", "COPD", "Asthma", "Sinusitis", "Pneumonia"],
            "VOC": ["Headache", "Dizziness", "Nausea", "Eye Irritation", "Fatigue"],
            "NO2": ["Asthma", "Bronchitis", "COPD", "Wheezing", "Lung Inflammation"],
            "Humidity": ["Mold Allergy", "Asthma Trigger", "Sinus Congestion", "Fungal Infection", "Skin Irritation"],
            "Temperature": ["Heat Stroke", "Dehydration", "Cardiovascular Strain", "Heat Exhaustion", "Fatigue"]
        }
        return diseases.get(gas, ["Unknown"])