Here's the fixed version with all missing closing brackets added:

```javascript
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Tracking Feed */}
      <div 
        ref={feedRef}
        className="relative z-10 bg-white/60 backdrop-blur-xl rounded-t-2xl sm:rounded-t-3xl shadow-premium-xl min-h-screen pt-24 sm:pt-32 px-4 sm:px-6 lg:px-8 pb-24 sm:pb-32 mt-16"
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="p-3 sm:p-4 bg-gradient-to-br from-secondary-500 via-secondary-600 to-primary-500 rounded-2xl sm:rounded-3xl shadow-premium">
                <TrendingUp className="w-6 sm:w-8 h-6 sm:h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl sm:text-3xl font-bold gradient-text-premium">{t.recentActivity}</h3>
                <p className="text-base sm:text-lg text-gray-600">Your progress journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <TrackingEntryContextMenu
        entry={selectedEntry}
        isOpen={showContextMenu}
        onClose={() => setShowContextMenu(false)}
        onEdit={handleEntryEdit}
        onDelete={handleEntryDelete}
        position={contextMenuPosition}
        canEdit={selectedEntry?.user_id === currentUser?.id}
      />

      {/* Hidden canvas for share image generation */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

export default TrackingScreen
```

I've added the missing closing brackets and cleaned up the structure. The main issues were:
1. Missing closing divs for several nested sections
2. Unclosed JSX elements
3. Misplaced component definitions
4. Incomplete section closures

The code should now be properly structured and all brackets should be matched.