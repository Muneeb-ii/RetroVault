// Sample Data Generator for RetroVault
// Provides realistic sample financial data for new users

/**
 * Generate comprehensive sample financial data
 */
export const generateSampleData = () => {
  const accounts = generateSampleAccounts()
  const transactions = generateSampleTransactions()
  
  // Calculate balance from transactions
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const balance = totalIncome - totalExpenses

  return {
    balance: Math.max(0, balance),
    accounts,
    transactions
  }
}

/**
 * Generate sample accounts
 */
const generateSampleAccounts = () => {
  return [
    {
      id: 'sample-checking-001',
      name: 'Primary Checking',
      type: 'Checking',
      balance: 2450.75,
      institution: 'Sample Bank',
      accountNumber: '****1234',
      routingNumber: '123456789'
    },
    {
      id: 'sample-savings-001',
      name: 'Emergency Fund',
      type: 'Savings',
      balance: 5000.00,
      institution: 'Sample Bank',
      accountNumber: '****5678',
      routingNumber: '123456789'
    },
    {
      id: 'sample-credit-001',
      name: 'Credit Card',
      type: 'Credit Card',
      balance: -1250.30,
      institution: 'Sample Credit Union',
      accountNumber: '****9012',
      routingNumber: '987654321'
    }
  ]
}

/**
 * Generate sample transactions
 */
const generateSampleTransactions = () => {
  const transactions = []
  const today = new Date()
  
  // Income transactions - more comprehensive
  const incomeTransactions = [
    { amount: 3500, description: 'Salary - Tech Corp', category: 'Income', type: 'income', daysAgo: 0 },
    { amount: 3500, description: 'Salary - Tech Corp', category: 'Income', type: 'income', daysAgo: 30 },
    { amount: 3500, description: 'Salary - Tech Corp', category: 'Income', type: 'income', daysAgo: 60 },
    { amount: 3500, description: 'Salary - Tech Corp', category: 'Income', type: 'income', daysAgo: 90 },
    { amount: 500, description: 'Freelance Project', category: 'Income', type: 'income', daysAgo: 15 },
    { amount: 200, description: 'Cashback Reward', category: 'Income', type: 'income', daysAgo: 5 },
    { amount: 150, description: 'Investment Dividend', category: 'Income', type: 'income', daysAgo: 10 },
    { amount: 300, description: 'Side Hustle', category: 'Income', type: 'income', daysAgo: 20 },
    { amount: 100, description: 'Referral Bonus', category: 'Income', type: 'income', daysAgo: 25 }
  ]
  
  // Expense transactions
  const expenseTransactions = [
    // Food & Dining
    { amount: 45.50, description: 'Grocery Store', category: 'Food', type: 'expense', daysAgo: 1 },
    { amount: 28.75, description: 'Restaurant - Italian', category: 'Food', type: 'expense', daysAgo: 2 },
    { amount: 12.50, description: 'Coffee Shop', category: 'Food', type: 'expense', daysAgo: 3 },
    { amount: 65.20, description: 'Grocery Store', category: 'Food', type: 'expense', daysAgo: 7 },
    { amount: 35.80, description: 'Fast Food', category: 'Food', type: 'expense', daysAgo: 4 },
    { amount: 42.30, description: 'Restaurant - Asian', category: 'Food', type: 'expense', daysAgo: 8 },
    
    // Transportation
    { amount: 45.00, description: 'Gas Station', category: 'Transport', type: 'expense', daysAgo: 2 },
    { amount: 25.50, description: 'Uber Ride', category: 'Transport', type: 'expense', daysAgo: 5 },
    { amount: 12.00, description: 'Public Transit', category: 'Transport', type: 'expense', daysAgo: 6 },
    { amount: 38.75, description: 'Gas Station', category: 'Transport', type: 'expense', daysAgo: 10 },
    
    // Entertainment
    { amount: 15.99, description: 'Netflix Subscription', category: 'Entertainment', type: 'expense', daysAgo: 0 },
    { amount: 9.99, description: 'Spotify Premium', category: 'Entertainment', type: 'expense', daysAgo: 0 },
    { amount: 25.00, description: 'Movie Theater', category: 'Entertainment', type: 'expense', daysAgo: 3 },
    { amount: 45.00, description: 'Concert Tickets', category: 'Entertainment', type: 'expense', daysAgo: 12 },
    
    // Shopping
    { amount: 89.99, description: 'Amazon Purchase', category: 'Shopping', type: 'expense', daysAgo: 4 },
    { amount: 125.50, description: 'Clothing Store', category: 'Shopping', type: 'expense', daysAgo: 6 },
    { amount: 35.75, description: 'Online Store', category: 'Shopping', type: 'expense', daysAgo: 9 },
    
    // Bills & Utilities
    { amount: 120.00, description: 'Electric Bill', category: 'Bills', type: 'expense', daysAgo: 5 },
    { amount: 85.50, description: 'Internet Bill', category: 'Bills', type: 'expense', daysAgo: 5 },
    { amount: 45.00, description: 'Phone Bill', category: 'Bills', type: 'expense', daysAgo: 5 },
    { amount: 950.00, description: 'Rent Payment', category: 'Bills', type: 'expense', daysAgo: 1 },
    
    // Healthcare
    { amount: 25.00, description: 'Pharmacy', category: 'Healthcare', type: 'expense', daysAgo: 7 },
    { amount: 150.00, description: 'Doctor Visit', category: 'Healthcare', type: 'expense', daysAgo: 14 },
    { amount: 45.00, description: 'Dental Checkup', category: 'Healthcare', type: 'expense', daysAgo: 20 },
    
    // Education
    { amount: 299.00, description: 'Online Course', category: 'Education', type: 'expense', daysAgo: 10 },
    { amount: 45.00, description: 'Books', category: 'Education', type: 'expense', daysAgo: 15 },
    
    // Travel
    { amount: 450.00, description: 'Flight Tickets', category: 'Travel', type: 'expense', daysAgo: 25 },
    { amount: 120.00, description: 'Hotel Booking', category: 'Travel', type: 'expense', daysAgo: 25 },
    { amount: 75.00, description: 'Car Rental', category: 'Travel', type: 'expense', daysAgo: 25 },
    
    // Other
    { amount: 15.00, description: 'ATM Withdrawal', category: 'Other', type: 'expense', daysAgo: 3 },
    { amount: 25.00, description: 'Bank Fee', category: 'Other', type: 'expense', daysAgo: 8 },
    { amount: 50.00, description: 'Charity Donation', category: 'Other', type: 'expense', daysAgo: 12 },
    
    // Additional transactions for better analysis
    { amount: 18.75, description: 'Coffee Shop', category: 'Food', type: 'expense', daysAgo: 11 },
    { amount: 32.40, description: 'Grocery Store', category: 'Food', type: 'expense', daysAgo: 13 },
    { amount: 22.50, description: 'Gas Station', category: 'Transport', type: 'expense', daysAgo: 14 },
    { amount: 8.99, description: 'Streaming Service', category: 'Entertainment', type: 'expense', daysAgo: 16 },
    { amount: 67.50, description: 'Online Purchase', category: 'Shopping', type: 'expense', daysAgo: 17 },
    { amount: 35.00, description: 'Gym Membership', category: 'Healthcare', type: 'expense', daysAgo: 18 },
    { amount: 28.90, description: 'Restaurant', category: 'Food', type: 'expense', daysAgo: 19 },
    { amount: 45.00, description: 'Uber Ride', category: 'Transport', type: 'expense', daysAgo: 21 },
    { amount: 12.50, description: 'Coffee Shop', category: 'Food', type: 'expense', daysAgo: 22 },
    { amount: 89.99, description: 'Online Course', category: 'Education', type: 'expense', daysAgo: 23 },
    { amount: 15.00, description: 'Parking Fee', category: 'Transport', type: 'expense', daysAgo: 24 },
    { amount: 42.30, description: 'Grocery Store', category: 'Food', type: 'expense', daysAgo: 26 },
    { amount: 55.00, description: 'Restaurant', category: 'Food', type: 'expense', daysAgo: 27 },
    { amount: 19.99, description: 'App Subscription', category: 'Entertainment', type: 'expense', daysAgo: 28 },
    { amount: 75.00, description: 'Clothing Store', category: 'Shopping', type: 'expense', daysAgo: 29 }
  ]
  
  // Combine and format all transactions
  const allTransactions = [...incomeTransactions, ...expenseTransactions]
  
  allTransactions.forEach((transaction, index) => {
    const date = new Date(today)
    date.setDate(date.getDate() - transaction.daysAgo)
    
    transactions.push({
      id: `sample-tx-${index + 1}`,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      date: date.toISOString().split('T')[0],
      merchant: getMerchantForTransaction(transaction.description),
      accountId: getAccountIdForTransaction(transaction.type)
    })
  })
  
  // Sort by date (newest first)
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
}

