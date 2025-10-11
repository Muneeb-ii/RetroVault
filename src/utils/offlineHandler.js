// Offline Handler for Firebase Firestore
import { enableNetwork, disableNetwork } from 'firebase/firestore'
import { db } from '../firebaseClient'

export const handleOfflineError = async (error) => {
  console.log('🔄 [OFFLINE] Handling offline error...')
  
  if (error.code === 'unavailable') {
    console.log('🔧 [OFFLINE] Attempting to reconnect to Firestore...')
    
    try {
      // Try to enable network
      await enableNetwork(db)
      console.log('✅ [OFFLINE] Network re-enabled successfully')
      
      // Wait a moment for connection to stabilize
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      return { success: true, message: 'Reconnected to Firestore' }
    } catch (reconnectError) {
      console.error('❌ [OFFLINE] Failed to reconnect:', reconnectError)
      return { 
        success: false, 
        message: 'Unable to reconnect to Firestore',
        error: reconnectError.message
      }
    }
  }
  
  return { success: false, message: 'Not an offline error' }
}

export const checkFirestoreConnection = async () => {
  try {
    console.log('🔧 [CONNECTION] Checking Firestore connection...')
    
    // Try to enable network
    await enableNetwork(db)
    console.log('✅ [CONNECTION] Firestore connection is active')
    return true
  } catch (error) {
    console.error('❌ [CONNECTION] Firestore connection failed:', error)
    return false
  }
}
