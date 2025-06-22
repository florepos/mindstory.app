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
  const [isDragging, setIsDragging] = useState(false)
  
  const pressTimer = useRef(null)
  const progressTimer = useRef(null)
  const startTime = useRef(null)

  const EXPAND_DURATION = 1000 // Reduced to 1 second
  const MAX_SCALE = 1.5
  const GESTURE_THRESHOLD = 60 // Reduced threshold for easier gestures

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
    console.log('✨ Expansion complete - enabling drag')
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
    setIsDragging(false)
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

  // Execute gesture action
  const executeGestureAction = useCallback((direction) => {
    if (!onTrackingAction) {
      console.error('❌ onTrackingAction callback not provided')
      return
    }

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
        console.log('➡️ Right swipe: Done with comment')
        break
      case 'left':
        action = 'not_done'
        console.log('⬅️ Left swipe: Not done')
        break
      case 'up':
        if (onPhotoCapture) {
          console.log('📸 Up swipe: Triggering photo capture')
          onPhotoCapture()
          handlePressEnd()
          return
        }
        action = 'done_with_photo'
        console.log('📸 Up swipe: Done with photo')
        break
      default:
        action = 'done'
        needsComment = true
        console.log('🎯 Default action: Done with comment')
        break
    }

    // Success animation with callback
    buttonApi.start({
      scale: MAX_SCALE * 1.3,
      rotate: 720,
      glow: 2.5,
      onRest: () => {
        console.log('🚀 Calling onTrackingAction with:', action, needsComment)
        onTrackingAction(action, needsComment)
        setTimeout(handlePressEnd, 300)
      }
    })
  }, [onTrackingAction, onPhotoCapture, buttonApi, handlePressEnd])

  // Enhanced gesture handler with comprehensive logging
  const bind = useDrag(
    ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy], first, last, event }) => {
      if (!isExpanded) {
        console.log('❌ Gesture ignored - not expanded')
        return
      }

      console.log('👆 Gesture:', { 
        active, 
        movement: [Math.round(mx), Math.round(my)], 
        direction: [dx, dy], 
        velocity: [Math.round(vx * 100) / 100, Math.round(vy * 100) / 100],
        first, 
        last,
        eventType: event?.type
      })

      if (first) {
        console.log('🎬 Gesture started')
        setIsDragging(true)
        setGestureDirection(null)
      }

      if (active) {
        const distance = Math.sqrt(mx * mx + my * my)
        
        if (distance > 15) { // Lower threshold for direction detection
          // Determine direction based on movement with better logic
          let direction = null
          const absX = Math.abs(mx)
          const absY = Math.abs(my)
          
          if (absY > absX) {
            // Vertical movement is dominant
            direction = my < 0 ? 'up' : 'down'
          } else {
            // Horizontal movement is dominant
            direction = mx > 0 ? 'right' : 'left'
          }
          
          console.log('📍 Direction detected:', direction, 'distance:', Math.round(distance), 'movement:', [Math.round(mx), Math.round(my)])
          setGestureDirection(direction)
          
          // Visual feedback during gesture with stronger effect
          if (distance > GESTURE_THRESHOLD * 0.3) {
            buttonApi.start({
              scale: MAX_SCALE * 1.15,
              glow: 1.8
            })
          }
        }
      }

      if (last) {
        console.log('🏁 Gesture ended')
        setIsDragging(false)
        const distance = Math.sqrt(mx * mx + my * my)
        const isSwipe = Math.abs(vx) > 0.1 || Math.abs(vy) > 0.1
        
        console.log('📊 Final gesture stats:', { 
          distance: Math.round(distance), 
          isSwipe, 
          threshold: GESTURE_THRESHOLD,
          velocity: [Math.round(vx * 100) / 100, Math.round(vy * 100) / 100]
        })
        
        if (distance > GESTURE_THRESHOLD || isSwipe) {
          console.log('✅ Gesture threshold met, executing action for direction:', gestureDirection)
          if (gestureDirection && gestureDirection !== 'down') {
            executeGestureAction(gestureDirection)
          } else {
            console.log('❌ Invalid direction or downward gesture, resetting')
            handlePressEnd()
          }
        } else {
          console.log('❌ Gesture threshold not met, resetting')
          handlePressEnd()
        }
      }
    },
    {
      axis: undefined, // Allow all directions
      threshold: 5, // Very low threshold for initial detection
      rubberband: true,
      preventDefault: true,
      filterTaps: true,
      enabled: isExpanded, // Only enable when expanded
      pointer: { touch: true } // Explicitly enable touch
    }
  )

  // Handle click for quick actions when not expanded
  const handleClick = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('🖱️ Click triggered, isExpanded:', isExpanded, 'isPressed:', isPressed)
    
    if (!isExpanded && !isPressed && selectedGoal && onTrackingAction) {
      console.log('⚡ Quick action triggered')
      onTrackingAction('done', true)
    }
  }, [isExpanded, isPressed, selectedGoal, onTrackingAction])

  // Enhanced event handlers with better debugging
  const handlePointerDown = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('👇 Pointer down - type:', e.pointerType, 'button:', e.button)
    if (!isExpanded && e.button === 0) { // Only left mouse button or touch
      handlePressStart()
    }
  }, [isExpanded, handlePressStart])

  const handlePointerUp = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    console.log('👆 Pointer up - type:', e.pointerType)
    if (!isExpanded && !isDragging) {
      handlePressEnd()
    }
  }, [isExpanded, isDragging, handlePressEnd])

  const handlePointerLeave = useCallback((e) => {
    console.log('🚪 Pointer leave - type:', e.pointerType)
    if (isPressed && !isExpanded && !isDragging) {
      handlePressEnd()
    }
  }, [isPressed, isExpanded, isDragging, handlePressEnd])

  // Touch event handlers for better mobile support
  const handleTouchStart = useCallback((e) => {
    e.preventDefault()
    console.log('📱 Touch start - touches:', e.touches.length)
    if (!isExpanded && e.touches.length === 1) { // Single touch only
      handlePressStart()
    }
  }, [isExpanded, handlePressStart])

  const handleTouchEnd = useCallback((e) => {
    e.preventDefault()
    console.log('📱 Touch end - touches:', e.touches.length)
    if (!isExpanded && !isDragging) {
      handlePressEnd()
    }
  }, [isExpanded, isDragging, handlePressEnd])

  // Mouse event handlers for desktop
  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    console.log('🖱️ Mouse down - button:', e.button)
    if (!isExpanded && e.button === 0) { // Left mouse button only
      handlePressStart()
    }
  }, [isExpanded, handlePressStart])

  const handleMouseUp = useCallback((e) => {
    e.preventDefault()
    console.log('🖱️ Mouse up - button:', e.button)
    if (!isExpanded && !isDragging) {
      handlePressEnd()
    }
  }, [isExpanded, isDragging, handlePressEnd])

  const handleMouseLeave = useCallback((e) => {
    console.log('🖱️ Mouse leave')
    if (isPressed && !isExpanded && !isDragging) {
      handlePressEnd()
    }
  }, [isPressed, isExpanded, isDragging, handlePressEnd])

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
    <div className={`relative flex flex-col items-center ${className}`} style={{ margin: '60px 0' }}>
      {/* Progress Ring */}
      <animated.div
        style={{
          opacity: progressSpring.opacity,
          transform: progressSpring.scale.to(s => `scale(${s})`)
        }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
      >
        <svg className="w-48 h-48 sm:w-56 sm:h-56 transform -rotate-90" viewBox="0 0 200 200">
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

      {/* Direction Indicators - Responsive positioning to stay within viewport */}
      <animated.div
        style={{
          opacity: isExpanded ? indicatorSpring.opacity : 0,
          transform: indicatorSpring.scale.to(s => `scale(${s})`)
        }}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {/* Up - Camera - Responsive positioning */}
        <div className={`absolute -top-32 sm:-top-40 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
          gestureDirection === 'up' ? 'scale-125 text-primary-500' : 'text-gray-400'
        }`}>
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-full shadow-premium-lg border-2 border-white">
            <Camera className="w-8 sm:w-10 h-8 sm:h-10" />
          </div>
          <div className="text-center mt-2 sm:mt-4 hidden sm:block">
            <div className="text-sm sm:text-base font-bold text-gray-700">Photo</div>
            <div className="text-xs sm:text-sm text-gray-500">Swipe up</div>
          </div>
        </div>

        {/* Right - Comment - Responsive positioning */}
        <div className={`absolute top-1/2 -right-24 sm:-right-32 lg:-right-40 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'right' ? 'scale-125 text-success-500' : 'text-gray-400'
        }`}>
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-full shadow-premium-lg border-2 border-white">
            <MessageCircle className="w-8 sm:w-10 h-8 sm:h-10" />
          </div>
          <div className="text-center mt-2 sm:mt-4 hidden sm:block">
            <div className="text-sm sm:text-base font-bold text-gray-700">Comment</div>
            <div className="text-xs sm:text-sm text-gray-500">Swipe right</div>
          </div>
        </div>

        {/* Left - Not Done - Responsive positioning */}
        <div className={`absolute top-1/2 -left-24 sm:-left-32 lg:-left-40 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'left' ? 'scale-125 text-error-500' : 'text-gray-400'
        }`}>
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-full shadow-premium-lg border-2 border-white">
            <X className="w-8 sm:w-10 h-8 sm:h-10" />
          </div>
          <div className="text-center mt-2 sm:mt-4 hidden sm:block">
            <div className="text-sm sm:text-base font-bold text-gray-700">Skip</div>
            <div className="text-xs sm:text-sm text-gray-500">Swipe left</div>
          </div>
        </div>
      </animated.div>

      {/* Completion Count Badge */}
      {completionCount > 0 && (
        <div className="absolute -top-6 -right-6 z-30">
          <div className="bg-gradient-to-r from-success-500 to-success-600 text-white text-lg font-bold px-4 py-2 rounded-full shadow-premium animate-pulse-soft border-2 border-white">
            {completionCount}
          </div>
        </div>
      )}

      {/* Main Button - Enhanced with multiple event handlers */}
      <animated.button
        {...bind()}
        className={`
          relative w-40 h-40 sm:w-44 sm:h-44
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
        // Pointer Events (modern browsers)
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        // Touch Events (mobile)
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        // Mouse Events (desktop fallback)
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        // Click handler for quick actions
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
                    return <span className="text-5xl sm:text-6xl">{IconOrEmoji}</span>;
                  }
                  return React.createElement(IconOrEmoji, { 
                    className: "w-12 h-12 sm:w-14 sm:h-14" 
                  });
                })()}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center text-5xl sm:text-6xl">
              {selectedGoal?.symbol || '🎯'}
            </div>
          )}
        </div>

        {/* Ripple Effect */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </animated.button>

      {/* Instructions - Responsive positioning */}
      {isExpanded && (
        <div className="absolute -bottom-32 sm:-bottom-40 left-1/2 transform -translate-x-1/2 text-center">
          <div className="space-y-2 sm:space-y-4">
            <p className="text-lg sm:text-xl font-bold text-gray-800">
              Swipe to complete
            </p>
            <div className="hidden sm:flex items-center justify-center space-x-6 sm:space-x-8 text-sm text-gray-600">
              <div className="flex flex-col items-center space-y-1">
                <div className="w-3 h-3 bg-success-400 rounded-full"></div>
                <span className="font-medium">Right: Comment</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="w-3 h-3 bg-primary-400 rounded-full"></div>
                <span className="font-medium">Up: Photo</span>
              </div>
              <div className="flex flex-col items-center space-y-1">
                <div className="w-3 h-3 bg-error-400 rounded-full"></div>
                <span className="font-medium">Left: Skip</span>
              </div>
            </div>
            {/* Mobile-friendly simplified instructions */}
            <div className="sm:hidden text-sm text-gray-600">
              <p>Swipe in any direction to complete</p>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info (development only) */}
      {import.meta.env.DEV && (
        <div className="absolute -bottom-56 sm:-bottom-64 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/80 p-3 rounded-lg border max-w-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>Pressed: {isPressed.toString()}</div>
            <div>Expanded: {isExpanded.toString()}</div>
            <div>Progress: {Math.round(progress)}%</div>
            <div>Direction: {gestureDirection || 'none'}</div>
            <div>Dragging: {isDragging.toString()}</div>
            <div>Goal: {selectedGoal?.name || 'none'}</div>
            <div>Disabled: {disabled.toString()}</div>
            <div>Callback: {onTrackingAction ? 'present' : 'missing'}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedTrackingButton