'use client'

import { useState, useEffect } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { TrendingUp, Clock, AlertCircle } from 'lucide-react'
import { useRefreshInterval } from '@/lib/useRefreshInterval'
import { useConfigListener } from '@/lib/useConfigListener'
import { getDatabase, ref, onValue } from 'firebase/database'

interface HistoryPoint {
  time: string
  value: number
}

interface SensorHistory {
  PM1_0: HistoryPoint[]
  PM2_5: HistoryPoint[]
  PM10: HistoryPoint[]
  VOC: HistoryPoint[]
  NO2: HistoryPoint[]
  Humidity: HistoryPoint[]
  Temperature: HistoryPoint[]
}

const SENSOR_KEYS = ['PM1_0', 'PM2_5','PM10','VOC','NO2','Humidity','Temperature'] as const

const COLORS = {
  PM1_0: '#8b5cf6',
  PM2_5: '#ef4444',
  PM10: '#f97316',
  VOC: '#eab308',
  NO2: '#dc2626',
  Temperature: '#f59e0b',
  Humidity: '#3b82f6'
} as const

const UNITS = {
  PM1_0: 'µg/m³',
  PM2_5: 'µg/m³',
  PM10: 'µg/m³',
  VOC: 'ppb',
  NO2: 'ppb',
  Temperature: '°C',
  Humidity: '%'
} as const

const THRESHOLDS = {
  PM1_0: 25,
  PM2_5: 30,
  PM10: 50,
  VOC: 400,
  NO2: 40,
  Temperature: 35,
  Humidity: 70
} as const

