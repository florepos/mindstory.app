import React, { useState, useEffect } from 'react'
import { Globe, Users, Calendar, Trophy, TrendingUp, Target, Clock, Hash, User, Heart, MessageCircle, Share2 } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { formatDate } from '../utils/date'

const PublicChallengeFeed = () => {
  const [challenges, setChallenges] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('active') // 'active', 'upcoming', 'completed'

  useEffect(() => {
    fetchPublicChallenges()
  }, [filter])

  const fetchPublicChallenges = async () => {
    try {
      setLoading(true)
      setError(null)

      let query = supabase
        .from('goals')
        .select(`
          *,
          profiles!goals_user_id_fkey (
            display_name,
            avatar_url
          ),
          goal_participants (
            id,
            user_id,
            total_progress,
            last_activity,
            profiles!goal_participants_user_id_fkey (
              display_name,
              avatar_url
            )
          )
        `)
        .eq('privacy_level', 'public_challenge')
        .order('created_at', { ascending: false })

      // Apply filters
      const now = new Date().toISOString().split('T')[0]
      if (filter === 'active') {
        query = query
          .lte('challenge_start_date', now)
          .gte('challenge_end_date', now)
      } else if (filter === 'upcoming') {
        query = query.gt('challenge_start_date', now)
      } else if (filter === 'completed') {
        query = query.lt('challenge_end_date', now)
      }

      const { data, error } = await query.limit(20)

      if (error) throw error

      setChallenges(data || [])
    } catch (error) {
      console.error('Error fetching public challenges:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const joinChallenge = async (challengeId) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        alert('Please sign in to join challenges')
        return
      }

      const { error } = await supabase
        .from('goal_participants')
        .insert([{
          goal_id: challengeId,
          user_id: user.id,
          status: 'active'
        }])

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          alert('You are already participating in this challenge!')
        } else {
          throw error
        }
      } else {
        alert('Successfully joined the challenge!')
        fetchPublicChallenges() // Refresh the list
      }
    } catch (error) {
      console.error('Error joining challenge:', error)
      alert('Failed to join challenge. Please try again.')
    }
  }

  const getChallengeStatus = (challenge) => {
    const now = new Date()
    const startDate = new Date(challenge.challenge_start_date)
    const endDate = new Date(challenge.challenge_end_date)

    if (now < startDate) return 'upcoming'
    if (now > endDate) return 'completed'
    return 'active'
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-100 text-blue-800'
      case 'completed':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-green-100 text-green-800'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'upcoming':
        return 'Starting Soon'
      case 'completed':
        return 'Completed'
      default:
        return 'Active'
    }
  }

  if (loading) {
    return (
      <div className="premium-card p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-gray-600 font-medium">Loading challenges...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="premium-card p-8 border-error-200 bg-gradient-to-br from-error-50/50 to-transparent">
        <div className="text-center text-error-600">
          <p className="font-bold text-lg mb-2">Error loading challenges</p>
          <p className="text-base mb-6">{error}</p>
          <button 
            onClick={fetchPublicChallenges}
            className="btn-premium bg-gradient-to-r from-error-500 to-error-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="premium-card p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold gradient-text-premium">Public Challenges</h2>
            <p className="text-gray-600">Join the community and achieve together</p>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex space-x-2">
          {['active', 'upcoming', 'completed'].map((filterOption) => (
            <button
              key={filterOption}
              onClick={() => setFilter(filterOption)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                filter === filterOption
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {filterOption}
            </button>
          ))}
        </div>
      </div>

      {challenges.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Globe className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <p className="text-xl font-bold mb-2">No {filter} challenges</p>
          <p className="text-lg">Check back later for new challenges!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {challenges.map((challenge) => {
            const status = getChallengeStatus(challenge)
            const participantCount = challenge.goal_participants?.length || 0
            const topParticipants = challenge.goal_participants
              ?.sort((a, b) => (b.total_progress || 0) - (a.total_progress || 0))
              ?.slice(0, 3) || []

            return (
              <div
                key={challenge.id}
                className="glass-card p-6 rounded-2xl hover:shadow-premium-lg transition-all duration-300 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{challenge.symbol}</div>
                      <div>
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-xl font-bold text-gray-800">{challenge.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                            {getStatusText(status)}
                          </span>
                        </div>
                        <p className="text-gray-600">{challenge.description}</p>
                        <div className="flex items-center space-x-1 mt-1">
                          <span className="text-sm text-gray-500">by</span>
                          <span className="text-sm font-medium text-gray-700">
                            {challenge.profiles?.display_name || 'Anonymous'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-1 text-gray-600 mb-1">
                        <Users className="w-4 h-4" />
                        <span className="text-sm font-medium">{participantCount}</span>
                      </div>
                      {challenge.max_participants && (
                        <span className="text-xs text-gray-500">
                          / {challenge.max_participants} max
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Challenge Details */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                    {challenge.challenge_start_date && (
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500">Starts</div>
                          <div className="text-sm font-medium">
                            {formatDate(challenge.challenge_start_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {challenge.challenge_end_date && (
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500">Ends</div>
                          <div className="text-sm font-medium">
                            {formatDate(challenge.challenge_end_date)}
                          </div>
                        </div>
                      </div>
                    )}

                    {challenge.frequency && (
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500">Frequency</div>
                          <div className="text-sm font-medium">{challenge.frequency}x/week</div>
                        </div>
                      </div>
                    )}

                    {challenge.total_target && (
                      <div className="flex items-center space-x-2">
                        <Target className="w-4 h-4 text-gray-500" />
                        <div>
                          <div className="text-xs text-gray-500">Target</div>
                          <div className="text-sm font-medium">
                            {challenge.total_target} {challenge.target_unit || 'completions'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Top Participants */}
                  {topParticipants.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">Top Participants</h4>
                      <div className="flex items-center space-x-3">
                        {topParticipants.map((participant, index) => (
                          <div key={participant.id} className="flex items-center space-x-2">
                            <div className="relative">
                              {participant.profiles?.avatar_url ? (
                                <img
                                  src={participant.profiles.avatar_url}
                                  alt={participant.profiles.display_name}
                                  className="w-8 h-8 rounded-full object-cover border-2 border-white"
                                />
                              ) : (
                                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border-2 border-white">
                                  <User className="w-4 h-4 text-gray-600" />
                                </div>
                              )}
                              {index === 0 && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                                  <Trophy className="w-2 h-2 text-white" />
                                </div>
                              )}
                            </div>
                            <div className="text-xs">
                              <div className="font-medium text-gray-700">
                                {participant.profiles?.display_name || 'Anonymous'}
                              </div>
                              <div className="text-gray-500">
                                {participant.total_progress || 0} {challenge.target_unit || 'done'}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 50) + 10}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 20) + 5}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                        <Share2 className="w-4 h-4 text-gray-600" />
                      </button>
                      
                      {status === 'active' && (
                        <button
                          onClick={() => joinChallenge(challenge.id)}
                          className="btn-premium text-sm px-4 py-2"
                        >
                          Join Challenge
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default PublicChallengeFeed