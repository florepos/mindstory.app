import React, { useState, useEffect } from 'react'
import { Globe, Heart, TrendingUp, Calendar, Camera, Check, X, User, Sparkles } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { formatDate } from '../utils/date'

const PublicGoalFeed = () => {
  const [publicEntries, setPublicEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchPublicEntries()
  }, [])

  const fetchPublicEntries = async () => {
    try {
      setLoading(true)
      setError(null)

      // Use separate queries to avoid complex joins that cause relationship errors
      const { data: entryData, error: entryError } = await supabase
        .from('goal_entries')
        .select(`
          *,
          goals (
            id,
            name,
            symbol,
            goal_type,
            user_id
          )
        `)
        .order('completed_at', { ascending: false })
        .limit(10)

      if (entryError) throw entryError

      // Filter for public entries only
      const publicEntryData = entryData.filter(entry => 
        entry.goals && entry.goals.goal_type === 'public'
      )

      // Get user profiles for entry creators
      const userIds = publicEntryData.map(e => e.user_id).filter(Boolean)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('user_id, display_name, avatar_url')
        .in('user_id', userIds)

      if (profileError) throw profileError

      // Combine the data
      const enrichedEntries = publicEntryData.map(entry => {
        const userProfile = profileData.find(p => p.user_id === entry.user_id)
        return {
          ...entry,
          user_profile: userProfile
        }
      })

      setPublicEntries(enrichedEntries)
    } catch (error) {
      console.error('Error fetching public entries:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <Check className="w-4 h-4 text-white" />
      case 'done_with_photo':
        return <Camera className="w-4 h-4 text-white" />
      case 'not_done':
        return <X className="w-4 h-4 text-white" />
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

  if (loading) {
    return (
      <div className="premium-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-gray-600 font-medium">Loading community goals...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="premium-card p-8 border-error-200 bg-gradient-to-br from-error-50/50 to-transparent">
        <div className="text-center text-error-600">
          <p className="font-bold text-lg mb-2">Error loading community goals</p>
          <p className="text-base mb-6">{error}</p>
          <button 
            onClick={fetchPublicEntries}
            className="btn-premium bg-gradient-to-r from-error-500 to-error-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (publicEntries.length === 0) {
    return (
      <div className="premium-card p-12">
        <div className="text-center text-gray-500">
          <Globe className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <p className="text-xl font-bold mb-2">No public goals yet</p>
          <p className="text-lg">Be the first to share your journey with the community!</p>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card p-8">
      <div className="space-y-6">
        {publicEntries.map((entry) => (
          <div
            key={entry.id}
            className="glass-card p-6 rounded-2xl hover:shadow-premium-lg transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {entry.user_profile?.avatar_url ? (
                    <img
                      src={entry.user_profile.avatar_url}
                      alt={entry.user_profile.display_name}
                      className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-premium"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center border-2 border-white shadow-premium">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-800">
                      {entry.user_profile?.display_name || 'Anonymous User'}
                    </div>
                    <div className="text-sm text-gray-600 flex items-center space-x-1">
                      <Globe className="w-3 h-3" />
                      <span>Public Goal</span>
                    </div>
                  </div>
                </div>
                
                <div className={`p-2 rounded-full bg-gradient-to-r ${getStatusColor(entry.status)} shadow-premium`}>
                  {getStatusIcon(entry.status)}
                </div>
              </div>

              {/* Goal Info */}
              <div className="flex items-center space-x-3 mb-4">
                <div className="text-3xl">{entry.goals?.symbol || '🎯'}</div>
                <div>
                  <h4 className="font-bold text-lg text-gray-800">{entry.goals?.name}</h4>
                  <p className="text-sm text-gray-600">{getStatusText(entry.status)}</p>
                </div>
              </div>

              {/* Photo */}
              {entry.photo_url && (
                <div className="mb-4">
                  <img
                    src={entry.photo_url}
                    alt="Progress photo"
                    className="w-full h-48 object-cover rounded-xl shadow-premium"
                  />
                </div>
              )}

              {/* Comment */}
              {entry.comment && (
                <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                  <p className="text-gray-700 leading-relaxed">"{entry.comment}"</p>
                </div>
              )}

              {/* Footer */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(entry.completed_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>Progress</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Heart className="w-4 h-4 text-gray-400 hover:text-rose-500" />
                  </button>
                  <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                    <Sparkles className="w-4 h-4 text-gray-400 hover:text-amber-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {publicEntries.length >= 10 && (
        <div className="text-center mt-8">
          <button
            onClick={fetchPublicEntries}
            className="btn-secondary-premium"
          >
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

export default PublicGoalFeed