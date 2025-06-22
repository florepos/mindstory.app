import React, { useEffect } from 'react'
import { CheckCircle, Circle, X, Camera } from 'lucide-react'
import { useSpring, animated, config } from '@react-spring/web'
import { useDrag } from '@use-gesture/react'

const TrackableGoalItem = ({ goal, draggedGoal, onGoalAction, onTriggerPhotoUpload }) => {
  const isDragged = draggedGoal === goal.id

  const dragHandler = useDrag(
    ({ active, movement: [mx, my], direction: [dx, dy], velocity: [vx, vy] }) => {
      const isSwipe = Math.abs(vx) > 0.5 || Math.abs(vy) > 0.5
      
      if (!active && isSwipe) {
        // Determine swipe direction based on movement and velocity
        if (Math.abs(my) > Math.abs(mx) && my < -50 && dy < 0) {
          // Swipe up - done_with_photo
          onTriggerPhotoUpload(goal.id)
        } else if (mx > 50 && dx > 0) {
          // Swipe right - done
          onGoalAction(goal.id, 'done')
        } else if (mx < -50 && dx < 0) {
          // Swipe left - not_done
          onGoalAction(goal.id, 'not_done')
        }
      }
    },
    {
      axis: undefined, // Allow movement in all directions
      threshold: 10,
      rubberband: true
    }
  )

  const [springs, api] = useSpring(() => ({
    scale: 1,
    rotateZ: 0,
    config: config.wobbly
  }))

  // Update spring when dragged
  useEffect(() => {
    if (isDragged) {
      api.start({
        scale: 1.05,
        rotateZ: Math.random() * 10 - 5 // Random slight rotation
      })
    } else {
      api.start({
        scale: 1,
        rotateZ: 0
      })
    }
  }, [isDragged, api])

  const getStatusColor = (status) => {
    switch (status) {
      case 'done':
        return 'from-success-500 to-success-600'
      case 'done_with_photo':
        return 'from-primary-500 to-primary-600'
      case 'not_done':
        return 'from-error-500 to-error-600'
      default:
        return 'from-gray-200 to-gray-300'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'done':
        return <CheckCircle className="w-6 h-6 text-white" />
      case 'done_with_photo':
        return <Camera className="w-6 h-6 text-white" />
      case 'not_done':
        return <X className="w-6 h-6 text-white" />
      default:
        return <Circle className="w-6 h-6 text-gray-600" />
    }
  }

  const IconComponent = goal.icon

  return (
    <animated.div
      {...dragHandler()}
      style={{
        ...springs,
        touchAction: 'none'
      }}
      className={`flex items-center justify-between p-6 rounded-xl transition-all duration-300 cursor-grab active:cursor-grabbing select-none ${
        goal.status 
          ? `bg-gradient-to-r ${getStatusColor(goal.status)} text-white shadow-soft-lg`
          : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
      } ${isDragged ? 'shadow-glow-lg z-10' : 'shadow-soft'}`}
    >
      <div className="flex items-center space-x-4">
        <div className={`p-3 rounded-xl ${
          goal.status 
            ? 'bg-white/20' 
            : goal.color === 'purple' ? 'bg-secondary-100' :
              goal.color === 'blue' ? 'bg-primary-100' :
              'bg-success-100'
        }`}>
          <IconComponent className={`w-6 h-6 ${
            goal.status 
              ? 'text-white' 
              : goal.color === 'purple' ? 'text-secondary-600' :
                goal.color === 'blue' ? 'text-primary-600' :
                'text-success-600'
          }`} />
        </div>
        <div>
          <h4 className={`font-semibold text-lg ${goal.status ? 'text-white' : 'text-gray-800'}`}>
            {goal.title}
          </h4>
          <p className={`text-base ${goal.status ? 'text-white/80' : 'text-gray-600'}`}>
            {goal.description}
          </p>
        </div>
      </div>
      
      <div className={`p-3 rounded-full transition-all duration-300 ${
        goal.status 
          ? 'bg-white/20' 
          : 'bg-gray-200 hover:bg-gray-300'
      }`}>
        {getStatusIcon(goal.status)}
      </div>
    </animated.div>
  )
}

export default TrackableGoalItem