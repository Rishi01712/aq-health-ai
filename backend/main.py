# backend/main.py — FINAL WORKING VERSION (RENDER + LIVE UPDATES)
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db as admin_db
import asyncio
import os
import json

# ==================== FIREBASE INITIALIZATION — RENDER SAFE ====================
db = None
firebase_initialized = False

try:
    if firebase_admin._apps:
        # Already initialized
        default_app = firebase_admin.get_app()
    else:
        # Try environment variable first (Render)
        service_account_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT")
        if service_account_str:
            service_account_info = json.loads(service_account_str)
            cred = credentials.Certificate(service_account_info)
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://aq-health-ai-default-rtdb.asia-southeast1.firebasedatabase.app'
            })
            print("Firebase Admin initialized from environment variable (Render)")
        else:
            # Fallback to local file (for local development)
            cred = credentials.Certificate("firebase-service-account.json")
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://aq-health-ai-default-rtdb.asia-southeast1.firebasedatabase.app'
            })
            print("Firebase Admin initialized from local file")

    db = admin_db
    firebase_initialized = True
except Exception as e:
    print(f"Firebase Admin failed to initialize: {e}")
    firebase_initialized = False

app = FastAPI(title="AQ-HEALTH AI")

# ==================== CORS ====================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aq-health-ai-frontend.onrender.com",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SensorInput(BaseModel):
    PM1_0: float = 0.0
    PM2_5: float = 0.0
    PM10: float = 0.0
    VOC: float = 0.0
    NO2: float = 0.0
    Humidity: float = 0.0
    Temperature: float = 0.0

@app.get("/")
async def root():
    return {"message": "AQ-HEALTH AI LIVE", "time": datetime.now().isoformat()}

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/api/predict")
async def predict(data: SensorInput):
    try:
        values = [
            max(0.0, float(data.PM1_0 or 0)),
            max(0.0, float(data.PM2_5 or 0)),
            max(0.0, float(data.PM10 or 0)),
            max(0.0, float(data.VOC or 0)),
            max(0.0, float(data.NO2 or 0)),
            max(0.0, min(100.0, float(data.Humidity or 70))),
            max(15.0, min(50.0, float(data.Temperature or 35)))
        ]

        from utils.ai_model import predict as ai_predict
        return ai_predict({
            "PM1.0": values[0],
            "PM2.5": values[1],
            "PM10": values[2],
            "VOC": values[3],
            "NO2": values[4],
            "Humidity": values[5],
            "Temperature": values[6],
        })
    except Exception as e:
        print(f"Prediction error: {e}")
        return {"error": "Prediction failed"}

@app.websocket("/ws")
async def live_feed(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected → sending live updates every 3 seconds")

    last_prediction_time: datetime | None = None

    while True:
        try:
            # Default fallback sensors
            current_sensors = {
                "pm1_0": 7.0, "pm2_5": 23.0, "pm10": 24.0,
                "voc": 10.0, "no2": 0.9, "humidity": 58.1, "temperature": 28.2
            }

            # Read from Firebase only if db is available
            if db is not None:
                try:
                    snapshot = db.reference('latest-reading').get()
                    if snapshot and isinstance(snapshot, dict):
                        current_sensors = {
                            "pm1_0": round(float(snapshot.get("pm1", 7.0)), 1),
                            "pm2_5": round(float(snapshot.get("pm25", 23.0)), 1),
                            "pm10": round(float(snapshot.get("pm10", 24.0)), 1),
                            "voc": round(float(snapshot.get("voc", 10.0)), 1),
                            "no2": round(float(snapshot.get("no2", 0.9)), 1),
                            "humidity": round(float(snapshot.get("humidity", 58.1)), 1),
                            "temperature": round(float(snapshot.get("temperature", 28.2)), 1),
                        }
                except Exception as e:
                    print(f"Firebase read failed: {e}")

            now = datetime.now()

            # Always send heartbeat with current sensors
            countdown = 300 if not last_prediction_time else max(0, 300 - int((now - last_prediction_time).total_seconds()))

            await websocket.send_json({
                "heartbeat": True,
                "sensors": current_sensors,
                "next_forecast_in": countdown,
                "timestamp": now.isoformat()
            })

            # Send full AI prediction every 5 minutes
            if not last_prediction_time or (now - last_prediction_time).total_seconds() >= 300:
                values = [
                    current_sensors["pm1_0"],
                    current_sensors["pm2_5"],
                    current_sensors["pm10"],
                    current_sensors["voc"],
                    current_sensors["no2"],
                    current_sensors["humidity"],
                    current_sensors["temperature"]
                ]

                from utils.ai_model import predict as ai_predict
                ai_result = ai_predict({
                    "PM1.0": values[0], "PM2.5": values[1], "PM10": values[2],
                    "VOC": values[3], "NO2": values[4],
                    "Humidity": values[5], "Temperature": values[6]
                })

                await websocket.send_json({
                    **current_sensors,
                    "ai_prediction": ai_result,
                    "timestamp": now.isoformat(),
                    "forecast_time": now.strftime("%H:%M")
                })

                last_prediction_time = now

            await asyncio.sleep(3)

        except Exception as e:
            print(f"WebSocket loop error: {e}")
            await asyncio.sleep(5)