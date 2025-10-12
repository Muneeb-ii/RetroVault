import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'
import { safeTimestamp } from '../utils/timestampUtils'

// Custom tooltip for weekly balance chart
const WeeklyBalanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="retro-info p-3 border-2 border-gray-400 bg-white shadow-lg">
        <div className="font-bold text-sm mb-2">{label}</div>
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="font-bold">Balance:</span>
            <span className="text-blue-600">${data.balance.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Income:</span>
            <span className="text-green-600">+${data.income.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Expenses:</span>
            <span className="text-red-600">-${data.expenses.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Net Change:</span>
            <span className={data.netChange >= 0 ? 'text-green-600' : 'text-red-600'}>
              {data.netChange >= 0 ? '+' : ''}${data.netChange.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="font-bold">Transactions:</span>
            <span className="text-gray-600">{data.transactionCount}</span>
          </div>
        </div>
      </div>
    )
  }
  return null
}

const MainPanel = ({ data, dataSource = 'Firestore' }) => {
  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="retro-info text-center">
          <div className="text-4xl mb-4">📊</div>
          <div className="text-lg">No financial data available</div>
          <div className="text-sm text-gray-600 mt-2">Please ensure your data is properly loaded</div>
        </div>
      </div>
    )
  }
  
  // Use data from props with null checks
  const spendingData = data.spendingBreakdown || []
  const savingsData = data.savings || []
  const balanceData = data.weeklyBalance || []
  
  // Use the calculated totals from financial data
  const totalIncome = data.totalIncome || 0
  const totalExpenses = data.totalExpenses || 0
  
  const recentTransactions = data.recentTransactions || []

  return (
    <div className="flex-1 space-y-4 retro-dashboard-fade">
      {/* Balance Summary */}
      <div className="retro-info retro-fade-in">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2 retro-text-reveal">
            Balance: ${data.balance.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mb-2 retro-fade-in-delay-1">
            Last updated: {safeTimestamp(data.lastUpdated)}
          </div>
          <div className="flex justify-center space-x-4 text-xs">
            <span className="text-green-600 retro-fade-in-delay-2">Income: ${totalIncome.toLocaleString()}</span>
            <span className="text-red-600 retro-fade-in-delay-3">Expenses: ${totalExpenses.toLocaleString()}</span>
          </div>
          {dataSource === 'Nessie' && data.accountInfo && (
            <div className="mt-1 text-xs text-gray-500 retro-fade-in-delay-2">
              Account: {data.accountInfo.accountName} ({data.accountInfo.accountType})
            </div>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Spending Breakdown */}
        <div className="retro-chart retro-chart-animate retro-card-hover">
          <div className="text-center font-bold mb-2 text-sm retro-text-reveal">SPENDING BREAKDOWN</div>
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
        <div className="retro-chart retro-chart-animate retro-card-hover" style={{animationDelay: '0.2s'}}>
          <div className="text-center font-bold mb-2 text-sm retro-text-reveal" style={{animationDelay: '0.3s'}}>SAVINGS OVER TIME</div>
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
      <div className="retro-chart retro-chart-animate retro-card-hover" style={{animationDelay: '0.4s'}}>
        <div className="text-center font-bold mb-2 text-sm retro-text-reveal" style={{animationDelay: '0.5s'}}>WEEKLY BALANCE</div>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={balanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip content={<WeeklyBalanceTooltip />} />
            <Bar dataKey="balance" fill="#4A90E2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
      <div className="retro-info bg-gradient-to-r from-blue-50 to-green-50 retro-fade-in-delay-1 retro-card-hover">
        <div className="flex items-start space-x-3">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm retro-text-reveal">
                {data.aiGenerated ? 'AI INSIGHT' : 'GEMINI INSIGHT'}
              </div>
              {data.aiGenerated && (
                <div className="text-xs text-green-600 font-bold">AI Generated</div>
              )}
            </div>
            <div className="text-sm retro-fade-in-delay-2">
              {data.geminiInsight ? (
                Array.isArray(data.geminiInsight) ? 
                  data.geminiInsight.map((insight, index) => (
                    <div key={index} className="mb-2">{insight}</div>
                  )) : 
                  data.geminiInsight
              ) : (
                'AI insights are being generated...'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="retro-chart retro-chart-animate retro-card-hover" style={{animationDelay: '0.6s'}}>
        <div className="text-center font-bold mb-2 text-sm retro-text-reveal" style={{animationDelay: '0.7s'}}>RECENT TRANSACTIONS</div>
        <div className="space-y-2">
          {recentTransactions.map((transaction, index) => (
            <div key={index} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-300 retro-transaction-slide retro-card-hover" style={{animationDelay: `${index * 0.1}s`}}>
              <div className="flex items-center space-x-2">
                <div>
                  <div className="text-sm font-medium retro-text-reveal" style={{animationDelay: `${index * 0.1 + 0.3}s`}}>{transaction.description}</div>
                  <div className="text-xs text-gray-600 retro-fade-in-delay-1" style={{animationDelay: `${index * 0.1 + 0.4}s`}}>{transaction.category} • {safeTimestamp(transaction.date, 'Unknown date')}</div>
                </div>
              </div>
              <div className={`text-sm font-bold retro-text-reveal ${
                transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
              }`} style={{animationDelay: `${index * 0.1 + 0.5}s`}}>
                {transaction.type === 'income' ? '+' : '-'}${transaction.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}

export default MainPanel
