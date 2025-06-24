import React, { useRef } from 'react'
import { Camera, Check, X, Share2, Edit3, Trash2, Calendar, Clock, Target, TrendingUp } from 'lucide-react'

const TrackingEntryCard = ({ 
  entry, 
  currentUser, 
  onContextMenu, 
  onShare, 
  onEdit, 
  onDelete,
  formatDate,
  totalCompletions = 0,
  weeklyCompletions = 0
}) => {
  const cardRef = useRef(null)

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'from-success-500 to-success-600'
      case 'done_with_photo':
        return 'from-primary-500 to-primary-600'
      case 'not_done':
        return 'from-error-500 to-error-600'
      default:
        return 'from-gray-400 to-gray-500'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <Check className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
      case 'done_with_photo':
        return <Camera className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
      case 'not_done':
        return <X className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
      default:
        return null
    }
  }

  const getWeekNumber = (date) => {
    const d = new Date(date)
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + yearStart.getDay() + 1) / 7)
    return weekNo
  }

  const canEdit = currentUser && entry.user_id === currentUser.id

  // Generate background style
  const backgroundStyle = entry.photo_url 
    ? {
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.5)), url(${entry.photo_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    : {
        background: `linear-gradient(135deg, ${
          entry.status === 'done' ? '#10b981, #059669' :
          entry.status === 'done_with_photo' ? '#3b82f6, #2563eb' :
          entry.status === 'not_done' ? '#ef4444, #dc2626' :
          '#6b7280, #4b5563'
        })`
      }

  return (
    <div
      ref={cardRef}
      onContextMenu={(e) => {
        e.preventDefault()
        onContextMenu(entry, e)
      }}
      onTouchStart={(e) => {
        const timer = setTimeout(() => {
          onContextMenu(entry, e)
        }, 800)
        e.currentTarget.dataset.timer = timer
      }}
      onTouchEnd={(e) => {
        const timer = e.currentTarget.dataset.timer
        if (timer) clearTimeout(timer)
      }}
      className="relative w-full aspect-square rounded-2xl sm:rounded-3xl overflow-hidden shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
      style={backgroundStyle}
    >
      {/* Content Overlay */}
      <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between text-white">
        {/* Top Section - Goal Info & Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="text-3xl sm:text-4xl drop-shadow-lg">
              {entry.goals?.symbol || '🎯'}
            </div>
            <div>
              <h4 className="font-bold text-lg sm:text-xl drop-shadow-lg line-clamp-1">
                {entry.goals?.name}
              </h4>
              <div className="text-sm opacity-90 drop-shadow">
                Week {getWeekNumber(entry.completed_at)}
              </div>
            </div>
          </div>
          
          <div className={`p-2 sm:p-3 rounded-full bg-gradient-to-r ${getStatusColor(entry.status)} shadow-lg`}>
            {getStatusIcon(entry.status)}
          </div>
        </div>

        {/* Middle Section - Quantity or Symbol Center */}
        <div className="flex-1 flex items-center justify-center">
          {entry.photo_url ? (
            // If there's a photo, show quantity stats if countable
            entry.goals?.is_countable && entry.quantity && entry.quantity > 1 && (
              <div className="bg-black/40 backdrop-blur-sm px-4 py-2 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold">
                    {entry.quantity}
                  </div>
                  <div className="text-sm opacity-90">
                    {entry.goals.target_unit || 'units'}
                  </div>
                </div>
              </div>
            )
          ) : (
            // If no photo, center the goal symbol prominently
            <div className="text-center">
              <div className="text-6xl sm:text-7xl drop-shadow-lg mb-2">
                {entry.goals?.symbol || '🎯'}
              </div>
              {entry.goals?.is_countable && entry.quantity && entry.quantity > 1 && (
                <div className="bg-black/40 backdrop-blur-sm px-3 py-1 rounded-lg inline-block">
                  <span className="text-lg font-bold">
                    {entry.quantity} {entry.goals.target_unit || 'units'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Section - Stats, Date, Time & Comment */}
        <div className="space-y-2">
          {/* Goal Progress Stats */}
          <div className="flex items-center justify-between space-x-2">
            {totalCompletions > 1 && (
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1">
                <Target className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {totalCompletions} total
                </span>
              </div>
            )}
            
            {weeklyCompletions > 0 && (
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span className="text-xs font-medium">
                  {weeklyCompletions} this week
                </span>
              </div>
            )}
            
            {entry.goals?.total_target && (
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-xs font-medium">
                  Target: {entry.goals.total_target}
                </span>
              </div>
            )}
            
            {entry.goals?.frequency && (
              <div className="bg-black/40 backdrop-blur-sm px-2 py-1 rounded-lg">
                <span className="text-xs font-medium">
                  {entry.goals.frequency}/week planned
                </span>
              </div>
            )}
          </div>
          
          {/* Comment */}
          {entry.comment && (
            <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
              <p className="text-sm font-medium line-clamp-2 drop-shadow">
                {entry.comment}
              </p>
            </div>
          )}
          
          {/* Date and Time */}
          <div className="flex items-center justify-between">
            <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm font-medium drop-shadow">
                  {formatDate(entry.completed_at)}
                </span>
              </div>
            </div>
            
            <div className="bg-black/40 backdrop-blur-sm px-3 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium drop-shadow">
                  {new Date(entry.completed_at).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Overlay (visible on hover) */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShare(entry)
              }}
              className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg transition-colors"
              title="Share"
            >
              <Share2 className="w-4 h-4 text-white" />
            </button>
            
            {canEdit && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(entry)
                  }}
                  className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 className="w-4 h-4 text-white" />
                </button>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    if (confirm('Are you sure you want to delete this entry?')) {
                      onDelete(entry.id)
                    }
                  }}
                  className="p-2 bg-black/60 backdrop-blur-sm hover:bg-black/80 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackingEntryCard