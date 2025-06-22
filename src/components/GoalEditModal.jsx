import React, { useState, useEffect } from 'react'
import { Edit3, X, Trash2, UserPlus, Crown, Shield, User, Mail } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const GoalEditModal = ({ isOpen, goal, onClose, onGoalUpdated, onGoalDeleted }) => {
  const [loading, setLoading] = useState(false)
  const [collaborators, setCollaborators] = useState([])
  const [invites, setInvites] = useState([])
  const [newInviteEmail, setNewInviteEmail] = useState('')
  const [error, setError] = useState(null)
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    if (isOpen && goal) {
      fetchCurrentUser()
      fetchCollaborators()
      fetchInvites()
    }
  }, [isOpen, goal])

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setCurrentUser(user)
  }

  const fetchCollaborators = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_collaborators')
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq('goal_id', goal.id)
        .order('created_at', { ascending: true })

      if (error) throw error
      setCollaborators(data || [])
    } catch (error) {
      console.error('Error fetching collaborators:', error)
    }
  }

  const fetchInvites = async () => {
    try {
      const { data, error } = await supabase
        .from('goal_invites')
        .select('*')
        .eq('goal_id', goal.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInvites(data || [])
    } catch (error) {
      console.error('Error fetching invites:', error)
    }
  }

  const handleInviteUser = async () => {
    if (!newInviteEmail.trim()) return

    try {
      setLoading(true)
      setError(null)

      // Check if user already exists as collaborator
      const existingCollaborator = collaborators.find(c => 
        c.profiles?.email === newInviteEmail.trim()
      )

      if (existingCollaborator) {
        setError('User is already a collaborator')
        return
      }

      // Create invite
      const { error: inviteError } = await supabase
        .from('goal_invites')
        .insert([{
          goal_id: goal.id,
          invited_contact: newInviteEmail.trim(),
          invited_by: currentUser.id
        }])

      if (inviteError) throw inviteError

      setNewInviteEmail('')
      fetchInvites()
    } catch (error) {
      console.error('Error inviting user:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveCollaborator = async (collaboratorId) => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('goal_collaborators')
        .delete()
        .eq('id', collaboratorId)

      if (error) throw error

      fetchCollaborators()
    } catch (error) {
      console.error('Error removing collaborator:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateRole = async (collaboratorId, newRole) => {
    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('goal_collaborators')
        .update({ role: newRole })
        .eq('id', collaboratorId)

      if (error) throw error

      fetchCollaborators()
    } catch (error) {
      console.error('Error updating role:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteGoal = async () => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return
    }

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id)

      if (error) throw error

      onGoalDeleted(goal.id)
      onClose()
    } catch (error) {
      console.error('Error deleting goal:', error)
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />
      default:
        return <User className="w-4 h-4 text-gray-500" />
    }
  }

  const isOwner = collaborators.find(c => c.user_id === currentUser?.id)?.role === 'owner'
  const canManage = isOwner || collaborators.find(c => c.user_id === currentUser?.id)?.role === 'admin'

  if (!isOpen || !goal) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="premium-card max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="text-4xl">{goal.symbol}</div>
            <div>
              <h3 className="text-3xl font-bold text-gray-800">{goal.name}</h3>
              <p className="text-gray-600">Goal Management</p>
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

        <div className="space-y-8">
          {/* Goal Info */}
          <div className="glass-card p-6 rounded-xl">
            <h4 className="font-bold text-lg text-gray-800 mb-4">Goal Details</h4>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="font-medium capitalize">{goal.goal_type}</span>
              </div>
              {goal.frequency && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Frequency:</span>
                  <span className="font-medium">{goal.frequency}x per week</span>
                </div>
              )}
              {goal.total_target && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Target:</span>
                  <span className="font-medium">{goal.total_target} total</span>
                </div>
              )}
              {goal.end_date && (
                <div className="flex justify-between">
                  <span className="text-gray-600">End Date:</span>
                  <span className="font-medium">{new Date(goal.end_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {/* Collaborators */}
          {goal.goal_type === 'friends' && (
            <div className="glass-card p-6 rounded-xl">
              <h4 className="font-bold text-lg text-gray-800 mb-4">Collaborators</h4>
              
              <div className="space-y-4 mb-6">
                {collaborators.map((collaborator) => (
                  <div key={collaborator.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {collaborator.profiles?.avatar_url ? (
                        <img
                          src={collaborator.profiles.avatar_url}
                          alt={collaborator.profiles.display_name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-800">
                          {collaborator.profiles?.display_name || 'Unknown User'}
                        </div>
                        <div className="text-sm text-gray-600 flex items-center space-x-1">
                          {getRoleIcon(collaborator.role)}
                          <span className="capitalize">{collaborator.role}</span>
                        </div>
                      </div>
                    </div>

                    {canManage && collaborator.role !== 'owner' && (
                      <div className="flex items-center space-x-2">
                        <select
                          value={collaborator.role}
                          onChange={(e) => handleUpdateRole(collaborator.id, e.target.value)}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                          disabled={loading}
                        >
                          <option value="member">Member</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          onClick={() => handleRemoveCollaborator(collaborator.id)}
                          className="p-1 text-error-600 hover:bg-error-50 rounded transition-colors"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Pending Invites */}
              {invites.length > 0 && (
                <div className="mb-6">
                  <h5 className="font-medium text-gray-700 mb-3">Pending Invites</h5>
                  <div className="space-y-2">
                    {invites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-gray-700">{invite.invited_contact}</span>
                        </div>
                        <span className="text-xs text-yellow-600 font-medium">Pending</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Collaborator */}
              {canManage && (
                <div>
                  <h5 className="font-medium text-gray-700 mb-3">Invite New Collaborator</h5>
                  <div className="flex space-x-3">
                    <input
                      type="email"
                      value={newInviteEmail}
                      onChange={(e) => setNewInviteEmail(e.target.value)}
                      placeholder="friend@example.com"
                      className="input-premium flex-1"
                      disabled={loading}
                    />
                    <button
                      onClick={handleInviteUser}
                      disabled={loading || !newInviteEmail.trim()}
                      className="btn-premium flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Invite</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              className="btn-secondary-premium flex-1"
            >
              Close
            </button>
            
            {isOwner && (
              <button
                onClick={handleDeleteGoal}
                disabled={loading}
                className="btn-premium bg-gradient-to-r from-error-500 to-error-600 flex-1 flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Goal</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoalEditModal