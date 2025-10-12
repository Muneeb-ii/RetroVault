// Authentication test to verify Firebase auth configuration
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
      authTests: {}
    }
    
    // Test 1: Firebase Client Environment Variables
    const firebaseClientVars = {
      VITE_FIREBASE_API_KEY: !!process.env.VITE_FIREBASE_API_KEY,
      VITE_FIREBASE_AUTH_DOMAIN: !!process.env.VITE_FIREBASE_AUTH_DOMAIN,
      VITE_FIREBASE_PROJECT_ID: !!process.env.VITE_FIREBASE_PROJECT_ID,
      VITE_FIREBASE_STORAGE_BUCKET: !!process.env.VITE_FIREBASE_STORAGE_BUCKET,
      VITE_FIREBASE_MESSAGING_SENDER_ID: !!process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      VITE_FIREBASE_APP_ID: !!process.env.VITE_FIREBASE_APP_ID
    }
    
    const missingClientVars = Object.entries(firebaseClientVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key)
    
    testResults.authTests.firebaseClientConfig = {
      status: missingClientVars.length === 0 ? 'PASS' : 'FAIL',
      missing: missingClientVars,
      present: Object.keys(firebaseClientVars).length - missingClientVars.length,
      total: Object.keys(firebaseClientVars).length
    }
    
    // Test 2: Domain Configuration Check
    const currentDomain = req.headers.host || 'unknown'
    const expectedDomains = [
      'retro-vault.vercel.app',
      'retro-vault-git-main-muneeb-azfar-nafees-projects.vercel.app',
      'retro-vault-hash-muneeb-azfar-nafees-projects.vercel.app'
    ]
    
    testResults.authTests.domainConfiguration = {
      status: 'INFO',
      message: 'Domain configuration check',
      currentDomain: currentDomain,
      expectedDomains: expectedDomains,
      isVercelDomain: currentDomain.includes('vercel.app'),
      recommendation: 'Add all Vercel domains to Firebase authorized domains'
    }
    
    // Test 3: Firebase Project Configuration
    testResults.authTests.firebaseProjectConfig = {
      status: 'INFO',
      message: 'Firebase project configuration',
      projectId: process.env.VITE_FIREBASE_PROJECT_ID,
      authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
      recommendation: 'Verify these match your Firebase console settings'
    }
    
    // Test 4: Authentication Provider Check
    testResults.authTests.authProvider = {
      status: 'INFO',
      message: 'Authentication provider configuration',
      googleProvider: 'Google Auth Provider is configured',
      recommendation: 'Ensure Google Sign-In is enabled in Firebase Console'
    }
    
    // Overall status
    const allTests = Object.values(testResults.authTests)
    const failedTests = allTests.filter(test => test.status === 'FAIL')
    
    testResults.overallStatus = failedTests.length === 0 ? 'PASS' : 'FAIL'
    testResults.summary = {
      total: allTests.length,
      passed: allTests.filter(test => test.status === 'PASS').length,
      failed: failedTests.length,
      info: allTests.filter(test => test.status === 'INFO').length
    }
    
    // Add specific instructions for fixing the unauthorized domain error
    testResults.fixInstructions = {
      error: 'auth/unauthorized-domain',
      solution: 'Add Vercel domains to Firebase authorized domains',
      steps: [
        '1. Go to Firebase Console (https://console.firebase.google.com)',
        '2. Select your project',
        '3. Go to Authentication > Settings > Authorized domains',
        '4. Add: retro-vault.vercel.app',
        '5. Add: *.vercel.app (for preview deployments)',
        '6. Save changes'
      ],
      domainsToAdd: [
        'retro-vault.vercel.app',
        '*.vercel.app'
      ]
    }
    
    res.status(200).json(testResults)
    
  } catch (error) {
    console.error('Error in auth test:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    })
  }
}
