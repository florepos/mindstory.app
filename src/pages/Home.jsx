import React, { useState, useEffect } from 'react'
import SearchInput from '../components/SearchInput'
import PublicGoalsSlider from '../components/PublicGoalsSlider'
import PublicGoalsFeed from '../components/PublicGoalsFeed'
import CookieConsent from 'react-cookie-consent'
import { Brain, FileText, Shield } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

const Home = () => {
  const [goals, setGoals] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPublicGoals()
  }, [search])

  async function fetchPublicGoals() {
    let q = supabase
      .from('goals')
      .select('*')
      .eq('privacy_level', 'public_challenge')
      .order('created_at', { ascending: false })
    if (search) q = q.ilike('name', '%' + search + '%')
    const { data, error } = await q
    if (error) console.error('Error fetching public goals:', error)
    setGoals(data || [])
  }

  return (
    <div>
      <nav className="p-4">
        <div className="flex flex-col">
          <div className="flex items-center space-x-2">
            <Brain className="w-6 h-6 text-primary-500" />
            <span className="font-bold text-lg">MindStory</span>
          </div>
          <div className="mt-1">
            <span className="bg-primary-500 text-white px-2 py-0.5 rounded text-sm">Level 1</span>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-br from-purple-600 to-indigo-700 text-white p-12 text-center">
        <h1 className="text-4xl font-extrabold mb-4">MindStory</h1>
        <p className="mb-6 text-lg">Deine Reise zu mehr Erfolg und Motivation</p>
        <a href="/signup" className="btn btn-primary">Jetzt kostenlos starten</a>
      </header>

      <section className="py-12 container mx-auto">
        <h2 className="text-2xl font-bold mb-4">Öffentliche Ziele durchsuchen</h2>
        <SearchInput value={search} onChange={setSearch} placeholder="Suchen…" />
        <PublicGoalsSlider goals={goals} />
      </section>

      <section className="py-12 bg-gray-50">
        <div className="container mx-auto">
          <h2 className="text-2xl font-bold mb-4">Letzte Erfolge</h2>
          <PublicGoalsFeed goals={goals} />
          {goals.length === 0 && <p className="text-center text-gray-500">Noch keine Ziele.</p>}
        </div>
      </section>

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
                <a href="/impressum.html" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-sm">
                  <FileText className="w-4 h-4" />
                  <span>Impressum</span>
                </a>
                <a href="/privacy.html" className="flex items-center space-x-2 text-gray-600 hover:text-primary-600 transition-colors text-sm">
                  <Shield className="w-4 h-4" />
                  <span>Datenschutz</span>
                </a>
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

      <CookieConsent
        location="bottom"
        buttonText="Akzeptieren"
        cookieName="mindstory_cookies"
        style={{ background: "#2B373B" }}
        buttonStyle={{ color: "#ffffff", fontSize: "13px" }}
        expires={150}
      >
        Diese Seite nutzt Cookies 🍪 …
      </CookieConsent>
    </div>
  )
}

export default Home