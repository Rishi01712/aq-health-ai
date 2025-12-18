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
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
    
    const newSocket = io(backendUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
    })

    newSocket.on('connect', () => {
      console.log('Connected to backend')
    })

    newSocket.on('sensor_data', (newData: SensorData) => {
      setData(newData)
    })

    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err)
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  return { data, socket }
}