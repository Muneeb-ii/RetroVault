// Unified Data Context for RetroVault
// Single source of truth for all financial data across the application

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
import { authService } from '../services/authService'
import { dataSeedingService } from '../services/dataSeedingService'

const UnifiedDataContext = createContext()

export const useUnifiedData = () => {
  const context = useContext(UnifiedDataContext)
  if (!context) {
    throw new Error('useUnifiedData must be used within a UnifiedDataProvider')
  }
  return context
}

export const UnifiedDataProvider = ({ children }) => {
  // Core state
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [accounts, setAccounts] = useState([])
  const [transactions, setTransactions] = useState([])
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [loadingMessage, setLoadingMessage] = useState('Initializing...')
  
  // Seeding state
  const [isSeeding, setIsSeeding] = useState(false)
  const [seedingProgress, setSeedingProgress] = useState(0)
  const [seedingMessage, setSeedingMessage] = useState('')

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser)
        await handleUserAuthentication(currentUser)
      } else {
        // User signed out - clear all data
        setUser(null)
        setUserProfile(null)
        setAccounts([])
        setTransactions([])
        setIsLoading(false)
        setError(null)
      }
    })
    return unsubscribe
  }, [])

  /**
   * Handle user authentication and data loading
   */
  const handleUserAuthentication = async (currentUser) => {
    try {
      setIsLoading(true)
      setError(null)
      setLoadingMessage('Loading your financial data...')
      
      console.log('🔄 [UNIFIED] Handling authentication for user:', currentUser.uid)
      
      // Check if user profile exists
      const profile = await getUserProfile(currentUser.uid)
      
      if (profile) {
        // Existing user - load their data
        console.log('👤 [UNIFIED] Existing user, loading data...')
        await loadUserData(currentUser.uid, profile)
      } else {
        // New user - needs data seeding
        console.log('🆕 [UNIFIED] New user detected, starting data seeding...')
        await seedNewUserData(currentUser)
      }
      
    } catch (error) {
      console.error('❌ [UNIFIED] Error handling user authentication:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Load existing user data
   */
  const loadUserData = async (userId, profile) => {
    try {
      setLoadingMessage('Loading your financial data...')
      
      // Load accounts and transactions in parallel
      const [userAccounts, userTransactions] = await Promise.all([
        getUserAccounts(userId, { activeOnly: true }),
        getUserTransactions(userId, { limitCount: 1000 }) // Increased to ensure we get all seeded transactions
      ])

      // Update state
      setUserProfile(profile)
      setAccounts(userAccounts)
      setTransactions(userTransactions)
      
      console.log('✅ [UNIFIED] User data loaded successfully:', {
        accountsCount: userAccounts.length,
        transactionsCount: userTransactions.length
      })
      
    } catch (error) {
      console.error('❌ [UNIFIED] Error loading user data:', error)
      throw error
    }
  }

  /**
   * Seed data for new user
   */
  const seedNewUserData = async (currentUser) => {
    try {
      setIsSeeding(true)
      setLoadingMessage('Setting up your account with financial data...')
      
      const userInfo = {
        name: currentUser.displayName || 'User',
        email: currentUser.email || '',
        photoURL: currentUser.photoURL || null
      }
      
      // Start data seeding
      const seedingResult = await dataSeedingService.seedUserData(
        currentUser.uid, 
        userInfo, 
        false
      )
      
      if (seedingResult.success) {
        console.log('✅ [UNIFIED] Data seeding completed successfully')
        
        // Load the newly seeded data
        await loadUserData(currentUser.uid, seedingResult.userProfile)
        
        // Verify that we have transactions for calculations
        const userTransactions = await getUserTransactions(currentUser.uid, { limitCount: 100 })
        if (userTransactions.length === 0) {
          console.warn('⚠️ [UNIFIED] No transactions found after seeding, this may affect calculations')
        } else {
          console.log(`✅ [UNIFIED] Found ${userTransactions.length} transactions for calculations`)
        }
        
        setLoadingMessage('Account setup complete!')
      } else {
        throw new Error(seedingResult.error || 'Data seeding failed')
      }
      
    } catch (error) {
      console.error('❌ [UNIFIED] Error seeding user data:', error)
      setError(`Failed to set up your account: ${error.message}`)
    } finally {
      setIsSeeding(false)
    }
  }

  /**
   * Refresh user data
   */
  const refreshData = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      setLoadingMessage('Refreshing your data...')
      
      // Reload all data
      const [profile, userAccounts, userTransactions] = await Promise.all([
        getUserProfile(user.uid),
        getUserAccounts(user.uid, { activeOnly: true }),
        getUserTransactions(user.uid, { limitCount: 1000 }) // Increased to ensure we get all transactions
      ])
      
      // Update state
      setUserProfile(profile)
      setAccounts(userAccounts)
      setTransactions(userTransactions)
      
      console.log('✅ [UNIFIED] Data refreshed successfully')
      
    } catch (error) {
      console.error('❌ [UNIFIED] Error refreshing data:', error)
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Update financial summary
   */
  const updateSummary = async () => {
    if (!user) return
    
    try {
      await updateFinancialSummary(user.uid)
      await refreshData()
      console.log('✅ [UNIFIED] Financial summary updated')
    } catch (error) {
      console.error('❌ [UNIFIED] Error updating financial summary:', error)
    }
  }

  /**
   * Sign out user
   */
  const signOut = async () => {
    try {
      await authService.signOut()
      console.log('✅ [UNIFIED] User signed out successfully')
    } catch (error) {
      console.error('❌ [UNIFIED] Error signing out:', error)
      setError(error.message)
    }
  }

  /**
   * Get computed financial data
   */
  const getFinancialData = () => {
    console.log('🔍 [FINANCIAL DATA] Getting financial data:', {
      hasUserProfile: !!userProfile,
      transactionsCount: transactions?.length || 0,
      userProfileBalance: userProfile?.financialSummary?.totalBalance || 0
    })
    
    if (!userProfile) {
      console.log('🔍 [FINANCIAL DATA] No user profile, returning zero data')
      return {
        balance: 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        savings: [],
        spendingBreakdown: [],
        weeklyBalance: []
      }
    }

    // If we have a user profile but no transactions yet, return profile data
    if (!transactions || transactions.length === 0) {
      console.log('🔍 [FINANCIAL DATA] No transactions yet, using profile data')
      return {
        balance: userProfile.financialSummary?.totalBalance || 0,
        totalIncome: userProfile.financialSummary?.totalIncome || 0,
        totalExpenses: userProfile.financialSummary?.totalExpenses || 0,
        totalSavings: userProfile.financialSummary?.totalSavings || 0,
        savings: [],
        spendingBreakdown: [],
        weeklyBalance: []
      }
    }

    // Calculate derived data - handle different transaction type formats
    const incomeTransactions = transactions.filter(t => 
      t.type === 'income' || t.type === 'deposit'
    )
    const expenseTransactions = transactions.filter(t => 
      t.type === 'expense' || t.type === 'withdrawal'
    )
    
    // Standardize amount handling - ensure all amounts are positive for calculations
    const totalIncome = incomeTransactions.reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount) || 0)
      return sum + amount
    }, 0)
    
    const totalExpenses = expenseTransactions.reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount) || 0)
      return sum + amount
    }, 0)
    
    const totalSavings = totalIncome - totalExpenses
    // Use calculated balance as single source of truth, fallback to profile balance
    const calculatedBalance = totalSavings
    const profileBalance = userProfile.financialSummary?.totalBalance || 0
    const balance = calculatedBalance !== 0 ? calculatedBalance : profileBalance

    return {
      balance,
      totalIncome,
      totalExpenses,
      totalSavings,
      savings: calculateSavingsFromTransactions(transactions),
      spendingBreakdown: calculateSpendingBreakdown(transactions),
      weeklyBalance: generateWeeklyBalance(transactions, balance)
    }
  }

  /**
   * Calculate savings from transactions
   */
  const calculateSavingsFromTransactions = (transactions) => {
    const monthlyData = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0 }
      }
      
      if (transaction.type === 'income' || transaction.type === 'deposit') {
        monthlyData[monthKey].income += Math.abs(Number(transaction.amount) || 0)
      } else {
        monthlyData[monthKey].expenses += Math.abs(Number(transaction.amount) || 0)
      }
    })
    
    // Calculate cumulative savings over time
    const sortedMonths = Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
    
    let cumulativeSavings = 0
    return sortedMonths.map(([month, data]) => {
      const monthlySavings = data.income - data.expenses
      cumulativeSavings += monthlySavings
      
      return {
        month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
        amount: Math.max(0, cumulativeSavings),
        year: new Date(month + '-01').getFullYear()
      }
    })
  }

  /**
   * Calculate spending breakdown
   */
  const calculateSpendingBreakdown = (transactions) => {
    const breakdown = {}
    const categories = ['Food', 'Transport', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other']
    
    categories.forEach(category => {
      breakdown[category] = 0
    })
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && breakdown.hasOwnProperty(transaction.category)) {
        breakdown[transaction.category] += Math.abs(Number(transaction.amount) || 0)
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

  /**
   * Generate weekly balance data
   */
  const generateWeeklyBalance = (transactions, currentBalance = 0) => {
    console.log('🔍 [WEEKLY BALANCE] Generating weekly balance with transactions:', transactions?.length || 0)
    
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      console.log('🔍 [WEEKLY BALANCE] No transactions, returning zero data')
      return Array.from({ length: 7 }, (_, i) => ({
        day: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i],
        balance: currentBalance,
        income: 0,
        expenses: 0,
        netChange: 0,
        transactionCount: 0
      }))
    }

    const weeklyData = []
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    
    // Start with the actual current balance
    let balance = currentBalance
    console.log('🔍 [WEEKLY BALANCE] Starting with balance:', balance)
    
    days.forEach((day, index) => {
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
      
      const dayIncome = dayTransactions
        .filter(t => t.type === 'income' || t.type === 'deposit')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)
      
      const dayExpenses = dayTransactions
        .filter(t => t.type === 'expense' || t.type === 'withdrawal')
        .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount) || 0), 0)
      
      const dailyChange = dayIncome - dayExpenses
      balance += dailyChange
      
      weeklyData.push({
        day,
        balance: Math.max(0, Math.round(balance)),
        income: Math.round(dayIncome),
        expenses: Math.round(dayExpenses),
        netChange: Math.round(dailyChange),
        transactionCount: dayTransactions.length
      })
    })
    
    console.log('🔍 [WEEKLY BALANCE] Generated weekly data:', weeklyData)
    return weeklyData
  }

  /**
   * Get category color
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

  // Context value
  const value = {
    // Core data
    user,
    userProfile,
    accounts,
    transactions,
    
    // Loading states
    isLoading,
    error,
    loadingMessage,
    
    // Seeding states
    isSeeding,
    seedingProgress,
    seedingMessage,
    
    // Actions
    refreshData,
    updateSummary,
    signOut,
    
    // Computed data
    financialData: getFinancialData(),
    
    // Helper functions
    calculateSavingsFromTransactions,
    calculateSpendingBreakdown,
    generateWeeklyBalance,
    getCategoryColor
  }

  return (
    <UnifiedDataContext.Provider value={value}>
      {children}
    </UnifiedDataContext.Provider>
  )
}
