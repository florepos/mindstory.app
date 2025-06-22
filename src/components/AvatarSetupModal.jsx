import React, { useState, useRef } from 'react'
import { Camera, Upload, User, X, Check } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const AvatarSetupModal = ({ isOpen, onComplete, onSkip }) => {
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be smaller than 5MB')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target.result)
    }
    reader.readAsDataURL(file)

    setError(null)
  }

  const uploadAvatar = async () => {
    const file = fileInputRef.current?.files?.[0]
    if (!file) return null

    try {
      setUploading(true)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/avatar.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading avatar:', error)
      throw error
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      let avatarUrl = null
      if (previewUrl && fileInputRef.current?.files?.[0]) {
        avatarUrl = await uploadAvatar()
      }

      // Update or create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName.trim() || user.email?.split('@')[0] || 'User',
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      onComplete({
        display_name: displayName.trim() || user.email?.split('@')[0] || 'User',
        avatar_url: avatarUrl
      })
    } catch (error) {
      console.error('Error saving profile:', error)
      setError(error.message)
    }
  }

  const handleSkip = async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) throw new Error('User not authenticated')

      // Create basic profile without avatar
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          display_name: displayName.trim() || user.email?.split('@')[0] || 'User',
          avatar_url: null,
          updated_at: new Date().toISOString()
        })

      if (profileError) throw profileError

      onSkip()
    } catch (error) {
      console.error('Error creating profile:', error)
      setError(error.message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="premium-card max-w-lg w-full p-8 animate-scale-in">
        <div className="text-center mb-8">
          <div className="p-4 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-3xl w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <User className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold gradient-text-premium mb-2">Welcome to MindStory!</h2>
          <p className="text-gray-600 text-lg">Let's set up your profile</p>
        </div>

        <div className="space-y-6">
          {/* Display Name */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="input-premium text-lg"
              placeholder="How should we call you?"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              Profile Picture (Optional)
            </label>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <div className="flex flex-col items-center space-y-4">
              {previewUrl ? (
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Avatar preview"
                    className="w-32 h-32 object-cover rounded-full shadow-premium"
                  />
                  <button
                    onClick={() => {
                      setPreviewUrl(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }}
                    className="absolute -top-2 -right-2 p-2 bg-error-500 hover:bg-error-600 rounded-full text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center border-2 border-dashed border-gray-300">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}

              <button
                onClick={() => fileInputRef.current?.click()}
                className="btn-secondary-premium flex items-center space-x-2"
              >
                <Upload className="w-4 h-4" />
                <span>{previewUrl ? 'Change Photo' : 'Upload Photo'}</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-gradient-to-r from-error-50 to-error-100/50 border border-error-200 rounded-2xl">
              <p className="text-error-600 font-medium">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              onClick={handleSkip}
              disabled={uploading}
              className="btn-secondary-premium flex-1"
            >
              Skip for now
            </button>
            <button
              onClick={handleSave}
              disabled={uploading || !displayName.trim()}
              className="btn-premium flex-1"
            >
              {uploading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Complete Setup</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AvatarSetupModal