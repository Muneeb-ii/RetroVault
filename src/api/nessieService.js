// Capital One Nessie API Service
// Updated to use the correct Nessie API endpoint: api.nessieisreal.com
const NESSIE_API_BASE = 'http://api.nessieisreal.com'

/**
 * Get all customers (to find available customer IDs)
 * @returns {Promise<Array>} Array of customer objects
 */
export const getCustomers = async () => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    console.log('🔍 [NESSIE] Fetching customers...')
    const url = `${NESSIE_API_BASE}/customers?key=${apiKey}`
    console.log(`🔍 [NESSIE] Request URL: ${url}`)

    const response = await fetch(url)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NESSIE] API Error: ${response.status} ${response.statusText}`)
      console.error(`❌ [NESSIE] Error details: ${errorText}`)
      throw new Error(`Nessie API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const customers = await response.json()
    console.log(`✅ [NESSIE] Found ${customers.length} customers`)
    return customers

  } catch (error) {
    console.error('❌ [NESSIE] Error fetching customers:', error)
    throw error
  }
}

/**
 * Create a new customer
 * @param {Object} customerData - Customer information
 * @returns {Promise<Object>} Created customer object
 */
export const createCustomer = async (customerData) => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    console.log('🔍 [NESSIE] Creating customer...')
    const url = `${NESSIE_API_BASE}/customers?key=${apiKey}`
    console.log(`🔍 [NESSIE] Request URL: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NESSIE] API Error: ${response.status} ${response.statusText}`)
      console.error(`❌ [NESSIE] Error details: ${errorText}`)
      throw new Error(`Nessie API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const customer = await response.json()
    console.log(`✅ [NESSIE] Created customer: ${customer._id}`)
    return customer

  } catch (error) {
    console.error('❌ [NESSIE] Error creating customer:', error)
    throw error
  }
}

/**
 * Create a new account for a customer
 * @param {string} customerId - Customer ID
 * @param {Object} accountData - Account information
 * @returns {Promise<Object>} Created account object
 */
export const createAccount = async (customerId, accountData) => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    console.log('🔍 [NESSIE] Creating account...')
    const url = `${NESSIE_API_BASE}/customers/${customerId}/accounts?key=${apiKey}`
    console.log(`🔍 [NESSIE] Request URL: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(accountData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NESSIE] API Error: ${response.status} ${response.statusText}`)
      console.error(`❌ [NESSIE] Error details: ${errorText}`)
      throw new Error(`Nessie API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const account = await response.json()
    console.log(`✅ [NESSIE] Created account: ${account._id}`)
    return account

  } catch (error) {
    console.error('❌ [NESSIE] Error creating account:', error)
    throw error
  }
}

/**
 * Get all accounts for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Array>} Array of account objects
 */
export const getAccounts = async (customerId) => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    console.log('🔍 [NESSIE] Attempting to fetch accounts...')
    console.log(`🔍 [NESSIE] API Base: ${NESSIE_API_BASE}`)
    console.log(`🔍 [NESSIE] Customer ID: ${customerId}`)
    console.log(`🔍 [NESSIE] API Key: ${apiKey.substring(0, 8)}...`)

    const url = `${NESSIE_API_BASE}/customers/${customerId}/accounts?key=${apiKey}`
    console.log(`🔍 [NESSIE] Request URL: ${url}`)

    const response = await fetch(url)
    
    console.log(`🔍 [NESSIE] Response status: ${response.status}`)
    console.log(`🔍 [NESSIE] Response headers:`, Object.fromEntries(response.headers.entries()))
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NESSIE] API Error: ${response.status} ${response.statusText}`)
      console.error(`❌ [NESSIE] Error details: ${errorText}`)
      throw new Error(`Nessie API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const accounts = await response.json()
    console.log(`✅ [NESSIE] Successfully fetched ${accounts.length} accounts`)
    return accounts

  } catch (error) {
    console.error('❌ [NESSIE] Error fetching accounts:', error)
    
    // Check if it's a network/DNS error
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      console.error('❌ [NESSIE] Network error - API endpoint may be down or DNS issue')
    }
    
    throw error
  }
}

/**
 * Create a transaction for an account
 * @param {string} accountId - Account ID
 * @param {Object} transactionData - Transaction information
 * @returns {Promise<Object>} Created transaction object
 */
export const createTransaction = async (accountId, transactionData) => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    console.log('🔍 [NESSIE] Creating transaction...')
    const url = `${NESSIE_API_BASE}/accounts/${accountId}/transactions?key=${apiKey}`
    console.log(`🔍 [NESSIE] Request URL: ${url}`)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData)
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error(`❌ [NESSIE] API Error: ${response.status} ${response.statusText}`)
      console.error(`❌ [NESSIE] Error details: ${errorText}`)
      throw new Error(`Nessie API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const transaction = await response.json()
    console.log(`✅ [NESSIE] Created transaction: ${transaction._id}`)
    return transaction

  } catch (error) {
    console.error('❌ [NESSIE] Error creating transaction:', error)
    throw error
  }
}

/**
 * Get transactions for a specific account
 * @param {string} accountId - Account ID
 * @param {string} startDate - Start date (YYYY-MM-DD)
 * @param {string} endDate - End date (YYYY-MM-DD)
 * @returns {Promise<Array>} Array of transaction objects
 */
export const getTransactions = async (accountId, startDate = null, endDate = null) => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    // Default to last 30 days if no dates provided
    const defaultEndDate = new Date().toISOString().split('T')[0]
    const defaultStartDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    
    const start = startDate || defaultStartDate
    const end = endDate || defaultEndDate

    const response = await fetch(
      `${NESSIE_API_BASE}/accounts/${accountId}/transactions?key=${apiKey}&type=deposit&type=withdrawal&begin_date=${start}&end_date=${end}`
    )
    
    if (!response.ok) {
      throw new Error(`Nessie API error: ${response.status} ${response.statusText}`)
    }

    const transactions = await response.json()
    return transactions

  } catch (error) {
    console.error('Error fetching transactions from Nessie:', error)
    throw error
  }
}

/**
 * Get account details by ID
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} Account object
 */
export const getAccountDetails = async (accountId) => {
  try {
    const apiKey = import.meta.env.VITE_NESSIE_API_KEY
    
    if (!apiKey || apiKey === 'your_nessie_api_key_here') {
      throw new Error('Nessie API key not configured')
    }

    const response = await fetch(`${NESSIE_API_BASE}/accounts/${accountId}?key=${apiKey}`)
    
    if (!response.ok) {
      throw new Error(`Nessie API error: ${response.status} ${response.statusText}`)
    }

    const account = await response.json()
    return account

  } catch (error) {
    console.error('Error fetching account details from Nessie:', error)
    throw error
  }
}

/**
 * Transform Nessie transactions to our format
 * @param {Array} nessieTransactions - Raw Nessie transaction data
 * @returns {Array} Formatted transaction objects
 */
export const transformNessieTransactions = (nessieTransactions) => {
  return nessieTransactions.map(transaction => ({
    id: transaction._id,
    date: transaction.transaction_date,
    category: categorizeTransaction(transaction.description),
    amount: Math.abs(transaction.amount),
    type: transaction.amount > 0 ? 'income' : 'expense',
    description: transaction.description,
    merchant: transaction.merchant_id || 'Unknown',
    accountId: transaction.account_id
  }))
}

/**
 * Categorize transaction based on description
 * @param {string} description - Transaction description
 * @returns {string} Category name
 */
const categorizeTransaction = (description) => {
  const desc = description.toLowerCase()
  
  if (desc.includes('grocery') || desc.includes('food') || desc.includes('restaurant') || desc.includes('dining')) {
    return 'Food'
  }
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('uber') || desc.includes('lyft') || desc.includes('transport')) {
    return 'Transport'
  }
  if (desc.includes('entertainment') || desc.includes('movie') || desc.includes('netflix') || desc.includes('spotify')) {
    return 'Entertainment'
  }
  if (desc.includes('shopping') || desc.includes('amazon') || desc.includes('store') || desc.includes('retail')) {
    return 'Shopping'
  }
  if (desc.includes('bill') || desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
    return 'Bills'
  }
  if (desc.includes('medical') || desc.includes('doctor') || desc.includes('pharmacy') || desc.includes('health')) {
    return 'Healthcare'
  }
  if (desc.includes('education') || desc.includes('school') || desc.includes('course') || desc.includes('book')) {
    return 'Education'
  }
  if (desc.includes('travel') || desc.includes('hotel') || desc.includes('flight') || desc.includes('vacation')) {
    return 'Travel'
  }
  
  return 'Other'
}

/**
 * Calculate savings data from transactions
 * @param {Array} transactions - Formatted transaction data
 * @returns {Array} Savings data for charts
 */
export const calculateSavingsFromTransactions = (transactions) => {
  // Group transactions by month
  const monthlyData = {}
  
  transactions.forEach(transaction => {
    const date = new Date(transaction.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0 }
    }
    
    if (transaction.type === 'income') {
      monthlyData[monthKey].income += transaction.amount
    } else {
      monthlyData[monthKey].expenses += transaction.amount
    }
  })
  
  // Convert to savings format
  const savings = Object.entries(monthlyData)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      amount: Math.max(0, data.income - data.expenses),
      year: new Date(month + '-01').getFullYear()
    }))
    .sort((a, b) => new Date(a.year, new Date(a.month + ' 1, ' + a.year).getMonth()) - new Date(b.year, new Date(b.month + ' 1, ' + b.year).getMonth()))
  
  return savings
}

/**
 * Calculate spending breakdown from transactions
 * @param {Array} transactions - Formatted transaction data
 * @returns {Array} Spending breakdown for charts
 */
export const calculateSpendingBreakdown = (transactions) => {
  const breakdown = {}
  
  // Initialize categories
  const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other']
  categories.forEach(category => {
    breakdown[category] = 0
  })
  
  // Sum up expenses by category
  transactions.forEach(transaction => {
    if (transaction.type === 'expense' && breakdown.hasOwnProperty(transaction.category)) {
      breakdown[transaction.category] += transaction.amount
    }
  })
  
  // Convert to array format for charts
  return Object.entries(breakdown)
    .map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name)
    }))
    .filter(item => item.value > 0)
}

/**
 * Get color for category
 */
const getCategoryColor = (category) => {
  const colors = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Entertainment': '#45B7D1',
    'Shopping': '#96CEB4',
    'Bills': '#FFEAA7',
    'Healthcare': '#DDA0DD',
    'Education': '#98D8C8',
    'Travel': '#F7DC6F',
    'Other': '#95A5A6'
  }
  return colors[category] || '#95A5A6'
}

/**
 * Check if Nessie API is available
 * @returns {boolean} True if API key is configured
 */
export const isNessieAvailable = () => {
  const apiKey = import.meta.env.VITE_NESSIE_API_KEY
  return apiKey && apiKey !== 'your_nessie_api_key_here'
}
