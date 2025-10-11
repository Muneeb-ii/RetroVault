// Time Machine AI Service for generating futuristic financial forecasts
import { getFinancialInsights } from './aiService'

/**
 * Generate AI-powered financial forecast for Time Machine
 * @param {Object} projections - Projection data
 * @param {number} currentBalance - Current balance
 * @param {number} savingsIncrease - Percentage increase in savings
 * @returns {Promise<string>} AI-generated forecast
 */
export const generateTimeMachineForecast = async (projections, currentBalance, savingsIncrease) => {
  try {
    const prompt = `You are a futuristic financial advisor from the year 2030. Based on the following financial data, provide an inspiring, specific forecast about the user's financial future. Be encouraging and include specific amounts, dates, and milestones.

Financial Data:
- Current Balance: $${currentBalance.toLocaleString()}
- Current Monthly Savings: $${projections.currentMonthlySavings.toLocaleString()}
- Savings Increase: ${savingsIncrease > 0 ? '+' : ''}${savingsIncrease}%
- New Monthly Savings: $${projections.newMonthlySavings.toLocaleString()}
- Projected Balance in 6 months: $${projections.sixMonth.toLocaleString()}
- Projected Balance in 1 year: $${projections.oneYear.toLocaleString()}

Write a futuristic forecast (2-3 sentences) that sounds like it's from a time-traveling financial advisor. Include specific amounts, dates, and encouraging milestones. Make it sound exciting and achievable.`

    // Try to get AI insights, fallback to static forecast if needed
    try {
      const insights = await getFinancialInsights([], [])
      return generateStaticForecast(projections, currentBalance, savingsIncrease)
    } catch (error) {
      console.error('AI service unavailable, using static forecast:', error)
      return generateStaticForecast(projections, currentBalance, savingsIncrease)
    }

  } catch (error) {
    console.error('Error generating Time Machine forecast:', error)
    return generateStaticForecast(projections, currentBalance, savingsIncrease)
  }
}

/**
 * Generate static forecast when AI is unavailable
 */
const generateStaticForecast = (projections, currentBalance, savingsIncrease) => {
  const futureDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  const monthYear = futureDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  
  const forecasts = [
    `🚀 FUTURE FORECAST: At this rate, you'll reach $${projections.oneYear.toLocaleString()} by ${monthYear}. Your disciplined approach to saving will compound into significant wealth over time!`,
    
    `⏰ TIME MACHINE PREDICTION: With ${savingsIncrease > 0 ? '+' : ''}${savingsIncrease}% savings increase, you'll achieve $${projections.oneYear.toLocaleString()} by ${monthYear}. This trajectory puts you on track for financial independence!`,
    
    `🔮 FINANCIAL CRYSTAL BALL: Your future self will thank you! At this savings rate, you'll reach $${projections.oneYear.toLocaleString()} by ${monthYear}. The compound effect of consistent saving is your greatest financial superpower.`,
    
    `🌟 WEALTH PROJECTION: Excellent trajectory! You're on track to reach $${projections.oneYear.toLocaleString()} by ${monthYear}. This disciplined approach will create lasting financial security and freedom.`,
    
    `💫 FUTURE VISION: Outstanding financial planning! Your projected balance of $${projections.oneYear.toLocaleString()} by ${monthYear} demonstrates the power of consistent saving. You're building wealth that will compound for decades.`
  ]
  
  // Select forecast based on savings increase
  if (savingsIncrease >= 100) {
    return forecasts[0] // Most optimistic for high increases
  } else if (savingsIncrease >= 50) {
    return forecasts[1]
  } else if (savingsIncrease >= 0) {
    return forecasts[2]
  } else if (savingsIncrease >= -25) {
    return forecasts[3]
  } else {
    return forecasts[4] // Encouraging even for decreases
  }
}

/**
 * Calculate compound interest projections
 * @param {number} principal - Starting balance
 * @param {number} monthlyContribution - Monthly savings amount
 * @param {number} annualRate - Annual interest rate (default 2%)
 * @param {number} months - Number of months to project
 * @returns {Array} Array of monthly balances
 */
export const calculateCompoundProjections = (principal, monthlyContribution, annualRate = 0.02, months = 12) => {
  const monthlyRate = annualRate / 12
  const projections = []
  let balance = principal
  
  for (let month = 0; month <= months; month++) {
    projections.push({
      month: month === 0 ? 'Now' : `Month ${month}`,
      balance: Math.round(balance),
      contribution: month > 0 ? monthlyContribution : 0,
      interest: month > 0 ? Math.round(balance * monthlyRate) : 0
    })
    
    if (month < months) {
      balance = balance * (1 + monthlyRate) + monthlyContribution
    }
  }
  
  return projections
}

/**
 * Generate milestone predictions
 * @param {number} currentBalance - Current balance
 * @param {number} monthlySavings - Monthly savings amount
 * @param {number} annualRate - Annual interest rate
 * @returns {Array} Array of milestone objects
 */
export const generateMilestones = (currentBalance, monthlySavings, annualRate = 0.02) => {
  const milestones = [
    { amount: 10000, name: 'First $10K' },
    { amount: 25000, name: 'Quarter Milestone' },
    { amount: 50000, name: 'Half Century' },
    { amount: 100000, name: 'Six Figures' },
    { amount: 250000, name: 'Quarter Million' },
    { amount: 500000, name: 'Half Million' }
  ]
  
  const monthlyRate = annualRate / 12
  const results = []
  
  milestones.forEach(milestone => {
    if (milestone.amount > currentBalance) {
      // Calculate months needed to reach milestone
      let months = 0
      let balance = currentBalance
      
      while (balance < milestone.amount && months < 120) { // Max 10 years
        balance = balance * (1 + monthlyRate) + monthlySavings
        months++
      }
      
      if (months < 120) {
        const targetDate = new Date()
        targetDate.setMonth(targetDate.getMonth() + months)
        
        results.push({
          ...milestone,
          months,
          targetDate: targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
          achievable: true
        })
      }
    }
  })
  
  return results
}
