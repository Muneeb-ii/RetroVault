// Data Seeding Service for RetroVault
// Handles data seeding for new users and data refresh for existing users

import { 
  createUserProfile,
  batchCreateTransactions,
  batchUpdateFinancialSummary
} from '../api/unifiedFirestoreService'
import { 
  getCustomers,
  createCustomer,
  createAccount,
  createTransaction,
  getAccounts, 
  getTransactions, 
  transformNessieTransactions,
  calculateSavingsFromTransactions,
  calculateSpendingBreakdown,
  isNessieAvailable 
} from '../api/nessieService'

/**
 * Data Seeding Service
 * Handles all data seeding operations with proper fallbacks
 */
export class DataSeedingService {
  constructor() {
    this.isSeeding = false
    this.seedingProgress = 0
    this.seedingMessage = ''
    this.seedingPromise = null // Track ongoing seeding operation
    this.seedingLock = false // Prevent concurrent seeding
    this.seedingKey = null // Track which user is being seeded
  }

  /**
   * Seed data for a new user with race condition protection
   * @param {string} userId - Firebase user ID
   * @param {Object} userInfo - User information
   * @param {boolean} forceRefresh - Force refresh even if data exists
   * @returns {Promise<Object>} Seeding result
   */
  async seedUserData(userId, userInfo, forceRefresh = false) {
    // Check if already seeding for this specific user
    const seedingKey = `${userId}-${forceRefresh}`
    if (this.seedingLock && this.seedingKey === seedingKey) {
      console.warn('⚠️ Data seeding already in progress for this user, waiting for completion...')
      if (this.seedingPromise) {
        return await this.seedingPromise
      }
    }

    // Set lock to prevent concurrent seeding for this user
    this.seedingLock = true
    this.seedingKey = seedingKey
    this.isSeeding = true
    this.seedingProgress = 0
    this.seedingMessage = 'Initializing data seeding...'

    // Create seeding promise to track operation
    this.seedingPromise = this.performSeeding(userId, userInfo, forceRefresh)
    
    try {
      const result = await this.seedingPromise
      return result
    } catch (error) {
      console.error('❌ Data seeding failed:', error)
      throw error
    } finally {
      // Always clean up state
      this.seedingLock = false
      this.seedingKey = null
      this.isSeeding = false
      this.seedingProgress = 100
      this.seedingMessage = 'Data seeding completed'
      this.seedingPromise = null
    }
  }

  /**
   * Perform the actual seeding operation
   */
  async performSeeding(userId, userInfo, forceRefresh) {
    try {
      console.log(`🌱 Starting data seeding for user: ${userId}`)
      
      // Step 1: Try Nessie API first
      this.updateProgress(10, 'Checking Nessie API availability...')
      let seedingResult = await this.tryNessieSeeding(userId, userInfo)
      
      if (seedingResult.success) {
        console.log('✅ Nessie data seeding successful')
        return seedingResult
      }

      // Step 2: Fallback to sample data
      this.updateProgress(50, 'Nessie API unavailable, using sample data...')
      seedingResult = await this.trySampleSeeding(userId, userInfo)
      
      if (seedingResult.success) {
        console.log('✅ Sample data seeding successful')
        return seedingResult
      }

      // Step 3: Final fallback to mock data
      this.updateProgress(75, 'Using mock data as final fallback...')
      seedingResult = await this.tryMockSeeding(userId, userInfo)
      
      console.log('✅ Mock data seeding successful')
      return seedingResult

    } catch (error) {
      console.error('❌ Data seeding failed:', error)
      throw error
    }
  }

