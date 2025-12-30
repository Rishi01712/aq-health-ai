// src/components/aqiRing.tsx
import { AlertCircle } from 'lucide-react'

interface IAQIBreakdown {
  pollutant: string
  value: number
  contribution: number
  color: string
  threshold: number
}

interface AqiRingProps {
  aqi: number
  category: string
  iaqi: string
  breakdown: IAQIBreakdown[]
}

const RADIUS = 110
const CIRC = 2 * Math.PI * RADIUS
const STROKE = 20

const INDIAN_THRESHOLDS = {
  'PM2.5': 30,
  'PM10': 50,
  'NO2': 40,
}

export function AqiRing({ aqi, category, iaqi, breakdown }: AqiRingProps) {
  const pct = Math.min((aqi / 500) * 100, 100)
  const dash = CIRC - (CIRC * pct) / 100

  const getColor = (value: number) => {
    if (value <= 50) return '#10b981'
    if (value <= 100) return '#f59e0b'
    if (value <= 150) return '#f97316'
    if (value <= 200) return '#ef4444'
    if (value <= 300) return '#dc2626'
    return '#7c3aed'
  }

  const color = getColor(aqi)

 return (
    <div className="glass rounded-3xl p-6 sm:p-8 shadow-2xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">Air Quality Index</h3>
          <p className="text-xs text-slate-400">Real-time • India</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: `${color}20`, color }}>
            {category}
          </span>
          {aqi > 100 && <AlertCircle className="w-5 h-5 text-red-400 animate-pulse" />}
        </div>
      </div>

      {/* Ring */}
      <div className="relative mx-auto w-56 h-56 md:w-72 md:h-72 lg:w-80 lg:h-80">
        <svg className="absolute h-full w-full -rotate-90">
          <circle cx="128" cy="128" r={RADIUS} fill="none" stroke="#1e293b" strokeWidth={STROKE + 4} />
          <circle
            cx="128" cy="128" r={RADIUS} fill="none" stroke={color} strokeWidth={STROKE}
            strokeLinecap="round" strokeDasharray={CIRC} strokeDashoffset={dash}
            className="transition-all duration-1500 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="text-5xl md:text-6xl lg:text-7xl font-black" style={{ color }}>{aqi}</div>
            <p className="text-sm md:text-base text-slate-400">AQI</p>
          </div>
        </div>
      </div>

      {/* IAQI Breakdown */}
      <div className="mt-8 space-y-3">
        <p className="text-center text-xs text-slate-400">{iaqi}</p>
        <div className="space-y-2">
          {breakdown.map((b) => {
            const exceeded = b.value > (INDIAN_THRESHOLDS[b.pollutant as keyof typeof INDIAN_THRESHOLDS] || 0)
            return (
              <div key={b.pollutant} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-300">{b.pollutant}</span>
                  {exceeded && <AlertCircle className="w-3 h-3 text-red-400 animate-pulse" />}
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 rounded-full bg-slate-700">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${b.contribution}%`, backgroundColor: b.color }}
                    />
                  </div>
                  <span className="font-medium" style={{ color: b.color }}>{b.value}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* General Effect */}
      <p className="mt-6 text-center text-xs text-slate-300 italic">
        {aqi <= 50
          ? 'Air quality is satisfactory.'
          : aqi <= 100
          ? 'Air quality is acceptable.'
          : aqi <= 150
          ? 'Unhealthy for sensitive groups.'
          : aqi <= 200
          ? 'Unhealthy for everyone.'
          : aqi <= 300
          ? 'Very unhealthy — avoid outdoor activity.'
          : 'Hazardous — stay indoors.'}
      </p>
    </div>
  )
}