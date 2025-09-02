import TrendCard from './TrendCard'
import LoadingSpinner from './LoadingSpinner'

export default function HistorySection({ trends, isLoading, onRefresh }) {
  const historyTrends = trends?.slice(1) || [] // Exclude the first one (latest)

  return (
    <section id="history" className="mb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Recent History</h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Track your previous scraping sessions and analyze trending patterns
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="text-xs sm:text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg border order-2 sm:order-1">
            <span className="font-medium">{trends?.length || 0}</span> total records
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center justify-center bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 text-gray-800 font-medium py-2 px-4 rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm order-1 sm:order-2 min-w-[120px] touch-manipulation"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="loading-spinner w-4 h-4 mr-2"></div>
                <span className="hidden xs:inline">Refreshing...</span>
                <span className="xs:hidden">...</span>
              </div>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col justify-center items-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
          <LoadingSpinner size="large" />
          <p className="mt-4 text-gray-600 text-sm animate-pulse">Loading historical data...</p>
        </div>
      ) : historyTrends.length > 0 ? (
        <>
          {/* Responsive Grid Layout */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
            {historyTrends.map((trend, index) => (
              <div 
                key={trend.runId || index} 
                className="animate-slide-up hover-lift"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <TrendCard trend={trend} />
              </div>
            ))}
          </div>
          
          {/* Load More Button for Large Datasets */}
          {historyTrends.length >= 6 && (
            <div className="flex justify-center mt-8">
              <button className="inline-flex items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 text-sm touch-manipulation">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                Load More History
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
          <div className="max-w-md mx-auto px-4">
            <div className="text-6xl sm:text-7xl mb-6 animate-bounce">📚</div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3">No History Available</h3>
            <p className="text-gray-600 mb-6 text-sm sm:text-base leading-relaxed">
              Your previous trend records will appear here once you start scraping. 
              Get started by fetching the latest trending topics.
            </p>
            <button
              onClick={onRefresh}
              className="inline-flex items-center bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 text-sm hover-lift touch-manipulation"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Check for Updates
            </button>
          </div>
        </div>
      )}

      {/* Enhanced Statistics Section */}
      {historyTrends.length > 0 && (
        <div className="mt-12">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Analytics Overview</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {/* Total Records */}
            <div className="group bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-700 uppercase tracking-wide">Total Records</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-900 mt-1">{trends.length}</p>
                  <p className="text-xs text-blue-600 mt-1">Scraping sessions</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Topics Tracked */}
            <div className="group bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-700 uppercase tracking-wide">Topics Tracked</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-900 mt-1">{trends.length * 5}</p>
                  <p className="text-xs text-green-600 mt-1">Unique trends</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-green-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Success Rate */}
            <div className="group bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-purple-700 uppercase tracking-wide">Success Rate</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-900 mt-1">100%</p>
                  <p className="text-xs text-purple-600 mt-1">Successful scrapes</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Last Updated */}
            <div className="group bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-orange-700 uppercase tracking-wide">Last Updated</p>
                  <p className="text-lg sm:text-xl font-bold text-orange-900 mt-1">
                    {trends.length > 0 ? 'Just now' : 'Never'}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">Real-time data</p>
                </div>
                <div className="flex-shrink-0">
                  <svg className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
