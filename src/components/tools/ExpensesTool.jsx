import { useState, useEffect } from 'react'
import { 
  createTransaction,
  getUserTransactions,
  updateTransaction,
  deleteTransaction,
  validateTransaction
} from '../../api/unifiedFirestoreService'
import { safeTimestamp } from '../../utils/timestampUtils'

const ExpensesTool = ({ financialData, onClose, onDataUpdate }) => {
  const [transactions, setTransactions] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    category: 'Other',
    type: 'expense',
    date: new Date().toISOString().split('T')[0]
  })

  const categories = [
    'Food', 'Transport', 'Entertainment', 'Shopping', 
    'Bills', 'Healthcare', 'Education', 'Travel', 'Other'
  ]

  useEffect(() => {
    loadTransactions()
  }, [financialData])

  const loadTransactions = async () => {
    if (!financialData?.user) return
    
    try {
      setIsLoading(true)
      const transactionData = await getUserTransactions(financialData.user.uid, { 
        limitCount: 50 
      })
      setTransactions(transactionData)
    } catch (error) {
      console.error('Error loading transactions:', error)
      setMessage('Failed to load transactions')
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
    
    // Validate form data using unified service
    const validation = validateTransaction({
      description: newTransaction.description,
      amount: parseFloat(newTransaction.amount),
      date: newTransaction.date,
      category: newTransaction.category,
      type: newTransaction.type
    })
    
    if (!validation.isValid) {
      setMessage(`❌ ${validation.errors.join(', ')}`)
      return
    }
    
    try {
      setIsSaving(true)
      const transactionData = {
        userId: financialData.user.uid,
        accountId: financialData.accounts[0]?.id || 'default',
        amount: parseFloat(newTransaction.amount),
        type: newTransaction.type,
        category: newTransaction.category,
        description: newTransaction.description,
        merchant: newTransaction.description,
        date: new Date(newTransaction.date).toISOString()
      }

      if (editingTransaction) {
        // Update existing transaction using unified service
        await updateTransaction(editingTransaction.id, transactionData)
        setMessage('✅ Transaction updated successfully!')
      } else {
        // Add new transaction using unified service
        await createTransaction(transactionData)
        setMessage('✅ Transaction added successfully!')
      }
      
      // Reset form
      setNewTransaction({
        description: '',
        amount: '',
        category: 'Other',
        type: 'expense',
        date: new Date().toISOString().split('T')[0]
      })
      setShowAddForm(false)
      setEditingTransaction(null)
      
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error saving transaction:', error)
      setMessage('❌ Failed to save transaction')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setNewTransaction({
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      type: transaction.type,
      date: new Date(transaction.date).toISOString().split('T')[0]
    })
    setShowAddForm(true)
  }

  const handleDelete = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return
    
    try {
      await deleteTransaction(transactionId)
      setMessage('Transaction deleted successfully!')
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error deleting transaction:', error)
      setMessage('Failed to delete transaction')
    }
  }

  const getCategoryColor = (category) => {
    const colors = {
      'Food': '#FF6B6B',
      'Transport': '#4ECDC4',
      'Entertainment': '#45B7D1',
      'Shopping': '#96CEB4',
      'Bills': '#FFEAA7',
      'Healthcare': '#DDA0DD',
      'Education': '#98D8C8',
      'Travel': '#F7DC6F',
      'Other': '#95A5A6'
    }
    return colors[category] || '#95A5A6'
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-lg font-bold mb-4">Loading transactions...</div>
        <div className="text-sm text-gray-600">Please wait while we fetch your expense data</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="text-center font-bold text-lg mb-6 text-retro-dark">
        💳 EXPENSE MANAGEMENT
      </div>

      {/* Add Transaction Button */}
      <div className="text-center mb-6">
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={() => setShowAddForm(true)}
        >
          ➕ Add New Transaction
        </button>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="retro-chart mb-6 p-4">
          <div className="text-center font-bold mb-4">
            {editingTransaction ? '✏️ Edit Transaction' : '➕ Add New Transaction'}
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold mb-1">Description:</label>
                <input
                  type="text"
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  className="retro-input w-full"
                  placeholder="Enter transaction description"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Amount:</label>
                <input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                  className="retro-input w-full"
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Type:</label>
                <select
                  value={newTransaction.type}
                  onChange={(e) => setNewTransaction({...newTransaction, type: e.target.value})}
                  className="retro-input w-full"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-1">Category:</label>
                <select
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({...newTransaction, category: e.target.value})}
                  className="retro-input w-full"
                >
                  {categories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-bold mb-1">Date:</label>
                <input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  className="retro-input w-full"
                  required
                />
              </div>
            </div>
            
            <div className="flex space-x-4 justify-center">
              <button
                type="submit"
                className="retro-button px-6 py-2"
                disabled={isSaving}
              >
                {isSaving ? '⏳ Saving...' : '💾 Save Transaction'}
              </button>
              <button
                type="button"
                className="retro-button px-6 py-2"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingTransaction(null)
                  setNewTransaction({
                    description: '',
                    amount: '',
                    category: 'Other',
                    type: 'expense',
                    date: new Date().toISOString().split('T')[0]
                  })
                }}
              >
                ✕ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-3 mb-6">
        <div className="text-center font-bold text-sm mb-4">RECENT TRANSACTIONS</div>
        {transactions.length === 0 ? (
          <div className="text-center p-8 text-gray-600">
            No transactions found. Add your first transaction above!
          </div>
        ) : (
          transactions.map((transaction, index) => (
            <div key={transaction.id} className="retro-chart p-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getCategoryColor(transaction.category) }}
                    />
                    <span className="font-bold text-sm">{transaction.description}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    {transaction.category} • {safeTimestamp(transaction.date, 'Unknown date')}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className={`font-bold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toFixed(2)}
                  </div>
                  <div className="flex space-x-1 mt-1">
                    <button
                      className="retro-button text-xs px-2 py-1"
                      onClick={() => handleEdit(transaction)}
                    >
                      Edit
                    </button>
                    <button
                      className="retro-button text-xs px-2 py-1"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={onClose}
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

      {/* Expense Tips */}
      <div className="retro-info mt-6">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">Expense Tips</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Record transactions immediately to avoid forgetting</div>
            <div>• Use specific categories for better tracking</div>
            <div>• Review your spending patterns regularly</div>
            <div>• Set up recurring transactions for bills</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExpensesTool
