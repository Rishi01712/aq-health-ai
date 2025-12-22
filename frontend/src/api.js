const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000'
const API_BASE = `${backendUrl}/api`

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
  const res = await fetch(`${backendUrl}/health`)
  return res.json()
}