import { useState, useEffect } from 'react'
import { 
  createBudget,
  getUserBudgets,
  updateBudget as updateBudgetInDB,
  deleteBudget
} from '../../api/unifiedFirestoreService'
import { play as playSound } from '../../utils/soundPlayer'

const BudgetTool = ({ financialData, onClose, onDataUpdate }) => {
  const [budgets, setBudgets] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const categories = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 
    'Bills', 'Healthcare', 'Education', 'Travel', 'Other'
  ]

  useEffect(() => {
    loadBudgets()
  }, [financialData])

  const loadBudgets = async () => {
    if (!financialData?.user) return
    
    try {
      setIsLoading(true)
      const userBudgets = await getUserBudgets(financialData.user.uid)
      
      if (userBudgets.length > 0) {
        // Convert array to object format for display
        const budgetsObj = {}
        userBudgets.forEach(budget => {
          budgetsObj[budget.category] = budget.amount
        })
        setBudgets(budgetsObj)
      } else {
        // Initialize with default budgets based on current spending
        const defaultBudgets = {}
        categories.forEach(category => {
          const categorySpending = financialData.transactions
            ?.filter(t => t.type === 'expense' && t.category === category)
            ?.reduce((sum, t) => sum + t.amount, 0) || 0
          defaultBudgets[category] = Math.max(categorySpending * 1.2, 100) // 20% buffer
        })
        setBudgets(defaultBudgets)
      }
    } catch (error) {
      console.error('Error loading budgets:', error)
      setMessage('Failed to load budget data')
    } finally {
      setIsLoading(false)
    }
  }

  const updateBudget = (category, amount) => {
    setBudgets(prev => ({
      ...prev,
      [category]: parseFloat(amount) || 0
    }))
  }

  const saveBudgets = async () => {
    if (!financialData?.user) {
      setMessage('❌ User not authenticated')
      return
    }
    
    try {
      setIsSaving(true)
      setMessage('')
      
      // Validate budgets before saving
      const validBudgets = Object.entries(budgets).filter(([category, amount]) => {
        const numAmount = parseFloat(amount)
        return numAmount > 0 && !isNaN(numAmount)
      })
      
      if (validBudgets.length === 0) {
        setMessage('⚠️ Please set at least one budget amount greater than 0')
        return
      }
      
      // Get existing budgets to check for updates
      const existingBudgets = await getUserBudgets(financialData.user.uid)
      const existingBudgetMap = {}
      existingBudgets.forEach(budget => {
        existingBudgetMap[budget.category] = budget
      })
      
      let savedCount = 0
      let updatedCount = 0
      
      // Save or update each budget
      for (const [category, amount] of validBudgets) {
        const budgetData = {
          userId: financialData.user.uid,
          category: category,
          amount: parseFloat(amount),
          period: 'monthly',
          isActive: true
        }
        
        if (existingBudgetMap[category]) {
          // Update existing budget
          await updateBudgetInDB(existingBudgetMap[category].id, budgetData)
          updatedCount++
        } else {
          // Create new budget
          await createBudget(budgetData)
          savedCount++
        }
      }
      
      const message = savedCount > 0 && updatedCount > 0 
        ? `✅ ${savedCount} budgets created, ${updatedCount} budgets updated!`
        : savedCount > 0 
        ? `✅ ${savedCount} budgets created successfully!`
        : `✅ ${updatedCount} budgets updated successfully!`
        
      setMessage(message)
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
  playSound('success')
    } catch (error) {
      console.error('Error saving budgets:', error)
      setMessage('❌ Failed to save budgets: ' + error.message)
  playSound('error')
    } finally {
      setIsSaving(false)
    }
  }

  const getCategorySpending = (category) => {
    return financialData.transactions
      ?.filter(t => t.type === 'expense' && t.category === category)
      ?.reduce((sum, t) => sum + t.amount, 0) || 0
  }

  const clearAllBudgets = () => {
    if (confirm('Are you sure you want to clear all budget amounts? This will reset all budgets to 0.')) {
      const clearedBudgets = {}
      categories.forEach(category => {
        clearedBudgets[category] = 0
      })
      setBudgets(clearedBudgets)
      setMessage('🔄 All budgets cleared. Click Save to apply changes.')
      playSound('click1')
    }
  }

  const getBudgetStatus = (category) => {
    const spending = getCategorySpending(category)
    const budget = budgets[category] || 0
    
    // Handle zero budget case
    if (budget === 0) {
      if (spending > 0) {
        return { status: 'no-budget', color: 'text-orange-600' }
      }
      return { status: 'no-budget', color: 'text-gray-600' }
    }
    
    const percentage = (spending / budget) * 100
    
    if (percentage >= 100) return { status: 'over', color: 'text-red-600' }
    if (percentage >= 80) return { status: 'warning', color: 'text-yellow-600' }
    return { status: 'good', color: 'text-green-600' }
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-lg font-bold mb-4">Loading budget data... 💾</div>
        <div className="text-sm text-gray-600">Please wait while we fetch your budget settings</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="text-center font-bold text-lg mb-6 text-retro-dark">
        💰 BUDGET MANAGEMENT
      </div>

      {/* Budget Overview */}
      <div className="retro-info mb-6">
        <div className="text-center mb-4">
          <div className="text-lg font-bold mb-2">Monthly Budget Overview</div>
          <div className="text-sm text-gray-600">
            Set spending limits for each category to control your finances
          </div>
        </div>
      </div>

      {/* Budget Categories */}
      <div className="space-y-4 mb-6">
        {categories.map((category, index) => {
          const spending = getCategorySpending(category)
          const budget = budgets[category] || 0
          const status = getBudgetStatus(category)
          const remaining = budget - spending

          return (
            <div key={category} className="retro-chart p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="font-bold text-sm">{category}</div>
                <div className={`text-xs ${status.color}`}>
                  {status.status === 'over' ? 'OVER BUDGET' : 
                   status.status === 'warning' ? 'WARNING' : 
                   status.status === 'no-budget' ? 'NO BUDGET SET' : 'ON TRACK'}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-bold mb-1">Budget Limit:</label>
                  <input
                    type="number"
                    value={budget}
                    onChange={(e) => updateBudget(category, e.target.value)}
                    className="retro-input w-full text-sm"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">Current Spending:</label>
                  <div className="retro-input w-full text-sm bg-gray-100">
                    ${spending.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-xs">
                <span>Remaining: ${remaining.toFixed(2)}</span>
                <span>Usage: {budget > 0 ? ((spending / budget) * 100).toFixed(1) + '%' : 'N/A'}</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 h-2 border border-gray-400">
                  <div 
                    className={`h-full ${
                      status.status === 'over' ? 'bg-red-500' : 
                      status.status === 'warning' ? 'bg-yellow-500' : 
                      status.status === 'no-budget' ? 'bg-gray-400' : 'bg-green-500'
                    }`}
                    style={{ 
                      width: budget > 0 
                        ? `${Math.min(((spending / budget) * 100), 100)}%` 
                        : '0%'
                    }}
                  />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={() => { playSound('click1'); saveBudgets() }}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Budgets'}
        </button>
        <button
          className="retro-button px-4 py-3 text-sm font-bold bg-orange-600 hover:bg-orange-700"
          onClick={() => { playSound('click1'); clearAllBudgets() }}
          disabled={isSaving}
        >
          Clear All
        </button>
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={() => { playSound('click1'); onClose() }}
        >
          Close
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mt-4 text-sm font-bold">
          {message}
        </div>
      )}

      {/* Budget Tips */}
      <div className="retro-info mt-6">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">💡 Budget Tips</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Set realistic budgets based on your income</div>
            <div>• Review and adjust budgets monthly</div>
            <div>• Use the 50/30/20 rule: 50% needs, 30% wants, 20% savings</div>
            <div>• Track your spending regularly to stay on target</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BudgetTool
