import React, { useState } from 'react'
import { Edit3, Trash2, Share2, X, Check, MessageCircle } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const TrackingEntryContextMenu = ({ 
  entry, 
  isOpen, 
  onClose, 
  onEdit, 
  onDelete, 
  position = { x: 0, y: 0 },
  canEdit = false 
}) => {
  const [loading, setLoading] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const handleEdit = () => {
    onEdit(entry)
    onClose()
  }

  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true)
      return
    }

    try {
      setLoading(true)
      
      const { error } = await supabase
        .from('goal_entries')
        .delete()
        .eq('id', entry.id)

      if (error) throw error

      onDelete(entry.id)
      onClose()
    } catch (error) {
      console.error('Error deleting entry:', error)
      alert('Failed to delete entry. Please try again.')
    } finally {
      setLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleShare = () => {
    // Implement sharing functionality
    const shareText = `🎯 ${entry.goals?.name}\nCompleted on ${new Date(entry.completed_at).toLocaleDateString()}\n\n#MindStory #Goals`
    
    if (navigator.share) {
      navigator.share({
        title: `${entry.goals?.name} - Progress`,
        text: shareText,
        url: window.location.href
      })
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText)
      alert('Progress copied to clipboard!')
    }
    
    onClose()
  }

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose}
      />
      
      {/* Context Menu */}
      <div 
        className="fixed z-50 premium-card p-2 min-w-48 animate-scale-in"
        style={{
          left: Math.min(position.x, window.innerWidth - 200),
          top: Math.min(position.y, window.innerHeight - 200)
        }}
      >
        <div className="space-y-1">
          {/* Share */}
          <button
            onClick={handleShare}
            className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Share2 className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Share</span>
          </button>

          {canEdit && (
            <>
              {/* Edit */}
              <button
                onClick={handleEdit}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Edit</span>
              </button>

              {/* Delete */}
              <button
                onClick={handleDelete}
                disabled={loading}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                  showDeleteConfirm 
                    ? 'bg-error-50 hover:bg-error-100' 
                    : 'hover:bg-gray-100'
                }`}
              >
                {showDeleteConfirm ? (
                  <>
                    <Check className="w-4 h-4 text-error-600" />
                    <span className="text-sm font-medium text-error-700">
                      {loading ? 'Deleting...' : 'Confirm Delete'}
                    </span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 text-error-600" />
                    <span className="text-sm font-medium text-error-700">Delete</span>
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  )
}

export default TrackingEntryContextMenu