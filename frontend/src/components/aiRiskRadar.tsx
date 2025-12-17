// src/components/aiRiskRadar.tsx
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

interface Risk {
  condition: string
  percentage: number
}

interface Props {
  risks: Record<string, Risk[]>
}

export default function AiRiskRadar({ risks }: Props) {
  const data = Object.values(risks)
    .flat()
    .map((risk) => ({
      subject: risk.condition,
      value: risk.percentage,
      fullMark: 100,
    }))

  const uniqueData = Array.from(new Map(data.map(item => [item.subject, item])).values())

  if (uniqueData.length === 0) {
    return (
      <div className="glass rounded-2xl p-6 text-center border border-white/10">
        <p className="text-cyan-300 text-sm">No significant health risks detected</p>
      </div>
    )
  }

  return (
    <div className="glass rounded-2xl p-6 border border-white/10 h-[340px] flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-cyan-300 mb-4">AI Health Risk Radar</h3>
      </div>
      <div className="flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={uniqueData} outerRadius={90}>
            <PolarGrid stroke="#334155" strokeDasharray="4 4" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ 
                fill: '#94a3b8', 
                fontSize: 10, 
                fontWeight: 500 
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ 
                fill: '#94a3b8', 
                fontSize: 9, 
                fontWeight: 500,
                opacity: 0.5 
              }}
            />
            <Radar
              name="Risk Level"
              dataKey="value"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.5}
              strokeWidth={1}
              dot={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-3 text-xs text-slate-400 text-center">
        Top 3 risks per pollutant • Higher = Greater Risk
      </div>
    </div>
  )
}