import React, { useState, useEffect, useRef } from 'react'
import { X, BarChart3, Share2, Download, Calendar, Camera, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const GoalFeed = ({ goal, isOpen, onClose }) => {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [sharing, setSharing] = useState(false)
  const canvasRef = useRef(null)

  useEffect(() => {
    if (isOpen && goal) {
      fetchGoalEntries()
    }
  }, [isOpen, goal])

  const fetchGoalEntries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('goal_entries')
        .select('*')
        .eq('goal_id', goal.id)
        .order('completed_at', { ascending: false })

      if (error) {
        throw error
      }

      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching goal entries:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-5 h-5 text-success-600" />
      case 'done_with_photo':
        return <Camera className="w-5 h-5 text-primary-600" />
      case 'not_done':
        return <XCircle className="w-5 h-5 text-error-600" />
      default:
        return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'bg-success-50 border-success-200'
      case 'done_with_photo':
        return 'bg-primary-50 border-primary-200'
      case 'not_done':
        return 'bg-error-50 border-error-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'done':
        return 'Completed'
      case 'done_with_photo':
        return 'Completed with Photo'
      case 'not_done':
        return 'Not Done'
      default:
        return 'Unknown'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Today'
    if (diffDays === 2) return 'Yesterday'
    if (diffDays <= 7) return `${diffDays - 1} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  const getWeekNumber = (date) => {
    const d = new Date(date)
    const yearStart = new Date(d.getFullYear(), 0, 1)
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + yearStart.getDay() + 1) / 7)
    return weekNo
  }

  const generateShareImage = async (entry) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    canvas.width = 800
    canvas.height = 600

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 800, 600)
    gradient.addColorStop(0, '#667eea')
    gradient.addColorStop(1, '#764ba2')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 600)

    // Add goal emoji/symbol
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    const emoji = goal.symbol || goal.emoji || '🎯'
    ctx.fillText(emoji, 400, 180)

    // Add goal title
    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(goal.name || goal.title, 400, 260)

    // Add status
    ctx.font = '36px Arial'
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(getStatusText(entry.status), 400, 320)

    // Add date and week
    ctx.font = '28px Arial'
    const date = formatDate(entry.completed_at)
    const week = getWeekNumber(entry.completed_at)
    ctx.fillText(`${date} • Week ${week}`, 400, 370)

    // Add photo if available
    if (entry.photo_url) {
      try {
        const img = new Image()
        img.crossOrigin = 'anonymous'
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
          img.src = entry.photo_url
        })

        // Draw photo in a circle
        ctx.save()
        ctx.beginPath()
        ctx.arc(400, 450, 60, 0, 2 * Math.PI)
        ctx.clip()
        ctx.drawImage(img, 340, 390, 120, 120)
        ctx.restore()

        // Add border around photo
        ctx.beginPath()
        ctx.arc(400, 450, 60, 0, 2 * Math.PI)
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 4
        ctx.stroke()
      } catch (error) {
        console.error('Error loading photo for share image:', error)
      }
    }

    // Add MindStory branding
    ctx.font = '24px Arial'
    ctx.fillStyle = '#cbd5e0'
    ctx.fillText('MindStory', 400, 550)

    return canvas.toDataURL('image/png')
  }

  const shareEntry = async (entry) => {
    try {
      setSharing(true)
      
      const shareText = `🎯 ${goal.name || goal.title}\n${getStatusText(entry.status)} on ${formatDate(entry.completed_at)}\n\n#MindStory #Goals #Progress`
      
      if (navigator.share) {
        const shareData = {
          title: `${goal.name || goal.title} - ${getStatusText(entry.status)}`,
          text: shareText,
          url: window.location.href
        }

        // Try to generate and share image
        try {
          const imageDataUrl = await generateShareImage(entry)
          if (imageDataUrl) {
            const response = await fetch(imageDataUrl)
            const blob = await response.blob()
            const file = new File([blob], 'goal-progress.png', { type: 'image/png' })
            
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
              shareData.files = [file]
            }
          }
        } catch (imageError) {
          console.error('Error generating share image:', imageError)
        }

        await navigator.share(shareData)
      } else {
        // Fallback for browsers without Web Share API
        const imageDataUrl = await generateShareImage(entry)
        if (imageDataUrl) {
          // Create download link
          const link = document.createElement('a')
          link.download = `${goal.name || goal.title}-progress.png`
          link.href = imageDataUrl
          link.click()
        }

        // Copy text to clipboard
        if (navigator.clipboard) {
          await navigator.clipboard.writeText(shareText)
          alert('Progress text copied to clipboard!')
        } else {
          alert('Sharing not supported. Please copy this text:\n\n' + shareText)
        }
      }
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error sharing:', error)
        alert('Error sharing progress. Please try again.')
      }
    } finally {
      setSharing(false)
    }
  }

  const completedEntries = entries.filter(e => e.status === 'done' || e.status === 'done_with_photo')
  const photoEntries = entries.filter(e => e.status === 'done_with_photo')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-600 text-white p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-5xl">
                {goal?.symbol || goal?.emoji || '🎯'}
              </div>
              <div>
                <h2 className="text-3xl font-bold">{goal?.name || goal?.title}</h2>
                <p className="text-primary-100 text-lg">Progress Feed</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-xl transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold">{entries.length}</div>
              <div className="text-base text-primary-100">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{completedEntries.length}</div>
              <div className="text-base text-primary-100">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold">{photoEntries.length}</div>
              <div className="text-base text-primary-100">With Photos</div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600 font-medium">Loading entries...</span>
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="text-error-600 mb-6">
                <p className="font-semibold text-lg">Error loading entries</p>
                <p className="text-base">{error}</p>
              </div>
              <button 
                onClick={fetchGoalEntries}
                className="btn-primary bg-gradient-to-r from-error-500 to-error-600"
              >
                Try Again
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <TrendingUp className="w-16 h-16 mx-auto mb-6 text-gray-300" />
              <p className="text-xl font-semibold">No entries yet</p>
              <p className="text-base">Start tracking this goal to see your progress here!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {entries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-xl border-2 p-6 transition-all duration-300 hover:shadow-soft-lg ${getStatusColor(entry.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        {getStatusIcon(entry.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                          <h4 className="font-semibold text-lg text-gray-800">
                            {getStatusText(entry.status)}
                          </h4>
                          <span className="text-base text-gray-500">
                            Week {getWeekNumber(entry.completed_at)}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-base text-gray-600">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{formatDate(entry.completed_at)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4" />
                            <span>
                              {new Date(entry.completed_at).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit',
                                hour12: true
                              })}
                            </span>
                          </div>
                        </div>

                        {entry.photo_url && (
                          <div className="mt-4">
                            <img
                              src={entry.photo_url}
                              alt="Goal completion photo"
                              className="w-24 h-24 object-cover rounded-xl cursor-pointer hover:opacity-80 transition-opacity shadow-soft"
                              onClick={() => setSelectedPhoto(entry.photo_url)}
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => shareEntry(entry)}
                      disabled={sharing}
                      className="btn-secondary flex items-center space-x-2 disabled:opacity-50"
                    >
                      {sharing ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                      ) : (
                        <Share2 className="w-4 h-4 text-gray-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">Share</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Hidden canvas for image generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black/80 z-60 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={selectedPhoto}
              alt="Goal completion photo"
              className="max-w-full max-h-full object-contain rounded-xl shadow-glow-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-3 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default GoalFeed