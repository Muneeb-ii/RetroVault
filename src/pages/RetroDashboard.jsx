import { useEffect, useState } from 'react'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import MainPanel from '../components/MainPanel'
import useFinancialStore from '../store/useFinancialStore'
import { 
  signInWithGoogle, 
  signOutUser, 
  getCurrentUser, 
  onAuthStateChange,
  syncNessieData,
  getUserData,
  getUserTransactions,
  getUserAccounts
} from '../firebaseClient'

const RetroDashboard = () => {
  const { refreshData, dataSource, setData } = useFinancialStore()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user)
      if (user) {
        loadUserData(user.uid)
      }
    })
    return unsubscribe
  }, [])

  // Load data on component mount
  useEffect(() => {
    if (!user) {
      refreshData()
    }
  }, [refreshData, user])

  const loadUserData = async (userId) => {
    try {
      setIsLoading(true)
      const userData = await getUserData(userId)
      
      if (userData && userData.dataConsistency?.isConsistent) {
        // User has consistent data, load from Firestore
        const transactions = await getUserTransactions(userId)
        const accounts = await getUserAccounts(userId)
        
        if (transactions.length > 0) {
          // Transform Firestore data to match our store format
          const transformedData = {
            transactions: transactions,
            savings: calculateSavingsFromTransactions(transactions),
            spendingBreakdown: calculateSpendingBreakdown(transactions),
            weeklyBalance: generateWeeklyBalance(transactions),
            balance: userData.balance || 0,
            aiInsight: `Welcome back! Your consistent financial data (${userData.dataConsistency?.accountsCount || 0} accounts, ${userData.dataConsistency?.transactionsCount || 0} transactions)`,
            aiGenerated: false,
            lastUpdated: userData.dataConsistency?.lastSync || new Date().toLocaleString(),
            accountInfo: userData.accountInfo || {},
            dataSource: userData.dataSource || 'Firestore',
            isConsistent: true
          }
          
          setData(transformedData)
          console.log(`Consistent user data loaded for ${userId}`)
          return
        }
      }
      
      // No consistent data found, use mock data
      console.log('No consistent user data found, using mock data')
      refreshData()
      
    } catch (error) {
      console.error('Error loading user data:', error)
      refreshData() // Fallback to mock data
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signInWithGoogle()
      if (result.success) {
        setSyncMessage('✅ Signed in successfully!')
        setTimeout(() => setSyncMessage(''), 3000)
      } else {
        setSyncMessage('❌ Sign in failed: ' + result.error)
        setTimeout(() => setSyncMessage(''), 5000)
      }
    } catch (error) {
      console.error('Sign in error:', error)
      setSyncMessage('❌ Sign in error: ' + error.message)
      setTimeout(() => setSyncMessage(''), 5000)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOutUser()
      setSyncMessage('👋 Signed out successfully!')
      setTimeout(() => setSyncMessage(''), 3000)
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleSyncData = async (forceRefresh = false) => {
    if (!user) {
      setSyncMessage('❌ Please sign in first!')
      setTimeout(() => setSyncMessage(''), 3000)
      return
    }

    try {
      setIsSyncing(true)
      setSyncMessage(forceRefresh ? '🔄 Refreshing your data...' : '🔄 Syncing your data...')
      
      const result = await syncNessieData(user.uid, {
        name: user.displayName,
        email: user.email
      }, forceRefresh)
      
      if (result.success) {
        if (result.isExistingData) {
          setSyncMessage(`✅ ${result.message}`)
        } else {
          setSyncMessage(`✅ ${result.message} (${result.dataSource})`)
        }
        // Reload user data after sync
        await loadUserData(user.uid)
      } else {
        setSyncMessage('❌ Sync failed: ' + result.error)
      }
    } catch (error) {
      console.error('Sync error:', error)
      setSyncMessage('❌ Sync error: ' + error.message)
    } finally {
      setIsSyncing(false)
      setTimeout(() => setSyncMessage(''), 5000)
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

  return (
    <div className="min-h-screen p-4">
      {/* Top Navigation */}
      <TopNav />
      
      {/* Authentication Section */}
      {!user && (
        <div className="retro-window mb-4 p-4">
          <div className="text-center">
            <div className="text-lg font-bold mb-2">🔐 Sign In to Sync Your Data</div>
            <div className="text-sm text-gray-600 mb-4">
              Connect your account to sync real financial data and save your progress
            </div>
            <button
              className="retro-button px-6 py-3 text-lg font-bold"
              onClick={handleSignIn}
              disabled={isLoading}
            >
              {isLoading ? '⏳ Signing in...' : '🔑 Sign In with Google'}
            </button>
          </div>
        </div>
      )}

      {/* Sync Status */}
      {syncMessage && (
        <div className="retro-info mb-4 text-center">
          <div className="text-sm font-bold">{syncMessage}</div>
        </div>
      )}

      {/* User Info and Sync Button */}
      {user && (
        <div className="retro-window mb-4 p-4">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-bold">👤 {user.displayName}</div>
              <div className="text-xs text-gray-600">{user.email}</div>
            </div>
            <div className="flex space-x-2">
              <button
                className="retro-button px-4 py-2 text-sm"
                onClick={() => handleSyncData(false)}
                disabled={isSyncing}
              >
                {isSyncing ? '⏳ Syncing...' : '🔄 Sync My Data'}
              </button>
              <button
                className="retro-button px-4 py-2 text-sm"
                onClick={() => handleSyncData(true)}
                disabled={isSyncing}
              >
                🔄 Refresh Data
              </button>
              <button
                className="retro-button px-4 py-2 text-sm"
                onClick={handleSignOut}
              >
                🚪 Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
      
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
            <MainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetroDashboard
