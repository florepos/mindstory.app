import React, { useState, useRef } from 'react'
import { CheckCircle, Circle, TrendingUp, Zap, Camera, X, Upload, Target } from 'lucide-react'
import { animated } from '@react-spring/web'
import { supabase } from '../services/supabaseClient'
import TrackableGoalItem from './TrackableGoalItem'

const TrackButton = ({ selectedGoalId, onTrack }) => {
  const [goals, setGoals] = useState([
    {
      id: 1,
      title: "Daily Meditation",
      description: "10 minutes completed",
      icon: TrendingUp,
      color: "purple",
      isTracked: false,
      status: null
    },
    {
      id: 2,
      title: "Exercise",
      description: "30 minutes workout",
      icon: Zap,
      color: "blue",
      isTracked: false,
      status: null
    },
    {
      id: 3,
      title: "Reading",
      description: "20 pages completed",
      icon: TrendingUp,
      color: "green",
      isTracked: true,
      status: 'done'
    }
  ])

  const [draggedGoal, setDraggedGoal] = useState(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [pendingPhotoGoalId, setPendingPhotoGoalId] = useState(null)
  const fileInputRef = useRef(null)

  const uploadPhoto = async (file) => {
    try {
      setUploadingPhoto(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${selectedGoalId}_${Date.now()}.${fileExt}`
      const filePath = `goal-photos/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('goal-photos')
        .upload(filePath, file)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('goal-photos')
        .getPublicUrl(filePath)

      return urlData.publicUrl
    } catch (error) {
      console.error('Error uploading photo:', error)
      throw error
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleGoalAction = async (goalId, action) => {
    try {
      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === goalId 
            ? { 
                ...goal, 
                isTracked: action !== 'not_done',
                status: action
              }
            : goal
        )
      )

      if (onTrack && selectedGoalId) {
        await onTrack(selectedGoalId, action, null)
      }

      setTimeout(() => setDraggedGoal(null), 300)
    } catch (error) {
      console.error('Error handling goal action:', error)
    }
  }

  const handleTriggerPhotoUpload = (goalId) => {
    setPendingPhotoGoalId(goalId)
    setDraggedGoal(goalId)
    fileInputRef.current?.click()
  }

  const handleFileSelect = async (event) => {
    const file = event.target.files?.[0]
    if (!file || !pendingPhotoGoalId) return

    try {
      const photoUrl = await uploadPhoto(file)

      setGoals(prevGoals => 
        prevGoals.map(goal => 
          goal.id === pendingPhotoGoalId 
            ? { 
                ...goal, 
                isTracked: true,
                status: 'done_with_photo'
              }
            : goal
        )
      )

      if (onTrack && selectedGoalId) {
        await onTrack(selectedGoalId, 'done_with_photo', photoUrl)
      }

      setTimeout(() => {
        setDraggedGoal(null)
        setPendingPhotoGoalId(null)
      }, 300)
    } catch (error) {
      console.error('Error handling photo upload:', error)
    }

    event.target.value = ''
    setPendingPhotoGoalId(null)
  }

  const completedGoals = goals.filter(goal => goal.status === 'done' || goal.status === 'done_with_photo').length
  const totalGoals = goals.length
  const completionRate = Math.round((completedGoals / totalGoals) * 100)

  return (
    <div className="premium-card p-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-success-50/30 to-primary-50/30"></div>
      <div className="relative z-10">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="text-center mb-10">
          <div className="flex items-center justify-center mb-6">
            <div className="p-4 bg-gradient-to-br from-success-500 via-success-600 to-primary-500 rounded-3xl shadow-premium pulse-glow">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-3xl font-bold gradient-text-premium mb-4">Track Progress</h3>
          {selectedGoalId ? (
            <div className="mb-6">
              <p className="text-lg text-gray-600 mb-4">Tracking selected goal</p>
              <div className="inline-flex items-center px-6 py-3 rounded-full text-base font-semibold bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 shadow-premium">
                <div className="w-3 h-3 bg-primary-500 rounded-full mr-3 animate-pulse"></div>
                Goal ID: {selectedGoalId}
              </div>
            </div>
          ) : (
            <p className="text-lg text-gray-600 mb-6">Select a goal to start tracking</p>
          )}
          <p className="text-base text-gray-600 mb-8">Swipe to track your daily goals</p>
          
          {/* Premium Gesture Guide */}
          <div className="glass-card p-6 mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-sm">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-success-500 to-success-600 rounded-2xl flex items-center justify-center shadow-premium">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-700">Swipe Right</span>
                <span className="text-gray-500">Mark as Done</span>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-premium">
                  <Camera className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-700">Swipe Up</span>
                <span className="text-gray-500">Done + Photo</span>
              </div>
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-gradient-to-r from-error-500 to-error-600 rounded-2xl flex items-center justify-center shadow-premium">
                  <X className="w-6 h-6 text-white" />
                </div>
                <span className="font-semibold text-gray-700">Swipe Left</span>
                <span className="text-gray-500">Not Done</span>
              </div>
            </div>
          </div>
        </div>

        {uploadingPhoto && (
          <div className="mb-8 p-6 bg-gradient-to-r from-primary-50 to-primary-100/50 rounded-2xl border border-primary-200">
            <div className="flex items-center justify-center space-x-4">
              <Upload className="w-6 h-6 text-primary-600 animate-bounce" />
              <span className="text-lg text-primary-700 font-semibold">Uploading photo...</span>
            </div>
          </div>
        )}

        {!selectedGoalId ? (
          <div className="text-center py-16 text-gray-500">
            <Circle className="w-20 h-20 mx-auto mb-6 text-gray-300" />
            <p className="font-bold text-xl mb-3">No goal selected</p>
            <p className="text-lg">Click on a goal in the slider above to start tracking</p>
          </div>
        ) : (
          <div className="space-y-6">
            {goals.map((goal) => (
              <TrackableGoalItem
                key={goal.id}
                goal={goal}
                draggedGoal={draggedGoal}
                onGoalAction={handleGoalAction}
                onTriggerPhotoUpload={handleTriggerPhotoUpload}
              />
            ))}
          </div>
        )}

        {/* Premium Progress Card */}
        <div className="mt-10 p-8 bg-gradient-to-br from-primary-50 via-primary-50/50 to-secondary-50/50 rounded-3xl border border-primary-100 shadow-premium">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="font-bold text-xl text-gray-800 mb-2">Today's Progress</h4>
              <p className="text-lg text-gray-600">
                {completedGoals} of {totalGoals} goals completed
              </p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold gradient-text-premium">{completionRate}%</div>
              <div className="text-sm text-gray-500 font-medium">completion rate</div>
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden shadow-inner-premium">
            <animated.div 
              className="bg-gradient-to-r from-primary-500 via-primary-600 to-secondary-600 h-4 rounded-full transition-all duration-1000 shadow-premium"
              style={{ width: `${completionRate}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrackButton