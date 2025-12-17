# backend/dataset/data_generation.py
from __future__ import annotations

import os
import pandas as pd
import numpy as np
from numpy.typing import NDArray
from scipy.stats import lognorm, beta, norm
from typing import Dict

from .models import (
    iaqi_calc,
    get_aqi_category,
    get_general_effects,
    predict_disease_risk,
    THRESHOLDS,
    GAS_DISEASES
)

DEFAULT_N_SAMPLES: int = 50_000
DEFAULT_OUTPUT_FILE: str = "air_quality_disease_dataset_50k.csv"

def generate_data(n_samples: int = DEFAULT_N_SAMPLES, output_file: str | None = None) -> pd.DataFrame:
    print(f"Generating {n_samples:,} samples...")

    np.random.seed(42)

    pm1 = np.clip(lognorm(s=0.9, scale=10).rvs(n_samples), 0, 300)
    pm25 = np.clip(lognorm(s=0.8, scale=20).rvs(n_samples), 0, 500)
    pm10 = np.clip(lognorm(s=0.7, scale=40).rvs(n_samples), 0, 1000)
    voc = np.random.uniform(0, 1000, n_samples)
    no2 = np.clip(lognorm(s=0.5, scale=30).rvs(n_samples), 0, 200)
    humidity = np.clip(beta(a=2, b=3).rvs(n_samples) * 100, 0, 100)
    temp = np.clip(norm(loc=20, scale=10).rvs(n_samples), -10, 50)

    iaqi_pm25 = np.array([iaqi_calc(p, "PM2.5") for p in pm25])
    iaqi_pm10 = np.array([iaqi_calc(p, "PM10") for p in pm10])
    iaqi_no2 = np.array([iaqi_calc(n, "NO2") for n in no2])

    aqi = np.maximum.reduce([iaqi_pm25, iaqi_pm10, iaqi_no2])
    category = np.array([get_aqi_category(a) for a in aqi])
    general_effects = [get_general_effects(c)[0] for c in category]

    disease_risks: Dict[str, NDArray] = {}
    for gas in THRESHOLDS:
        if gas not in ['PM1.0', 'PM2.5', 'PM10', 'VOC', 'NO2', 'Humidity', 'Temperature']:
            continue
        threshold = THRESHOLDS[gas]
        values = {
            'PM1.0': pm1, 'PM2.5': pm25, 'PM10': pm10,
            'VOC': voc, 'NO2': no2, 'Humidity': humidity, 'Temperature': temp
        }[gas]
        risks = np.array([predict_disease_risk(v, threshold) for v in values])
        diseases = GAS_DISEASES.get(gas, [])
        
        if diseases:
            risk_per_disease = risks / len(diseases)
            for disease in enumerate(diseases):
                disease_risks[f"{gas}_{disease}"] = risk_per_disease

    df = pd.DataFrame({
        "PM1.0": pm1,
        "PM2.5": pm25,
        "PM10": pm10,
        "VOC": voc,
        "NO2": no2,
        "Humidity": humidity,
        "Temperature": temp,
        "AQI": aqi,
        "AQI_Category": category,
        "General_Effects": general_effects,
        "IAQI_PM25": iaqi_pm25,
        "IAQI_PM10": iaqi_pm10,
        "IAQI_NO2": iaqi_no2,
    })

    for col, values in disease_risks.items():
        df[col] = values

    df = df.drop_duplicates().reset_index(drop=True)

    # FIXED: Check for None explicitly
    if output_file is not None:
        output_path = os.path.join(os.path.dirname(__file__), output_file)
        df.to_csv(output_path, index=False)
        print(f"Saved {len(df):,} samples → {output_file}")

    return df

if __name__ == "__main__":
    generate_data(n_samples=DEFAULT_N_SAMPLES, output_file=DEFAULT_OUTPUT_FILE)