import { create } from 'zustand'
import { generateMockData } from '../data/mockData'
import { getFinancialInsights } from '../api/aiService'

const useFinancialStore = create((set, get) => ({
  // Initial state
  data: generateMockData(),
  isLoading: false,
  
  // Actions
  refreshData: async () => {
    set({ isLoading: true })
    
    // Generate new mock data
    const newData = generateMockData()
    
    // Generate AI insights
    try {
      const aiInsights = await getFinancialInsights(newData.transactions, newData.savings)
      newData.aiInsight = aiInsights.join(' ')
      newData.aiGenerated = true
    } catch (error) {
      console.error('Failed to generate AI insights:', error)
      newData.aiGenerated = false
    }
    
    set({ 
      data: newData,
      isLoading: false 
    })
  },
  
  // Getter functions for computed values
  getTotalIncome: () => {
    const { data } = get()
    return data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  getTotalExpenses: () => {
    const { data } = get()
    return data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  getRecentTransactions: (limit = 5) => {
    const { data } = get()
    return data.transactions.slice(0, limit)
  },
  
  getTopSpendingCategory: () => {
    const { data } = get()
    if (data.spendingBreakdown.length === 0) return null
    
    return data.spendingBreakdown.reduce((max, category) => 
      category.value > max.value ? category : max
    )
  }
}))

export default useFinancialStore
