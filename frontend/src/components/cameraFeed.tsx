// frontend/src/components/CameraFeed.tsx

export default function CameraFeed() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-lg">
      <h3 className="text-lg font-semibold mb-3">Live Camera Feed</h3>
      <div className="relative">
        <img src="/camera.jpg" alt="Live Feed" className="w-full rounded-lg" />
        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-semibold animate-pulse">
          LIVE
        </div>
      </div>
    </div>
  )
}