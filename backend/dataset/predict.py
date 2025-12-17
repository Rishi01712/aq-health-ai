"""
# predict.py
from dataset.models import predict_full
import json

# [PM1.0, PM2.5, PM10, VOC, NO2, Humidity, Temp]
hardware_input = [45.0, 68.0, 120.0, 560.0, 89.0, 72.0, 31.0]

print("Running prediction...")
result = predict_full(hardware_input)
print(json.dumps(result, indent=2))
"""

# predict.py
from dataset.models import predict_full
import json

# Multiple hardware sensor inputs
# predict.py — REPLACE TEST DATA
hardware_inputs = [
    [8.0,   10.0,  15.0, 150.0, 10.0,  75.0,  38.0],  # Hum=75, Temp=38
    [18.0,  30.0,  45.0, 250.0, 25.0,  80.0,  40.0],
    [25.0,  55.0,  85.0, 400.0, 40.0,  85.0,  42.0],
    [50.0, 110.0, 160.0, 600.0, 60.0,  90.0,  45.0],
    [90.0, 190.0, 250.0, 850.0, 95.0,  95.0,  48.0],
    [140.0,300.0,420.0,1200.0,130.0, 100.0, 50.0]
]

print("Running prediction...")
for idx, data in enumerate(hardware_inputs, 1):
    print(f"\n--- Sensor Reading #{idx} ---")
    result = predict_full(data)
    print(json.dumps(result, indent=2))
