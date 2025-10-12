// Unified Firestore Service for RetroVault
// Comprehensive data management with consistent structure and optimal performance

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
  increment,
  onSnapshot,
  startAfter,
  endBefore
} from 'firebase/firestore'

// ============================================================================
// COLLECTION REFERENCES - Unified Flat Structure
// ============================================================================

export const collections = {
  users: () => collection(db, 'users'),
  accounts: () => collection(db, 'accounts'),
  transactions: () => collection(db, 'transactions'),
  budgets: () => collection(db, 'budgets'),
  goals: () => collection(db, 'goals'),
  categories: () => collection(db, 'categories'),
  reports: () => collection(db, 'reports')
}

// ============================================================================
// USER MANAGEMENT - Centralized Profile & Financial Summary
// ============================================================================

/**
 * Create or update user profile with comprehensive financial data
 */
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(collections.users(), userId)
    
    const userProfile = {
      // Core profile data
      profile: {
        name: userData.name || 'User',
        email: userData.email || '',
        photoURL: userData.photoURL || null,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp()
      },
      
      // Financial summary (denormalized for performance)
      financialSummary: {
        totalBalance: userData.balance || 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        lastUpdated: serverTimestamp()
      },
      
      // Data source and consistency tracking
      dataSource: userData.dataSource || 'Manual',
      syncStatus: {
        lastSync: serverTimestamp(),
        isConsistent: true,
        needsRefresh: false,
        version: 1
      },
      
      // User preferences and settings
      preferences: {
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        categories: [
          'Food', 'Transport', 'Entertainment', 'Shopping', 
          'Bills', 'Healthcare', 'Education', 'Travel', 'Other'
        ],
        notifications: {
          budgetAlerts: true,
          goalReminders: true,
          weeklyReports: true
        }
      },
      
      // Metadata for data integrity
      metadata: {
        accountsCount: 0,
        transactionsCount: 0,
        lastDataUpdate: serverTimestamp(),
        dataVersion: '2.0'
      }
    }
    
    await setDoc(userRef, userProfile)
    console.log(`✅ Created unified user profile for ${userId}`)
    return userProfile
    
  } catch (error) {
    console.error('❌ Error creating user profile:', error)
    throw error
  }
}

/**
 * Get user profile with financial summary
 */
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(collections.users(), userId)
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

/**
 * Update financial summary based on transactions
 */
export const updateFinancialSummary = async (userId) => {
  try {
    // Get all transactions for the user
    const transactions = await getUserTransactions(userId, { limit: 1000 })
    
    // Calculate financial summary - handle all transaction types
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income' || transaction.type === 'deposit') {
        acc.totalIncome += Math.abs(Number(transaction.amount) || 0)
      } else if (transaction.type === 'expense' || transaction.type === 'withdrawal') {
        acc.totalExpenses += Math.abs(Number(transaction.amount) || 0)
      }
      return acc
    }, { totalIncome: 0, totalExpenses: 0 })
    
    summary.totalSavings = summary.totalIncome - summary.totalExpenses
    summary.totalBalance = summary.totalSavings // Simplified for now
    
    // Update user document
    const userRef = doc(collections.users(), userId)
    await updateDoc(userRef, {
      'financialSummary.totalIncome': summary.totalIncome,
      'financialSummary.totalExpenses': summary.totalExpenses,
      'financialSummary.totalSavings': summary.totalSavings,
      'financialSummary.totalBalance': summary.totalBalance,
      'financialSummary.lastUpdated': serverTimestamp(),
      'metadata.lastDataUpdate': serverTimestamp()
    })
    
    console.log(`✅ Updated financial summary for ${userId}`)
    return summary
    
  } catch (error) {
    console.error('❌ Error updating financial summary:', error)
    throw error
  }
}

// ============================================================================
// ACCOUNT MANAGEMENT - Unified Account Structure
// ============================================================================

/**
 * Create account with consistent structure
 */
