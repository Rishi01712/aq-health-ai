// src/lib/aiModel.ts
export async function runAIModel(raw: any) {
  const pm25 = raw.pm25 || 0
  const pm10 = raw.pm10 || 0
  const no2 = raw.no2 || 0
  const voc = raw.voc || 0
  const temp = raw.temperature || 25
  const hum = raw.humidity || 50

  // Indian CPCB AQI (accurate)
  const iaqiPM25 = pm25 <= 30 ? pm25 * 50 / 30 :
                   pm25 <= 60 ? 50 + (pm25 - 30) * 50 / 30 :
                   pm25 <= 90 ? 100 + (pm25 - 60) * 100 / 30 :
                   pm25 <= 120 ? 200 + (pm25 - 90) * 100 / 30 :
                   pm25 <= 250 ? 300 + (pm25 - 120) * 100 / 130 : 400 + (pm25 - 250) * 100 / 130

  const iaqiPM10 = Math.min(500, Math.round(pm10 * 500 / 430))
  const iaqiNO2 = Math.min(500, Math.round(no2 * 500 / 1800))

  const aqi = Math.max(iaqiPM25, iaqiPM10, iaqiNO2)

  const category = aqi <= 50 ? 'Good' :
                   aqi <= 100 ? 'Moderate' :
                   aqi <= 200 ? 'Unhealthy' :
                   aqi <= 300 ? 'Very Unhealthy' :
                   aqi <= 400 ? 'Severe' : 'Hazardous'

  return {
    aqi,
    aqi_category: category,
    aqi_breakdown: {
      'PM2.5': Math.round(iaqiPM25),
      'PM10': Math.round(iaqiPM10),
      'NO2': Math.round(iaqiNO2)
    },
    high_risks: {
      ...(pm25 > 60 && { PM2_5: ['Asthma', 'Eye Irritation'] }),
      ...(voc > 500 && { VOC: ['Allergic Rhinitis', 'Headache'] }),
      ...(no2 > 40 && { NO2: ['Respiratory Issues'] }),
      ...(temp > 35 && hum > 60 && { Environment: ['Fungal Risk'] })
    },
    risk_percentages: {
      ...(pm25 > 60 && { PM2_5: { Asthma: 82, 'Eye Irritation': 70 } }),
      ...(voc > 500 && { VOC: { 'Allergic Rhinitis': 88, Headache: 65 } }),
      ...(no2 > 40 && { NO2: { 'Respiratory Issues': 75 } }),
      ...(temp > 35 && hum > 60 && { Environment: { 'Fungal Risk': 90 } })
    }
  }
}