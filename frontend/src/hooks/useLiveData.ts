// src/hooks/useLiveData.ts
import { useEffect, useState } from 'react'

interface SensorData {
  aqi: number
  pm25: number
  pm1_0: number
  pm10: number
  voc: number
  no2: number
  timestamp: string
}

export function useLiveData() {
  const [data, setData] = useState<SensorData | null>(null)

  useEffect(() => {
    let wsUrl = 'ws://127.0.0.1:8000/ws'  // Local

    // Production: use your deployed backend URL
    if (import.meta.env.PROD) {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://aq-health-ai-backend.onrender.com/'
      wsUrl = `wss://${backendUrl.replace('https://', '')}/ws`
    }

    const ws = new WebSocket(wsUrl)

    ws.onopen = () => console.log('WebSocket connected')
    ws.onmessage = (event) => {
      try {
        const newData: SensorData = JSON.parse(event.data)
        setData(newData)
      } catch (err) {
        console.error('Parse error', err)
      }
    }
    ws.onerror = (err) => console.error('WebSocket error', err)
    ws.onclose = () => console.log('WebSocket closed — will retry on refresh')

    return () => ws.close()
  }, [])

  return { data }
}