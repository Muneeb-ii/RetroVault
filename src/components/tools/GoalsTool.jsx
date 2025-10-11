import { useState, useEffect } from 'react'
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore'
import { db } from '../../firebaseClient'

const GoalsTool = ({ financialData, onClose, onDataUpdate }) => {
  const [goals, setGoals] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingGoal, setEditingGoal] = useState(null)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    targetAmount: '',
    currentAmount: '',
    targetDate: '',
    category: 'Savings',
    priority: 'Medium'
  })

  const goalCategories = [
    'Savings', 'Emergency Fund', 'Vacation', 'Education', 
    'Home', 'Car', 'Investment', 'Debt Payoff', 'Other'
  ]

  const priorities = ['Low', 'Medium', 'High']

  useEffect(() => {
    loadGoals()
  }, [financialData])

  const loadGoals = async () => {
    if (!financialData?.user) return
    
    try {
      setIsLoading(true)
      const goalsRef = collection(db, 'users', financialData.user.uid, 'goals')
      const q = query(goalsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const goalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setGoals(goalsData)
    } catch (error) {
      console.error('Error loading goals:', error)
      setMessage('Failed to load goals')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!financialData?.user) {
      setMessage('❌ User not authenticated')
      return
    }
    
    // Validate form data
    if (!newGoal.title.trim()) {
      setMessage('❌ Goal title is required')
      return
    }
    if (!newGoal.targetAmount || parseFloat(newGoal.targetAmount) <= 0) {
      setMessage('❌ Target amount must be greater than 0')
      return
    }
    if (!newGoal.targetDate) {
      setMessage('❌ Target date is required')
      return
    }
    if (new Date(newGoal.targetDate) <= new Date()) {
      setMessage('❌ Target date must be in the future')
      return
    }
    
    try {
      setIsSaving(true)
      const goalData = {
        ...newGoal,
        targetAmount: parseFloat(newGoal.targetAmount),
        currentAmount: parseFloat(newGoal.currentAmount) || 0,
        targetDate: new Date(newGoal.targetDate).toISOString(),
        createdAt: new Date().toISOString(),
        userId: financialData.user.uid,
        isCompleted: false
      }

      if (editingGoal) {
        // Update existing goal
        await updateDoc(doc(db, 'users', financialData.user.uid, 'goals', editingGoal.id), goalData)
        setMessage('✅ Goal updated successfully!')
      } else {
        // Add new goal
        await addDoc(collection(db, 'users', financialData.user.uid, 'goals'), goalData)
        setMessage('✅ Goal added successfully!')
      }

      // Reset form
      setNewGoal({
        title: '',
        description: '',
        targetAmount: '',
        currentAmount: '',
        targetDate: '',
        category: 'Savings',
        priority: 'Medium'
      })
      setShowAddForm(false)
      setEditingGoal(null)
      
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error saving goal:', error)
      setMessage('❌ Failed to save goal')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (goal) => {
    setEditingGoal(goal)
    setNewGoal({
      title: goal.title,
      description: goal.description,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      targetDate: new Date(goal.targetDate).toISOString().split('T')[0],
      category: goal.category,
      priority: goal.priority
    })
    setShowAddForm(true)
  }

  const handleDelete = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal?')) return
    
    try {
      await deleteDoc(doc(db, 'users', financialData.user.uid, 'goals', goalId))
      setMessage('✅ Goal deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error deleting goal:', error)
      setMessage('❌ Failed to delete goal')
    }
  }

  const updateProgress = async (goalId, newAmount) => {
    try {
      await updateDoc(doc(db, 'users', financialData.user.uid, 'goals', goalId), {
        currentAmount: parseFloat(newAmount),
        isCompleted: parseFloat(newAmount) >= goals.find(g => g.id === goalId)?.targetAmount
      })
      setMessage('✅ Progress updated!')
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error updating progress:', error)
      setMessage('❌ Failed to update progress')
    }
  }

  const getProgressPercentage = (goal) => {
    return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100'
      case 'Medium': return 'text-yellow-600 bg-yellow-100'
      case 'Low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getDaysRemaining = (targetDate) => {
    const today = new Date()
    const target = new Date(targetDate)
    const diffTime = target - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-lg font-bold mb-4">Loading goals... 💾</div>
        <div className="text-sm text-gray-600">Please wait while we fetch your financial goals</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="text-center font-bold text-lg mb-6 text-retro-dark">
        🎯 FINANCIAL GOALS
      </div>

      {/* Add Goal Button */}
      <div className="text-center mb-6">
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add New Goal
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="retro-chart mb-6 p-4">
          <div className="text-center font-bold mb-4">
            {editingGoal ? '✏️ Edit Goal' : '➕ Add New Goal'}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Goal Title:</label>
                <input
                  type="text"
                  value={newGoal.title}
                  onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
                  className="retro-input w-full"
                  placeholder="e.g., Emergency Fund"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Category:</label>
                <select
                  value={newGoal.category}
                  onChange={(e) => setNewGoal({...newGoal, category: e.target.value})}
                  className="retro-input w-full"
                >
                  {goalCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Target Amount:</label>
                <input
                  type="number"
                  value={newGoal.targetAmount}
                  onChange={(e) => setNewGoal({...newGoal, targetAmount: e.target.value})}
                  className="retro-input w-full"
                  placeholder="10000"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Current Amount:</label>
                <input
                  type="number"
                  value={newGoal.currentAmount}
                  onChange={(e) => setNewGoal({...newGoal, currentAmount: e.target.value})}
                  className="retro-input w-full"
                  placeholder="2500"
                  step="0.01"
                  min="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Target Date:</label>
                <input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) => setNewGoal({...newGoal, targetDate: e.target.value})}
                  className="retro-input w-full"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Priority:</label>
                <select
                  value={newGoal.priority}
                  onChange={(e) => setNewGoal({...newGoal, priority: e.target.value})}
                  className="retro-input w-full"
                >
                  {priorities.map(priority => (
                    <option key={priority} value={priority}>{priority}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-1">Description:</label>
                <textarea
                  value={newGoal.description}
                  onChange={(e) => setNewGoal({...newGoal, description: e.target.value})}
                  className="retro-input w-full h-20"
                  placeholder="Describe your goal and why it's important..."
                />
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <button
                type="submit"
                className="retro-button px-6 py-2"
                disabled={isSaving}
              >
                {isSaving ? '⏳ Saving...' : '💾 Save Goal'}
              </button>
              <button
                type="button"
                className="retro-button px-6 py-2"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingGoal(null)
                  setNewGoal({
                    title: '',
                    description: '',
                    targetAmount: '',
                    currentAmount: '',
                    targetDate: '',
                    category: 'Savings',
                    priority: 'Medium'
                  })
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Goals List */}
      <div className="space-y-4 mb-6">
        <div className="text-center font-bold text-sm mb-4">YOUR FINANCIAL GOALS</div>
        {goals.length === 0 ? (
          <div className="text-center p-8 text-gray-600">
            No goals set yet. Create your first financial goal above!
          </div>
        ) : (
          goals.map((goal, index) => {
            const progress = getProgressPercentage(goal)
            const daysRemaining = getDaysRemaining(goal.targetDate)
            const isOverdue = daysRemaining < 0
            const isCompleted = goal.isCompleted || progress >= 100

            return (
              <div key={goal.id} className="retro-chart p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-bold text-sm">{goal.title}</span>
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                      {isCompleted && (
                        <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800">
                          COMPLETED
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      {goal.category} • Target: {new Date(goal.targetDate).toLocaleDateString()}
                    </div>
                    {goal.description && (
                      <div className="text-xs text-gray-600 mb-2">{goal.description}</div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      ${goal.currentAmount.toFixed(0)} / ${goal.targetAmount.toFixed(0)}
                    </div>
                    <div className="text-xs text-gray-600">
                      {progress.toFixed(1)}% complete
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="w-full bg-gray-200 h-3 border border-gray-400">
                    <div 
                      className={`h-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Progress Update */}
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-xs font-bold">Update Progress:</span>
                  <input
                    type="number"
                    defaultValue={goal.currentAmount}
                    className="retro-input text-xs w-20"
                    step="0.01"
                    min="0"
                    onBlur={(e) => updateProgress(goal.id, e.target.value)}
                  />
                  <span className="text-xs text-gray-600">
                    {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : 
                     `${daysRemaining} days remaining`}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <button
                    className="retro-button text-xs px-2 py-1"
                    onClick={() => handleEdit(goal)}
                  >
                    ✏️ Edit
                  </button>
                  <button
                    className="retro-button text-xs px-2 py-1"
                    onClick={() => handleDelete(goal.id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
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

      {/* Goal Tips */}
      <div className="retro-info mt-6">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">💡 Goal Setting Tips</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Set SMART goals: Specific, Measurable, Achievable, Relevant, Time-bound</div>
            <div>• Break large goals into smaller milestones</div>
            <div>• Review and adjust goals regularly</div>
            <div>• Celebrate progress along the way</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GoalsTool
