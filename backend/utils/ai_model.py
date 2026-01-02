# backend/utils/ai_model.py — FULL REAL ML MODEL ONLY (no fallback)
import os
import joblib
import hashlib
import numpy as np
from typing import Dict, List, Any

# ==================== REASSEMBLE MODEL FROM PARTS (ONCE) ====================
MODEL_PATH = "aqi_disease_model.pkl"
SCALER_PATH = "scaler.pkl"
PARTS_DIR = "../models"  # Folder with aqi_disease_model_part_*.bin

# Reassemble if model not present (happens once on startup)
if not os.path.exists(MODEL_PATH):
    print("Reassembling full ML model from split parts...")
    parts = sorted(
        [f for f in os.listdir(PARTS_DIR) if f.startswith("aqi_disease_model_part_") and f.endswith(".bin")]
    )
    if not parts:
        raise FileNotFoundError("No model parts found in models/ folder!")
    
    reassembled = b""
    for part in parts:
        part_path = os.path.join(PARTS_DIR, part)
        with open(part_path, "rb") as f:
            reassembled += f.read()
        print(f"Loaded {part} ({os.path.getsize(part_path) / (1024*1024):.2f} MB)")
    
    with open(MODEL_PATH, "wb") as f:
        f.write(reassembled)
    print(f"Model successfully reassembled → {MODEL_PATH} ({len(reassembled)/(1024*1024):.2f} MB)")

# Load the real model and scaler
print("Loading real ML model and scaler...")
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
print("REAL ML MODEL & SCALER LOADED SUCCESSFULLY")

# Import FEATURES from your actual model file
from ..dataset.models import FEATURES, predict_full

# ==================== DYNAMIC HIGH RISKS (same as before) ====================
def _calculate_dynamic_risks(data: Dict[str, float]) -> Dict[str, List[str]]:
    """Top-3 risks with deterministic variation — stable for same input"""
    risks = {}
    diseases = {
        "PM2.5": [
            "Lung Cancer", "Stroke", "COPD", "Heart Disease", "Asthma",
            "Irregular Heartbeat", "Decreased Lung Function", "Childhood Leukemia"
        ],
        "PM10": [
            "Pneumonia", "Bronchitis", "COPD", "Asthma", "Sinusitis",
            "Heart Attacks", "Decreased Lung Function", "Coronary Artery Disease"
        ],
        "VOC": [
            "Cancer", "Leukemia", "Liver Damage", "Kidney Damage", "Central Nervous System Damage",
            "Headache", "Nausea", "Eye Irritation", "Fatigue", "Throat Irritation"
        ],
        "NO2": [
            "COPD", "Asthma", "Bronchitis", "Wheezing", "Lung Inflammation",
            "Respiratory Infections", "Obstructive Lung Disease", "Cardiopulmonary Effects", "Lung Irritation"
        ],
        "Humidity": [
            "Fungal Infection", "Mold Allergy", "Asthma", "Respiratory Infections", "Skin Irritation",
            "Sinus Congestion", "Heat Exhaustion", "Dehydration"
        ],
        "Temperature": [
            "Heat Stroke", "Heart Attacks", "Cardiovascular Disease", "Hyperthermia", "Heat Exhaustion",
            "Heat Cramps", "Aggravated Asthma", "Decreased Lung Function"
        ]
    }

    thresholds = {
        "PM2.5": 45, "PM10": 65, "NO2": 25, "VOC": 150, "Humidity": 78, "Temperature": 35
    }

    for gas, disease_list in diseases.items():
        value = data.get(gas, 0.0)
        threshold = thresholds.get(gas, 50)

        if value > threshold:
            excess_ratio = (value - threshold) / threshold
            base_risk = min(30 + excess_ratio * 65, 90.0)

            seed = int(hashlib.md5(f"{gas}_{value:.1f}".encode()).hexdigest(), 16)
            rng = np.random.default_rng(seed)

            gas_risks = {}
            for i, disease in enumerate(disease_list):
                priority_mult = 1.0 - (i * 0.03)
                variation = rng.uniform(-0.1, 0.1)
                score = round(base_risk * priority_mult * (1 + variation), 1)
                score = min(max(score, 10.0), 90.0)
                gas_risks[disease] = score

            top3 = sorted(gas_risks.items(), key=lambda x: x[1], reverse=True)[:3]
            risks[gas] = [f"{disease}: {score}%" for disease, score in top3]

    return risks

# ==================== MAIN PREDICTION FUNCTION ====================
def predict(data: Dict[str, float]) -> Dict[str, Any]:
    """
    Uses your real trained ML model + dynamic high risks
    """
    # Prepare input in correct feature order
    input_list = [data.get(f, 0.0) for f in FEATURES]
    
    # Get full prediction from your real model
    result = predict_full(input_list)
    
    # Add dynamic high-risk diseases
    result["high_risks"] = _calculate_dynamic_risks(data)
    
    return result