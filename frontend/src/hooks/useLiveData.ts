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
    let ws: WebSocket | null = null
    let reconnectTimeout: NodeJS.Timeout | null = null

    const connect = () => {
      // Local dev
      let wsUrl = 'ws://127.0.0.1:8000/ws'

      // Production (Render deployment)
      if (import.meta.env.PROD) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://aq-health-ai-backend.onrender.com'
        wsUrl = `wss://${backendUrl.replace('https://', '').replace(/\/+$/, '')}/ws`  // clean trailing slash
      }

      ws = new WebSocket(wsUrl)

      ws.onopen = () => {
        console.log('WebSocket connected — live data active')
      }

      ws.onmessage = (event) => {
        try {
          const newData: SensorData = JSON.parse(event.data)
          setData(newData)
          console.log('Live data received:', newData)
        } catch (err) {
          console.error('Failed to parse WebSocket message', err)
        }
      }

      ws.onerror = (err) => {
        console.error('WebSocket error:', err)
      }

      ws.onclose = () => {
        console.log('WebSocket closed — reconnecting in 3 seconds')
        reconnectTimeout = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (ws) ws.close()
    }
  }, [])

  return { data }
}