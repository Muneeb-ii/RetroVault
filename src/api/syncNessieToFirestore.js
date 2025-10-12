// Backend API route for syncing Nessie data to Firestore
// Updated to use unified schema structure
import { 
  db, 
  createUserDocument, 
  updateUserLastSync, 
  getUserData,
  getSampleProfile
} from '../firebaseAdmin.js'
import { 
  getAccounts, 
  getTransactions, 
  transformNessieTransactions,
  calculateSavingsFromTransactions,
  calculateSpendingBreakdown 
} from './nessieService.js'

/**
 * Sync Nessie API data to Firestore for a specific user
 * @param {string} userId - Firebase user ID
 * @param {Object} userInfo - User information (name, email)
 * @param {boolean} forceRefresh - Force refresh even if data exists
 * @returns {Promise<Object>} Sync result
 */
export const syncNessieToFirestore = async (userId, userInfo, forceRefresh = false) => {
  try {
    console.log(`Starting Nessie sync for user: ${userId}`)
    
    // Check if user already exists and has data
    const existingUser = await getUserData(userId)
    
    // Enhanced consistency checks
    if (existingUser && !forceRefresh) {
      // Check if user has been properly seeded
      if (existingUser.dataSource && existingUser.dataSource !== 'Pending' && !existingUser.needsSeeding) {
        console.log('User already has consistent data, skipping sync...')
        return {
          success: true,
          message: 'Your financial data is already up to date',
          dataSource: existingUser.dataSource,
          accountsCount: existingUser.accountsCount || 0,
          transactionsCount: existingUser.transactionsCount || 0,
          isExistingData: true,
          lastSeeded: existingUser.lastSeeded
        }
      }
      
      // Check if user was recently seeded (within last 5 minutes)
      if (existingUser.lastSeeded) {
        const lastSeededTime = new Date(existingUser.lastSeeded)
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
        if (lastSeededTime > fiveMinutesAgo) {
          console.log('User was recently seeded, skipping sync to prevent duplicate data...')
          return {
            success: true,
            message: 'Data was recently synced, skipping to prevent duplicates',
            dataSource: existingUser.dataSource,
            accountsCount: existingUser.accountsCount || 0,
            transactionsCount: existingUser.transactionsCount || 0,
            isExistingData: true,
            lastSeeded: existingUser.lastSeeded
          }
        }
      }
    }
    
    // Try to fetch from Nessie API first
    try {
      const nessieData = await fetchNessieData()
      if (nessieData) {
        console.log('Successfully fetched Nessie data, storing in Firestore...')
        return await storeNessieData(userId, userInfo, nessieData)
      }
    } catch (nessieError) {
      console.warn('Nessie API unavailable, using sample profile:', nessieError.message)
    }
    
    // Fallback to sample profile
    const sampleProfile = await getSampleProfile()
    if (sampleProfile) {
      console.log('Using sample profile for user data')
      return await cloneSampleProfile(userId, userInfo, sampleProfile)
    }
    
    // Final fallback - create with mock data
    console.log('Creating user with mock data')
    return await createUserWithMockData(userId, userInfo)
    
  } catch (error) {
    console.error('Error syncing Nessie to Firestore:', error)
    throw error
  }
}

/**
 * Fetch data from Nessie API
 */
const fetchNessieData = async () => {
  try {
    const accounts = await getAccounts()
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found from Nessie API')
    }
    
    const primaryAccount = accounts[0]
    const rawTransactions = await getTransactions(primaryAccount._id)
    const transactions = transformNessieTransactions(rawTransactions)
    
    return {
      accounts,
      transactions,
      primaryAccount
    }
  } catch (error) {
    console.error('Error fetching Nessie data:', error)
    throw error
  }
}

/**
 * Store Nessie data in Firestore using unified schema
 */
