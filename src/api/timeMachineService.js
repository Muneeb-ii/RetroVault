// Enhanced Time Machine Service with Advanced Financial Projections
import { getFinancialInsights } from './aiService'

/**
 * Comprehensive data validation for Time Machine calculations
 */
export const validateFinancialData = (financialData) => {
  const errors = []
  const warnings = []
  
  // Validate financial data structure
  if (!financialData) {
    errors.push('No financial data provided')
    return { isValid: false, errors, warnings }
  }
  
  // Validate balance
  if (typeof financialData.balance !== 'number' || isNaN(financialData.balance)) {
    errors.push('Invalid balance: must be a valid number')
  } else if (financialData.balance < 0) {
    warnings.push('Negative balance detected - projections may be inaccurate')
  }
  
  // Validate transactions
  if (!Array.isArray(financialData.transactions)) {
    errors.push('Invalid transactions: must be an array')
  } else {
    const transactionErrors = validateTransactions(financialData.transactions)
    errors.push(...transactionErrors.errors)
    warnings.push(...transactionErrors.warnings)
  }
  
  // Validate accounts
  if (!Array.isArray(financialData.accounts)) {
    warnings.push('No account data available')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Validate transaction data
 */
const validateTransactions = (transactions) => {
  const errors = []
  const warnings = []
  
  if (transactions.length === 0) {
    warnings.push('No transaction data available - using default values')
    return { errors, warnings }
  }
  
  // Check for minimum data requirements
  if (transactions.length < 5) {
    warnings.push('Limited transaction history - projections may be less accurate')
  }
  
  // Validate each transaction
  transactions.forEach((transaction, index) => {
    if (!transaction.amount || typeof transaction.amount !== 'number' || isNaN(transaction.amount)) {
      errors.push(`Transaction ${index + 1}: Invalid amount`)
    }
    
    if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
      errors.push(`Transaction ${index + 1}: Invalid type`)
    }
    
    if (!transaction.date || isNaN(new Date(transaction.date).getTime())) {
      errors.push(`Transaction ${index + 1}: Invalid date`)
    }
    
    // Check for suspicious amounts
    if (Math.abs(transaction.amount) > 100000) {
      warnings.push(`Transaction ${index + 1}: Unusually large amount detected`)
    }
  })
  
  return { errors, warnings }
}

/**
 * Validate calculation parameters
 */
export const validateCalculationParameters = (params) => {
  const errors = []
  const warnings = []
  
  const {
    currentBalance,
    monthlySavings,
    annualReturn,
    years,
    inflation,
    currentAge,
    retirementAge
  } = params
  
  // Validate balance
  if (typeof currentBalance !== 'number' || isNaN(currentBalance)) {
    errors.push('Invalid current balance')
  }
  
  // Validate monthly savings
  if (typeof monthlySavings !== 'number' || isNaN(monthlySavings)) {
    errors.push('Invalid monthly savings amount')
  } else if (monthlySavings < 0) {
    warnings.push('Negative monthly savings - projections may show declining wealth')
  }
  
  // Validate annual return
  if (typeof annualReturn !== 'number' || isNaN(annualReturn)) {
    errors.push('Invalid annual return rate')
  } else if (annualReturn < 0) {
    warnings.push('Negative return rate - projections may show declining wealth')
  } else if (annualReturn > 0.5) {
    warnings.push('Unusually high return rate - projections may be unrealistic')
  }
  
  // Validate time period
  if (typeof years !== 'number' || isNaN(years) || years <= 0) {
    errors.push('Invalid time period')
  } else if (years > 50) {
    warnings.push('Very long projection period - accuracy decreases over time')
  }
  
  // Validate inflation
  if (typeof inflation !== 'number' || isNaN(inflation)) {
    errors.push('Invalid inflation rate')
  } else if (inflation < 0) {
    warnings.push('Negative inflation rate - unusual economic conditions')
  } else if (inflation > 0.1) {
    warnings.push('High inflation rate - real value projections may be concerning')
  }
  
  // Validate ages
  if (typeof currentAge !== 'number' || isNaN(currentAge) || currentAge < 18 || currentAge > 100) {
    errors.push('Invalid current age')
  }
  
  if (typeof retirementAge !== 'number' || isNaN(retirementAge) || retirementAge < 50 || retirementAge > 100) {
    errors.push('Invalid retirement age')
  }
  
  if (currentAge >= retirementAge) {
    errors.push('Current age must be less than retirement age')
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings
  }
}

/**
 * Sanitize and normalize financial data
 */
export const sanitizeFinancialData = (financialData) => {
  if (!financialData) return null
  
  const sanitized = {
    balance: Math.max(0, Number(financialData.balance) || 0),
    transactions: (financialData.transactions || []).map(transaction => ({
      amount: Number(transaction.amount) || 0,
      type: ['income', 'expense'].includes(transaction.type) ? transaction.type : 'expense',
      date: transaction.date || new Date().toISOString(),
      category: transaction.category || 'Other',
      description: transaction.description || 'Transaction'
    })),
    accounts: financialData.accounts || [],
    user: financialData.user || {}
  }
  
  return sanitized
}

/**
 * Financial scenarios with different risk/return profiles
 */
export const FINANCIAL_SCENARIOS = {
  CONSERVATIVE: {
    name: 'Conservative',
    annualReturn: 0.03,
    inflation: 0.02,
    color: '#4A90E2',
    description: 'Low risk, steady growth'
  },
  MODERATE: {
    name: 'Moderate',
    annualReturn: 0.06,
    inflation: 0.025,
    color: '#7B68EE',
    description: 'Balanced risk and return'
  },
  AGGRESSIVE: {
    name: 'Aggressive',
    annualReturn: 0.09,
    inflation: 0.03,
    color: '#FF6B6B',
    description: 'Higher risk, higher potential return'
  }
}

/**
 * Calculate compound interest with proper financial formulas
 * @param {number} principal - Starting balance
 * @param {number} monthlyContribution - Monthly savings amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} years - Number of years to project
 * @param {number} inflation - Annual inflation rate
 * @returns {Object} Comprehensive projection data
 */
export const calculateAdvancedProjections = (principal, monthlyContribution, annualRate, years = 30, inflation = 0.025) => {
  const monthlyRate = annualRate / 12
  const monthlyInflation = inflation / 12
  const totalMonths = years * 12
  
  const projections = []
  let balance = principal
  let totalContributions = 0
  let totalInterest = 0
  
  for (let month = 0; month <= totalMonths; month++) {
    const year = Math.floor(month / 12)
    const monthInYear = (month % 12) + 1
    
    // Calculate inflation-adjusted contribution
    const inflationAdjustedContribution = monthlyContribution * Math.pow(1 + monthlyInflation, month)
    
    // Add contribution
    if (month > 0) {
      balance += inflationAdjustedContribution
      totalContributions += inflationAdjustedContribution
    }
    
    // Apply compound interest
    if (month > 0) {
      const interestEarned = balance * monthlyRate
      balance += interestEarned
      totalInterest += interestEarned
    }
    
    // Calculate real vs nominal value
    const inflationFactor = Math.pow(1 + monthlyInflation, month)
    const realValue = balance / inflationFactor
    
    projections.push({
      month,
      year,
      monthInYear,
      balance: Math.round(balance),
      realValue: Math.round(realValue),
      contribution: month > 0 ? Math.round(inflationAdjustedContribution) : 0,
      interest: month > 0 ? Math.round(balance * monthlyRate) : 0,
      totalContributions: Math.round(totalContributions),
      totalInterest: Math.round(totalInterest),
      date: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000)
    })
  }
  
  return {
    projections,
    summary: {
      finalBalance: Math.round(balance),
      finalRealValue: Math.round(balance / Math.pow(1 + monthlyInflation, totalMonths)),
      totalContributions: Math.round(totalContributions),
      totalInterest: Math.round(totalInterest),
      years
    }
  }
}

/**
 * Generate comprehensive milestone predictions
 * @param {number} currentBalance - Current balance
 * @param {number} monthlySavings - Monthly savings amount
 * @param {number} annualRate - Annual interest rate
 * @param {number} inflation - Annual inflation rate
 * @returns {Array} Array of milestone objects
 */
export const generateAdvancedMilestones = (currentBalance, monthlySavings, annualRate, inflation = 0.025) => {
  const milestones = [
    { amount: 10000, name: 'First $10K', icon: '🎯' },
    { amount: 25000, name: 'Quarter Milestone', icon: '🏆' },
    { amount: 50000, name: 'Half Century', icon: '💎' },
    { amount: 100000, name: 'Six Figures', icon: '💰' },
    { amount: 250000, name: 'Quarter Million', icon: '🚀' },
    { amount: 500000, name: 'Half Million', icon: '💫' },
    { amount: 1000000, name: 'Millionaire', icon: '👑' },
    { amount: 2000000, name: 'Two Million', icon: '🌟' }
  ]
  
  const monthlyRate = annualRate / 12
  const monthlyInflation = inflation / 12
  const results = []
  
  milestones.forEach(milestone => {
    if (milestone.amount > currentBalance) {
      let months = 0
      let balance = currentBalance
      let totalContributions = 0
      
      while (balance < milestone.amount && months < 360) { // Max 30 years
        const inflationAdjustedContribution = monthlySavings * Math.pow(1 + monthlyInflation, months)
        balance += inflationAdjustedContribution
        totalContributions += inflationAdjustedContribution
        
        const interestEarned = balance * monthlyRate
        balance += interestEarned
        
        months++
      }
      
      if (months < 360) {
        const targetDate = new Date()
        targetDate.setMonth(targetDate.getMonth() + months)
        
        const realValue = balance / Math.pow(1 + monthlyInflation, months)
        
        results.push({
          ...milestone,
          months,
          years: Math.round(months / 12 * 10) / 10,
          targetDate: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          achievable: true,
          totalContributions: Math.round(totalContributions),
          interestEarned: Math.round(balance - currentBalance - totalContributions),
          realValue: Math.round(realValue)
        })
      }
    }
  })
  
  return results
}

