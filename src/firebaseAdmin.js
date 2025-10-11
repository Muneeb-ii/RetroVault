// Firebase Admin SDK Configuration
import admin from 'firebase-admin'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    // First, try to use service account key file (for development)
    try {
      const serviceAccountPath = join(__dirname, '../serviceAccountKey.json')
      const serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf8'))
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: serviceAccount.project_id
      })
      console.log('✅ Firebase Admin initialized with serviceAccountKey.json')
    } catch (jsonError) {
      console.log('⚠️ Could not load serviceAccountKey.json, trying environment variables...')
      
      // If JSON file not found, fall back to environment variables (for production)
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
        throw new Error('No Firebase credentials found. Either provide serviceAccountKey.json or set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.')
      }
    }
  } catch (error) {
    console.error('❌ Error initializing Firebase Admin:', error)
    throw error
  }
}

export const db = admin.firestore()
export const auth = admin.auth()

// Firestore collection references
export const usersCollection = () => db.collection('users')
export const accountsCollection = (userId) => db.collection(`users/${userId}/accounts`)
export const transactionsCollection = (userId) => db.collection(`users/${userId}/transactions`)
export const sampleProfilesCollection = () => db.collection('sampleProfiles')

// Helper functions for Firestore operations
export const createUserDocument = async (userId, userData) => {
  try {
    const userRef = usersCollection().doc(userId)
    await userRef.set({
      ...userData,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`Created user document for ${userId}`)
    return userRef
  } catch (error) {
    console.error('Error creating user document:', error)
    throw error
  }
}

export const updateUserLastSync = async (userId) => {
  try {
    const userRef = usersCollection().doc(userId)
    await userRef.update({
      lastSync: admin.firestore.FieldValue.serverTimestamp(),
    })
    console.log(`Updated lastSync for user ${userId}`)
  } catch (error) {
    console.error('Error updating lastSync:', error)
    throw error
  }
}

export const getUserData = async (userId) => {
  try {
    const userDoc = await usersCollection().doc(userId).get()
    if (userDoc.exists) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('Error getting user data:', error)
    throw error
  }
}

export const getSampleProfile = async () => {
  try {
    const sampleProfiles = await sampleProfilesCollection().get()
    if (sampleProfiles.empty) {
      return null
    }
    
    // Get a random sample profile
    const profiles = sampleProfiles.docs
    const randomIndex = Math.floor(Math.random() * profiles.length)
    return { id: profiles[randomIndex].id, ...profiles[randomIndex].data() }
  } catch (error) {
    console.error('Error getting sample profile:', error)
    throw error
  }
}
