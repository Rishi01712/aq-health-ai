// frontend/src/utils/ModelApi.ts
const API_BASE = '/api'

export const predict = async (data: any) => {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!res.ok) throw new Error('Failed')
  return res.json()
}

export const health = async () => {
  const res = await fetch(`${API_BASE}/health`)
  return res.json()
}