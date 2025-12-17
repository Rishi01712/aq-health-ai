// src/hooks/useHistoryData.ts
import { useEffect, useState } from 'react'
import { ref, onValue } from 'firebase/database'
import { db } from '@/lib/firebase'

export function useHistoryData() {
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const historyRef = ref(db, 'history')
    const unsub = onValue(historyRef, (snap) => {
      const data = snap.val()
      if (data) {
        const arr = Object.values(data).sort((a: any, b: any) => 
          (a.timestamp?.serverValue || a.timestamp || 0) - (b.timestamp?.serverValue || b.timestamp || 0)
        )
        setHistory(arr.slice(-100))
      }
    })
    return unsub
  }, [])

  return history
}