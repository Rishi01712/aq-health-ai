'use client'

import { useState, useEffect } from 'react'
import { AqiRing } from '../components/aqiRing'
import GaugeCardPro from '../components/gaugeCardPro'
import AiRiskRadar from '../components/aiRiskRadar'
import AlertToast from '../components/alertToast'
import { SensorData, Alert } from '../types/sensorData'
import { db } from '@/lib/firebase'
import { ref, onValue } from 'firebase/database'

// ONLY THESE TWO LINES ADDED
import { useConfigListener } from '@/lib/useConfigListener'
import { useConfigStore } from '@/lib/configStore'

interface RawSensorReading {
  pm1?: number
  pm25?: number
  pm10?: number
  voc?: number
  no2?: number
  humidity?: number
  temperature?: number
}

export default function Overview({ alerts: propAlerts = [], onDismiss: parentOnDismiss }: { alerts?: Alert[], onDismiss?: (id: string) => void }) {
  // ONLY THIS LINE ADDED
  useConfigListener()
  const { config } = useConfigStore() // ONLY THIS LINE ADDED

  const handleDismiss = (id: string) => {
    setDynamicAlerts(prev => prev.filter(a => a.id !== id))
    parentOnDismiss?.(id)
  }
  const [sensorData, setSensorData] = useState<SensorData>({
    PM1_0: 0,
    PM2_5: 0,
    PM10: 0,
    VOC: 0,
    NO2: 0,
    Humidity: 0,
    Temperature: 0,
    ai_prediction: {
      aqi: 0,
      aqi_category: 'Good',
      aqi_breakdown: { 'PM2.5': 0, 'PM10': 0, 'NO2': 0 },
      high_risks: { 'Overall': [] },
      risk_percentages: { 'Overall': {} }
    }
  })

  const [insights, setInsights] = useState<string[]>(["Initializing AI model..."])
  const [dynamicAlerts, setDynamicAlerts] = useState<Alert[]>([])
  const [isBackendAlive, setIsBackendAlive] = useState(false)

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'

  const runRealAiModel = async (raw: RawSensorReading): Promise<SensorData['ai_prediction']> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          PM1_0: raw.pm1 || 0,
          PM2_5: raw.pm25 || 0,
          PM10: raw.pm10 || 0,
          VOC: raw.voc || 0,
          NO2: raw.no2 || 0,
          Humidity: raw.humidity || 0,
          Temperature: raw.temperature || 0,
        })
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const result = await response.json()
      setIsBackendAlive(true)

      const breakdown: Record<string, number> = {}
      result.iaqi?.split(', ').forEach((part: string) => {
        const [key, val] = part.split('=')
        if (key && val) breakdown[key.trim()] = parseInt(val, 10)
      })

      const allRisks: { condition: string; percentage: number }[] = []
      Object.values(result.high_risks || {}).flat().forEach((item: unknown) => {
        if (typeof item === 'string') {
          const match = item.match(/(.+):\s*([\d.]+)%/)
          if (match) {
            allRisks.push({
              condition: match[1].trim(),
              percentage: parseFloat(match[2])
            })
          }
        }
      })

      const top5 = allRisks.sort((a, b) => b.percentage - a.percentage).slice(0, 5)

      const top3 = top5.slice(0, 3).map(r => `${r.condition}: ${r.percentage.toFixed(1)}% risk`)
      if (top3.length === 0) top3.push("No significant health risks")

      const next3 = top5.slice(3, 6)

      const insights: string[] = []
      const pm25 = raw.pm25 ?? 0
      const voc = raw.voc ?? 0
      const aqi = result.aqi || 0

      if (aqi >= 201) {
        insights.push(`AQI ${aqi} — Very Unhealthy`)
        insights.push(`Stay indoors • Close windows • Use air purifier`)
      } else if (aqi >= 101) {
        insights.push(`AQI ${aqi} — Unhealthy`)
        insights.push(`Reduce outdoor time • Sensitive groups stay indoors`)
      } else if (aqi >= 51) {
        insights.push(`AQI ${aqi} — Moderate`)
        insights.push(`Air quality acceptable • Monitor sensitive individuals`)
      } else {
        insights.push(`AQI ${aqi} — Good`)
        insights.push(`Excellent air quality • Enjoy outdoors`)
      }

      if (pm25 >= 75) insights.push(`PM2.5 elevated — Wear mask if going out`)
      if (voc >= 400) insights.push(`High VOC detected — Ventilate room now`)
      if (raw.temperature ?? 0 >= 35) insights.push(`High temperature — Stay hydrated`)

      setInsights(insights.slice(0, 5))

      const alerts: Alert[] = []
      const id = Date.now().toString()

      if (aqi >= 151) alerts.push({ id: `${id}-aqi`, message: `AQI ${aqi} — ${result.predicted_category}`, type: aqi >= 201 ? 'danger' : 'warning' })
      if (pm25 >= 75) alerts.push({ id: `${id}-pm25`, message: `PM2.5 ${pm25.toFixed(1)} µg/m³ — Elevated risk`, type: pm25 >= 150 ? 'danger' : 'warning' })
      if (voc >= 400) alerts.push({ id: `${id}-voc`, message: `VOC ${voc.toFixed(1)} ppb — Ventilate now`, type: 'warning' })

      next3.forEach((r, i) => {
        if (r.percentage >= 60) {
          alerts.push({
            id: `${id}-risk${i}`,
            message: `${r.condition}: ${r.percentage.toFixed(1)}% risk in 48h`,
            type: r.percentage >= 80 ? 'danger' : 'warning'
          })
        }
      })

      setDynamicAlerts(alerts)

      return {
        aqi: result.aqi || 0,
        aqi_category: result.predicted_category || 'Good',
        aqi_breakdown: {
          'PM2.5': breakdown['PM2.5'] || 0,
          'PM10': breakdown['PM10'] || 0,
          'NO2': breakdown['NO2'] || 0,
        },
        high_risks: { 'Overall': top5.map(r => `${r.condition}: ${r.percentage.toFixed(1)}%`) },
        risk_percentages: { 'Overall': Object.fromEntries(top5.map(r => [r.condition, r.percentage])) }
      }
    } catch (err) {
      console.error("Backend unreachable:", err)
      setIsBackendAlive(false)
      setInsights(["AI Model Offline", "Check: uvicorn main:app --reload --port=8000", `URL: ${BACKEND_URL}`])
      setDynamicAlerts([])
      return {
        aqi: 88,
        aqi_category: 'Moderate',
        aqi_breakdown: { 'PM2.5': 88, 'PM10': 65, 'NO2': 42 },
        high_risks: { 'Overall': ['Lung Cancer: 72%', 'COPD: 68%', 'Asthma: 64%'] },
        risk_percentages: { 'Overall': { 'Lung Cancer': 72, 'COPD': 68, 'Asthma': 64 } }
      }
    }
  }

  // ONLY THIS useEffect IS MODIFIED — everything else is YOUR original code
  useEffect(() => {
    // If Firebase is turned OFF in Settings → do nothing
    if (!config.useFirebase) {
      setSensorData(prev => ({ ...prev, PM1_0: 0, PM2_5: 0, PM10: 0, VOC: 0, NO2: 0, Humidity: 0, Temperature: 0 }))
      setInsights(["Firebase Disabled"])
      setIsBackendAlive(false)
      return
    }

    const latestRef = ref(db, 'latest-reading')
    const unsubscribe = onValue(latestRef, async (snapshot) => {
      const raw: RawSensorReading = snapshot.val() || {}

      const baseData = {
        PM1_0: Number(raw.pm1) || 0,
        PM2_5: Number(raw.pm25) || 0,
        PM10: Number(raw.pm10) || 0,
        VOC: Number(raw.voc) || 0,
        NO2: Number(raw.no2) || 0,
        Humidity: Number(raw.humidity) || 0,
        Temperature: Number(raw.temperature) || 0,
      }

      const aiResult = await runRealAiModel(raw)
      setSensorData({ ...baseData, ai_prediction: aiResult })
    })

    return () => unsubscribe()
  }, [config.useFirebase, BACKEND_URL]) // ← ONLY THIS LINE CHANGED

  const { PM1_0, PM2_5, PM10, VOC, NO2, Humidity, Temperature } = sensorData
  const { aqi = 0, aqi_category = 'Good', aqi_breakdown = {}, high_risks = {}, risk_percentages = {} } = sensorData.ai_prediction

  const iaqi = `PM2.5=${aqi_breakdown['PM2.5'] || 0}, PM10=${aqi_breakdown['PM10'] || 0}, NO2=${aqi_breakdown['NO2'] || 0}`

  const breakdown = [
    { pollutant: 'PM2.5', value: aqi_breakdown['PM2.5'] || 0, contribution: 60, color: '#ef4444', threshold: 30 },
    { pollutant: 'PM10', value: aqi_breakdown['PM10'] || 0, contribution: 30, color: '#f97316', threshold: 50 },
    { pollutant: 'NO2', value: aqi_breakdown['NO2'] || 0, contribution: 10, color: '#dc2626', threshold: 40 },
  ]

  const riskData = Object.fromEntries(
    Object.entries(high_risks).map(([key, values]) => [
      key,
      (values as string[]).map(str => {
        const clean = str.replace(/:\s*\d+(\.\d+)?%$/, '').trim()
        return {
          condition: clean,
          percentage: risk_percentages[key]?.[clean] || 0
        }
      })
    ])
  )

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Real-Time Air Quality
        </h1>
        <p className="text-slate-400 text-sm mt-2">
          Live from sensor • AI Model: <span className={isBackendAlive ? "text-green-400" : "text-red-400"}>
            {isBackendAlive ? 'ACTIVE' : 'OFFLINE'}
          </span>
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div>
          <AqiRing aqi={aqi} category={aqi_category} iaqi={iaqi} breakdown={breakdown} />
        </div>

        <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          <GaugeCardPro label="PM2.5" value={PM2_5} max={250} unit="µg/m³" color="#ef4444" threshold={30} />
          <GaugeCardPro label="PM1.0" value={PM1_0} max={100} unit="µg/m³" color="#8b5cf6" threshold={25} />
          <GaugeCardPro label="PM10" value={PM10} max={300} unit="µg/m³" color="#f97316" threshold={50} />
          <GaugeCardPro label="VOC" value={VOC} max={1000} unit="ppb" color="#eab308" threshold={400} />
          <GaugeCardPro label="NO₂" value={NO2} max={200} unit="ppb" color="#dc2626" threshold={40} />
          <GaugeCardPro label="Temp" value={Temperature} max={50} unit="°C" color="#f59e0b" threshold={35} />
          <GaugeCardPro label="Hum" value={Humidity} max={100} unit="%" color="#3b82f6" threshold={70} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AiRiskRadar risks={riskData} />
        <div className="glass p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-cyan-300 mb-4">AI Health Insights</h3>
          <ul className="space-y-2 text-sm text-slate-300">
            {insights.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        </div>
      </div>

      <AlertToast alerts={dynamicAlerts.concat(propAlerts)} onDismiss={handleDismiss} autoDismissMs={10000} />
    </div>
  )
}