// Local development server for API endpoints
import express from 'express'
import cors from 'cors'

// Import Firebase Admin with error handling
let syncNessieToFirestore
try {
  const syncModule = await import('./src/api/syncNessieToFirestore.js')
  syncNessieToFirestore = syncModule.syncNessieToFirestore
  console.log('✅ Firebase Admin SDK loaded successfully')
} catch (error) {
  console.error('❌ Failed to load Firebase Admin SDK:', error.message)
  console.log('💡 Make sure serviceAccountKey.json exists or set environment variables')
  process.exit(1)
}

const app = express()
const PORT = 3001

// Middleware
app.use(cors())
app.use(express.json())

// API endpoint
app.post('/api/syncNessieToFirestore', async (req, res) => {
  try {
    const { userId, userInfo, forceRefresh = false } = req.body
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' })
    }
    
    console.log(`[LOCAL API] Processing sync request for user: ${userId}, forceRefresh: ${forceRefresh}`)
    
    const result = await syncNessieToFirestore(userId, userInfo || {}, forceRefresh)
    
    res.status(200).json({
      success: true,
      message: 'Data synced successfully',
      ...result
    })
    
  } catch (error) {
    console.error('[LOCAL API] Error in syncNessieToFirestore:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
})

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Local API server running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Local API server running on http://localhost:${PORT}`)
  console.log(`📡 API endpoint: http://localhost:${PORT}/api/syncNessieToFirestore`)
})
