// Story Mode Service for generating financial narratives
import { getFinancialInsights, OPENROUTER_API_URL } from './aiService'

/**
 * Generate a financial story narrative from user data
 * @param {Array} transactions - User transactions
 * @param {Array} savings - Savings data
 * @param {string} aiInsight - Current AI insight
 * @param {number} balance - Current balance
 * @returns {Promise<string>} Generated story narrative
 */
export const generateFinancialStory = async (transactions, savings, aiInsight, balance, preferredModel = null) => {
  try {
    // Analyze the data for story elements
    const storyData = analyzeFinancialData(transactions, savings, balance)
    
    try {
      // Try to get AI-generated story with consistent routing
      const insights = await getFinancialInsights(transactions, savings)
      return await generateStaticStory(storyData, balance, insights, transactions, preferredModel)
    } catch (error) {
      console.error('AI service unavailable, using fallback story generation:', error)
      // Try direct story generation with fallback routing
      try {
        return await generateStaticStory(storyData, balance, aiInsight, transactions, preferredModel)
      } catch (storyError) {
        console.error('Story generation failed, using static fallback:', storyError)
        return generateFallbackStory(balance)
      }
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
const generateStaticStory = async (storyData, balance, aiInsight, transactions = [], preferredModel = null) => {
  try {
    // Format transactions into a concise history string (date - type - category - amount)
    const formattedTransactions = (transactions || []).slice(-50).map(t => {
      const date = t.date ? new Date(t.date).toLocaleDateString() : 'unknown date'
      const type = t.type || 'unknown'
      const category = t.category || 'uncategorized'
      const amount = typeof t.amount === 'number' ? `$${t.amount.toFixed(2)}` : String(t.amount)
      return `- ${date} | ${type} | ${category} | ${amount}`
    }).join('\n') || 'No transactions available.'

    const prompt = `Write a short, engaging 100-word story about a person's financial journey. Make it sound like a nostalgic simulation game narrative. Use the following data:\n\nFinancial Data:\n- Current Balance: $${balance.toLocaleString()}\n- Recent Insight: "${aiInsight}"\n- Top Spending Category: ${storyData.topCategory}\n- Savings Trend: ${storyData.savingsTrend}\n- Recent Achievement: ${storyData.recentAchievement}\n\nTransaction History (most recent 50):\n${formattedTransactions}\n\nWrite in second person ("You") and make it sound like a retro computer game story with vivid descriptions and details. Include specific details about their financial habits, achievements, and future potential. Keep it professional and nostalgic, like an old RPG game gameplay. Generate only the story and not text like "loading saved file" or "story:"`

    // Try Google Gemini first
    try {
      console.log('Attempting Google Gemini first for story generation...')
      return await runPromptWithGemini(prompt)
    } catch (geminiError) {
      console.log('Google Gemini failed, trying OpenRouter free models...')
    }

    // Fallback to OpenRouter free models
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API key not configured')
    }

    // Define free models in order of preference (same as aiService.js)
    const freeModels = [
      'meta-llama/llama-3.1-8b-instruct',
      'microsoft/phi-3-mini-128k-instruct',
      'google/gemini-2.5-flash'
    ]

    // Use preferred model if provided, otherwise try free models
    const modelsToTry = preferredModel ? [preferredModel, ...freeModels] : freeModels

    let lastError = null
    for (const model of modelsToTry) {
      try {
        console.log(`Trying OpenRouter model for story generation: ${model}`)
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

        if (response.ok) {
          console.log(`Success with OpenRouter model: ${model}`)
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content
          if (!content) throw new Error('No content received from AI model')
          return content
        } else {
          const errorText = await response.text()
          console.warn(`OpenRouter model ${model} failed:`, response.status, errorText)
          lastError = new Error(`OpenRouter model ${model} failed: ${response.status}`)
          continue
        }
      } catch (error) {
        console.warn(`OpenRouter model ${model} error:`, error)
        lastError = error
        continue
      }
    }

    // If all OpenRouter models failed, throw the last error
    throw lastError || new Error('All models failed')

  } catch (error) {
    console.error('generateStaticStory error:', error)
    throw error
  }
}

/**
 * Run a prompt through Google Gemini as fallback (same as aiService.js)
 */
const runPromptWithGemini = async (prompt) => {
  const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
  
  if (!geminiApiKey || geminiApiKey === 'your_google_gemini_api_key_here') {
    throw new Error('Google Gemini API key not configured')
  }

  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.8,
        topK: 10
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Google Gemini API error: ${response.status}`)
  }

  const data = await response.json()
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!content) {
    throw new Error('No content received from Google Gemini')
  }

  return content
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
