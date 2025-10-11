import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import useFinancialStore from '../store/useFinancialStore'

const MainPanel = () => {
  const { data, isLoading, getTotalIncome, getTotalExpenses, getRecentTransactions } = useFinancialStore()
  
  // Use real data from store
  const spendingData = data.spendingBreakdown
  const savingsData = data.savings
  const balanceData = data.weeklyBalance
  const totalIncome = getTotalIncome()
  const totalExpenses = getTotalExpenses()
  const recentTransactions = getRecentTransactions(5)

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="retro-info text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-lg">Loading financial data...</div>
          <div className="text-sm text-gray-600 mt-2">Please wait while we refresh your data</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-4">
      {/* Balance Summary */}
      <div className="retro-info">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            Balance: ${data.balance.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mb-2">
            Last updated: {data.lastUpdated}
          </div>
          <div className="flex justify-center space-x-4 text-xs">
            <span className="text-green-600">Income: ${totalIncome.toLocaleString()}</span>
            <span className="text-red-600">Expenses: ${totalExpenses.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending Breakdown */}
        <div className="retro-chart">
          <div className="text-center font-bold mb-2 text-sm">SPENDING BREAKDOWN</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={spendingData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                dataKey="value"
              >
                {spendingData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Savings Over Time */}
        <div className="retro-chart">
          <div className="text-center font-bold mb-2 text-sm">SAVINGS OVER TIME</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={savingsData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" stroke="#4ECDC4" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Weekly Balance Chart */}
      <div className="retro-chart">
        <div className="text-center font-bold mb-2 text-sm">WEEKLY BALANCE</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={balanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="balance" fill="#4A90E2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
      <div className="retro-info bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm">
                {data.aiGenerated ? 'AI INSIGHT' : 'GEMINI INSIGHT'}
              </div>
              {data.aiGenerated && (
                <div className="text-xs text-green-600 font-bold">✨ AI Generated</div>
              )}
            </div>
            <div className="text-sm">
              {data.aiInsight}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="retro-chart">
        <div className="text-center font-bold mb-2 text-sm">RECENT TRANSACTIONS</div>
        <div className="space-y-2">
          {recentTransactions.map((transaction, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-300">
              <div className="flex items-center space-x-2">
                <span className="text-lg">
                  {transaction.type === 'income' ? '💰' : '💸'}
                </span>
                <div>
                  <div className="text-sm font-medium">{transaction.description}</div>
                  <div className="text-xs text-gray-600">{transaction.category} • {transaction.date}</div>
                </div>
              </div>
              <div className={`text-sm font-bold ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="retro-button p-3 text-center hover:bg-gray-100">
          <div className="text-2xl mb-1">💸</div>
          <div className="text-xs">Add Expense</div>
        </button>
        <button className="retro-button p-3 text-center hover:bg-gray-100">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs">Add Income</div>
        </button>
      </div>
    </div>
  )
}

export default MainPanel
