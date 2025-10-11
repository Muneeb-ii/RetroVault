// RetroVault Dashboard - Firestore as Single Source of Truth
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { auth } from '../firebaseClient'
import { getUserData, getUserTransactions, getUserAccounts } from '../firebaseClient'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import MainPanel from '../components/MainPanel'

const RetroDashboard = () => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [financialData, setFinancialData] = useState(null)
  const navigate = useNavigate()

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user)
        loadUserData(user.uid)
      } else {
        // User not authenticated, redirect to landing
        navigate('/')
      }
    })
    return unsubscribe
  }, [navigate])

  const loadUserData = async (userId) => {
    try {
      setIsLoading(true)
      setError(null)
      
      console.log('🔄 [DASHBOARD] Starting data loading process...')
      console.log('🆔 [DASHBOARD] User ID:', userId)
      
      // Load user document
      console.log('🔍 [FIRESTORE] Loading user document...')
      const userData = await getUserData(userId)
      console.log('📄 [FIRESTORE] User data loaded:', userData ? 'Found' : 'Not found')
      
      if (!userData) {
        console.log('🆕 [DASHBOARD] New user detected - no data in Firestore')
        await handleNewUser(userId)
        return
      }

      console.log('📊 [FIRESTORE] User data details:', {
        email: userData.email,
        dataSource: userData.dataSource,
        balance: userData.balance,
        hasAccountInfo: !!userData.accountInfo
      })

      // Load transactions and accounts
      console.log('🔍 [FIRESTORE] Loading transactions and accounts...')
      const [transactions, accounts] = await Promise.all([
        getUserTransactions(userId),
        getUserAccounts(userId)
      ])

      console.log('📊 [FIRESTORE] Data loaded:', {
        transactionsCount: transactions.length,
        accountsCount: accounts.length
      })

      if (transactions.length === 0) {
        console.log('🆕 [DASHBOARD] User exists but no transaction data - triggering data seeding')
        await handleNewUser(userId)
        return
      }

      console.log('🔄 [DASHBOARD] Transforming data for display...')
      // Transform Firestore data to dashboard format
      const transformedData = {
        transactions: transactions,
        savings: calculateSavingsFromTransactions(transactions),
        spendingBreakdown: calculateSpendingBreakdown(transactions),
        weeklyBalance: generateWeeklyBalance(transactions),
        balance: userData.balance || 0,
        aiInsight: `Welcome back! Your financial data (${accounts.length} accounts, ${transactions.length} transactions)`,
        aiGenerated: false,
        lastUpdated: userData.dataConsistency?.lastSync || new Date().toLocaleString(),
        accountInfo: userData.accountInfo || {},
        dataSource: userData.dataSource || 'Firestore',
        isConsistent: true
      }
      
      console.log('📊 [DASHBOARD] Transformed data:', {
        transactionsCount: transformedData.transactions.length,
        savingsCount: transformedData.savings.length,
        spendingCategories: transformedData.spendingBreakdown.length,
        balance: transformedData.balance
      })
      
      setFinancialData(transformedData)
      console.log('✅ [DASHBOARD] User data loaded successfully from Firestore')
      
            } catch (error) {
              console.error('❌ [DASHBOARD] Error loading user data:', error)
              console.error('❌ [DASHBOARD] Error details:', {
                message: error.message,
                stack: error.stack
              })
              
              setError(error.message)
            } finally {
      setIsLoading(false)
    }
  }

  const handleNewUser = async (userId) => {
    try {
      console.log('🌱 [NEW_USER] Starting data seeding for new user...')
      console.log('🆔 [NEW_USER] User ID:', userId)
      console.log('👤 [NEW_USER] User info:', {
        name: user?.displayName || user?.email,
        email: user?.email
      })
      
      const seedPayload = {
        userId: userId,
        userInfo: {
          name: user?.displayName || user?.email,
          email: user?.email
        }
      }
      console.log('📤 [NEW_USER] Seeding payload:', seedPayload)
      
      // Call the backend to seed data from Nessie API
      console.log('🌐 [NEW_USER] Calling backend API...')
      const response = await fetch('/api/syncNessieToFirestore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(seedPayload)
      })

      console.log('📡 [NEW_USER] API response status:', response.status)
      console.log('📡 [NEW_USER] API response ok:', response.ok)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('❌ [NEW_USER] Backend sync failed:', response.status, errorText)
        throw new Error(`Backend sync failed: ${response.status}`)
      }

      const result = await response.json()
      console.log('✅ [NEW_USER] Data seeded successfully:', result)
      console.log('📊 [NEW_USER] Seeding result details:', {
        success: result.success,
        message: result.message,
        dataSource: result.dataSource,
        accountsCount: result.accountsCount,
        transactionsCount: result.transactionsCount
      })
      
      // Reload data after seeding
      console.log('🔄 [NEW_USER] Reloading data after seeding...')
      await loadUserData(userId)
      
    } catch (error) {
      console.error('❌ [NEW_USER] Error seeding data for new user:', error)
      console.error('❌ [NEW_USER] Error details:', {
        message: error.message,
        stack: error.stack
      })
      setError(`Failed to initialize your account: ${error.message}`)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut(auth)
      console.log('👋 User signed out')
      navigate('/')
    } catch (error) {
      console.error('❌ Sign out error:', error)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">💾 RetroVault</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">Loading data... Please Wait 💾</div>
            <div className="text-sm text-gray-600 mb-2">Fetching your financial data from Firestore</div>
            <div className="text-xs text-blue-600">This may take a moment for new users</div>
          </div>
          <div className="status-bar">
            <div className="status-bar-field">Loading...</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">❌ Error</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4 text-red-600">Failed to load data</div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
            <div className="text-xs text-gray-500 mb-4">
              If you're a new user, this might be due to data initialization taking longer than expected.
            </div>
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="retro-button px-4 py-2"
              >
                🔄 Retry
              </button>
              <button
                onClick={() => navigate('/auth')}
                className="retro-button px-4 py-2"
              >
                🔑 Re-authenticate
              </button>
            </div>
          </div>
          <div className="status-bar">
            <div className="status-bar-field">Error loading Firestore data</div>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen p-4">
      {/* Top Navigation */}
      <TopNav />
      
      {/* User Info */}
      <div className="retro-window mb-4 p-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-bold">👤 {user?.displayName || 'User'}</div>
            <div className="text-xs text-gray-600">{user?.email || 'user@example.com'}</div>
            <div className="text-xs text-green-600">✅ Data loaded from Firestore</div>
          </div>
          <div className="flex space-x-2">
            <button
              className="retro-button px-4 py-2 text-sm"
              onClick={handleSignOut}
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <SideBar />
        
        {/* Main Panel */}
        <div className="flex-1">
          <div className="retro-window p-4">
            <div className="text-center font-bold text-lg mb-4 text-retro-dark">
              📊 FINANCIAL DASHBOARD
            </div>
            {financialData && (
              <MainPanel 
                data={financialData}
                dataSource="Firestore"
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetroDashboard