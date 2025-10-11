// Story Mode Service for generating financial narratives
import { getFinancialInsights } from './aiService'

/**
 * Generate a financial story narrative from user data
 * @param {Array} transactions - User transactions
 * @param {Array} savings - Savings data
 * @param {string} aiInsight - Current AI insight
 * @param {number} balance - Current balance
 * @returns {Promise<string>} Generated story narrative
 */
export const generateFinancialStory = async (transactions, savings, aiInsight, balance) => {
  try {
    // Analyze the data for story elements
    const storyData = analyzeFinancialData(transactions, savings, balance)
    
  
    try {
      // Try to get AI-generated story
      const insights = await getFinancialInsights(transactions, savings)
      return generateStaticStory(storyData, balance, insights)
    } catch (error) {
      console.error('AI service unavailable, using static story:', error)
      return generateStaticStory(storyData, balance, aiInsight)
    }

  } catch (error) {
    console.error('Error generating financial story:', error)
    return generateFallbackStory(balance)
  }
}

/**
 * Analyze financial data for story elements
 */
const analyzeFinancialData = (transactions, savings, balance) => {
  // Calculate top spending category
  const categoryTotals = {}
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
  
  const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
    categoryTotals[a] > categoryTotals[b] ? a : 'Food', 'Food'
  )
  
  // Calculate savings trend
  const savingsTrend = savings.length >= 2 
    ? savings[savings.length - 1].amount > savings[0].amount ? 'increasing' : 'decreasing'
    : 'stable'
  
  // Determine recent achievement
  const recentAchievement = getRecentAchievement(transactions, savings, balance)
  
  return {
    topCategory,
    savingsTrend,
    recentAchievement
  }
}

/**
 * Get recent financial achievement
 */
const getRecentAchievement = (transactions, savings, balance) => {
  const recentIncome = transactions
    .filter(t => t.type === 'income' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0)
  
  const recentExpenses = transactions
    .filter(t => t.type === 'expense' && new Date(t.date) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0)
  
  if (recentIncome > recentExpenses * 1.5) {
    return 'excellent savings rate this month'
  } else if (balance > 10000) {
    return 'reached a significant savings milestone'
  } else if (recentExpenses < recentIncome * 0.7) {
    return 'maintained excellent spending discipline'
  } else {
    return 'showed consistent financial progress'
  }
}

/**
 * Generate static story when AI is unavailable
 */
const generateStaticStory = (storyData, balance, aiInsight) => {
  return aiInsight
}

/**
 * Generate fallback story
 */
const generateFallbackStory = (balance) => {
  return `In the RetroVault simulation, your financial journey begins with determination. You've started building your wealth foundation, reaching a balance of $${balance.toLocaleString()}. Every transaction is a step forward in your quest for financial security. The path ahead is filled with opportunities to grow your savings and achieve your goals. Your story is just beginning, and the future holds unlimited potential.`
}

/**
 * Generate story metadata for display
 */
export const generateStoryMetadata = (transactions, savings, balance) => {
  const totalTransactions = transactions.length
  const avgTransaction = transactions.reduce((sum, t) => sum + t.amount, 0) / totalTransactions
  const savingsGrowth = savings.length >= 2 
    ? ((savings[savings.length - 1].amount - savings[0].amount) / savings[0].amount * 100)
    : 0
  
  return {
    totalTransactions,
    avgTransaction: Math.round(avgTransaction),
    savingsGrowth: Math.round(savingsGrowth),
    storyLength: '100 words',
    genre: 'Financial Adventure',
    difficulty: balance > 10000 ? 'Expert' : balance > 5000 ? 'Intermediate' : 'Beginner'
  }
}
