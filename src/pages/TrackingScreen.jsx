import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Camera, Check, X, Share2, Edit3, Trash2, Calendar, Target, TrendingUp, Award, Heart, Sparkles, ArrowLeft, Filter, MessageCircle, Upload, Brain, User, Users, Menu } from 'lucide-react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { supabase } from '../services/supabaseClient'
import EnhancedCreateGoalModal from '../components/EnhancedCreateGoalModal'
import CountableTrackingModal from '../components/CountableTrackingModal'
import TrackingEntryContextMenu from '../components/TrackingEntryContextMenu'
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
  const [showCountableModal, setShowCountableModal] = useState(false)
  const [showContextMenu, setShowContextMenu] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })
  const [selectedEntry, setSelectedEntry] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)
  const [pendingEntry, setPendingEntry] = useState(null)
  const [selectedPhotoFile, setSelectedPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')
  const [filterMode, setFilterMode] = useState('current') // 'current' or 'all'
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [showBurgerMenu, setShowBurgerMenu] = useState(false)
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
    today: 'Today',
    yesterday: 'Yesterday',
    daysAgo: 'days ago',
    completed: 'Completed',
    completedWithPhoto: 'Completed with Photo',
    notDone: 'Not Done',
    markedAsDone: 'Marked as Done!',
    doneWithPhoto: 'Done with Photo!',
    markedAsNotDone: 'Marked as Not Done',
    currentGoal: 'Current Goal',
    allGoals: 'All Goals',
    createGoal: 'Create Goal',
    editGoal: 'Edit Goal',
    deleteGoal: 'Delete',
    goalDetails: 'Goal Details',
    uploadingPhoto: 'Uploading photo...'
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
            symbol,
            is_countable,
            target_unit
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
    if (!goals[selectedGoalIndex] || goals[selectedGoalIndex].goal_type !== 'friends_challenge') {
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

  // Long press handlers - Updated to 2 seconds as requested
  const handleGoalPress = (index) => {
    const timer = setTimeout(() => {
      setSelectedGoalIndex(index)
      setShowGoalModal(true)
    }, 2000) // 2 seconds
    setLongPressTimer(timer)
  }

  const handleGoalRelease = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  // Entry long press for context menu
  const handleEntryLongPress = (entry, event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    setContextMenuPosition({
      x: event.clientX || rect.right - 50,
      y: event.clientY || rect.top
    })
    setSelectedEntry(entry)
    setShowContextMenu(true)
  }

  // Photo upload with enhanced error handling and debugging
  const uploadPhoto = async (file) => {
    try {
      setUploadingPhoto(true)
      console.log('Starting photo upload:', file.name, file.size, file.type)
      
      // Validate file
      if (!file.type.startsWith('image/')) {
        throw new Error('Selected file is not an image')
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        throw new Error('Image file is too large (max 10MB)')
      }
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedGoal.id}_${Date.now()}.${fileExt}`
      const filePath = `goal-photos/${fileName}`

      console.log('Uploading to path:', filePath)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('goal-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      const { data: urlData } = supabase.storage
        .from('goal-photos')
        .getPublicUrl(filePath)

      console.log('Public URL generated:', urlData.publicUrl)
      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0]
    if (!file || !selectedGoal) return

    console.log('File selected:', file.name, file.type, file.size)

    setSelectedPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
    setPendingEntry({ status: 'done_with_photo' })
    
    if (selectedGoal.is_countable) {
      setShowCountableModal(true)
    } else {
      // For non-countable goals, save directly
      saveEntry({ status: 'done_with_photo' })
    }

    event.target.value = ''
  }

  const saveEntry = async (entryData) => {
    if (!selectedGoal) return

    try {
      console.log('Saving entry:', entryData)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to track goals')
      }

      let photoUrl = null

      if (entryData.status === 'done_with_photo' && selectedPhotoFile) {
        console.log('Processing photo upload...')
        photoUrl = await uploadPhoto(selectedPhotoFile)
        console.log('Photo uploaded successfully:', photoUrl)
      }

      const finalEntryData = {
        goal_id: selectedGoal.id,
        user_id: user.id,
        status: entryData.status,
        completed_at: new Date().toISOString(),
        quantity: entryData.quantity || 1,
        duration_minutes: entryData.duration_minutes || null,
        comment: entryData.comment || null,
        notes: entryData.notes || null
      }

      if (photoUrl) {
        finalEntryData.photo_url = photoUrl
      }

      console.log('Inserting entry data:', finalEntryData)

      const { data, error } = await supabase
        .from('goal_entries')
        .insert([finalEntryData])
        .select()

      if (error) {
        console.error('Database insert error:', error)
        throw error
      }

      console.log('Entry saved successfully:', data)

      // Reset states
      setPendingEntry(null)
      setSelectedPhotoFile(null)
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
        setPhotoPreviewUrl('')
      }
      setShowCountableModal(false)
      
      // Refresh entries
      fetchEntries()

      // Show success feedback
      setTrackingAction(entryData.status)
      setTimeout(() => setTrackingAction(null), 2000)

    } catch (error) {
      console.error('Error saving entry:', error)
      alert(`Error saving entry: ${error.message}`)
    }
  }

  // Handle unified tracking button actions
  const handleTrackingAction = async (action, needsComment = false) => {
    if (!selectedGoal) return

    console.log('Tracking action:', action, 'needsComment:', needsComment)

    if (action === 'done_with_photo') {
      fileInputRef.current?.click()
    } else {
      const entry = { status: action }
      if (selectedGoal.is_countable || needsComment) {
        setPendingEntry(entry)
        setShowCountableModal(true)
      } else {
        await saveEntry(entry)
      }
    }
  }

  // Handle photo capture from unified button
  const handlePhotoCapture = () => {
    console.log('Photo capture triggered')
    fileInputRef.current?.click()
  }

  // Burger menu handlers
  const toggleBurgerMenu = () => {
    setShowBurgerMenu(prev => !prev)
  }

  const handleMenuItemClick = (action) => {
    setShowBurgerMenu(false)
    if (action) action()
  }

  const handleGoalCreated = (newGoal) => {
    setGoals(prev => [newGoal, ...prev])
    setSelectedGoalIndex(0)
    setShowCreateModal(false)
    fetchEntries()
  }

  const handleEntryEdit = (entry) => {
    // Implement entry editing
    console.log('Edit entry:', entry)
  }

  const handleEntryDelete = (entryId) => {
    setEntries(prev => prev.filter(e => e.id !== entryId))
    setShowContextMenu(false)
  }

  const getGoalTypeIcon = (goalType) => {
    switch (goalType) {
      case 'friends_challenge':
        return <Users className="w-3 h-3 text-blue-500" />
      case 'public_challenge':
        return <Globe className="w-3 h-3 text-green-500" />
      default:
        return null
    }
  }

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

      {/* Header - Matching homescreen design exactly */}
      <header className="glass-card sticky top-0 z-50 border-b-0 rounded-none backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
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
                  MindStory
                </h1>
                <p className="text-xs text-gray-600 font-medium hidden sm:block">Transform your dreams into reality</p>
              </div>
            </div>
            
            {/* Burger Menu Button */}
            <button
              onClick={toggleBurgerMenu}
              className="p-2 sm:p-3 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl sm:rounded-2xl"
            >
              <Menu className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Burger Menu Dropdown */}
        {showBurgerMenu && (
          <div className="absolute top-full right-3 sm:right-6 lg:right-8 mt-2 w-64 premium-card p-4 z-50 animate-scale-in">
            <div className="space-y-2">
              {userProfile?.avatar_url && (
                <div className="flex items-center space-x-3 p-3 border-b border-gray-200 mb-4">
                  <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-premium">
                    <img
                      src={userProfile.avatar_url}
                      alt={userProfile.display_name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{userProfile.display_name}</p>
                    <p className="text-sm text-gray-600">Day 24 streak!</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
                <div className="glass-card rounded-full px-2 sm:px-4 py-1 sm:py-2 shimmer">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Heart className="w-3 sm:w-4 h-3 sm:h-4 text-rose-500 animate-pulse-soft" />
                    <span className="text-xs font-bold text-gray-700">Day 24</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Click outside to close burger menu */}
      {showBurgerMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowBurgerMenu(false)}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Goal Selection - Updated spacing to -16px (4 units) */}
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
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-6" // Changed from space-x-6 to space-x-4 (-16px)
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
                  
                  {/* Goal Type Indicator */}
                  {(goal.goal_type === 'friends_challenge' || goal.goal_type === 'public_challenge') && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className="p-2 bg-white/20 backdrop-blur-sm rounded-full">
                        {getGoalTypeIcon(goal.goal_type)}
                      </div>
                    </div>
                  )}
                  
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

                    {/* Goal Details */}
                    <div className="space-y-2 mb-6">
                      {goal.is_countable && (
                        <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          Countable: {goal.target_unit || 'units'}
                        </div>
                      )}
                      {goal.total_target && (
                        <div className={`text-xs ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                          Target: {goal.total_target} {goal.target_unit || 'completions'}
                        </div>
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

      {/* Unified Tracking Interface - Adjusted positioning to bottom-10 */}
      <section className="relative z-20 flex justify-center py-20 sm:py-24 lg:py-28">
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

      {/* Tracking Feed - Updated with enhanced entry display */}
      <div 
        ref={feedRef}
        className="relative z-10 bg-white/60 backdrop-blur-xl rounded-t-2xl sm:rounded-t-3xl shadow-premium-xl min-h-screen pt-12 sm:pt-16 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32"
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
            </div>
          </div>

          {/* Collaborator Avatars for Friends Goals */}
          {selectedGoal?.goal_type === 'friends_challenge' && collaborators.length > 0 && (
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
            {entries.map((entry) => {
              const { data: { user } } = supabase.auth.getUser()
              const canEdit = user && entry.user_id === user.id

              return (
                <div
                  key={entry.id}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    handleEntryLongPress(entry, e)
                  }}
                  onTouchStart={(e) => {
                    const timer = setTimeout(() => {
                      handleEntryLongPress(entry, e)
                    }, 800)
                    e.currentTarget.dataset.timer = timer
                  }}
                  onTouchEnd={(e) => {
                    const timer = e.currentTarget.dataset.timer
                    if (timer) clearTimeout(timer)
                  }}
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

                    {/* Quantity/Duration Display for Countable Goals */}
                    {entry.goals?.is_countable && entry.quantity && entry.quantity > 1 && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Amount:</span>
                          <span className="font-semibold text-gray-800">
                            {entry.quantity} {entry.goals.target_unit || 'units'}
                          </span>
                        </div>
                        {entry.duration_minutes && (
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">Duration:</span>
                            <span className="font-semibold text-gray-800">
                              {entry.duration_minutes} minutes
                            </span>
                          </div>
                        )}
                      </div>
                    )}

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
                          handleEntryLongPress(entry, e)
                        }}
                        className="p-3 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl"
                      >
                        <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5 text-gray-600" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}

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

      {/* Enhanced Create Goal Modal */}
      <EnhancedCreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGoalCreated={handleGoalCreated}
      />

      {/* Countable Tracking Modal */}
      <CountableTrackingModal
        isOpen={showCountableModal}
        onClose={() => {
          setShowCountableModal(false)
          setPendingEntry(null)
          if (photoPreviewUrl) {
            URL.revokeObjectURL(photoPreviewUrl)
            setPhotoPreviewUrl('')
          }
          setSelectedPhotoFile(null)
        }}
        onSave={saveEntry}
        goal={selectedGoal}
        action={pendingEntry?.status}
        photoFile={selectedPhotoFile}
        photoPreviewUrl={photoPreviewUrl}
      />

      {/* Context Menu for Entry Management */}
      <TrackingEntryContextMenu
        entry={selectedEntry}
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onEdit={handleEntryEdit}
        onDelete={handleEntryDelete}
        position={contextMenuPosition}
        canEdit={selectedEntry?.user_id === userProfile?.user_id}
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

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Type:</span>
                  <span className="ml-2 font-medium capitalize">{selectedGoal.goal_type?.replace('_', ' ')}</span>
                </div>
                {selectedGoal.is_countable && (
                  <div>
                    <span className="text-gray-500">Unit:</span>
                    <span className="ml-2 font-medium">{selectedGoal.target_unit}</span>
                  </div>
                )}
                {selectedGoal.total_target && (
                  <div>
                    <span className="text-gray-500">Target:</span>
                    <span className="ml-2 font-medium">{selectedGoal.total_target}</span>
                  </div>
                )}
                {selectedGoal.frequency && (
                  <div>
                    <span className="text-gray-500">Frequency:</span>
                    <span className="ml-2 font-medium">{selectedGoal.frequency}x/week</span>
                  </div>
                )}
              </div>

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