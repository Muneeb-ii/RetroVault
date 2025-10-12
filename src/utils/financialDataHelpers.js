/**
 * Comprehensive Financial Data Helper Functions for Eliza AI
 * Pre-processes all financial data to provide rich context to the LLM
 */

/**
 * Calculate comprehensive financial statistics
 */
export const calculateFinancialInsights = async (financialData) => {
  if (!financialData) return null

  const transactions = financialData.transactions || []
  const savings = financialData.savings || []
  const spendingBreakdown = financialData.spendingBreakdown || []
  const weeklyBalance = financialData.weeklyBalance || []

  // Early return if no data
  if (transactions.length === 0 && savings.length === 0) {
    return {
      currentBalance: financialData.balance || 0,
      totalIncome: 0,
      totalExpenses: 0,
      netBalance: 0,
      transactionCount: 0,
      spendingAnalysis: { totalSpent: 0, averageDaily: 0, topCategory: 'None', categoryBreakdown: {}, spendingTrend: 'stable', unusualSpending: [], averageTransaction: 0, totalTransactions: 0 },
      incomeAnalysis: { totalIncome: 0, averageIncome: 0, incomeFrequency: 'none', incomeTrend: 'stable', largestIncome: 0, totalTransactions: 0 },
      savingsAnalysis: { totalSavings: 0, averageMonthly: 0, savingsTrend: 'stable', savingsRate: 0, savingsGoal: 'Not set', monthlyData: [] },
      budgetAnalysis: { hasBudgets: false, budgetPerformance: 'Not available', overspentCategories: [], underspentCategories: [] },
      transactionPatterns: { mostActiveDay: 'None', mostActiveTime: 'None', averageTransactionSize: 0, transactionFrequency: 'none', dayDistribution: {}, timeDistribution: {} },
      healthScore: 50,
      recentTransactions: [],
      weeklyBalance,
      monthlyTrends: {},
      recommendations: []
    }
  }

  // Basic totals
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (t.amount || 0), 0)

  const netBalance = totalIncome - totalExpenses
  const currentBalance = financialData.balance || 0

  // Spending analysis
  const spendingAnalysis = analyzeSpendingPatterns(transactions)
  
  // Income analysis
  const incomeAnalysis = analyzeIncomePatterns(transactions)
  
  // Savings analysis
  const savingsAnalysis = analyzeSavingsTrends(savings)
  
  // Budget analysis
  const budgetAnalysis = await analyzeBudgetPerformance(financialData)
  
  // Goals analysis
  const goalsAnalysis = await analyzeGoalsProgress(financialData)
  
  // Transaction patterns
  const transactionPatterns = analyzeTransactionPatterns(transactions)
  
  // Financial health score
  const healthScore = calculateFinancialHealthScore({
    totalIncome,
    totalExpenses,
    currentBalance,
    savingsAnalysis,
    spendingAnalysis,
    transactionPatterns
  })

  return {
    // Basic metrics
    currentBalance,
    totalIncome,
    totalExpenses,
    netBalance,
    transactionCount: transactions.length,
    
    // Detailed analyses
    spendingAnalysis,
    incomeAnalysis,
    savingsAnalysis,
    budgetAnalysis,
    goalsAnalysis,
    transactionPatterns,
    healthScore,
    
    // Time-based data
    recentTransactions: transactions.slice(0, 10),
    weeklyBalance,
    monthlyTrends: calculateMonthlyTrends(transactions),
    
    // Recommendations
    recommendations: generateFinancialRecommendations({
      spendingAnalysis,
      savingsAnalysis,
      healthScore,
      totalIncome,
      totalExpenses
    })
  }
}

/**
 * Analyze spending patterns and categories
 */
const analyzeSpendingPatterns = (transactions) => {
  const expenses = transactions.filter(t => t.type === 'expense')
  
  if (expenses.length === 0) {
    return {
      totalSpent: 0,
      averageDaily: 0,
      topCategory: 'None',
      categoryBreakdown: {},
      spendingTrend: 'stable',
      unusualSpending: []
    }
  }

  // Category breakdown
  const categoryTotals = {}
  const categoryCounts = {}
  
  expenses.forEach(transaction => {
    const category = transaction.category || 'Other'
    categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount
    categoryCounts[category] = (categoryCounts[category] || 0) + 1
  })

  // Find top category
  const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
    categoryTotals[a] > categoryTotals[b] ? a : b, 'None'
  )

  // Calculate spending trend
  const recentExpenses = expenses
    .filter(t => new Date(t.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0)
  
  const olderExpenses = expenses
    .filter(t => {
      const date = new Date(t.date)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      return date >= sixtyDaysAgo && date < thirtyDaysAgo
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const spendingTrend = recentExpenses > olderExpenses ? 'increasing' : 
                     recentExpenses < olderExpenses ? 'decreasing' : 'stable'

  // Find unusual spending (transactions > 2x average)
  const averageTransaction = expenses.reduce((sum, t) => sum + t.amount, 0) / expenses.length
  const unusualSpending = expenses.filter(t => t.amount > averageTransaction * 2)

  return {
    totalSpent: expenses.reduce((sum, t) => sum + t.amount, 0),
    averageDaily: expenses.reduce((sum, t) => sum + t.amount, 0) / 30,
    topCategory,
    topCategoryAmount: categoryTotals[topCategory] || 0,
    categoryBreakdown: categoryTotals,
    categoryCounts,
    spendingTrend,
    unusualSpending: unusualSpending.slice(0, 5),
    averageTransaction,
    totalTransactions: expenses.length
  }
}

/**
 * Analyze income patterns
 */
const analyzeIncomePatterns = (transactions) => {
  const income = transactions.filter(t => t.type === 'income')
  
  if (income.length === 0) {
    return {
      totalIncome: 0,
      averageIncome: 0,
      incomeFrequency: 'none',
      incomeTrend: 'stable',
      largestIncome: 0
    }
  }

  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
  const averageIncome = totalIncome / income.length
  const largestIncome = Math.max(...income.map(t => t.amount))

  // Calculate income frequency (daily, weekly, monthly)
  const incomeDates = income.map(t => new Date(t.date)).sort()
  const daysBetween = incomeDates.length > 1 ? 
    (incomeDates[incomeDates.length - 1] - incomeDates[0]) / (1000 * 60 * 60 * 24) / incomeDates.length : 0
  
  let incomeFrequency = 'irregular'
  if (daysBetween <= 1) incomeFrequency = 'daily'
  else if (daysBetween <= 7) incomeFrequency = 'weekly'
  else if (daysBetween <= 30) incomeFrequency = 'monthly'

  // Calculate trend
  const recentIncome = income
    .filter(t => new Date(t.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    .reduce((sum, t) => sum + t.amount, 0)
  
  const olderIncome = income
    .filter(t => {
      const date = new Date(t.date)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
      return date >= sixtyDaysAgo && date < thirtyDaysAgo
    })
    .reduce((sum, t) => sum + t.amount, 0)

  const incomeTrend = recentIncome > olderIncome ? 'increasing' : 
                     recentIncome < olderIncome ? 'decreasing' : 'stable'

  return {
    totalIncome,
    averageIncome,
    incomeFrequency,
    incomeTrend,
    largestIncome,
    totalTransactions: income.length
  }
}

/**
 * Analyze savings trends
 */
const analyzeSavingsTrends = (savings) => {
  if (savings.length === 0) {
    return {
      totalSavings: 0,
      averageMonthly: 0,
      savingsTrend: 'stable',
      savingsRate: 0,
      savingsGoal: 'Not set'
    }
  }

  const totalSavings = savings.reduce((sum, s) => sum + s.amount, 0)
  const averageMonthly = totalSavings / savings.length

  // Calculate trend
  const recentSavings = savings.slice(-3).reduce((sum, s) => sum + s.amount, 0) / 3
  const olderSavings = savings.slice(0, 3).reduce((sum, s) => sum + s.amount, 0) / 3

  const savingsTrend = recentSavings > olderSavings ? 'increasing' : 
                      recentSavings < olderSavings ? 'decreasing' : 'stable'

  return {
    totalSavings,
    averageMonthly,
    savingsTrend,
    savingsRate: 0, // Would need income data to calculate
    savingsGoal: 'Not set',
    monthlyData: savings
  }
}

/**
 * Analyze budget performance
 */
const analyzeBudgetPerformance = async (financialData) => {
  try {
    // Import the budget service
    const { getUserBudgets } = await import('../api/unifiedFirestoreService')
    
    if (!financialData?.user?.uid) {
      return {
        hasBudgets: false,
        budgetPerformance: 'Not available - User not authenticated',
        overspentCategories: [],
        underspentCategories: []
      }
    }

    // Fetch user budgets
    const userBudgets = await getUserBudgets(financialData.user.uid)
    
    if (!userBudgets || userBudgets.length === 0) {
      return {
        hasBudgets: false,
        budgetPerformance: 'No budgets set',
        overspentCategories: [],
        underspentCategories: []
      }
    }

    // Calculate spending by category
    const transactions = financialData.transactions || []
    const categorySpending = {}
    
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount
      })

    // Analyze budget performance
    const overspentCategories = []
    const underspentCategories = []
    let totalBudget = 0
    let totalSpent = 0
    let budgetPerformance = 'Good'

    userBudgets.forEach(budget => {
      const spent = categorySpending[budget.category] || 0
      const budgetAmount = budget.amount
      const percentage = budgetAmount > 0 ? (spent / budgetAmount) * 100 : 0
      
      totalBudget += budgetAmount
      totalSpent += spent
      
      if (percentage > 100) {
        overspentCategories.push({
          category: budget.category,
          budget: budgetAmount,
          spent: spent,
          overage: spent - budgetAmount,
          percentage: percentage
        })
      } else if (percentage < 50) {
        underspentCategories.push({
          category: budget.category,
          budget: budgetAmount,
          spent: spent,
          remaining: budgetAmount - spent,
          percentage: percentage
        })
      }
    })

    // Determine overall performance
    const overallPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0
    if (overallPercentage > 100) {
      budgetPerformance = 'Over budget'
    } else if (overallPercentage > 90) {
      budgetPerformance = 'Near limit'
    } else if (overallPercentage < 50) {
      budgetPerformance = 'Under budget'
    }

    return {
      hasBudgets: true,
      budgetPerformance,
      totalBudget,
      totalSpent,
      overallPercentage,
      overspentCategories,
      underspentCategories,
      budgetCount: userBudgets.length
    }

  } catch (error) {
    console.error('Error analyzing budget performance:', error)
    return {
      hasBudgets: false,
      budgetPerformance: 'Error loading budgets',
      overspentCategories: [],
      underspentCategories: []
    }
  }
}

/**
 * Analyze goals progress
 */
const analyzeGoalsProgress = async (financialData) => {
  try {
    // Import the goals service
    const { getUserGoals } = await import('../api/unifiedFirestoreService')
    
    if (!financialData?.user?.uid) {
      return {
        hasGoals: false,
        goalsProgress: 'Not available - User not authenticated',
        activeGoals: [],
        completedGoals: [],
        overdueGoals: []
      }
    }

    // Fetch user goals
    const userGoals = await getUserGoals(financialData.user.uid)
    
    if (!userGoals || userGoals.length === 0) {
      return {
        hasGoals: false,
        goalsProgress: 'No goals set',
        activeGoals: [],
        completedGoals: [],
        overdueGoals: []
      }
    }

    // Analyze goals progress
    const activeGoals = []
    const completedGoals = []
    const overdueGoals = []
    let totalProgress = 0
    let totalGoals = userGoals.length

    userGoals.forEach(goal => {
      const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0
      const targetDate = new Date(goal.targetDate)
      const today = new Date()
      const isOverdue = targetDate < today && !goal.isCompleted
      const isCompleted = goal.isCompleted || progress >= 100
      
      totalProgress += progress
      
      const goalInfo = {
        id: goal.id,
        title: goal.title,
        category: goal.category,
        priority: goal.priority,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        progress: Math.min(progress, 100),
        targetDate: goal.targetDate,
        daysRemaining: Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24)),
        isOverdue,
        isCompleted
      }
      
      if (isCompleted) {
        completedGoals.push(goalInfo)
      } else if (isOverdue) {
        overdueGoals.push(goalInfo)
      } else {
        activeGoals.push(goalInfo)
      }
    })

    const averageProgress = totalGoals > 0 ? totalProgress / totalGoals : 0
    const goalsProgress = averageProgress >= 100 ? 'All goals completed' : 
                         averageProgress >= 75 ? 'Excellent progress' :
                         averageProgress >= 50 ? 'Good progress' :
                         averageProgress >= 25 ? 'Moderate progress' : 'Getting started'

    return {
      hasGoals: true,
      goalsProgress,
      totalGoals,
      completedGoals: completedGoals.length,
      activeGoals: activeGoals.length,
      overdueGoals: overdueGoals.length,
      averageProgress,
      activeGoals,
      completedGoals,
      overdueGoals,
      highPriorityGoals: userGoals.filter(g => g.priority === 'High').length
    }

  } catch (error) {
    console.error('Error analyzing goals progress:', error)
    return {
      hasGoals: false,
      goalsProgress: 'Error loading goals',
      activeGoals: [],
      completedGoals: [],
      overdueGoals: []
    }
  }
}

/**
 * Analyze transaction patterns
 */
const analyzeTransactionPatterns = (transactions) => {
  if (transactions.length === 0) {
    return {
      mostActiveDay: 'None',
      mostActiveTime: 'None',
      averageTransactionSize: 0,
      transactionFrequency: 'none'
    }
  }

  // Analyze by day of week
  const dayCounts = {}
  const timeCounts = {}
  
  transactions.forEach(t => {
    const date = new Date(t.date)
    const day = date.toLocaleDateString('en-US', { weekday: 'long' })
    const hour = date.getHours()
    
    dayCounts[day] = (dayCounts[day] || 0) + 1
    timeCounts[hour] = (timeCounts[hour] || 0) + 1
  })

  const mostActiveDay = Object.keys(dayCounts).reduce((a, b) => 
    dayCounts[a] > dayCounts[b] ? a : b, 'None'
  )

  const mostActiveTime = Object.keys(timeCounts).reduce((a, b) => 
    timeCounts[a] > timeCounts[b] ? a : b, 'None'
  )

  const averageTransactionSize = transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length

  return {
    mostActiveDay,
    mostActiveTime: `${mostActiveTime}:00`,
    averageTransactionSize,
    transactionFrequency: transactions.length > 30 ? 'high' : transactions.length > 10 ? 'medium' : 'low',
    dayDistribution: dayCounts,
    timeDistribution: timeCounts
  }
}

/**
 * Calculate monthly trends
 */
const calculateMonthlyTrends = (transactions) => {
  const monthlyData = {}
  
  transactions.forEach(t => {
    const date = new Date(t.date)
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { income: 0, expenses: 0, net: 0 }
    }
    
    if (t.type === 'income') {
      monthlyData[monthKey].income += t.amount
    } else {
      monthlyData[monthKey].expenses += t.amount
    }
  })

  // Calculate net for each month
  Object.keys(monthlyData).forEach(month => {
    monthlyData[month].net = monthlyData[month].income - monthlyData[month].expenses
  })

  return monthlyData
}

/**
 * Calculate financial health score (0-100)
 */
const calculateFinancialHealthScore = (data) => {
  let score = 50 // Base score

  // Balance factor (20 points)
  if (data.currentBalance > 0) score += 10
  if (data.currentBalance > data.totalIncome * 0.1) score += 10

  // Income vs expenses (30 points)
  const savingsRate = data.totalIncome > 0 ? (data.totalIncome - data.totalExpenses) / data.totalIncome : 0
  if (savingsRate > 0.2) score += 30
  else if (savingsRate > 0.1) score += 20
  else if (savingsRate > 0) score += 10

  // Spending control (20 points)
  if (data.spendingAnalysis?.spendingTrend === 'decreasing') score += 10
  else if (data.spendingAnalysis?.spendingTrend === 'stable') score += 5

  if (data.spendingAnalysis?.unusualSpending?.length < 3) score += 10

  // Savings trend (20 points)
  if (data.savingsAnalysis?.savingsTrend === 'increasing') score += 20
  else if (data.savingsAnalysis?.savingsTrend === 'stable') score += 10

  // Transaction patterns (10 points)
  if (data.transactionPatterns?.transactionFrequency === 'medium' || 
      data.transactionPatterns?.transactionFrequency === 'high') score += 10

  return Math.min(100, Math.max(0, score))
}

/**
 * Generate financial recommendations
 */
const generateFinancialRecommendations = (data) => {
  const recommendations = []

  // Safety check for missing data
  if (!data) {
    return recommendations
  }

  // Balance recommendations
  if (data.currentBalance < 1000) {
    recommendations.push({
      type: 'emergency_fund',
      priority: 'high',
      message: 'Build an emergency fund of at least $1,000',
      action: 'Set up automatic savings transfers'
    })
  }

  // Spending recommendations
  if (data.spendingAnalysis?.spendingTrend === 'increasing') {
    recommendations.push({
      type: 'spending_control',
      priority: 'medium',
      message: 'Your spending is increasing - review your budget',
      action: 'Track expenses more closely and set spending limits'
    })
  }

  if (data.spendingAnalysis?.unusualSpending?.length > 2) {
    recommendations.push({
      type: 'unusual_spending',
      priority: 'medium',
      message: 'You have several large transactions - review if necessary',
      action: 'Monitor large purchases and ensure they align with your goals'
    })
  }

  // Savings recommendations
  if (data.savingsAnalysis?.savingsTrend === 'decreasing') {
    recommendations.push({
      type: 'savings_boost',
      priority: 'high',
      message: 'Your savings are declining - take action now',
      action: 'Set up automatic savings and reduce non-essential spending'
    })
  }

  // Income recommendations
  if (data.incomeAnalysis?.incomeTrend === 'decreasing') {
    recommendations.push({
      type: 'income_growth',
      priority: 'medium',
      message: 'Your income is decreasing - consider new opportunities',
      action: 'Look for additional income sources or career advancement'
    })
  }

  return recommendations
}

/**
 * Format data for AI consumption
 */
