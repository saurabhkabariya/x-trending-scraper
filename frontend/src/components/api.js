const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'

export const fetchLatestTrends = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trends`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching trends:', error)
    throw error
  }
}

export const runScraper = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error running scraper:', error)
    throw error
  }
}

export const fetchTrendById = async (runId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/trends/${runId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching trend by ID:', error)
    throw error
  }
}

export const fetchStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error fetching stats:', error)
    throw error
  }
}
