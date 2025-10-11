// Vercel serverless function for syncing Nessie data to Firestore
import { syncNessieToFirestore } from '../src/api/syncNessieToFirestore.js'

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
  
  // Only allow POST requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  
  try {
    const { userId, userInfo } = req.body
    
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' })
      return
    }
    
    console.log(`Processing sync request for user: ${userId}`)
    
    const result = await syncNessieToFirestore(userId, userInfo || {})
    
    res.status(200).json({
      success: true,
      message: 'Data synced successfully',
      ...result
    })
    
  } catch (error) {
    console.error('Error in syncNessieToFirestore API:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
