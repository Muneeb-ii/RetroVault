// Migration script to convert from nested to flat Firestore structure
// This script migrates existing data to the streamlined schema

import { db } from '../firebaseAdmin.js'
import { 
  createUserProfile,
  createAccount,
  createTransaction,
  batchCreateTransactions,
  batchUpdateFinancialSummary
} from '../api/firestoreService.js'

/**
 * Main migration function
 */
export const migrateToStreamlinedSchema = async () => {
  try {
    console.log('🚀 Starting migration to streamlined Firestore schema...')
    
    // Get all existing users
    const usersSnapshot = await db.collection('users').get()
    console.log(`📊 Found ${usersSnapshot.docs.length} users to migrate`)
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id
        const userData = userDoc.data()
        
        console.log(`🔄 Migrating user: ${userId}`)
        
        // Migrate user profile
        await migrateUserProfile(userId, userData)
        
        // Migrate accounts
        await migrateUserAccounts(userId)
        
        // Migrate transactions
        await migrateUserTransactions(userId)
        
        // Update financial summary
        await updateFinancialSummary(userId)
        
        migratedCount++
        console.log(`✅ Successfully migrated user: ${userId}`)
        
      } catch (error) {
        console.error(`❌ Error migrating user ${userDoc.id}:`, error)
        errorCount++
      }
    }
    
    console.log(`🎉 Migration completed!`)
    console.log(`✅ Successfully migrated: ${migratedCount} users`)
    console.log(`❌ Errors: ${errorCount} users`)
    
    return {
      success: true,
      migratedCount,
      errorCount,
      totalUsers: usersSnapshot.docs.length
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Migrate user profile to new structure
 */
const migrateUserProfile = async (userId, oldUserData) => {
  try {
    // Create new user profile with optimized structure
    const newUserProfile = {
      profile: {
        name: oldUserData.name || 'User',
        email: oldUserData.email || '',
        photoURL: oldUserData.photoURL || null,
        createdAt: oldUserData.createdAt || new Date()
      },
      financialSummary: {
        totalBalance: oldUserData.balance || 0,
        totalIncome: 0, // Will be calculated from transactions
        totalExpenses: 0, // Will be calculated from transactions
        totalSavings: 0, // Will be calculated from transactions
        lastUpdated: new Date()
      },
      dataSource: oldUserData.dataSource || 'Migration',
      syncStatus: {
        lastSync: oldUserData.lastSync || new Date(),
        isConsistent: oldUserData.dataConsistency?.isConsistent || true,
        needsRefresh: false
      },
      preferences: {
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        categories: ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other']
      }
    }
    
    // Create user document in new structure
    await db.collection('users').doc(userId).set(newUserProfile)
    console.log(`✅ Migrated user profile: ${userId}`)
    
  } catch (error) {
    console.error(`❌ Error migrating user profile ${userId}:`, error)
    throw error
  }
}

/**
 * Migrate user accounts from nested to flat structure
 */
const migrateUserAccounts = async (userId) => {
  try {
    // Get accounts from old nested structure
    const accountsSnapshot = await db.collection(`users/${userId}/accounts`).get()
    
    if (accountsSnapshot.empty) {
      console.log(`📝 No accounts found for user: ${userId}`)
      return
    }
    
    console.log(`📊 Found ${accountsSnapshot.docs.length} accounts for user: ${userId}`)
    
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
        createdAt: accountData.createdAt || new Date(),
        lastUpdated: new Date(),
        metadata: {
          institution: 'Migrated Account',
          accountNumber: null,
          routingNumber: null
        }
      }
      
      // Create account in new flat structure
      await db.collection('accounts').add(newAccount)
      console.log(`✅ Migrated account: ${accountData.name}`)
    }
    
  } catch (error) {
    console.error(`❌ Error migrating accounts for user ${userId}:`, error)
    throw error
  }
}

/**
 * Migrate user transactions from nested to flat structure
 */
const migrateUserTransactions = async (userId) => {
  try {
    // Get transactions from old nested structure
    const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get()
    
    if (transactionsSnapshot.empty) {
      console.log(`📝 No transactions found for user: ${userId}`)
      return
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
          notes: null
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
          createdAt: new Date()
        })
      })
      
      await batch.commit()
      console.log(`✅ Migrated ${transactions.length} transactions for user: ${userId}`)
    }
    
  } catch (error) {
    console.error(`❌ Error migrating transactions for user ${userId}:`, error)
    throw error
  }
}

/**
 * Update financial summary based on migrated transactions
 */
const updateFinancialSummary = async (userId) => {
  try {
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
      } else {
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
      'financialSummary.lastUpdated': new Date()
    })
    
    console.log(`✅ Updated financial summary for user: ${userId}`)
    console.log(`   Income: $${totalIncome}, Expenses: $${totalExpenses}, Savings: $${totalSavings}`)
    
  } catch (error) {
    console.error(`❌ Error updating financial summary for user ${userId}:`, error)
    throw error
  }
}

/**
 * Create default categories in the new structure
 */
export const createDefaultCategories = async () => {
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

/**
 * Clean up old nested collections after successful migration
 */
export const cleanupOldCollections = async (userId) => {
  try {
    console.log(`🧹 Cleaning up old collections for user: ${userId}`)
    
    // Delete old nested accounts collection
    const accountsSnapshot = await db.collection(`users/${userId}/accounts`).get()
    const accountsBatch = db.batch()
    accountsSnapshot.docs.forEach(doc => {
      accountsBatch.delete(doc.ref)
    })
    await accountsBatch.commit()
    
    // Delete old nested transactions collection
    const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get()
    const transactionsBatch = db.batch()
    transactionsSnapshot.docs.forEach(doc => {
      transactionsBatch.delete(doc.ref)
    })
    await transactionsBatch.commit()
    
    console.log(`✅ Cleaned up old collections for user: ${userId}`)
    
  } catch (error) {
    console.error(`❌ Error cleaning up old collections for user ${userId}:`, error)
    throw error
  }
}

/**
 * Verify migration integrity
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
      financialSummary
    }
    
  } catch (error) {
    console.error(`❌ Error verifying migration for user ${userId}:`, error)
    throw error
  }
}

// Export main migration function
export default migrateToStreamlinedSchema
