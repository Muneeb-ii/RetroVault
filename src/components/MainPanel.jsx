import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

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
  
  // Calculate totals from data with null checks
  const transactions = data.transactions || []
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
  
  const recentTransactions = transactions.slice(0, 5)

  return (
    <div className="flex-1 space-y-4 retro-dashboard-fade">
      {/* Balance Summary */}
      <div className="retro-info retro-fade-in">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2 retro-text-reveal">
            Balance: ${data.balance.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 mb-2 retro-fade-in-delay-1">
            Last updated: {data.lastUpdated}
          </div>
          <div className="flex justify-center space-x-4 text-xs">
            <span className="text-green-600 retro-fade-in-delay-2">Income: ${totalIncome.toLocaleString()}</span>
            <span className="text-red-600 retro-fade-in-delay-3">Expenses: ${totalExpenses.toLocaleString()}</span>
          </div>
          {/* Data Source Indicator */}
          <div className="mt-2 text-xs retro-fade-in-delay-1">
            {dataSource === 'Firestore' ? (
              <span className="text-green-600 font-bold retro-glow">💾 Data Source: Firestore Database</span>
            ) : dataSource === 'Nessie' ? (
              <span className="text-blue-600 font-bold retro-glow">💾 Data Source: Capital One Nessie API</span>
            ) : (
              <span className="text-orange-600 font-bold retro-glow">🧪 Data Source: Mock Mode</span>
            )}
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
            <Tooltip />
            <Bar dataKey="balance" fill="#4A90E2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* AI Insight */}
      <div className="retro-info bg-gradient-to-r from-blue-50 to-green-50 retro-fade-in-delay-1 retro-card-hover">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <div className="font-bold text-sm retro-text-reveal">
                {data.aiGenerated ? 'AI INSIGHT' : 'GEMINI INSIGHT'}
              </div>
              {data.aiGenerated && (
                <div className="text-xs text-green-600 font-bold retro-glow">✨ AI Generated</div>
              )}
            </div>
            <div className="text-sm retro-fade-in-delay-2">
              {data.aiInsight}
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
                <span className="text-lg">
                  {transaction.type === 'income' ? '💰' : '💸'}
                </span>
                <div>
                  <div className="text-sm font-medium retro-text-reveal" style={{animationDelay: `${index * 0.1 + 0.3}s`}}>{transaction.description}</div>
                  <div className="text-xs text-gray-600 retro-fade-in-delay-1" style={{animationDelay: `${index * 0.1 + 0.4}s`}}>{transaction.category} • {transaction.date}</div>
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

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-4">
        <button className="retro-button p-3 text-center hover:bg-gray-100 retro-fade-in-delay-1 retro-card-hover">
          <div className="text-2xl mb-1">💸</div>
          <div className="text-xs retro-text-reveal">Add Expense</div>
        </button>
        <button className="retro-button p-3 text-center hover:bg-gray-100 retro-fade-in-delay-2 retro-card-hover">
          <div className="text-2xl mb-1">💰</div>
          <div className="text-xs retro-text-reveal" style={{animationDelay: '0.4s'}}>Add Income</div>
        </button>
      </div>
    </div>
  )
}

export default MainPanel
