// Simple health check API route
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  
  try {
    res.status(200).json({
      success: true,
      message: 'API is healthy!',
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.url
    })
  } catch (error) {
    console.error('Error in health API:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
