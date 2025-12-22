// api.js
let API_BASE = '/api'  // Default: uses proxy in dev, direct in production

// Detect production (Render/Railway separate URLs)
if (window.location.hostname.includes('onrender.com') || window.location.hostname.includes('up.railway.app')) {
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://your-backend-url.onrender.com'  // Set in env or hardcode your backend URL
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