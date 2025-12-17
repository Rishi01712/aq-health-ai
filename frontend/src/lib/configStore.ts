// src/lib/configStore.ts → FINAL VERSION (NO TS ERRORS + saveConfig works)
import { create } from "zustand"

export interface AppConfig {
  useFirebase: boolean
  fbUrl: string
  wsUrl: string | null
  updateInterval: number
  notifications: boolean
  preferFirebaseData: boolean
}

const defaultConfig: AppConfig = {
  useFirebase: true,
  fbUrl: "https://aq-health-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  wsUrl: null,
  updateInterval: 60,
  notifications: true,
  preferFirebaseData: true,
}

export const useConfigStore = create<{
  config: AppConfig
  setConfig: (c: Partial<AppConfig>) => void
  loadConfig: () => void
  saveConfig: () => void    // ← ADDED THIS LINE
}>((set, get) => ({
  config: defaultConfig,

  setConfig: (newConfig) =>
    set((state) => {
      const updated = { ...state.config, ...newConfig }
      localStorage.setItem("aqhealth-config", JSON.stringify(updated))
      window.dispatchEvent(new CustomEvent("aqhealth-config-changed"))
      return { config: updated }
    }),

  loadConfig: () => {
    const saved = localStorage.getItem("aqhealth-config")
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        set({ config: { ...defaultConfig, ...parsed } })
      } catch (e) {
        console.error("Failed to load config")
      }
    }
  },

  // ← NEW: Explicit save (for Save button feedback)
  saveConfig: () => {
    const current = get().config
    localStorage.setItem("aqhealth-config", JSON.stringify(current))
    window.dispatchEvent(new CustomEvent("aqhealth-config-changed"))
  },
}))