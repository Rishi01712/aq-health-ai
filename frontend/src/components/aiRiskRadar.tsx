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
    <div className="glass rounded-2xl p-4 sm:p-6 border border-white/10 h-[280px] sm:h-[340px] flex flex-col">
      <h3 className="text-base sm:text-lg font-bold text-cyan-300 mb-3 sm:mb-4">AI Health Risk Radar</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={uniqueData} outerRadius="70%">
            <PolarGrid stroke="#334155" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ 
                fill: '#94a3b8', 
                fontSize: 9,  // Smaller on all screens
                fontWeight: 500 
              }}
              tickLine={false}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ 
                fill: '#94a3b8', 
                fontSize: 8,
                opacity: 0.6 
              }}
            />
            <Radar
              name="Risk Level"
              dataKey="value"
              stroke="#06b6d4"
              fill="#06b6d4"
              fillOpacity={0.5}
              strokeWidth={2}
              dot={false}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 text-xs text-slate-400 text-center">
        Top 3 risks per pollutant • Higher = Greater Risk
      </div>
    </div>
  )
}