import React from 'react'
import { Cookie, Check, X, Settings } from 'lucide-react'

const CookieBanner = ({ onAccept, onDecline, onSettings }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        <div className="premium-card p-6 sm:p-8 border-2 border-primary-200 shadow-premium-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="flex-shrink-0">
              <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl">
                <Cookie className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2">
                Cookies & Datenschutz
              </h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                Wir verwenden Cookies und ähnliche Technologien, um Ihnen die bestmögliche Nutzererfahrung zu bieten. 
                Einige Cookies sind für die Funktionalität der Website erforderlich, andere helfen uns dabei, 
                die Website zu verbessern und Ihnen personalisierte Inhalte anzuzeigen.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
              <button
                onClick={onSettings}
                className="btn-secondary-premium flex items-center justify-center space-x-2 text-sm px-4 py-3 whitespace-nowrap"
              >
                <Settings className="w-4 h-4" />
                <span>Einstellungen</span>
              </button>
              
              <button
                onClick={onDecline}
                className="btn-secondary-premium flex items-center justify-center space-x-2 text-sm px-4 py-3 whitespace-nowrap bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300"
              >
                <X className="w-4 h-4" />
                <span>Ablehnen</span>
              </button>
              
              <button
                onClick={onAccept}
                className="btn-premium flex items-center justify-center space-x-2 text-sm px-6 py-3 whitespace-nowrap"
              >
                <Check className="w-4 h-4" />
                <span>Alle akzeptieren</span>
              </button>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Weitere Informationen finden Sie in unserer{' '}
              <button
                onClick={onSettings}
                className="text-primary-600 hover:text-primary-700 underline transition-colors"
              >
                Datenschutzerklärung
              </button>
              . Sie können Ihre Einstellungen jederzeit ändern.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CookieBanner