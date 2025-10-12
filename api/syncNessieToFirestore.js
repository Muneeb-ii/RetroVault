// Vercel serverless function for syncing Nessie data to Firestore
import admin from 'firebase-admin'

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // Try environment variables first (for production)
    if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
        projectId: process.env.FIREBASE_PROJECT_ID,
      })
      console.log('✅ Firebase Admin initialized with environment variables')
    } else {
      throw new Error('No Firebase credentials found. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.')
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error)
    throw error
  }
}

const db = admin.firestore()

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
    const { userId, userInfo, forceRefresh = false } = req.body
    
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' })
      return
    }
    
    console.log(`Processing sync request for user: ${userId}, forceRefresh: ${forceRefresh}`)
    
    // Create a simple mock response for now
    const result = {
      success: true,
      message: 'API endpoint is working - sync functionality needs to be implemented',
      dataSource: 'Mock',
      accountsCount: 0,
      transactionsCount: 0,
      userId: userId
    }
    
    res.status(200).json(result)
    
  } catch (error) {
    console.error('Error in syncNessieToFirestore API:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    })
  }
}