export const formatDataForAI = (insights, financialData = null) => {
  if (!insights) return 'No financial data available'

  return `
FINANCIAL OVERVIEW:
- Current Balance: $${insights.currentBalance.toLocaleString()}
- Total Income: $${insights.totalIncome.toLocaleString()}
- Total Expenses: $${insights.totalExpenses.toLocaleString()}
- Net Position: $${insights.netBalance.toLocaleString()}
- Financial Health Score: ${insights.healthScore}/100

SPENDING ANALYSIS:
- Top Spending Category: ${insights.spendingAnalysis?.topCategory || 'None'} ($${(insights.spendingAnalysis?.topCategoryAmount || 0).toLocaleString()})
- Daily Average Spending: $${(insights.spendingAnalysis?.averageDaily || 0).toFixed(2)}
- Spending Trend: ${insights.spendingAnalysis?.spendingTrend || 'stable'}
- Unusual Transactions: ${insights.spendingAnalysis?.unusualSpending?.length || 0} large purchases

BUDGET ANALYSIS:
- Budget Status: ${insights.budgetAnalysis?.hasBudgets ? 'Active budgets set' : 'No budgets configured'}
- Budget Performance: ${insights.budgetAnalysis?.budgetPerformance || 'Not available'}
- Total Budget: $${(insights.budgetAnalysis?.totalBudget || 0).toLocaleString()}
- Total Spent vs Budget: $${(insights.budgetAnalysis?.totalSpent || 0).toLocaleString()} (${(insights.budgetAnalysis?.overallPercentage || 0).toFixed(1)}%)
- Overspent Categories: ${insights.budgetAnalysis?.overspentCategories?.length || 0}
- Underspent Categories: ${insights.budgetAnalysis?.underspentCategories?.length || 0}
${insights.budgetAnalysis?.overspentCategories?.length > 0 ? 
  `- Over Budget Categories: ${insights.budgetAnalysis.overspentCategories.map(c => 
    `${c.category} ($${c.overage.toFixed(2)} over)`
  ).join(', ')}` : ''}
${insights.budgetAnalysis?.underspentCategories?.length > 0 ? 
  `- Under Budget Categories: ${insights.budgetAnalysis.underspentCategories.map(c => 
    `${c.category} ($${c.remaining.toFixed(2)} remaining)`
  ).join(', ')}` : ''}

GOALS ANALYSIS:
- Goals Status: ${insights.goalsAnalysis?.hasGoals ? 'Active goals set' : 'No goals configured'}
- Goals Progress: ${insights.goalsAnalysis?.goalsProgress || 'Not available'}
- Total Goals: ${insights.goalsAnalysis?.totalGoals || 0}
- Completed Goals: ${insights.goalsAnalysis?.completedGoals || 0}
- Active Goals: ${insights.goalsAnalysis?.activeGoals || 0}
- Overdue Goals: ${insights.goalsAnalysis?.overdueGoals || 0}
- Average Progress: ${(insights.goalsAnalysis?.averageProgress || 0).toFixed(1)}%
- High Priority Goals: ${insights.goalsAnalysis?.highPriorityGoals || 0}
${insights.goalsAnalysis?.activeGoals?.length > 0 ? 
  `- Active Goals: ${insights.goalsAnalysis.activeGoals.map(g => 
    `${g.title} (${g.progress.toFixed(1)}% - ${g.daysRemaining} days left)`
  ).join(', ')}` : ''}
${insights.goalsAnalysis?.overdueGoals?.length > 0 ? 
  `- Overdue Goals: ${insights.goalsAnalysis.overdueGoals.map(g => 
    `${g.title} (${g.progress.toFixed(1)}% - ${Math.abs(g.daysRemaining)} days overdue)`
  ).join(', ')}` : ''}
${insights.goalsAnalysis?.completedGoals?.length > 0 ? 
  `- Completed Goals: ${insights.goalsAnalysis.completedGoals.map(g => 
    `${g.title} (100%)`
  ).join(', ')}` : ''}

INCOME ANALYSIS:
- Average Income per Transaction: $${(insights.incomeAnalysis?.averageIncome || 0).toLocaleString()}
- Income Frequency: ${insights.incomeAnalysis?.incomeFrequency || 'none'}
- Income Trend: ${insights.incomeAnalysis?.incomeTrend || 'stable'}
- Largest Income: $${(insights.incomeAnalysis?.largestIncome || 0).toLocaleString()}

SAVINGS ANALYSIS:
- Total Savings: $${(insights.savingsAnalysis?.totalSavings || 0).toLocaleString()}
- Monthly Average: $${(insights.savingsAnalysis?.averageMonthly || 0).toLocaleString()}
- Savings Trend: ${insights.savingsAnalysis?.savingsTrend || 'stable'}

TRANSACTION PATTERNS:
- Most Active Day: ${insights.transactionPatterns?.mostActiveDay || 'None'}
- Most Active Time: ${insights.transactionPatterns?.mostActiveTime || 'None'}
- Average Transaction Size: $${(insights.transactionPatterns?.averageTransactionSize || 0).toFixed(2)}
- Transaction Frequency: ${insights.transactionPatterns?.transactionFrequency || 'none'}

SYSTEM STATUS:
- Data Source: ${financialData?.syncStatus?.dataSource || 'Unknown'}
- Last Sync: ${financialData?.syncStatus?.lastSync ? new Date(financialData.syncStatus.lastSync).toLocaleString() : 'Never'}
- Data Consistency: ${financialData?.syncStatus?.isConsistent ? '✅ Consistent' : '⚠️ Inconsistent'}
- Auto Sync: ${financialData?.syncStatus?.autoSync ? 'Enabled' : 'Disabled'}

USER PREFERENCES:
- Currency: ${financialData?.userSettings?.currency || 'USD'}
- Date Format: ${financialData?.userSettings?.dateFormat || 'MM/DD/YYYY'}
- Theme: ${financialData?.userSettings?.theme || 'retro'}
- Notifications: ${financialData?.userSettings?.notifications ? 'Enabled' : 'Disabled'}
- Timezone: ${financialData?.userSettings?.timezone || 'America/New_York'}

RECENT ACTIVITY:
${(insights.recentTransactions || []).slice(0, 5).map(t => 
  `- ${t.type === 'income' ? '💰' : '💸'} ${t.description}: $${t.amount} (${t.category})`
).join('\n')}

RECOMMENDATIONS:
${(insights.recommendations || []).map(r => 
  `- ${r.priority.toUpperCase()}: ${r.message} → ${r.action}`
).join('\n')}
  `.trim()
}
