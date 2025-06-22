import React, { useState } from 'react'
import { Mail, Lock, X, Eye, EyeOff, User, Heart } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const AuthModal = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState('signin') // 'signin' or 'signup'
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              display_name: formData.displayName.trim() || formData.email.split('@')[0]
            }
          }
        })

        if (error) throw error

        if (data.user && !data.session) {
          setSuccess('Please check your email to confirm your account!')
        } else {
          onClose()
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: formData.email.trim(),
          password: formData.password
        })

        if (error) throw error
        onClose()
      }
    } catch (error) {
      console.error('Auth error:', error)
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

  const resetForm = () => {
    setFormData({ email: '', password: '', displayName: '' })
    setError(null)
    setSuccess(null)
    setShowPassword(false)
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl flex items-center justify-center z-50 p-4">
      <div className="premium-card max-w-md w-full p-8 animate-scale-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold gradient-text-premium">
                {mode === 'signin' ? 'Welcome Back' : 'Join MindStory'}
              </h3>
              <p className="text-gray-600">
                {mode === 'signin' ? 'Sign in to continue' : 'Start your journey'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-gradient-to-r from-error-50 to-error-100/50 border border-error-200 rounded-xl">
            <p className="text-error-600 font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-gradient-to-r from-success-50 to-success-100/50 border border-success-200 rounded-xl">
            <p className="text-success-600 font-medium">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {mode === 'signup' && (
            <div>
              <label className="block text-base font-semibold text-gray-700 mb-3">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleChange}
                  className="input-premium pl-12"
                  placeholder="Your name"
                  disabled={loading}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input-premium pl-12"
                placeholder="Enter your email"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-base font-semibold text-gray-700 mb-3">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input-premium pl-12 pr-12"
                placeholder="Enter your password"
                required
                minLength={6}
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !formData.email.trim() || !formData.password}
            className="btn-premium w-full text-lg py-4"
          >
            {loading ? (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>{mode === 'signin' ? 'Signing in...' : 'Creating account...'}</span>
              </div>
            ) : (
              mode === 'signin' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={switchMode}
            className="text-primary-600 hover:text-primary-700 transition-colors font-semibold"
            disabled={loading}
          >
            {mode === 'signin' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthModal