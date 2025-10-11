import { useState, useEffect } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import { useFinancialData } from '../contexts/FinancialDataContext'
import { 
  generateTimeMachineForecast, 
  calculateAdvancedProjections as calculateProjectionsService, 
  generateAdvancedMilestones,
  calculateRetirementReadiness,
  monteCarloSimulation,
  validateFinancialData,
  validateCalculationParameters,
  sanitizeFinancialData,
  FINANCIAL_SCENARIOS
} from '../api/timeMachineService'

const TimeMachine = () => {
  const { financialData, isLoading, error } = useFinancialData()
  
  // State management
  const [savingsIncrease, setSavingsIncrease] = useState(0)
  const [selectedScenario, setSelectedScenario] = useState('MODERATE')
  const [timeRange, setTimeRange] = useState(10) // years
  const [currentAge, setCurrentAge] = useState(30)
  const [retirementAge, setRetirementAge] = useState(65)
  const [projections, setProjections] = useState(null)
  const [milestones, setMilestones] = useState([])
  const [retirementData, setRetirementData] = useState(null)
  const [monteCarloData, setMonteCarloData] = useState(null)
  const [aiForecast, setAiForecast] = useState('')
  const [showAiForecast, setShowAiForecast] = useState(false)
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false)
  const [activeTab, setActiveTab] = useState('projections')
  const [dataValidation, setDataValidation] = useState({ isValid: true, errors: [], warnings: [] })
  const [calculationValidation, setCalculationValidation] = useState({ isValid: true, errors: [], warnings: [] })

  // Calculate projections when parameters change
  useEffect(() => {
    if (financialData) {
      calculateAdvancedProjections()
    }
  }, [savingsIncrease, selectedScenario, timeRange, currentAge, retirementAge, financialData])

  const calculateAdvancedProjections = () => {
    if (!financialData) return
    
    // Step 1: Validate and sanitize financial data
    const sanitizedData = sanitizeFinancialData(financialData)
    const dataValidationResult = validateFinancialData(sanitizedData)
    setDataValidation(dataValidationResult)
    
    if (!dataValidationResult.isValid) {
      console.error('Data validation failed:', dataValidationResult.errors)
      return
    }
    
    const currentBalance = sanitizedData.balance
    const scenario = FINANCIAL_SCENARIOS[selectedScenario]
    
    // Step 2: Calculate monthly savings with enhanced validation
    const transactions = sanitizedData.transactions || []
    
    // Separate income and expenses with proper validation
    const incomeTransactions = transactions.filter(t => 
      t.type === 'income' && t.amount > 0
    )
    const expenseTransactions = transactions.filter(t => 
      t.type === 'expense' && t.amount > 0
    )
    
    // Calculate totals with validation
    const totalIncome = incomeTransactions.reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount) || 0)
      return sum + amount
    }, 0)
    
    const totalExpenses = expenseTransactions.reduce((sum, t) => {
      const amount = Math.abs(Number(t.amount) || 0)
      return sum + amount
    }, 0)
    
    // Calculate time period with better estimation
    const transactionDates = transactions
      .map(t => new Date(t.date))
      .filter(date => !isNaN(date.getTime()))
      .sort((a, b) => a - b)
    
    const monthsOfData = transactionDates.length > 0 
      ? Math.max(1, (transactionDates[transactionDates.length - 1] - transactionDates[0]) / (1000 * 60 * 60 * 24 * 30))
      : Math.max(1, Math.floor(transactions.length / 10))
    
    const currentMonthlyIncome = totalIncome / monthsOfData
    const currentMonthlyExpenses = totalExpenses / monthsOfData
    const currentMonthlySavings = Math.max(0, currentMonthlyIncome - currentMonthlyExpenses)
    
    const newMonthlySavings = Math.max(0, currentMonthlySavings * (1 + savingsIncrease / 100))
    
    // Step 3: Validate calculation parameters
    const calculationParams = {
      currentBalance,
      monthlySavings: newMonthlySavings,
      annualReturn: scenario.annualReturn,
      years: timeRange,
      inflation: scenario.inflation,
      currentAge,
      retirementAge
    }
    
    const calculationValidationResult = validateCalculationParameters(calculationParams)
    setCalculationValidation(calculationValidationResult)
    
    if (!calculationValidationResult.isValid) {
      console.error('Calculation validation failed:', calculationValidationResult.errors)
      return
    }
    
    try {
      // Step 4: Calculate projections with error handling
      const projectionData = calculateProjectionsService(
        currentBalance, 
        newMonthlySavings, 
        scenario.annualReturn, 
        timeRange, 
        scenario.inflation
      )
      
      setProjections(projectionData)
      
      // Calculate milestones
      const newMilestones = generateAdvancedMilestones(
        currentBalance, 
        newMonthlySavings, 
        scenario.annualReturn, 
        scenario.inflation
      )
      setMilestones(newMilestones)
      
      // Calculate retirement readiness
      const retirement = calculateRetirementReadiness(
        currentAge,
        retirementAge,
        currentBalance,
        newMonthlySavings,
        scenario.annualReturn,
        scenario.inflation
      )
      setRetirementData(retirement)
      
      // Calculate Monte Carlo simulation
      const monteCarlo = monteCarloSimulation(
        currentBalance,
        newMonthlySavings,
        scenario.annualReturn,
        scenario.annualReturn * 0.15, // 15% volatility
        timeRange
      )
      setMonteCarloData(monteCarlo)
      
    } catch (error) {
      console.error('Error in calculations:', error)
      setDataValidation({
        isValid: false,
        errors: ['Calculation error: ' + error.message],
        warnings: []
      })
    }
  }

  const generateAiForecast = async () => {
    if (!projections || !financialData) return
    
    setIsGeneratingForecast(true)
    try {
      const forecast = await generateTimeMachineForecast(
        projections, 
        financialData.balance, 
        savingsIncrease, 
        selectedScenario
      )
      setAiForecast(forecast)
      setShowAiForecast(true)
    } catch (error) {
      console.error('Error generating AI forecast:', error)
      setAiForecast(`🚀 FUTURE FORECAST: At this rate, you'll reach $${projections.summary?.finalBalance?.toLocaleString()} by ${new Date(Date.now() + timeRange * 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Your disciplined approach to saving will compound into significant wealth over time!`)
      setShowAiForecast(true)
    } finally {
      setIsGeneratingForecast(false)
    }
  }

  const closeAiForecast = () => {
    setShowAiForecast(false)
  }

  // Prepare chart data for different visualizations
  const prepareChartData = () => {
    if (!projections || !projections.projections || projections.projections.length === 0) return []
    
    return projections.projections
      .filter((_, index) => index % 12 === 0) // Yearly data points
      .map((point, index) => ({
        year: index,
        balance: point.balance || 0,
        realValue: point.realValue || 0,
        contributions: point.totalContributions || 0,
        interest: point.totalInterest || 0
      }))
  }

  const prepareContributionData = () => {
    if (!projections || !projections.projections || projections.projections.length === 0) return []
    
    const final = projections.projections[projections.projections.length - 1]
    if (!final) return []
    
    return [
      { name: 'Contributions', value: final.totalContributions || 0, color: '#4A90E2' },
      { name: 'Interest Earned', value: final.totalInterest || 0, color: '#7B68EE' }
    ]
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">⏰ Time Machine</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">Loading financial data... Please Wait 💾</div>
            <div className="text-sm text-gray-600">Preparing your time machine projections</div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">❌ Error</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4 text-red-600">Failed to load data</div>
            <div className="text-sm text-gray-600 mb-4">{error}</div>
          </div>
        </div>
      </div>
    )
  }

  // No data state
  if (!financialData) {
    return (
      <div className="min-h-screen flex items-center justify-center retro-auth-bg">
        <div className="window max-w-md">
          <div className="title-bar">
            <div className="title-bar-text">⏰ Time Machine</div>
          </div>
          <div className="window-body text-center">
            <div className="text-lg font-bold mb-4">No financial data available</div>
            <div className="text-sm text-gray-600">Please ensure your data is properly loaded</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4">
      <TopNav />
      <div className="flex">
        <SideBar />
        <div className="flex-1">
          <div className="retro-window p-4">
            {/* Enhanced Header */}
            <div className="text-center font-bold text-2xl mb-6 text-retro-dark">
              🕰️ FINANCIAL TIME MACHINE - YEAR 2030+
            </div>
            
            {/* Data Validation Status */}
            {(!dataValidation.isValid || dataValidation.warnings.length > 0 || calculationValidation.warnings.length > 0) && (
              <div className="mb-6">
                {!dataValidation.isValid && (
                  <div className="retro-info bg-red-100 border-red-300 mb-2">
                    <div className="text-sm font-bold text-red-800 mb-2">⚠️ DATA VALIDATION ERRORS</div>
                    <ul className="text-xs text-red-700 space-y-1">
                      {dataValidation.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(dataValidation.warnings.length > 0 || calculationValidation.warnings.length > 0) && (
                  <div className="retro-info bg-yellow-100 border-yellow-300">
                    <div className="text-sm font-bold text-yellow-800 mb-2">⚠️ VALIDATION WARNINGS</div>
                    <ul className="text-xs text-yellow-700 space-y-1">
                      {[...dataValidation.warnings, ...calculationValidation.warnings].map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {/* Control Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Scenario Selector */}
              <div className="retro-info">
                <div className="text-sm font-bold mb-2">SCENARIO</div>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(FINANCIAL_SCENARIOS).map(([key, scenario]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedScenario(key)}
                      className={`retro-button text-xs py-2 px-1 ${
                        selectedScenario === key ? 'bg-blue-500 text-white' : ''
                      }`}
                      style={{ backgroundColor: selectedScenario === key ? scenario.color : undefined }}
                    >
                      {scenario.name}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {FINANCIAL_SCENARIOS[selectedScenario].description}
                </div>
              </div>

              {/* Time Range */}
              <div className="retro-info">
                <div className="text-sm font-bold mb-2">TIME RANGE</div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(parseInt(e.target.value))}
                  className="retro-input w-full text-sm"
                >
                  <option value={5}>5 Years</option>
                  <option value={10}>10 Years</option>
                  <option value={20}>20 Years</option>
                  <option value={30}>30 Years</option>
                </select>
              </div>

              {/* Age Settings */}
              <div className="retro-info">
                <div className="text-sm font-bold mb-2">AGE SETTINGS</div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs">Current Age</label>
                    <input
                      type="number"
                      value={currentAge}
                      onChange={(e) => setCurrentAge(parseInt(e.target.value))}
                      className="retro-input w-full text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs">Retirement Age</label>
                    <input
                      type="number"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                      className="retro-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Savings Adjustment */}
              <div className="retro-info">
                <div className="text-sm font-bold mb-2">SAVINGS ADJUSTMENT</div>
                <div className="text-xs text-gray-600 mb-2">
                  Current: ${projections?.summary?.totalContributions ? Math.round(projections.summary.totalContributions / (timeRange * 12)) : 0}/month
                </div>
                <input
                  type="range"
                  min="-50"
                  max="200"
                  value={savingsIncrease}
                  onChange={(e) => setSavingsIncrease(parseInt(e.target.value))}
                  className="retro-slider w-full"
                />
                <div className="text-center mt-1">
                  <span className="text-sm font-bold text-blue-600">
                    {savingsIncrease > 0 ? '+' : ''}{savingsIncrease}%
                  </span>
                </div>
                
                {/* Data Quality Indicator */}
                <div className="mt-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span>Data Quality:</span>
                    <span className={`font-bold ${
                      dataValidation.isValid && dataValidation.warnings.length === 0 
                        ? 'text-green-600' 
                        : dataValidation.warnings.length > 0 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                    }`}>
                      {dataValidation.isValid && dataValidation.warnings.length === 0 
                        ? '✅ Excellent' 
                        : dataValidation.warnings.length > 0 
                          ? '⚠️ Good' 
                          : '❌ Poor'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex space-x-2 mb-6">
              {[
                { id: 'projections', label: '📊 Projections', icon: '📈' },
                { id: 'milestones', label: '🎯 Milestones', icon: '🏆' },
                { id: 'retirement', label: '👴 Retirement', icon: '💰' },
                { id: 'analysis', label: '🔍 Analysis', icon: '📋' },
                { id: 'validation', label: '✅ Validation', icon: '🔍' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`retro-button px-4 py-2 text-sm ${
                    activeTab === tab.id ? 'bg-blue-500 text-white' : ''
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'projections' && (
              <div className="space-y-6">
                {/* Key Metrics */}
                {projections && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="retro-chart text-center">
                      <div className="text-sm font-bold mb-2">FINAL BALANCE</div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${projections.summary.finalBalance.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        in {timeRange} years
                      </div>
                    </div>
                    <div className="retro-chart text-center">
                      <div className="text-sm font-bold mb-2">REAL VALUE</div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        ${projections.summary.finalRealValue.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        inflation-adjusted
                      </div>
                    </div>
                    <div className="retro-chart text-center">
                      <div className="text-sm font-bold mb-2">INTEREST EARNED</div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        ${projections.summary.totalInterest.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        compound growth
                      </div>
                    </div>
                  </div>
                )}

                {/* Wealth Growth Chart */}
                {projections && (
                  <div className="retro-chart">
                    <div className="text-center font-bold mb-4 text-sm">WEALTH GROWTH PROJECTION</div>
                    <ResponsiveContainer width="100%" height={300}>
                      <ComposedChart data={prepareChartData()}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="year" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            `$${value.toLocaleString()}`, 
                            name === 'balance' ? 'Nominal Value' : 'Real Value'
                          ]}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="realValue" 
                          fill="#4A90E2" 
                          fillOpacity={0.3}
                          stroke="#4A90E2"
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="balance" 
                          stroke="#7B68EE" 
                          strokeWidth={3}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Contribution vs Interest Chart */}
                {projections && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="retro-chart">
                      <div className="text-center font-bold mb-4 text-sm">CONTRIBUTION BREAKDOWN</div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={prepareContributionData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                          >
                            {prepareContributionData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="retro-chart">
                      <div className="text-center font-bold mb-4 text-sm">MONTE CARLO ANALYSIS</div>
                      {monteCarloData && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>10th Percentile:</span>
                            <span>${monteCarloData.p10.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Median:</span>
                            <span>${monteCarloData.median.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>90th Percentile:</span>
                            <span>${monteCarloData.p90.toLocaleString()}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="retro-chart">
                  <div className="text-center font-bold mb-4 text-sm">FINANCIAL MILESTONES</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {milestones.slice(0, 8).map((milestone, index) => (
                      <div key={index} className="retro-info text-center p-4">
                        <div className="text-2xl mb-2">{milestone.icon}</div>
                        <div className="text-lg font-bold text-blue-600">
                          ${milestone.amount.toLocaleString()}
                        </div>
                        <div className="text-sm font-bold mb-1">{milestone.name}</div>
                        <div className="text-xs text-gray-600">
                          {milestone.years} years
                        </div>
                        <div className="text-xs text-gray-500">
                          {milestone.targetDate}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'retirement' && retirementData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="retro-chart text-center">
                    <div className="text-sm font-bold mb-2">RETIREMENT READINESS</div>
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {retirementData.readinessScore}%
                    </div>
                    <div className="text-xs text-gray-600">
                      Years covered: {retirementData.yearsCovered}
                    </div>
                  </div>
                  <div className="retro-chart text-center">
                    <div className="text-sm font-bold mb-2">MONTHLY INCOME</div>
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      ${retirementData.monthlyIncomeNeeded.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">
                      projected retirement income
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analysis' && (
              <div className="space-y-6">
                <div className="retro-chart">
                  <div className="text-center font-bold mb-4 text-sm">SCENARIO COMPARISON</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(FINANCIAL_SCENARIOS).map(([key, scenario]) => {
                      const scenarioProjection = calculateProjectionsService(
                        financialData.balance,
                        projections?.summary?.totalContributions / (timeRange * 12) || 0,
                        scenario.annualReturn,
                        timeRange,
                        scenario.inflation
                      )
                      return (
                        <div key={key} className="retro-info text-center p-4">
                          <div className="text-sm font-bold mb-2" style={{ color: scenario.color }}>
                            {scenario.name}
                          </div>
                          <div className="text-lg font-bold text-gray-800">
                            ${scenarioProjection?.summary?.finalBalance?.toLocaleString() || '0'}
                          </div>
                          <div className="text-xs text-gray-600">
                            {scenario.description}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'validation' && (
              <div className="space-y-6">
                {/* Data Quality Overview */}
                <div className="retro-chart">
                  <div className="text-center font-bold mb-4 text-sm">DATA QUALITY OVERVIEW</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        {financialData?.transactions?.length || 0}
                      </div>
                      <div className="text-xs text-gray-600">Transactions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {financialData?.accounts?.length || 0}
                      </div>
                      <div className="text-xs text-gray-600">Accounts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        ${(financialData?.balance || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">Current Balance</div>
                    </div>
                  </div>
                </div>

                {/* Data Validation Results */}
                <div className="retro-chart">
                  <div className="text-center font-bold mb-4 text-sm">VALIDATION RESULTS</div>
                  
                  {/* Data Validation */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Data Validation</span>
                      <span className={`text-sm font-bold ${
                        dataValidation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {dataValidation.isValid ? '✅ PASSED' : '❌ FAILED'}
                      </span>
                    </div>
                    
                    {dataValidation.errors.length > 0 && (
                      <div className="bg-red-50 p-3 rounded mb-2">
                        <div className="text-xs font-bold text-red-800 mb-1">Errors:</div>
                        <ul className="text-xs text-red-700 space-y-1">
                          {dataValidation.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {dataValidation.warnings.length > 0 && (
                      <div className="bg-yellow-50 p-3 rounded">
                        <div className="text-xs font-bold text-yellow-800 mb-1">Warnings:</div>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {dataValidation.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Calculation Validation */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold">Calculation Validation</span>
                      <span className={`text-sm font-bold ${
                        calculationValidation.isValid ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {calculationValidation.isValid ? '✅ PASSED' : '❌ FAILED'}
                      </span>
                    </div>
                    
                    {calculationValidation.errors.length > 0 && (
                      <div className="bg-red-50 p-3 rounded mb-2">
                        <div className="text-xs font-bold text-red-800 mb-1">Errors:</div>
                        <ul className="text-xs text-red-700 space-y-1">
                          {calculationValidation.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {calculationValidation.warnings.length > 0 && (
                      <div className="bg-yellow-50 p-3 rounded">
                        <div className="text-xs font-bold text-yellow-800 mb-1">Warnings:</div>
                        <ul className="text-xs text-yellow-700 space-y-1">
                          {calculationValidation.warnings.map((warning, index) => (
                            <li key={index}>• {warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Data Quality Score */}
                  <div className="text-center">
                    <div className="text-sm font-bold mb-2">Overall Data Quality</div>
                    <div className={`text-3xl font-bold ${
                      dataValidation.isValid && dataValidation.warnings.length === 0 
                        ? 'text-green-600' 
                        : dataValidation.warnings.length > 0 
                          ? 'text-yellow-600' 
                          : 'text-red-600'
                    }`}>
                      {dataValidation.isValid && dataValidation.warnings.length === 0 
                        ? '95%' 
                        : dataValidation.warnings.length > 0 
                          ? '75%' 
                          : '25%'}
                    </div>
                    <div className="text-xs text-gray-600">
                      {dataValidation.isValid && dataValidation.warnings.length === 0 
                        ? 'Excellent - High confidence projections' 
                        : dataValidation.warnings.length > 0 
                          ? 'Good - Some limitations noted' 
                          : 'Poor - Limited reliability'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* AI Forecast Button */}
            <div className="text-center mt-6">
              <button
                className="retro-button px-8 py-3 text-lg font-bold"
                onClick={generateAiForecast}
                disabled={isGeneratingForecast}
              >
                {isGeneratingForecast ? '⏳ Generating...' : '🤖 AI Forecast Mode'}
              </button>
            </div>

            {/* AI Forecast Popup */}
            {showAiForecast && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="retro-window p-6 max-w-lg mx-4">
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

            {/* Enhanced Info Section */}
            <div className="retro-info text-center mt-6">
              <div className="text-4xl mb-4">🕰️</div>
              <div className="text-lg mb-2">Advanced Financial Time Travel</div>
              <div className="text-sm text-gray-600">
                Experience the future of your finances with compound interest, inflation adjustments, 
                and multiple scenario analysis. The Time Machine uses advanced financial modeling to 
                project your wealth trajectory across different market conditions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TimeMachine
