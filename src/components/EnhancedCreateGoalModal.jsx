import React, { useState, useEffect } from 'react'
import { Plus, X, Lock, Users, Globe, Mail, Link, Check, Calendar, Target, Repeat, Clock, Hash, Zap } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const EnhancedCreateGoalModal = ({ isOpen, onClose, onGoalCreated }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: '🎯',
    goal_type: 'private',
    is_countable: false,
    target_unit: 'completions',
    frequency: 3,
    total_target: null,
    end_date: '',
    challenge_start_date: '',
    challenge_end_date: '',
    max_participants: null,
    weekdays: []
  })
  const [inviteEmails, setInviteEmails] = useState([''])

  const symbolOptions = ['🎯', '💪', '📚', '🏃', '🧘', '💼', '🎨', '🌱', '⭐', '🔥', '💎', '🚀', '🍎', '💧', '🎵', '📱']
  const weekdayOptions = [
    { value: 'monday', label: 'Mon' },
    { value: 'tuesday', label: 'Tue' },
    { value: 'wednesday', label: 'Wed' },
    { value: 'thursday', label: 'Thu' },
    { value: 'friday', label: 'Fri' },
    { value: 'saturday', label: 'Sat' },
    { value: 'sunday', label: 'Sun' }
  ]

  useEffect(() => {
    if (isOpen) {
      fetchMetrics()
    }
  }, [isOpen])

  const fetchMetrics = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_metrics')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      setMetrics(data || [])
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !user) {
        throw new Error('You must be logged in to create goals')
      }

      const goalData = {
        user_id: user.id,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        symbol: formData.symbol,
        goal_type: formData.goal_type,
        is_countable: formData.is_countable,
        target_unit: formData.is_countable ? formData.target_unit : 'completions',
        frequency: formData.frequency || null,
        total_target: formData.total_target || null,
        end_date: formData.end_date || null,
        challenge_start_date: formData.challenge_start_date || null,
        challenge_end_date: formData.challenge_end_date || null,
        max_participants: formData.max_participants || null,
        weekdays: formData.weekdays.length > 0 ? formData.weekdays : null,
        reminder: false
      }

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert([goalData])
        .select()
        .single()

      if (goalError) throw goalError

      // Add creator as owner in collaborators for friend challenges
      if (formData.goal_type === 'friends_challenge') {
        const { error: collaboratorError } = await supabase
          .from('goal_collaborators')
          .insert([{
            goal_id: goal.id,
            user_id: user.id,
            role: 'owner',
            status: 'accepted'
          }])

        if (collaboratorError) throw collaboratorError

        // Handle friend invitations
        if (inviteEmails.some(email => email.trim())) {
          const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'))
          
          for (const email of validEmails) {
            await supabase
              .from('goal_invites')
              .insert([{
                goal_id: goal.id,
                invited_contact: email.trim(),
                invited_by: user.id
              }])
          }
        }
      }

      // Add creator as participant for challenges
      if (formData.goal_type === 'public_challenge' || formData.goal_type === 'friends_challenge') {
        await supabase
          .from('goal_participants')
          .insert([{
            goal_id: goal.id,
            user_id: user.id,
            status: 'active'
          }])
      }

      // Reset form
      setFormData({
        name: '',
        description: '',
        symbol: '🎯',
        goal_type: 'private',
        is_countable: false,
        target_unit: 'completions',
        frequency: 3,
        total_target: null,
        end_date: '',
        challenge_start_date: '',
        challenge_end_date: '',
        max_participants: null,
        weekdays: []
      })
      setInviteEmails([''])
      
      onGoalCreated(goal)
      onClose()

    } catch (error) {
      console.error('Error creating goal:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleWeekdayToggle = (weekday) => {
    setFormData(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...prev.weekdays, weekday]
    }))
  }

  const addInviteEmail = () => {
    setInviteEmails(prev => [...prev, ''])
  }

  const updateInviteEmail = (index, value) => {
    setInviteEmails(prev => prev.map((email, i) => i === index ? value : email))
  }

  const removeInviteEmail = (index) => {
    setInviteEmails(prev => prev.filter((_, i) => i !== index))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="premium-card max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold gradient-text-premium">Create Goal</h3>
              <p className="text-gray-600">Start your journey</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-error-100/50 border border-error-200 rounded-xl">
            <p className="text-error-600 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Goal Name */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Goal Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="input-premium text-xl"
              placeholder="What do you want to achieve?"
              required
              disabled={loading}
            />
          </div>

          {/* Goal Symbol */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Choose Symbol
            </label>
            <div className="grid grid-cols-8 gap-3">
              {symbolOptions.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, symbol }))}
                  className={`p-4 text-3xl rounded-xl border-2 transition-all duration-300 hover:scale-110 ${
                    formData.symbol === symbol
                      ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100 shadow-premium'
                      : 'border-gray-200 hover:border-gray-300 glass-card'
                  }`}
                  disabled={loading}
                >
                  {symbol}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Level */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Privacy Level
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal_type: 'private' }))}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  formData.goal_type === 'private'
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100'
                    : 'border-gray-200 hover:border-gray-300 glass-card'
                }`}
                disabled={loading}
              >
                <Lock className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="font-semibold text-gray-800">Private Goal</div>
                <div className="text-sm text-gray-600">Just for you</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal_type: 'friends_challenge' }))}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  formData.goal_type === 'friends_challenge'
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100'
                    : 'border-gray-200 hover:border-gray-300 glass-card'
                }`}
                disabled={loading}
              >
                <Users className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="font-semibold text-gray-800">Friends Challenge</div>
                <div className="text-sm text-gray-600">Invite specific friends</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal_type: 'public_challenge' }))}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  formData.goal_type === 'public_challenge'
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100'
                    : 'border-gray-200 hover:border-gray-300 glass-card'
                }`}
                disabled={loading}
              >
                <Globe className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="font-semibold text-gray-800">Public Challenge</div>
                <div className="text-sm text-gray-600">Open to everyone</div>
              </button>
            </div>
          </div>

          {/* Countable Toggle */}
          <div className="glass-card p-6 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-800">Countable Goal</h4>
                <p className="text-sm text-gray-600">Track quantity or duration for each completion</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="is_countable"
                  checked={formData.is_countable}
                  onChange={handleChange}
                  className="sr-only peer"
                  disabled={loading}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>

            {formData.is_countable && (
              <div>
                <label className="block text-base font-semibold text-gray-700 mb-3">
                  Measurement Unit
                </label>
                <select
                  name="target_unit"
                  value={formData.target_unit}
                  onChange={handleChange}
                  className="input-premium"
                  disabled={loading}
                >
                  {metrics.map((metric) => (
                    <option key={metric.id} value={metric.unit}>
                      {metric.name} ({metric.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Challenge Settings */}
          {(formData.goal_type === 'friends_challenge' || formData.goal_type === 'public_challenge') && (
            <div className="glass-card p-6 rounded-xl">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">Challenge Settings</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Start Date
                  </label>
                  <input
                    type="date"
                    name="challenge_start_date"
                    value={formData.challenge_start_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="input-premium"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    End Date
                  </label>
                  <input
                    type="date"
                    name="challenge_end_date"
                    value={formData.challenge_end_date}
                    onChange={handleChange}
                    min={formData.challenge_start_date || new Date().toISOString().split('T')[0]}
                    className="input-premium"
                    disabled={loading}
                  />
                </div>
              </div>

              {formData.goal_type === 'public_challenge' && (
                <div className="mt-6">
                  <label className="block text-base font-semibold text-gray-700 mb-3">
                    <Users className="w-4 h-4 inline mr-2" />
                    Max Participants (Optional)
                  </label>
                  <input
                    type="number"
                    name="max_participants"
                    value={formData.max_participants || ''}
                    onChange={handleChange}
                    min="2"
                    className="input-premium"
                    placeholder="Leave empty for unlimited"
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          )}

          {/* Friends Invitation */}
          {formData.goal_type === 'friends_challenge' && (
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Invite Friends
              </label>
              <div className="space-y-3">
                {inviteEmails.map((email, index) => (
                  <div key={index} className="flex space-x-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => updateInviteEmail(index, e.target.value)}
                      className="input-premium flex-1"
                      placeholder="friend@example.com"
                      disabled={loading}
                    />
                    {inviteEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeInviteEmail(index)}
                        className="p-3 text-error-600 hover:bg-error-50 rounded-xl transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addInviteEmail}
                  className="btn-secondary-premium flex items-center space-x-2"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Friend</span>
                </button>
              </div>
            </div>
          )}

          {/* Goal Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Frequency */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                <Repeat className="w-5 h-5 inline mr-2" />
                Frequency per Week
              </label>
              <input
                type="number"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                min="1"
                max="7"
                className="input-premium"
                disabled={loading}
              />
            </div>

            {/* Total Target */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                <Target className="w-5 h-5 inline mr-2" />
                Total Target (Optional)
              </label>
              <input
                type="number"
                name="total_target"
                value={formData.total_target || ''}
                onChange={handleChange}
                min="1"
                className="input-premium"
                placeholder={`e.g. 100 ${formData.is_countable ? formData.target_unit : 'completions'}`}
                disabled={loading}
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              <Calendar className="w-5 h-5 inline mr-2" />
              End Date (Optional)
            </label>
            <input
              type="date"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              className="input-premium"
              disabled={loading}
            />
          </div>

          {/* Weekdays */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Specific Days (Optional)
            </label>
            <div className="flex flex-wrap gap-3">
              {weekdayOptions.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => handleWeekdayToggle(day.value)}
                  className={`px-4 py-2 rounded-full font-medium transition-all duration-300 ${
                    formData.weekdays.includes(day.value)
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  disabled={loading}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Description (Optional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="input-premium resize-none"
              placeholder="Describe your goal in detail..."
              disabled={loading}
            />
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="btn-secondary-premium flex-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="btn-premium flex-1"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Create Goal</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EnhancedCreateGoalModal