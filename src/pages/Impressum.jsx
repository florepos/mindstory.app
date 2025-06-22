import React from 'react'
import { ArrowLeft, Building, Mail, Phone, MapPin } from 'lucide-react'

const Impressum = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50">
      {/* Header */}
      <header className="glass-card sticky top-0 z-50 border-b-0 rounded-none backdrop-blur-3xl">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
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
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text-premium">Impressum</h1>
              <p className="text-sm sm:text-base text-gray-600">Legal Information</p>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-16">
        <div className="premium-card p-6 sm:p-12">
          <div className="prose prose-gray max-w-none">
            <div className="mb-8 sm:mb-12">
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-3 bg-gradient-to-br from-primary-500 to-secondary-600 rounded-2xl">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Angaben gemäß § 5 TMG</h2>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12">
              <div className="space-y-6 sm:space-y-8">
                <div className="glass-card p-6 sm:p-8 rounded-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Building className="w-5 h-5 mr-3 text-primary-600" />
                    Unternehmen
                  </h3>
                  <div className="space-y-2 text-gray-700">
                    <p className="font-semibold">MindStory GmbH</p>
                    <p>Geschäftsführer: Max Mustermann</p>
                    <p>Handelsregister: HRB 12345</p>
                    <p>Registergericht: Amtsgericht München</p>
                    <p>Umsatzsteuer-ID: DE123456789</p>
                  </div>
                </div>

                <div className="glass-card p-6 sm:p-8 rounded-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-3 text-primary-600" />
                    Anschrift
                  </h3>
                  <div className="space-y-1 text-gray-700">
                    <p>Musterstraße 123</p>
                    <p>80331 München</p>
                    <p>Deutschland</p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 sm:space-y-8">
                <div className="glass-card p-6 sm:p-8 rounded-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                    <Mail className="w-5 h-5 mr-3 text-primary-600" />
                    Kontakt
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-gray-500" />
                      <a href="mailto:info@mindstory.app" className="text-primary-600 hover:text-primary-700 transition-colors">
                        info@mindstory.app
                      </a>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <a href="tel:+4989123456789" className="text-primary-600 hover:text-primary-700 transition-colors">
                        +49 (0) 89 123 456 789
                      </a>
                    </div>
                  </div>
                </div>

                <div className="glass-card p-6 sm:p-8 rounded-2xl">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">Verantwortlich für den Inhalt</h3>
                  <div className="space-y-1 text-gray-700">
                    <p>Max Mustermann</p>
                    <p>Musterstraße 123</p>
                    <p>80331 München</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 glass-card p-6 sm:p-8 rounded-2xl">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Haftungsausschluss</h3>
              <div className="space-y-4 text-gray-700 text-sm sm:text-base">
                <div>
                  <h4 className="font-semibold mb-2">Haftung für Inhalte</h4>
                  <p>
                    Als Diensteanbieter sind wir gemäß § 7 Abs.1 TMG für eigene Inhalte auf diesen Seiten nach den 
                    allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG sind wir als Diensteanbieter jedoch nicht 
                    unter der Verpflichtung, übermittelte oder gespeicherte fremde Informationen zu überwachen oder nach 
                    Umständen zu forschen, die auf eine rechtswidrige Tätigkeit hinweisen.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Haftung für Links</h4>
                  <p>
                    Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben. 
                    Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der 
                    verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Urheberrecht</h4>
                  <p>
                    Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen 
                    Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der 
                    Grenzen des Urheberrechtes bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 text-center">
              <p className="text-sm text-gray-500">
                Stand: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Impressum