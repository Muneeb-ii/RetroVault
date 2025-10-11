// Comprehensive Firebase Connection Diagnostics
import { auth, db } from '../firebaseClient'
import { doc, getDoc, enableNetwork, disableNetwork } from 'firebase/firestore'

export const runConnectionDiagnostics = async () => {
  console.log('🔧 [DIAGNOSTICS] Starting comprehensive connection diagnostics...')
  
  // 1. Check environment variables
  const envCheck = {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    VITE_FIREBASE_STORAGE_BUCKET: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    VITE_FIREBASE_MESSAGING_SENDER_ID: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    VITE_FIREBASE_APP_ID: import.meta.env.VITE_FIREBASE_APP_ID
  }
  
  console.log('🔧 [DIAGNOSTICS] Environment variables:', envCheck)
  
  const missingVars = Object.entries(envCheck)
    .filter(([key, value]) => !value)
    .map(([key]) => key)
  
  if (missingVars.length > 0) {
    console.error('❌ [DIAGNOSTICS] Missing environment variables:', missingVars)
    return { success: false, issue: 'Missing environment variables', missingVars }
  }
  
  // 2. Check Firebase app initialization
  console.log('🔧 [DIAGNOSTICS] Firebase app:', {
    name: db.app.name,
    options: db.app.options,
    isDeleted: db.app.isDeleted
  })
  
  // 3. Check Firestore settings
  console.log('🔧 [DIAGNOSTICS] Firestore settings:', db.settings)
  
  // 4. Test network connectivity
  try {
    console.log('🔧 [DIAGNOSTICS] Testing network connectivity...')
    
    // Test basic internet connectivity
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      mode: 'no-cors'
    })
    console.log('✅ [DIAGNOSTICS] Basic internet connectivity: OK')
  } catch (error) {
    console.error('❌ [DIAGNOSTICS] Basic internet connectivity failed:', error)
    return { success: false, issue: 'No internet connectivity' }
  }
  
  // 5. Test Firebase connectivity
  try {
    console.log('🔧 [DIAGNOSTICS] Testing Firebase connectivity...')
    
    // Test Firebase Auth connectivity
    const authResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${envCheck.VITE_FIREBASE_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true })
    })
    
    console.log('🔧 [DIAGNOSTICS] Firebase Auth endpoint status:', authResponse.status)
    
    // Test Firestore connectivity
    const firestoreResponse = await fetch(`https://firestore.googleapis.com/v1/projects/${envCheck.VITE_FIREBASE_PROJECT_ID}/databases/(default)/documents`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${auth.currentUser?.accessToken || 'test'}` }
    })
    
    console.log('🔧 [DIAGNOSTICS] Firestore endpoint status:', firestoreResponse.status)
    
  } catch (error) {
    console.error('❌ [DIAGNOSTICS] Firebase connectivity test failed:', error)
  }
  
  // 6. Test Firestore connection
  try {
    console.log('🔧 [DIAGNOSTICS] Testing Firestore connection...')
    
    // Enable network explicitly
    await enableNetwork(db)
    console.log('✅ [DIAGNOSTICS] Firestore network enabled')
    
    // Test a simple document read
    const testDoc = doc(db, 'test', 'connection')
    const testSnapshot = await getDoc(testDoc)
    console.log('✅ [DIAGNOSTICS] Firestore connection test successful')
    console.log('📄 [DIAGNOSTICS] Test document exists:', testSnapshot.exists())
    
    return { success: true, message: 'All diagnostics passed' }
    
  } catch (error) {
    console.error('❌ [DIAGNOSTICS] Firestore connection test failed:', error)
    console.error('❌ [DIAGNOSTICS] Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    })
    
    // Try to identify the specific issue
    if (error.code === 'unavailable') {
      return { 
        success: false, 
        issue: 'Firestore offline - check network connectivity or Firebase project status',
        error: error.message
      }
    } else if (error.code === 'permission-denied') {
      return { 
        success: false, 
        issue: 'Permission denied - check Firestore security rules',
        error: error.message
      }
    } else if (error.code === 'not-found') {
      return { 
        success: false, 
        issue: 'Project not found - check Firebase project ID',
        error: error.message
      }
    } else {
      return { 
        success: false, 
        issue: 'Unknown Firestore error',
        error: error.message
      }
    }
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  runConnectionDiagnostics()
}
