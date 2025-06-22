import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'
import { Camera, Check, X, MessageCircle } from 'lucide-react'

const UnifiedTrackingButton = ({ 
  onTrackingAction,
  onPhotoCapture,
  selectedGoal,
  disabled = false,
  className = '',
  completionCount = 0
}) => {
  const [isPressed, setIsPressed] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [progress, setProgress] = useState(0)
  const [gestureDirection, setGestureDirection] = useState(null)
  
  const pressTimer = useRef(null)
  const progressTimer = useRef(null)
  const startTime = useRef(null)
  const buttonRef = useRef(null)

  const EXPAND_DURATION = 3000
  const MAX_SCALE = 1.5
  const GESTURE_THRESHOLD = 80

  // Main button animation
  const [buttonSpring, buttonApi] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    borderRadius: 50,
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

  // Direction indicators animation
  const [indicatorSpring, indicatorApi] = useSpring(() => ({
    opacity: 1,
    scale: 1,
    config: config.gentle
  }))

  // Calculate current scale based on progress
  const getCurrentScale = useCallback((currentProgress) => {
    return 1 + (MAX_SCALE - 1) * (currentProgress / 100)
  }, [])

  // Start long press
  const handlePressStart = useCallback(() => {
    if (disabled || !selectedGoal) return

    console.log('🚀 Press start triggered')
    setIsPressed(true)
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
      const borderRadius = 50 - (currentProgress * 0.3)
      
      buttonApi.start({
        scale: currentScale,
        rotate: currentProgress * 3.6,
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
    console.log('✨ Expansion complete')
    setIsExpanded(true)
    setProgress(100)
    
    // Enhanced haptic feedback for expansion complete
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

    console.log('🛑 Press end triggered')
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
    ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy], event }) => {
      if (!isExpanded) return

      console.log('👆 Gesture detected:', { active, mx, my, dx, dy, vx, vy })

      // Prevent default touch behaviors
      if (event) {
        event.preventDefault()
        event.stopPropagation()
      }

      const isSwipe = Math.abs(vx) > 0.3 || Math.abs(vy) > 0.3
      const distance = Math.sqrt(mx * mx + my * my)

      if (active && distance > 20) {
        // Determine gesture direction with improved sensitivity
        let direction = null
        if (Math.abs(my) > Math.abs(mx)) {
          direction = my < 0 ? 'up' : 'down'
        } else {
          direction = mx > 0 ? 'right' : 'left'
        }
        
        console.log('📍 Gesture direction:', direction)
        setGestureDirection(direction)
        
        // Visual feedback during gesture
        if (distance > GESTURE_THRESHOLD) {
          buttonApi.start({
            scale: MAX_SCALE * 1.1,
            glow: 1.5
          })
        }
      } else if (!active && (isSwipe || distance > GESTURE_THRESHOLD)) {
        // Execute gesture action
        console.log('⚡ Executing gesture action:', gestureDirection)
        executeGestureAction(gestureDirection)
      } else if (!active) {
        // Reset if no significant gesture
        if (distance < GESTURE_THRESHOLD) {
          // Default action (complete with comment)
          executeGestureAction('right')
        } else {
          handlePressEnd()
        }
      }
    },
    {
      axis: undefined,
      threshold: 10,
      rubberband: true,
      preventDefault: true,
      filterTaps: true
    }
  )

  // Execute gesture action
  const executeGestureAction = useCallback((direction) => {
    if (!onTrackingAction) return

    console.log('🎯 Executing action for direction:', direction)
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
          console.log('📸 Triggering photo capture')
          handlePressEnd()
          setTimeout(() => {
            onPhotoCapture()
          }, 100)
          return
        }
        action = 'done_with_photo'
        break
      default:
        action = 'done'
        needsComment = true
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

  // Simplified event handlers with better cross-platform support
  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('👇 Pointer down - type:', e.pointerType)
    if (!isExpanded) handlePressStart()
  }, [isExpanded, handlePressStart])

  const handlePointerUp = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('👆 Pointer up - type:', e.pointerType)
    if (!isExpanded) handlePressEnd()
  }, [isExpanded, handlePressEnd])

  const handlePointerLeave = useCallback((e) => {
    console.log('🚪 Pointer leave - type:', e.pointerType)
    if (isPressed && !isExpanded) handlePressEnd()
  }, [isPressed, isExpanded, handlePressEnd])

  // Handle click for quick actions when not expanded
  const handleClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ Click triggered, isExpanded:', isExpanded, 'isPressed:', isPressed)
    
    if (!isExpanded && !isPressed && selectedGoal) {
      console.log('⚡ Quick action triggered')
      if (onTrackingAction) {
        onTrackingAction('done', true)
      }
    }
  }, [isExpanded, isPressed, selectedGoal, onTrackingAction])

  // Touch event handlers for better mobile support
  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('👆 Touch start')
    if (!isExpanded) handlePressStart()
  }, [isExpanded, handlePressStart])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('👆 Touch end')
    if (!isExpanded) handlePressEnd()
  }, [isExpanded, handlePressEnd])

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ Mouse down')
    if (!isExpanded) handlePressStart()
  }, [isExpanded, handlePressStart])

  const handleMouseUp = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ Mouse up')
    if (!isExpanded) handlePressEnd()
  }, [isExpanded, handlePressEnd])

  const handleMouseLeave = useCallback((e) => {
    console.log('🖱️ Mouse leave')
    if (isPressed && !isExpanded) handlePressEnd()
  }, [isPressed, isExpanded, handlePressEnd])

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
      case 'right': return MessageCircle
      case 'left': return X
      case 'up': return Camera
      default: return selectedGoal?.symbol || '🎯'
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

        {/* Right - Comment */}
        <div className={`absolute top-1/2 -right-16 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'right' ? 'scale-125 text-success-500' : 'text-gray-400'
        }`}>
          <div className="p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-premium">
            <MessageCircle className="w-6 h-6" />
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

      {/* Completion Count Badge */}
      {completionCount > 0 && (
        <div className="absolute -top-4 -right-4 z-30">
          <div className="bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-bold px-3 py-1 rounded-full shadow-premium animate-pulse-soft">
            {completionCount}
          </div>
        </div>
      )}

      {/* Main Button */}
      <animated.button
        ref={buttonRef}
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
          touchAction: 'none'
        }}
        // Multiple event handlers for maximum compatibility
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        tabIndex={0}
        aria-label={isExpanded ? "Swipe to complete action" : selectedGoal ? "Hold to expand tracking options or tap to complete" : "Select a goal first"}
      >
        {/* Button Content */}
        <div className="flex items-center justify-center text-white relative z-10">
          {isExpanded ? (
            <div className="flex items-center justify-center">
              <div className={`transition-colors duration-300 ${getGestureColor(gestureDirection)}`}>
                {(() => {
                  const IconOrEmoji = getGestureIcon(gestureDirection);
                  if (typeof IconOrEmoji === 'string') {
                    return <span className="text-4xl sm:text-5xl">{IconOrEmoji}</span>;
                  }
                  return React.createElement(IconOrEmoji, { 
                    className: "w-8 h-8 sm:w-10 sm:h-10" 
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-4xl sm:text-5xl">
              {selectedGoal?.symbol || '🎯'}
            </div>
          )}
        </div>

        {/* Ripple Effect */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </animated.button>

      {/* Instructions - Only show when expanded and moved down */}
      {isExpanded && (
        <div className="absolute -bottom-32 left-1/2 transform -translate-x-1/2 text-center">
          <div className="space-y-2">
            <p className="text-base font-semibold text-gray-700">
              Swipe to complete
            </p>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-600">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-success-400 rounded-full"></div>
                <span>Right: Comment</span>
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
        </div>
      )}
    </div>
  )
}

export default UnifiedTrackingButton