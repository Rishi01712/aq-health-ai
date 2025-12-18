// frontend/src/api.js
const BACKEND_URL = "https://aq-health-ai-backend.onrender.com" 

const API_BASE = `${BACKEND_URL}/api`

export const predict = async (data) => {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Prediction failed')
  return res.json()
}

export const health = async () => {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}