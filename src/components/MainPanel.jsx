import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const MainPanel = () => {
  // Mock data for charts
  const spendingData = [
    { name: 'Food', value: 400, color: '#FF6B6B' },
    { name: 'Transport', value: 300, color: '#4ECDC4' },
    { name: 'Entertainment', value: 200, color: '#45B7D1' },
    { name: 'Shopping', value: 150, color: '#96CEB4' },
    { name: 'Bills', value: 250, color: '#FFEAA7' }
  ]

  const savingsData = [
    { month: 'Jan', amount: 1200 },
    { month: 'Feb', amount: 1350 },
    { month: 'Mar', amount: 1500 },
    { month: 'Apr', amount: 1650 },
    { month: 'May', amount: 1800 },
    { month: 'Jun', amount: 1950 }
  ]

  const balanceData = [
    { day: 'Mon', balance: 2450 },
    { day: 'Tue', balance: 2380 },
    { day: 'Wed', balance: 2520 },
    { day: 'Thu', balance: 2480 },
    { day: 'Fri', balance: 2600 },
    { day: 'Sat', balance: 2550 },
    { day: 'Sun', balance: 2450 }
  ]

  return (
    <div className="flex-1 space-y-4">
      {/* Balance Summary */}
      <div className="retro-info">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">
            Balance: $2,450.00
          </div>
          <div className="text-sm text-gray-600">
            Last updated: {new Date().toLocaleString()}
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

      {/* Gemini AI Insight */}
      <div className="retro-info bg-gradient-to-r from-blue-50 to-green-50">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🤖</div>
          <div>
            <div className="font-bold text-sm mb-1">GEMINI INSIGHT</div>
            <div className="text-sm">
              "You've saved 12% more than last month. Keep it up! Your spending on entertainment 
              decreased by $45, which shows great discipline. Consider setting up an automatic 
              transfer to your savings account."
            </div>
          </div>
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
