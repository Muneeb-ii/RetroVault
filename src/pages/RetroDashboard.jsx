// RetroVault Dashboard - Firestore as Single Source of Truth
import { useNavigate } from 'react-router-dom'
import { useUnifiedData } from '../contexts/UnifiedDataContext'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import MainPanel from '../components/MainPanel'
import ErrorBoundary from '../components/ErrorBoundary'
import { play as playSound } from '../utils/soundPlayer'
import { useEffect } from 'react'

const RetroDashboard = () => {
  const { user, financialData, isLoading, error, loadingMessage, signOut, transactions, userProfile, refreshData, forceDataSeeding } = useUnifiedData()
  const navigate = useNavigate()

  // Debug logging
  console.log('🔍 [DASHBOARD] Current state:', {
    hasUser: !!user,
    hasFinancialData: !!financialData,
    isLoading,
    hasError: !!error,
    transactionsCount: transactions?.length || 0,
    hasUserProfile: !!userProfile,
    financialDataKeys: financialData ? Object.keys(financialData) : []
  })

  // Play startup sound when dashboard is shown and user data is ready
  useEffect(() => {
    if (user) {
      try { playSound('startup') } catch (e) {}
    }
  }, [user])

  const handleSignOut = async () => {
    try {
      await signOut()
      playSound('logoff')
      console.log('👋 User signed out')
      navigate('/')
    } catch (error) {
      console.error('❌ Sign out error:', error)
    }
  }


  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md retro-window-animate">
          <div className="title-bar">
            <div className="title-bar-text">💾 RetroVault</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4 retro-text-reveal">{loadingMessage} 💾</div>
            <div className="text-sm text-gray-600 mb-2 retro-fade-in-delay-1">Generating your financial data</div>
            <div className="text-xs text-blue-600 retro-fade-in-delay-2">This may take a moment for new users</div>
            <div className="text-xs text-gray-500 retro-fade-in-delay-3">Please wait while we prepare your dashboard</div>
            <div className="mt-4">
              <div className="retro-loading text-4xl">💾</div>
            </div>
          </div>
          <div className="status-bar">
            <div className="status-bar-field retro-status-pulse">Initializing...</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md retro-window-animate">
          <div className="title-bar">
            <div className="title-bar-text">❌ Error</div>
            <div className="title-bar-controls">
              <button aria-label="Minimize"></button>
              <button aria-label="Maximize"></button>
              <button aria-label="Close"></button>
            </div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4 text-red-600 retro-text-reveal">Failed to load data</div>
            <div className="text-sm text-gray-600 mb-4 retro-fade-in-delay-1">{error}</div>
            <div className="text-xs text-gray-500 mb-4 retro-fade-in-delay-2">
              If you're a new user, this might be due to data initialization taking longer than expected. 
              Try refreshing the page or re-authenticating.
            </div>
            <div className="flex space-x-2 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="retro-button px-4 py-2 retro-card-hover"
              >
                🔄 Retry
              </button>
              <button
                onClick={() => { playSound('click1'); navigate('/auth') }}
                className="retro-button px-4 py-2 retro-card-hover"
              >
                🔑 Re-authenticate
              </button>
            </div>
          </div>
          <div className="status-bar">
            <div className="status-bar-field retro-status-pulse">Error loading Firestore data</div>
          </div>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen p-4 retro-dashboard-fade">
      {/* Top Navigation */}
      <ErrorBoundary>
        <TopNav />
      </ErrorBoundary>
      
      {/* User Info */}
      <div className="retro-window mb-4 p-4 retro-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm font-bold retro-text-reveal">{user?.displayName || 'User'}</div>
            <div className="text-xs text-gray-600 retro-fade-in-delay-1">{user?.email || 'user@example.com'}</div>
          </div>
          <div className="flex space-x-2">
            <button
              className="retro-button px-4 py-2 text-sm retro-card-hover"
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <ErrorBoundary>
          <SideBar />
        </ErrorBoundary>
        
        {/* Main Panel */}
        <div className="flex-1">
          <div className="retro-window p-4 retro-window-animate">
            <div className="flex justify-between items-center mb-4">
              <div className="text-center font-bold text-lg text-retro-dark retro-text-reveal flex-1">
                FINANCIAL DASHBOARD
              </div>
              <div className="flex gap-2">
                <button
                  onClick={refreshData}
                  className="retro-button px-3 py-1 text-sm"
                  disabled={isLoading}
                >
                  {isLoading ? '🔄' : '🔄'} Refresh Data
                </button>
                {/* Force Seed button hidden - data is already seeded */}
              </div>
            </div>

            <ErrorBoundary>
              {(financialData || (transactions && transactions.length > 0)) && (
                <MainPanel 
                  data={financialData || {
                    balance: userProfile?.financialSummary?.totalBalance || 0,
                    totalIncome: userProfile?.financialSummary?.totalIncome || 0,
                    totalExpenses: userProfile?.financialSummary?.totalExpenses || 0,
                    totalSavings: userProfile?.financialSummary?.totalSavings || 0,
                    savings: [],
                    spendingBreakdown: [],
                    weeklyBalance: [],
                    recentTransactions: transactions?.slice(0, 5) || [],
                    geminiInsight: ['Your financial data is being analyzed...', 'AI insights will be available shortly.']
                  }}
                  dataSource="Firestore"
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetroDashboard