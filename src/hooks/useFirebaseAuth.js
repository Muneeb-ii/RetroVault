// Firebase Authentication hook using official Firebase Web SDK (modular syntax)
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut } from "firebase/auth"
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"

export function useFirebaseAuth() {
  const auth = getAuth()
  const db = getFirestore()
  const provider = new GoogleAuthProvider()

  // Configure Google provider
  provider.setCustomParameters({
    prompt: 'select_account'
  })

  async function signUpEmail(email, password, displayName = '') {
    try {
      console.log('🔄 [AUTH] Starting email sign-up process...')
      console.log('📧 [AUTH] Email:', email)
      console.log('👤 [AUTH] Display Name:', displayName)
      
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      console.log('✅ [AUTH] Firebase account created successfully')
      console.log('🆔 [AUTH] User UID:', user.uid)
      console.log('📧 [AUTH] User Email:', user.email)
      
      // Update display name if provided
      if (displayName) {
        console.log('👤 [AUTH] Updating display name...')
        await user.updateProfile({ displayName })
        console.log('✅ [AUTH] Display name updated:', user.displayName)
      }
      
      console.log('✅ [AUTH] Email Sign-Up successful:', user.email)
      
      // Check if user document exists in Firestore
      console.log('🔍 [FIRESTORE] Checking for existing user document...')
      const userDoc = doc(db, "users", user.uid)
      const snap = await getDoc(userDoc)
      console.log('📄 [FIRESTORE] User document exists:', snap.exists())

      if (!snap.exists()) {
        console.log('🆕 [FIRESTORE] New user detected, creating basic Firestore document...')
        const userData = {
          email: user.email,
          name: user.displayName || user.email,
          createdAt: serverTimestamp(),
          dataSource: "Pending", // Mark as pending - will be seeded by dashboard
          balance: 0,
          accountInfo: {},
          needsSeeding: true // Flag to indicate data needs to be seeded
        }
        console.log('💾 [FIRESTORE] User data to store:', userData)
        
        await setDoc(userDoc, userData)
        console.log('✅ [FIRESTORE] User document created successfully')
        console.log('📝 [FIRESTORE] Data seeding will be handled by dashboard')
      } else {
        console.log('👤 [FIRESTORE] Existing user found, skipping data seeding')
        const existingData = snap.data()
        console.log('📊 [FIRESTORE] Existing user data:', existingData)
      }

      console.log('🎉 [AUTH] Email sign-up process completed successfully')
      return user
    } catch (error) {
      console.error('❌ [AUTH] Email sign-up error:', error)
      console.error('❌ [AUTH] Error code:', error.code)
      console.error('❌ [AUTH] Error message:', error.message)
      throw error
    }
  }

  async function loginEmail(email, password) {
    try {
      console.log('🔄 [AUTH] Starting email sign-in process...')
      console.log('📧 [AUTH] Email:', email)
      
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ [AUTH] Firebase authentication successful')
      console.log('🆔 [AUTH] User UID:', user.uid)
      console.log('📧 [AUTH] User Email:', user.email)
      console.log('👤 [AUTH] Display Name:', user.displayName)
      console.log('✅ [AUTH] Email Sign-In successful:', user.email)
      
      return user
    } catch (error) {
      console.error('❌ [AUTH] Email sign-in error:', error)
      console.error('❌ [AUTH] Error code:', error.code)
      console.error('❌ [AUTH] Error message:', error.message)
      throw error
    }
  }

  async function loginGoogle() {
    try {
      console.log('🔄 [AUTH] Starting Google sign-in process...')
      console.log('🔑 [AUTH] Google provider configured:', provider.providerId)
      
      const { user } = await signInWithPopup(auth, provider)
      console.log('✅ [AUTH] Google authentication successful')
      console.log('🆔 [AUTH] User UID:', user.uid)
      console.log('📧 [AUTH] User Email:', user.email)
      console.log('👤 [AUTH] Display Name:', user.displayName)
      console.log('🖼️ [AUTH] Photo URL:', user.photoURL)
      console.log('✅ [AUTH] Google Sign-In successful:', user.displayName)
      
      // Check if user document exists in Firestore
      console.log('🔍 [FIRESTORE] Checking for existing user document...')
      const userDoc = doc(db, "users", user.uid)
      const snap = await getDoc(userDoc)
      console.log('📄 [FIRESTORE] User document exists:', snap.exists())
      
      if (!snap.exists()) {
        console.log('🆕 [FIRESTORE] New user detected, creating basic Firestore document...')
        const userData = {
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          dataSource: "Pending", // Mark as pending - will be seeded by dashboard
          balance: 0,
          accountInfo: {},
          needsSeeding: true // Flag to indicate data needs to be seeded
        }
        console.log('💾 [FIRESTORE] User data to store:', userData)
        
        await setDoc(userDoc, userData)
        console.log('✅ [FIRESTORE] User document created successfully')
        console.log('📝 [FIRESTORE] Data seeding will be handled by dashboard')
      } else {
        console.log('👤 [FIRESTORE] Existing user found, skipping data seeding')
        const existingData = snap.data()
        console.log('📊 [FIRESTORE] Existing user data:', existingData)
      }
      
      console.log('🎉 [AUTH] Google sign-in process completed successfully')
      return user
    } catch (error) {
      console.error('❌ [AUTH] Google sign-in error:', error)
      console.error('❌ [AUTH] Error code:', error.code)
      console.error('❌ [AUTH] Error message:', error.message)
      throw error
    }
  }

  async function signOutUser() {
    try {
      console.log('🔄 [AUTH] Starting sign-out process...')
      const currentUser = auth.currentUser
      if (currentUser) {
        console.log('👤 [AUTH] Current user:', currentUser.email)
        console.log('🆔 [AUTH] Current user UID:', currentUser.uid)
      }
      
      await signOut(auth)
      console.log('✅ [AUTH] User signed out successfully')
      console.log('🎉 [AUTH] Sign-out process completed')
    } catch (error) {
      console.error('❌ [AUTH] Sign out error:', error)
      console.error('❌ [AUTH] Error code:', error.code)
      console.error('❌ [AUTH] Error message:', error.message)
      throw error
    }
  }

  return { 
    signUpEmail, 
    loginEmail, 
    loginGoogle, 
    signOutUser 
  }
}