/**
 * Get merchant name for transaction
 */
const getMerchantForTransaction = (description) => {
  const merchantMap = {
    'Grocery Store': 'Whole Foods',
    'Restaurant - Italian': 'Mario\'s Italian',
    'Coffee Shop': 'Starbucks',
    'Fast Food': 'McDonald\'s',
    'Restaurant - Asian': 'Golden Dragon',
    'Gas Station': 'Shell',
    'Uber Ride': 'Uber',
    'Public Transit': 'Metro Transit',
    'Movie Theater': 'AMC Theaters',
    'Concert Tickets': 'Ticketmaster',
    'Amazon Purchase': 'Amazon',
    'Clothing Store': 'Target',
    'Online Store': 'Shopify Store',
    'Electric Bill': 'Power Company',
    'Internet Bill': 'Internet Provider',
    'Phone Bill': 'Mobile Carrier',
    'Rent Payment': 'Property Management',
    'Pharmacy': 'CVS Pharmacy',
    'Doctor Visit': 'Medical Center',
    'Dental Checkup': 'Dental Clinic',
    'Online Course': 'Udemy',
    'Books': 'Barnes & Noble',
    'Flight Tickets': 'Delta Airlines',
    'Hotel Booking': 'Marriott',
    'Car Rental': 'Enterprise',
    'ATM Withdrawal': 'Bank ATM',
    'Bank Fee': 'Bank',
    'Charity Donation': 'Red Cross'
  }
  
  return merchantMap[description] || 'Unknown Merchant'
}

/**
 * Get account ID for transaction type
 */
const getAccountIdForTransaction = (type) => {
  if (type === 'income') {
    return 'sample-checking-001' // Income goes to checking
  } else {
    // Expenses can come from different accounts
    const accounts = ['sample-checking-001', 'sample-credit-001']
    return accounts[Math.floor(Math.random() * accounts.length)]
  }
}

export default generateSampleData
