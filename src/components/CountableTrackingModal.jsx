import React, { useState, useRef } from 'react'
import { X, Plus, Minus, Clock, Hash, Camera, MessageCircle, Check } from 'lucide-react'

const CountableTrackingModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  goal, 
  action = 'done',
  photoFile = null,
  photoPreviewUrl = ''
}) => {
  const [quantity, setQuantity] = useState(1)
  const [duration, setDuration] = useState('')
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    setLoading(true)
    try {
      const entryData = {
        status: action,
        quantity: goal?.is_countable ? quantity : 1,
        duration_minutes: duration ? parseInt(duration) : null,
        comment: comment.trim() || null
      }

      await onSave(entryData)
      
      // Reset form
      setQuantity(1)
      setDuration('')
      setComment('')
      onClose()
    } catch (error) {
      console.error('Error saving entry:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionTitle = () => {
    switch (action) {
      case 'done_with_photo':
        return 'Complete with Photo'
      case 'not_done':
        return 'Mark as Not Done'
      default:
        return 'Complete Goal'
    }
  }

  const getActionColor = () => {
    switch (action) {
      case 'done_with_photo':
        return 'from-primary-500 to-primary-600'
      case 'not_done':
        return 'from-error-500 to-error-600'
      default:
        return 'from-success-500 to-success-600'
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'done_with_photo':
        return Camera
      case 'not_done':
        return X
      default:
        return Check
    }
  }

  if (!isOpen || !goal) return null

  const ActionIcon = getActionIcon()

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="premium-card max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 animate-scale-in">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-3 bg-gradient-to-br ${getActionColor()} rounded-xl`}>
              <ActionIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">{getActionTitle()}</h3>
              <p className="text-sm text-gray-600">{goal.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Photo Preview */}
          {photoPreviewUrl && (
            <div className="relative mb-6">
              <img
                src={photoPreviewUrl}
                alt="preview"
                className="w-full h-60 object-cover rounded-xl shadow-premium"
              />
              
              {/* Stats Overlay */}
              <div className="absolute top-3 left-3 right-3 flex justify-between items-start">
                <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium">
                  {goal?.is_countable && quantity > 1 ? (
                    <span>{quantity} {goal.target_unit || 'units'}</span>
                  ) : (
                    <span>1 completion</span>
                  )}
                </div>
                <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg text-sm font-medium">
                  {new Date().toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </div>
              </div>
              
              {/* Comment Overlay */}
              {comment && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="bg-black/60 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
                    <span className="text-sm font-medium">{comment}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quantity Input for Countable Goals */}
          {goal.is_countable && action !== 'not_done' && (
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                <Hash className="w-4 h-4 inline mr-2" />
                Quantity ({goal.target_unit || 'units'})
              </label>
              <div className="flex items-center space-x-4">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                  disabled={loading}
                >
                  <Minus className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="input-premium text-center text-xl font-bold w-24"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                  className="p-3 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                  disabled={loading}
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Duration Input for Time-based Goals */}
          {goal.is_countable && goal.target_unit === 'minutes' && action !== 'not_done' && (
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                <Clock className="w-4 h-4 inline mr-2" />
                Duration (minutes)
              </label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                className="input-premium"
                placeholder="How many minutes?"
                disabled={loading}
              />
            </div>
          )}

          {/* Comment */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              <MessageCircle className="w-4 h-4 inline mr-2" />
              Comment (Optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="How did it go? Any thoughts to share..."
              className="input-premium resize-none h-24"
              disabled={loading}
            />
          </div>

          {/* Progress Summary */}
          {goal.is_countable && action !== 'not_done' && (
            <div className="glass-card p-4 rounded-xl">
              <h4 className="font-semibold text-gray-800 mb-2">This Session</h4>
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Amount:</span>
                <span className="font-medium">{quantity} {goal.target_unit}</span>
              </div>
              {duration && (
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>Duration:</span>
                  <span className="font-medium">{duration} minutes</span>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary-premium flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className={`btn-premium flex-1 bg-gradient-to-r ${getActionColor()}`}
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <ActionIcon className="w-4 h-4" />
                  <span>Save</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CountableTrackingModal