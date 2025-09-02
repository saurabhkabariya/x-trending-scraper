export default function TrendCard({ trend, isLatest = false }) {
  if (!trend) return null

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid date'
    }
  }

  return (
    <div className={`w-full ${isLatest ? 'ring-2 ring-primary-500 ring-offset-2 rounded-lg' : ''}`}>
      <div className="card animate-fade-in hover-lift overflow-hidden">
        {/* Card Header */}
        <div className="card-header">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center space-x-3">
              {isLatest && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 animate-pulse">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Latest
                </span>
              )}
              <h3 className="text-lg font-semibold text-gray-900">
                Trending Topics
              </h3>
            </div>
            <div className="text-sm text-gray-500 font-mono">
              <span className="hidden sm:inline">Run ID: </span>
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                {trend.runId?.slice(0, 8)}...
              </span>
            </div>
          </div>
        </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Metadata */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-6 p-3 bg-gray-50/50 rounded-lg border border-gray-100">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium">
              {formatDate(trend.createdAt)}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
            <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
              {trend.ipAddress}
            </span>
          </div>
        </div>

        {/* Trending Topics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Top 5 Trending Topics:</h4>
          <div className="space-y-3">
            {trend.trends?.map((topic, index) => (
              <div 
                key={index} 
                className="group bg-gradient-to-r from-gray-50 to-gray-100/30 rounded-xl border border-gray-200/30 hover:from-gray-100 hover:to-gray-200/50 transition-all duration-300 hover:shadow-sm p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium group-hover:bg-primary-200 transition-colors">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    {/* Trend text with proper wrapping */}
                    <div className="break-words">
                      <p className="text-sm font-medium text-gray-900 leading-relaxed">
                        {topic.length > 50 ? (
                          <>
                            <span className="block sm:inline">{topic}</span>
                          </>
                        ) : (
                          topic
                        )}
                      </p>
                    </div>
                    
                    {/* Additional info for long trends */}
                    {topic.length > 30 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {topic.length} characters
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <span className="inline-flex items-center px-2.5 py-1.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200/50 group-hover:from-blue-100 group-hover:to-indigo-100 transition-all">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Trending
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
    </div>
  )
}