const storeNessieData = async (userId, userInfo, nessieData) => {
  try {
    const { accounts, transactions, primaryAccount } = nessieData
    
    // Calculate derived data
    const savings = calculateSavingsFromTransactions(transactions)
    const spendingBreakdown = calculateSpendingBreakdown(transactions)
    const balance = primaryAccount.balance || 0
    
    // Calculate financial summary
    let totalIncome = 0
    let totalExpenses = 0
    
    transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount
      }
    })
    
    const totalSavings = totalIncome - totalExpenses
    
    // Create user document with unified schema
    const userProfile = {
      // Core profile data
      profile: {
        name: userInfo.name || 'Nessie User',
        email: userInfo.email || '',
        photoURL: userInfo.photoURL || null,
        createdAt: new Date(),
        lastLogin: new Date()
      },
      
      // Financial summary (denormalized for performance)
      financialSummary: {
        totalBalance: balance,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        totalSavings: totalSavings,
        lastUpdated: new Date()
      },
      
      // Data source and consistency tracking
      dataSource: 'Nessie',
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
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        lastDataUpdate: new Date(),
        dataVersion: '2.0'
      }
    }
    
    // Create user document in unified structure
    await db.collection('users').doc(userId).set(userProfile)
    
    // Store accounts in flat structure
    const accountsBatch = db.batch()
    for (const account of accounts) {
      const accountRef = db.collection('accounts').doc()
      const newAccount = {
        userId: userId,
        nessieId: account._id,
        name: account.nickname || account.type,
        type: account.type,
        balance: account.balance || 0,
        isActive: true,
        institution: 'Nessie Bank',
        accountNumber: null,
        routingNumber: null,
        createdAt: new Date(account.creation_date || Date.now()),
        lastUpdated: new Date(),
        metadata: {
          syncSource: 'nessie',
          lastSync: new Date()
        }
      }
      accountsBatch.set(accountRef, newAccount)
    }
    await accountsBatch.commit()
    
    // Store transactions in flat structure
    const transactionsBatch = db.batch()
    for (const transaction of transactions) {
      const transactionRef = db.collection('transactions').doc()
      const newTransaction = {
        userId: userId,
        accountId: transaction.accountId || 'default',
        nessieId: transaction.id,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        subcategory: null,
        description: transaction.description,
        merchant: transaction.merchant,
        date: transaction.date,
        isRecurring: false,
        tags: [],
        metadata: {
          location: null,
          paymentMethod: null,
          notes: null,
          syncSource: 'nessie'
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      }
      transactionsBatch.set(transactionRef, newTransaction)
    }
    await transactionsBatch.commit()
    
    console.log(`Successfully synced Nessie data for user ${userId}`)
    return {
      success: true,
      message: 'Your financial data has been synced and will remain consistent across all logins',
      dataSource: 'Nessie',
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
      isConsistent: true,
      userId: userId
    }
    
  } catch (error) {
    console.error('Error storing Nessie data:', error)
    throw error
  }
}

/**
 * Update existing user data from Nessie
 */
const updateExistingUserData = async (userId) => {
  try {
    const nessieData = await fetchNessieData()
    const { accounts, transactions, primaryAccount } = nessieData
    
    // Update user balance
    await usersCollection().doc(userId).update({
      balance: primaryAccount.balance || 0,
      lastSync: admin.firestore.FieldValue.serverTimestamp()
    })
    
    // Update transactions (clear old ones first)
    const existingTransactions = await transactionsCollection(userId).get()
    const batch = db.batch()
    
    existingTransactions.docs.forEach(doc => {
      batch.delete(doc.ref)
    })
    
    // Add new transactions
    for (const transaction of transactions) {
      const transactionRef = transactionsCollection(userId).doc(transaction.id)
      batch.set(transactionRef, {
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        merchant: transaction.merchant,
        accountId: transaction.accountId
      })
    }
    
    await batch.commit()
    
    console.log(`Updated Nessie data for user ${userId}`)
    return {
      success: true,
      message: 'Nessie data updated successfully',
      dataSource: 'Nessie',
      transactionsCount: transactions.length
    }
    
  } catch (error) {
    console.error('Error updating existing user data:', error)
    throw error
  }
}

/**
 * Clone sample profile to user using unified schema
 */
