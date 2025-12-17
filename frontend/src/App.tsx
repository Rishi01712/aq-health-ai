// src/App.tsx → FULL 160+ LINES, ONLY Analytics FIXED
import { useState } from 'react'
import Sidebar from './components/sidebar'
import Overview from './pages/Overview'
import Analytics from './pages/Analytics'
import AIInsights from './pages/AiInsights'
import SettingsPage from './pages/Settings';
import { Activity } from 'lucide-react'
import { Alert } from './types/sensorData'

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'models' | 'settings'>('overview')
  const [alerts, setAlerts] = useState<Alert[]>([])

  // Dummy data for Analytics page (you can make it real later)

  const dismiss = (id: string) => {
    setAlerts(a => a.filter(x => x.id !== id))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* HEADER */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700 z-50 px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
              AQ-HEALTH AI
            </h1>
            <p className="text-xs text-gray-400">Real-time Air Quality Intelligence</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-400">Live • Real Sensor</span>
          </div>
        </div>
      </header>

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="ml-64 pt-20 p-6">
        <div className="max-w-7xl mx-auto">
          {activeTab === 'overview' && (
            <Overview alerts={alerts} onDismiss={dismiss} />
          )}

          {activeTab === 'analytics' && (<Analytics /> )}

          {activeTab === 'models' && <AIInsights />}

          {activeTab === 'settings' && <SettingsPage />}
        </div>
      </main>
    </div>
  )
}