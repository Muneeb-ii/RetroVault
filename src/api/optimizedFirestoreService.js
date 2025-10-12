// Firestore Service for RetroVault
// Streamlined database structure for better performance and form integration

import { db } from '../firebaseClient'
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  writeBatch,
  serverTimestamp,
  increment
} from 'firebase/firestore'

// Collection references for the streamlined structure
export const usersCollection = () => collection(db, 'users')
export const accountsCollection = () => collection(db, 'accounts')
export const transactionsCollection = () => collection(db, 'transactions')
export const categoriesCollection = () => collection(db, 'categories')
export const budgetsCollection = () => collection(db, 'budgets')
export const goalsCollection = () => collection(db, 'goals')

/**
 * User Management Functions
 */

export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(usersCollection(), userId)
    const userProfile = {
      profile: {
        name: userData.name || 'User',
        email: userData.email || '',
        photoURL: userData.photoURL || null,
        createdAt: serverTimestamp()
      },
      financialSummary: {
        totalBalance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        lastUpdated: serverTimestamp()
      },
      dataSource: userData.dataSource || 'Firestore',
      syncStatus: {
        lastSync: serverTimestamp(),
        isConsistent: true,
        needsRefresh: false
      },
      preferences: {
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        categories: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other']
      }
    }
    
    await setDoc(userRef, userProfile)
    console.log(`✅ Created user profile for ${userId}`)
    return userProfile
  } catch (error) {
    console.error('❌ Error creating user profile:', error)
    throw error
  }
}

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(usersCollection(), userId)
    const userDoc = await getDoc(userRef)
    
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() }
    }
    return null
  } catch (error) {
    console.error('❌ Error getting user profile:', error)
    throw error
  }
}

export const updateUserFinancialSummary = async (userId, summaryData) => {
  try {
    const userRef = doc(usersCollection(), userId)
    await updateDoc(userRef, {
      'financialSummary.totalBalance': summaryData.totalBalance || 0,
      'financialSummary.totalIncome': summaryData.totalIncome || 0,
      'financialSummary.totalExpenses': summaryData.totalExpenses || 0,
      'financialSummary.totalSavings': summaryData.totalSavings || 0,
      'financialSummary.lastUpdated': serverTimestamp()
    })
    console.log(`✅ Updated financial summary for ${userId}`)
  } catch (error) {
    console.error('❌ Error updating financial summary:', error)
    throw error
  }
}

/**
 * Account Management Functions
 */

export const createAccount = async (accountData) => {
  try {
    const accountRef = doc(accountsCollection())
    const account = {
      userId: accountData.userId,
      nessieId: accountData.nessieId || null,
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance || 0,
      isActive: true,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      metadata: {
        institution: accountData.institution || 'Unknown',
        accountNumber: accountData.accountNumber || null,
        routingNumber: accountData.routingNumber || null
      }
    }
    
    await setDoc(accountRef, account)
    console.log(`✅ Created account: ${account.name}`)
    return { id: accountRef.id, ...account }
  } catch (error) {
    console.error('❌ Error creating account:', error)
    throw error
  }
}

export const getUserAccounts = async (userId) => {
  try {
    const q = query(
      accountsCollection(),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('❌ Error getting user accounts:', error)
    throw error
  }
}

export const updateAccountBalance = async (accountId, newBalance) => {
  try {
    const accountRef = doc(accountsCollection(), accountId)
    await updateDoc(accountRef, {
      balance: newBalance,
      lastUpdated: serverTimestamp()
    })
    console.log(`✅ Updated account balance for ${accountId}`)
  } catch (error) {
    console.error('❌ Error updating account balance:', error)
    throw error
  }
}

/**
 * Transaction Management Functions
 */

export const createTransaction = async (transactionData) => {
  try {
    const transactionRef = doc(transactionsCollection())
    const transaction = {
      userId: transactionData.userId,
      accountId: transactionData.accountId,
      nessieId: transactionData.nessieId || null,
      amount: transactionData.amount,
      type: transactionData.type,
      category: transactionData.category,
      subcategory: transactionData.subcategory || null,
      description: transactionData.description,
      merchant: transactionData.merchant || null,
      date: transactionData.date,
      createdAt: serverTimestamp(),
      isRecurring: transactionData.isRecurring || false,
      tags: transactionData.tags || [],
      metadata: {
        location: transactionData.location || null,
        paymentMethod: transactionData.paymentMethod || null,
        notes: transactionData.notes || null
      }
    }
    
    await setDoc(transactionRef, transaction)
    console.log(`✅ Created transaction: ${transaction.description}`)
    return { id: transactionRef.id, ...transaction }
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    throw error
  }
}

export const getUserTransactions = async (userId, options = {}) => {
  try {
    const { limitCount = 100, startAfter = null, category = null, type = null } = options
    
    let q = query(
      transactionsCollection(),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(limitCount)
    )
    
    if (category) {
      q = query(q, where('category', '==', category))
    }
    
    if (type) {
      q = query(q, where('type', '==', type))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('❌ Error getting user transactions:', error)
    throw error
  }
}

export const updateTransaction = async (transactionId, updateData) => {
  try {
    const transactionRef = doc(transactionsCollection(), transactionId)
    await updateDoc(transactionRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    })
    console.log(`✅ Updated transaction ${transactionId}`)
  } catch (error) {
    console.error('❌ Error updating transaction:', error)
    throw error
  }
}

export const deleteTransaction = async (transactionId) => {
  try {
    const transactionRef = doc(transactionsCollection(), transactionId)
    await deleteDoc(transactionRef)
    console.log(`✅ Deleted transaction ${transactionId}`)
  } catch (error) {
    console.error('❌ Error deleting transaction:', error)
    throw error
  }
}

/**
 * Batch Operations for Better Performance
 */

export const batchCreateTransactions = async (transactions) => {
  try {
    const batch = writeBatch(db)
    
    transactions.forEach(transactionData => {
      const transactionRef = doc(transactionsCollection())
      const transaction = {
        ...transactionData,
        createdAt: serverTimestamp()
      }
      batch.set(transactionRef, transaction)
    })
    
    await batch.commit()
    console.log(`✅ Batch created ${transactions.length} transactions`)
  } catch (error) {
    console.error('❌ Error batch creating transactions:', error)
    throw error
  }
}

export const batchUpdateFinancialSummary = async (userId, transactions) => {
  try {
    // Calculate aggregates
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount
      } else {
        acc.totalExpenses += transaction.amount
      }
      return acc
    }, { totalIncome: 0, totalExpenses: 0 })
    
    summary.totalSavings = summary.totalIncome - summary.totalExpenses
    summary.totalBalance = summary.totalSavings // Simplified for now
    
    await updateUserFinancialSummary(userId, summary)
    console.log(`✅ Updated financial summary with ${transactions.length} transactions`)
  } catch (error) {
    console.error('❌ Error batch updating financial summary:', error)
    throw error
  }
}

