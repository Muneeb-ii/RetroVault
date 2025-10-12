import React, { useState, useEffect, useRef } from 'react'
import { useFinancialData } from '../../contexts/FinancialDataContext'
import { getFinancialInsights, getAvailableModels } from '../../api/aiService'
import { calculateFinancialInsights, formatDataForAI } from '../../utils/financialDataHelpers'
import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js'
import { play as playSound } from '../../utils/soundPlayer'

const ElizaTool = ({ financialData, onClose, onDataUpdate }) => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [conversationHistory, setConversationHistory] = useState([])
  const messagesEndRef = useRef(null)
  const { user } = useFinancialData()
  const audioRef = useRef(null)
  const currentAudioUrlRef = useRef(null)

  // Initialize ElevenLabs client once
  const elevenlabsApiKey = import.meta.env.VITE_ELEVENLABS_API_KEY
  const elevenlabs = useRef(null)
  if (!elevenlabs.current && elevenlabsApiKey) {
    elevenlabs.current = new ElevenLabsClient({ apiKey: elevenlabsApiKey })
  }

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load conversation history from localStorage
  useEffect(() => {
    const savedConversation = localStorage.getItem('eliza-conversation')
    if (savedConversation) {
      try {
        const parsed = JSON.parse(savedConversation)
        setConversationHistory(parsed)
      } catch (error) {
        console.error('Error loading conversation history:', error)
      }
    }
  }, [])

  // Stop playback helper
  const stopPlayback = () => {
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.removeAttribute('src')
        audioRef.current.load()
        audioRef.current = null
      }
      if (currentAudioUrlRef.current) {
        try { URL.revokeObjectURL(currentAudioUrlRef.current) } catch (e) {}
        currentAudioUrlRef.current = null
      }
    } catch (err) {
      console.error('Error stopping audio playback', err)
    }
  }

  // Play Eliza's message via ElevenLabs (on-demand)
  const playElizaAudio = async (text) => {
    if (!elevenlabs.current) {
      console.warn('ElevenLabs API key not configured — skipping TTS')
      return
    }

    try {
      // Stop any existing playback first
      stopPlayback()

      const audioIterable = await elevenlabs.current.textToSpeech.convert('EXAVITQu4vr4xnSDxMaL', {
        text,
        modelId: 'eleven_multilingual_v2'
      })

      const chunks = []
      for await (const chunk of audioIterable) {
        chunks.push(chunk)
      }

      const blob = new Blob(chunks, { type: 'audio/mpeg' })
      const audioUrl = URL.createObjectURL(blob)
      currentAudioUrlRef.current = audioUrl

      const audioElement = new Audio(audioUrl)
      audioRef.current = audioElement

      audioElement.addEventListener('ended', () => {
        try { URL.revokeObjectURL(audioUrl) } catch (e) {}
        currentAudioUrlRef.current = null
        audioRef.current = null
      })

      await audioElement.play()
    } catch (error) {
      console.error('Error playing Eliza TTS:', error)
    }
  }

  // Save conversation history to localStorage
  useEffect(() => {
    if (conversationHistory.length > 0) {
      localStorage.setItem('eliza-conversation', JSON.stringify(conversationHistory))
    }
  }, [conversationHistory])

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 1,
          type: 'bot',
          content: `👋 Hello! I'm Eliza, your advanced AI financial assistant. I have comprehensive access to all your financial data and can provide:\n\n• 📊 Deep financial analysis with health scoring\n• 💰 Personalized budget recommendations\n• 📈 Advanced spending pattern analysis\n• 🎯 Smart goal setting and tracking advice\n• 💡 Data-driven money-saving strategies\n• 📋 Transaction pattern insights\n• 🔍 Unusual spending detection\n• 📈 Income trend analysis\n• 💾 Savings optimization tips\n\nI can analyze your complete financial picture and provide specific, actionable advice. What would you like to explore?`,
          timestamp: new Date()
        }
      ])
    }
  }, [])

  const generateContextualResponse = async (userMessage) => {
    try {
      // Calculate comprehensive financial insights
      const insights = await calculateFinancialInsights(financialData)
      
      if (!insights) {
        return "I don't have access to your financial data yet. Please ensure your account is properly connected and try again."
      }

      // Try Google Gemini first
      try {
        console.log('Attempting Google Gemini first...')
        const geminiResponse = await callGoogleGemini(userMessage, insights)
        return geminiResponse
      } catch (geminiError) {
        console.log('Google Gemini failed, trying OpenRouter...')
      }

      // Fallback to OpenRouter AI service
      const response = await callOpenRouterAI(userMessage, insights)
      return response

    } catch (error) {
      console.error('Error generating AI response:', error)
      
      // Try using the existing AI service as fallback
      try {
        console.log('Attempting fallback to existing AI service...')
        const fallbackInsights = await getFinancialInsights(
          financialData?.transactions || [],
          financialData?.savings || []
        )
        
        if (fallbackInsights && fallbackInsights.length > 0) {
          return `🤖 Based on your financial data: ${fallbackInsights.join(' ')}`
        }
      } catch (fallbackError) {
        console.error('Fallback AI service also failed:', fallbackError)
      }
      
      // Final fallback to contextual response
      return generateFallbackResponse(userMessage, financialData)
    }
  }

  const callOpenRouterAI = async (userMessage, insights) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY
    
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      console.warn('OpenRouter API key not configured, using fallback response')
      return generateFallbackResponse(userMessage, financialData)
    }

    // Debug API key format
    console.log('OpenRouter API Key format check:', {
      hasKey: !!apiKey,
      keyLength: apiKey?.length,
      keyPrefix: apiKey?.substring(0, 10) + '...',
      keySuffix: '...' + apiKey?.substring(apiKey.length - 10)
    })

    // Validate API key format (OpenRouter keys typically start with 'sk-or-')
    if (!apiKey.startsWith('sk-or-')) {
      console.warn('OpenRouter API key format may be incorrect. Expected format: sk-or-...')
    }

    // Test API key with a simple request first
    try {
      const testResponse = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'RetroVault Eliza AI'
        }
      })
      
      if (!testResponse.ok) {
        console.error('API key test failed:', testResponse.status, testResponse.statusText)
        throw new Error(`API key validation failed: ${testResponse.status}`)
      }
      
      console.log('API key validation successful')
    } catch (testError) {
      console.error('API key test error:', testError)
      throw new Error('OpenRouter API key is invalid or expired')
    }

    // Format comprehensive financial data for AI
    const formattedData = formatDataForAI(insights, financialData)

    // Build conversation context
    const chatContext = conversationHistory
      .slice(-6) // Last 3 exchanges (6 messages)
      .map(msg => `${msg.type === 'user' ? 'User' : 'Eliza'}: ${msg.content}`)
      .join('\n')

    const prompt = `You are Eliza, an intelligent financial AI assistant with comprehensive access to the user's financial data. You should provide helpful, personalized advice based on their complete financial picture.

${formattedData}

${chatContext ? `Previous conversation context:
${chatContext}

` : ''}Current question: "${userMessage}"

Instructions:
1. Be conversational and friendly like a personal financial advisor
2. Use the specific financial data provided above to give personalized insights
3. Reference exact numbers, trends, and patterns from their account
4. Provide actionable advice based on their spending patterns, income trends, and savings behavior
5. If they ask about specific categories, spending, or financial health, use the detailed analysis provided
6. Keep responses informative but concise (2-4 sentences)
7. Use emojis appropriately to make responses engaging
8. Focus on actionable insights they can implement immediately
9. If their financial health score is low, suggest specific improvements
10. If they have unusual spending patterns, address them constructively
11. Reference previous conversation topics when relevant to build continuity
12. Provide clean, well-formatted responses without markdown or special formatting

Respond as Eliza with specific, data-driven advice:`

    // Try multiple free models in order of preference
    const freeModels = [
      'meta-llama/llama-3.1-8b-instruct',
      'microsoft/phi-3-mini-128k-instruct',
      'google/gemini-2.5-flash'
    ]

    let lastError = null
    for (const model of freeModels) {
      try {
        console.log(`Trying model: ${model}`)
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': window.location.origin,
            'X-Title': 'RetroVault Eliza AI'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: 'user',
                content: prompt
              }
            ]
          })
        })

        if (response.ok) {
          console.log(`Success with model: ${model}`)
          const data = await response.json()
          const content = data.choices?.[0]?.message?.content

          if (!content) {
            throw new Error('No response from AI')
          }

          return content.trim()
        } else {
          const errorText = await response.text()
          console.warn(`Model ${model} failed:`, response.status, errorText)
          lastError = new Error(`Model ${model} failed: ${response.status}`)
          continue
        }
      } catch (error) {
        console.warn(`Model ${model} error:`, error)
        lastError = error
        continue
      }
    }

    // If all models failed, throw the last error
    throw lastError || new Error('All free models failed')
  }

  const callGoogleGemini = async (userMessage, insights) => {
    const geminiApiKey = import.meta.env.VITE_GOOGLE_GEMINI_API_KEY
    
    if (!geminiApiKey || geminiApiKey === 'your_google_gemini_api_key_here') {
      console.warn('Google Gemini API key not configured, skipping Gemini fallback')
      throw new Error('Google Gemini API key not configured')
    }

    console.log('Google Gemini API Key format check:', {
      hasKey: !!geminiApiKey,
      keyLength: geminiApiKey?.length,
      keyPrefix: geminiApiKey?.substring(0, 10) + '...'
    })

    // Validate Gemini API key format (Google API keys typically start with 'AIza')
    if (!geminiApiKey.startsWith('AIza')) {
      console.warn('Google Gemini API key format may be incorrect. Expected format: AIza...')
    }

    // Test Gemini API key with a simple request first
    try {
      const testResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`)
      
      if (!testResponse.ok) {
        console.error('Gemini API key test failed:', testResponse.status, testResponse.statusText)
        throw new Error(`Gemini API key validation failed: ${testResponse.status}`)
      }
      
      console.log('Gemini API key validation successful')
    } catch (testError) {
      console.error('Gemini API key test error:', testError)
      throw new Error('Google Gemini API key is invalid or expired')
    }

    // Format comprehensive financial data for AI
    const formattedData = formatDataForAI(insights, financialData)

    // Build conversation context
    const chatContext = conversationHistory
      .slice(-6) // Last 3 exchanges (6 messages)
      .map(msg => `${msg.type === 'user' ? 'User' : 'Eliza'}: ${msg.content}`)
      .join('\n')

    const prompt = `You are Eliza, an intelligent financial AI assistant with comprehensive access to the user's financial data. You should provide helpful, personalized advice based on their complete financial picture.

${formattedData}

${chatContext ? `Previous conversation context:
${chatContext}

` : ''}Current question: "${userMessage}"

Instructions:
1. Be conversational and friendly like a personal financial advisor
2. Use the specific financial data provided above to give personalized insights
3. Reference exact numbers, trends, and patterns from their account
4. Provide actionable advice based on their spending patterns, income trends, and savings behavior
5. If they ask about specific categories, spending, or financial health, use the detailed analysis provided
6. Keep responses informative but concise (2-4 sentences)
7. Use emojis appropriately to make responses engaging
8. Focus on actionable insights they can implement immediately
9. If their financial health score is low, suggest specific improvements
10. If they have unusual spending patterns, address them constructively
11. Reference previous conversation topics when relevant to build continuity
12. Provide clean, well-formatted responses without markdown or special formatting

Respond as Eliza with specific, data-driven advice:`

    console.log('Calling Google Gemini API...')
    
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
          maxOutputTokens: 400,
          topP: 0.8,
          topK: 10
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Google Gemini API Error:', response.status, errorText)
      throw new Error(`Google Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!content) {
      throw new Error('No response from Google Gemini')
    }

    return content.trim()
  }

  const generateFallbackResponse = (userMessage, financialData) => {
    const balance = financialData?.balance || 0
    const totalIncome = financialData?.transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0
    const totalExpenses = financialData?.transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0
    const transactionCount = financialData?.transactions?.length || 0
    const netBalance = totalIncome - totalExpenses
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0

    // Calculate spending breakdown
    const spendingBreakdown = {}
    financialData?.transactions?.filter(t => t.type === 'expense').forEach(t => {
      spendingBreakdown[t.category] = (spendingBreakdown[t.category] || 0) + t.amount
    })
    const topCategory = Object.keys(spendingBreakdown).reduce((a, b) => 
      spendingBreakdown[a] > spendingBreakdown[b] ? a : b, 'None'
    )

    if (userMessage.toLowerCase().includes('balance') || userMessage.toLowerCase().includes('money')) {
      return `💰 Your current balance is $${balance.toLocaleString()}. Your net position is $${netBalance.toLocaleString()} (income - expenses). ${netBalance > 0 ? 'Great job maintaining positive cash flow!' : 'Consider reviewing your spending to improve your financial position.'}`
    } else if (userMessage.toLowerCase().includes('income') || userMessage.toLowerCase().includes('earn')) {
      return `📈 Your total income is $${totalIncome.toLocaleString()}. This shows your earning capacity. ${totalIncome > 0 ? `Your average income per transaction is $${(totalIncome / (financialData?.transactions?.filter(t => t.type === 'income').length || 1)).toFixed(2)}.` : 'No income transactions found.'}`
    } else if (userMessage.toLowerCase().includes('expense') || userMessage.toLowerCase().includes('spend')) {
      return `💸 Your total expenses are $${totalExpenses.toLocaleString()}. Your top spending category is ${topCategory} ($${(spendingBreakdown[topCategory] || 0).toLocaleString()}). ${totalExpenses > 0 ? `Daily average: $${(totalExpenses / 30).toFixed(2)}` : 'No expense transactions found.'}`
    } else if (userMessage.toLowerCase().includes('health') || userMessage.toLowerCase().includes('score')) {
      const healthScore = balance > 0 ? Math.min(100, Math.max(30, 50 + (netBalance / Math.max(totalIncome, 1)) * 50)) : 20
      return `🏥 Your financial health score is approximately ${Math.round(healthScore)}/100. Based on your balance of $${balance.toLocaleString()}, net position of $${netBalance.toLocaleString()}, and savings rate of ${savingsRate.toFixed(1)}%. ${healthScore < 50 ? 'Consider building an emergency fund and reducing expenses.' : 'You\'re doing well! Keep up the good financial habits.'}`
    } else if (userMessage.toLowerCase().includes('transaction') || userMessage.toLowerCase().includes('recent')) {
      const recentTransactions = financialData?.transactions?.slice(0, 3) || []
      const recentSummary = recentTransactions.map(t => `${t.type === 'income' ? '💰' : '💸'} $${t.amount} (${t.category})`).join(', ')
      return `📋 You have ${transactionCount} transactions. Recent activity: ${recentSummary || 'No recent transactions'}. Your transaction frequency is ${transactionCount > 20 ? 'high' : transactionCount > 5 ? 'moderate' : 'low'}.`
    } else if (userMessage.toLowerCase().includes('save') || userMessage.toLowerCase().includes('saving')) {
      return `🎯 Your current savings rate is ${savingsRate.toFixed(1)}%. ${savingsRate > 20 ? 'Excellent savings rate! Keep it up.' : savingsRate > 10 ? 'Good savings rate. Consider increasing it to 20%.' : 'Consider increasing your savings rate to at least 10-20% of your income.'} ${savingsRate < 10 ? 'Try setting up automatic transfers to build savings habits.' : ''}`
    } else if (userMessage.toLowerCase().includes('budget') || userMessage.toLowerCase().includes('plan')) {
      return `📊 Budget Analysis: Your top spending category is ${topCategory} ($${(spendingBreakdown[topCategory] || 0).toLocaleString()}). Consider setting budgets for each category. A good rule is 50% needs, 30% wants, 20% savings. Your current allocation needs review.`
    } else if (userMessage.toLowerCase().includes('advice') || userMessage.toLowerCase().includes('help')) {
      return `🤖 I'm Eliza, your financial assistant! Here's your financial snapshot: Balance: $${balance.toLocaleString()}, Income: $${totalIncome.toLocaleString()}, Expenses: $${totalExpenses.toLocaleString()}, Savings Rate: ${savingsRate.toFixed(1)}%. I can help with budget planning, expense tracking, and financial goal setting. What specific area would you like to focus on?`
    } else {
      return `🤖 I'm Eliza, your financial assistant! I can help analyze your spending ($${totalExpenses.toLocaleString()}), income ($${totalIncome.toLocaleString()}), and balance ($${balance.toLocaleString()}). Your savings rate is ${savingsRate.toFixed(1)}%. What would you like to know about your finances?`
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)

    // Add to conversation history
    setConversationHistory(prev => [...prev, userMessage])

    // Simulate AI thinking time
    setTimeout(async () => {
      const botResponse = await generateContextualResponse(inputMessage)
      
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: botResponse,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      
      // Add bot response to conversation history
      setConversationHistory(prev => [...prev, botMessage])
      setIsTyping(false)
    }, 1500)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const clearConversation = () => {
    setMessages([])
    setConversationHistory([])
    localStorage.removeItem('eliza-conversation')
    
    // Reset to welcome message
    setMessages([
      {
        id: 1,
        type: 'bot',
        content: `👋 Hello! I'm Eliza, your advanced AI financial assistant. I have comprehensive access to all your financial data and can provide:\n\n• 📊 Deep financial analysis with health scoring\n• 💰 Personalized budget recommendations\n• 📈 Advanced spending pattern analysis\n• 🎯 Smart goal setting and tracking advice\n• 💡 Data-driven money-saving strategies\n• 📋 Transaction pattern insights\n• 🔍 Unusual spending detection\n• 📈 Income trend analysis\n• 💾 Savings optimization tips\n\nI can analyze your complete financial picture and provide specific, actionable advice. What would you like to explore?`,
        timestamp: new Date()
      }
    ])
  }

  const formatTime = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-300 bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">Eliza AI Assistant</h2>
          <p className="text-sm text-gray-600">Your intelligent financial companion</p>
        </div>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={clearConversation}
            className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
          >
            Clear Chat
          </button>
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-600">Online</span>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                message.type === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200 shadow-sm'
              }`}>
              <div className="flex items-start space-x-2">
                <div className="flex-1 whitespace-pre-wrap text-sm">{message.content}</div>
                {message.type === 'bot' && (
                  <button
                    onClick={() => { stopPlayback(); playSound('click1'); playElizaAudio(message.content) }}
                    title="Play audio"
                    className="ml-2 p-1 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M3 22v-20l18 10-18 10z" />
                    </svg>
                  </button>
                )}
              </div>
              <div className={`text-xs mt-1 ${
                message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 shadow-sm rounded-lg px-4 py-3">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span className="text-sm text-gray-500">Eliza is thinking...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-300 bg-white p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask Eliza about your financial health, spending patterns, or savings goals..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isTyping}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isTyping}
            className="px-6 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium"
          >
            Send
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          💡 Try asking: "What's my financial health score?", "Analyze my spending patterns", "How can I save more?", "What are my unusual transactions?"
        </div>
      </div>
    </div>
  )
}

export default ElizaTool
