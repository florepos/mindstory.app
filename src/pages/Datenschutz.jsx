import React from 'react'
import { ArrowLeft, Shield, Eye, Lock, Database, Cookie, UserCheck } from 'lucide-react'

const Datenschutz = ({ onBack }) => {
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
              <h1 className="text-2xl sm:text-3xl font-bold gradient-text-premium">Datenschutzerklärung</h1>
              <p className="text-sm sm:text-base text-gray-600">Privacy Policy</p>
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
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">Datenschutz bei MindStory</h2>
                  <p className="text-gray-600 mt-2">Wir nehmen den Schutz Ihrer persönlichen Daten sehr ernst.</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 sm:space-y-12">
              {/* Verantwortlicher */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <UserCheck className="w-5 h-5 mr-3 text-primary-600" />
                  1. Verantwortlicher
                </h3>
                <div className="text-gray-700 space-y-2">
                  <p>Verantwortlicher für die Datenverarbeitung auf dieser Website ist:</p>
                  <div className="bg-gray-50 p-4 rounded-xl mt-4">
                    <p className="font-semibold">MindStory GmbH</p>
                    <p>Musterstraße 123</p>
                    <p>80331 München, Deutschland</p>
                    <p>E-Mail: datenschutz@mindstory.app</p>
                    <p>Telefon: +49 (0) 89 123 456 789</p>
                  </div>
                </div>
              </div>

              {/* Datenerfassung */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Database className="w-5 h-5 mr-3 text-primary-600" />
                  2. Welche Daten erfassen wir?
                </h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-semibold mb-2">Registrierungsdaten</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>E-Mail-Adresse</li>
                      <li>Passwort (verschlüsselt gespeichert)</li>
                      <li>Registrierungsdatum</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Nutzungsdaten</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Ihre Ziele und Fortschritte</li>
                      <li>Hochgeladene Fotos (optional)</li>
                      <li>Persönliche Mottos</li>
                      <li>Nutzungsstatistiken</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Technische Daten</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>IP-Adresse</li>
                      <li>Browser-Informationen</li>
                      <li>Geräteinformationen</li>
                      <li>Zugriffszeitpunkte</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Zweck der Datenverarbeitung */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Eye className="w-5 h-5 mr-3 text-primary-600" />
                  3. Zweck der Datenverarbeitung
                </h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-semibold mb-2">Bereitstellung der Dienste</h4>
                    <p>Wir verarbeiten Ihre Daten, um Ihnen unsere Wellness- und Ziel-Tracking-Services anzubieten.</p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Verbesserung der Nutzererfahrung</h4>
                    <p>Analyse der Nutzung zur Optimierung unserer App und Services.</p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Kommunikation</h4>
                    <p>Versendung wichtiger Informationen und Updates zu unserem Service.</p>
                  </div>
                </div>
              </div>

              {/* Cookies */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Cookie className="w-5 h-5 mr-3 text-primary-600" />
                  4. Cookies und lokale Speicherung
                </h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Unsere Website verwendet Cookies und lokale Speichertechnologien, um die Funktionalität zu gewährleisten 
                    und Ihre Nutzererfahrung zu verbessern.
                  </p>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Notwendige Cookies</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Authentifizierung und Sitzungsverwaltung</li>
                      <li>Sicherheitsrelevante Funktionen</li>
                      <li>Grundlegende Website-Funktionalität</li>
                    </ul>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Funktionale Cookies</h4>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Speicherung Ihrer Präferenzen</li>
                      <li>Verbesserung der Benutzerfreundlichkeit</li>
                      <li>Personalisierung der Inhalte</li>
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                    <p className="text-sm">
                      <strong>Cookie-Einstellungen:</strong> Sie können Ihre Cookie-Präferenzen jederzeit in den 
                      Browsereinstellungen ändern oder über unseren Cookie-Banner verwalten.
                    </p>
                  </div>
                </div>
              </div>

              {/* Datensicherheit */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                  <Lock className="w-5 h-5 mr-3 text-primary-600" />
                  5. Datensicherheit
                </h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    Wir setzen technische und organisatorische Sicherheitsmaßnahmen ein, um Ihre Daten vor Verlust, 
                    Manipulation und unberechtigtem Zugriff zu schützen.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                      <h4 className="font-semibold text-green-800 mb-2">Verschlüsselung</h4>
                      <p className="text-sm text-green-700">
                        Alle Datenübertragungen erfolgen über sichere SSL/TLS-Verbindungen.
                      </p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Zugriffskontrolle</h4>
                      <p className="text-sm text-blue-700">
                        Strenge Zugriffskontrollen und regelmäßige Sicherheitsaudits.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ihre Rechte */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">6. Ihre Rechte</h3>
                <div className="space-y-4 text-gray-700">
                  <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="font-semibold">Auskunftsrecht</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="font-semibold">Berichtigungsrecht</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="font-semibold">Löschungsrecht</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="font-semibold">Einschränkungsrecht</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="font-semibold">Datenübertragbarkeit</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                        <span className="font-semibold">Widerspruchsrecht</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200 mt-6">
                    <p className="text-sm text-yellow-800">
                      <strong>Kontakt:</strong> Für die Ausübung Ihrer Rechte wenden Sie sich bitte an: 
                      <a href="mailto:datenschutz@mindstory.app" className="text-primary-600 hover:text-primary-700 ml-1">
                        datenschutz@mindstory.app
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              {/* Drittanbieter */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">7. Drittanbieter-Services</h3>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-semibold mb-2">Supabase (Datenbank & Authentifizierung)</h4>
                    <p className="text-sm">
                      Wir nutzen Supabase für die sichere Speicherung Ihrer Daten und Authentifizierung. 
                      Supabase ist DSGVO-konform und bietet höchste Sicherheitsstandards.
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Pexels (Bildmaterial)</h4>
                    <p className="text-sm">
                      Für Beispielbilder verwenden wir den Service von Pexels. Dabei werden keine personenbezogenen 
                      Daten übertragen.
                    </p>
                  </div>
                </div>
              </div>

              {/* Änderungen */}
              <div className="glass-card p-6 sm:p-8 rounded-2xl">
                <h3 className="text-xl font-bold text-gray-800 mb-4">8. Änderungen der Datenschutzerklärung</h3>
                <div className="text-gray-700">
                  <p>
                    Wir behalten uns vor, diese Datenschutzerklärung zu aktualisieren, um sie an geänderte Rechtslage 
                    oder bei Änderungen des Services anzupassen. Die aktuelle Version finden Sie stets auf dieser Seite.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 sm:mt-12 text-center">
              <p className="text-sm text-gray-500">
                Letzte Aktualisierung: {new Date().toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Datenschutz