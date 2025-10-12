import { useState, useEffect } from 'react'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import ErrorBoundary from '../components/ErrorBoundary'
import { useUnifiedData } from '../contexts/UnifiedDataContext'
import { getFinancialInsights } from '../api/aiService'

const Insights = () => {
  const { financialData, transactions, accounts, isLoading, error } = useUnifiedData()
  const [insights, setInsights] = useState([])
  const [isGenerating, setIsGenerating] = useState(false)

  // Generate insights when component mounts
  useEffect(() => {
    if (financialData && !insights) {
      generateInsights()
    }
  }, [financialData])

  const generateInsights = async () => {
    if (!financialData) return

    setIsGenerating(true)
    try {
      // Pass transactions and savings arrays explicitly to the AI service
      const transactionsArray = Array.isArray(transactions) ? transactions : []
      const savings = Array.isArray(financialData.savings) ? financialData.savings : []
      const aiInsights = await getFinancialInsights(transactionsArray, savings)
      // Ensure we store an array for consistent rendering
      setInsights(Array.isArray(aiInsights) ? aiInsights : [String(aiInsights)])
    } catch (error) {
      console.error('Error generating insights:', error)
      setInsights(['Unable to generate AI insights at this time. Please try again later.'])
    } finally {
      setIsGenerating(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">🔍 AI Insights</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">Loading financial data... Please Wait 💾</div>
            <div className="text-sm text-gray-600">Preparing AI analysis</div>
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
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4 text-red-600">Failed to load data</div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!financialData) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">🔍 AI Insights</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">No financial data available</div>
            <div className="text-sm text-gray-600">Please ensure your data is properly loaded</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <TopNav />
      <div className="flex">
        <SideBar />
        <div className="flex-1">
          <div className="retro-window p-4">
            <div className="text-center font-bold text-lg mb-4 text-retro-dark">
              🔍 AI INSIGHTS
            </div>
            
            {/* Data Summary */}
            <div className="retro-info mb-6">
              <div className="text-center mb-4">
                <div className="text-lg font-bold mb-2">Your Financial Overview</div>
                <div className="text-sm text-gray-600">
                  Balance: ${financialData.balance.toLocaleString()} | 
                  Transactions: {transactions?.length || 0} | 
                  Accounts: {accounts?.length || 0}
                </div>
              </div>
            </div>

            {/* AI Insights Generation */}
            <div className="retro-chart mb-6">
              <div className="text-center font-bold mb-4 text-sm">AI FINANCIAL ANALYSIS</div>
              <div className="text-center mb-4">
                <button
                  className="retro-button px-6 py-3 text-lg font-bold"
                  onClick={generateInsights}
                  disabled={isGenerating}
                >
                  {isGenerating ? '⏳ Analyzing...' : '🧠 Generate AI Insights'}
                </button>
              </div>
            </div>

            {/* Insights Display */}
            {insights && (
              <div className="retro-chart">
                <div className="text-center font-bold mb-4 text-sm">YOUR AI INSIGHTS</div>
                <div className="insights-container">
                  <div className="insights-text">
                    {insights}
                  </div>
                </div>
              </div>
            )}

            {/* Insights Info */}
            <div className="retro-info text-center">
              <div className="text-4xl mb-4">🧠</div>
              <div className="text-lg mb-2">AI-Powered Financial Analysis</div>
              <div className="text-sm text-gray-600">
                Advanced AI insights powered by Google Gemini, analyzing your spending patterns, 
                savings trends, and providing personalized financial recommendations.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights
