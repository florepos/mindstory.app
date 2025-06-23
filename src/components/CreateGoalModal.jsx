import React, { useState } from 'react'
import { Plus, X, Lock, Users, Globe, Mail, Link, Check, Calendar, Target, Repeat } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const CreateGoalModal = ({ isOpen, onClose, onGoalCreated }) => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    symbol: '🎯',
    goal_type: 'weekly',
    frequency: 3,
    total_target: null,
    end_date: '',
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
        frequency: formData.frequency || null,
        total_target: formData.total_target || null,
        end_date: formData.end_date || null,
        weekdays: formData.weekdays.length > 0 ? formData.weekdays : null,
        reminder: false
      }

      const { data: goal, error: goalError } = await supabase
        .from('goals')
        .insert([goalData])
        .select()
        .single()

      if (goalError) throw goalError

      // Add creator as owner in collaborators
      const { error: collaboratorError } = await supabase
        .from('goal_collaborators')
        .insert([{
          goal_id: goal.id,
          user_id: user.id,
          role: 'owner',
          status: 'accepted'
        }])

      if (collaboratorError) throw collaboratorError

      // Handle friend invitations for friends' goals
      if (formData.goal_type === 'friends' && inviteEmails.some(email => email.trim())) {
        const validEmails = inviteEmails.filter(email => email.trim() && email.includes('@'))
        
        for (const email of validEmails) {
          // Check if user exists
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('user_id', email) // This would need to be adjusted based on how you store emails
            .single()

          if (existingProfile) {
            // Add as collaborator
            await supabase
              .from('goal_collaborators')
              .insert([{
                goal_id: goal.id,
                user_id: existingProfile.user_id,
                role: 'member',
                status: 'pending',
                invited_by: user.id
              }])
          } else {
            // Create invite
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

      // Reset form
      setFormData({
        name: '',
        description: '',
        symbol: '🎯',
        goal_type: 'weekly',
        frequency: 3,
        total_target: null,
        end_date: '',
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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      <div className="premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
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
            <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-4 sm:gap-3">
              {symbolOptions.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, symbol }))}
                  className={`p-4 sm:p-3 text-4xl sm:text-3xl rounded-xl border-2 transition-all duration-300 hover:scale-110 min-h-[60px] sm:min-h-[50px] flex items-center justify-center ${
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

          {/* Goal Type */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              Goal Type
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal_type: 'weekly' }))}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  formData.goal_type === 'weekly'
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100'
                    : 'border-gray-200 hover:border-gray-300 glass-card'
                }`}
                disabled={loading}
              >
                <Repeat className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="font-semibold text-gray-800">Weekly</div>
                <div className="text-sm text-gray-600">Recurring weekly goal</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal_type: 'absolute' }))}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  formData.goal_type === 'absolute'
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100'
                    : 'border-gray-200 hover:border-gray-300 glass-card'
                }`}
                disabled={loading}
              >
                <Target className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="font-semibold text-gray-800">Absolute</div>
                <div className="text-sm text-gray-600">Fixed target number</div>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, goal_type: 'deadline' }))}
                className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                  formData.goal_type === 'deadline'
                    ? 'border-primary-500 bg-gradient-to-br from-primary-50 to-primary-100'
                    : 'border-gray-200 hover:border-gray-300 glass-card'
                }`}
                disabled={loading}
              >
                <Calendar className="w-6 h-6 mx-auto mb-3 text-gray-600" />
                <div className="font-semibold text-gray-800">Deadline</div>
                <div className="text-sm text-gray-600">Complete by date</div>
              </button>
            </div>
          </div>

          {/* Friends Invitation - Only show for weekly goals as an example */}
          {formData.goal_type === 'weekly' && (
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Invite Friends (Optional)
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
                placeholder="e.g. 100"
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

export default CreateGoalModal