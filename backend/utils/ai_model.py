#utils/ai_model.py
import numpy as np
from typing import Dict, List
from ..dataset.models import predict_full, FEATURES

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