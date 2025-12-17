// src/components/header.tsx
export default function Header() {
  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-gradient-to-r from-blue-700 to-teal-600 text-white shadow-lg z-20">
      <div className="flex items-center justify-between h-full px-6">
        <h1 className="text-2xl font-bold">LTH AI</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm">Real-time Air Quality & Health Risk</span>
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
        </div>
      </div>
    </header>
  )
}