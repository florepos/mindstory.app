import React, { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight, Plus, Camera, Check, X, Share2, Edit3, Trash2, Calendar, Target, TrendingUp, Award, Heart, Sparkles, ArrowLeft, Filter, MessageCircle, Upload, Brain, User, Users, Globe, Menu, LogOut } from 'lucide-react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { supabase } from '../services/supabaseClient'
import EnhancedCreateGoalModal from '../components/EnhancedCreateGoalModal'
import CountableTrackingModal from '../components/CountableTrackingModal'
import TrackingEntryContextMenu from '../components/TrackingEntryContextMenu'
import UnifiedTrackingButton from '../components/UnifiedTrackingButton'
import TrackingEntryCard from '../components/TrackingEntryCard'
import { formatDate } from '../utils/date'

const TrackingScreen = ({ onBack }) => {
  const [selectedGoalIndex, setSelectedGoalIndex] = useState(0)
  const [goals, setGoals] = useState([])
  const [entries, setEntries] = useState([])
  const [collaborators, setCollaborators] = useState([])
  const [userProfile, setUserProfile] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)
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
  const [todayCompletions, setTodayCompletions] = useState(0)
  const [totalCompletions, setTotalCompletions] = useState(0)
  const [weeklyCompletions, setWeeklyCompletions] = useState(0)
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
      fetchCompletionStats()
    }
  }, [goals, selectedGoalIndex, filterMode])

  const fetchUserProfile = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) return

      setCurrentUser(user)

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
            target_unit,
            total_target,
            frequency
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

  const fetchCompletionStats = async () => {
    if (!selectedGoal) return

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) return

      const today = new Date().toISOString().split('T')[0]
      const weekStart = new Date()
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      const weekStartISO = weekStart.toISOString().split('T')[0]
      
      // Today's completions
      const { data: todayData, error: todayError } = await supabase
        .from('goal_entries')
        .select('*')
        .eq('goal_id', selectedGoal.id)
        .eq('user_id', user.id)
        .gte('completed_at', `${today}T00:00:00.000Z`)
        .lt('completed_at', `${today}T23:59:59.999Z`)
        .in('status', ['done', 'done_with_photo'])

      if (todayError) throw todayError
      setTodayCompletions(todayData?.length || 0)

      // This week's completions
      const { data: weekData, error: weekError } = await supabase
        .from('goal_entries')
        .select('*')
        .eq('goal_id', selectedGoal.id)
        .eq('user_id', user.id)
        .gte('completed_at', `${weekStartISO}T00:00:00.000Z`)
        .in('status', ['done', 'done_with_photo'])

      if (weekError) throw weekError
      setWeeklyCompletions(weekData?.length || 0)

      // Total completions
      const { data: totalData, error: totalError } = await supabase
        .from('goal_entries')
        .select('*')
        .eq('goal_id', selectedGoal.id)
        .eq('user_id', user.id)
        .in('status', ['done', 'done_with_photo'])

      if (totalError) throw totalError
      setTotalCompletions(totalData?.length || 0)
      
    } catch (error) {
      console.error('Error fetching completion stats:', error)
    }
  }

  const fetchCollaborators = async () => {
    if (!goals[selectedGoalIndex] || goals[selectedGoalIndex].privacy_level !== 'friends_challenge') {
      setCollaborators([])
      return
    }

    try {
      // First, fetch collaborators
      const { data: collaboratorData, error: collaboratorError } = await supabase
        .from('goal_collaborators')
        .select('*')
        .eq('goal_id', goals[selectedGoalIndex].id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: true })

      if (collaboratorError) throw collaboratorError

      if (!collaboratorData || collaboratorData.length === 0) {
        setCollaborators([])
        return
      }

      // Get user IDs from collaborators
      const userIds = collaboratorData.map(c => c.user_id).filter(Boolean)
      
      if (userIds.length === 0) {
        setCollaborators(collaboratorData.map(c => ({ ...c, profiles: null })))
        return
      }

      // Fetch profiles for those users
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        // Continue without profiles rather than failing
        setCollaborators(collaboratorData.map(c => ({ ...c, profiles: null })))
        return
      }

      // Combine the data
      const enrichedCollaborators = collaboratorData.map(collaborator => ({
        ...collaborator,
        profiles: profileData.find(p => p.user_id === collaborator.user_id)
      }))

      setCollaborators(enrichedCollaborators)
    } catch (error) {
      console.error('Error fetching collaborators:', error)
      setCollaborators([])
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

    console.log('📁 File selected:', file.name, file.type, file.size)

    setSelectedPhotoFile(file)
    setPhotoPreviewUrl(URL.createObjectURL(file))
    setPendingEntry({ status: 'done_with_photo' })
    
    // Always show the countable modal for photo entries to allow adding comments
    console.log('📝 Opening modal for photo entry')
    setShowCountableModal(true)

    event.target.value = ''
  }

  const saveEntry = async (entryData) => {
    if (!selectedGoal) return

    try {
      console.log('💾 Starting to save entry:', entryData)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to track goals')
      }

      let photoUrl = null

      if (entryData.status === 'done_with_photo' && selectedPhotoFile) {
        console.log('📤 Processing photo upload...')
        photoUrl = await uploadPhoto(selectedPhotoFile)
        console.log('✅ Photo uploaded successfully:', photoUrl)
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

      console.log('📝 Inserting entry data into database:', finalEntryData)

      const { data, error } = await supabase
        .from('goal_entries')
        .insert([finalEntryData])
        .select()

      if (error) {
        console.error('❌ Database insert error:', error)
        throw error
      }

      console.log('✅ Entry saved successfully to database:', data)

      // Reset states
      setPendingEntry(null)
      setSelectedPhotoFile(null)
      if (photoPreviewUrl) {
        URL.revokeObjectURL(photoPreviewUrl)
        setPhotoPreviewUrl('')
      }
      setShowCountableModal(false)
      
      // Refresh entries and stats
      console.log('🔄 Refreshing entries and completions...')
      fetchEntries()
      fetchCompletionStats()

      // Show success feedback
      setTrackingAction(entryData.status)
      setTimeout(() => setTrackingAction(null), 2000)

      console.log('🎉 Entry tracking completed successfully!')

    } catch (error) {
      console.error('❌ Error saving entry:', error)
      alert(`Error saving entry: ${error.message}`)
    }
  }

  // Handle unified tracking button actions
  const handleTrackingAction = async (action, needsComment = false) => {
    if (!selectedGoal) return

    console.log('🎯 Tracking action received:', action, 'needsComment:', needsComment)

    if (action === 'done_with_photo') {
      console.log('📸 Triggering photo capture')
      
      // Enhanced file input triggering for mobile compatibility
      try {
        if (fileInputRef.current) {
          console.log('📂 File input reference found, attempting to trigger...')
          
          // For mobile browsers, ensure the click happens in the same user gesture
          const input = fileInputRef.current
          input.style.display = 'block'
          input.style.position = 'absolute'
          input.style.top = '-9999px'
          input.click()
          
          console.log('✅ File input click triggered successfully')
        } else {
          console.error('❌ File input reference not found')
          alert('Camera not available. Please check permissions.')
        }
      } catch (error) {
        console.error('❌ Error triggering file input:', error)
        alert('Error opening camera. Please try again.')
      }
    } else {
      const entry = { status: action }
      if (selectedGoal.is_countable || needsComment) {
        console.log('📝 Opening countable modal for entry:', entry)
        setPendingEntry(entry)
        setShowCountableModal(true)
      } else {
        console.log('💾 Saving entry directly:', entry)
        await saveEntry(entry)
      }
    }
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

  // Enhanced entry edit functionality
  const handleEntryEdit = (entry) => {
    console.log('Edit entry:', entry)
    alert(`Edit functionality for entry "${entry.goals?.name}" will be implemented in a future update.`)
  }

  // Enhanced entry delete functionality
  const handleEntryDelete = async (entryId) => {
    try {
      const { error } = await supabase
        .from('goal_entries')
        .delete()
        .eq('id', entryId)

      if (error) throw error

      setEntries(prev => prev.filter(e => e.id !== entryId))
      setShowContextMenu(false)
      fetchCompletionStats()
      
      alert('Entry deleted successfully!')
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry. Please try again.')
    }
  }

  // Enhanced share functionality
  const handleEntryShare = async (entry) => {
    try {
      const shareText = `🎯 ${entry.goals?.name}\n${getStatusText(entry.status)} on ${formatDate(entry.completed_at)}\n\n#MindStory #Goals #Progress`
      
      const shareData = {
        title: `${entry.goals?.name} - Progress`,
        text: shareText,
        url: window.location.href
      }

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareText)
        alert('Progress copied to clipboard!')
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = shareText
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        alert('Progress copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing entry:', error)
      if (error.name !== 'AbortError') {
        try {
          const shareText = `🎯 ${entry.goals?.name}\n${getStatusText(entry.status)} on ${formatDate(entry.completed_at)}\n\n#MindStory #Goals #Progress`
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareText)
            alert('Progress copied to clipboard!')
          } else {
            const textArea = document.createElement('textarea')
            textArea.value = shareText
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            alert('Progress copied to clipboard!')
          }
        } catch (clipboardError) {
          console.error('Clipboard fallback failed:', clipboardError)
          alert('Failed to share. Please try again.')
        }
      }
    }
  }

  const getGoalTypeIcon = (goal) => {
    const type = goal.privacy_level || goal.goal_type
    
    switch (type) {
      case 'private':
        return null
      case 'friends':
      case 'friends_challenge':
        return <Users className="w-4 h-4 text-blue-500" />
      case 'public':
      case 'public_challenge':
        return <Globe className="w-4 h-4 text-green-500" />
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

      {/* Header */}
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
              
            
            {/* Menu Items */}
            <div className="space-y-2">
              {onBack && (
                <button
                  onClick={() => handleMenuItemClick(onBack)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <ArrowLeft className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-gray-700">Back to Home</span>
                </button>
              )}
              
              <button
                onClick={() => handleMenuItemClick(() => setShowCreateModal(true))}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
              >
                <Plus className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-700">Create Goal</span>
              </button>
              
              <button
                onClick={() => handleMenuItemClick(() => setFilterMode(filterMode === 'current' ? 'all' : 'current'))}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
              >
                <Filter className="w-5 h-5 text-primary-600" />
                <span className="font-medium text-gray-700">
                  {filterMode === 'current' ? 'Show All Goals' : 'Show Current Goal'}
                </span>
              </button>
              
              {currentUser && (
                <button
                  onClick={() => handleMenuItemClick(async () => {
                    await supabase.auth.signOut()
                  })}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <LogOut className="w-5 h-5 text-error-600" />
                  <span className="font-medium text-gray-700">Sign Out</span>
                </button>
              )}
            </div>
              {/* Stats Display */}
              <div className="flex items-center space-x-2 sm:space-x-4 mb-4">
                <div className="glass-card rounded-full px-2 sm:px-4 py-1 sm:py-2 shimmer">
                  <div className="flex items-center space-x-1 sm:space-x-2">
                    <Heart className="w-3 sm:w-4 h-3 sm:h-4 text-rose-500 animate-pulse-soft" />
                    <span className="text-xs font-bold text-gray-700">Day 24</span>
                  </div>
                </div>
                {totalCompletions > 1 && (
                  <div className="glass-card rounded-full px-2 sm:px-4 py-1 sm:py-2">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <Target className="w-3 sm:w-4 h-3 sm:h-4 text-primary-500" />
                      <span className="text-xs font-bold text-gray-700">{totalCompletions} total</span>
                    </div>
                  </div>
                )}
                {weeklyCompletions > 0 && (
                  <div className="glass-card rounded-full px-2 sm:px-4 py-1 sm:py-2">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <TrendingUp className="w-3 sm:w-4 h-3 sm:h-4 text-secondary-500" />
                      <span className="text-xs font-bold text-gray-700">{weeklyCompletions} this week</span>
                    </div>
                  </div>
                )}
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

      {/* Goal Selection */}
      <section className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-2xl sm:rounded-3xl shadow-premium">
                <Target className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              </div>
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold gradient-text-premium">{t.selectGoal}</h2>
                <p className="text-base sm:text-lg text-gray-600">Dream it. Do it.</p>
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
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-6"
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
                  {getGoalTypeIcon(goal) && (
                    <div className="absolute top-4 right-4 z-20">
                      <div className={`p-2 rounded-full shadow-premium ${
                        isSelected 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : 'bg-white/90 backdrop-blur-sm'
                      }`}>
                        {getGoalTypeIcon(goal)}
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

      {/* Unified Tracking Interface */}
      <section className="relative z-20 flex justify-center py-20 sm:py-24 lg:py-28">
        <div className="text-center">
          <UnifiedTrackingButton
            onTrackingAction={handleTrackingAction}
            selectedGoal={selectedGoal}
            disabled={!selectedGoal}
            completionCount={todayCompletions}
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

      {/* Tracking Feed */}
      <div 
        ref={feedRef}
        className="relative z-10 bg-white/60 backdrop-blur-xl rounded-t-2xl sm:rounded-t-3xl shadow-premium-xl min-h-screen pt-24 sm:pt-32 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 mt-16"
      >
        <div className="max-w-7xl mx-auto">
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
          {selectedGoal?.privacy_level === 'friends_challenge' && collaborators.length > 0 && (
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

          {/* Entries Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {entries.map((entry) => (
              <TrackingEntryCard
                key={entry.id}
                entry={entry}
                currentUser={currentUser}
                totalCompletions={totalCompletions}
                weeklyCompletions={weeklyCompletions}
                onContextMenu={handleEntryLongPress}
                onShare={handleEntryShare}
                onEdit={handleEntryEdit}
                onDelete={handleEntryDelete}
                formatDate={formatDate}
              />
            ))}

            {entries.length === 0 && (
              <div className="col-span-full text-center py-16 text-gray-500">
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
        totalCompletions={totalCompletions}
        weeklyCompletions={weeklyCompletions}
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
        canEdit={selectedEntry?.user_id === currentUser?.id}
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
                  <span className="ml-2 font-medium capitalize">{(selectedGoal.privacy_level || selectedGoal.goal_type)?.replace('_', ' ')}</span>
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