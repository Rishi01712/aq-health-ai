// src/api.js
const BACKEND_URL = "https://aq-health-ai-backend.onrender.com"  // <-- YOUR RENDER BACKEND URL

const API_BASE = `${BACKEND_URL}/api`

export const predict = async (data) => {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Prediction failed: ${res.status} ${err}`)
  }
  return res.json()
}

export const health = async () => {
  const res = await fetch(`${BACKEND_URL}/health`)
  return res.json()
}