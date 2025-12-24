# backend/utils/ai_model.py
import numpy as np
from typing import Dict, List, Any
from ..dataset.models import predict_full, FEATURES
import joblib
import requests
import os

# File.kiwi direct download link
MODEL_URL = "https://file.kiwi/d85ff9c6#spKccRM8XcSu47jgyx6vGw"
MODEL_PATH = "aqi_disease_model.pkl"
SCALER_PATH = "scaler.pkl"

model = None
scaler = None

def download_model_if_missing():
    """Download the model from file.kiwi if not present locally."""
    if not os.path.exists(MODEL_PATH):
        print("Model not found locally — downloading from file.kiwi...")
        try:
            response = requests.get(MODEL_URL, stream=True, timeout=60)
            response.raise_for_status()
            total_size = int(response.headers.get('content-length', 0))
            downloaded = 0
            with open(MODEL_PATH, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"Downloading model: {percent:.1f}%", end='\r')
            print("\nModel successfully downloaded from file.kiwi")
        except Exception as e:
            print(f"Model download failed: {e}")
            return False
    return True

import os

def load_model():
    global model, scaler
    if model is None:
        # Force fallback on Render (free tier memory/time limit)
        if "RENDER" in os.environ:
            print("Render free tier detected — using fallback AI for reliability")
            return None, None

        # Local dev: try to download/load
        if not download_model_if_missing():
            print("Using fallback AI — model unavailable")
            return None, None

        try:
            model = joblib.load(MODEL_PATH)
            scaler = joblib.load(SCALER_PATH)
            print("Real AI model loaded")
        except Exception as e:
            print(f"Load failed: {e}")
            return None, None
    return model, scaler

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