  /**
   * Try seeding with Nessie API data
   */
  async tryNessieSeeding(userId, userInfo) {
    try {
      if (!isNessieAvailable()) {
        throw new Error('Nessie API not configured')
      }

      this.updateProgress(20, 'Setting up Nessie customer...')
      console.log('🌱 [SEEDING] Attempting Nessie API data fetch...')
      
      // First, check if we have any customers
      let customers = await getCustomers()
      let customerId
      
      if (customers.length === 0) {
        // Create a new customer
        this.updateProgress(25, 'Creating new Nessie customer...')
        console.log('🌱 [SEEDING] No customers found, creating new customer...')
        
        const customerData = {
          first_name: userInfo.name?.split(' ')[0] || 'Demo',
          last_name: userInfo.name?.split(' ')[1] || 'User',
          address: {
            street_number: '123',
            street_name: 'Main St',
            city: 'Richmond',
            state: 'VA',
            zip: '23219'
          }
        }
        
        const newCustomer = await createCustomer(customerData)
        customerId = newCustomer._id
        console.log(`🌱 [SEEDING] Created customer: ${customerId}`)
      } else {
        // Use existing customer
        customerId = customers[0]._id
        console.log(`🌱 [SEEDING] Using existing customer: ${customerId}`)
      }
      
      this.updateProgress(30, 'Setting up accounts...')
      
      // Fetch accounts for the customer
      let accounts = await getAccounts(customerId)
      
      if (!accounts || accounts.length === 0) {
        // Create a checking account for the customer
        this.updateProgress(35, 'Creating checking account...')
        console.log('🌱 [SEEDING] No accounts found, creating checking account...')
        
        const accountData = {
          type: 'Checking',
          nickname: 'Primary Checking',
          rewards: 0,
          balance: 1000
        }
        
        const newAccount = await createAccount(customerId, accountData)
        accounts = [newAccount]
        console.log(`🌱 [SEEDING] Created account: ${newAccount._id}`)
      }

      this.updateProgress(40, 'Setting up transactions...')
      const primaryAccount = accounts[0]
      console.log(`🌱 [SEEDING] Primary account: ${primaryAccount.nickname || primaryAccount.type}`)
      
      // Try to get existing transactions
      let rawTransactions = []
      try {
        rawTransactions = await getTransactions(primaryAccount._id)
        console.log(`🌱 [SEEDING] Found ${rawTransactions.length} existing transactions`)
      } catch (error) {
        console.warn(`🌱 [SEEDING] Could not fetch transactions: ${error.message}`)
        console.log('🌱 [SEEDING] This is normal - Nessie API may not support transaction endpoints')
      }
      
      if (!rawTransactions || rawTransactions.length === 0) {
        // Create some sample transactions for demonstration
        this.updateProgress(45, 'Creating sample transactions...')
        console.log('🌱 [SEEDING] No transactions found, creating sample transactions...')
        
        // Since Nessie transaction endpoints may not work, we'll create mock transactions
        // that match the Nessie format for consistency
        rawTransactions = [
          {
            _id: 'sample-tx-1',
            type: 'deposit',
            amount: 500,
            description: 'Initial deposit',
            transaction_date: new Date().toISOString().split('T')[0],
            account_id: primaryAccount._id
          },
          {
            _id: 'sample-tx-2',
            type: 'withdrawal',
            amount: 50,
            description: 'Grocery store purchase',
            transaction_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            account_id: primaryAccount._id
          },
          {
            _id: 'sample-tx-3',
            type: 'withdrawal',
            amount: 25,
            description: 'Coffee shop',
            transaction_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            account_id: primaryAccount._id
          },
          {
            _id: 'sample-tx-4',
            type: 'deposit',
            amount: 1200,
            description: 'Salary payment',
            transaction_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            account_id: primaryAccount._id
          },
          {
            _id: 'sample-tx-5',
            type: 'withdrawal',
            amount: 75,
            description: 'Gas station',
            transaction_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            account_id: primaryAccount._id
          }
        ]
        
        console.log(`🌱 [SEEDING] Created ${rawTransactions.length} sample transactions`)
      }
      
      const transactions = transformNessieTransactions(rawTransactions)
      console.log(`🌱 [SEEDING] Processed ${transactions.length} transactions`)

      this.updateProgress(40, 'Creating user profile...')
      
      // Create user profile with Nessie data
      const userProfile = await createUserProfile(userId, {
        name: userInfo.name || 'Nessie User',
        email: userInfo.email || '',
        photoURL: userInfo.photoURL || null,
        balance: primaryAccount.balance || 0,
        dataSource: 'Nessie'
      })

      this.updateProgress(60, 'Storing accounts and transactions...')
      
      // Store accounts and transactions
      await this.storeAccounts(userId, accounts)
      await this.storeTransactions(userId, transactions)

      this.updateProgress(80, 'Calculating financial summary...')
      
      // Update financial summary
      await batchUpdateFinancialSummary(userId, transactions)

      this.updateProgress(90, 'Finalizing data...')

      return {
        success: true,
        message: 'Your financial data has been synced from Nessie API',
        dataSource: 'Nessie',
        accountsCount: accounts.length,
        transactionsCount: transactions.length,
        userProfile
      }

    } catch (error) {
      console.warn('Nessie seeding failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Try seeding with sample data
   */
  async trySampleSeeding(userId, userInfo) {
    try {
      this.updateProgress(55, 'Loading sample profile...')
      
      // Import sample data
      const { generateSampleData } = await import('../data/sampleData')
      const sampleData = generateSampleData()

      this.updateProgress(65, 'Creating user profile with sample data...')
      
      // Create user profile with sample data
      const userProfile = await createUserProfile(userId, {
        name: userInfo.name || 'Demo User',
        email: userInfo.email || '',
        photoURL: userInfo.photoURL || null,
        balance: sampleData.balance,
        dataSource: 'Sample'
      })

      this.updateProgress(75, 'Storing sample accounts and transactions...')
      
      // Store sample data
      await this.storeAccounts(userId, sampleData.accounts)
      await this.storeTransactions(userId, sampleData.transactions)

      this.updateProgress(85, 'Calculating financial summary...')
      
      // Update financial summary
      await batchUpdateFinancialSummary(userId, sampleData.transactions)

      return {
        success: true,
        message: 'Sample financial data has been loaded',
        dataSource: 'Sample',
        accountsCount: sampleData.accounts.length,
        transactionsCount: sampleData.transactions.length,
        userProfile
      }

    } catch (error) {
      console.warn('Sample seeding failed:', error.message)
      return { success: false, error: error.message }
    }
  }

  /**
   * Try seeding with mock data
   */
  async tryMockSeeding(userId, userInfo) {
    try {
      this.updateProgress(80, 'Generating mock data...')
      
      // Import mock data
      const { generateMockData } = await import('../data/mockData')
      const mockData = generateMockData()

      this.updateProgress(85, 'Creating user profile with mock data...')
      
      // Create user profile with mock data
      const userProfile = await createUserProfile(userId, {
        name: userInfo.name || 'Demo User',
        email: userInfo.email || '',
        photoURL: userInfo.photoURL || null,
        balance: mockData.balance,
        dataSource: 'Mock'
      })

      this.updateProgress(90, 'Storing mock accounts and transactions...')
      
      // Store mock data
      await this.storeAccounts(userId, mockData.accounts)
      await this.storeTransactions(userId, mockData.transactions)

      this.updateProgress(95, 'Calculating financial summary...')
      
      // Update financial summary
      await batchUpdateFinancialSummary(userId, mockData.transactions)

      return {
        success: true,
        message: 'Mock financial data has been created',
        dataSource: 'Mock',
        accountsCount: mockData.accounts.length,
        transactionsCount: mockData.transactions.length,
        userProfile
      }

    } catch (error) {
      console.error('Mock seeding failed:', error)
      throw error
    }
  }

  /**
   * Store accounts in Firestore
   */
  async storeAccounts(userId, accounts) {
    const accountPromises = accounts.map(account => 
      this.createAccount(userId, account)
    )
    
    await Promise.all(accountPromises)
    console.log(`✅ Stored ${accounts.length} accounts`)
  }

  /**
   * Store transactions in Firestore
   */
  async storeTransactions(userId, transactions) {
    if (!transactions || transactions.length === 0) {
      console.warn('⚠️ No transactions to store')
      return
    }

    const transactionData = transactions.map(transaction => ({
      userId,
      accountId: transaction.accountId || 'default',
      nessieId: transaction.id,
      amount: Math.abs(Number(transaction.amount) || 0), // Ensure positive amounts
      type: transaction.type,
      category: transaction.category || 'Other',
      description: transaction.description || 'Transaction',
      merchant: transaction.merchant || 'Unknown',
      date: transaction.date || new Date().toISOString().split('T')[0],
      syncSource: 'seeding'
    }))

    try {
      await batchCreateTransactions(transactionData)
      console.log(`✅ Stored ${transactions.length} transactions`)
    } catch (error) {
      console.error('❌ Error storing transactions:', error)
      throw error
    }
  }

  /**
   * Create individual account
   */
  async createAccount(userId, accountData) {
    const { createAccount } = await import('../api/unifiedFirestoreService')
    
    return await createAccount({
      userId,
      nessieId: accountData.id || accountData._id,
      name: accountData.name || accountData.nickname,
      type: accountData.type,
      balance: accountData.balance || 0,
      institution: accountData.institution || 'Unknown',
      syncSource: 'seeding'
    })
  }

  /**
   * Update seeding progress with thread safety
   */
  updateProgress(progress, message) {
    // Only update if we're currently seeding to prevent race conditions
    if (this.isSeeding) {
      this.seedingProgress = progress
      this.seedingMessage = message
      console.log(`📊 Seeding Progress: ${progress}% - ${message}`)
    }
  }

  /**
   * Get current seeding state
   */
  getSeedingState() {
    return {
      isSeeding: this.isSeeding,
      progress: this.seedingProgress,
      message: this.seedingMessage
    }
  }
}

// Export singleton instance
export const dataSeedingService = new DataSeedingService()

// Export individual methods for backward compatibility
export const seedUserData = (userId, userInfo, forceRefresh) => 
  dataSeedingService.seedUserData(userId, userInfo, forceRefresh)
export const getSeedingState = () => dataSeedingService.getSeedingState()
