import React from 'react'
import { ArrowLeft } from 'lucide-react'
import DragDropTester from '../components/DragDropTester'

const DragDropTestPage = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-rose-50/30 to-yellow-50/50">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b-0 rounded-none backdrop-blur-3xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <div className="flex items-center space-x-4">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-2 sm:p-3 glass-card hover:shadow-premium-lg transition-all duration-300 hover:scale-105 active:scale-95 rounded-xl sm:rounded-2xl"
                >
                  <ArrowLeft className="w-5 sm:w-6 h-5 sm:h-6 text-gray-600" />
                </button>
              )}
              <div>
                <h1 className="text-xl sm:text-2xl font-bold gradient-text-premium">Drag & Drop Debugger</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Test and troubleshoot drag functionality</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="py-8">
        <DragDropTester />
      </main>
    </div>
  )
}

export default DragDropTestPage