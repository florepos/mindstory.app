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
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 })
  const [gestureDirection, setGestureDirection] = useState(null)
  const [isPressed, setIsPressed] = useState(false)
  
  const buttonRef = useRef(null)
  const dragThreshold = 30 // Reduced threshold for easier gestures
  const quickTapThreshold = 200 // Max time for quick tap
  const tapStartTime = useRef(null)

  // Main button animation
  const [buttonSpring, buttonApi] = useSpring(() => ({
    scale: 1,
    rotate: 0,
    glow: 0,
    config: config.gentle
  }))

  // Direction indicators animation
  const [indicatorSpring, indicatorApi] = useSpring(() => ({
    opacity: 0,
    scale: 1,
    config: config.gentle
  }))

  // Start drag immediately on touch/mouse down
  const handleDragStart = useCallback((e) => {
    if (disabled || !selectedGoal) return

    console.log('🚀 IMMEDIATE drag start - no expansion needed!')
    
    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()

    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    setIsDragging(true)
    setIsPressed(true)
    setDragStart(point)
    setDragCurrent(point)
    setGestureDirection(null)
    tapStartTime.current = Date.now()
    
    // Immediate visual feedback
    buttonApi.start({
      scale: 1.1,
      glow: 0.5
    })

    // Show direction indicators immediately
    indicatorApi.start({
      opacity: 1,
      scale: 1.1
    })

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }

    console.log('✅ Drag started at:', point)
  }, [disabled, selectedGoal, buttonApi, indicatorApi])

  const handleDragMove = useCallback((e) => {
    if (!isDragging) return

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

    console.log('👆 Drag move:', { deltaX: Math.round(deltaX), deltaY: Math.round(deltaY), distance: Math.round(distance) })

    // Determine direction as soon as we have some movement
    if (distance > 15) {
      let direction = null
      const absX = Math.abs(deltaX)
      const absY = Math.abs(deltaY)
      
      if (absY > absX) {
        direction = deltaY < 0 ? 'up' : 'down'
      } else {
        direction = deltaX > 0 ? 'right' : 'left'
      }
      
      if (direction !== 'down') { // Ignore downward gestures
        console.log('📍 Direction detected:', direction)
        setGestureDirection(direction)
        
        // Enhanced visual feedback for direction
        buttonApi.start({
          scale: 1.2,
          glow: 1.0,
          rotate: direction === 'right' ? 10 : direction === 'left' ? -10 : 0
        })
      }
    }
  }, [isDragging, dragStart, buttonApi])

  const handleDragEnd = useCallback((e) => {
    if (!isDragging) return

    console.log('🏁 Drag end')
    
    // Prevent default behaviors
    e.preventDefault()
    e.stopPropagation()

    const deltaX = dragCurrent.x - dragStart.x
    const deltaY = dragCurrent.y - dragStart.y
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
    const tapDuration = Date.now() - (tapStartTime.current || 0)

    console.log('📊 Final gesture:', { 
      distance: Math.round(distance), 
      threshold: dragThreshold,
      direction: gestureDirection,
      tapDuration
    })

    // Check if it's a quick tap (for default action)
    if (distance < dragThreshold && tapDuration < quickTapThreshold) {
      console.log('⚡ Quick tap detected - executing default action')
      executeAction('done', true) // Default to done with comment
    } else if (distance >= dragThreshold && gestureDirection && gestureDirection !== 'down') {
      console.log('✅ Gesture threshold met, executing action for direction:', gestureDirection)
      executeAction(gestureDirection)
    } else {
      console.log('❌ Gesture not recognized, resetting')
      resetButton()
    }
  }, [isDragging, dragCurrent, dragStart, gestureDirection])

  // Execute the appropriate action based on gesture
  const executeAction = useCallback((directionOrAction, needsComment = false) => {
    if (!onTrackingAction) {
      console.error('❌ onTrackingAction callback not provided')
      resetButton()
      return
    }

    let action = 'done'
    let requiresComment = needsComment

    // Map direction to action
    if (typeof directionOrAction === 'string') {
      switch (directionOrAction) {
        case 'right':
          action = 'done'
          requiresComment = true
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
            resetButton()
            return
          }
          action = 'done_with_photo'
          console.log('📸 Up swipe: Done with photo')
          break
        case 'done':
          action = 'done'
          console.log('🎯 Quick tap: Done with comment')
          break
        default:
          action = 'done'
          requiresComment = true
          console.log('🎯 Default action: Done with comment')
          break
      }
    }

    // Success animation
    buttonApi.start({
      scale: 1.4,
      rotate: 360,
      glow: 2.0,
      onRest: () => {
        console.log('🚀 Calling onTrackingAction with:', action, requiresComment)
        onTrackingAction(action, requiresComment)
        setTimeout(resetButton, 300)
      }
    })

    // Enhanced haptic feedback for action
    if (navigator.vibrate) {
      navigator.vibrate([100, 50, 100])
    }
  }, [onTrackingAction, onPhotoCapture, buttonApi])

  // Reset button to initial state
  const resetButton = useCallback(() => {
    console.log('🔄 Resetting button state')
    
    setIsDragging(false)
    setIsPressed(false)
    setGestureDirection(null)
    setDragStart({ x: 0, y: 0 })
    setDragCurrent({ x: 0, y: 0 })
    tapStartTime.current = null

    // Reset animations
    buttonApi.start({
      scale: 1,
      rotate: 0,
      glow: 0
    })

    indicatorApi.start({
      opacity: 0,
      scale: 1
    })
  }, [buttonApi, indicatorApi])

  // Global event listeners for drag moves and ends
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e) => {
        handleDragMove(e)
      }

      const handleGlobalEnd = (e) => {
        handleDragEnd(e)
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
  }, [isDragging, handleDragMove, handleDragEnd])

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
      {/* Direction Indicators - Show when dragging */}
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
            <div className="text-xs sm:text-sm text-gray-500">Swipe up</div>
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
            <div className="text-xs sm:text-sm text-gray-500">Swipe right</div>
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

      {/* Main Button - SINGLE TOUCH SYSTEM */}
      <animated.button
        ref={buttonRef}
        className={`
          relative w-40 h-40 sm:w-44 sm:h-44
          bg-gradient-to-br from-primary-500 via-secondary-500 to-primary-600
          flex items-center justify-center
          cursor-pointer select-none outline-none
          transition-colors duration-300 rounded-full
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:brightness-110 active:brightness-95'}
          ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}
        `}
        style={{
          transform: buttonSpring.scale.to(s => `scale(${s}) rotate(${buttonSpring.rotate.get()}deg)`),
          boxShadow: buttonSpring.glow.to(g => 
            `0 8px 32px rgba(0, 0, 0, 0.15), 0 0 ${32 + g * 20}px rgba(249, 115, 22, ${g})`
          ),
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
        // Pointer Events (modern browsers)
        onPointerDown={handleDragStart}
        // Touch Events (mobile)
        onTouchStart={handleDragStart}
        // Mouse Events (desktop fallback)
        onMouseDown={handleDragStart}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        tabIndex={0}
        aria-label={selectedGoal ? "Tap to complete or drag for options" : "Select a goal first"}
      >
        {/* Button Content */}
        <div className="flex items-center justify-center text-white relative z-10">
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

        {/* Ripple Effect */}
        {isPressed && (
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
        )}
      </animated.button>

      {/* Instructions */}
      <div className="absolute -bottom-32 sm:-bottom-40 left-1/2 transform -translate-x-1/2 text-center">
        <div className="space-y-2 sm:space-y-4">
          <p className="text-lg sm:text-xl font-bold text-gray-800">
            {isDragging ? 'Release to complete' : 'Tap or drag to track'}
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
            <p>Tap to complete • Drag for options</p>
          </div>
        </div>
      </div>

      {/* Debug Info (development only) */}
      {import.meta.env.DEV && (
        <div className="absolute -bottom-56 sm:-bottom-64 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 bg-white/80 p-3 rounded-lg border max-w-xs">
          <div className="grid grid-cols-2 gap-2">
            <div>Dragging: {isDragging.toString()}</div>
            <div>Pressed: {isPressed.toString()}</div>
            <div>Direction: {gestureDirection || 'none'}</div>
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