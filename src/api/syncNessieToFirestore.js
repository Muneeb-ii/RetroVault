// Backend API route for syncing Nessie data to Firestore
import { 
  db, 
  createUserDocument, 
  updateUserLastSync, 
  getUserData,
  getSampleProfile,
  accountsCollection,
  transactionsCollection 
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
    
    if (existingUser && existingUser.dataSource === 'Nessie' && !forceRefresh) {
      console.log('User already has consistent Nessie data, skipping sync...')
      return {
        success: true,
        message: 'Your financial data is already up to date',
        dataSource: 'Nessie',
        accountsCount: existingUser.accountsCount || 0,
        transactionsCount: existingUser.transactionsCount || 0,
        isExistingData: true
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
 * Store Nessie data in Firestore with user-specific consistency
 */
const storeNessieData = async (userId, userInfo, nessieData) => {
  try {
    const { accounts, transactions, primaryAccount } = nessieData
    
    // Calculate derived data
    const savings = calculateSavingsFromTransactions(transactions)
    const spendingBreakdown = calculateSpendingBreakdown(transactions)
    const balance = primaryAccount.balance || 0
    
    // Create user document with consistency markers
    await createUserDocument(userId, {
      name: userInfo.name || 'Nessie User',
      email: userInfo.email || '',
      balance: balance,
      dataSource: 'Nessie',
      accountInfo: {
        accountId: primaryAccount._id,
        accountType: primaryAccount.type,
        accountName: primaryAccount.nickname || 'Primary Account'
      },
      // Consistency markers
      accountsCount: accounts.length,
      transactionsCount: transactions.length,
      dataConsistency: {
        userId: userId,
        createdAt: new Date().toISOString(),
        lastSync: new Date().toISOString(),
        isConsistent: true
      }
    })
    
    // Store accounts
    for (const account of accounts) {
      await accountsCollection(userId).doc(account._id).set({
        name: account.nickname || account.type,
        type: account.type,
        balance: account.balance || 0,
        createdAt: new Date(account.creation_date || Date.now())
      })
    }
    
    // Store transactions
    for (const transaction of transactions) {
      await transactionsCollection(userId).doc(transaction.id).set({
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type,
        merchant: transaction.merchant,
        accountId: transaction.accountId
      })
    }
    
    // Update last sync
    await updateUserLastSync(userId)
    
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
 * Clone sample profile to user
 */
const cloneSampleProfile = async (userId, userInfo, sampleProfile) => {
  try {
    // Create user document
    await createUserDocument(userId, {
      name: userInfo.name || 'Demo User',
      email: userInfo.email || '',
      balance: sampleProfile.balance || 0,
      dataSource: 'Sample',
      accountInfo: sampleProfile.accountInfo || {}
    })
    
    // Clone accounts
    if (sampleProfile.accounts) {
      for (const account of sampleProfile.accounts) {
        await accountsCollection(userId).doc(account.id).set(account)
      }
    }
    
    // Clone transactions
    if (sampleProfile.transactions) {
      for (const transaction of sampleProfile.transactions) {
        await transactionsCollection(userId).doc(transaction.id).set(transaction)
      }
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
 * Create user with mock data as final fallback
 */
const createUserWithMockData = async (userId, userInfo) => {
  try {
    // Import mock data generator
    const { generateMockData } = await import('../data/mockData.js')
    const mockData = generateMockData()
    
    // Create user document
    await createUserDocument(userId, {
      name: userInfo.name || 'Demo User',
      email: userInfo.email || '',
      balance: mockData.balance,
      dataSource: 'Mock',
      accountInfo: {
        accountId: 'mock-account',
        accountType: 'Checking',
        accountName: 'Demo Account'
      }
    })
    
    // Create mock account
    await accountsCollection(userId).doc('mock-account').set({
      name: 'Demo Account',
      type: 'Checking',
      balance: mockData.balance,
      createdAt: new Date()
    })
    
    // Store mock transactions
    for (const transaction of mockData.transactions) {
      await transactionsCollection(userId).doc(transaction.id.toString()).set({
        amount: transaction.amount,
        category: transaction.category,
        description: transaction.description,
        date: transaction.date,
        type: transaction.type
      })
    }
    
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
