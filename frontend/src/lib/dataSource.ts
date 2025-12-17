// src/lib/dataSource.ts 
import { ref, onValue, push } from "firebase/database";
import { db } from "@/lib/firebase";

export interface SensorData {
  PM1_0: number;
  PM2_5: number;
  PM10: number;
  VOC: number;
  NO2: number;
  Humidity: number;
  Temperature: number;
}

export function getMockData() {
  return {
    PM1_0: 12,
    PM2_5: 24,
    PM10: 40,
    VOC: 300,
    NO2: 18,
    Humidity: 55,
    Temperature: 28,
    ai_prediction: {
      aqi: 80,
      aqi_category: "Moderate",
      aqi_breakdown: { "PM2.5": 24, "PM10": 40, "NO2": 18 },
      high_risks: { PM2_5: [], PM10: [], VOC: [], NO2: [] },
      risk_percentages: {
        PM2_5: {}, PM10: {}, VOC: {}, NO2: {}
      }
    }
  };
}


export function listenFirebaseLive(callback: (data: SensorData) => void) {
  const r = ref(db, "live");
  return onValue(r, snap => {
    if (snap.exists()) callback(snap.val());
  });
}

export async function storeHistory(data: SensorData) {
  await push(ref(db, "history"), {
    ...data,
    ts: Date.now(),
  });
}
