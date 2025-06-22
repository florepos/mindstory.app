import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useSpring, animated, config } from '@react-spring/web'
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
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  
  const pressTimer = useRef(null)
  const progressTimer = useRef(null)
  const startTime = useRef(null)
  const buttonRef = useRef(null)

  const EXPAND_DURATION = 1000
  const MAX_SCALE = 1.5
  const GESTURE_THRESHOLD = 50 // Noch niedriger für einfachere Gesten

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
    console.log('🛑 Press end triggered')
    setIsPressed(false)
    setIsExpanded(false)
    setProgress(0)
    setGestureDirection(null)
    setIsDragging(false)
    setDragStart({ x: 0, y: 0 })
    setDragCurrent({ x: 0, y: 0 })
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
  }, [buttonApi, progressApi, indicatorApi])

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

  // KOMPLETT NEUES DRAG-SYSTEM - Ohne @use-gesture/react
  const handleDragStart = useCallback((e) => {
    if (!isExpanded) return

    console.log('🎬 Manual drag start')
    setIsDragging(true)
    setGestureDirection(null)

    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    setDragStart(point)
    setDragCurrent(point)

    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()
  }, [isExpanded])

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !isExpanded) return

    console.log('👆 Manual drag move')
    
    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    setDragCurrent(point)

    const deltaX = point.x - dragStart.x
    const deltaY = point.y - dragStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    console.log('📍 Drag delta:', { deltaX: Math.round(deltaX), deltaY: Math.round(deltaY), distance: Math.round(distance) })

    if (distance > 20) {
      let direction = null
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      if (absY > absX) {
        direction = deltaY < 0 ? 'up' : 'down'
      } else {
        direction = deltaX > 0 ? 'right' : 'left'
      }
      
      console.log('📍 Direction detected:', direction)
      setGestureDirection(direction)
      
      // Visual feedback during gesture
      if (distance > GESTURE_THRESHOLD * 0.5) {
        buttonApi.start({
          scale: MAX_SCALE * 1.15,
          glow: 1.8
        })
      }
    }

    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()
  }, [isDragging, isExpanded, dragStart, buttonApi])

  const handleDragEnd = useCallback((e) => {
    if (!isDragging || !isExpanded) return

    console.log('🏁 Manual drag end')
    setIsDragging(false)

    const deltaX = dragCurrent.x - dragStart.x
    const deltaY = dragCurrent.y - dragStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    console.log('📊 Final drag stats:', { 
      distance: Math.round(distance), 
      threshold: GESTURE_THRESHOLD,
      direction: gestureDirection
    })
    
    if (distance > GESTURE_THRESHOLD) {
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

    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()
  }, [isDragging, isExpanded, dragCurrent, dragStart, gestureDirection, executeGestureAction, handlePressEnd])

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

  // Enhanced event handlers - VEREINFACHT
  const handlePointerDown = useCallback((e) => {
    console.log('👇 Pointer down - type:', e.pointerType, 'expanded:', isExpanded)
    
    if (!isExpanded) {
      handlePressStart()
    } else {
      handleDragStart(e)
    }
  }, [isExpanded, handlePressStart, handleDragStart])

  const handlePointerMove = useCallback((e) => {
    if (isExpanded && isDragging) {
      handleDragMove(e)
    }
  }, [isExpanded, isDragging, handleDragMove])

  const handlePointerUp = useCallback((e) => {
    console.log('👆 Pointer up - expanded:', isExpanded, 'dragging:', isDragging)
    
    if (isExpanded && isDragging) {
      handleDragEnd(e)
    } else if (!isExpanded) {
      handlePressEnd()
    }
  }, [isExpanded, isDragging, handleDragEnd, handlePressEnd])

  // Touch event handlers
  const handleTouchStart = useCallback((e) => {
    console.log('📱 Touch start - expanded:', isExpanded)
    
    if (!isExpanded) {
      handlePressStart()
    } else {
      handleDragStart(e)
    }
  }, [isExpanded, handlePressStart, handleDragStart])

  const handleTouchMove = useCallback((e) => {
    if (isExpanded && isDragging) {
      handleDragMove(e)
    }
  }, [isExpanded, isDragging, handleDragMove])

  const handleTouchEnd = useCallback((e) => {
    console.log('📱 Touch end - expanded:', isExpanded, 'dragging:', isDragging)
    
    if (isExpanded && isDragging) {
      handleDragEnd(e)
    } else if (!isExpanded) {
      handlePressEnd()
    }
  }, [isExpanded, isDragging, handleDragEnd, handlePressEnd])

  // Mouse event handlers
  const handleMouseDown = useCallback((e) => {
    console.log('🖱️ Mouse down - expanded:', isExpanded)
    
    if (!isExpanded) {
      handlePressStart()
    } else {
      handleDragStart(e)
    }
  }, [isExpanded, handlePressStart, handleDragStart])

  const handleMouseMove = useCallback((e) => {
    if (isExpanded && isDragging) {
      handleDragMove(e)
    }
  }, [isExpanded, isDragging, handleDragMove])

  const handleMouseUp = useCallback((e) => {
    console.log('🖱️ Mouse up - expanded:', isExpanded, 'dragging:', isDragging)
    
    if (isExpanded && isDragging) {
      handleDragEnd(e)
    } else if (!isExpanded) {
      handlePressEnd()
    }
  }, [isExpanded, isDragging, handleDragEnd, handlePressEnd])

  // Global event listeners für drag moves und ends
  useEffect(() => {
    if (isExpanded && isDragging) {
      const handleGlobalMove = (e) => {
        if (e.type === 'pointermove') handlePointerMove(e)
        else if (e.type === 'touchmove') handleTouchMove(e)
        else if (e.type === 'mousemove') handleMouseMove(e)
      }

      const handleGlobalEnd = (e) => {
        if (e.type === 'pointerup') handlePointerUp(e)
        else if (e.type === 'touchend') handleTouchEnd(e)
        else if (e.type === 'mouseup') handleMouseUp(e)
      }

      // Add global listeners
      document.addEventListener('pointermove', handleGlobalMove, { passive: false })
      document.addEventListener('pointerup', handleGlobalEnd, { passive: false })
      document.addEventListener('touchmove', handleGlobalMove, { passive: false })
      document.addEventListener('touchend', handleGlobalEnd, { passive: false })
      document.addEventListener('mousemove', handleGlobalMove, { passive: false })
      document.addEventListener('mouseup', handleGlobalEnd, { passive: false })

      return () => {
        document.removeEventListener('pointermove', handleGlobalMove)
        document.removeEventListener('pointerup', handleGlobalEnd)
        document.removeEventListener('touchmove', handleGlobalMove)
        document.removeEventListener('touchend', handleGlobalEnd)
        document.removeEventListener('mousemove', handleGlobalMove)
        document.removeEventListener('mouseup', handleGlobalEnd)
      }
    }
  }, [isExpanded, isDragging, handlePointerMove, handlePointerUp, handleTouchMove, handleTouchEnd, handleMouseMove, handleMouseUp])

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

      {/* Main Button - KOMPLETT ÜBERARBEITET */}
      <animated.button
        ref={buttonRef}
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
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        // Pointer Events (modern browsers)
        onPointerDown={handlePointerDown}
        // Touch Events (mobile)
        onTouchStart={handleTouchStart}
        // Mouse Events (desktop fallback)
        onMouseDown={handleMouseDown}
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
            <div>DragStart: {Math.round(dragStart.x)},{Math.round(dragStart.y)}</div>
            <div>DragCurrent: {Math.round(dragCurrent.x)},{Math.round(dragCurrent.y)}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UnifiedTrackingButton