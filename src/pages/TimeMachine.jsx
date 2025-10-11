import { useState, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import useFinancialStore from '../store/useFinancialStore'
import { generateTimeMachineForecast, calculateCompoundProjections, generateMilestones } from '../api/timeMachineService'

const TimeMachine = () => {
  const { data } = useFinancialStore()
  const [savingsIncrease, setSavingsIncrease] = useState(0) // Percentage increase
  const [projections, setProjections] = useState(null)
  const [aiForecast, setAiForecast] = useState('')
  const [showAiForecast, setShowAiForecast] = useState(false)
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false)
  const [milestones, setMilestones] = useState([])

  // Calculate projections when savings increase changes
  useEffect(() => {
    calculateProjections()
  }, [savingsIncrease, data])

  const calculateProjections = () => {
    const currentBalance = data.balance || 0
    const currentMonthlyIncome = data.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0) / 6 // Average monthly income
    
    const currentMonthlyExpenses = data.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0) / 6 // Average monthly expenses
    
    const currentMonthlySavings = currentMonthlyIncome - currentMonthlyExpenses
    const newMonthlySavings = currentMonthlySavings * (1 + savingsIncrease / 100)
    
    // Calculate projections for 6 months and 1 year
    const sixMonthProjection = currentBalance + (newMonthlySavings * 6)
    const oneYearProjection = currentBalance + (newMonthlySavings * 12)
    
    // Generate monthly data for chart
    const monthlyData = []
    for (let month = 0; month <= 12; month++) {
      const projectedBalance = currentBalance + (newMonthlySavings * month)
      monthlyData.push({
        month: month === 0 ? 'Now' : `Month ${month}`,
        balance: Math.round(projectedBalance),
        current: month === 0 ? currentBalance : currentBalance + (currentMonthlySavings * month)
      })
    }
    
    setProjections({
      sixMonth: Math.round(sixMonthProjection),
      oneYear: Math.round(oneYearProjection),
      monthlyData,
      newMonthlySavings: Math.round(newMonthlySavings),
      currentMonthlySavings: Math.round(currentMonthlySavings)
    })
    
    // Calculate milestones
    const newMilestones = generateMilestones(currentBalance, newMonthlySavings)
    setMilestones(newMilestones)
  }

  const generateAiForecast = async () => {
    if (!projections) return
    
    setIsGeneratingForecast(true)
    try {
      const forecast = await generateTimeMachineForecast(projections, data.balance, savingsIncrease)
      setAiForecast(forecast)
      setShowAiForecast(true)
    } catch (error) {
      console.error('Error generating AI forecast:', error)
      setAiForecast(`🚀 FUTURE FORECAST: At this rate, you'll reach $${projections.oneYear.toLocaleString()} by ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Your disciplined approach to saving will compound into significant wealth over time!`)
      setShowAiForecast(true)
    } finally {
      setIsGeneratingForecast(false)
    }
  }

  const closeAiForecast = () => {
    setShowAiForecast(false)
  }

  return (
    <div className="min-h-screen p-4">
      <TopNav />
      <div className="flex">
        <SideBar />
        <div className="flex-1">
          <div className="retro-window p-4">
            <div className="text-center font-bold text-lg mb-4 text-retro-dark">
              ⏰ FINANCIAL TIME MACHINE
            </div>
            
            {/* Savings Adjustment Slider */}
            <div className="retro-info mb-6">
              <div className="text-center mb-4">
                <div className="text-lg font-bold mb-2">Adjust Your Future Savings</div>
                <div className="text-sm text-gray-600">
                  Current Monthly Savings: ${projections?.currentMonthlySavings || 0}
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <span className="text-sm font-bold">-50%</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min="-50"
                    max="200"
                    value={savingsIncrease}
                    onChange={(e) => setSavingsIncrease(parseInt(e.target.value))}
                    className="retro-slider w-full"
                    style={{
                      background: `linear-gradient(to right, #4A90E2 0%, #4A90E2 ${((savingsIncrease + 50) / 250) * 100}%, #c0c0c0 ${((savingsIncrease + 50) / 250) * 100}%, #c0c0c0 100%)`
                    }}
                  />
                </div>
                <span className="text-sm font-bold">+200%</span>
              </div>
              
              <div className="text-center mt-2">
                <span className="text-lg font-bold text-blue-600">
                  {savingsIncrease > 0 ? '+' : ''}{savingsIncrease}%
                </span>
                <div className="text-sm text-gray-600">
                  New Monthly Savings: ${projections?.newMonthlySavings || 0}
                </div>
              </div>
            </div>

            {/* Projections Display */}
            {projections && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="retro-chart text-center">
                  <div className="text-sm font-bold mb-2">6 MONTH PROJECTION</div>
                  <div className="text-2xl font-bold text-green-600 mb-1">
                    ${projections.sixMonth.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    vs Current: ${data.balance.toLocaleString()}
                  </div>
                </div>
                
                <div className="retro-chart text-center">
                  <div className="text-sm font-bold mb-2">1 YEAR PROJECTION</div>
                  <div className="text-2xl font-bold text-blue-600 mb-1">
                    ${projections.oneYear.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-600">
                    vs Current: ${data.balance.toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Projection Chart */}
            {projections && (
              <div className="retro-chart mb-6">
                <div className="text-center font-bold mb-2 text-sm">FUTURE BALANCE PROJECTION</div>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={projections.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => [`$${value.toLocaleString()}`, '']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="current" 
                      stroke="#95A5A6" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="Current Trend"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="balance" 
                      stroke="#4A90E2" 
                      strokeWidth={3}
                      name="Projected"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Financial Milestones */}
            {milestones.length > 0 && (
              <div className="retro-chart mb-6">
                <div className="text-center font-bold mb-4 text-sm">FINANCIAL MILESTONES</div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {milestones.slice(0, 6).map((milestone, index) => (
                    <div key={index} className="retro-info text-center p-3">
                      <div className="text-lg font-bold text-blue-600">
                        ${milestone.amount.toLocaleString()}
                      </div>
                      <div className="text-xs font-bold mb-1">{milestone.name}</div>
                      <div className="text-xs text-gray-600">
                        {milestone.months} months
                      </div>
                      <div className="text-xs text-gray-500">
                        {milestone.targetDate}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Forecast Button */}
            <div className="text-center mb-4">
              <button
                className="retro-button px-6 py-3 text-lg font-bold"
                onClick={generateAiForecast}
                disabled={isGeneratingForecast}
              >
                {isGeneratingForecast ? '⏳ Generating...' : '🤖 AI Forecast Mode'}
              </button>
            </div>

            {/* AI Forecast Popup */}
            {showAiForecast && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="retro-window p-6 max-w-md mx-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="font-bold text-lg">🤖 AI FORECAST</div>
                    <button
                      className="retro-button text-sm px-2 py-1"
                      onClick={closeAiForecast}
                    >
                      ✕ Close
                    </button>
                  </div>
                  <div className="text-sm leading-relaxed">
                    {aiForecast}
                  </div>
                </div>
              </div>
            )}

            {/* Time Machine Info */}
            <div className="retro-info text-center">
              <div className="text-4xl mb-4">🕰️</div>
              <div className="text-lg mb-2">Financial Time Travel</div>
              <div className="text-sm text-gray-600">
                Adjust your savings habits to see how they'll impact your future financial position. 
                The Time Machine uses compound growth calculations to project your balance over time.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeMachine
