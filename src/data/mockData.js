// Mock data generator for RetroVault
const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel']
const incomeSources = ['Salary', 'Freelance', 'Investment', 'Bonus', 'Side Hustle']

// Generate random date within last 30 days
const getRandomDate = () => {
  const now = new Date()
  const randomDays = Math.floor(Math.random() * 30)
  const date = new Date(now.getTime() - randomDays * 24 * 60 * 60 * 1000)
  return date.toISOString().split('T')[0]
}

// Generate random amount
const getRandomAmount = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Generate random merchant
const getRandomMerchant = () => {
  const merchants = [
    'Amazon', 'Target', 'Walmart', 'Starbucks', 'McDonald\'s', 'Shell', 'BP',
    'Uber', 'Netflix', 'Spotify', 'Apple', 'Google', 'Microsoft', 'Whole Foods',
    'CVS', 'Walgreens', 'Home Depot', 'Lowe\'s', 'Best Buy', 'Costco', 'Sam\'s Club'
  ]
  return merchants[Math.floor(Math.random() * merchants.length)]
}

// Generate transactions
export const generateTransactions = () => {
  const transactions = []
  
  // Generate 50 transactions for better financial analysis
  for (let i = 0; i < 50; i++) {
    const isIncome = Math.random() < 0.2 // 20% chance of income (more realistic)
    const amount = isIncome ? getRandomAmount(500, 5000) : getRandomAmount(5, 300)
    
    transactions.push({
      id: `mock-tx-${i + 1}`,
      date: getRandomDate(),
      category: isIncome ? incomeSources[Math.floor(Math.random() * incomeSources.length)] : categories[Math.floor(Math.random() * categories.length)],
      amount: amount,
      type: isIncome ? 'income' : 'expense',
      description: isIncome ? 
        `${incomeSources[Math.floor(Math.random() * incomeSources.length)]} payment` : 
        `${categories[Math.floor(Math.random() * categories.length)].toLowerCase()} purchase`,
      merchant: isIncome ? 'Employer' : getRandomMerchant(),
      accountId: 'mock-checking-001'
    })
  }
  
  return transactions.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Generate savings data for last 6 months
export const generateSavings = () => {
  const savings = []
  const now = new Date()
  
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const month = date.toLocaleString('default', { month: 'short' })
    const amount = getRandomAmount(800, 2000) + (i * 100) // Slight upward trend
    
    savings.push({
      month: month,
      amount: amount,
      year: date.getFullYear()
    })
  }
  
  return savings
}

// Generate spending breakdown
export const generateSpendingBreakdown = (transactions) => {
  const breakdown = {}
  
  // Initialize categories
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

// Generate weekly balance data
export const generateWeeklyBalance = (transactions) => {
  const weeklyData = []
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Calculate running balance
  let balance = 2000 // Starting balance
  const sortedTransactions = transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
  
  days.forEach((day, index) => {
    // Add some random daily variation
    const variation = getRandomAmount(-50, 100)
    balance += variation
    
    // Generate mock income and expenses for this day
    const dayIncome = Math.random() > 0.7 ? getRandomAmount(50, 200) : 0
    const dayExpenses = Math.random() > 0.3 ? getRandomAmount(20, 150) : 0
    const netChange = dayIncome - dayExpenses
    const transactionCount = Math.floor(Math.random() * 5) + 1
    
    weeklyData.push({
      day,
      balance: Math.max(0, balance), // Ensure balance doesn't go negative
      income: dayIncome,
      expenses: dayExpenses,
      netChange: netChange,
      transactionCount: transactionCount
    })
  })
  
  return weeklyData
}

// Get color for category
const getCategoryColor = (category) => {
  const colors = {
    'Food': '#FF6B6B',
    'Transport': '#4ECDC4',
    'Entertainment': '#45B7D1',
    'Shopping': '#96CEB4',
    'Bills': '#FFEAA7',
    'Healthcare': '#DDA0DD',
    'Education': '#98D8C8',
    'Travel': '#F7DC6F'
  }
  return colors[category] || '#95A5A6'
}

// Calculate total balance
export const calculateBalance = (transactions) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  return income - expenses
}

// Generate AI insight based on data
export const generateAIInsight = (transactions, savings) => {
  const insights = [
    "You've saved 12% more than last month. Keep it up!",
    "Your spending on entertainment decreased by $45, which shows great discipline.",
    "Consider setting up an automatic transfer to your savings account.",
    "Your food expenses are 15% higher than average. Try meal planning!",
    "Great job! You're on track to meet your savings goal this month.",
    "Your transportation costs have decreased by 20% this month.",
    "Consider investing in a high-yield savings account for better returns.",
    "You're spending wisely on essentials. Keep up the good work!"
  ]
  
  return insights[Math.floor(Math.random() * insights.length)]
}

// Generate accounts
export const generateAccounts = () => {
  return [
    {
      id: 'mock-checking-001',
      name: 'Primary Checking',
      type: 'Checking',
      balance: 2500.00,
      institution: 'Mock Bank',
      accountNumber: '****1234',
      routingNumber: '123456789'
    },
    {
      id: 'mock-savings-001',
      name: 'Emergency Fund',
      type: 'Savings',
      balance: 5000.00,
      institution: 'Mock Bank',
      accountNumber: '****5678',
      routingNumber: '123456789'
    },
    {
      id: 'mock-credit-001',
      name: 'Credit Card',
      type: 'Credit Card',
      balance: -800.50,
      institution: 'Mock Credit Union',
      accountNumber: '****9012',
      routingNumber: '987654321'
    }
  ]
}

// Generate complete mock dataset
export const generateMockData = () => {
  const accounts = generateAccounts()
  const transactions = generateTransactions()
  const savings = generateSavings()
  const spendingBreakdown = generateSpendingBreakdown(transactions)
  const weeklyBalance = generateWeeklyBalance(transactions)
  const balance = calculateBalance(transactions)
  const aiInsight = generateAIInsight(transactions, savings)
  
  return {
    accounts,
    transactions,
    savings,
    spendingBreakdown,
    weeklyBalance,
    balance,
    aiInsight,
    lastUpdated: new Date().toLocaleString()
  }
}
