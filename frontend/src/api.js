// api.js
let API_BASE = '/api'

if (window.location.hostname.includes('onrender.com')){
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://aq-health-ai-backend.onrender.com/'
  API_BASE = `${BACKEND_URL}/api`
}

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
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Health check failed')
  return res.json()
}