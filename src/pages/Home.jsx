import React, { useState, useEffect } from 'react'
import GoalSlider from '../components/GoalSlider'
import TrackButton from '../components/TrackButton'
import AvatarSetupModal from '../components/AvatarSetupModal'
import AuthModal from '../components/AuthModal'
import PublicChallengeFeed from '../components/PublicChallengeFeed'
import { Brain, Sparkles, Target, TrendingUp, Award, Zap, Star, Heart, Activity, FileText, Shield, LogIn, Loader2, Menu, LogOut, Users, Globe, Camera, CheckCircle } from 'lucide-react'
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

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    }
    fetchPublicGoals()
    fetchRecentEntries()
  }, [user])

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
        // No profile exists, show avatar setup
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
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('privacy_level', 'public_challenge')
        .order('created_at', { ascending: false })
        .limit(6)

      if (error) throw error
      setPublicGoals(data || [])
    } catch (error) {
      console.error('Error fetching public goals:', error)
    }
  }

  const fetchRecentEntries = async () => {
    try {
      // First, fetch goal entries with their associated goals
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

      // Filter for public entries only
      const publicEntries = (entriesData || []).filter(entry => 
        entry.goals && entry.goals.privacy_level === 'public_challenge'
      )

      if (publicEntries.length === 0) {
        setRecentEntries([])
        return
      }

      // Extract unique user IDs from the entries
      const userIds = [...new Set(publicEntries.map(entry => entry.user_id))]

      // Fetch profiles for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      if (profilesError) throw profilesError

      // Create a map of user_id to profile for easy lookup
      const profilesMap = (profilesData || []).reduce((acc, profile) => {
        acc[profile.user_id] = profile
        return acc
      }, {})

      // Merge profiles data into entries
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
    // Fetch the profile that was created during skip
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

      {/* Hero Section */}
      <section className="relative py-16 sm:py-24 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-in">
            <h2 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 sm:mb-8 text-balance leading-tight">
              Welcome to 
              <span className="gradient-text-premium block sm:inline sm:ml-4">MindStory</span>
              <span className="inline-block ml-2 sm:ml-3 text-5xl sm:text-7xl animate-bounce-gentle">✨</span>
            </h2>
            <p className="text-gray-600 text-lg sm:text-2xl max-w-4xl mx-auto leading-relaxed text-balance mb-8 sm:mb-12 px-4">
              Transform your dreams into reality with our premium wellness and goal tracking platform. 
              Join thousands who are already living their best life.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-12">
              {!user ? (
                <>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-premium text-lg px-8 py-4 w-full sm:w-auto"
                  >
                    Start Your Journey
                  </button>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-secondary-premium text-lg px-8 py-4 w-full sm:w-auto"
                  >
                    Sign In
                  </button>
                </>
              ) : (
                <button
                  onClick={onNavigateToTracking}
                  className="btn-premium text-lg px-8 py-4 w-full sm:w-auto"
                >
                  Continue Your Journey
                </button>
              )}
            </div>

            {/* Feature Highlights */}
            <div className="inline-flex items-center space-x-2 sm:space-x-3 glass-card px-4 sm:px-6 py-2 sm:py-3 animate-fade-in-delayed">
              <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-rose-500 animate-pulse-soft" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Join 10,000+ users achieving their goals</span>
              <Star className="w-4 sm:w-5 h-4 sm:h-5 text-amber-500 animate-pulse-soft" />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        
        {/* User Goals Section (if logged in) */}
        {user && (
          <section className="animate-slide-up">
            <GoalSlider 
              selectedGoalId={selectedGoalId}
              onGoalSelect={handleGoalSelect}
              refreshTrigger={refreshGoals}
            />
          </section>
        )}

        {/* Tracking Section (if logged in) */}
        {user && (
          <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <TrackButton 
              selectedGoalId={selectedGoalId}
              onTrack={handleTrackGoal} 
            />
          </section>
        )}

        {/* Public Challenges Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-500 rounded-3xl shadow-premium">
                <Globe className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold gradient-text-premium mb-4">Public Challenges</h3>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
              Join the community and achieve your goals together with others
            </p>
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
                    <div className="text-4xl sm:text-5xl mb-4 group-hover:scale-110 transition-transform duration-500">
                      {goal.symbol || '🎯'}
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-3">{goal.name}</h4>
                    <p className="text-gray-600 mb-4 line-clamp-2">{goal.description}</p>
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
                    <button className="btn-secondary-premium w-full">
                      View Challenge
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Globe className="w-16 h-16 mx-auto mb-6 text-gray-300" />
              <p className="text-xl font-semibold text-gray-500 mb-2">No public challenges yet</p>
              <p className="text-gray-400">Be the first to create a public challenge!</p>
            </div>
          )}
        </section>

        {/* Recent Community Activity */}
        <section className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-success-500 via-success-600 to-primary-500 rounded-3xl shadow-premium">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-3xl sm:text-4xl font-bold gradient-text-premium mb-4">Community Activity</h3>
            <p className="text-gray-600 text-lg sm:text-xl max-w-2xl mx-auto">
              See what others are achieving and get inspired
            </p>
          </div>

          {recentEntries.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="glass-card p-4 sm:p-6 rounded-2xl hover:shadow-premium-lg transition-all duration-300 group"
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-2xl">{entry.goals?.symbol || '🎯'}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{entry.goals?.name}</h4>
                      <p className="text-sm text-gray-600">{formatDate(entry.completed_at)}</p>
                    </div>
                    <div className="flex-shrink-0">
                      {entry.status === 'done_with_photo' ? (
                        <Camera className="w-5 h-5 text-primary-600" />
                      ) : (
                        <CheckCircle className="w-5 h-5 text-success-600" />
                      )}
                    </div>
                  </div>
                  
                  {entry.photo_url && (
                    <img
                      src={entry.photo_url}
                      alt="Progress"
                      className="w-full h-32 object-cover rounded-lg mb-3"
                    />
                  )}
                  
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    {entry.profiles?.avatar_url ? (
                      <img
                        src={entry.profiles.avatar_url}
                        alt={entry.profiles.display_name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium">A</span>
                      </div>
                    )}
                    <span>{entry.profiles?.display_name || 'Anonymous User'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <Activity className="w-16 h-16 mx-auto mb-6 text-gray-300" />
              <p className="text-xl font-semibold text-gray-500 mb-2">No recent activity</p>
              <p className="text-gray-400">Start tracking goals to see community activity!</p>
            </div>
          )}
        </section>

        {/* Stats Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.8s' }}>
          <div className="text-center mb-12">
            <h3 className="text-3xl sm:text-4xl font-bold gradient-text-premium mb-4">Your Progress</h3>
            <p className="text-gray-600 text-lg sm:text-xl">Track your journey to success</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="premium-card premium-card-hover p-6 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-4 sm:p-5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl sm:rounded-3xl w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Target className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>
                <div className="text-3xl sm:text-5xl font-bold gradient-text-premium mb-2 sm:mb-4">
                  {user ? '12' : '0'}
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Active Goals</div>
                <div className="w-full bg-primary-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 sm:h-3 rounded-full w-3/4 transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>

            <div className="premium-card premium-card-hover p-6 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-success-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-4 sm:p-5 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl sm:rounded-3xl w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Award className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent mb-2 sm:mb-4">
                  {user ? '8' : '0'}
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Completed</div>
                <div className="w-full bg-success-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-success-500 to-success-600 h-2 sm:h-3 rounded-full w-4/5 transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>

            <div className="premium-card premium-card-hover p-6 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-4 sm:p-5 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl sm:rounded-3xl w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <TrendingUp className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-700 bg-clip-text text-transparent mb-2 sm:mb-4">
                  {user ? '67%' : '0%'}
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Success Rate</div>
                <div className="w-full bg-secondary-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-2 sm:h-3 rounded-full w-2/3 transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>

            <div className="premium-card premium-card-hover p-6 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-warning-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-4 sm:p-5 bg-gradient-to-br from-warning-500 to-error-500 rounded-2xl sm:rounded-3xl w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-4 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Zap className="w-8 sm:w-10 h-8 sm:h-10 text-white" />
                </div>
                <div className="text-3xl sm:text-5xl font-bold bg-gradient-to-r from-warning-600 to-error-600 bg-clip-text text-transparent mb-2 sm:mb-4">
                  {user ? '24' : '0'}
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Day Streak</div>
                <div className="w-full bg-warning-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-warning-500 to-error-500 h-2 sm:h-3 rounded-full w-full transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Inspirational Footer */}
        <section className="text-center py-16 sm:py-24 animate-fade-in-delayed">
          <div className="glass-card p-8 sm:p-12 max-w-4xl mx-auto">
            <Sparkles className="w-12 sm:w-16 h-12 sm:h-16 text-amber-500 mx-auto mb-6 sm:mb-8 animate-pulse-soft" />
            <h3 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
              "The journey of a thousand miles begins with one step."
            </h3>
            <p className="text-gray-600 text-lg sm:text-xl leading-relaxed">
              Every goal you set, every step you take, brings you closer to the life you envision. 
              Start your transformation today.
            </p>
            {!user && (
              <div className="mt-8">
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="btn-premium text-lg px-8 py-4"
                >
                  Begin Your Journey
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-xl border-t border-white/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold gradient-text-premium">MindStory</h3>
              </div>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed max-w-md mb-6">
                Transform your dreams into reality with our premium wellness and goal tracking platform.
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
                <p className="text-sm">Made with ❤️ for your success</p>
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