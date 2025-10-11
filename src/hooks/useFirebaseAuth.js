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
      console.log('🔄 Creating account with email...')
      const { user } = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update display name if provided
      if (displayName) {
        await user.updateProfile({ displayName })
      }
      
      console.log('✅ Email Sign-Up successful:', user.email)
      
      // Check if user document exists in Firestore
      const userDoc = doc(db, "users", user.uid)
      const snap = await getDoc(userDoc)

      if (!snap.exists()) {
        console.log('🆕 New user detected, creating Firestore document...')
        await setDoc(userDoc, {
          email: user.email,
          name: user.displayName || user.email,
          createdAt: serverTimestamp(),
          dataSource: "Nessie",
          balance: 0,
          accountInfo: {}
        })
        
        // Seed with Nessie data for new users
        console.log('🌱 Seeding data from Nessie API...')
        await fetch("/api/syncNessieToFirestore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.uid,
            userInfo: {
              name: user.displayName || user.email,
              email: user.email
            }
          }),
        })
        console.log('✅ Nessie data seeded successfully')
      }

      return user
    } catch (error) {
      console.error('❌ Email sign-up error:', error)
      throw error
    }
  }

  async function loginEmail(email, password) {
    try {
      console.log('🔄 Signing in with email...')
      const { user } = await signInWithEmailAndPassword(auth, email, password)
      console.log('✅ Email Sign-In successful:', user.email)
      return user
    } catch (error) {
      console.error('❌ Email sign-in error:', error)
      throw error
    }
  }

  async function loginGoogle() {
    try {
      console.log('🔄 Signing in with Google...')
      const { user } = await signInWithPopup(auth, provider)
      console.log('✅ Google Sign-In successful:', user.displayName)
      
      // Check if user document exists in Firestore
      const userDoc = doc(db, "users", user.uid)
      const snap = await getDoc(userDoc)
      
      if (!snap.exists()) {
        console.log('🆕 New user detected, creating Firestore document...')
        await setDoc(userDoc, {
          email: user.email,
          name: user.displayName,
          photoURL: user.photoURL,
          createdAt: serverTimestamp(),
          dataSource: "Nessie",
          balance: 0,
          accountInfo: {}
        })
        
        // Seed with Nessie data for new users
        console.log('🌱 Seeding data from Nessie API...')
        await fetch("/api/syncNessieToFirestore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            userId: user.uid,
            userInfo: {
              name: user.displayName,
              email: user.email,
              photoURL: user.photoURL
            }
          }),
        })
        console.log('✅ Nessie data seeded successfully')
      } else {
        console.log('👤 Returning user found, skipping Nessie sync')
      }
      
      return user
    } catch (error) {
      console.error('❌ Google sign-in error:', error)
      throw error
    }
  }

  async function signOutUser() {
    try {
      console.log('🔄 Signing out...')
      await signOut(auth)
      console.log('✅ User signed out successfully')
    } catch (error) {
      console.error('❌ Sign out error:', error)
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
