import React, { useState, useEffect } from 'react'
import GoalSlider from '../components/GoalSlider'
import TrackButton from '../components/TrackButton'
import AvatarSetupModal from '../components/AvatarSetupModal'
import AuthModal from '../components/AuthModal'
import PublicChallengeFeed from '../components/PublicChallengeFeed'
import { Brain, Sparkles, Target, TrendingUp, Award, Zap, Star, Heart, Activity, FileText, Shield, LogIn, Loader2, Menu, LogOut, Users, Globe, Camera, CheckCircle, ArrowRight, ChevronLeft, ChevronRight, Eye, Lightbulb, Compass, Palette, Mail } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const Home = ({ onNavigateToTracking, onNavigateToImpressum, onNavigateToDatenschutz, user, loading }) => {
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [refreshGoals, setRefreshGoals] = useState(0)
  const [userProfile, setUserProfile] = useState(null)
  const [showAvatarSetup, setShowAvatarSetup] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBurgerMenu, setShowBurgerMenu] = useState(false)
  const [publicGoals, setPublicGoals] = useState([])
  const [recentEntries, setRecentEntries] = useState([])
  const [publicGoalsFilter, setPublicGoalsFilter] = useState('recent')
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('')
  const [emailSubmitted, setEmailSubmitted] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    }
    fetchPublicGoals()
    fetchRecentEntries()
  }, [user])

  useEffect(() => {
    fetchPublicGoals()
  }, [publicGoalsFilter])

  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        throw error
      }

      if (!data) {
        setShowAvatarSetup(true)
      } else {
        setUserProfile(data)
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchPublicGoals = async () => {
    try {
      let query = supabase
        .from('goals')
        .select('*')
        .eq('privacy_level', 'public_challenge')
        .limit(6)

      // Apply filter
      switch (publicGoalsFilter) {
        case 'recent':
          query = query.order('created_at', { ascending: false })
          break
        case 'popular':
          // For now, we'll use created_at as a proxy for popularity
          query = query.order('created_at', { ascending: false })
          break
        case 'theme':
          // Could be extended to filter by categories/themes
          query = query.order('name', { ascending: true })
          break
        default:
          query = query.order('created_at', { ascending: false })
      }

      const { data, error } = await query

      if (error) throw error
      setPublicGoals(data || [])
    } catch (error) {
      console.error('Error fetching public goals:', error)
    }
  }

  const fetchRecentEntries = async () => {
    try {
      const { data: entriesData, error: entriesError } = await supabase
        .from('goal_entries')
        .select(`
          *,
          goals (
            id,
            name,
            symbol,
            privacy_level
          )
        `)
        .in('status', ['done', 'done_with_photo'])
        .order('completed_at', { ascending: false })
        .limit(8)

      if (entriesError) throw entriesError

      const publicEntries = (entriesData || []).filter(entry => 
        entry.goals && entry.goals.privacy_level === 'public_challenge'
      )

      if (publicEntries.length === 0) {
        setRecentEntries([])
        return
      }

      const userIds = [...new Set(publicEntries.map(entry => entry.user_id))]

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      if (profilesError) throw profilesError

      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile
        return acc
      }, {})

      const entriesWithProfiles = publicEntries.map(entry => ({
        ...entry,
        profiles: profilesMap[entry.user_id] || null
      }))
      
      setRecentEntries(entriesWithProfiles)
    } catch (error) {
      console.error('Error fetching recent entries:', error)
    }
  }

  const handleGoalSelect = (goalId) => {
    setSelectedGoalId(goalId)
  }

  const handleAvatarSetupComplete = (profile) => {
    setUserProfile(profile)
    setShowAvatarSetup(false)
  }

  const handleAvatarSetupSkip = () => {
    setShowAvatarSetup(false)
    if (user) {
      fetchUserProfile(user.id)
    }
  }

  const handleGoalCreated = (newGoal) => {
    console.log('New goal created:', newGoal)
    setRefreshGoals(prev => prev + 1)
    setSelectedGoalId(newGoal.id)
  }

  const handleTrackGoal = async (goalId, status, photoUrl = null) => {
    try {
      console.log(`Tracking goal ${goalId} with status: ${status}`, photoUrl ? `and photo: ${photoUrl}` : '')
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to track goals')
      }

      const entryData = {
        goal_id: goalId,
        user_id: user.id,
        status: status,
        completed_at: new Date().toISOString()
      }

      if (photoUrl) {
        entryData.photo_url = photoUrl
      }

      const { data, error } = await supabase
        .from('goal_entries')
        .insert([entryData])
        .select()

      if (error) {
        console.error('Error tracking goal:', error)
        throw error
      }

      console.log('Goal tracked successfully:', data)
      
    } catch (error) {
      console.error('Failed to track goal:', error)
    }
  }

  const toggleBurgerMenu = () => {
    setShowBurgerMenu(prev => !prev)
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setShowBurgerMenu(false)
  }

  const handleMenuItemClick = (action) => {
    setShowBurgerMenu(false)
    if (action) action()
  }

  const handleEarlyAccessSubmit = async (e) => {
    e.preventDefault()
    if (!earlyAccessEmail.trim()) return

    // Here you would typically save to a database or send to an email service
    // For now, we'll just show success feedback
    setEmailSubmitted(true)
    setEarlyAccessEmail('')
    
    setTimeout(() => {
      setEmailSubmitted(false)
    }, 3000)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-yellow-50/50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading MindStory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-yellow-50/50">
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
              <div className="relative">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-xl sm:rounded-2xl shadow-premium">
                  <Heart className="w-5 sm:w-8 h-5 sm:h-8 text-white animate-pulse-soft" />
                </div>
                <div className="absolute -top-1 -right-1 w-2 sm:w-3 h-2 sm:h-3 bg-gradient-to-r from-success-400 to-success-500 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-lg sm:text-3xl font-bold gradient-text-premium">
                  MindStory
                </h1>
                <p className="text-xs text-gray-600 font-medium hidden sm:block">Your journey to authentic living</p>
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
                    <p className="text-sm text-gray-600">Welcome back!</p>
                  </div>
                </div>
              )}
              
              {onNavigateToTracking && (
                <button
                  onClick={() => handleMenuItemClick(onNavigateToTracking)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <Activity className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-gray-700">Track Progress</span>
                </button>
              )}
              
              {!user ? (
                <button
                  onClick={() => handleMenuItemClick(() => setShowAuthModal(true))}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <LogIn className="w-5 h-5 text-primary-600" />
                  <span className="font-medium text-gray-700">Sign In</span>
                </button>
              ) : (
                <button
                  onClick={() => handleMenuItemClick(handleSignOut)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <LogOut className="w-5 h-5 text-error-600" />
                  <span className="font-medium text-gray-700">Sign Out</span>
                </button>
              )}
              
              <div className="border-t border-gray-200 pt-2 mt-2">
                <button
                  onClick={() => handleMenuItemClick(onNavigateToImpressum)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Impressum</span>
                </button>
                
                <button
                  onClick={() => handleMenuItemClick(onNavigateToDatenschutz)}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-xl transition-colors flex items-center space-x-3"
                >
                  <Shield className="w-5 h-5 text-gray-500" />
                  <span className="font-medium text-gray-700">Datenschutz</span>
                </button>
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

      {/* 1. HERO SECTION */}
      <section className="relative py-20 sm:py-32 lg:py-40 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-in">
            {/* Animated Heart/Brain Icon */}
            <div className="mb-8 sm:mb-12">
              <div className="relative inline-block">
                <div className="p-6 sm:p-8 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 rounded-full shadow-premium-xl animate-pulse-soft">
                  <div className="relative">
                    <Heart className="w-12 sm:w-16 h-12 sm:h-16 text-white animate-pulse-soft" />
                    <Brain className="w-8 sm:w-10 h-8 sm:h-10 text-white/80 absolute -top-1 -right-1 animate-float" />
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-primary-400 to-secondary-400 rounded-full blur-xl opacity-30 animate-pulse-glow"></div>
              </div>
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 sm:mb-8 text-balance leading-tight">
              You know there's more.
              <span className="block gradient-text-premium mt-2">Start walking your real path</span>
              <span className="text-3xl sm:text-5xl lg:text-6xl block mt-2">– today.</span>
            </h1>
            
            <p className="text-gray-600 text-xl sm:text-2xl lg:text-3xl max-w-5xl mx-auto leading-relaxed text-balance mb-12 sm:mb-16 px-4">
              MindStory helps you connect with what truly matters – and take aligned action. 
              <span className="block mt-2 font-medium">Day by day. With heart and mind.</span>
            </p>
            
            {/* CTA Button */}
            <div className="mb-8 sm:mb-12">
              <button
                onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                className="btn-premium text-xl sm:text-2xl px-12 sm:px-16 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-premium-xl hover:shadow-glow-premium transform hover:scale-105 transition-all duration-500 group"
              >
                <span className="flex items-center space-x-3">
                  <span>{user ? 'Continue Tracking' : 'Start My Journey'}</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
              </button>
            </div>

            {/* Tagline */}
            <div className="glass-card px-8 sm:px-12 py-6 sm:py-8 inline-block animate-fade-in-delayed">
              <p className="text-lg sm:text-xl text-gray-700 font-medium italic">
                "We are the stories we tell ourselves. MindStory helps you rewrite yours."
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE TEASER SECTION */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-24">
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold gradient-text-premium mb-6">
              Dream it. Do it. Share it.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-12">
            {/* Feature 1 */}
            <div className="premium-card premium-card-hover p-8 sm:p-12 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-6 sm:p-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Compass className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Discover your true goals</h3>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
                  Uncover what really drives you.
                </p>
                <button 
                  onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                  className="btn-secondary-premium group-hover:shadow-premium-lg transition-all duration-300"
                >
                  {user ? 'Start Tracking' : 'Explore Now'}
                </button>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="premium-card premium-card-hover p-8 sm:p-12 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-6 sm:p-8 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-3xl w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Camera className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Track your journey effortlessly</h3>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
                  Photos, notes, swipes – just tap and grow.
                </p>
                <button 
                  onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                  className="btn-secondary-premium group-hover:shadow-premium-lg transition-all duration-300"
                >
                  {user ? 'Track Now' : 'Start Tracking'}
                </button>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="premium-card premium-card-hover p-8 sm:p-12 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-success-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-6 sm:p-8 bg-gradient-to-br from-success-500 to-success-600 rounded-3xl w-20 sm:w-24 h-20 sm:h-24 mx-auto mb-8 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Users className="w-10 sm:w-12 h-10 sm:h-12 text-white" />
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Move forward together</h3>
                <p className="text-lg sm:text-xl text-gray-600 leading-relaxed mb-8">
                  Join challenges, support each other.
                </p>
                <button 
                  onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                  className="btn-secondary-premium group-hover:shadow-premium-lg transition-all duration-300"
                >
                  {user ? 'View Community' : 'Join Community'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. PUBLIC GOALS FEED */}
      <section className="py-20 sm:py-32 bg-white/40 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <div className="flex items-center justify-center mb-8">
              <div className="p-4 sm:p-6 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl shadow-premium">
                <Globe className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
              </div>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold gradient-text-premium mb-6">
              Explore the public goals
            </h2>
            
            {/* Filter Options */}
            <div className="flex items-center justify-center space-x-4 mb-12">
              {['recent', 'popular', 'theme'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setPublicGoalsFilter(filter)}
                  className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                    publicGoalsFilter === filter
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-premium'
                      : 'bg-white/60 text-gray-700 hover:bg-white/80 hover:shadow-premium'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {publicGoals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {publicGoals.map((goal) => (
                <div
                  key={goal.id}
                  className="premium-card premium-card-hover p-6 sm:p-8 text-center group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  <div className="relative z-10">
                    <div className="text-4xl sm:text-5xl mb-6 group-hover:scale-110 transition-transform duration-500">
                      {goal.symbol || '🎯'}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">{goal.name}</h3>
                    <p className="text-gray-600 mb-6 line-clamp-2">{goal.description}</p>
                    <div className="flex items-center justify-center space-x-4 text-sm text-gray-500 mb-6">
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>Public</span>
                      </div>
                      {goal.total_target && (
                        <div className="flex items-center space-x-1">
                          <Target className="w-4 h-4" />
                          <span>{goal.total_target}</span>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <button 
                        onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                        className="btn-premium w-full"
                      >
                        Join this challenge
                      </button>
                      <button 
                        onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                        className="btn-secondary-premium w-full"
                      >
                        Start something similar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Globe className="w-16 h-16 mx-auto mb-6 text-gray-300" />
              <p className="text-xl font-semibold text-gray-500 mb-2">No public goals yet – be the first!</p>
              <button
                onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                className="btn-premium mt-6"
              >
                {user ? 'Create First Public Goal' : 'Sign Up to Create'}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* 4. UPCOMING FEATURES TEASER */}
      <section className="py-20 sm:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 sm:mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold gradient-text-premium mb-6">
              What if you could go deeper?
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto">
              MindStory will soon help you unlock your inner story even more.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8 mb-16">
            {/* Feature 1 */}
            <div className="glass-card p-8 sm:p-10 rounded-2xl sm:rounded-3xl hover:shadow-premium-lg transition-all duration-300 group">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Find your values</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Discover what truly matters to you through guided reflection and value-based goal setting.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 sm:p-10 rounded-2xl sm:rounded-3xl hover:shadow-premium-lg transition-all duration-300 group">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Lightbulb className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Overcome limiting beliefs</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Identify and transform the stories that hold you back from reaching your full potential.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 sm:p-10 rounded-2xl sm:rounded-3xl hover:shadow-premium-lg transition-all duration-300 group">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Define your motto goals</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Create powerful personal mantras that guide your daily actions and long-term vision.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="glass-card p-8 sm:p-10 rounded-2xl sm:rounded-3xl hover:shadow-premium-lg transition-all duration-300 group">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-4 bg-gradient-to-br from-warning-500 to-error-500 rounded-2xl group-hover:scale-110 transition-transform duration-300">
                  <Eye className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">Visualize your dreams</h3>
              </div>
              <p className="text-gray-600 text-lg leading-relaxed">
                Use powerful visualization techniques to manifest your goals and create your ideal future.
              </p>
            </div>
          </div>

          {/* Early Access Form */}
          <div className="premium-card p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-bold gradient-text-premium mb-6">Get early access</h3>
            <p className="text-gray-600 text-lg mb-8">
              Be the first to experience these powerful new features when they launch.
            </p>
            
            {emailSubmitted ? (
              <div className="p-6 bg-gradient-to-r from-success-50 to-success-100 rounded-2xl border border-success-200">
                <div className="flex items-center justify-center space-x-3 mb-4">
                  <CheckCircle className="w-8 h-8 text-success-600" />
                  <span className="text-2xl font-bold text-success-800">Thank you!</span>
                </div>
                <p className="text-success-700 text-lg">
                  We'll notify you when these features are ready.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEarlyAccessSubmit} className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                <input
                  type="email"
                  value={earlyAccessEmail}
                  onChange={(e) => setEarlyAccessEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="input-premium flex-1 text-lg"
                  required
                />
                <button
                  type="submit"
                  className="btn-premium flex items-center justify-center space-x-2 px-8"
                >
                  <Mail className="w-5 h-5" />
                  <span>Get Early Access</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 5. FINAL CTA SECTION */}
      <section className="py-20 sm:py-32 bg-gradient-to-br from-primary-50 via-secondary-50/50 to-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="premium-card p-12 sm:p-16 max-w-5xl mx-auto">
            <div className="mb-8 sm:mb-12">
              <div className="p-6 sm:p-8 bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600 rounded-full w-24 sm:w-32 h-24 sm:h-32 mx-auto mb-8 flex items-center justify-center shadow-premium-xl">
                <Sparkles className="w-12 sm:w-16 h-12 sm:h-16 text-white animate-pulse-soft" />
              </div>
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-8 text-balance">
              It's your story.
              <span className="block gradient-text-premium mt-2">Start writing the next chapter.</span>
            </h2>
            
            <p className="text-xl sm:text-2xl text-gray-600 mb-12 sm:mb-16 leading-relaxed max-w-3xl mx-auto">
              We are the stories we tell ourselves. And we are the authors of what's to come.
            </p>
            
            <div className="mb-8 sm:mb-12">
              <button
                onClick={() => user ? onNavigateToTracking() : setShowAuthModal(true)}
                className="btn-premium text-xl sm:text-2xl px-12 sm:px-16 py-6 sm:py-8 rounded-2xl sm:rounded-3xl shadow-premium-xl hover:shadow-glow-premium transform hover:scale-105 transition-all duration-500 group"
              >
                <span className="flex items-center space-x-3">
                  <span>{user ? 'Continue your MindStory' : 'Begin your MindStory'}</span>
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
                  <span>{user ? 'Track now' : 'Join now'}</span>
                </span>
              </button>
            </div>

            <p className="text-lg text-gray-500 font-medium">
              Psychology-based. Science-backed. Human at heart.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-xl border-t border-white/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold gradient-text-premium">MindStory</h3>
              </div>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-md mb-6">
                Connect with what truly matters and take aligned action. Day by day. With heart and mind.
              </p>
              <div className="flex items-center space-x-4">
                <div className="glass-card rounded-full px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span className="text-sm font-medium text-gray-700">10,000+ users</span>
                  </div>
                </div>
                <div className="glass-card rounded-full px-4 py-2">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-amber-500" />
                    <span className="text-sm font-medium text-gray-700">4.9 rating</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-6 text-lg">Legal</h4>
              <div className="space-y-3">
                <button
                  onClick={onNavigateToImpressum}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-base"
                >
                  <FileText className="w-4 h-4" />
                  <span>Impressum</span>
                </button>
                <button
                  onClick={onNavigateToDatenschutz}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-base"
                >
                  <Shield className="w-4 h-4" />
                  <span>Datenschutz</span>
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-6 text-lg">Contact</h4>
              <div className="space-y-3 text-base text-gray-600">
                <p>support@mindstory.app</p>
                <p>© 2024 MindStory</p>
                <p className="text-sm">Made with ❤️ for your authentic journey</p>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Avatar Setup Modal */}
      <AvatarSetupModal
        isOpen={showAvatarSetup}
        onComplete={handleAvatarSetupComplete}
        onSkip={handleAvatarSetupSkip}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  )
}

export default Home