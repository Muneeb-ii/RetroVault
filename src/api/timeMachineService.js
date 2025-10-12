// Enhanced Time Machine Service with Advanced Financial Projections
import { getFinancialInsights, runOpenRouterPrompt } from './aiService'

import { ElevenLabsClient, play } from '@elevenlabs/elevenlabs-js';

export const playStoryAudio = async (story) => {
  const elevenlabs = new ElevenLabsClient({
    apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY,
  });
  
  let audioElement = null
  let audioUrl = null
  let cleanup = null
  
  try {
    const audio = await elevenlabs.textToSpeech.convert("EXAVITQu4vr4xnSDxMaL", {
      text: story,
      modelId: "eleven_multilingual_v2",
    });

    const chunks= [];
    for await (const chunk of audio) {
      chunks.push(chunk);
    }
    const blob = new Blob(chunks, { type: 'audio/mpeg' });
    audioUrl = URL.createObjectURL(blob);
   
    audioElement = new Audio(audioUrl);
    
    // Create cleanup function with proper variable capture
    cleanup = () => {
      try {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
          audioUrl = null
        }
        if (audioElement) {
          audioElement.removeEventListener('ended', cleanup)
          audioElement.removeEventListener('error', cleanup)
          audioElement.removeEventListener('abort', cleanup)
          audioElement.pause()
          audioElement.src = ''
          audioElement = null
        }
      } catch (cleanupError) {
        console.warn('Error during audio cleanup:', cleanupError)
      }
    }
    
    // Add event listeners with proper error handling
    audioElement.addEventListener('ended', cleanup)
    audioElement.addEventListener('error', cleanup)
    audioElement.addEventListener('abort', cleanup)
    
    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Audio playback timeout, cleaning up')
      if (cleanup) cleanup()
    }, 30000) // 30 second timeout
    
    audioElement.addEventListener('ended', () => {
      clearTimeout(timeoutId)
      if (cleanup) cleanup()
    })
    
    await audioElement.play();
   
  } catch (error) {
    console.error('Error playing audio:', error);
    // Safe cleanup on error
    if (cleanup) {
      cleanup()
    } else {
      // Fallback cleanup if cleanup function wasn't created
      try {
        if (audioUrl) {
          URL.revokeObjectURL(audioUrl)
        }
        if (audioElement) {
          audioElement.pause()
          audioElement.src = ''
        }
      } catch (fallbackError) {
        console.warn('Error during fallback cleanup:', fallbackError)
      }
    }
    throw error // Re-throw to handle in calling code
  }
};
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
  try {
    // Validate inputs with more comprehensive checks
    if (typeof principal !== 'number' || isNaN(principal) || !isFinite(principal) || principal < 0) {
      throw new Error('Invalid principal amount: must be a finite non-negative number')
    }
    if (typeof monthlyContribution !== 'number' || isNaN(monthlyContribution) || !isFinite(monthlyContribution)) {
      throw new Error('Invalid monthly contribution: must be a finite number')
    }
    if (typeof annualRate !== 'number' || isNaN(annualRate) || !isFinite(annualRate) || annualRate < -1 || annualRate > 1) {
      throw new Error('Invalid annual rate: must be between -100% and 100%')
    }
    if (typeof years !== 'number' || isNaN(years) || !isFinite(years) || years <= 0 || years > 100) {
      throw new Error('Invalid years: must be between 1 and 100')
    }
    if (typeof inflation !== 'number' || isNaN(inflation) || !isFinite(inflation) || inflation < -0.5 || inflation > 0.5) {
      throw new Error('Invalid inflation rate: must be between -50% and 50%')
    }
    
    // Additional safety checks for extreme values
    if (Math.abs(principal) > 1e12) {
      throw new Error('Principal amount too large')
    }
    if (Math.abs(monthlyContribution) > 1e9) {
      throw new Error('Monthly contribution too large')
    }

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
      
      // Add contribution first
      if (month > 0) {
        balance += inflationAdjustedContribution
        totalContributions += inflationAdjustedContribution
      }
      
      // Apply compound interest to the balance (including contributions)
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
  } catch (error) {
    console.error('Error in calculateAdvancedProjections:', error)
    // Return safe fallback data
    return {
      projections: [],
      summary: {
        finalBalance: principal,
        finalRealValue: principal,
        totalContributions: 0,
        totalInterest: 0,
        years: 0
      }
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
    // Try to include milestone predictions so the AI forecast aligns with analytic milestones
    const monthlySavings = (projections && (projections.newMonthlySavings ?? projections.currentMonthlySavings)) || 0
    const milestones = generateAdvancedMilestones(currentBalance, monthlySavings, scenarioData.annualReturn, scenarioData.inflation)

    let milestoneText = ''
    if (Array.isArray(milestones) && milestones.length > 0) {
      const top = milestones.slice(0, 5)
      milestoneText = 'Milestone Predictions:\n'
      milestoneText += top.map(m => {
        const amt = typeof m.amount === 'number' ? `$${m.amount.toLocaleString()}` : m.amount
        const contributions = m.totalContributions ? `$${m.totalContributions.toLocaleString()}` : 'N/A'
        const interest = m.interestEarned ? `$${m.interestEarned.toLocaleString()}` : 'N/A'
        return `- ${m.icon || ''} ${m.name}: ${amt} by ${m.targetDate || 'N/A'} (~${m.years || 'N/A'} yrs) — Achievable: ${m.achievable ? 'Yes' : 'No'}; Contributions: ${contributions}; Interest: ${interest}`
      }).join('\n')
      milestoneText += '\n\n'
    }

    const prompt = `You are a futuristic financial advisor from the year 2030. Based on the following comprehensive financial data, provide an inspiring, specific forecast about the user's financial future. Be encouraging and include specific amounts, dates, and milestones.

Financial Data:
- Current Balance: $${currentBalance.toLocaleString()}
- Scenario: ${scenarioData.name} (${scenarioData.description})
- Annual Return: ${(scenarioData.annualReturn * 100).toFixed(1)}%
- Savings Increase: ${savingsIncrease > 0 ? '+' : ''}${savingsIncrease}%
- Projected Balance in 1 year: $${projections.summary?.finalBalance?.toLocaleString() || 'N/A'}
- Total Contributions: $${projections.summary?.totalContributions?.toLocaleString() || 'N/A'}
- Interest Earned: $${projections.summary?.totalInterest?.toLocaleString() || 'N/A'}
\n${milestoneText}Write a futuristic forecast (3-4 sentences) that sounds like it's from a time-traveling financial advisor. Include specific amounts, dates, and reference the milestone predictions above so the forecast remains consistent with those analytic milestones. Make it sound exciting and achievable.`

    try {
      // Send our carefully-crafted prompt to OpenRouter and return the model's content
      // runOpenRouterPrompt will try free models first, then fall back to Google Gemini
      const content = await runOpenRouterPrompt(prompt)
      // Prefer returning the model content directly as the forecast
      return content
    } catch (error) {
      console.error('AI service unavailable or errored, using static forecast:', error)
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
      // Generate random return using Box-Muller transform for proper normal distribution
      const u1 = Math.random()
      const u2 = Math.random()
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
      const randomReturn = z0 * monthlyVolatility + monthlyReturn
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
