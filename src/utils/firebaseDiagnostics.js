// Firebase Diagnostics Utility
import { auth, db } from '../firebaseClient'

export const runFirebaseDiagnostics = () => {
  console.log('🔧 [DIAGNOSTICS] Starting Firebase diagnostics...')
  
  // Check Firebase configuration
  const config = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  }
  
  console.log('🔧 [DIAGNOSTICS] Environment variables check:', {
    VITE_FIREBASE_API_KEY: config.apiKey ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_AUTH_DOMAIN: config.authDomain ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_PROJECT_ID: config.projectId ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_STORAGE_BUCKET: config.storageBucket ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_MESSAGING_SENDER_ID: config.messagingSenderId ? '✅ Set' : '❌ Missing',
    VITE_FIREBASE_APP_ID: config.appId ? '✅ Set' : '❌ Missing'
  })
  
  console.log('🔧 [DIAGNOSTICS] Configuration values:', {
    projectId: config.projectId,
    authDomain: config.authDomain,
    apiKey: config.apiKey ? `${config.apiKey.substring(0, 10)}...` : 'undefined'
  })
  
  // Check Firebase instances
  console.log('🔧 [DIAGNOSTICS] Firebase instances:', {
    auth: auth ? '✅ Initialized' : '❌ Not initialized',
    db: db ? '✅ Initialized' : '❌ Not initialized'
  })
  
  if (auth) {
    console.log('🔧 [DIAGNOSTICS] Auth instance:', {
      app: auth.app.name,
      currentUser: auth.currentUser ? '✅ Logged in' : '❌ Not logged in'
    })
  }
  
  if (db) {
    console.log('🔧 [DIAGNOSTICS] Firestore instance:', {
      app: db.app.name,
      settings: db.settings
    })
  }
  
  // Check for common issues
  const issues = []
  
  if (!config.apiKey) issues.push('Missing VITE_FIREBASE_API_KEY')
  if (!config.authDomain) issues.push('Missing VITE_FIREBASE_AUTH_DOMAIN')
  if (!config.projectId) issues.push('Missing VITE_FIREBASE_PROJECT_ID')
  if (!config.storageBucket) issues.push('Missing VITE_FIREBASE_STORAGE_BUCKET')
  if (!config.messagingSenderId) issues.push('Missing VITE_FIREBASE_MESSAGING_SENDER_ID')
  if (!config.appId) issues.push('Missing VITE_FIREBASE_APP_ID')
  
  if (issues.length > 0) {
    console.error('❌ [DIAGNOSTICS] Configuration issues found:', issues)
  } else {
    console.log('✅ [DIAGNOSTICS] Firebase configuration looks good')
  }
  
  return {
    configValid: issues.length === 0,
    issues: issues,
    config: config
  }
}

// Auto-run diagnostics in development
if (import.meta.env.DEV) {
  runFirebaseDiagnostics()
}
