# backend/main.py  ← FINAL + PYLANCE FIXED + AI MODELS PAGE WORKS
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime
import asyncio
# ==================== FIREBASE SAFE ====================
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate("firebase-service-account.json")
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://aq-health-ai-default-rtdb.asia-southeast1.firebasedatabase.app'
        })
    print("Firebase connected")
except Exception as e:
    print(f"Firebase not available: {e}")

app = FastAPI(title="AQ-HEALTH AI")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://aq-health-ai-frontend.onrender.com",  # Your frontend URL
        "http://localhost:5173",  # For local dev
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
        from dataset.models import predict_full
        return predict_full(values)
    except Exception as e:
        return {"error": "Prediction failed", "details": str(e)}

@app.websocket("/ws")
async def live_feed(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket connected → AI FORECAST EVERY 5 MINUTES (Pylance-Proof)")

    last_prediction_time: datetime | None = None   # Explicit type annotation
    last_sent_payload: dict | None = None

    while True:
        try:
            snapshot = db.reference('latest-reading').get()
            if not snapshot or not isinstance(snapshot, dict):
                await asyncio.sleep(5)
                continue

            # Current sensor values
            current_sensors = {
                "pm1_0": round(float(snapshot.get("pm1", 0)), 1),
                "pm2_5": round(float(snapshot.get("pm25", 0)), 1),
                "pm10": round(float(snapshot.get("pm10", 0)), 1),
                "voc": round(float(snapshot.get("voc", 0)), 1),
                "no2": round(float(snapshot.get("no2", 0)), 1),
                "humidity": round(float(snapshot.get("humidity", 0)), 1),
                "temperature": round(float(snapshot.get("temperature", 0)), 1),
            }

            now = datetime.now()

            # 5-MINUTE PREDICTION LOGIC — PYLANCE-SAFE
            should_predict = False

            if last_prediction_time is None:
                should_predict = True
            else:
                # This line is now 100% safe because we checked None above
                seconds_since_last = (now - last_prediction_time).total_seconds()
                if seconds_since_last >= 300:  # 5 minutes
                    should_predict = True

            if should_predict:
                values = [
                    current_sensors["pm1_0"],
                    current_sensors["pm2_5"],
                    current_sensors["pm10"],
                    current_sensors["voc"],
                    current_sensors["no2"],
                    current_sensors["humidity"],
                    current_sensors["temperature"]
                ]

                from dataset.models import predict_full
                ai_result = predict_full(values)

                payload = {
                    **current_sensors,
                    "ai_prediction": ai_result,
                    "timestamp": now.isoformat(),
                    "forecast_time": now.strftime("%H:%M")
                }

                if payload != last_sent_payload:
                    await websocket.send_json(payload)
                    last_sent_payload = payload

                # Update Firebase
                db.reference('latest-reading').update({
                    "aqi": int(ai_result.get("aqi", 0)),
                    "category": str(ai_result.get("predicted_category", "Hazardous"))
                })

                last_prediction_time = now  # Update timestamp

            else:
                # Live heartbeat with current sensors + countdown
                if last_prediction_time is not None:
                    countdown = int(300 - (now - last_prediction_time).total_seconds())
                else:
                    countdown = 0

                try:
                    await websocket.send_json({
                        "heartbeat": True,
                        "sensors": current_sensors,
                        "next_forecast_in": max(0, countdown),
                        "timestamp": now.isoformat(timespec='milliseconds')
                    })
                except:
                    break

            await asyncio.sleep(3)

        except Exception as e:
            print(f"Live feed error: {e}")
            await asyncio.sleep(5)
            continue