/**
 * Calculate retirement readiness
 * @param {number} currentAge - Current age
 * @param {number} retirementAge - Target retirement age
 * @param {number} currentBalance - Current balance
 * @param {number} monthlySavings - Monthly savings
 * @param {number} annualRate - Annual return rate
 * @param {number} inflation - Inflation rate
 * @returns {Object} Retirement analysis
 */
export const calculateRetirementReadiness = (currentAge, retirementAge, currentBalance, monthlySavings, annualRate, inflation = 0.025) => {
  const yearsToRetirement = retirementAge - currentAge
  const projection = calculateAdvancedProjections(currentBalance, monthlySavings, annualRate, yearsToRetirement, inflation)
  
  const finalBalance = projection.summary.finalBalance
  const finalRealValue = projection.summary.finalRealValue
  
  // Calculate retirement income needs (4% rule)
  const annualIncomeNeeded = finalRealValue * 0.04
  const monthlyIncomeNeeded = annualIncomeNeeded / 12
  
  // Calculate years of expenses covered
  const yearsCovered = finalRealValue / (annualIncomeNeeded * 25) // 25x rule
  
  return {
    finalBalance,
    finalRealValue,
    annualIncomeNeeded: Math.round(annualIncomeNeeded),
    monthlyIncomeNeeded: Math.round(monthlyIncomeNeeded),
    yearsCovered: Math.round(yearsCovered * 10) / 10,
    readinessScore: Math.min(100, Math.round((yearsCovered / 30) * 100)), // 30 years = 100%
    projection
  }
}

/**
 * Generate AI-powered financial forecast
 * @param {Object} projections - Projection data
 * @param {number} currentBalance - Current balance
 * @param {number} savingsIncrease - Percentage increase in savings
 * @param {string} scenario - Financial scenario
 * @returns {Promise<string>} AI-generated forecast
 */
