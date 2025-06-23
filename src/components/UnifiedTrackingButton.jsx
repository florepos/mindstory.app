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
  const [isHolding, setIsHolding] = useState(false)
  const [holdProgress, setHoldProgress] = useState(0)
  const [isDragEnabled, setIsDragEnabled] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  const [gestureDirection, setGestureDirection] = useState(null)
  const [isPressed, setIsPressed] = useState(false)
  
  const buttonRef = useRef(null)
  const holdTimerRef = useRef(null)
  const holdStartTime = useRef(null)
  const dragThreshold = 20
  const holdDuration = 3000 // 3 seconds for hold completion
  const hasDraggedRef = useRef(false)

  // Main button animation
  const [buttonSpring, buttonApi] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    glow: 0,
    borderWidth: 4,
    config: config.gentle
  }))

  // Hold progress ring animation
  const [progressSpring, progressApi] = useSpring(() => ({
    progress: 0,
    opacity: 0,
    scale: 1,
    config: config.slow
  }))

  // Direction indicators animation
  const [indicatorSpring, indicatorApi] = useSpring(() => ({
    opacity: 0,
    scale: 1,
    config: config.gentle
  }))

  // Start 3-second hold timer
  const handleStart = useCallback((e) => {
    if (disabled || !selectedGoal) return

    console.log('🚀 Starting 3-second hold sequence')
    
    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()

    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    // Reset all states
    setIsPressed(true)
    setIsHolding(true)
    setIsDragEnabled(false)
    setDragStart(point)
    setDragCurrent(point)
    setGestureDirection(null)
    holdStartTime.current = Date.now()
    hasDraggedRef.current = false

    // Start 3-second hold timer
    startHoldTimer()
    
    // Initial visual feedback
    buttonApi.start({
      scale: 1.05,
      glow: 0.3,
      borderWidth: 6
    })

    // Show progress ring
    progressApi.start({
      opacity: 1,
      scale: 1.1
    })

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    console.log('✅ 3-second hold timer started')
  }, [disabled, selectedGoal, buttonApi, progressApi])

  // 3-second hold timer with smooth progress
  const startHoldTimer = useCallback(() => {
    console.log('⏱️ Starting 3-second progress animation')
    
    // Smooth progress animation
    const updateProgress = () => {
      if (!holdStartTime.current || hasDraggedRef.current) return

      const elapsed = Date.now() - holdStartTime.current
      const progress = Math.min((elapsed / holdDuration) * 100, 100)
      
      setHoldProgress(progress)
      
      // Update progress ring
      progressApi.start({
        progress: progress
      })

      // Update button scale based on progress
      const scale = 1.05 + (progress / 100) * 0.25 // Grows from 1.05 to 1.3
      const glow = 0.3 + (progress / 100) * 0.7 // Glow increases
      const borderWidth = 6 + (progress / 100) * 4 // Border grows
      
      buttonApi.start({
        scale: scale,
        glow: glow,
        borderWidth: borderWidth
      })

      if (progress < 100) {
        holdTimerRef.current = requestAnimationFrame(updateProgress)
      } else {
        console.log('⏰ 3-second hold completed - enabling drag!')
        enableDragMode()
      }
    }

    holdTimerRef.current = requestAnimationFrame(updateProgress)
  }, [progressApi, buttonApi])

  // Enable drag mode after 3-second hold completion
  const enableDragMode = useCallback(() => {
    console.log('🎯 3-second hold completed - drag mode enabled!')
    
    setIsDragEnabled(true)
    setIsHolding(false)
    
    // Show direction indicators
    indicatorApi.start({
      opacity: 1,
      scale: 1.1
    })

    // Enhanced haptic feedback for drag mode
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }

    // Visual feedback for drag mode
    buttonApi.start({
      scale: 1.3,
      glow: 1.0,
      borderWidth: 8
    })
  }, [indicatorApi, buttonApi])

  // Handle drag movement (only when drag is enabled)
  const handleMove = useCallback((e) => {
    if (!isPressed || !isDragEnabled) return

    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()

    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    setDragCurrent(point)

    const deltaX = point.x - dragStart.x
    const deltaY = point.y - dragStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Mark as dragged if threshold exceeded
    if (distance > dragThreshold && !hasDraggedRef.current) {
      console.log('🖱️ Drag threshold exceeded - user is dragging')
      hasDraggedRef.current = true
    }

    if (distance > 10) { // Low threshold for direction detection
      console.log('👆 Drag move:', { deltaX: Math.round(deltaX), deltaY: Math.round(deltaY), distance: Math.round(distance) })

      // Determine direction
      let direction = null
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      if (absY > absX) {
        direction = deltaY < 0 ? 'up' : 'down'
      } else {
        direction = deltaX > 0 ? 'right' : 'left'
      }
      
      if (direction !== 'down') { // Ignore downward gestures
        console.log('📍 Drag direction detected:', direction)
        setGestureDirection(direction)
        
        // Enhanced visual feedback for direction
        buttonApi.start({
          scale: 1.4,
          glow: 1.5,
          rotate: direction === 'right' ? 15 : direction === 'left' ? -15 : 0
        })
      }
    }
  }, [isPressed, isDragEnabled, dragStart, dragThreshold, buttonApi])

  // Handle end of interaction
  const handleEnd = useCallback((e) => {
    if (!isPressed) return

    console.log('🏁 Touch/click ended')
    
    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()

    // Cancel hold timer if still running
    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current)
      holdTimerRef.current = null
    }

    const deltaX = dragCurrent.x - dragStart.x
    const deltaY = dragCurrent.y - dragStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    console.log('📊 Final interaction:', { 
      distance: Math.round(distance), 
      threshold: dragThreshold,
      direction: gestureDirection,
      hasDragged: hasDraggedRef.current,
      holdProgress: Math.round(holdProgress),
      isDragEnabled: isDragEnabled
    })

    // If drag was enabled and user dragged, execute drag action
    if (isDragEnabled && hasDraggedRef.current && distance >= dragThreshold && gestureDirection && gestureDirection !== 'down') {
      console.log('✅ Drag gesture completed, executing action for direction:', gestureDirection)
      executeDragAction(gestureDirection)
    } 
    // If 3-second hold completed but user didn't drag, increment counter
    else if (isDragEnabled && !hasDraggedRef.current) {
      console.log('🎯 3-second hold completed without drag - incrementing counter!')
      executeCountAction()
    }
    // If hold was in progress but not completed, just reset
    else if (holdProgress > 0 && holdProgress < 100) {
      console.log('⏸️ Hold cancelled before completion - resetting')
      resetButton()
    }
    // Otherwise just reset
    else {
      console.log('🔄 Interaction ended - resetting to default state')
      resetButton()
    }
  }, [isPressed, dragCurrent, dragStart, gestureDirection, holdProgress, dragThreshold, isDragEnabled])

  // Execute drag action based on direction
  const executeDragAction = useCallback((direction) => {
    if (!onTrackingAction) {
      console.error('❌ onTrackingAction callback not provided')
      resetButton()
      return
    }

    let action = 'done'
    let requiresComment = false

    switch (direction) {
      case 'right':
        action = 'done'
        requiresComment = true
        console.log('➡️ Right drag: Done with comment')
        break
      case 'left':
        action = 'not_done'
        console.log('⬅️ Left drag: Not done')
        break
      case 'up':
        action = 'done_with_photo'
        console.log('📸 Up drag: Done with photo')
        break
      default:
        action = 'done'
        requiresComment = true
        console.log('🎯 Default drag action: Done with comment')
        break
    }

    // Success animation
    buttonApi.start({
      scale: 1.5,
      rotate: 720,
      glow: 2.5,
      onRest: () => {
        console.log('🚀 Calling onTrackingAction with:', action, requiresComment)
        onTrackingAction(action, requiresComment)
        setTimeout(resetButton, 300)
      }
    })

    // Enhanced haptic feedback for action
    if (navigator.vibrate) {
      navigator.vibrate([150, 50, 150])
    }
  }, [onTrackingAction, onPhotoCapture, buttonApi])

  // Execute count action (3-second hold without drag)
  const executeCountAction = useCallback(() => {
    if (!onTrackingAction) {
      console.error('❌ onTrackingAction callback not provided')
      resetButton()
      return
    }

    console.log('🎯 Executing count action - simple completion')

    // Success animation for count
    buttonApi.start({
      scale: 1.4,
      rotate: 360,
      glow: 2.0,
      onRest: () => {
        console.log('🚀 Calling onTrackingAction for count completion')
        onTrackingAction('done', false) // Count action = simple done without comment
        setTimeout(resetButton, 300)
      }
    })

    // Special haptic feedback for count
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200])
    }
  }, [onTrackingAction, buttonApi])

  // Reset button to initial state
  const resetButton = useCallback(() => {
    console.log('🔄 Resetting button to initial state')
    
    // Cancel any running timers
    if (holdTimerRef.current) {
      cancelAnimationFrame(holdTimerRef.current)
      holdTimerRef.current = null
    }
    
    // Reset all states
    setIsPressed(false)
    setIsHolding(false)
    setIsDragEnabled(false)
    setHoldProgress(0)
    setGestureDirection(null)
    setDragStart({ x: 0, y: 0 })
    setDragCurrent({ x: 0, y: 0 })
    holdStartTime.current = null
    hasDraggedRef.current = false

    // Reset animations
    buttonApi.start({
      scale: 1,
      rotate: 0,
      glow: 0,
      borderWidth: 4
    })

    progressApi.start({
      progress: 0,
      opacity: 0,
      scale: 1
    })

    indicatorApi.start({
      opacity: 0,
      scale: 1
    })
  }, [buttonApi, progressApi, indicatorApi])

  // Global event listeners for moves and ends
  useEffect(() => {
    if (isPressed) {
      const handleGlobalMove = (e) => {
        handleMove(e)
      }

      const handleGlobalEnd = (e) => {
        handleEnd(e)
      }

      // Add global listeners with passive: false to allow preventDefault
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
  }, [isPressed, handleMove, handleEnd])

  const getGestureColor = (direction) => {
    switch (direction) {
      case 'right': return 'text-success-500'
      case 'left': return 'text-error-500'
      case 'up': return 'text-primary-500'
      default: return 'text-white'
    }
  }

  const getGestureIcon = (direction) => {
    switch (direction) {
      case 'right': return MessageCircle
      case 'left': return X
      case 'up': return Camera
      default: return null
    }
  }

  return (
    <div className={`relative flex flex-col items-center ${className}`} style={{ margin: '60px 0' }}>
      {/* Hold Progress Ring */}
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

      {/* Direction Indicators - Show only when drag is enabled */}
      <animated.div
        style={{
          opacity: indicatorSpring.opacity,
          transform: indicatorSpring.scale.to(s => `scale(${s})`)
        }}
        className="absolute inset-0 pointer-events-none z-20"
      >
        {/* Up - Camera */}
        <div className={`absolute -top-32 sm:-top-40 left-1/2 transform -translate-x-1/2 transition-all duration-300 ${
          gestureDirection === 'up' ? 'scale-125 text-primary-500' : 'text-gray-400'
        }`}>
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-full shadow-premium-lg border-2 border-white">
            <Camera className="w-8 sm:w-10 h-8 sm:h-10" />
          </div>
          <div className="text-center mt-2 sm:mt-4 hidden sm:block">
            <div className="text-sm sm:text-base font-bold text-gray-700">Photo</div>
            <div className="text-xs sm:text-sm text-gray-500">Drag up</div>
          </div>
        </div>

        {/* Right - Comment */}
        <div className={`absolute top-1/2 -right-24 sm:-right-32 lg:-right-40 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'right' ? 'scale-125 text-success-500' : 'text-gray-400'
        }`}>
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-full shadow-premium-lg border-2 border-white">
            <MessageCircle className="w-8 sm:w-10 h-8 sm:h-10" />
          </div>
          <div className="text-center mt-2 sm:mt-4 hidden sm:block">
            <div className="text-sm sm:text-base font-bold text-gray-700">Comment</div>
            <div className="text-xs sm:text-sm text-gray-500">Drag right</div>
          </div>
        </div>

        {/* Left - Not Done */}
        <div className={`absolute top-1/2 -left-24 sm:-left-32 lg:-left-40 transform -translate-y-1/2 transition-all duration-300 ${
          gestureDirection === 'left' ? 'scale-125 text-error-500' : 'text-gray-400'
        }`}>
          <div className="p-6 sm:p-8 bg-white/95 backdrop-blur-sm rounded-full shadow-premium-lg border-2 border-white">
            <X className="w-8 sm:w-10 h-8 sm:h-10" />
          </div>
          <div className="text-center mt-2 sm:mt-4 hidden sm:block">
            <div className="text-sm sm:text-base font-bold text-gray-700">Skip</div>
            <div className="text-xs sm:text-sm text-gray-500">Drag left</div>
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

      {/* Main Button - Perfect Desktop System: 3s Hold → Drag OR Count */}
      <animated.button
        ref={buttonRef}
        className={`
          relative w-40 h-40 sm:w-44 sm:h-44
          bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600
          flex items-center justify-center
          cursor-pointer select-none outline-none
          transition-colors duration-300 rounded-full
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:brightness-95'}
          ${isDragEnabled ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}
        `}
        style={{
          transform: buttonSpring.scale.to(s => `scale(${s}) rotate(${buttonSpring.rotate.get()}deg)`),
          boxShadow: buttonSpring.glow.to(g => 
            `0 8px 32px rgba(0, 0, 0, 0.15), 0 0 ${32 + g * 20}px rgba(249, 115, 22, ${g})`
          ),
          borderWidth: buttonSpring.borderWidth.to(w => `${w}px`),
          borderColor: isPressed ? '#f97316' : 'transparent',
          borderStyle: 'solid',
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        // Pointer Events (modern browsers)
        onPointerDown={handleStart}
        // Touch Events (mobile)
        onTouchStart={handleStart}
        // Mouse Events (desktop fallback)
        onMouseDown={handleStart}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        tabIndex={0}
        aria-label={selectedGoal ? "Hold 3 seconds, then drag for options or release to count" : "Select a goal first"}
      >
        {/* Button Content */}
        <div className="flex items-center justify-center text-white relative z-10">
          <div className={`transition-colors duration-300 ${getGestureColor(gestureDirection)}`}>
            {(() => {
              // Show direction icon when dragging, otherwise show goal symbol
              if (gestureDirection && isDragEnabled) {
                const IconComponent = getGestureIcon(gestureDirection);
                return React.createElement(IconComponent, { 
                  className: "w-12 h-12 sm:w-14 sm:h-14" 
                });
              } else {
                // Show goal symbol or default target
                return <span className="text-5xl sm:text-6xl">{selectedGoal?.symbol || '🎯'}</span>;
              }
            })()}
          </div>
        </div>

        {/* Ripple Effect */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </animated.button>

      {/* Instructions */}
      <div className="absolute -bottom-40 sm:-bottom-40 left-1/2 transform -translate-x-1/2 text-center">
        <div className="space-y-2 sm:space-y-4">
          <p className="text-lg sm:text-xl font-bold text-gray-800">
            {isHolding ? `Hold for ${Math.ceil((holdDuration - holdProgress * holdDuration / 100) / 1000)}s` :
             isDragEnabled && hasDraggedRef.current ? 'Release to complete' :
             isDragEnabled ? 'Drag for options or release to count' :
             'Hold for 3 seconds'}
          </p>
          <div className="hidden sm:flex items-center justify-center space-x-6 sm:space-x-8 text-sm text-gray-600 mt-4">
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
            <div className="flex flex-col items-center space-y-1">
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
              <span className="font-medium">Release: Count</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UnifiedTrackingButton