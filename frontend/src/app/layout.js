import './globals.css'

export const metadata = {
  title: 'X Trending Topics Scraper',
  description: 'Dashboard for monitoring trending topics on X (Twitter)',
  keywords: ['twitter', 'trends', 'scraper', 'dashboard'],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  )
}
