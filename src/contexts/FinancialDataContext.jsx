// Shared Financial Data Context for all tabs
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseClient'
import { 
  getUserProfile,
  getUserAccounts,
  getUserTransactions,
  updateFinancialSummary,
  listenToUserData,
  listenToUserTransactions
} from '../api/unifiedFirestoreService'

const FinancialDataContext = createContext()

export const useFinancialData = () => {
  const context = useContext(FinancialDataContext)
  if (!context) {
    throw new Error('useFinancialData must be used within a FinancialDataProvider')
  }
  return context
}

export const FinancialDataProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        loadUserData(currentUser.uid)
      } else {
        setUser(null)
        setFinancialData(null)
        setIsLoading(false)
        setError(null)
      }
    })
    return unsubscribe
  }, [])

  const loadUserData = async (userId) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 [CONTEXT] Loading user data for all tabs...')
      console.log('🆔 [CONTEXT] User ID:', userId)
      
      // Load user profile with financial summary
      const userProfile = await getUserProfile(userId)
      console.log('📄 [CONTEXT] User profile loaded:', userProfile ? 'Found' : 'Not found')
      
      if (!userProfile) {
        console.log('🆕 [CONTEXT] No user profile found')
        setFinancialData(null)
        setError('No financial data available. Please ensure your account is properly set up.')
        return
      }

      // Load transactions and accounts using unified service
      const [transactions, accounts] = await Promise.all([
        getUserTransactions(userId, { limitCount: 100 }),
        getUserAccounts(userId, { activeOnly: true })
      ])

      console.log('📊 [CONTEXT] Data loaded:', {
        transactionsCount: transactions.length,
        accountsCount: accounts.length
      })

      // Transform unified data to shared format
      const transformedData = {
        // Core data from unified structure
        balance: userProfile.financialSummary?.totalBalance || 0,
        transactions: transactions,
        accounts: accounts,
        
        // Derived data for charts
        savings: calculateSavingsFromTransactions(transactions),
        spendingBreakdown: calculateSpendingBreakdown(transactions),
        weeklyBalance: generateWeeklyBalance(transactions),
        
        // Metadata from unified structure
        aiInsight: `Your financial data (${accounts.length} accounts, ${transactions.length} transactions)`,
        aiGenerated: false,
        lastUpdated: userProfile.syncStatus?.lastSync 
          ? (userProfile.syncStatus.lastSync.toDate ? userProfile.syncStatus.lastSync.toDate().toLocaleString() : userProfile.syncStatus.lastSync.toString())
          : new Date().toLocaleString(),
        accountInfo: userProfile.metadata || {},
        dataSource: userProfile.dataSource || 'Firestore',
        isConsistent: userProfile.syncStatus?.isConsistent || true,
        
        // User info from unified structure
        user: {
          uid: userId,
          name: userProfile.profile?.name || 'User',
          email: userProfile.profile?.email || '',
          photoURL: userProfile.profile?.photoURL || null
        },
        
        // Financial summary from unified structure
        financialSummary: userProfile.financialSummary || {
          totalBalance: 0,
          totalIncome: 0,
          totalExpenses: 0,
          totalSavings: 0
        }
      }
      
      setFinancialData(transformedData)
      console.log('✅ [CONTEXT] Financial data loaded successfully for all tabs')
      
    } catch (error) {
      console.error('❌ [CONTEXT] Error loading user data:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Helper functions for data transformation
  const calculateSavingsFromTransactions = (transactions) => {
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
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
        amount: Math.max(0, data.income - data.expenses),
        year: new Date(month + '-01').getFullYear()
      }))
      .sort((a, b) => new Date(a.year, new Date(a.month + ' 1, ' + a.year).getMonth()) - new Date(b.year, new Date(b.month + ' 1, ' + b.year).getMonth()))
  }

  const calculateSpendingBreakdown = (transactions) => {
    const breakdown = {}
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other']
    categories.forEach(category => {
      breakdown[category] = 0
    })
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && breakdown.hasOwnProperty(transaction.category)) {
        breakdown[transaction.category] += transaction.amount
      }
    })
    
    return Object.entries(breakdown)
      .map(([name, value]) => ({
        name,
        value,
        color: getCategoryColor(name)
      }))
      .filter(item => item.value > 0)
  }

  const generateWeeklyBalance = (transactions) => {
    // Handle empty or invalid data
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return [
        { day: 'Mon', balance: 0 },
        { day: 'Tue', balance: 0 },
        { day: 'Wed', balance: 0 },
        { day: 'Thu', balance: 0 },
        { day: 'Fri', balance: 0 },
        { day: 'Sat', balance: 0 },
        { day: 'Sun', balance: 0 }
      ]
    }

    const weeklyData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    // Calculate starting balance from all transactions
    const totalIncome = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const totalExpenses = transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    let balance = totalIncome - totalExpenses
    
    // Generate weekly data by calculating balance for each day of the week
    days.forEach((day, index) => {
      // Get transactions for this specific day (last 7 days, going backwards)
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() - (6 - index))
      targetDate.setHours(0, 0, 0, 0)
      
      const nextDay = new Date(targetDate)
      nextDay.setDate(nextDay.getDate() + 1)
      
      const dayTransactions = transactions.filter(t => {
        if (!t.date) return false
        const transactionDate = new Date(t.date)
        return transactionDate >= targetDate && transactionDate < nextDay
      })
      
      // Calculate net change for this day
      const dailyChange = dayTransactions.reduce((sum, t) => {
        const amount = parseFloat(t.amount) || 0
        return sum + (t.type === 'income' ? amount : -amount)
      }, 0)
      
      // Update balance for this day
      balance += dailyChange
      
      weeklyData.push({
        day,
        balance: Math.max(0, Math.round(balance))
      })
    })
    
    return weeklyData
  }

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

  // Add real-time data refresh functionality
  const refreshData = async () => {
    if (user) {
      await loadUserData(user.uid)
    }
  }

  // Add data update functionality for components
  const updateData = async () => {
    if (user) {
      // Update financial summary when data changes
      await updateFinancialSummary(user.uid)
      await loadUserData(user.uid)
    }
  }

  const value = {
    user,
    financialData,
    isLoading,
    error,
    loadUserData,
    refreshData,
    updateData,
    // Helper functions
    calculateSavingsFromTransactions,
    calculateSpendingBreakdown,
    generateWeeklyBalance,
    getCategoryColor
  }

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  )
}
