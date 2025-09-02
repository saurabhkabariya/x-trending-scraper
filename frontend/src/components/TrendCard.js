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
    <div className={`card animate-fade-in ${isLatest ? 'ring-2 ring-primary-500' : ''}`}>
      {/* Card Header */}
      <div className="card-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLatest && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                Latest
              </span>
            )}
            <h3 className="text-lg font-semibold text-gray-900">
              Trending Topics
            </h3>
          </div>
          <div className="text-sm text-gray-500">
            Run ID: {trend.runId?.slice(0, 8)}...
          </div>
        </div>
      </div>

      {/* Card Body */}
      <div className="card-body">
        {/* Metadata */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-2 sm:space-y-0">
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(trend.createdAt)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
            </svg>
            IP: {trend.ipAddress}
          </div>
        </div>

        {/* Trending Topics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-4">Top 5 Trending Topics:</h4>
          <div className="space-y-3">
            {trend.trends?.map((topic, index) => (
              <div key={index} className="trend-item">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-100 text-primary-600 text-sm font-medium">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {topic}
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                    Trending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        
      </div>
    </div>
  )
}
