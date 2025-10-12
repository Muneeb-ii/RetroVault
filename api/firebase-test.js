// Firebase connection test
import { db } from '../src/firebaseAdmin.js'

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
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development',
      firebaseTests: {}
    }
    
    // Test 1: Firebase Admin SDK Initialization
    try {
      const testDoc = await db.collection('test').doc('connection-test').get()
      testResults.firebaseTests.adminConnection = {
        status: 'PASS',
        message: 'Firebase Admin SDK connection successful',
        documentExists: testDoc.exists
      }
    } catch (error) {
      testResults.firebaseTests.adminConnection = {
        status: 'FAIL',
        message: 'Firebase Admin SDK connection failed',
        error: error.message
      }
    }
    
    // Test 2: Firestore Write Test
    try {
      const testData = {
        test: true,
        timestamp: new Date(),
        environment: process.env.VERCEL_ENV || 'development'
      }
      
      await db.collection('test').doc('write-test').set(testData)
      testResults.firebaseTests.firestoreWrite = {
        status: 'PASS',
        message: 'Firestore write operation successful'
      }
    } catch (error) {
      testResults.firebaseTests.firestoreWrite = {
        status: 'FAIL',
        message: 'Firestore write operation failed',
        error: error.message
      }
    }
    
    // Test 3: Firestore Read Test
    try {
      const testDoc = await db.collection('test').doc('write-test').get()
      testResults.firebaseTests.firestoreRead = {
        status: 'PASS',
        message: 'Firestore read operation successful',
        documentExists: testDoc.exists,
        hasData: testDoc.exists && testDoc.data()
      }
    } catch (error) {
      testResults.firebaseTests.firestoreRead = {
        status: 'FAIL',
        message: 'Firestore read operation failed',
        error: error.message
      }
    }
    
    // Test 4: Environment Variables for Firebase
    const firebaseEnvVars = {
      FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
      FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
      FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
    }
    
    const missingFirebaseVars = Object.entries(firebaseEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    testResults.firebaseTests.environmentVariables = {
      status: missingFirebaseVars.length === 0 ? 'PASS' : 'FAIL',
      missing: missingFirebaseVars,
      present: Object.keys(firebaseEnvVars).length - missingFirebaseVars.length
    }
    
    // Overall Firebase status
    const firebaseTests = Object.values(testResults.firebaseTests)
    const failedFirebaseTests = firebaseTests.filter(test => test.status === 'FAIL')
    
    testResults.firebaseOverallStatus = failedFirebaseTests.length === 0 ? 'PASS' : 'FAIL'
    testResults.firebaseSummary = {
      total: firebaseTests.length,
      passed: firebaseTests.filter(test => test.status === 'PASS').length,
      failed: failedFirebaseTests.length
    }
    
    res.status(200).json(testResults)
    
  } catch (error) {
    console.error('Error in Firebase test:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
}
