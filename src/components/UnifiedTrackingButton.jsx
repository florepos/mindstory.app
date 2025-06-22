import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Camera, Check, X, Brain, Heart, Target, Zap, MessageCircle } from 'lucide-react'

const UnifiedTrackingButton = ({ 
  onTrackingAction,
  onPhotoCapture,
  selectedGoal,
  disabled = false,
  className = ''
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [gestureDirection, setGestureDirection] = useState(null)
  const [showInstructions, setShowInstructions] = useState(true)
  const [hasInteracted, setHasInteracted] = useState(false)
  
  const pressTimer = useRef(null)
  const progressTimer = useRef(null)
  const startTime = useRef(null)
  const instructionTimer = useRef(null)

  const EXPAND_DURATION = 3000 // 3 seconds as requested
  const MAX_SCALE = 1.5
  const GESTURE_THRESHOLD = 80

  // Main button animation
  const [buttonSpring, buttonApi] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    borderRadius: 50, // percentage
    shadow: 20,
    glow: 0,
    borderWidth: 3,
    config: config.gentle
  }))

  // Progress ring animation
  const [progressSpring, progressApi] = useSpring(() => ({
    progress: 0,
    opacity: 0,
    scale: 1,
    config: config.slow
  }))

  // Direction indicators animation - Always visible when expanded
  const [indicatorSpring, indicatorApi] = useSpring(() => ({
    opacity: 1,
    scale: 1,
    config: config.gentle
  }))

  // Hide instructions after first interaction or timeout
  useEffect(() => {
    instructionTimer.current = setTimeout(() => {
      if (!hasInteracted) {
        setShowInstructions(false)
      }
    }, 8000) // Show for 8 seconds initially

    return () => {
      if (instructionTimer.current) {
        clearTimeout(instructionTimer.current)
      }
    }
  }, [hasInteracted])

  // Calculate current scale based on progress
  const getCurrentScale = useCallback((currentProgress) => {
    return 1 + (MAX_SCALE - 1) * (currentProgress / 100)
  }, [])

  // Start long press
  const handlePressStart = useCallback(() => {
    if (disabled || !selectedGoal) return

    setIsPressed(true)
    setShowInstructions(false)
    setHasInteracted(true)
    startTime.current = Date.now()
    
    // Haptic feedback if available
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    // Start visual feedback
    buttonApi.start({
      scale: 1.05,
      shadow: 30,
      glow: 0.3,
      borderWidth: 4
    })

    progressApi.start({
      opacity: 1,
      scale: 1.1
    })

    // Progress tracking
    const updateProgress = () => {
      if (!startTime.current) return

      const elapsed = Date.now() - startTime.current
      const currentProgress = Math.min((elapsed / EXPAND_DURATION) * 100, 100)
      
      setProgress(currentProgress)
      
      // Update button scale and border radius
      const currentScale = getCurrentScale(currentProgress)
      const borderRadius = 50 - (currentProgress * 0.3) // Slightly more square as it expands
      
      buttonApi.start({
        scale: currentScale,
        rotate: currentProgress * 3.6, // 3 full rotations
        borderRadius: borderRadius,
        shadow: 20 + (currentProgress * 0.8),
        glow: 0.3 + (currentProgress * 0.007),
        borderWidth: 3 + (currentProgress * 0.05)
      })

      progressApi.start({
        progress: currentProgress
      })

      if (currentProgress < 100) {
        progressTimer.current = requestAnimationFrame(updateProgress)
      } else {
        // Expansion completed
        handleExpansionComplete()
      }
    }

    progressTimer.current = requestAnimationFrame(updateProgress)

    // Fallback timer
    pressTimer.current = setTimeout(() => {
      handleExpansionComplete()
    }, EXPAND_DURATION)
  }, [disabled, selectedGoal, buttonApi, progressApi, getCurrentScale])

  // Handle expansion completion
  const handleExpansionComplete = useCallback(() => {
    setIsExpanded(true)
    setProgress(100)
    
    // Haptic feedback for expansion complete
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
    
    // Enhanced visual feedback for expansion completion
    buttonApi.start({
      scale: MAX_SCALE,
      borderRadius: 35,
      shadow: 60,
      glow: 1,
      borderWidth: 6
    })
  }, [buttonApi])

  // End press/reset
  const handlePressEnd = useCallback(() => {
    if (!isPressed && !isExpanded) return

    setIsPressed(false)
    setIsExpanded(false)
    setProgress(0)
    setGestureDirection(null)
    startTime.current = null

    // Clear timers
    if (pressTimer.current) {
      clearTimeout(pressTimer.current)
      pressTimer.current = null
    }
    if (progressTimer.current) {
      cancelAnimationFrame(progressTimer.current)
      progressTimer.current = null
    }

    // Reset animations
    buttonApi.start({
      scale: 1,
      rotate: 0,
      borderRadius: 50,
      shadow: 20,
      glow: 0,
      borderWidth: 3
    })

    progressApi.start({
      progress: 0,
      opacity: 0,
      scale: 1
    })

    indicatorApi.start({
      opacity: 1,
      scale: 1
    })
  }, [isPressed, isExpanded, buttonApi, progressApi, indicatorApi])

  // Gesture handler for expanded state
  const gestureHandler = useDrag(
    ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy] }) => {
      if (!isExpanded) return

      const isSwipe = Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5
      const distance = Math.sqrt(mx * mx + my * my)

      if (active && distance > 20) {
        // Determine gesture direction
        let direction = null
        if (Math.abs(my) > Math.abs(mx)) {
          direction = my < 0 ? 'up' : 'down'
        } else {
          direction = mx > 0 ? 'right' : 'left'
        }
        
        setGestureDirection(direction)
        
        // Visual feedback during gesture
        if (distance > GESTURE_THRESHOLD) {
          buttonApi.start({
            scale: MAX_SCALE * 1.1,
            glow: 1.5
          })
        }
      } else if (!active && isSwipe && distance > GESTURE_THRESHOLD) {
        // Execute gesture action
        executeGestureAction(gestureDirection)
      } else if (!active) {
        // Reset if no significant gesture
        if (distance < GESTURE_THRESHOLD) {
          // Default action (complete)
          executeGestureAction('default')
        } else {
          handlePressEnd()
        }
      }
    },
    {
      axis: undefined,
      threshold: 10,
      rubberband: true
    }
  )

  // Execute gesture action
  const executeGestureAction = useCallback((direction) => {
    if (!onTrackingAction) return

    let action = 'done'
    let needsComment = false

    // Haptic feedback for action
    if (navigator.vibrate) {
      navigator.vibrate(200)
    }

    switch (direction) {
      case 'right':
        action = 'done'
        needsComment = true
        break
      case 'left':
        action = 'not_done'
        break
      case 'up':
        if (onPhotoCapture) {
          onPhotoCapture()
          handlePressEnd()
          return
        }
        action = 'done_with_photo'
        break
      default:
        action = 'done'
        break
    }

    // Success animation with onRest callback
    buttonApi.start({
      scale: MAX_SCALE * 1.2,
      rotate: 720,
      glow: 2,
      onRest: () => {
        onTrackingAction(action, needsComment)
        setTimeout(handlePressEnd, 300)
      }
    })
  }, [onTrackingAction, onPhotoCapture, buttonApi, handlePressEnd])

  // Event handlers with improved touch support
  const handleMouseDown = (e) => {
    e.preventDefault()
    if (!isExpanded) handlePressStart()
  }

  const handleMouseUp = (e) => {
    e.preventDefault()
    if (!isExpanded) handlePressEnd()
  }

  const handleTouchStart = (e) => {
    e.preventDefault()
    if (!isExpanded) handlePressStart()
  }

  const handleTouchEnd = (e) => {
    e.preventDefault()
    if (!isExpanded) handlePressEnd()
  }

  // Handle click for quick actions when not expanded
  const handleClick = (e) => {
    e.preventDefault()
    if (!isExpanded && !isPressed && selectedGoal) {
      // Quick tap action - mark as done
      if (onTrackingAction) {
        onTrackingAction('done', false)
      }
    }
  }

  const getGestureColor = (direction) => {
    switch (direction) {
      case 'right': return 'text-success-500'
      case 'left': return 'text-error-500'
      case 'up': return 'text-primary-500'
      default: return 'text-gray-400'
    }
  }

  const getGestureIcon = (direction) => {
    switch (direction) {
      case 'right': return Check
      case 'left': return X
      case 'up': return Camera
      default: return Target
    }
  }

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ margin: '32px 0' }}>
      {/* Progress Ring */}
      <animated.div
        style={{
          opacity: progressSpring.opacity,
          transform: progressSpring.scale.to(s => `scale(${s})`)
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      >
        <svg className="w-40 h-40 sm:w-48 sm:h-48 transform -rotate-90" viewBox="0 0 200 200">
          {/* Background ring */}
          <circle
            cx="100"
            cy="100"
            r="90"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
            className="text-gray-200/50"
          />
          {/* Progress ring */}
          <animated.circle
            cx="100"
            cy="100"
            r="90"
            stroke="currentColor"
            strokeWidth="6"
            fill="none"
            className="text-primary-500"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 90}`}
            strokeDashoffset={progressSpring.progress.to(p => 
              2 * Math.PI * 90 * (1 - p / 100)
            )}
          />
        </svg>
      </animated.div>

      {/* Direction Indicators - Always visible when expanded */}
      <animated.div
        style={{
          opacity: isExpanded ? indicatorSpring.opacity : 0,
          transform: indicatorSpring.scale.to(s => `scale(${s})`)
        }}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {/* Up - Camera */}
        <div className={`absolute -top-16 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
          gestureDirection === 'up' ? 'scale-125 text-primary-500' : 'text-gray-400'
        }`}>
          <div className="p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-premium">
            <Camera className="w-6 h-6" />
          </div>
        </div>

        {/* Right - Complete */}
        <div className={`absolute top-1/2 -right-16 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'right' ? 'scale-125 text-success-500' : 'text-gray-400'
        }`}>
          <div className="p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-premium">
            <Check className="w-6 h-6" />
          </div>
        </div>

        {/* Left - Not Done */}
        <div className={`absolute top-1/2 -left-16 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'left' ? 'scale-125 text-error-500' : 'text-gray-400'
        }`}>
          <div className="p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-premium">
            <X className="w-6 h-6" />
          </div>
        </div>
      </animated.div>

      {/* Main Button */}
      <animated.button
        {...gestureHandler()}
        className={`
          relative w-32 h-32 sm:w-36 sm:h-36
          bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600
          flex items-center justify-center
          cursor-pointer select-none outline-none
          transition-colors duration-300
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:brightness-95'}
          ${isExpanded ? 'cursor-grab active:cursor-grabbing' : ''}
        `}
        style={{
          transform: buttonSpring.scale.to(s => `scale(${s}) rotate(${buttonSpring.rotate.get()}deg)`),
          borderRadius: buttonSpring.borderRadius.to(r => `${r}%`),
          boxShadow: buttonSpring.shadow.to(s => 
            `0 ${s}px ${s * 2}px rgba(0, 0, 0, 0.15), 0 0 ${s * 3}px rgba(249, 115, 22, ${buttonSpring.glow.get()})`
          ),
          borderWidth: buttonSpring.borderWidth.to(w => `${w}px`),
          borderColor: isPressed || isExpanded ? '#f97316' : 'transparent',
          borderStyle: 'solid',
          touchAction: isExpanded ? 'none' : 'auto'
        }}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label={isExpanded ? "Swipe to complete action" : selectedGoal ? "Hold to expand tracking options or tap to complete" : "Select a goal first"}
      >
        {/* Button Content */}
        <div className="flex items-center justify-center text-white relative z-10">
          {isExpanded ? (
            <div className="flex items-center justify-center">
              <div className={`transition-colors duration-300 ${getGestureColor(gestureDirection)}`}>
                {React.createElement(getGestureIcon(gestureDirection), { 
                  className: "w-8 h-8 sm:w-10 sm:h-10" 
                })}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <Brain className="w-7 h-7 sm:w-8 sm:h-8 mr-2" />
              <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
          )}
        </div>

        {/* Ripple Effect */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </animated.button>

      {/* Instructions */}
      <div className="absolute -bottom-20 left-1/2 transform -translate-x-1/2 text-center">
        {isExpanded ? (
          <div className="space-y-2">
            <p className="text-base font-semibold text-gray-700">
              Swipe to complete
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                <span>Right: Done + Comment</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-primary-400 rounded-full"></div>
                <span>Up: Photo</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-error-400 rounded-full"></div>
                <span>Left: Skip</span>
              </div>
            </div>
          </div>
        ) : showInstructions ? (
          <div className="space-y-2">
            <p className="text-base font-medium text-gray-700">
              {isPressed ? `${Math.round(progress)}% - Keep holding...` : 'Hold 3s or tap to track'}
            </p>
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isPressed ? 'bg-primary-500 animate-pulse' : 'bg-gray-300'
              }`} />
              <span>Long press for options • Tap for quick complete</span>
              <div className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                isPressed ? 'bg-primary-500 animate-pulse' : 'bg-gray-300'
              }`} />
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            <p className="text-sm text-gray-600">
              {selectedGoal ? selectedGoal.name : 'Select a goal first'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default UnifiedTrackingButton