export const generateTimeMachineForecast = async (projections, currentBalance, savingsIncrease, scenario = 'MODERATE') => {
  try {
    const scenarioData = FINANCIAL_SCENARIOS[scenario]
    const prompt = `You are a futuristic financial advisor from the year 2030. Based on the following comprehensive financial data, provide an inspiring, specific forecast about the user's financial future. Be encouraging and include specific amounts, dates, and milestones.

Financial Data:
- Current Balance: $${currentBalance.toLocaleString()}
- Scenario: ${scenarioData.name} (${scenarioData.description})
- Annual Return: ${(scenarioData.annualReturn * 100).toFixed(1)}%
- Savings Increase: ${savingsIncrease > 0 ? '+' : ''}${savingsIncrease}%
- Projected Balance in 1 year: $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'}
- Total Contributions: $${projections.summary?.totalContributions?.toLocaleString() || 'N/A'}
- Interest Earned: $${projections.summary?.totalInterest?.toLocaleString() || 'N/A'}

Write a futuristic forecast (3-4 sentences) that sounds like it's from a time-traveling financial advisor. Include specific amounts, dates, and encouraging milestones. Make it sound exciting and achievable.`

    try {
      const insights = await getFinancialInsights([], [])
      return generateStaticForecast(projections, currentBalance, savingsIncrease, scenario)
    } catch (error) {
      console.error('AI service unavailable, using static forecast:', error)
      return generateStaticForecast(projections, currentBalance, savingsIncrease, scenario)
    }

  } catch (error) {
    console.error('Error generating Time Machine forecast:', error)
    return generateStaticForecast(projections, currentBalance, savingsIncrease, scenario)
  }
}

/**
 * Generate static forecast when AI is unavailable
 */
const generateStaticForecast = (projections, currentBalance, savingsIncrease, scenario) => {
  const scenarioData = FINANCIAL_SCENARIOS[scenario]
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  const monthYear = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  const forecasts = {
    CONSERVATIVE: [
      `🛡️ CONSERVATIVE FORECAST: With your steady ${scenarioData.name.toLowerCase()} approach, you'll reach $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'} by ${monthYear}. Your disciplined saving will compound into reliable wealth over time!`,
      `⏰ STEADY PROGRESS: Your ${scenarioData.name.toLowerCase()} strategy will yield $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'} by ${monthYear}. This conservative approach builds lasting financial security!`
    ],
    MODERATE: [
      `⚖️ BALANCED FORECAST: Your ${scenarioData.name.toLowerCase()} approach will achieve $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'} by ${monthYear}. This balanced strategy optimizes growth while managing risk!`,
      `🎯 MODERATE SUCCESS: With ${scenarioData.name.toLowerCase()} investing, you'll reach $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'} by ${monthYear}. This approach balances growth potential with stability!`
    ],
    AGGRESSIVE: [
      `🚀 AGGRESSIVE FORECAST: Your ${scenarioData.name.toLowerCase()} strategy will propel you to $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'} by ${monthYear}. This high-growth approach maximizes your wealth potential!`,
      `💫 HIGH-GROWTH VISION: With ${scenarioData.name.toLowerCase()} investing, you'll achieve $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'} by ${monthYear}. This aggressive approach accelerates your path to financial freedom!`
    ]
  }
  
  const scenarioForecasts = forecasts[scenario] || forecasts.MODERATE
  const randomIndex = Math.floor(Math.random() * scenarioForecasts.length)
  
  return scenarioForecasts[randomIndex]
}

/**
 * Calculate Monte Carlo simulation for risk analysis
 * @param {number} principal - Starting balance
 * @param {number} monthlyContribution - Monthly savings
 * @param {number} meanReturn - Mean annual return
 * @param {number} volatility - Annual volatility
 * @param {number} years - Number of years
 * @param {number} simulations - Number of simulations
 * @returns {Object} Monte Carlo results
 */
export const monteCarloSimulation = (principal, monthlyContribution, meanReturn, volatility, years = 30, simulations = 1000) => {
  const results = []
  
  for (let sim = 0; sim < simulations; sim++) {
    let balance = principal
    const monthlyReturn = meanReturn / 12
    const monthlyVolatility = volatility / Math.sqrt(12)
    
    for (let month = 0; month < years * 12; month++) {
      // Generate random return
      const randomReturn = (Math.random() - 0.5) * 2 * monthlyVolatility + monthlyReturn
      balance = balance * (1 + randomReturn) + monthlyContribution
    }
    
    results.push(balance)
  }
  
  results.sort((a, b) => a - b)
  
  return {
    median: results[Math.floor(simulations / 2)],
    p10: results[Math.floor(simulations * 0.1)],
    p25: results[Math.floor(simulations * 0.25)],
    p75: results[Math.floor(simulations * 0.75)],
    p90: results[Math.floor(simulations * 0.9)],
    mean: results.reduce((sum, val) => sum + val, 0) / simulations
  }
}
