// src/lib/useRefreshInterval.ts
import { useEffect, useState } from 'react'
import { useConfigStore } from './configStore'

export function useRefreshInterval() {
  const [interval, setInterval] = useState(60 * 1000) // default 1 min

  useEffect(() => {
    const update = () => {
      const config = useConfigStore.getState().config
      setInterval(config.updateInterval * 1000)
    }

    update() // initial

    const handler = () => update()
    window.addEventListener('aqhealth-config-changed', handler)
    return () => window.removeEventListener('aqhealth-config-changed', handler)
  }, [])

  return interval
}