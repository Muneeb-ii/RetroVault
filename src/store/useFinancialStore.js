import { create } from 'zustand'
import { generateMockData } from '../data/mockData'
import { getFinancialInsights } from '../api/aiService'
import { 
  getAccounts, 
  getTransactions, 
  transformNessieTransactions, 
  calculateSavingsFromTransactions, 
  calculateSpendingBreakdown,
  isNessieAvailable 
} from '../api/nessieService'

const useFinancialStore = create((set, get) => ({
  // Initial state
  data: generateMockData(),
  isLoading: false,
  dataSource: 'mock', // 'nessie' or 'mock'
  accounts: [],
  
  // Actions
  refreshData: async () => {
    set({ isLoading: true })
    
    try {
      let newData
      let dataSource = 'mock'
      
      // Try to use Nessie API if available
      if (isNessieAvailable()) {
        try {
          const accounts = await getAccounts()
          if (accounts && accounts.length > 0) {
            const primaryAccount = accounts[0]
            const rawTransactions = await getTransactions(primaryAccount._id)
            const transactions = transformNessieTransactions(rawTransactions)
            
            // Calculate derived data
            const savings = calculateSavingsFromTransactions(transactions)
            const spendingBreakdown = calculateSpendingBreakdown(transactions)
            const balance = primaryAccount.balance || 0
            
            // Calculate weekly balance (simplified)
            const weeklyBalance = generateWeeklyBalanceFromTransactions(transactions)
            
            newData = {
              transactions,
              savings,
              spendingBreakdown,
              weeklyBalance,
              balance,
              aiInsight: 'Analyzing your real financial data...',
              aiGenerated: false,
              lastUpdated: new Date().toLocaleString(),
              accountInfo: {
                accountId: primaryAccount._id,
                accountType: primaryAccount.type,
                accountName: primaryAccount.nickname || 'Primary Account'
              }
            }
            
            dataSource = 'nessie'
            set({ accounts, dataSource })
          }
        } catch (error) {
          console.error('Nessie API failed, falling back to mock data:', error)
        }
      }
      
      // Fallback to mock data if Nessie fails or is unavailable
      if (!newData) {
        newData = generateMockData()
        dataSource = 'mock'
      }
      
      // Generate AI insights
      try {
        const aiInsights = await getFinancialInsights(newData.transactions, newData.savings)
        newData.aiInsight = aiInsights.join(' ')
        newData.aiGenerated = true
      } catch (error) {
        console.error('Failed to generate AI insights:', error)
        newData.aiGenerated = false
      }
      
      set({ 
        data: newData,
        dataSource,
        isLoading: false 
      })
      
    } catch (error) {
      console.error('Error refreshing data:', error)
      const fallbackData = generateMockData()
      set({ 
        data: fallbackData,
        dataSource: 'mock',
        isLoading: false 
      })
    }
  },
  
  // Getter functions for computed values
  getTotalIncome: () => {
    const { data } = get()
    return data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  getTotalExpenses: () => {
    const { data } = get()
    return data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  getRecentTransactions: (limit = 5) => {
    const { data } = get()
    return data.transactions.slice(0, limit)
  },
  
  getTopSpendingCategory: () => {
    const { data } = get()
    if (data.spendingBreakdown.length === 0) return null
    
    return data.spendingBreakdown.reduce((max, category) => 
      category.value > max.value ? category : max
    )
  },
  
  // Set data directly (for Firestore integration)
  setData: (newData) => {
    set({ data: newData })
  }
}))

// Helper function to generate weekly balance from transactions
const generateWeeklyBalanceFromTransactions = (transactions) => {
  const weeklyData = []
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  
  // Calculate running balance
  let balance = 2000 // Starting balance
  const sortedTransactions = transactions.sort((a, b) => new Date(a.date) - new Date(b.date))
  
  days.forEach((day, index) => {
    // Add some daily variation based on recent transactions
    const recentTransactions = sortedTransactions.filter(t => 
      new Date(t.date) >= new Date(Date.now() - (7 - index) * 24 * 60 * 60 * 1000)
    )
    
    const dayIncome = recentTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const dayExpenses = recentTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const dailyChange = dayIncome - dayExpenses
    balance += dailyChange / 7 // Spread over the week
    
    weeklyData.push({
      day,
      balance: Math.max(0, Math.round(balance)),
      income: Math.round(dayIncome),
      expenses: Math.round(dayExpenses),
      netChange: Math.round(dailyChange),
      transactionCount: recentTransactions.length
    })
  })
  
  return weeklyData
}

export default useFinancialStore