export const createAccount = async (accountData) => {
  try {
    const accountRef = doc(collections.accounts())
    
    const account = {
      userId: accountData.userId,
      nessieId: accountData.nessieId || null,
      
      // Account details
      name: accountData.name,
      type: accountData.type,
      balance: accountData.balance || 0,
      isActive: true,
      
      // Institution information
      institution: accountData.institution || 'Unknown',
      accountNumber: accountData.accountNumber || null,
      routingNumber: accountData.routingNumber || null,
      
      // Timestamps
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      
      // Metadata
      metadata: {
        syncSource: accountData.syncSource || 'manual',
        lastSync: serverTimestamp()
      }
    }
    
    await setDoc(accountRef, account)
    
    // Update user's account count
    await updateUserAccountCount(accountData.userId)
    
    console.log(`✅ Created account: ${account.name}`)
    return { id: accountRef.id, ...account }
    
  } catch (error) {
    console.error('❌ Error creating account:', error)
    throw error
  }
}

/**
 * Get user accounts with filtering
 */
export const getUserAccounts = async (userId, options = {}) => {
  try {
    const { activeOnly = true, limitCount = 50 } = options
    
    let q = query(
      collections.accounts(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    
    if (activeOnly) {
      q = query(q, where('isActive', '==', true))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
  } catch (error) {
    console.error('❌ Error getting user accounts:', error)
    throw error
  }
}

/**
 * Update account balance and metadata
 */
export const updateAccountBalance = async (accountId, newBalance) => {
  try {
    const accountRef = doc(collections.accounts(), accountId)
    await updateDoc(accountRef, {
      balance: newBalance,
      lastUpdated: serverTimestamp(),
      'metadata.lastSync': serverTimestamp()
    })
    
    console.log(`✅ Updated account balance for ${accountId}`)
  } catch (error) {
    console.error('❌ Error updating account balance:', error)
    throw error
  }
}

// ============================================================================
// TRANSACTION MANAGEMENT - Optimized Transaction Structure
// ============================================================================

/**
 * Create transaction with comprehensive data
 */
export const createTransaction = async (transactionData) => {
  try {
    const transactionRef = doc(collections.transactions())
    
    const transaction = {
      userId: transactionData.userId,
      accountId: transactionData.accountId,
      nessieId: transactionData.nessieId || null,
      
      // Core transaction data
      amount: transactionData.amount,
      type: transactionData.type, // 'income', 'expense', 'transfer'
      category: transactionData.category,
      subcategory: transactionData.subcategory || null,
      
      // Transaction details
      description: transactionData.description,
      merchant: transactionData.merchant || null,
      date: transactionData.date,
      
      // Metadata
      isRecurring: transactionData.isRecurring || false,
      tags: transactionData.tags || [],
      metadata: {
        location: transactionData.location || null,
        paymentMethod: transactionData.paymentMethod || null,
        notes: transactionData.notes || null,
        syncSource: transactionData.syncSource || 'manual'
      },
      
      // Timestamps
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    }
    
    await setDoc(transactionRef, transaction)
    
    // Update financial summary
    await updateFinancialSummary(transactionData.userId)
    
    // Update transaction count
    await updateUserTransactionCount(transactionData.userId)
    
    console.log(`✅ Created transaction: ${transaction.description}`)
    return { id: transactionRef.id, ...transaction }
    
  } catch (error) {
    console.error('❌ Error creating transaction:', error)
    throw error
  }
}

/**
 * Get user transactions with advanced filtering
 */
export const getUserTransactions = async (userId, options = {}) => {
  try {
    const { 
      limitCount = 100, 
      startAfter = null, 
      category = null, 
      type = null,
      dateFrom = null,
      dateTo = null
    } = options
    
    // Validate limit to prevent excessive queries
    const safeLimit = Math.min(limitCount, 1000)
    
    let q = query(
      collections.transactions(),
      where('userId', '==', userId),
      orderBy('date', 'desc'),
      limit(safeLimit)
    )
    
    // Apply filters
    if (category) {
      q = query(q, where('category', '==', category))
    }
    
    if (type) {
      q = query(q, where('type', '==', type))
    }
    
    if (dateFrom) {
      q = query(q, where('date', '>=', dateFrom))
    }
    
    if (dateTo) {
      q = query(q, where('date', '<=', dateTo))
    }
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
  } catch (error) {
    console.error('❌ Error getting user transactions:', error)
    throw error
  }
}

/**
 * Update transaction
 */
export const updateTransaction = async (transactionId, updateData) => {
  try {
    const transactionRef = doc(collections.transactions(), transactionId)
    await updateDoc(transactionRef, {
      ...updateData,
      lastUpdated: serverTimestamp()
    })
    
    // Update financial summary if amount or type changed
    if (updateData.amount !== undefined || updateData.type !== undefined) {
      const transaction = await getDoc(transactionRef)
      if (transaction.exists()) {
        await updateFinancialSummary(transaction.data().userId)
      }
    }
    
    console.log(`✅ Updated transaction ${transactionId}`)
  } catch (error) {
    console.error('❌ Error updating transaction:', error)
    throw error
  }
}

/**
 * Delete transaction
 */
export const deleteTransaction = async (transactionId) => {
  try {
    const transactionRef = doc(collections.transactions(), transactionId)
    const transaction = await getDoc(transactionRef)
    
    if (transaction.exists()) {
      const userId = transaction.data().userId
      await deleteDoc(transactionRef)
      
      // Update financial summary
      await updateFinancialSummary(userId)
      await updateUserTransactionCount(userId)
    }
    
    console.log(`✅ Deleted transaction ${transactionId}`)
  } catch (error) {
    console.error('❌ Error deleting transaction:', error)
    throw error
  }
}

// ============================================================================
// BUDGET MANAGEMENT - Category-based Budgeting
// ============================================================================

/**
 * Create or update budget
 */
export const createBudget = async (budgetData) => {
  try {
    const budgetRef = doc(collections.budgets())
    
    const budget = {
      userId: budgetData.userId,
      category: budgetData.category,
      amount: budgetData.amount,
      period: budgetData.period || 'monthly', // 'weekly', 'monthly', 'yearly'
      isActive: true,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    }
    
    await setDoc(budgetRef, budget)
    console.log(`✅ Created budget for ${budgetData.category}`)
    return { id: budgetRef.id, ...budget }
    
  } catch (error) {
    console.error('❌ Error creating budget:', error)
    throw error
  }
}

/**
 * Get user budgets
 */
export const getUserBudgets = async (userId) => {
  try {
    const q = query(
      collections.budgets(),
      where('userId', '==', userId),
      orderBy('category', 'asc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
  } catch (error) {
    console.error('❌ Error getting user budgets:', error)
    throw error
  }
}

/**
 * Update budget
 */
export const updateBudget = async (budgetId, budgetData) => {
  try {
    const budgetRef = doc(collections.budgets(), budgetId)
    
    const updatedBudget = {
      ...budgetData,
      lastUpdated: serverTimestamp()
    }
    
    await updateDoc(budgetRef, updatedBudget)
    console.log(`✅ Updated budget: ${budgetId}`)
    return { id: budgetId, ...updatedBudget }
    
  } catch (error) {
    console.error('❌ Error updating budget:', error)
    throw error
  }
}

/**
 * Delete budget
 */
export const deleteBudget = async (budgetId) => {
  try {
    const budgetRef = doc(collections.budgets(), budgetId)
    await deleteDoc(budgetRef)
    console.log(`✅ Deleted budget: ${budgetId}`)
    
  } catch (error) {
    console.error('❌ Error deleting budget:', error)
    throw error
  }
}

// ============================================================================
// GOAL MANAGEMENT - Financial Goals and Targets
// ============================================================================

/**
 * Create financial goal
 */
export const createGoal = async (goalData) => {
  try {
    const goalRef = doc(collections.goals())
    
    const goal = {
      userId: goalData.userId,
      title: goalData.title,
      description: goalData.description || '',
      targetAmount: goalData.targetAmount,
      currentAmount: goalData.currentAmount || 0,
      targetDate: goalData.targetDate,
      category: goalData.category || 'Savings',
      priority: goalData.priority || 'Medium',
      isCompleted: false,
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp()
    }
    
    await setDoc(goalRef, goal)
    console.log(`✅ Created goal: ${goal.title}`)
    return { id: goalRef.id, ...goal }
    
  } catch (error) {
    console.error('❌ Error creating goal:', error)
    throw error
  }
}

/**
 * Get user goals
 */
export const getUserGoals = async (userId) => {
  try {
    const q = query(
      collections.goals(),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    )
    
    const querySnapshot = await getDocs(q)
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    
  } catch (error) {
    console.error('❌ Error getting user goals:', error)
    throw error
  }
}

/**
 * Update goal
 */
export const updateGoal = async (goalId, goalData) => {
  try {
    const goalRef = doc(collections.goals(), goalId)
    
    const updatedGoal = {
      ...goalData,
      lastUpdated: serverTimestamp()
    }
    
    await updateDoc(goalRef, updatedGoal)
    console.log(`✅ Updated goal: ${goalId}`)
    return { id: goalId, ...updatedGoal }
    
  } catch (error) {
    console.error('❌ Error updating goal:', error)
    throw error
  }
}

/**
 * Delete goal
 */
export const deleteGoal = async (goalId) => {
  try {
    const goalRef = doc(collections.goals(), goalId)
    await deleteDoc(goalRef)
    console.log(`✅ Deleted goal: ${goalId}`)
    
  } catch (error) {
    console.error('❌ Error deleting goal:', error)
    throw error
  }
}

// ============================================================================
// BATCH OPERATIONS - Performance Optimization
// ============================================================================

/**
 * Batch create transactions
 */
export const batchCreateTransactions = async (transactions) => {
  try {
    const batch = writeBatch(db)
    
    transactions.forEach(transactionData => {
      const transactionRef = doc(collections.transactions())
      const transaction = {
        ...transactionData,
        createdAt: serverTimestamp()
      }
      batch.set(transactionRef, transaction)
    })
    
    await batch.commit()
    console.log(`✅ Batch created ${transactions.length} transactions`)
    
    // Update financial summary for the user
    if (transactions.length > 0) {
      await updateFinancialSummary(transactions[0].userId)
    }
    
  } catch (error) {
    console.error('❌ Error batch creating transactions:', error)
    throw error
  }
}

/**
 * Batch update financial summary
 */
export const batchUpdateFinancialSummary = async (userId, transactions) => {
  try {
    const summary = transactions.reduce((acc, transaction) => {
      if (transaction.type === 'income' || transaction.type === 'deposit') {
        acc.totalIncome += Math.abs(Number(transaction.amount) || 0)
      } else if (transaction.type === 'expense' || transaction.type === 'withdrawal') {
        acc.totalExpenses += Math.abs(Number(transaction.amount) || 0)
      }
      return acc
    }, { totalIncome: 0, totalExpenses: 0 })
    
    summary.totalSavings = summary.totalIncome - summary.totalExpenses
    summary.totalBalance = summary.totalSavings
    
    const userRef = doc(collections.users(), userId)
    await updateDoc(userRef, {
      'financialSummary.totalIncome': summary.totalIncome,
      'financialSummary.totalExpenses': summary.totalExpenses,
      'financialSummary.totalSavings': summary.totalSavings,
      'financialSummary.totalBalance': summary.totalBalance,
      'financialSummary.lastUpdated': serverTimestamp(),
      'metadata.lastDataUpdate': serverTimestamp()
    })
    
    console.log(`✅ Batch updated financial summary for ${userId}`)
    
  } catch (error) {
    console.error('❌ Error batch updating financial summary:', error)
    throw error
  }
}

// ============================================================================
// DATA INTEGRITY HELPERS
// ============================================================================

/**
 * Update user account count
 */
const updateUserAccountCount = async (userId) => {
  try {
    const accounts = await getUserAccounts(userId)
    const userRef = doc(collections.users(), userId)
    await updateDoc(userRef, {
      'metadata.accountsCount': accounts.length,
      'metadata.lastDataUpdate': serverTimestamp()
    })
  } catch (error) {
    console.error('❌ Error updating account count:', error)
  }
}

/**
 * Update user transaction count
 */
const updateUserTransactionCount = async (userId) => {
  try {
    const transactions = await getUserTransactions(userId, { limit: 1000 })
    const userRef = doc(collections.users(), userId)
    await updateDoc(userRef, {
      'metadata.transactionsCount': transactions.length,
      'metadata.lastDataUpdate': serverTimestamp()
    })
  } catch (error) {
    console.error('❌ Error updating transaction count:', error)
  }
}

// ============================================================================
// REAL-TIME DATA LISTENERS
// ============================================================================

/**
 * Listen to user financial data changes
 */
export const listenToUserData = (userId, callback) => {
  const userRef = doc(collections.users(), userId)
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() })
    } else {
      callback(null)
    }
  })
}

