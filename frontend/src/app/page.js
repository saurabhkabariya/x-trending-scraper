'use client'

import { useState, useEffect } from 'react'
import Header from '../components/Header'
import TrendCard from '../components/TrendCard'
import HistorySection from '../components/HistorySection'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { fetchLatestTrends, runScraper } from '../components/api'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isScrapingLoading, setIsScrapingLoading] = useState(false)
  const [latestTrend, setLatestTrend] = useState(null)
  const [trendHistory, setTrendHistory] = useState([])
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    loadTrends()
  }, [])

  const loadTrends = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetchLatestTrends()
      
      if (response.success && response.data.length > 0) {
        setLatestTrend(response.data[0])
        setTrendHistory(response.data)
      } else {
        setTrendHistory([])
        setLatestTrend(null)
      }
    } catch (err) {
      console.error('Error loading trends:', err)
      setError('Failed to load trending topics. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFetchTrends = async () => {
    setIsScrapingLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await runScraper()
      
      if (response.success) {
        setSuccess('Successfully scraped latest trending topics!')
        setLatestTrend(response.data)
        
        // Refresh the history
        await loadTrends()
      } else {
        setError(response.error || 'Failed to scrape trending topics')
      }
    } catch (err) {
      console.error('Error scraping trends:', err)
      setError('Failed to fetch trending topics. Please check your connection and try again.')
    } finally {
      setIsScrapingLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4 py-2">
            X Trending Topics Dashboard
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Monitor and track the latest trending topics on X (Twitter) in real-time
          </p>
          
          <button
            onClick={handleFetchTrends}
            disabled={isScrapingLoading}
            className={`btn-primary text-lg px-8 py-3 ${
              isScrapingLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isScrapingLoading ? (
              <div className="flex items-center justify-center">
                <div className="loading-spinner w-5 h-5 mr-2"></div>
                Fetching Latest Trends...
              </div>
            ) : (
              'Fetch Latest Trends'
            )}
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-6">
            <ErrorMessage message={error} onDismiss={() => setError(null)} />
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">{success}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccess(null)}
                  className="inline-flex text-green-400 hover:text-green-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Latest Trends Section */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <LoadingSpinner size="large" />
          </div>
        ) : latestTrend ? (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Latest Trending Topics</h2>
            <TrendCard trend={latestTrend} isLatest={true} />
          </div>
        ) : (
          <div className="mb-12 text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No trends available</h3>
            <p className="text-gray-600">Click "Fetch Latest Trends" to get started</p>
          </div>
        )}

        {/* Trends History Section */}
        <HistorySection 
          trends={trendHistory} 
          isLoading={isLoading}
          onRefresh={loadTrends}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 X Trending Topics Scraper. Built with Next.js and Tailwind CSS.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
