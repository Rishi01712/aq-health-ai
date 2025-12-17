// src/components/sidebar.tsx
import { Home, BarChart3, Brain, Settings, ChevronRight } from 'lucide-react'

type Tab = 'overview' | 'analytics' | 'models' | 'settings'

interface SidebarProps {
  activeTab: Tab
  setActiveTab: (tab: Tab) => void
}

export default function Sidebar({ activeTab, setActiveTab }: SidebarProps) {
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: Home },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'models', label: 'AI Models', icon: Brain },
    { id: 'settings', label: 'Settings', icon: Settings },
  ]

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-slate-900/95 pt-20 backdrop-blur-xl border-r border-slate-800">
      <nav className="space-y-2 p-4">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`group flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5" />
              <span className="font-medium">{label}</span>
            </div>
            {activeTab === id && <ChevronRight className="h-4 w-4" />}
          </button>
        ))}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 border-t border-slate-800 p-4">
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600"></div>
          <div>
            <p className="font-medium text-slate-300">LTH Sensor Node</p>
            <p>v2.4.1 • Online</p>
          </div>
        </div>
      </div>
    </aside>
  )
}