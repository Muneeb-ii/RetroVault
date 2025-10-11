// Shared Financial Data Context for all tabs
import { createContext, useContext, useState, useEffect } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { auth } from '../firebaseClient'
import { getUserData, getUserTransactions, getUserAccounts } from '../firebaseClient'

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
      
      // Load user document
      const userData = await getUserData(userId)
      console.log('📄 [CONTEXT] User data loaded:', userData ? 'Found' : 'Not found')
      
      if (!userData) {
        console.log('🆕 [CONTEXT] No user data found')
        setFinancialData(null)
        setError('No financial data available. Please ensure your account is properly set up.')
        return
      }

      // Load transactions and accounts
      const [transactions, accounts] = await Promise.all([
        getUserTransactions(userId),
        getUserAccounts(userId)
      ])

      console.log('📊 [CONTEXT] Data loaded:', {
        transactionsCount: transactions.length,
        accountsCount: accounts.length
      })

      // Transform Firestore data to shared format
      const transformedData = {
        // Core data
        balance: userData.balance || 0,
        transactions: transactions,
        accounts: accounts,
        
        // Derived data for charts
        savings: calculateSavingsFromTransactions(transactions),
        spendingBreakdown: calculateSpendingBreakdown(transactions),
        weeklyBalance: generateWeeklyBalance(transactions),
        
        // Metadata
        aiInsight: `Your financial data (${accounts.length} accounts, ${transactions.length} transactions)`,
        aiGenerated: false,
        lastUpdated: userData.dataConsistency?.lastSync || new Date().toLocaleString(),
        accountInfo: userData.accountInfo || {},
        dataSource: userData.dataSource || 'Firestore',
        isConsistent: true,
        
        // User info
        user: {
          uid: userId,
          name: userData.name || 'User',
          email: userData.email || '',
          photoURL: userData.photoURL || null
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
    const weeklyData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    let balance = 2000
    
    days.forEach((day, index) => {
      const recentTransactions = transactions.filter(t => 
        new Date(t.date) >= new Date(Date.now() - (7 - index) * 24 * 60 * 60 * 1000)
      )
      
      const dailyChange = recentTransactions.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      )
      
      balance += dailyChange / 7
      
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

  const value = {
    user,
    financialData,
    isLoading,
    error,
    loadUserData,
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
