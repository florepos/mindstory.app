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

export default TrackingScreen