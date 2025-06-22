import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Camera, Check, X, Share2, Edit3, Trash2, Calendar, Target, TrendingUp, Award, Heart, Sparkles, ArrowLeft, Filter, MessageCircle, Upload, Brain, User } from 'lucide-react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { supabase } from '../services/supabaseClient'
import CreateGoalModal from '../components/CreateGoalModal'
import UnifiedTrackingButton from '../components/UnifiedTrackingButton'
import { formatDate } from '../utils/date'

const TrackingScreen = ({ onBack }) => {
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0)
  const [goals, setGoals] = useState([])
  const [entries, setEntries] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [trackingAction, setTrackingAction] = useState(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [shareMode, setShareMode] = useState('single')
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [comment, setComment] = useState('')
  const [pendingEntry, setPendingEntry] = useState(null)
  const [filterMode, setFilterMode] = useState('current') // 'current' or 'all'
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const goalScrollRef = useRef(null)
  const feedRef = useRef(null)
  const fileInputRef = useRef(null)
  const canvasRef = useRef(null)

  // Translations (prepared for i18n)
  const t = {
    trackProgress: 'Track Progress',
    yourDailyJourney: 'Your daily journey',
    selectGoal: 'Select Goal',
    recentActivity: 'Recent Activity',
    swipeToShare: 'Swipe horizontally to share',
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    thisWeek: 'this week',
    total: 'total',
    completed: 'Completed',
    completedWithPhoto: 'Completed with Photo',
    notDone: 'Not Done',
    markedAsDone: 'Marked as Done!',
    doneWithPhoto: 'Done with Photo!',
    markedAsNotDone: 'Marked as Not Done',
    addComment: 'Add Comment',
    optional: 'Optional',
    save: 'Save',
    cancel: 'Cancel',
    shareProgress: 'Share Progress',
    shareEntry: 'Share this entry',
    shareFeed: 'Share your feed',
    shareNow: 'Share Now',
    currentGoal: 'Current Goal',
    allGoals: 'All Goals',
    createGoal: 'Create Goal',
    editGoal: 'Edit Goal',
    deleteGoal: 'Delete',
    goalDetails: 'Goal Details',
    uploadingPhoto: 'Uploading photo...',
    clickOrDrag: 'Click or drag to track',
    dragToTrack: 'Drag to track button'
  }

  useEffect(() => {
    fetchGoals()
    fetchUserProfile()
  }, [])

  useEffect(() => {
    if (goals.length > 0) {
      fetchEntries()
      fetchCollaborators()
    }
  }, [goals, selectedGoalIndex, filterMode])

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) return

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchGoals = async () => {
    try {
      setLoading(true)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setGoals([])
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setGoals(data || [])
    } catch (error) {
      console.error('Error fetching goals:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchEntries = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setEntries([])
        return
      }

      let query = supabase
        .from('goal_entries')
        .select(`
          *,
          goals (
            id,
            name,
            symbol
          )
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(20)

      if (filterMode === 'current' && goals[selectedGoalIndex]) {
        query = query.eq('goal_id', goals[selectedGoalIndex].id)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      setEntries(data || [])
    } catch (error) {
      console.error('Error fetching entries:', error)
    }
  }

  const fetchCollaborators = async () => {
    if (!goals[selectedGoalIndex] || goals[selectedGoalIndex].goal_type !== 'friends') {
      setCollaborators([])
      return
    }

    try {
      const { data, error } = await supabase
        .from('goal_collaborators')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('goal_id', goals[selectedGoalIndex].id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true })

      if (error) throw error
      setCollaborators(data || [])
    } catch (error) {
      console.error('Error fetching collaborators:', error)
    }
  }

  const selectedGoal = goals[selectedGoalIndex]

  // Goal scroll handlers
  const scrollGoalsLeft = () => {
    if (goalScrollRef.current) {
      goalScrollRef.current.scrollBy({ left: -200, behavior: 'smooth' })
    }
  }

  const scrollGoalsRight = () => {
    if (goalScrollRef.current) {
      goalScrollRef.current.scrollBy({ left: 200, behavior: 'smooth' })
    }
  }

  // Long press handlers
  const handleGoalPress = (index) => {
    const timer = setTimeout(() => {
      setSelectedGoalIndex(index)
      setShowGoalModal(true)
    }, 500)
    setLongPressTimer(timer)
  }

  const handleGoalRelease = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Photo upload
  const uploadPhoto = async (file) => {
    try {
      setUploadingPhoto(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedGoal.id}_${Date.now()}.${fileExt}`
      const filePath = `goal-photos/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('goal-photos')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('goal-photos')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedGoal) return

    try {
      const photoUrl = await uploadPhoto(file)
      setPendingEntry({
        status: 'done_with_photo',
        photo_url: photoUrl
      })
      setShowCommentModal(true)
    } catch (error) {
      console.error('Error handling photo upload:', error)
    }

    event.target.value = ''
  }

  const saveEntry = async () => {
    if (!pendingEntry || !selectedGoal) return

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to track goals')
      }

      const entryData = {
        goal_id: selectedGoal.id,
        user_id: user.id,
        status: pendingEntry.status,
        completed_at: new Date().toISOString()
      }

      if (pendingEntry.photo_url) {
        entryData.photo_url = pendingEntry.photo_url
      }

      if (comment.trim()) {
        entryData.comment = comment.trim()
      }

      const { data, error } = await supabase
        .from('goal_entries')
        .insert([entryData])
        .select()

      if (error) {
        throw error
      }

      // Reset states
      setPendingEntry(null)
      setComment('')
      setShowCommentModal(false)
      
      // Refresh entries
      fetchEntries()

      // Show success feedback
      setTrackingAction(pendingEntry.status)
      setTimeout(() => setTrackingAction(null), 2000)

    } catch (error) {
      console.error('Error saving entry:', error)
    }
  }

  // Handle unified tracking button actions
  const handleTrackingAction = async (action, needsComment = false) => {
    if (!selectedGoal) return

    if (action === 'done_with_photo') {
      fileInputRef.current?.click()
    } else {
      setPendingEntry({ status: action })
      if (needsComment) {
        setShowCommentModal(true)
      } else {
        await saveEntry()
      }
    }
  }

  // Handle photo capture from unified button
  const handlePhotoCapture = () => {
    fileInputRef.current?.click()
  }

  // Feed swipe handler for sharing
  const feedDragHandler = useDrag(
    ({ active, movement: [mx], direction: [dx], velocity: [vx] }) => {
      if (!active && Math.abs(vx) > 0.5 && Math.abs(mx) > 100) {
        if (dx > 0) {
          // Swipe right - share feed
          setShareMode('feed')
          setShowShareModal(true)
        } else {
          // Swipe left - share single
          setShareMode('single')
          setShowShareModal(true)
        }
      }
    }
  )

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

  const getStatusText = (status) => {
    switch (status) {
      case 'done':
        return t.completed
      case 'done_with_photo':
        return t.completedWithPhoto
      case 'not_done':
        return t.notDone
      default:
        return 'Unknown'
    }
  }

  const getTrackingFeedback = () => {
    switch (trackingAction) {
      case 'done':
        return { text: t.markedAsDone, color: 'from-success-500 to-success-600', icon: Check }
      case 'done_with_photo':
        return { text: t.doneWithPhoto, color: 'from-primary-500 to-primary-600', icon: Camera }
      case 'not_done':
        return { text: t.markedAsNotDone, color: 'from-error-500 to-error-600', icon: X }
      default:
        return null
    }
  }


  // WhatsApp sharing with image generation
  const generateShareImage = async (entry) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const ctx = canvas.getContext('2d')
    canvas.width = 800
    canvas.height = 600

    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 800, 600)
    gradient.addColorStop(0, '#f97316')
    gradient.addColorStop(0.5, '#ec4899')
    gradient.addColorStop(1, '#8b5cf6')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 800, 600)

    // Add goal emoji/symbol
    ctx.font = 'bold 120px Arial'
    ctx.textAlign = 'center'
    ctx.fillStyle = '#ffffff'
    const emoji = entry.goals?.symbol || '🎯'
    ctx.fillText(emoji, 400, 180)

    // Add goal title
    ctx.font = 'bold 48px Arial'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(entry.goals?.name || 'Goal', 400, 260)

    // Add status
    ctx.font = '36px Arial'
    ctx.fillStyle = '#e2e8f0'
    ctx.fillText(getStatusText(entry.status), 400, 320)

    // Add date
    ctx.font = '28px Arial'
    const date = formatDate(entry.completed_at, {
      today: t.today,
      yesterday: t.yesterday,
      daysAgo: t.daysAgo,
    })
    ctx.fillText(date, 400, 370)

    // Add MindStory branding
    ctx.font = '24px Arial'
    ctx.fillStyle = '#cbd5e0'
    ctx.fillText('MindStory', 400, 550)

    return canvas.toDataURL('image/png')
  }

  const shareToWhatsApp = async (entry) => {
    try {
      const shareText = `🎯 ${entry.goals?.name || 'Goal'}\n${getStatusText(entry.status)} on ${formatDate(entry.completed_at, {
        today: t.today,
        yesterday: t.yesterday,
        daysAgo: t.daysAgo,
      })}\n\n#MindStory #Goals #Progress`
      
      // Generate image
      const imageDataUrl = await generateShareImage(entry)
      
      if (navigator.share && imageDataUrl) {
        try {
          const response = await fetch(imageDataUrl)
          const blob = await response.blob()
          const file = new File([blob], 'mindstory-progress.png', { type: 'image/png' })
          
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: `${entry.goals?.name} - ${getStatusText(entry.status)}`,
              text: shareText,
              files: [file]
            })
            return
          }
        } catch (shareError) {
          console.error('Error sharing with files:', shareError)
        }
      }

      // Fallback to WhatsApp Web
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`
      window.open(whatsappUrl, '_blank')
      
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error)
    }
  }

  const handleGoalCreated = (newGoal) => {
    setGoals(prev => [newGoal, ...prev])
    setSelectedGoalIndex(0)
    setShowCreateModal(false)
    fetchEntries()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-yellow-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your goals...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-yellow-50/50 relative overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-orange-200/30 to-rose-200/30 rounded-full blur-xl floating-element"></div>
        <div className="absolute top-40 right-4 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-xl floating-element" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-24 sm:w-40 h-24 sm:h-40 bg-gradient-to-br from-rose-200/20 to-yellow-200/20 rounded-full blur-2xl floating-element" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Header - Matching homescreen design */}
      <header className="glass-card sticky top-0 z-50 border-b-0 rounded-none backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-2 sm:space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 sm:p-3 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl sm:rounded-2xl"
                >
                  <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
                </button>
              )}
              <div className="relative">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-xl sm:rounded-2xl shadow-premium pulse-glow">
                  <Brain className="w-5 sm:w-8 h-5 sm:h-8 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-gradient-to-r from-success-400 to-success-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold gradient-text-premium">
                  {t.trackProgress}
                </h1>
                <p className="text-xs text-gray-600 font-medium hidden sm:block">{t.yourDailyJourney}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <div className="glass-card rounded-full px-2 sm:px-4 py-1 sm:py-2 shimmer">
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <Heart className="w-3 sm:w-4 h-3 sm:h-4 text-rose-500 animate-pulse-soft" />
                  <span className="text-xs font-bold text-gray-700">Day 24</span>
                </div>
              </div>
              
              {userProfile?.avatar_url && (
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-premium">
                  <img
                    src={userProfile.avatar_url}
                    alt={userProfile.display_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Goal Selection - Matching homescreen patterns */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-2xl sm:rounded-3xl shadow-premium">
                <Target className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold gradient-text-premium">{t.selectGoal}</h2>
                <p className="text-base sm:text-lg text-gray-600">Choose your focus for today</p>
              </div>
            </div>
            <div className="flex space-x-3 sm:space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-3 sm:p-4 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl sm:rounded-2xl flex items-center justify-center"
                title="Create new goal"
              >
                <Plus className="w-5 sm:w-6 h-5 sm:h-6 text-primary-600" />
              </button>
              <button
                onClick={scrollGoalsLeft}
                className="p-3 sm:p-4 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl sm:rounded-2xl"
              >
                <ChevronLeft className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
              </button>
              <button
                onClick={scrollGoalsRight}
                className="p-3 sm:p-4 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl sm:rounded-2xl"
              >
                <ChevronRight className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div 
            ref={goalScrollRef}
            className="flex space-x-6 sm:space-x-8 overflow-x-auto scrollbar-hide pb-6"
          >
            {goals.map((goal, index) => {
              const isSelected = selectedGoalIndex === index
              
              return (
                <div
                  key={goal.id}
                  onMouseDown={() => handleGoalPress(index)}
                  onMouseUp={handleGoalRelease}
                  onMouseLeave={handleGoalRelease}
                  onTouchStart={() => handleGoalPress(index)}
                  onTouchEnd={handleGoalRelease}
                  onClick={() => setSelectedGoalIndex(index)}
                  className={`flex-shrink-0 w-64 sm:w-80 rounded-2xl sm:rounded-3xl shadow-premium hover:shadow-premium-lg transition-all duration-500 transform hover:scale-105 border cursor-pointer relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white shadow-premium-xl pulse-glow' 
                      : 'glass-card glass-card-hover'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10 p-8 sm:p-10">
                    <div className="text-center mb-6 sm:mb-8">
                      <div className={`text-5xl sm:text-6xl mb-4 sm:mb-6 transition-all duration-500 ${
                        isSelected ? 'animate-pulse-soft scale-110' : 'group-hover:scale-110'
                      }`}>
                        {goal.symbol || '🎯'}
                      </div>
                      <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-gray-800'
                      }`}>
                        {goal.name}
                      </h3>
                      {goal.description && (
                        <p className={`text-sm sm:text-base line-clamp-3 ${
                          isSelected ? 'text-white/90' : 'text-gray-600'
                        }`}>
                          {goal.description}
                        </p>
                      )}
                    </div>

                    {isSelected && (
                      <div className="text-center">
                        <div className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-full text-sm sm:text-base font-semibold bg-white/20 text-white">
                          <div className="w-2 sm:w-3 h-2 sm:h-3 bg-white rounded-full mr-2 sm:mr-3 animate-pulse"></div>
                          Selected for tracking
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Unified Tracking Interface */}
      <section className="relative z-20 flex justify-center py-12 sm:py-16 lg:py-20">
        <div className="text-center">
          <UnifiedTrackingButton
            onTrackingAction={handleTrackingAction}
            onPhotoCapture={handlePhotoCapture}
            selectedGoal={selectedGoal}
            disabled={!selectedGoal}
          />
          
          {/* Tracking Feedback */}
          {trackingAction && (
            <div className="mt-8 animate-scale-in">
              <div className={`px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r ${getTrackingFeedback().color} shadow-premium-lg`}>
                <div className="flex items-center justify-center space-x-3">
                  {React.createElement(getTrackingFeedback().icon, { className: "w-5 h-5" })}
                  <span className="text-base">{getTrackingFeedback().text}</span>
                </div>
              </div>
            </div>
          )}

          {uploadingPhoto && (
            <div className="mt-8 animate-scale-in">
              <div className="px-6 py-3 rounded-full text-white font-semibold bg-gradient-to-r from-primary-500 to-primary-600 shadow-premium-lg">
                <div className="flex items-center justify-center space-x-3">
                  <Upload className="w-5 h-5 animate-bounce" />
                  <span className="text-base">{t.uploadingPhoto}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tracking Feed - Updated with 1:1 aspect ratio for photos */}
      <div 
        {...feedDragHandler()}
        ref={feedRef}
        className="relative z-10 bg-white/60 backdrop-blur-xl rounded-t-2xl sm:rounded-t-3xl shadow-premium-xl min-h-screen pt-12 sm:pt-16 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32"
        style={{ touchAction: 'pan-y' }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-500 rounded-2xl sm:rounded-3xl shadow-premium">
                <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold gradient-text-premium">{t.recentActivity}</h3>
                <p className="text-base sm:text-lg text-gray-600">Your progress journey</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 sm:space-x-4">
              <button
                onClick={() => setFilterMode(filterMode === 'current' ? 'all' : 'current')}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  filterMode === 'current'
                    ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Filter className="w-3 h-3 inline mr-1" />
                {filterMode === 'current' ? t.currentGoal : t.allGoals}
              </button>
              <button
                onClick={() => {
                  setShareMode('feed')
                  setShowShareModal(true)
                }}
                className="p-3 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl"
              >
                <Share2 className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Collaborator Avatars for Friends Goals */}
          {selectedGoal?.goal_type === 'friends' && collaborators.length > 0 && (
            <div className="flex items-center space-x-2 mb-6">
              <span className="text-sm text-gray-600 mr-2">With:</span>
              <div className="flex -space-x-2 overflow-hidden">
                {collaborators.slice(0, 5).map((collaborator) => (
                  <div key={collaborator.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden">
                    {collaborator.profiles?.avatar_url ? (
                      <img src={collaborator.profiles.avatar_url} alt={collaborator.profiles.display_name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-600">+{collaborators.length - 5}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4 sm:space-y-6">
            {entries.map((entry) => (
              <div
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="glass-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl hover:shadow-premium-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-4 sm:mb-6">
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className="text-2xl sm:text-3xl">{entry.goals?.symbol || '🎯'}</div>
                      <div>
                        <h4 className="font-bold text-lg sm:text-xl text-gray-800">{entry.goals?.name}</h4>
                        <p className="text-sm sm:text-base text-gray-600">{formatDate(entry.completed_at, {
                          today: t.today,
                          yesterday: t.yesterday,
                          daysAgo: t.daysAgo,
                        })}</p>
                      </div>
                    </div>
                    
                    <div className={`p-3 rounded-full bg-gradient-to-r ${getStatusColor(entry.status)} shadow-premium`}>
                      {getStatusIcon(entry.status)}
                    </div>
                  </div>

                  {/* Photo - Updated to 1:1 aspect ratio */}
                  {entry.photo_url && (
                    <div className="mb-4 sm:mb-6">
                      <img
                        src={entry.photo_url}
                        alt="Progress photo"
                        className="w-full aspect-square object-cover rounded-xl sm:rounded-2xl shadow-premium"
                      />
                    </div>
                  )}

                  {/* Comment */}
                  {entry.comment && (
                    <p className="text-gray-700 mb-4 sm:mb-6 text-base sm:text-lg leading-relaxed">
                      {entry.comment}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {new Date(entry.completed_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        shareToWhatsApp(entry)
                      }}
                      className="p-3 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl"
                    >
                      <Share2 className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {entries.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <TrendingUp className="w-16 h-16 mx-auto mb-6 text-gray-300" />
                <p className="text-xl font-semibold">No entries yet</p>
                <p className="text-base">Start tracking your goals to see progress here!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="premium-card max-w-lg w-full p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-xl">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{t.addComment}</h3>
                  <p className="text-sm text-gray-600">{t.optional}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowCommentModal(false)
                  setPendingEntry(null)
                  setComment('')
                }}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-6">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="How did it go? Any thoughts to share..."
                className="input-premium resize-none h-24"
                autoFocus
              />

              <div className="flex space-x-4">
                <button
                  onClick={() => {
                    setShowCommentModal(false)
                    setPendingEntry(null)
                    setComment('')
                  }}
                  className="btn-secondary-premium flex-1"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={saveEntry}
                  className="btn-premium flex-1"
                >
                  {t.save}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Goal Modal */}
      <CreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGoalCreated={handleGoalCreated}
      />

      {/* Goal Detail Modal */}
      {showGoalModal && selectedGoal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
          <div className="premium-card max-w-lg w-full p-6 sm:p-8 animate-scale-in">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="text-3xl">{selectedGoal.symbol}</div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{selectedGoal.name}</h3>
                  <p className="text-sm text-gray-600">{t.goalDetails}</p>
                </div>
              </div>
              <button
                onClick={() => setShowGoalModal(false)}
                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedGoal.description && (
                <p className="text-gray-700">{selectedGoal.description}</p>
              )}

              <div className="flex space-x-4">
                <button className="btn-secondary-premium flex-1 flex items-center justify-center space-x-2">
                  <Edit3 className="w-4 h-4" />
                  <span>{t.editGoal}</span>
                </button>
                <button className="btn-premium bg-gradient-to-r from-error-500 to-error-600 flex-1 flex items-center justify-center space-x-2">
                  <Trash2 className="w-4 h-4" />
                  <span>{t.deleteGoal}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hidden canvas for image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default TrackingScreen