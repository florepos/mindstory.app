import React, { useState, useEffect } from 'react'
import Home from './pages/Home'
import TrackingScreen from './pages/TrackingScreen'
import Impressum from './pages/Impressum'
import Datenschutz from './pages/Datenschutz'
import CookieBanner from './components/CookieBanner'
import { supabase } from './services/supabaseClient'

function App() {
  const [currentScreen, setCurrentScreen] = useState('home') // 'home', 'tracking', 'impressum', 'datenschutz'
  const [showCookieBanner, setShowCookieBanner] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setLoading(false)
    }

    getSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    // Check if user has already accepted cookies
    const cookieConsent = localStorage.getItem('cookieConsent')
    if (!cookieConsent) {
      setShowCookieBanner(true)
    }

    return () => subscription.unsubscribe()
  }, [])

  const navigateToTracking = () => {
    // Only allow navigation to tracking if user is logged in
    if (!user) {
      alert('Please sign in to access the tracking screen')
      return
    }
    setCurrentScreen('tracking')
  }

  const navigateToHome = () => {
    setCurrentScreen('home')
  }

  const navigateToImpressum = () => {
    setCurrentScreen('impressum')
  }

  const navigateToDatenschutz = () => {
    setCurrentScreen('datenschutz')
  }

  const handleCookieAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowCookieBanner(false)
  }

  const handleCookieDecline = () => {
    localStorage.setItem('cookieConsent', 'declined')
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    setShowCookieBanner(false)
  }

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'tracking':
        return user ? <TrackingScreen onBack={navigateToHome} /> : <Home 
          onNavigateToTracking={navigateToTracking}
          onNavigateToImpressum={navigateToImpressum}
          onNavigateToDatenschutz={navigateToDatenschutz}
        />
      case 'impressum':
        return <Impressum onBack={navigateToHome} />
      case 'datenschutz':
        return <Datenschutz onBack={navigateToHome} />
      default:
        return (
          <Home 
            onNavigateToTracking={navigateToTracking}
            onNavigateToImpressum={navigateToImpressum}
            onNavigateToDatenschutz={navigateToDatenschutz}
            user={user}
            loading={loading}
          />
        )
    }
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
    <>
      {renderCurrentScreen()}
      {showCookieBanner && (
        <CookieBanner
          onAccept={handleCookieAccept}
          onDecline={handleCookieDecline}
          onSettings={navigateToDatenschutz}
        />
      )}
    </>
  )
}

export default App