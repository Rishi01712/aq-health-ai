// src/lib/testConnection.ts
import { ref, get } from 'firebase/database'
import { db } from '@/lib/firebase'
import toast from 'react-hot-toast'

export const testFirebaseConnection = async () => {
  try {
    const snap = await get(ref(db, 'latest-reading'))
    if (!snap.exists()) {
      toast.error('No data in Firebase')
      return
    }
    const data = snap.val()
    const pm25 = data.pm25 ?? data.PM2_5 ?? 'N/A'
    const voc = data.voc ?? data.VOC ?? 'N/A'
    const temp = data.temperature ?? data.Temperature ?? 'N/A'

    toast.success(`Connected!\nPM2.5: ${pm25} µg/m³\nVOC: ${voc} ppb\nTemp: ${temp}°C`, {
      duration: 6000,
    })
  } catch {
    toast.error('Firebase connection failed')
  }
}