const cloneSampleProfile = async (userId, userInfo, sampleProfile) => {
  try {
    // Calculate financial summary from sample data
    let totalIncome = 0
    let totalExpenses = 0
    
    if (sampleProfile.transactions) {
      sampleProfile.transactions.forEach(transaction => {
        if (transaction.type === 'income') {
          totalIncome += transaction.amount
        } else if (transaction.type === 'expense') {
          totalExpenses += transaction.amount
        }
      })
    }
    
    const totalSavings = totalIncome - totalExpenses
    
    // Create user document with unified schema
    const userProfile = {
      profile: {
        name: userInfo.name || 'Demo User',
        email: userInfo.email || '',
        photoURL: userInfo.photoURL || null,
        createdAt: new Date(),
        lastLogin: new Date()
      },
      
      financialSummary: {
        totalBalance: sampleProfile.balance || 0,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        totalSavings: totalSavings,
        lastUpdated: new Date()
      },
      
      dataSource: 'Sample',
      syncStatus: {
        lastSync: new Date(),
        isConsistent: true,
        needsRefresh: false,
        version: 1
      },
      
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
      
      metadata: {
        accountsCount: sampleProfile.accounts?.length || 0,
        transactionsCount: sampleProfile.transactions?.length || 0,
        lastDataUpdate: new Date(),
        dataVersion: '2.0'
      }
    }
    
    // Create user document in unified structure
    await db.collection('users').doc(userId).set(userProfile)
    
    // Clone accounts in flat structure
    if (sampleProfile.accounts) {
      const accountsBatch = db.batch()
      for (const account of sampleProfile.accounts) {
        const accountRef = db.collection('accounts').doc()
        const newAccount = {
          userId: userId,
          nessieId: account.id,
          name: account.name,
          type: account.type,
          balance: account.balance || 0,
          isActive: true,
          institution: 'Sample Bank',
          accountNumber: null,
          routingNumber: null,
          createdAt: new Date(),
          lastUpdated: new Date(),
          metadata: {
            syncSource: 'sample',
            lastSync: new Date()
          }
        }
        accountsBatch.set(accountRef, newAccount)
      }
      await accountsBatch.commit()
    }
    
    // Clone transactions in flat structure
    if (sampleProfile.transactions) {
      const transactionsBatch = db.batch()
      for (const transaction of sampleProfile.transactions) {
        const transactionRef = db.collection('transactions').doc()
        const newTransaction = {
          userId: userId,
          accountId: transaction.accountId || 'default',
          nessieId: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category,
          subcategory: null,
          description: transaction.description,
          merchant: transaction.merchant,
          date: transaction.date,
          isRecurring: false,
          tags: [],
          metadata: {
            location: null,
            paymentMethod: null,
            notes: null,
            syncSource: 'sample'
          },
          createdAt: new Date(),
          lastUpdated: new Date()
        }
        transactionsBatch.set(transactionRef, newTransaction)
      }
      await transactionsBatch.commit()
    }
    
    console.log(`Cloned sample profile for user ${userId}`)
    return {
      success: true,
      message: 'Sample profile loaded successfully',
      dataSource: 'Sample',
      accountsCount: sampleProfile.accounts?.length || 0,
      transactionsCount: sampleProfile.transactions?.length || 0
    }
    
  } catch (error) {
    console.error('Error cloning sample profile:', error)
    throw error
  }
}

/**
 * Create user with mock data as final fallback using unified schema
 */
const createUserWithMockData = async (userId, userInfo) => {
  try {
    // Import mock data generator
    const { generateMockData } = await import('../data/mockData.js')
    const mockData = generateMockData()
    
    // Calculate financial summary from mock data
    let totalIncome = 0
    let totalExpenses = 0
    
    mockData.transactions.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount
      }
    })
    
    const totalSavings = totalIncome - totalExpenses
    
    // Create user document with unified schema
    const userProfile = {
      profile: {
        name: userInfo.name || 'Demo User',
        email: userInfo.email || '',
        photoURL: userInfo.photoURL || null,
        createdAt: new Date(),
        lastLogin: new Date()
      },
      
      financialSummary: {
        totalBalance: mockData.balance,
        totalIncome: totalIncome,
        totalExpenses: totalExpenses,
        totalSavings: totalSavings,
        lastUpdated: new Date()
      },
      
      dataSource: 'Mock',
      syncStatus: {
        lastSync: new Date(),
        isConsistent: true,
        needsRefresh: false,
        version: 1
      },
      
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
      
      metadata: {
        accountsCount: 1,
        transactionsCount: mockData.transactions.length,
        lastDataUpdate: new Date(),
        dataVersion: '2.0'
      }
    }
    
    // Create user document in unified structure
    await db.collection('users').doc(userId).set(userProfile)
    
    // Create mock account in flat structure
    const accountRef = db.collection('accounts').doc()
    const mockAccount = {
      userId: userId,
      nessieId: 'mock-account',
      name: 'Demo Account',
      type: 'Checking',
      balance: mockData.balance,
      isActive: true,
      institution: 'Demo Bank',
      accountNumber: null,
      routingNumber: null,
      createdAt: new Date(),
      lastUpdated: new Date(),
      metadata: {
        syncSource: 'mock',
        lastSync: new Date()
      }
    }
    await accountRef.set(mockAccount)
    
    // Store mock transactions in flat structure
    const transactionsBatch = db.batch()
    for (const transaction of mockData.transactions) {
      const transactionRef = db.collection('transactions').doc()
      const newTransaction = {
        userId: userId,
        accountId: accountRef.id,
        nessieId: transaction.id.toString(),
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        subcategory: null,
        description: transaction.description,
        merchant: null,
        date: transaction.date,
        isRecurring: false,
        tags: [],
        metadata: {
          location: null,
          paymentMethod: null,
          notes: null,
          syncSource: 'mock'
        },
        createdAt: new Date(),
        lastUpdated: new Date()
      }
      transactionsBatch.set(transactionRef, newTransaction)
    }
    await transactionsBatch.commit()
    
    console.log(`Created mock data for user ${userId}`)
    return {
      success: true,
      message: 'Mock data created successfully',
      dataSource: 'Mock',
      accountsCount: 1,
      transactionsCount: mockData.transactions.length
    }
    
  } catch (error) {
    console.error('Error creating mock data:', error)
    throw error
  }
}
