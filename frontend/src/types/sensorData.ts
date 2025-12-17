// src/types/sensorData.ts
export interface FirebaseLiveData {
  aqi: number
  category: string
  humidity: number
  no2: number
  pm1: number
  pm10: number
  pm25: number
  temperature: number
  voc: number
  timestamp?: number | string
}

export interface SensorData {
  PM1_0: number
  PM2_5: number
  PM10: number
  VOC: number
  NO2: number
  Humidity: number
  Temperature: number
  ai_prediction: {
    aqi: number
    aqi_category: string
    aqi_breakdown: Record<string, number>
    high_risks: Record<string, string[]>
    risk_percentages: Record<string, Record<string, number>>
  }
}

export interface Alert {
  id: string
  message: string
  type: 'danger' | 'warning'
}