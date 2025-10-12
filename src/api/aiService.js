// AI Service for generating financial insights using OpenRouter
export const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Generate AI-powered financial insights from user data
 * @param {Array} transactions - Array of transaction objects
 * @param {Array} savings - Array of savings data
 * @param {string} model - AI model to use (default: google/gemini-1.5-pro)
 * @returns {Promise<Array<string>>} Array of 2 short insights
 */
export const getFinancialInsights = async (transactions, savings, model = 'google/gemini-2.5-flash') => {
  try {
    // Get API key from environment
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.warn('OpenRouter API key not configured. Using fallback insights.')
      return getFallbackInsights(transactions, savings)
    }

    // Calculate key statistics
    const stats = calculateFinancialStats(transactions, savings)
    
    // Construct the prompt
    const prompt = `Analyze the following user financial data and provide exactly 2 short, human-friendly insights about spending and savings trends. Keep each insight under 50 words and focus on actionable advice.

Financial Data:
- Total Income: $${stats.totalIncome}
- Total Expenses: $${stats.totalExpenses}
- Net Balance: $${stats.netBalance}
- Top Spending Category: ${stats.topCategory} ($${stats.topCategoryAmount})
- Average Monthly Savings: $${stats.avgSavings}
- Savings Trend: ${stats.savingsTrend}

Recent Transactions: ${JSON.stringify(transactions.slice(0, 5))}
Savings History: ${JSON.stringify(savings)}

Provide 2 concise insights in this format:
1. [First insight about spending patterns]
2. [Second insight about savings or financial health]`

    // Make API request
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'RetroVault Financial AI'
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      throw new Error('No content received from AI model')
    }

    // Parse the insights from the response
    const insights = parseAIResponse(content)
    return insights

  } catch (error) {
    console.error('Error generating AI insights:', error)
    // Return fallback insights on error
    return getFallbackInsights(transactions, savings)
  }
}

/**
 * Calculate key financial statistics
 */
const calculateFinancialStats = (transactions, savings) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const netBalance = totalIncome - totalExpenses
  
  // Calculate top spending category
  const categoryTotals = {}
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount
    })
  
  const topCategory = Object.keys(categoryTotals).reduce((a, b) => 
    categoryTotals[a] > categoryTotals[b] ? a : b, 'None'
  )
  
  const topCategoryAmount = categoryTotals[topCategory] || 0
  
  // Calculate savings statistics
  const avgSavings = savings.length > 0 
    ? savings.reduce((sum, s) => sum + s.amount, 0) / savings.length 
    : 0
  
  const savingsTrend = savings.length >= 2 
    ? savings[savings.length - 1].amount > savings[0].amount ? 'increasing' : 'decreasing'
    : 'stable'
  
  return {
    totalIncome,
    totalExpenses,
    netBalance,
    topCategory,
    topCategoryAmount,
    avgSavings,
    savingsTrend
  }
}

/**
 * Parse AI response to extract insights
 */
const parseAIResponse = (content) => {
  // Try to extract numbered insights
  const lines = content.split('\n').filter(line => line.trim())
  const insights = []
  
  for (const line of lines) {
    // Look for numbered items or bullet points
    const match = line.match(/^\d+\.\s*(.+)$/) || line.match(/^[-•]\s*(.+)$/)
    if (match) {
      insights.push(match[1].trim())
    }
  }
  
  // If we found insights, return them
  if (insights.length >= 2) {
    return insights.slice(0, 2)
  }
  
  // Fallback: split by sentences and take first two
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 10)
  return sentences.slice(0, 2).map(s => s.trim())
}

/**
 * Generate fallback insights when AI is unavailable
 */
const getFallbackInsights = (transactions, savings) => {
  const stats = calculateFinancialStats(transactions, savings)
  
  const insights = []
  
  // Generate spending insight
  if (stats.topCategoryAmount > 0) {
    const percentage = Math.round((stats.topCategoryAmount / stats.totalExpenses) * 100)
    insights.push(`Your ${stats.topCategory.toLowerCase()} spending accounts for ${percentage}% of your total expenses. Consider reviewing this category for potential savings.`)
  } else {
    insights.push("Your spending patterns show good balance across categories. Keep monitoring your expenses to maintain financial health.")
  }
  
  // Generate savings insight
  if (stats.savingsTrend === 'increasing') {
    insights.push(`Great job! Your savings are trending upward with an average of $${Math.round(stats.avgSavings)} per month. This shows excellent financial discipline.`)
  } else if (stats.savingsTrend === 'decreasing') {
    insights.push(`Your savings trend is declining. Consider setting up automatic transfers to maintain consistent savings habits.`)
  } else {
    insights.push(`Your savings are stable at $${Math.round(stats.avgSavings)} per month. Consider increasing this amount to accelerate your financial goals.`)
  }
  
  return insights
}

/**
 * Get available AI models
 */
export const getAvailableModels = () => {
  return [
    { id: 'google/gemini-1.5-pro', name: 'Google Gemini 1.5 Pro' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet' },
    { id: 'openai/gpt-4o', name: 'GPT-4o' },
    { id: 'meta-llama/llama-3.1-8b-instruct', name: 'Llama 3.1 8B' }
  ]
}

/**
 * Run a raw prompt through OpenRouter and return the model's content string
 * @param {string} prompt - The prompt to send to the model
 * @param {string} model - The model id to use
 * @returns {Promise<string>} The content returned by the model
 */
export const runOpenRouterPrompt = async (prompt, model = 'google/gemini-2.5-flash') => {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured')
    }

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'RetroVault Financial AI'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('No content received from AI model')
    return content

  } catch (error) {
    console.error('runOpenRouterPrompt error:', error)
    throw error
  }
}
