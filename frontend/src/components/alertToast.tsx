// src/components/alertToast.tsx
'use client'

import { useEffect, useRef } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface Alert {
  id: string
  message: string
  type: 'warning' | 'danger'
}

interface Props {
  alerts: Alert[]
  onDismiss: (id: string) => void
  autoDismissMs?: number
}

export default function AlertToast({ 
  alerts, 
  onDismiss, 
  autoDismissMs = 10000 
}: Props) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // This effect runs every time alerts actually change
  useEffect(() => {
    // Clear old timer
    if (timerRef.current) clearTimeout(timerRef.current)

    if (alerts.length === 0 || autoDismissMs <= 0) return

    // Set new timer to dismiss the OLDEST alert
    timerRef.current = setTimeout(() => {
      onDismiss(alerts[0].id)
    }, autoDismissMs)

    // Cleanup on unmount or new alerts
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [alerts, onDismiss, autoDismissMs])  // ← alerts as full dependency (this works now)

  if (alerts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 space-y-3 z-50 pointer-events-none">
      {alerts.map((alert, index) => (
        <div
          key={alert.id}
          className={`glass rounded-xl p-4 flex items-center gap-3 shadow-2xl border-l-4 transition-all animate-slide-in-right pointer-events-auto max-w-sm ${
            alert.type === 'danger' ? 'border-red-500' : 'border-amber-500'
          }`}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${alert.type === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
          <p className="text-sm font-medium text-white pr-4">{alert.message}</p>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDismiss(alert.id)
            }}
            className="ml-auto flex-shrink-0"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-white transition" />
          </button>
        </div>
      ))}
    </div>
  )
}