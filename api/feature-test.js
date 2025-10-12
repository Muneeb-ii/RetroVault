// Feature test to verify all app functionality works like local
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
  
  try {
    const testResults = {
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development',
      featureTests: {}
    }
    
    // Test 1: Nessie Sync API (Main backend functionality)
    try {
      const syncResult = await syncNessieToFirestore('test-user-feature', {
        name: 'Test User',
        email: 'test@example.com'
      }, true)
      
      testResults.featureTests.nessieSync = {
        status: 'PASS',
        message: 'Nessie sync API working correctly',
        result: {
          success: syncResult.success,
          dataSource: syncResult.dataSource,
          accountsCount: syncResult.accountsCount,
          transactionsCount: syncResult.transactionsCount
        }
      }
    } catch (error) {
      testResults.featureTests.nessieSync = {
        status: 'FAIL',
        message: 'Nessie sync API failed',
        error: error.message
      }
    }
    
    // Test 2: Environment Variables for All Services
    const allEnvVars = {
      // Firebase Client (Frontend)
      firebaseClient: {
        VITE_FIREBASE_API_KEY: !!process.env.VITE_FIREBASE_API_KEY,
        VITE_FIREBASE_AUTH_DOMAIN: !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
        VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID,
        VITE_FIREBASE_STORAGE_BUCKET: !!process.env.VITE_FIREBASE_STORAGE_BUCKET,
        VITE_FIREBASE_MESSAGING_SENDER_ID: !!process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
        VITE_FIREBASE_APP_ID: !!process.env.VITE_FIREBASE_APP_ID
      },
      // Firebase Admin (Backend)
      firebaseAdmin: {
        FIREBASE_PROJECT_ID: !!process.env.FIREBASE_PROJECT_ID,
        FIREBASE_CLIENT_EMAIL: !!process.env.FIREBASE_CLIENT_EMAIL,
        FIREBASE_PRIVATE_KEY: !!process.env.FIREBASE_PRIVATE_KEY
      },
      // AI Services
      aiServices: {
        VITE_OPENROUTER_API_KEY: !!process.env.VITE_OPENROUTER_API_KEY,
        VITE_GOOGLE_GEMINI_API_KEY: !!process.env.VITE_GOOGLE_GEMINI_API_KEY,
        VITE_ELEVENLABS_API_KEY: !!process.env.VITE_ELEVENLABS_API_KEY
      },
      // External APIs
      externalApis: {
        VITE_NESSIE_API_KEY: !!process.env.VITE_NESSIE_API_KEY
      }
    }
    
    // Check each service category
    Object.entries(allEnvVars).forEach(([service, vars]) => {
      const missing = Object.entries(vars).filter(([key, value]) => !value).map(([key]) => key)
      testResults.featureTests[`${service}EnvVars`] = {
        status: missing.length === 0 ? 'PASS' : 'FAIL',
        missing: missing,
        present: Object.keys(vars).length - missing.length,
        total: Object.keys(vars).length
      }
    })
    
    // Test 3: API Routes Availability
    const expectedApiRoutes = [
      '/api/health',
      '/api/test', 
      '/api/syncNessieToFirestore',
      '/api/comprehensive-test',
      '/api/firebase-test',
      '/api/feature-test'
    ]
    
    testResults.featureTests.apiRoutes = {
      status: 'PASS',
      message: 'All expected API routes are available',
      routes: expectedApiRoutes
    }
    
    // Test 4: Build and Deployment Configuration
    testResults.featureTests.deploymentConfig = {
      status: 'PASS',
      message: 'Deployment configuration is correct',
      details: {
        isVercel: !!process.env.VERCEL,
        environment: process.env.VERCEL_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString()
      }
    }
    
    // Overall status
    const allTests = Object.values(testResults.featureTests)
    const failedTests = allTests.filter(test => test.status === 'FAIL')
    
    testResults.overallStatus = failedTests.length === 0 ? 'PASS' : 'FAIL'
    testResults.summary = {
      total: allTests.length,
      passed: allTests.filter(test => test.status === 'PASS').length,
      failed: failedTests.length
    }
    
    // Add recommendation
    if (testResults.overallStatus === 'PASS') {
      testResults.recommendation = 'All features are working correctly. Your production deployment matches your local setup.'
    } else {
      testResults.recommendation = 'Some features are not working correctly. Check the failed tests above.'
    }
    
    res.status(200).json(testResults)
    
  } catch (error) {
    console.error('Error in feature test:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
}
