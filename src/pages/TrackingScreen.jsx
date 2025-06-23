import React from 'react'
import { Camera, Check, X, Upload } from 'lucide-react'

const TrackingScreen = () => {
  const fileInputRef = React.useRef(null)

  const handlePhotoConfirmClick = () => {
    // Direct call without any delays - this maintains the user gesture chain
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  // Stats Overlay Component
  const StatsOverlay = ({ entry }) => {
    const [weeklyProgress, setWeeklyProgress] = React.useState(null)
    const [totalProgress, setTotalProgress] = React.useState(null)
    
    React.useEffect(() => {
      if (entry.goal_id) {
        getWeeklyProgress(entry.goal_id, entry.completed_at).then(setWeeklyProgress)
        getTotalProgress(entry.goal_id).then(setTotalProgress)
      }
    }, [entry.goal_id, entry.completed_at])
    
    return (
      <>
        {weeklyProgress && weeklyProgress.target > 0 && (
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            📊 {weeklyProgress.current}/{weeklyProgress.target} this week
          </div>
        )}
        {totalProgress && totalProgress.target > 0 && (
          <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
            🎯 {totalProgress.current}/{totalProgress.target} {entry.goals?.target_unit || 'total'}
          </div>
        )}
        <div className="bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full">
          🕐 {new Date(entry.completed_at).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          })}
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Track Your Progress</h1>
            <p className="text-gray-600">Record your achievement</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={handlePhotoConfirmClick}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center gap-3"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <div className="flex gap-3">
              <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
                <Check className="w-4 h-4" />
                Done
              </button>
              <button className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-3 px-4 rounded-xl transition-colors duration-200 flex items-center justify-center gap-2">
                <X className="w-4 h-4" />
                Skip
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackingScreen