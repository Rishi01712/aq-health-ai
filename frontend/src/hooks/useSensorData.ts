// src/hooks/useSensorData.ts
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'
import { useConfigStore } from '@/lib/configStore'
import { FirebaseLiveData, SensorData } from '@/types/sensorData'

export function useSensorData() {
  const { config } = useConfigStore()
  const [data, setData] = useState<SensorData | null>(null)
  const [loading, setLoading] = useState(true)
  const [source, setSource] = useState<'Firebase (Demo)' | 'Hardware (Live)'>('Firebase (Demo)')

  useEffect(() => {
    const liveRef = ref(db, 'live')

    const unsub = onValue(liveRef, (snapshot) => {
      const raw = snapshot.val() as FirebaseLiveData | null

      if (!raw) {
        setLoading(false)
        return
      }

      // Map Firebase lowercase → Your app uppercase
      const mapped: SensorData = {
        PM1_0: raw.pm1,
        PM2_5: raw.pm25,
        PM10: raw.pm10,
        VOC: raw.voc,
        NO2: raw.no2,
        Humidity: raw.humidity,
        Temperature: raw.temperature,
        ai_prediction: {
          aqi: raw.aqi,
          aqi_category: raw.category,
          aqi_breakdown: {
            'PM2.5': Math.round(raw.pm25),
            'PM10': Math.round(raw.pm10),
            'NO2': Math.round(raw.no2),
          },
          high_risks: {
            PM2_5: raw.pm25 > 50 ? ['Asthma Attack', 'Heart Disease', 'Lung Cancer Risk'] : [],
            PM10: raw.pm10 > 100 ? ['Respiratory Issues', 'Eye Irritation'] : [],
            VOC: raw.voc > 400 ? ['Headache', 'Nausea'] : [],
            NO2: raw.no2 > 40 ? ['Lung Damage', 'Asthma'] : [],
            Temperature: raw.temperature > 38 ? ['Heat Stroke Risk'] : [],
          },
          risk_percentages: {
            PM2_5: {
              'Asthma Attack': raw.pm25 > 50 ? 85 : 0,
              'Heart Disease': raw.pm25 > 50 ? 78 : 0,
              'Lung Cancer Risk': raw.pm25 > 100 ? 92 : 0,
            },
            PM10: { 'Respiratory Issues': raw.pm10 > 100 ? 70 : 0 },
            VOC: { 'Headache': raw.voc > 400 ? 55 : 0 },
            NO2: { 'Lung Damage': raw.no2 > 40 ? 60 : 0 },
            Temperature: { 'Heat Stroke Risk': raw.temperature > 38 ? 88 : 0 },
          },
        },
      }

      setData(mapped)
      setSource(config.preferFirebaseData ? 'Firebase (Demo)' : 'Hardware (Live)')
      setLoading(false)
    })

    return () => unsub()
  }, [config.preferFirebaseData])

  return { data, loading, source }
}