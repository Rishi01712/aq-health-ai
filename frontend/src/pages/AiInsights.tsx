'use client'

import { useState, useEffect } from 'react'
import { AlertCircle, Activity, Brain, AlertTriangle, Thermometer, Droplets, Wifi, WifiOff } from 'lucide-react'
import { useConfigListener } from '@/lib/useConfigListener'
import { useConfigStore } from '@/lib/configStore'

// SINGLETON WEBSOCKET — survives page navigation forever
let globalWs: WebSocket | null = null
let listeners: ((data: any) => void)[] = []

function broadcast(data: any) {
  listeners.forEach(fn => fn(data))
}

interface SensorData {
  PM1_0: number
  PM2_5: number
  PM10: number
  VOC: number
  NO2: number
  Humidity: number
  Temperature: number
}

interface AIOutput {
  aqi: number
  predicted_category: string
  iaqi: string
  general_effects: string[]
  high_risks: Record<string, string[]>
}

export default function AIInsights() {
  useConfigListener()
  const { config } = useConfigStore()
  const [sensor, setSensor] = useState<SensorData | null>(null)
  const [prediction, setPrediction] = useState<AIOutput | null>(null)
  const [connected, setConnected] = useState(false)
  //const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!config.useFirebase) {
      setSensor(null)
      setPrediction(null)
      setConnected(false)
      if (globalWs) {
        globalWs.close()
        globalWs = null
      }
      listeners = []
      return
    }

        const handler = (data: any) => {
      // Always update live sensors (from heartbeat or full payload)
      const sensors = {
        PM1_0: data.sensors?.pm1_0 ?? data.pm1_0 ?? 0,
        PM2_5: data.sensors?.pm2_5 ?? data.pm2_5 ?? 0,
        PM10: data.sensors?.pm10 ?? data.pm10 ?? 0,
        VOC: data.sensors?.voc ?? data.voc ?? 0,
        NO2: data.sensors?.no2 ?? data.no2 ?? 0,
        Humidity: data.sensors?.humidity ?? data.humidity ?? 0,
        Temperature: data.sensors?.temperature ?? data.temperature ?? 0,
      }
      setSensor(sensors)

      // If full AI prediction is sent (every 5 min), use it
      if (data.ai_prediction) {
        setPrediction(data.ai_prediction)
        return
      }

      // On heartbeat (every 3 sec), if no prediction yet, fetch from /api/predict
      if (data.heartbeat && !prediction) {
        fetch(`${import.meta.env.PROD ? 'https://aq-health-ai-backend.onrender.com' : 'http://localhost:8000'}/api/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            PM1_0: sensors.PM1_0,
            PM2_5: sensors.PM2_5,
            PM10: sensors.PM10,
            VOC: sensors.VOC,
            NO2: sensors.NO2,
            Humidity: sensors.Humidity,
            Temperature: sensors.Temperature,
          })
        })
          .then(res => res.json())
          .then(ai => setPrediction(ai))
          .catch(err => {
            console.error('Fallback API call failed:', err)
            // Optional: show placeholder
            setPrediction({
              aqi: Math.round(sensors.PM2_5 * 1.67),
              predicted_category: "Calculating...",
              iaqi: "Loading...",
              general_effects: ["AI warming up..."],
              high_risks: {}
            })
          })
      }
    }

    listeners.push(handler)

    // Create WebSocket only once
    if (!globalWs || globalWs.readyState === WebSocket.CLOSED || globalWs.readyState === WebSocket.CLOSING) {
      // Default local dev URL
      let wsUrl = 'ws://localhost:8000/ws'

      // Production: use deployed Render backend
      if (import.meta.env.PROD) {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://aq-health-ai-backend.onrender.com'
        wsUrl = `wss://${backendUrl.replace('https://', '').replace(/\/+$/, '')}/ws`
      }

      globalWs = new WebSocket(wsUrl)

      globalWs.onopen = () => {
        setConnected(true)
        console.log('WebSocket connected — live data active')
      }

      globalWs.onerror = () => {
        console.log("WebSocket temporary error – reconnecting...")
      }

      globalWs.onclose = () => {
        setConnected(false)
        //setError(null)
        globalWs = null
      }

      globalWs.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          broadcast(data)
        } catch (e) {
          console.error('WebSocket parse error:', e)
        }
      }
    } else {
      setConnected(globalWs.readyState === WebSocket.OPEN)
    }

    return () => {
      listeners = listeners.filter(l => l !== handler)
      if (listeners.length === 0 && globalWs) {
        globalWs.close()
        globalWs = null
      }
    }
  }, [config.useFirebase])

  const getAqiColor = (aqi: number) => {
    if (aqi <= 50) return 'text-green-400'
    if (aqi <= 100) return 'text-yellow-400'
    if (aqi <= 150) return 'text-orange-400'
    if (aqi <= 200) return 'text-red-400'
    if (aqi <= 300) return 'text-purple-400'
    return 'text-red-600'
  }

  const getAqiBg = (aqi: number) => {
    if (aqi <= 50) return 'bg-green-500/20 border-green-500/50'
    if (aqi <= 100) return 'bg-yellow-500/20 border-yellow-500/50'
    if (aqi <= 150) return 'bg-orange-500/20 border-orange-500/50'
    if (aqi <= 200) return 'bg-red-500/20 border-red-500/50'
    if (aqi <= 300) return 'bg-purple-500/20 border-purple-500/50'
    return 'bg-red-600/20 border-red-600/50'
  }

  if (!sensor && !prediction) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              AI Health Risk Forecast
            </h1>
            <p className="text-slate-400 mt-1">Loading live data...</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Connecting...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
            AI Health Risk Forecast
          </h1>
          <p className="text-slate-400 mt-1">Real-time AQI • Disease Risk • Live Sensors</p>
        </div>
        <div className="flex items-center gap-2">
          {connected ? (
            <Wifi className="w-5 h-5 text-green-400 animate-pulse" />
          ) : (
            <WifiOff className="w-5 h-5 text-red-400" />
          )}
          <span className="text-xs text-slate-400">
            {connected ? 'Live' : 'Connecting...'}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {!sensor && !prediction && (
        <div className="flex flex-col items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-slate-400 text-lg">Connecting to sensor and loading AI forecast...</p>
          <p className="text-slate-500 text-sm mt-2">This takes 3–5 seconds on first load</p>
        </div>
      )}

      {/* Live Sensors */}
      {sensor && (
        <div className="glass rounded-2xl p-6 border border-purple-500/30">
          <h3 className="text-lg font-bold text-purple-300 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live Sensor Data
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(sensor).map(([key, value]) => (
              <div key={key} className="bg-slate-800/50 rounded-xl p-3 border border-slate-700 hover:border-purple-500/50 transition-all">
                <p className="text-xs text-slate-400">{key.replace('_', '.')}</p>
                <p className="text-xl font-bold text-white">
                  {value}{' '}
                  {key.includes('PM') ? 'µg/m³' : key === 'VOC' || key === 'NO2' ? 'ppb' : key === 'Temperature' ? '°C' : '%'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Prediction — ROCK SOLID */}
      {prediction && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`glass rounded-2xl p-5 sm:p-6 border ${getAqiBg(prediction.aqi)}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs sm:text-sm text-slate-400">AQI</p>
                  <p className={`text-4xl sm:text-5xl font-bold ${getAqiColor(prediction.aqi)}`}>
                    {prediction.aqi}
                  </p>
                </div>
                <AlertCircle className={`w-8 h-8 sm:w-12 sm:h-12 ${getAqiColor(prediction.aqi)} opacity-70`} />
              </div>
              <p className="text-base sm:text-lg font-semibold text-white">
                {prediction.predicted_category}
              </p>
            </div>

            <div className="glass rounded-2xl p-6 border border-cyan-500/30 md:col-span-2">
              <p className="text-sm text-slate-400 mb-2">Individual AQI</p>
              <div className="flex flex-wrap gap-2">
                {prediction.iaqi.split(', ').map(item => {
                  const [p, v] = item.split('=')
                  return (
                    <span key={p} className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm font-medium">
                      {p}: <strong>{v}</strong>
                    </span>
                  )
                })}
              </div>
            </div>
          </div>

          {prediction.general_effects?.length > 0 && (
            <div className="glass rounded-2xl p-6 border border-orange-500/30 bg-orange-500/10">
              <p className="text-sm font-medium text-orange-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                General Health Effects
              </p>
              <ul className="mt-3 space-y-2">
                {prediction.general_effects.map((e, i) => (
                  <li key={i} className="text-white text-sm flex items-start gap-2">
                    <span className="text-orange-400 mt-1">•</span>
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(prediction.high_risks).length > 0 && (
            <div className="glass rounded-2xl p-6 border border-red-500/30">
              <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5" />
                High-Risk Diseases (Next 24–48h)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(prediction.high_risks).map(([gas, risks]) => {
                  const Icon = gas === 'Temperature' ? Thermometer : gas === 'Humidity' ? Droplets : AlertCircle
                  const color =
                    gas.includes('PM2.5') ? 'text-red-400' :
                    gas.includes('PM10') ? 'text-orange-400' :
                    gas === 'NO2' ? 'text-purple-400' :
                    gas === 'Temperature' ? 'text-yellow-400' :
                    'text-cyan-400'

                  return (
                    <div key={gas} className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 hover:border-red-500/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon className={`w-5 h-5 ${color}`} />
                        <p className="font-bold text-white">{gas}</p>
                      </div>
                      <ul className="space-y-1">
                        {risks.map((r, i) => (
                          <li key={i} className={`text-sm ${color}`}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}