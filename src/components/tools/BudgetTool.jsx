import { useState, useEffect } from 'react'
import { 
  createBudget,
  getUserBudgets,
  updateBudget
} from '../../api/unifiedFirestoreService'

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
    if (!financialData?.user) return
    
    try {
      setIsSaving(true)
      
      // Save each budget using unified service
      for (const [category, amount] of Object.entries(budgets)) {
        if (amount > 0) {
          await createBudget({
            userId: financialData.user.uid,
            category: category,
            amount: amount,
            period: 'monthly'
          })
        }
      }
      
      setMessage('✅ Budgets saved successfully!')
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error saving budgets:', error)
      setMessage('❌ Failed to save budgets')
    } finally {
      setIsSaving(false)
    }
  }

  const getCategorySpending = (category) => {
    return financialData.transactions
      ?.filter(t => t.type === 'expense' && t.category === category)
      ?.reduce((sum, t) => sum + t.amount, 0) || 0
  }

  const getBudgetStatus = (category) => {
    const spending = getCategorySpending(category)
    const budget = budgets[category] || 0
    const percentage = budget > 0 ? (spending / budget) * 100 : 0
    
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
                   status.status === 'warning' ? 'WARNING' : 'ON TRACK'}
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
                <span>Usage: {((spending / budget) * 100).toFixed(1)}%</span>
              </div>
              
              {/* Progress Bar */}
              <div className="mt-2">
                <div className="w-full bg-gray-200 h-2 border border-gray-400">
                  <div 
                    className={`h-full ${status.status === 'over' ? 'bg-red-500' : 
                               status.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'}`}
                    style={{ width: `${Math.min(((spending / budget) * 100), 100)}%` }}
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
          onClick={saveBudgets}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Budgets'}
        </button>
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={onClose}
        >
          ✕ Close
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
