import { useState, useEffect } from 'react'
import { collection, getDocs, query, orderBy, where, addDoc } from 'firebase/firestore'
import { db } from '../../firebaseClient'
import { play } from '../../utils/soundPlayer'

const ReportsTool = ({ financialData, transactions, user, onClose, onDataUpdate }) => {
  const [reports, setReports] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedReport, setSelectedReport] = useState(null)
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  })

  const reportTypes = [
    { id: 'spending', name: 'Spending Analysis', icon: '💸' },
    { id: 'income', name: 'Income Report', icon: '💰' },
    { id: 'savings', name: 'Savings Summary', icon: '🏦' },
    { id: 'categories', name: 'Category Breakdown', icon: '📊' },
    { id: 'monthly', name: 'Monthly Summary', icon: '📅' },
    { id: 'yearly', name: 'Yearly Overview', icon: '📈' }
  ]

  useEffect(() => {
    if (user) {
      loadReports()
    }
  }, [user, financialData])

  const loadReports = async () => {
    if (!user?.uid) return
    
    try {
      setIsLoading(true)
      const reportsRef = collection(db, 'users', user.uid, 'reports')
      const q = query(reportsRef, orderBy('createdAt', 'desc'))
      const snapshot = await getDocs(q)
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setReports(reportsData)
    } catch (error) {
      console.error('Error loading reports:', error)
      setMessage('Failed to load reports')
    } finally {
      setIsLoading(false)
    }
  }

  const generateReport = async (reportType) => {
    if (!financialData?.user) return
    
    try {
      // play click sound for starting generation
      try { play('click1') } catch (e) {}
      setIsGenerating(true)
      
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      
      // Filter transactions by date range
      const filteredTransactions = financialData.transactions?.filter(transaction => {
        const transactionDate = new Date(transaction.date)
        return transactionDate >= startDate && transactionDate <= endDate
      }) || []

      let reportData = {}
      
      switch (reportType) {
        case 'spending':
          reportData = generateSpendingReport(filteredTransactions)
          break
        case 'income':
          reportData = generateIncomeReport(filteredTransactions)
          break
        case 'savings':
          reportData = generateSavingsReport(filteredTransactions)
          break
        case 'categories':
          reportData = generateCategoryReport(filteredTransactions)
          break
        case 'monthly':
          reportData = generateMonthlyReport(filteredTransactions)
          break
        case 'yearly':
          reportData = generateYearlyReport(filteredTransactions)
          break
        default:
          throw new Error('Invalid report type')
      }

      // Save report to Firestore
      const reportDoc = {
        type: reportType,
        title: reportTypes.find(r => r.id === reportType)?.name,
        data: reportData,
        dateRange: dateRange,
        createdAt: new Date().toISOString(),
        userId: user.uid
      }

      const docRef = await addDoc(collection(db, 'users', user.uid, 'reports'), reportDoc)
      reportDoc.id = docRef.id
      
  setReports(prev => [reportDoc, ...prev])
  setMessage('✅ Report generated successfully!')
  try { play('success') } catch (e) {}
      setTimeout(() => setMessage(''), 3000)
      
    } catch (error) {
      console.error('Error generating report:', error)
      setMessage('❌ Failed to generate report')
      try { play('error') } catch (e) {}
    } finally {
      setIsGenerating(false)
    }
  }

  const generateSpendingReport = (transactions) => {
    const expenses = transactions.filter(t => t.type === 'expense')
    const totalSpending = expenses.reduce((sum, t) => sum + t.amount, 0)
    const categoryBreakdown = {}
    
    expenses.forEach(transaction => {
      const category = transaction.category || 'Other'
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + transaction.amount
    })

    return {
      totalSpending,
      transactionCount: expenses.length,
      averageTransaction: expenses.length > 0 ? totalSpending / expenses.length : 0,
      categoryBreakdown,
      topCategories: Object.entries(categoryBreakdown)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
    }
  }

  const generateIncomeReport = (transactions) => {
    const income = transactions.filter(t => t.type === 'income')
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0)
    
    return {
      totalIncome,
      transactionCount: income.length,
      averageIncome: income.length > 0 ? totalIncome / income.length : 0,
      monthlyIncome: totalIncome / Math.max(1, Math.ceil((new Date(dateRange.end) - new Date(dateRange.start)) / (30 * 24 * 60 * 60 * 1000)))
    }
  }

  const generateSavingsReport = (transactions) => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0)
    const savings = income - expenses
    const savingsRate = income > 0 ? (savings / income) * 100 : 0
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netSavings: savings,
      savingsRate,
      isPositive: savings > 0
    }
  }

  const generateCategoryReport = (transactions) => {
    const categoryBreakdown = {}
    const expenseCategories = {}
    const incomeCategories = {}
    
    transactions.forEach(transaction => {
      const category = transaction.category || 'Other'
      if (transaction.type === 'expense') {
        expenseCategories[category] = (expenseCategories[category] || 0) + transaction.amount
      } else {
        incomeCategories[category] = (incomeCategories[category] || 0) + transaction.amount
      }
    })

    return {
      expenseCategories,
      incomeCategories,
      totalExpenses: Object.values(expenseCategories).reduce((sum, val) => sum + val, 0),
      totalIncome: Object.values(incomeCategories).reduce((sum, val) => sum + val, 0)
    }
  }

  const generateMonthlyReport = (transactions) => {
    const monthlyData = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expenses: 0, transactions: 0 }
      }
      
      monthlyData[monthKey].transactions++
      if (transaction.type === 'income') {
        monthlyData[monthKey].income += transaction.amount
      } else {
        monthlyData[monthKey].expenses += transaction.amount
      }
    })

    return {
      monthlyData: Object.entries(monthlyData).map(([month, data]) => ({
        month,
        ...data,
        netSavings: data.income - data.expenses
      }))
    }
  }

  const generateYearlyReport = (transactions) => {
    const yearlyData = {}
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date)
      const year = date.getFullYear()
      
      if (!yearlyData[year]) {
        yearlyData[year] = { income: 0, expenses: 0, transactions: 0 }
      }
      
      yearlyData[year].transactions++
      if (transaction.type === 'income') {
        yearlyData[year].income += transaction.amount
      } else {
        yearlyData[year].expenses += transaction.amount
      }
    })

    return {
      yearlyData: Object.entries(yearlyData).map(([year, data]) => ({
        year: parseInt(year),
        ...data,
        netSavings: data.income - data.expenses
      }))
    }
  }

  const exportReport = (report) => {
    const data = {
      report: report,
      generatedAt: new Date().toISOString(),
      user: user.displayName || user.email
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retrovault-${report.type}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setMessage('✅ Report exported successfully!')
    try { play('success') } catch (e) {}
    setTimeout(() => setMessage(''), 3000)
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-lg font-bold mb-4">Loading reports... 💾</div>
        <div className="text-sm text-gray-600">Please wait while we fetch your report data</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="text-center font-bold text-lg mb-6 text-retro-dark">
        📊 FINANCIAL REPORTS
      </div>

      {/* Date Range Selector */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">REPORT DATE RANGE</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Start Date:</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="retro-input w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-bold mb-1">End Date:</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="retro-input w-full"
            />
          </div>
        </div>
      </div>

      {/* Report Types */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">GENERATE REPORTS</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportTypes.map((reportType) => (
            <button
              key={reportType.id}
              className="retro-button p-4 text-center"
              onClick={() => { try { play('click1') } catch (e) {}; generateReport(reportType.id) }}
              disabled={isGenerating}
            >
              <div className="text-2xl mb-2">{reportType.icon}</div>
              <div className="text-sm font-bold">{reportType.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Generated Reports */}
      <div className="space-y-4 mb-6">
        <div className="text-center font-bold text-sm mb-4">GENERATED REPORTS</div>
        {reports.length === 0 ? (
          <div className="text-center p-8 text-gray-600">
            No reports generated yet. Create your first report above!
          </div>
        ) : (
          reports.map((report, index) => (
            <div key={report.id} className="retro-chart p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-lg">{reportTypes.find(r => r.id === report.type)?.icon}</span>
                    <span className="font-bold text-sm">{report.title}</span>
                    <span className="text-xs text-gray-600">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="text-xs text-gray-600 mb-2">
                    {new Date(report.dateRange.start).toLocaleDateString()} - {new Date(report.dateRange.end).toLocaleDateString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    {Object.keys(report.data).length} data points
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    className="retro-button text-xs px-2 py-1"
                    onClick={() => { try { play('click1') } catch (e) {}; setSelectedReport(selectedReport?.id === report.id ? null : report) }}
                  >
                    {selectedReport?.id === report.id ? '👁️ Hide' : '👁️ View'}
                  </button>
                  <button
                    className="retro-button text-xs px-2 py-1"
                    onClick={() => { try { play('click1') } catch (e) {}; exportReport(report) }}
                  >
                    📤 Export
                  </button>
                </div>
              </div>

              {/* Report Details */}
              {selectedReport?.id === report.id && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-300">
                  <div className="text-xs font-bold mb-2">REPORT DATA:</div>
                  <pre className="text-xs overflow-x-auto">
                    {JSON.stringify(report.data, null, 2)}
                  </pre>
                </div>
              )}
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
          ✕ Close
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mt-4 text-sm font-bold">
          {message}
        </div>
      )}

      {/* Report Tips */}
      <div className="retro-info mt-6">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">💡 Report Tips</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Generate reports for different time periods to track trends</div>
            <div>• Export reports for external analysis or tax purposes</div>
            <div>• Use monthly reports to identify spending patterns</div>
            <div>• Yearly reports help with long-term financial planning</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportsTool
