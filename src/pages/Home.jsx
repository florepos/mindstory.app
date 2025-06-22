import React, { useState, useEffect } from 'react'
import GoalSlider from '../components/GoalSlider'
import TrackButton from '../components/TrackButton'
import AvatarSetupModal from '../components/AvatarSetupModal'
import AuthModal from '../components/AuthModal'
import { Brain, Sparkles, Target, TrendingUp, Award, Zap, Star, Heart, Activity, FileText, Shield, LogIn, Loader2, Menu, LogOut } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const Home = ({ onNavigateToTracking, onNavigateToImpressum, onNavigateToDatenschutz, user, loading }) => {
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [refreshGoals, setRefreshGoals] = useState(0)
  const [userProfile, setUserProfile] = useState(null)
  const [showAvatarSetup, setShowAvatarSetup] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showBurgerMenu, setShowBurgerMenu] = useState(false)

  useEffect(() => {
    if (user) {
      fetchUserProfile(user.id)
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-yellow-50/50">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-4 sm:left-10 w-20 sm:w-32 h-20 sm:h-32 bg-gradient-to-br from-orange-200/30 to-rose-200/30 rounded-full blur-xl floating-element"></div>
        <div className="absolute top-40 right-4 sm:right-20 w-16 sm:w-24 h-16 sm:h-24 bg-gradient-to-br from-yellow-200/30 to-orange-200/30 rounded-full blur-xl floating-element" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/4 w-24 sm:w-40 h-24 sm:h-40 bg-gradient-to-br from-rose-200/20 to-yellow-200/20 rounded-full blur-2xl floating-element" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Simplified Header */}
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

      {/* Main Content - Improved responsiveness */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-16 space-y-6 sm:space-y-12 lg:space-y-16">
        {/* Hero Section - Better mobile spacing */}
        <section className="text-center animate-in">
          <div className="relative">
            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-800 mb-4 sm:mb-6 lg:mb-8 text-balance leading-tight">
              Welcome back! 
              <span className="inline-block ml-2 sm:ml-3 text-4xl sm:text-6xl animate-bounce-gentle">👋</span>
            </h2>
            <p className="text-gray-600 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed text-balance mb-6 sm:mb-8 lg:mb-12 px-4">
              Let's continue building your success story, one meaningful goal at a time.
            </p>
            
            {/* Floating Action Hint */}
            <div className="inline-flex items-center space-x-2 sm:space-x-3 glass-card px-4 sm:px-6 py-2 sm:py-3 animate-fade-in-delayed">
              <Heart className="w-4 sm:w-5 h-4 sm:h-5 text-rose-500 animate-pulse-soft" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Your journey to wellness starts here</span>
            </div>
          </div>
        </section>

        {/* Premium Layout */}
        <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Goals Section */}
          <div className="xl:col-span-2 space-y-6 sm:space-y-8 lg:space-y-12">
            <div className="animate-slide-up">
              <GoalSlider 
                selectedGoalId={selectedGoalId}
                onGoalSelect={handleGoalSelect}
                refreshTrigger={refreshGoals}
              />
            </div>
            {loading ? (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="premium-card p-8 text-center">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary-500" />
                  <p className="text-gray-600">Loading...</p>
                </div>
              </div>
            ) : user ? (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="premium-card p-8 text-center">
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-700 mb-2">Ready to Create Goals</h3>
                  <p className="text-gray-500">Use the + button in the goal slider above to create your first goal</p>
                </div>
              </div>
            ) : (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <div className="premium-card p-8 text-center">
                  <div className="p-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl w-16 h-16 mx-auto mb-6 flex items-center justify-center">
                    <LogIn className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Sign in to Create Goals</h3>
                  <p className="text-gray-600 mb-6">
                    Please sign in to your account to start creating and tracking your personal goals.
                  </p>
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="btn-premium"
                  >
                    Sign In
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Tracking Section */}
          <div className="xl:col-span-1">
            <div className="xl:sticky xl:top-32 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              {user ? (
                <TrackButton 
                  selectedGoalId={selectedGoalId}
                  onTrack={handleTrackGoal} 
                />
              ) : (
                <div className="premium-card p-6 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Track Your Progress</h3>
                  <p className="text-gray-500 text-sm">Sign in to start tracking your goals</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Premium Stats Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.6s' }}>
          <div className="text-center mb-6 sm:mb-8 lg:mb-12">
            <h3 className="text-2xl sm:text-3xl font-bold gradient-text-premium mb-2 sm:mb-4">Your Progress</h3>
            <p className="text-gray-600 text-base sm:text-lg">Track your journey to success</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            <div className="premium-card premium-card-hover p-4 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-3 sm:p-5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl sm:rounded-3xl w-12 sm:w-20 h-12 sm:h-20 mx-auto mb-3 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Target className="w-6 sm:w-10 h-6 sm:h-10 text-white" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold gradient-text-premium mb-2 sm:mb-4">
                  12
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Active Goals</div>
                <div className="w-full bg-primary-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-primary-500 to-primary-600 h-2 sm:h-3 rounded-full w-3/4 transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>

            <div className="premium-card premium-card-hover p-4 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-success-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-3 sm:p-5 bg-gradient-to-br from-success-500 to-success-600 rounded-2xl sm:rounded-3xl w-12 sm:w-20 h-12 sm:h-20 mx-auto mb-3 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Award className="w-6 sm:w-10 h-6 sm:h-10 text-white" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold bg-gradient-to-r from-success-600 to-success-700 bg-clip-text text-transparent mb-2 sm:mb-4">
                  8
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Completed</div>
                <div className="w-full bg-success-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-success-500 to-success-600 h-2 sm:h-3 rounded-full w-4/5 transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>

            <div className="premium-card premium-card-hover p-4 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-3 sm:p-5 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-2xl sm:rounded-3xl w-12 sm:w-20 h-12 sm:h-20 mx-auto mb-3 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <TrendingUp className="w-6 sm:w-10 h-6 sm:h-10 text-white" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold bg-gradient-to-r from-secondary-600 to-secondary-700 bg-clip-text text-transparent mb-2 sm:mb-4">
                  67%
                </div>
                <div className="text-gray-600 font-semibold mb-2 sm:mb-4 text-sm sm:text-lg">Success Rate</div>
                <div className="w-full bg-secondary-100 rounded-full h-2 sm:h-3 overflow-hidden">
                  <div className="bg-gradient-to-r from-secondary-500 to-secondary-600 h-2 sm:h-3 rounded-full w-2/3 transition-all duration-1000 shadow-inner-premium"></div>
                </div>
              </div>
            </div>

            <div className="premium-card premium-card-hover p-4 sm:p-8 text-center group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-warning-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative z-10">
                <div className="p-3 sm:p-5 bg-gradient-to-br from-warning-500 to-error-500 rounded-2xl sm:rounded-3xl w-12 sm:w-20 h-12 sm:h-20 mx-auto mb-3 sm:mb-6 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-premium">
                  <Zap className="w-6 sm:w-10 h-6 sm:h-10 text-white" />
                </div>
                <div className="text-2xl sm:text-5xl font-bold bg-gradient-to-r from-warning-600 to-error-600 bg-clip-text text-transparent mb-2 sm:mb-4">
                  24
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
        <section className="text-center py-6 sm:py-8 lg:py-16 animate-fade-in-delayed">
          <div className="glass-card p-6 sm:p-12 max-w-4xl mx-auto">
            <Sparkles className="w-8 sm:w-12 h-8 sm:h-12 text-amber-500 mx-auto mb-4 sm:mb-6 animate-pulse-soft" />
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 sm:mb-4">
              "The journey of a thousand miles begins with one step."
            </h3>
            <p className="text-gray-600 text-base sm:text-lg">
              Every goal you set, every step you take, brings you closer to the life you envision.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white/60 backdrop-blur-xl border-t border-white/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-xl">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold gradient-text-premium">MindStory</h3>
              </div>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed max-w-md">
                Transform your dreams into reality with our premium wellness and goal tracking platform.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Legal</h4>
              <div className="space-y-2">
                <button
                  onClick={onNavigateToImpressum}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Impressum</span>
                </button>
                <button
                  onClick={onNavigateToDatenschutz}
                  className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-sm"
                >
                  <Shield className="w-4 h-4" />
                  <span>Datenschutz</span>
                </button>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-800 mb-4">Contact</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>support@mindstory.app</p>
                <p>© 2024 MindStory</p>
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