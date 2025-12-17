// src/lib/useConfigListener.ts
import { useEffect } from 'react'
import { useConfigStore } from './configStore'

export function useConfigListener() {
  useEffect(() => {
    const handleChange = () => {
      // Force re-render when config changes
      useConfigStore.getState()
    }

    window.addEventListener('aqhealth-config-changed', handleChange)
    return () => window.removeEventListener('aqhealth-config-changed', handleChange)
  }, [])
}