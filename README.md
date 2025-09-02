# X Trending Topics Scraper

A full-stack application that scrapes trending topics from X (Twitter) and displays them in a modern dashboard.

## Live URLs

Frontend Dashboard: https://x-trending-scraper.vercel.app

Backend API: https://x-trending-scraper.onrender.com

###For testing backend APIs on Postman:

1. Runs the Selenium scraper, saves result in DB, returns JSON.
Post https://x-trending-scraper.onrender.com/api/scrape

2. Fetch the latest 5 runs (default), or specify limit with ?limit=10.
GET https://x-trending-scraper.onrender.com/api/trends
GET https://x-trending-scraper.onrender.com/api/trends?limit=10

3. Fetch a specific record by its runId.
GET https://x-trending-scraper.onrender.com/api/trends/runId
(replace runId with an actual ID returned by /api/scrape)

4. Shows total records, oldest/latest run info.
GET https://x-trending-scraper.onrender.com/api/stats

## Setup

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Chrome browser
- X (Twitter) account

### Installation

1. Clone the repository
2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Install frontend dependencies:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables:
   - Create `.env` in backend folder with MongoDB URI and X credentials
   - Create `.env.local` in frontend folder with API URL

### Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```

2. Start the frontend:
   ```bash
   cd frontend
   npm run dev
   ```

3. Access the application at `http://localhost:3000`

## Features

- Real-time trending topics scraping
- Modern dashboard interface
- Historical trends storage
- Responsive design

## Environment Variables

### Backend (.env)
```
MONGODB_URI=your_mongodb_connection_string
X_USERNAME=your_x_username
X_PASSWORD=your_x_password
X_EMAIL=your_x_email
PORT=5000
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### ChromeDriver Issues
- Ensure Chrome browser is installed
- ChromeDriver version should match your Chrome version
- On deployment, use headless mode and install Chrome dependencies

### X Login Issues
- Verify your X credentials are correct
- Check if your account has 2FA enabled (may require additional setup)
- Ensure your account is not suspended or restricted

### CORS Issues
- Verify frontend URL is correctly configured in backend CORS settings
- Check that environment variables are properly set

