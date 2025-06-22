import React, { useRef, useState, useEffect } from 'react'
import { TestTube, CheckCircle, XCircle, AlertTriangle, Monitor, Smartphone } from 'lucide-react'

const DragDropTester = () => {
  const [testResults, setTestResults] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [dragState, setDragState] = useState({
    isDragging: false,
    startPos: { x: 0, y: 0 },
    currentPos: { x: 0, y: 0 },
    events: []
  })
  
  const testElementRef = useRef(null)
  const logRef = useRef(null)

  // Test drag functionality
  const runDragTests = async () => {
    setIsRunning(true)
    const results = {}

    // Test 1: Browser Support
    results.browserSupport = {
      touch: 'ontouchstart' in window,
      pointer: 'onpointerdown' in window,
      mouse: 'onmousedown' in window,
      dragAndDrop: 'draggable' in document.createElement('div')
    }

    // Test 2: Element Setup
    const element = testElementRef.current
    if (element) {
      const styles = getComputedStyle(element)
      results.elementSetup = {
        hasTouchAction: styles.touchAction === 'none',
        hasUserSelect: styles.userSelect === 'none',
        hasPointerEvents: styles.pointerEvents !== 'none',
        hasTabIndex: element.tabIndex >= 0
      }
    }

    // Test 3: Event Listeners
    results.eventListeners = {
      hasPointerDown: !!element?.onpointerdown,
      hasTouchStart: !!element?.ontouchstart,
      hasMouseDown: !!element?.onmousedown
    }

    // Test 4: Performance
    const startTime = performance.now()
    await new Promise(resolve => setTimeout(resolve, 100))
    const endTime = performance.now()
    results.performance = {
      responseTime: endTime - startTime,
      memoryUsage: performance.memory ? performance.memory.usedJSHeapSize : 'N/A'
    }

    setTestResults(results)
    setIsRunning(false)
  }

  // Drag event handlers with logging
  const handleDragStart = (e) => {
    e.preventDefault()
    
    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    setDragState(prev => ({
      ...prev,
      isDragging: true,
      startPos: point,
      currentPos: point,
      events: [...prev.events, {
        type: 'start',
        eventType: e.type,
        pointerType: e.pointerType || 'unknown',
        timestamp: Date.now(),
        position: point
      }]
    }))

    // Visual feedback
    e.currentTarget.style.transform = 'scale(1.1)'
    e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'
  }

  const handleDragMove = (e) => {
    if (!dragState.isDragging) return
    
    e.preventDefault()
    
    const point = e.touches ? 
      { x: e.touches[0].clientX, y: e.touches[0].clientY } :
      { x: e.clientX, y: e.clientY }

    setDragState(prev => ({
      ...prev,
      currentPos: point,
      events: [...prev.events.slice(-10), { // Keep last 10 events
        type: 'move',
        eventType: e.type,
        timestamp: Date.now(),
        position: point
      }]
    }))

    // Visual feedback
    const delta = {
      x: point.x - dragState.startPos.x,
      y: point.y - dragState.startPos.y
    }
    
    e.currentTarget.style.transform = `translate(${delta.x}px, ${delta.y}px) scale(1.1)`
  }

  const handleDragEnd = (e) => {
    if (!dragState.isDragging) return

    setDragState(prev => ({
      ...prev,
      isDragging: false,
      events: [...prev.events, {
        type: 'end',
        eventType: e.type,
        timestamp: Date.now()
      }]
    }))

    // Reset visual feedback
    e.currentTarget.style.transform = ''
    e.currentTarget.style.boxShadow = ''
  }

  // Setup event listeners
  useEffect(() => {
    const element = testElementRef.current
    if (!element) return

    // Set essential CSS
    element.style.touchAction = 'none'
    element.style.userSelect = 'none'
    element.style.cursor = 'grab'

    // Pointer events (preferred)
    element.addEventListener('pointerdown', handleDragStart)
    document.addEventListener('pointermove', handleDragMove)
    document.addEventListener('pointerup', handleDragEnd)

    // Touch events (fallback)
    element.addEventListener('touchstart', handleDragStart, { passive: false })
    document.addEventListener('touchmove', handleDragMove, { passive: false })
    document.addEventListener('touchend', handleDragEnd)

    // Mouse events (fallback)
    element.addEventListener('mousedown', handleDragStart)
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)

    return () => {
      element.removeEventListener('pointerdown', handleDragStart)
      document.removeEventListener('pointermove', handleDragMove)
      document.removeEventListener('pointerup', handleDragEnd)
      element.removeEventListener('touchstart', handleDragStart)
      document.removeEventListener('touchmove', handleDragMove)
      document.removeEventListener('touchend', handleDragEnd)
      element.removeEventListener('mousedown', handleDragStart)
      document.removeEventListener('mousemove', handleDragMove)
      document.removeEventListener('mouseup', handleDragEnd)
    }
  }, [dragState.isDragging, dragState.startPos])

  const getStatusIcon = (value) => {
    if (value === true) return <CheckCircle className="w-4 h-4 text-success-600" />
    if (value === false) return <XCircle className="w-4 h-4 text-error-600" />
    return <AlertTriangle className="w-4 h-4 text-warning-600" />
  }

  const getDeviceType = () => {
    return /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <TestTube className="w-8 h-8 text-primary-600" />
          <h1 className="text-3xl font-bold gradient-text-premium">Drag & Drop Tester</h1>
        </div>
        <p className="text-gray-600">Test and debug drag and drop functionality across devices</p>
      </div>

      {/* Device Info */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center space-x-3 mb-4">
          {getDeviceType() === 'mobile' ? 
            <Smartphone className="w-6 h-6 text-primary-600" /> :
            <Monitor className="w-6 h-6 text-primary-600" />
          }
          <h2 className="text-xl font-bold text-gray-800">Device Information</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Device Type:</span>
            <span className="ml-2 font-medium">{getDeviceType()}</span>
          </div>
          <div>
            <span className="text-gray-600">User Agent:</span>
            <span className="ml-2 font-medium text-xs">{navigator.userAgent.slice(0, 50)}...</span>
          </div>
          <div>
            <span className="text-gray-600">Screen Size:</span>
            <span className="ml-2 font-medium">{window.screen.width}x{window.screen.height}</span>
          </div>
          <div>
            <span className="text-gray-600">Viewport:</span>
            <span className="ml-2 font-medium">{window.innerWidth}x{window.innerHeight}</span>
          </div>
        </div>
      </div>

      {/* Test Element */}
      <div className="glass-card p-8 rounded-2xl text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Test Drag Element</h2>
        <div
          ref={testElementRef}
          className="w-32 h-32 mx-auto bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center text-white font-bold text-lg cursor-grab active:cursor-grabbing transition-all duration-300 hover:scale-105"
          tabIndex={0}
        >
          Drag Me!
        </div>
        <p className="text-gray-600 mt-4">
          Try dragging the element above with mouse, touch, or keyboard
        </p>
      </div>

      {/* Test Results */}
      <div className="glass-card p-6 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-800">Test Results</h2>
          <button
            onClick={runDragTests}
            disabled={isRunning}
            className="btn-premium"
          >
            {isRunning ? 'Running Tests...' : 'Run Tests'}
          </button>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-6">
            {/* Browser Support */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Browser Support</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(testResults.browserSupport || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    {getStatusIcon(value)}
                  </div>
                ))}
              </div>
            </div>

            {/* Element Setup */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Element Setup</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(testResults.elementSetup || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    {getStatusIcon(value)}
                  </div>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Performance</h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(testResults.performance || {}).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="font-medium">{typeof value === 'number' ? value.toFixed(2) : value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Event Log */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Event Log</h2>
        <div 
          ref={logRef}
          className="bg-gray-900 text-green-400 p-4 rounded-lg h-64 overflow-y-auto font-mono text-sm"
        >
          {dragState.events.length === 0 ? (
            <div className="text-gray-500">No events yet. Try dragging the test element above.</div>
          ) : (
            dragState.events.map((event, index) => (
              <div key={index} className="mb-1">
                <span className="text-blue-400">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
                <span className="text-yellow-400 ml-2">{event.type.toUpperCase()}</span>
                <span className="text-white ml-2">{event.eventType}</span>
                {event.pointerType && (
                  <span className="text-purple-400 ml-2">({event.pointerType})</span>
                )}
                {event.position && (
                  <span className="text-cyan-400 ml-2">
                    x:{Math.round(event.position.x)} y:{Math.round(event.position.y)}
                  </span>
                )}
              </div>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-between">
          <button
            onClick={() => setDragState(prev => ({ ...prev, events: [] }))}
            className="btn-secondary-premium text-sm"
          >
            Clear Log
          </button>
          <div className="text-sm text-gray-600">
            Events: {dragState.events.length} | 
            Status: {dragState.isDragging ? 'Dragging' : 'Idle'}
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div className="glass-card p-6 rounded-2xl">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Recommendations</h2>
        <div className="space-y-3">
          {testResults.browserSupport?.pointer === false && (
            <div className="flex items-start space-x-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">Pointer Events Not Supported</p>
                <p className="text-sm text-warning-700">Consider using touch/mouse event fallbacks</p>
              </div>
            </div>
          )}
          
          {testResults.elementSetup?.hasTouchAction === false && (
            <div className="flex items-start space-x-3 p-3 bg-error-50 border border-error-200 rounded-lg">
              <XCircle className="w-5 h-5 text-error-600 mt-0.5" />
              <div>
                <p className="font-medium text-error-800">Missing touch-action: none</p>
                <p className="text-sm text-error-700">Add CSS: touch-action: none to prevent scrolling</p>
              </div>
            </div>
          )}
          
          {testResults.elementSetup?.hasUserSelect === false && (
            <div className="flex items-start space-x-3 p-3 bg-warning-50 border border-warning-200 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-warning-600 mt-0.5" />
              <div>
                <p className="font-medium text-warning-800">Text Selection Enabled</p>
                <p className="text-sm text-warning-700">Add CSS: user-select: none to prevent text selection</p>
              </div>
            </div>
          )}
          
          {Object.values(testResults.browserSupport || {}).every(Boolean) && 
           Object.values(testResults.elementSetup || {}).every(Boolean) && (
            <div className="flex items-start space-x-3 p-3 bg-success-50 border border-success-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-success-600 mt-0.5" />
              <div>
                <p className="font-medium text-success-800">All Tests Passed!</p>
                <p className="text-sm text-success-700">Your drag and drop implementation looks good</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DragDropTester