// src/pages/api/predict.ts → THIS IS THE ONLY FILE YOU NEED
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const response = await fetch('http://127.0.0.1:8000/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      const err = await response.text()
      throw new Error(`Backend error: ${response.status} - ${err}`)
    }

    const data = await response.json()
    return new Response(JSON.stringify(data), { status: 200 })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}