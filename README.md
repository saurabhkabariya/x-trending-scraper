# X Trending Topics Scraper

A full-stack application that scrapes trending topics from X (Twitter) and displays them in a modern dashboard.

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

