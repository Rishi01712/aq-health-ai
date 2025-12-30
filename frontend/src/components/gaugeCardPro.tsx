// src/components/gaugeCardPro.tsx
import { AlertCircle } from 'lucide-react'

interface Props {
  label: string
  value: number
  max: number
  unit: string
  color: string
  threshold: number
}

const INDIAN_THRESHOLDS = {
  'PM2.5': 30, 'PM1.0': 25, 'PM10': 50,
  'VOC': 400, 'NO2': 40, 'Temperature': 35, 'Humidity': 70
}

export default function GaugeCardPro({ label, value, max, unit, color, threshold }: Props) {
  const safeThreshold = threshold ?? INDIAN_THRESHOLDS[label as keyof typeof INDIAN_THRESHOLDS] ?? 0
  const exceeded = value > safeThreshold
  const pct = Math.min((value / max) * 100, 100)

  return (
    <div className="glass rounded-2xl p-4 sm:p-5 border border-white/10 flex flex-col h-full">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-xs sm:text-sm font-medium uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-1 text-2xl sm:text-3xl font-bold text-white">{value.toFixed(1)}</p>
          <p className="text-xs text-slate-400">{unit}</p>
        </div>
        {exceeded && <AlertCircle className="w-5 h-5 text-red-400 animate-pulse flex-shrink-0" />}
      </div>

      <div className="mt-auto">
        <div className="h-2 w-full bg-slate-700 rounded-full overflow-hidden mb-3">
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, backgroundColor: color }}
          />
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Thresh: {safeThreshold}</span>
          <span className={exceeded ? 'text-red-400 font-medium' : 'text-emerald-400'}>
            {exceeded ? 'EXCEEDED' : 'SAFE'}
          </span>
        </div>
      </div>
    </div>
  )
}