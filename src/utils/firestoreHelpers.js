// Firestore helper functions for RetroVault
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebaseClient'

/**
 * Get user document from Firestore
 * @param {string} uid - User ID
 * @returns {Promise<DocumentSnapshot | null>} User document or null
 */
export const getUserDoc = async (uid) => {
  try {
    const userDocRef = doc(db, 'users', uid)
    const userDoc = await getDoc(userDocRef)
    return userDoc.exists() ? userDoc : null
  } catch (error) {
    console.error('Error getting user document:', error)
    throw error
  }
}

/**
 * Create base user document in Firestore
 * @param {string} uid - User ID
 * @param {Object} profile - User profile data
 * @returns {Promise<void>}
 */
export const createUserDoc = async (uid, profile) => {
  try {
    const userDocRef = doc(db, 'users', uid)
    await setDoc(userDocRef, {
      name: profile.displayName || profile.name || 'User',
      email: profile.email || '',
      photoURL: profile.photoURL || '',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      dataSource: 'Manual', // Will be updated by backend sync
      balance: 0,
      accountInfo: {}
    })
    console.log('✅ Base user document created for:', uid)
  } catch (error) {
    console.error('Error creating user document:', error)
    throw error
  }
}

/**
 * Check if user has consistent data
 * @param {string} uid - User ID
 * @returns {Promise<boolean>} True if user has consistent data
 */
export const hasConsistentData = async (uid) => {
  try {
    const userDoc = await getUserDoc(uid)
    if (!userDoc) return false
    
    const userData = userDoc.data()
    return userData.dataConsistency?.isConsistent === true
  } catch (error) {
    console.error('Error checking consistent data:', error)
    return false
  }
}

/**
 * Get user's data source
 * @param {string} uid - User ID
 * @returns {Promise<string>} Data source ('Nessie', 'Sample', 'Mock', etc.)
 */
export const getUserDataSource = async (uid) => {
  try {
    const userDoc = await getUserDoc(uid)
    if (!userDoc) return 'None'
    
    const userData = userDoc.data()
    return userData.dataSource || 'Unknown'
  } catch (error) {
    console.error('Error getting user data source:', error)
    return 'Unknown'
  }
}
