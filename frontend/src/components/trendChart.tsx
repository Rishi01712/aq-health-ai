/**
 * TrendChart.tsx
 * Individual live trend chart for each sensor
 * 220 lines | Real-time | Smooth animation | Responsive
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'
import { Activity } from 'lucide-react'

interface TrendChartProps {
  sensor: string
  color: string
  unit: string
  maxValue?: number
  minValue?: number
  refreshRate?: number
}

interface DataPoint {
  time: string
  value: number
  timestamp: number
}

const TrendChart: React.FC<TrendChartProps> = ({
  sensor,
  color,
  unit,
  maxValue = 300,
  minValue = 0,
  refreshRate = 3000,
}) => {
  const [data, setData] = useState<DataPoint[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  // Generate realistic mock data
  const generateValue = () => {
    const base = maxValue * 0.3
    const variation = Math.random() * (maxValue * 0.4)
    return Number((base + variation).toFixed(1))
  }

  // Initialize with empty data
  useEffect(() => {
    const initialData: DataPoint[] = []
    const now = Date.now()
    for (let i = 9; i >= 0; i--) {
      initialData.push({
        time: new Date(now - i * refreshRate).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        value: generateValue(),
        timestamp: now - i * refreshRate,
      })
    }
    setData(initialData)
    setIsLoading(false)
  }, [refreshRate])

  // Real-time update
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setData(prev => {
        const newPoint: DataPoint = {
          time: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          value: generateValue(),
          timestamp: Date.now(),
        }
        return [...prev.slice(-9), newPoint]
      })
    }, refreshRate)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [refreshRate])

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload[0]) {
      return (
        <div className="glass p-3 rounded-lg border border-border-glow shadow-neon">
          <p className="text-xs text-gray-300">{payload[0].payload.time}</p>
          <p className="text-sm font-semibold" style={{ color }}>
            {payload[0].value} {unit}
          </p>
        </div>
      )
    }
    return null
  }

  if (isLoading) {
    return (
      <div className="glass p-6 rounded-xl flex items-center justify-center h-48">
        <Activity className="w-6 h-6 text-neon-blue animate-pulse" />
      </div>
    )
  }

  return (
    <div className="glass p-5 rounded-2xl border border-border-glow hover:shadow-neon transition-all">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold tracking-wide" style={{ color }}>
          {sensor} Trend
        </h4>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.5} />
            <XAxis
              dataKey="time"
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              interval="preserveStartEnd"
              angle={-45}
              textAnchor="end"
              height={60}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
            />
            <YAxis
              domain={[minValue, maxValue]}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              axisLine={{ stroke: '#475569' }}
              tickLine={{ stroke: '#475569' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={maxValue * 0.7} stroke="#f59e0b" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={3}
              dot={{ fill: color, r: 4, strokeWidth: 2, stroke: '#0f0f1a' }}
              activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              animationDuration={800}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Footer */}
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div className="text-center">
          <p className="text-gray-500">Avg</p>
          <p className="font-mono font-semibold" style={{ color }}>
            {data.length > 0 ? (data.reduce((a, b) => a + b.value, 0) / data.length).toFixed(1) : '0'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Max</p>
          <p className="font-mono font-semibold text-orange-400">
            {data.length > 0 ? Math.max(...data.map(d => d.value)).toFixed(1) : '0'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-gray-500">Min</p>
          <p className="font-mono font-semibold text-green-400">
            {data.length > 0 ? Math.min(...data.map(d => d.value)).toFixed(1) : '0'}
          </p>
        </div>
      </div>
    </div>
  )
}

export default TrendChart