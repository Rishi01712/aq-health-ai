// src/hooks/useLiveData.ts
import { useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

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
  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    // CHANGE THIS TO YOUR RENDER BACKEND URL
    const BACKEND_URL = "https://aq-health-ai-backend.onrender.com"  // <-- YOUR ACTUAL RENDER BACKEND URL

    const newSocket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    })

    newSocket.on('connect', () => {
      console.log('Connected to Render backend WebSocket')
    })

    newSocket.on('sensor_data', (newData: SensorData) => {
      setData(newData)
    } )

    newSocket.on('connect_error', (err) => {
      console.error('WebSocket connection error:', err.message)
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from backend')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return { data, socket }
}