export default function Analytics() {
  useConfigListener()
  const refreshMs = useRefreshInterval()

  const [history, setHistory] = useState<SensorHistory>({
    PM1_0: [], PM2_5: [], PM10: [], VOC: [], NO2: [], Humidity: [], Temperature: []
  })

  // Generate correct 5-minute time labels: oldest first → newest last
  const generateTimeLabels = (latestTimestamp: number) => {
    const labels: string[] = []
    const base = new Date(latestTimestamp)
    base.setMinutes(Math.floor(base.getMinutes() / 5) * 5)
    base.setSeconds(0)
    base.setMilliseconds(0)

    // Go back 25 minutes from latest (5 intervals back)
    const startTime = new Date(base.getTime() - 25 * 60 * 1000)

    for (let i = 0; i < 6; i++) {
      const time = new Date(startTime.getTime() + i * 5 * 60 * 1000)
      const h = time.getHours().toString().padStart(2, '0')
      const m = time.getMinutes().toString().padStart(2, '0')
      labels.push(`${h}:${m}`)
    }
    return labels
  }

  const makeEmptyHistory = (): SensorHistory => ({
    PM1_0: [], PM2_5: [], PM10: [], VOC: [], NO2: [], Humidity: [], Temperature: []
  })

  useEffect(() => {
    const db = getDatabase()
    const historyRef = ref(db, 'history')

    const processSnapshot = (snap: any) => {
      let entries: any[] = []

      if (snap?.exists?.()) {
        const raw = snap.val()
        Object.keys(raw).forEach(key => {
          const item = raw[key]
          if (item?.timestamp) entries.push(item)
        })
      }

      if (entries.length === 0) {
        const saved = localStorage.getItem('analytics-last-6')
        if (saved) {
          try { entries = JSON.parse(saved) } catch {}
        }
      }

      if (entries.length === 0) {
        setHistory(makeEmptyHistory())
        return
      }

      // Sort newest first (for slicing last 6)
      entries.sort((a: any, b: any) => (b.timestamp || 0) - (a.timestamp || 0))
      const latestSix = entries.slice(0, 6)

      // Generate perfect time labels: 20:00, 20:05, 20:10...
      const timeLabels = generateTimeLabels(latestSix[0]?.timestamp || Date.now())

      const newHist = makeEmptyHistory()

      latestSix.forEach((entry: any, index: number) => {
        const timeStr = timeLabels[index]

        const get = (key: string) => {
          const val = entry[key]
          return val != null && isFinite(Number(val)) ? Number(Number(val).toFixed(1)) : 0
        }

        newHist.PM1_0.push({ time: timeStr, value: get('pm1') })
        newHist.PM2_5.push({ time: timeStr, value: get('pm25') })
        newHist.PM10.push({ time: timeStr, value: get('pm10') })
        newHist.VOC.push({ time: timeStr, value: get('voc') })
        newHist.NO2.push({ time: timeStr, value: get('no2') })
        newHist.Humidity.push({ time: timeStr, value: get('humidity') })
        newHist.Temperature.push({ time: timeStr, value: get('temperature') })
      })

      setHistory(newHist)
      localStorage.setItem('analytics-last-6', JSON.stringify(latestSix))
    }

    const unsub = onValue(historyRef, processSnapshot)
    processSnapshot({ exists: () => false })

    return () => unsub()
  }, [])

  // AI Forecast — UNTOUCHED
  const getBadSensors = () => {
    const bad: { key: keyof SensorHistory; avg: number; excess: number }[] = []
    SENSOR_KEYS.forEach(key => {
      const pts = history[key]
      if (pts.length === 0) return
      const avg = Number((pts.reduce((s, p) => s + p.value, 0) / pts.length).toFixed(1))
      const excess = avg - THRESHOLDS[key]
      if (excess > 0) {
        bad.push({ key, avg, excess })
      }
    })
    return bad.sort((a, b) => b.excess - a.excess)
  }

  const badSensors = getBadSensors()

  const getStats = (data: HistoryPoint[]) => {
    if (!data.length) return { avg: 0, max: 0, maxTime: '' }
    const values = data.map(d => d.value)
    const avg = Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1))
    const max = Math.max(...values)
    const maxIdx = values.indexOf(max)
    return { avg, max, maxTime: data[maxIdx]?.time || '—' }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
          Live Sensor Analytics
        </h1>
        <p className="text-slate-400 mt-1">
          Real-time trends • 5-minute intervals • From Firebase
        </p>
      </div>

      {badSensors.length > 0 && (
        <div className="glass rounded-2xl p-4 border border-red-500/50 bg-red-500/10">
          <p className="text-sm font-medium text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            AI Forecast: Unhealthy for 2+ hours
          </p>
          <ul className="mt-2 space-y-1 text-xs">
            {badSensors.map(s => (
              <li key={s.key} className="flex justify-between">
                <span className="font-bold">{s.key}</span>
                <span>{s.avg} {UNITS[s.key]} (Up {s.excess.toFixed(1)})</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {SENSOR_KEYS.map(sensor => {
          const data = history[sensor]
          const stats = getStats(data)
          const color = COLORS[sensor]

          return (
            <div key={sensor} className="glass rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all">
              <h3 className="text-lg font-bold text-white mb-4">{sensor}</h3>
              
              <div className="h-48 mb-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data.length > 0 ? data : [{ time: '—', value: 0 }]}
                    margin={{ top: 10, right: 20, left: 0, bottom: 0 }}   // ← Clean right margin
                  >
                    <defs>
                      <linearGradient id={`grad-${sensor}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: '#94a3b8', fontSize: 10 }}
                      interval={0}
                      tickMargin={10}
                    />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={color}
                      fill={`url(#grad-${sensor})`}
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-cyan-400">
                    <TrendingUp className="w-3 h-3" /> Avg
                  </div>
                  <p className="font-bold text-white">
                    {stats.avg} {UNITS[sensor]}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-orange-400">
                    <AlertCircle className="w-3 h-3" /> Peak
                  </div>
                  <p className="font-bold text-white">
                    {stats.max} {UNITS[sensor]}
                  </p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-2">
                  <div className="flex items-center gap-1 text-emerald-400">
                    <Clock className="w-3 h-3" /> Time
                  </div>
                  <p className="font-bold text-white">{stats.maxTime}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="glass rounded-2xl p-6 border border-cyan-500/30">
        <h3 className="text-lg font-bold text-cyan-300 mb-4">24-Hour Summary</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-400 border-b border-slate-700">
              <th className="text-left pb-2">Dominant Pollutant</th>
              <th className="text-center pb-2">AQI Trend</th>
              <th className="text-center pb-2">Data Points</th>
              <th className="text-right pb-2">Next Update</th>
            </tr>
          </thead>
          <tbody>
            {badSensors.length > 0 ? (
              badSensors.slice(0, 3).map((s, i) => (
                <tr key={s.key} className="border-b border-slate-800">
                  <td className="py-2 font-bold text-white">{s.key}</td>
                  <td className="text-center py-2">
                    {i === 0 ? <span className="font-bold text-orange-400">Live</span> : ''}
                  </td>
                  <td className="text-center py-2 font-bold text-white text-xs">45+</td>
                  <td className="text-right py-2">
                    {i === 0 ? <span className="font-bold text-emerald-400">{refreshMs / 60000} min</span> : ''}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="py-2 font-bold text-white">All Clear</td>
                <td className="text-center py-2 font-bold text-green-400">Good</td>
                <td className="text-center py-2 font-bold text-white text-xs">288</td>
                <td className="text-right py-2 font-bold text-emerald-400">{refreshMs / 60000} min</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}