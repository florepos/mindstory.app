import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, BarChart3, Calendar, Target, Zap, Plus, Lock, Users, Globe } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import GoalFeed from './GoalFeed'
import EnhancedCreateGoalModal from './EnhancedCreateGoalModal'
import GoalEditModal from './GoalEditModal'

const GoalSlider = ({ selectedGoalId, onGoalSelect, refreshTrigger }) => {
  const [goals, setGoals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [feedGoal, setFeedGoal] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [longPressTimer, setLongPressTimer] = useState(null)

  useEffect(() => {
    fetchGoals()
  }, [refreshTrigger])

  const fetchGoals = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        setGoals([])
        setLoading(false)
        return
      }

      // Simple query without complex joins to avoid RLS issues
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Supabase error:', error)
        throw error
      }

      setGoals(data || [])
      
      if (data && data.length > 0 && !selectedGoalId) {
        onGoalSelect(data[0].id)
      }
    } catch (error) {
      console.error('Error fetching goals:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const scrollLeft = () => {
    const container = document.getElementById('goals-container')
    container.scrollBy({ left: -320, behavior: 'smooth' })
  }

  const scrollRight = () => {
    const container = document.getElementById('goals-container')
    container.scrollBy({ left: 320, behavior: 'smooth' })
  }

  const handleGoalClick = (goalId) => {
    onGoalSelect(goalId)
  }

  const handleFeedClick = (e, goal) => {
    e.stopPropagation()
    setFeedGoal(goal)
  }

  const handleCreateGoal = (newGoal) => {
    setGoals(prev => [newGoal, ...prev])
    onGoalSelect(newGoal.id)
    setShowCreateModal(false)
  }

  // Updated to 2 seconds as requested
  const handleLongPress = (goal) => {
    const timer = setTimeout(() => {
      setEditingGoal(goal)
      setShowEditModal(true)
    }, 2000) // Changed from 800ms to 2000ms (2 seconds)
    setLongPressTimer(timer)
  }

  const handleLongPressEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer)
      setLongPressTimer(null)
    }
  }

  const handleGoalUpdated = (updatedGoal) => {
    setGoals(prev => prev.map(g => g.id === updatedGoal.id ? updatedGoal : g))
    setShowEditModal(false)
    setEditingGoal(null)
  }

  const handleGoalDeleted = (deletedGoalId) => {
    setGoals(prev => {
      const updated = prev.filter(g => g.id !== deletedGoalId)
      if (selectedGoalId === deletedGoalId) {
        onGoalSelect(updated.length ? updated[0].id : null)
      }
      return updated
    })
    setShowEditModal(false)
    setEditingGoal(null)
  }

  const getGoalTypeIcon = (goal) => {
    // Check both goal_type and privacy_level for compatibility
    const type = goal.privacy_level || goal.goal_type
    
    switch (type) {
      case 'private':
        return null // No icon for private goals as requested
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
  
  if (loading) {
    return (
      <div className="premium-card p-12 mb-12">
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"></div>
          <span className="ml-4 text-gray-600 font-semibold text-lg">Loading goals...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="premium-card p-12 mb-12 border-error-200 bg-gradient-to-br from-error-50/50 to-transparent">
        <div className="text-center text-error-600">
          <p className="font-bold text-xl mb-2">Error loading goals</p>
          <p className="text-base mb-8">{error}</p>
          <button 
            onClick={fetchGoals}
            className="btn-premium bg-gradient-to-r from-error-500 to-error-600"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (goals.length === 0) {
    return (
      <div className="premium-card p-12 mb-12">
        <div className="text-center text-gray-500">
          <Target className="w-16 h-16 mx-auto mb-6 text-gray-300" />
          <p className="text-xl font-bold mb-2">No goals yet</p>
          <p className="text-lg">Create your first goal to get started!</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="premium-card p-12 mb-12 overflow-hidden relative">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50/30 to-secondary-50/30"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center space-x-6">
              <div className="p-4 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 rounded-3xl shadow-premium">
                <Target className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold gradient-text-premium">Your Goals</h2>
                <p className="text-lg text-gray-600">Select a goal to start tracking</p>
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="p-4 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-2xl flex items-center justify-center"
                title="Create new goal"
              >
                <Plus className="w-6 h-6 text-primary-600" />
              </button>
              <button
                onClick={scrollLeft}
                className="p-4 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-2xl"
              >
                <ChevronLeft className="w-6 h-6 text-gray-600" />
              </button>
              <button
                onClick={scrollRight}
                className="p-4 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-2xl"
              >
                <ChevronRight className="w-6 h-6 text-gray-600" />
              </button>
            </div>
          </div>

          <div 
            id="goals-container"
            className="flex space-x-4 overflow-x-auto scrollbar-hide pb-6" // Changed from space-x-8 to space-x-4 (-16px)
          >
            {goals.map((goal) => {
              const isSelected = selectedGoalId === goal.id
              
              return (
                <div
                  key={goal.id}
                  onClick={() => handleGoalClick(goal.id)}
                  onMouseDown={() => handleLongPress(goal)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={() => handleLongPress(goal)}
                  onTouchEnd={handleLongPressEnd}
                  className={`flex-shrink-0 w-80 rounded-3xl shadow-premium hover:shadow-premium-lg transition-all duration-500 transform hover:scale-105 border cursor-pointer relative overflow-hidden group ${
                    isSelected 
                      ? 'bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 text-white shadow-premium-xl pulse-glow' 
                      : 'glass-card glass-card-hover'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Goal Type Indicator - Only show for friends and public goals */}
                  {getGoalTypeIcon(goal) && (
                    <div className="absolute top-6 right-6 z-20">
                      <div className={`p-3 rounded-full shadow-premium ${
                        isSelected 
                          ? 'bg-white/20 backdrop-blur-sm' 
                          : 'bg-white/90 backdrop-blur-sm'
                      }`}>
                        {getGoalTypeIcon(goal)}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative z-10 p-10">
                    <div className="text-center mb-8">
                      <div className={`text-6xl mb-6 transition-all duration-500 ${
                        isSelected ? 'animate-pulse-soft scale-110' : 'group-hover:scale-110'
                      }`}>
                        {goal.symbol || '🎯'}
                      </div>
                      <h3 className={`text-xl font-bold mb-4 line-clamp-2 ${
                        isSelected ? 'text-white' : 'text-gray-800'
                      }`}>
                        {goal.name}
                      </h3>
                      {goal.description && (
                        <p className={`text-base line-clamp-3 ${
                          isSelected ? 'text-white/90' : 'text-gray-600'
                        }`}>
                          {goal.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm mb-6">
                      {(goal.privacy_level || goal.goal_type) && (
                        <span className={`px-4 py-2 rounded-full capitalize font-semibold ${
                          isSelected 
                            ? 'bg-white/20 text-white' 
                            : 'bg-primary-100 text-primary-700'
                        }`}>
                          {(goal.privacy_level || goal.goal_type)?.replace('_', ' ')}
                        </span>
                      )}
                      <button
                        onClick={(e) => handleFeedClick(e, goal)}
                        className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                          isSelected 
                            ? 'bg-white/20 hover:bg-white/30 text-white' 
                            : 'bg-primary-100 hover:bg-primary-200 text-primary-700'
                        }`}
                        title="View progress feed"
                      >
                        <BarChart3 className="w-5 h-5" />
                      </button>
                    </div>

                    {goal.deadline && (
                      <div className={`flex items-center justify-center text-sm mb-4 ${
                        isSelected ? 'text-white/90' : 'text-gray-500'
                      }`}>
                        <Calendar className="w-4 h-4 mr-2" />
                        Due: {new Date(goal.deadline).toLocaleDateString()}
                      </div>
                    )}

                    {goal.target_weekly_frequency && (
                      <div className={`flex items-center justify-center text-sm mb-4 ${
                        isSelected ? 'text-white/90' : 'text-gray-500'
                      }`}>
                        <Zap className="w-4 h-4 mr-2" />
                        Target: {goal.target_weekly_frequency}x per week
                      </div>
                    )}

                    {goal.target_absolute && (
                      <div className={`flex items-center justify-center text-sm mb-4 ${
                        isSelected ? 'text-white/90' : 'text-gray-500'
                      }`}>
                        <Target className="w-4 h-4 mr-2" />
                        Target: {goal.target_absolute} total
                      </div>
                    )}

                    {isSelected && (
                      <div className="text-center">
                        <div className="inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold bg-white/20 text-white">
                          <div className="w-2 h-2 bg-white rounded-full mr-3 animate-pulse"></div>
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
      </div>

      <GoalFeed 
        goal={feedGoal}
        isOpen={!!feedGoal}
        onClose={() => setFeedGoal(null)}
      />

      <EnhancedCreateGoalModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGoalCreated={handleCreateGoal}
      />

      <GoalEditModal
        isOpen={showEditModal}
        goal={editingGoal}
        onClose={() => {
          setShowEditModal(false)
          setEditingGoal(null)
        }}
        onGoalUpdated={handleGoalUpdated}
        onGoalDeleted={handleGoalDeleted}
      />
    </>
  )
}

export default GoalSlider