/**
 * Category Management Functions
 */

export const getDefaultCategories = async () => {
  try {
    const q = query(
      categoriesCollection(),
      where('isDefault', '==', true),
      orderBy('name', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  } catch (error) {
    console.error('❌ Error getting default categories:', error)
    throw error
  }
}

export const createCategory = async (categoryData) => {
  try {
    const categoryRef = doc(categoriesCollection())
    const category = {
      name: categoryData.name,
      type: categoryData.type,
      color: categoryData.color,
      icon: categoryData.icon,
      isDefault: categoryData.isDefault || false,
      subcategories: categoryData.subcategories || [],
      rules: {
        keywords: categoryData.keywords || [],
        autoAssign: categoryData.autoAssign || false,
        priority: categoryData.priority || 0
      }
    }
    
    await setDoc(categoryRef, category)
    console.log(`✅ Created category: ${category.name}`)
    return { id: categoryRef.id, ...category }
  } catch (error) {
    console.error('❌ Error creating category:', error)
    throw error
  }
}

/**
 * Data Migration Functions
 */

export const migrateUserData = async (userId, oldUserData) => {
  try {
    console.log(`🔄 Migrating data for user ${userId}`)
    
    // Create new user profile
    await createUserProfile(userId, {
      name: oldUserData.name,
      email: oldUserData.email,
      dataSource: oldUserData.dataSource || 'Migration'
    })
    
    // Migrate accounts if they exist
    if (oldUserData.accounts) {
      for (const account of oldUserData.accounts) {
        await createAccount({
          userId: userId,
          nessieId: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance,
          institution: 'Migrated Account'
        })
      }
    }
    
    console.log(`✅ Migration completed for user ${userId}`)
  } catch (error) {
    console.error('❌ Error migrating user data:', error)
    throw error
  }
}

/**
 * Form Integration Helpers
 */

export const getFormData = async (userId, formType) => {
  try {
    switch (formType) {
      case 'transaction':
        const [accounts, categories] = await Promise.all([
          getUserAccounts(userId),
          getDefaultCategories()
        ])
        return { accounts, categories }
      
      case 'account':
        return { categories: await getDefaultCategories() }
      
      default:
        return {}
    }
  } catch (error) {
    console.error('❌ Error getting form data:', error)
    throw error
  }
}

export const validateTransactionForm = (formData) => {
  const errors = []
  
  if (!formData.description?.trim()) {
    errors.push('Description is required')
  }
  
  if (!formData.amount || formData.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }
  
  if (!formData.date) {
    errors.push('Date is required')
  }
  
  if (!formData.category) {
    errors.push('Category is required')
  }
  
  if (!formData.type || !['income', 'expense', 'transfer'].includes(formData.type)) {
    errors.push('Type must be income, expense, or transfer')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export const validateAccountForm = (formData) => {
  const errors = []
  
  if (!formData.name?.trim()) {
    errors.push('Account name is required')
  }
  
  if (!formData.type) {
    errors.push('Account type is required')
  }
  
  if (formData.balance === undefined || formData.balance < 0) {
    errors.push('Balance must be 0 or greater')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
