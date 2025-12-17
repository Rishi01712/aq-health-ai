// frontend/src/components/DiseaseCarousel.tsx
import { useState, useEffect } from 'react'

const diseases = [
  "Lung Cancer", "Asthma", "COPD", "Heart Disease", "Stroke", "Bronchitis"
]

export default function DiseaseCarousel() {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setIndex(i => (i + 1) % diseases.length), 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 rounded-xl shadow-lg text-center">
      <h3 className="text-lg font-semibold mb-2">High Risk Disease</h3>
      <div className="text-2xl font-bold animate-pulse">{diseases[index]}</div>
    </div>
  )
}