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
    
    const prompt = `Write a short, engaging 100-word story about a person's financial journey. Make it sound like a nostalgic simulation game narrative. Use the following data:

Financial Data:
- Current Balance: $${balance.toLocaleString()}
- Recent Insight: "${aiInsight}"
- Top Spending Category: ${storyData.topCategory}
- Savings Trend: ${storyData.savingsTrend}
- Recent Achievement: ${storyData.recentAchievement}

Write in second person ("You") and make it sound like a retro computer game story. Include specific details about their financial habits, achievements, and future potential. Keep it encouraging and nostalgic, like reading a save file from an old RPG game.`

    try {
      // Try to get AI-generated story
      const insights = await getFinancialInsights(transactions, savings)
      return generateStaticStory(storyData, balance, aiInsight)
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
  const stories = [
    `In the digital realm of RetroVault, your financial journey unfolds like an epic quest. You've mastered the art of budgeting, with ${storyData.topCategory.toLowerCase()} being your primary challenge. Your savings trend is ${storyData.savingsTrend}, and you've ${storyData.recentAchievement}. With a balance of $${balance.toLocaleString()}, you're building wealth one transaction at a time. The future holds promise as you continue your disciplined approach to financial growth.`,
    
    `Welcome to your financial adventure! You've navigated the complex world of personal finance with wisdom and determination. Your spending patterns show discipline in ${storyData.topCategory.toLowerCase()}, while your savings continue to ${storyData.savingsTrend}. You've ${storyData.recentAchievement}, proving your commitment to financial success. At $${balance.toLocaleString()}, you're well on your way to achieving your financial goals.`,
    
    `Your financial story reads like a classic simulation game. You've learned to balance income and expenses, with ${storyData.topCategory.toLowerCase()} requiring the most attention. Your savings strategy is ${storyData.savingsTrend}, and you've ${storyData.recentAchievement}. With $${balance.toLocaleString()} in your account, you're building the foundation for long-term financial security. The journey continues with each smart financial decision.`,
    
    `In the RetroVault universe, you've become a financial hero. Your spending habits show maturity, especially in managing ${storyData.topCategory.toLowerCase()}. Your savings are ${storyData.savingsTrend}, and you've ${storyData.recentAchievement}. At $${balance.toLocaleString()}, you're not just saving money—you're investing in your future. Every dollar saved is a step closer to financial freedom.`,
    
    `Your financial narrative unfolds with the precision of a well-crafted RPG. You've optimized your spending across all categories, with ${storyData.topCategory.toLowerCase()} being your focus area. Your savings trajectory is ${storyData.savingsTrend}, and you've ${storyData.recentAchievement}. With $${balance.toLocaleString()} accumulated, you're writing your own success story, one transaction at a time.`
  ]
  
  // Select story based on balance and achievements
  if (balance > 20000) {
    return stories[0] // Most optimistic for high balances
  } else if (balance > 10000) {
    return stories[1]
  } else if (balance > 5000) {
    return stories[2]
  } else if (balance > 1000) {
    return stories[3]
  } else {
    return stories[4] // Encouraging for lower balances
  }
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
