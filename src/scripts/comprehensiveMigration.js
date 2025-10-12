// Comprehensive Migration Script for RetroVault
// Migrates from nested structure to unified flat structure
// Handles data integrity, performance optimization, and consistency

import { db } from '../firebaseAdmin.js'

// ============================================================================
// MAIN MIGRATION FUNCTION
// ============================================================================

/**
 * Comprehensive migration from old nested structure to new unified structure
 */
export const migrateToUnifiedStructure = async () => {
  try {
    console.log('🚀 Starting comprehensive migration to unified Firestore structure...')
    
    // Get all existing users
    const usersSnapshot = await db.collection('users').get()
    console.log(`📊 Found ${usersSnapshot.docs.length} users to migrate`)
    
    let migratedCount = 0
    let errorCount = 0
    const migrationResults = []
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        console.log(`🔄 Migrating user: ${userId}`)
        
        const result = await migrateUserCompletely(userId, userData)
        migrationResults.push(result)
        
        migratedCount++
        console.log(`✅ Successfully migrated user: ${userId}`)
        
      } catch (error) {
        console.error(`❌ Error migrating user ${userDoc.id}:`, error)
        errorCount++
        migrationResults.push({
          userId: userDoc.id,
          success: false,
          error: error.message
        })
      }
    }
    
    // Create default categories
    await createDefaultCategories()
    
    console.log(`🎉 Migration completed!`)
    console.log(`✅ Successfully migrated: ${migratedCount} users`)
    console.log(`❌ Errors: ${errorCount} users`)
    
    return {
      success: true,
      migratedCount,
      errorCount,
      totalUsers: usersSnapshot.docs.length,
      results: migrationResults
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

// ============================================================================
// USER MIGRATION
// ============================================================================

/**
 * Migrate a single user completely
 */
const migrateUserCompletely = async (userId, oldUserData) => {
  try {
    console.log(`🔄 Starting complete migration for user: ${userId}`)
    
    // 1. Migrate user profile
    const userProfile = await migrateUserProfile(userId, oldUserData)
    
    // 2. Migrate accounts
    const accountsResult = await migrateUserAccounts(userId)
    
    // 3. Migrate transactions
    const transactionsResult = await migrateUserTransactions(userId)
    
    // 4. Migrate budgets
    const budgetsResult = await migrateUserBudgets(userId)
    
    // 5. Migrate goals
    const goalsResult = await migrateUserGoals(userId)
    
    // 6. Update financial summary
    await updateUserFinancialSummary(userId)
    
    console.log(`✅ Complete migration finished for user: ${userId}`)
    
    return {
      userId,
      success: true,
      userProfile,
      accounts: accountsResult,
      transactions: transactionsResult,
      budgets: budgetsResult,
      goals: goalsResult
    }
    
  } catch (error) {
    console.error(`❌ Error in complete migration for user ${userId}:`, error)
    throw error
  }
}

/**
 * Migrate user profile to new unified structure
 */
const migrateUserProfile = async (userId, oldUserData) => {
  try {
    console.log(`📄 Migrating user profile: ${userId}`)
    
    const newUserProfile = {
      // Core profile data
      profile: {
        name: oldUserData.name || 'User',
        email: oldUserData.email || '',
        photoURL: oldUserData.photoURL || null,
        createdAt: new Date(),
        lastLogin: new Date()
      },
      
      // Financial summary (denormalized for performance)
      financialSummary: {
        totalBalance: oldUserData.balance || 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        lastUpdated: new Date()
      },
      
      // Data source and consistency tracking
      dataSource: oldUserData.dataSource || 'Migration',
      syncStatus: {
        lastSync: new Date(),
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
        lastDataUpdate: new Date(),
        dataVersion: '2.0'
      }
    }
    
    // Create user document in new structure
    await db.collection('users').doc(userId).set(newUserProfile)
    console.log(`✅ Migrated user profile: ${userId}`)
    
    return newUserProfile
    
  } catch (error) {
    console.error(`❌ Error migrating user profile ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// ACCOUNTS MIGRATION
// ============================================================================

/**
 * Migrate user accounts from nested to flat structure
 */
const migrateUserAccounts = async (userId) => {
  try {
    console.log(`🏦 Migrating accounts for user: ${userId}`)
    
    // Get accounts from old nested structure
    const accountsSnapshot = await db.collection(`users/${userId}/accounts`).get()
    
    if (accountsSnapshot.empty) {
      console.log(`📝 No accounts found for user: ${userId}`)
      return { count: 0, accounts: [] }
    }
    
    console.log(`📊 Found ${accountsSnapshot.docs.length} accounts for user: ${userId}`)
    
    const migratedAccounts = []
    
    // Migrate each account
    for (const accountDoc of accountsSnapshot.docs) {
      const accountData = accountDoc.data()
      
      const newAccount = {
        userId: userId,
        nessieId: accountDoc.id, // Keep original ID as nessieId
        name: accountData.name || accountData.type || 'Account',
        type: accountData.type || 'Checking',
        balance: accountData.balance || 0,
        isActive: true,
        institution: 'Migrated Account',
        accountNumber: null,
        routingNumber: null,
        createdAt: new Date(),
        lastUpdated: new Date(),
        metadata: {
          syncSource: 'migration',
          lastSync: new Date()
        }
      }
      
      // Create account in new flat structure
      const accountRef = await db.collection('accounts').add(newAccount)
      migratedAccounts.push({ id: accountRef.id, ...newAccount })
      
      console.log(`✅ Migrated account: ${accountData.name}`)
    }
    
    console.log(`✅ Migrated ${migratedAccounts.length} accounts for user: ${userId}`)
    return { count: migratedAccounts.length, accounts: migratedAccounts }
    
  } catch (error) {
    console.error(`❌ Error migrating accounts for user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// TRANSACTIONS MIGRATION
// ============================================================================

/**
 * Migrate user transactions from nested to flat structure
 */
const migrateUserTransactions = async (userId) => {
  try {
    console.log(`💳 Migrating transactions for user: ${userId}`)
    
    // Get transactions from old nested structure
    const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get()
    
    if (transactionsSnapshot.empty) {
      console.log(`📝 No transactions found for user: ${userId}`)
      return { count: 0, transactions: [] }
    }
    
    console.log(`📊 Found ${transactionsSnapshot.docs.length} transactions for user: ${userId}`)
    
    const transactions = []
    
    // Prepare transactions for batch creation
    for (const transactionDoc of transactionsSnapshot.docs) {
      const transactionData = transactionDoc.data()
      
      const newTransaction = {
        userId: userId,
        accountId: transactionData.accountId || 'default',
        nessieId: transactionDoc.id, // Keep original ID as nessieId
        amount: transactionData.amount || 0,
        type: transactionData.type || 'expense',
        category: transactionData.category || 'Other',
        subcategory: null,
        description: transactionData.description || 'Transaction',
        merchant: transactionData.merchant || null,
        date: transactionData.date || new Date(),
        isRecurring: false,
        tags: [],
        metadata: {
          location: null,
          paymentMethod: null,
          notes: null,
          syncSource: 'migration'
        }
      }
      
      transactions.push(newTransaction)
    }
    
    // Batch create transactions
    if (transactions.length > 0) {
      const batch = db.batch()
      
      transactions.forEach(transaction => {
        const transactionRef = db.collection('transactions').doc()
        batch.set(transactionRef, {
          ...transaction,
          createdAt: new Date(),
          lastUpdated: new Date()
        })
      })
      
      await batch.commit()
      console.log(`✅ Migrated ${transactions.length} transactions for user: ${userId}`)
    }
    
    return { count: transactions.length, transactions }
    
  } catch (error) {
    console.error(`❌ Error migrating transactions for user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// BUDGETS MIGRATION
// ============================================================================

/**
 * Migrate user budgets
 */
const migrateUserBudgets = async (userId) => {
  try {
    console.log(`💰 Migrating budgets for user: ${userId}`)
    
    // Check if budgets exist in old structure
    const budgetsSnapshot = await db.collection(`users/${userId}/settings`).doc('budgets').get()
    
    if (!budgetsSnapshot.exists()) {
      console.log(`📝 No budgets found for user: ${userId}`)
      return { count: 0, budgets: [] }
    }
    
    const budgetsData = budgetsSnapshot.data()
    const migratedBudgets = []
    
    // Migrate each budget category
    for (const [category, amount] of Object.entries(budgetsData)) {
      if (typeof amount === 'number' && amount > 0) {
        const budget = {
          userId: userId,
          category: category,
          amount: amount,
          period: 'monthly',
          isActive: true,
          createdAt: new Date(),
          lastUpdated: new Date()
        }
        
        const budgetRef = await db.collection('budgets').add(budget)
        migratedBudgets.push({ id: budgetRef.id, ...budget })
      }
    }
    
    console.log(`✅ Migrated ${migratedBudgets.length} budgets for user: ${userId}`)
    return { count: migratedBudgets.length, budgets: migratedBudgets }
    
  } catch (error) {
    console.error(`❌ Error migrating budgets for user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// GOALS MIGRATION
// ============================================================================

/**
 * Migrate user goals
 */
const migrateUserGoals = async (userId) => {
  try {
    console.log(`🎯 Migrating goals for user: ${userId}`)
    
    // Check if goals exist in old structure
    const goalsSnapshot = await db.collection(`users/${userId}/goals`).get()
    
    if (goalsSnapshot.empty) {
      console.log(`📝 No goals found for user: ${userId}`)
      return { count: 0, goals: [] }
    }
    
    console.log(`📊 Found ${goalsSnapshot.docs.length} goals for user: ${userId}`)
    
    const migratedGoals = []
    
    // Migrate each goal
    for (const goalDoc of goalsSnapshot.docs) {
      const goalData = goalDoc.data()
      
      const goal = {
        userId: userId,
        title: goalData.title || 'Financial Goal',
        description: goalData.description || '',
        targetAmount: goalData.targetAmount || 0,
        currentAmount: goalData.currentAmount || 0,
        targetDate: goalData.targetDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
        category: goalData.category || 'Savings',
        priority: goalData.priority || 'Medium',
        isCompleted: false,
        createdAt: new Date(),
        lastUpdated: new Date()
      }
      
      const goalRef = await db.collection('goals').add(goal)
      migratedGoals.push({ id: goalRef.id, ...goal })
    }
    
    console.log(`✅ Migrated ${migratedGoals.length} goals for user: ${userId}`)
    return { count: migratedGoals.length, goals: migratedGoals }
    
  } catch (error) {
    console.error(`❌ Error migrating goals for user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// FINANCIAL SUMMARY UPDATE
// ============================================================================

/**
 * Update financial summary based on migrated transactions
 */
const updateUserFinancialSummary = async (userId) => {
  try {
    console.log(`💰 Updating financial summary for user: ${userId}`)
    
    // Get all transactions for the user
    const transactionsSnapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .get()
    
    if (transactionsSnapshot.empty) {
      console.log(`📝 No transactions found for financial summary: ${userId}`)
      return
    }
    
    // Calculate financial summary
    let totalIncome = 0
    let totalExpenses = 0
    
    transactionsSnapshot.docs.forEach(doc => {
      const transaction = doc.data()
      if (transaction.type === 'income') {
        totalIncome += transaction.amount
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount
      }
    })
    
    const totalSavings = totalIncome - totalExpenses
    const totalBalance = totalSavings // Simplified for now
    
    // Update user financial summary
    await db.collection('users').doc(userId).update({
      'financialSummary.totalIncome': totalIncome,
      'financialSummary.totalExpenses': totalExpenses,
      'financialSummary.totalSavings': totalSavings,
      'financialSummary.totalBalance': totalBalance,
      'financialSummary.lastUpdated': new Date(),
      'metadata.lastDataUpdate': new Date(),
      'metadata.transactionsCount': transactionsSnapshot.docs.length
    })
    
    console.log(`✅ Updated financial summary for user: ${userId}`)
    console.log(`   Income: $${totalIncome}, Expenses: $${totalExpenses}, Savings: $${totalSavings}`)
    
  } catch (error) {
    console.error(`❌ Error updating financial summary for user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// DEFAULT CATEGORIES SETUP
// ============================================================================

/**
 * Create default categories in the new structure
 */
const createDefaultCategories = async () => {
  try {
    console.log('🏷️ Creating default categories...')
    
    const defaultCategories = [
      {
        name: 'Food',
        type: 'expense',
        color: '#FF6B6B',
        icon: '🍽️',
        isDefault: true,
        subcategories: ['Groceries', 'Restaurants', 'Coffee', 'Takeout'],
        rules: {
          keywords: ['food', 'restaurant', 'grocery', 'coffee', 'dining'],
          autoAssign: true,
          priority: 1
        }
      },
      {
        name: 'Transport',
        type: 'expense',
        color: '#4ECDC4',
        icon: '🚗',
        isDefault: true,
        subcategories: ['Gas', 'Public Transport', 'Uber', 'Lyft', 'Parking'],
        rules: {
          keywords: ['gas', 'fuel', 'uber', 'lyft', 'transport', 'parking'],
          autoAssign: true,
          priority: 2
        }
      },
      {
        name: 'Entertainment',
        type: 'expense',
        color: '#45B7D1',
        icon: '🎬',
        isDefault: true,
        subcategories: ['Movies', 'Streaming', 'Games', 'Events'],
        rules: {
          keywords: ['entertainment', 'movie', 'netflix', 'spotify', 'game'],
          autoAssign: true,
          priority: 3
        }
      },
      {
        name: 'Shopping',
        type: 'expense',
        color: '#96CEB4',
        icon: '🛍️',
        isDefault: true,
        subcategories: ['Clothing', 'Electronics', 'Amazon', 'Retail'],
        rules: {
          keywords: ['shopping', 'amazon', 'store', 'retail', 'clothing'],
          autoAssign: true,
          priority: 4
        }
      },
      {
        name: 'Bills',
        type: 'expense',
        color: '#FFEAA7',
        icon: '💡',
        isDefault: true,
        subcategories: ['Electric', 'Water', 'Internet', 'Phone', 'Rent'],
        rules: {
          keywords: ['bill', 'utility', 'electric', 'water', 'internet', 'phone'],
          autoAssign: true,
          priority: 5
        }
      },
      {
        name: 'Healthcare',
        type: 'expense',
        color: '#DDA0DD',
        icon: '🏥',
        isDefault: true,
        subcategories: ['Doctor', 'Pharmacy', 'Insurance', 'Medical'],
        rules: {
          keywords: ['medical', 'doctor', 'pharmacy', 'health', 'hospital'],
          autoAssign: true,
          priority: 6
        }
      },
      {
        name: 'Education',
        type: 'expense',
        color: '#98D8C8',
        icon: '📚',
        isDefault: true,
        subcategories: ['Books', 'Courses', 'School', 'Training'],
        rules: {
          keywords: ['education', 'school', 'course', 'book', 'training'],
          autoAssign: true,
          priority: 7
        }
      },
      {
        name: 'Travel',
        type: 'expense',
        color: '#F7DC6F',
        icon: '✈️',
        isDefault: true,
        subcategories: ['Flights', 'Hotels', 'Vacation', 'Transport'],
        rules: {
          keywords: ['travel', 'hotel', 'flight', 'vacation', 'trip'],
          autoAssign: true,
          priority: 8
        }
      },
      {
        name: 'Other',
        type: 'expense',
        color: '#95A5A6',
        icon: '📦',
        isDefault: true,
        subcategories: ['Miscellaneous', 'Unknown'],
        rules: {
          keywords: [],
          autoAssign: false,
          priority: 9
        }
      }
    ]
    
    const batch = db.batch()
    
    defaultCategories.forEach(category => {
      const categoryRef = db.collection('categories').doc()
      batch.set(categoryRef, category)
    })
    
    await batch.commit()
    console.log(`✅ Created ${defaultCategories.length} default categories`)
    
  } catch (error) {
    console.error('❌ Error creating default categories:', error)
    throw error
  }
}

// ============================================================================
// CLEANUP FUNCTIONS
// ============================================================================

/**
 * Clean up old nested collections after successful migration
 */
export const cleanupOldCollections = async (userId) => {
  try {
    console.log(`🧹 Cleaning up old collections for user: ${userId}`)
    
    // Delete old nested accounts collection
    const accountsSnapshot = await db.collection(`users/${userId}/accounts`).get()
    if (!accountsSnapshot.empty) {
      const accountsBatch = db.batch()
      accountsSnapshot.docs.forEach(doc => {
        accountsBatch.delete(doc.ref)
      })
      await accountsBatch.commit()
    }
    
    // Delete old nested transactions collection
    const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get()
    if (!transactionsSnapshot.empty) {
      const transactionsBatch = db.batch()
      transactionsSnapshot.docs.forEach(doc => {
        transactionsBatch.delete(doc.ref)
      })
      await transactionsBatch.commit()
    }
    
    // Delete old nested goals collection
    const goalsSnapshot = await db.collection(`users/${userId}/goals`).get()
    if (!goalsSnapshot.empty) {
      const goalsBatch = db.batch()
      goalsSnapshot.docs.forEach(doc => {
        goalsBatch.delete(doc.ref)
      })
      await goalsBatch.commit()
    }
    
    // Delete old settings document
    const settingsRef = db.collection(`users/${userId}/settings`).doc('budgets')
    const settingsDoc = await settingsRef.get()
    if (settingsDoc.exists()) {
      await settingsRef.delete()
    }
    
    console.log(`✅ Cleaned up old collections for user: ${userId}`)
    
  } catch (error) {
    console.error(`❌ Error cleaning up old collections for user ${userId}:`, error)
    throw error
  }
}

/**
 * Verify migration integrity for a user
 */
export const verifyMigration = async (userId) => {
  try {
    console.log(`🔍 Verifying migration for user: ${userId}`)
    
    // Check user profile
    const userDoc = await db.collection('users').doc(userId).get()
    if (!userDoc.exists) {
      throw new Error('User profile not found')
    }
    
    // Check accounts
    const accountsSnapshot = await db.collection('accounts').where('userId', '==', userId).get()
    console.log(`📊 Found ${accountsSnapshot.docs.length} accounts`)
    
    // Check transactions
    const transactionsSnapshot = await db.collection('transactions').where('userId', '==', userId).get()
    console.log(`📊 Found ${transactionsSnapshot.docs.length} transactions`)
    
    // Check budgets
    const budgetsSnapshot = await db.collection('budgets').where('userId', '==', userId).get()
    console.log(`📊 Found ${budgetsSnapshot.docs.length} budgets`)
    
    // Check goals
    const goalsSnapshot = await db.collection('goals').where('userId', '==', userId).get()
    console.log(`📊 Found ${goalsSnapshot.docs.length} goals`)
    
    // Check financial summary
    const userData = userDoc.data()
    const financialSummary = userData.financialSummary
    console.log(`💰 Financial Summary:`)
    console.log(`   Balance: $${financialSummary.totalBalance}`)
    console.log(`   Income: $${financialSummary.totalIncome}`)
    console.log(`   Expenses: $${financialSummary.totalExpenses}`)
    console.log(`   Savings: $${financialSummary.totalSavings}`)
    
    console.log(`✅ Migration verification completed for user: ${userId}`)
    
    return {
      success: true,
      accountsCount: accountsSnapshot.docs.length,
      transactionsCount: transactionsSnapshot.docs.length,
      budgetsCount: budgetsSnapshot.docs.length,
      goalsCount: goalsSnapshot.docs.length,
      financialSummary
    }
    
  } catch (error) {
    console.error(`❌ Error verifying migration for user ${userId}:`, error)
    throw error
  }
}

// ============================================================================
// MIGRATION UTILITIES
// ============================================================================

/**
 * Get migration status for all users
 */
export const getMigrationStatus = async () => {
  try {
    const usersSnapshot = await db.collection('users').get()
    const status = {
      totalUsers: usersSnapshot.docs.length,
      migratedUsers: 0,
      pendingUsers: 0,
      errorUsers: 0
    }
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data()
      if (userData.metadata?.dataVersion === '2.0') {
        status.migratedUsers++
      } else {
        status.pendingUsers++
      }
    }
    
    return status
    
  } catch (error) {
    console.error('❌ Error getting migration status:', error)
    throw error
  }
}

/**
 * Rollback migration for a specific user
 */
export const rollbackUserMigration = async (userId) => {
  try {
    console.log(`🔄 Rolling back migration for user: ${userId}`)
    
    // Delete new flat structure data
    const accountsSnapshot = await db.collection('accounts').where('userId', '==', userId).get()
    const accountsBatch = db.batch()
    accountsSnapshot.docs.forEach(doc => {
      accountsBatch.delete(doc.ref)
    })
    await accountsBatch.commit()
    
    const transactionsSnapshot = await db.collection('transactions').where('userId', '==', userId).get()
    const transactionsBatch = db.batch()
    transactionsSnapshot.docs.forEach(doc => {
      transactionsBatch.delete(doc.ref)
    })
    await transactionsBatch.commit()
    
    const budgetsSnapshot = await db.collection('budgets').where('userId', '==', userId).get()
    const budgetsBatch = db.batch()
    budgetsSnapshot.docs.forEach(doc => {
      budgetsBatch.delete(doc.ref)
    })
    await budgetsBatch.commit()
    
    const goalsSnapshot = await db.collection('goals').where('userId', '==', userId).get()
    const goalsBatch = db.batch()
    goalsSnapshot.docs.forEach(doc => {
      goalsBatch.delete(doc.ref)
    })
    await goalsBatch.commit()
    
    console.log(`✅ Rollback completed for user: ${userId}`)
    
  } catch (error) {
    console.error(`❌ Error rolling back migration for user ${userId}:`, error)
    throw error
  }
}

// Export main migration function
export default migrateToUnifiedStructure