/**
 * Listen to user transactions
 */
export const listenToUserTransactions = (userId, callback, options = {}) => {
  const { limitCount = 50 } = options
  
  const q = query(
    collections.transactions(),
    where('userId', '==', userId),
    orderBy('date', 'desc'),
    limit(limitCount)
  )
  
  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    callback(transactions)
  })
}

// ============================================================================
// DATA VALIDATION HELPERS
// ============================================================================

/**
 * Validate transaction data
 */
export const validateTransaction = (transactionData) => {
  const errors = []
  
  if (!transactionData.description?.trim()) {
    errors.push('Description is required')
  }
  
  if (!transactionData.amount || transactionData.amount <= 0) {
    errors.push('Amount must be greater than 0')
  }
  
  if (!transactionData.date) {
    errors.push('Date is required')
  }
  
  if (!transactionData.category) {
    errors.push('Category is required')
  }
  
  if (!transactionData.type || !['income', 'expense', 'transfer'].includes(transactionData.type)) {
    errors.push('Type must be income, expense, or transfer')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Validate account data
 */
export const validateAccount = (accountData) => {
  const errors = []
  
  if (!accountData.name?.trim()) {
    errors.push('Account name is required')
  }
  
  if (!accountData.type) {
    errors.push('Account type is required')
  }
  
  if (accountData.balance === undefined || accountData.balance < 0) {
    errors.push('Balance must be 0 or greater')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// ============================================================================
// MIGRATION HELPERS
// ============================================================================

/**
 * Migrate from old nested structure to new flat structure
 */
export const migrateUserData = async (userId, oldUserData) => {
  try {
    console.log(`🔄 Migrating data for user ${userId}`)
    
    // Create new user profile
    await createUserProfile(userId, {
      name: oldUserData.name,
      email: oldUserData.email,
      photoURL: oldUserData.photoURL,
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
    console.error(`❌ Error migrating user data for ${userId}:`, error)
    throw error
  }
}

export default {
  // User management
  createUserProfile,
  getUserProfile,
  updateFinancialSummary,
  
  // Account management
  createAccount,
  getUserAccounts,
  updateAccountBalance,
  
  // Transaction management
  createTransaction,
  getUserTransactions,
  updateTransaction,
  deleteTransaction,
  
  // Budget management
  createBudget,
  getUserBudgets,
  
  // Goal management
  createGoal,
  getUserGoals,
  
  // Batch operations
  batchCreateTransactions,
  batchUpdateFinancialSummary,
  
  // Real-time listeners
  listenToUserData,
  listenToUserTransactions,
  
  // Validation
  validateTransaction,
  validateAccount,
  
  // Migration
  migrateUserData
}
