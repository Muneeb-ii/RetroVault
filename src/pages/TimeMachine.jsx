import { useState, useEffect } from 'react'
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, ComposedChart
} from 'recharts'
import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import ErrorBoundary from '../components/ErrorBoundary'
import { useUnifiedData } from '../contexts/UnifiedDataContext'
import { 
  playStoryAudio,
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
  const { financialData, isLoading, error } = useUnifiedData()
  
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
  const [isAudioLoading, setIsAudioLoading] = useState(false)
  const [audioLoadingProgress, setAudioLoadingProgress] = useState(0)
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
    if (!financialData) {
      console.warn('No financial data available for projections')
      setDataValidation({
        isValid: false,
        errors: ['No financial data available'],
        warnings: []
      })
      return
    }
    
    try {
      // Step 1: Validate and sanitize financial data
      const sanitizedData = sanitizeFinancialData(financialData)
      if (!sanitizedData) {
        setDataValidation({
          isValid: false,
          errors: ['Failed to sanitize financial data'],
          warnings: []
        })
        return
      }
      
      const dataValidationResult = validateFinancialData(sanitizedData)
      setDataValidation(dataValidationResult)
      
      if (!dataValidationResult.isValid) {
        console.error('Data validation failed:', dataValidationResult.errors)
        setDataValidation({
          isValid: false,
          errors: dataValidationResult.errors,
          warnings: dataValidationResult.warnings
        })
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
      
      // Use dashboard-calculated values for consistency
      const totalIncome = sanitizedData.totalIncome || 0
      const totalExpenses = sanitizedData.totalExpenses || 0
      
      console.log('🔍 [TIME MACHINE] Using dashboard data:', {
        totalIncome,
        totalExpenses,
        balance: sanitizedData.balance
      })
    
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

      // Allow currentMonthlySavings to be negative (deficit). Savings should directly
      // add to net worth: positive savings increase net worth each month, negative
      // savings reduce net worth. Do not clamp to 0 here so the projection can show
      // improvements when the user increases savings from a deficit.
      const currentMonthlySavings = currentMonthlyIncome - currentMonthlyExpenses

      let newMonthlySavings
      if (currentMonthlySavings >= 0) {
        // Positive savings: scale up/down by the percentage
        newMonthlySavings = currentMonthlySavings * (1 + savingsIncrease / 100)
      } else {
        // Negative savings (deficit): a positive savingsIncrease should reduce the deficit
        // Example: current = -100, savingsIncrease = 50 -> new = -100 * (1 - 0.5) = -50
        newMonthlySavings = currentMonthlySavings * (1 - savingsIncrease / 100)
      }
      
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
        
        if (!projectionData || !projectionData.projections) {
          setDataValidation({
            isValid: false,
            errors: ['Invalid projection data returned'],
            warnings: []
          })
          return
        }
        
        // Attach computed savings values for UI display
        setProjections(prev => ({ ...projectionData, currentMonthlySavings: Math.round(currentMonthlySavings), newMonthlySavings: Math.round(newMonthlySavings) }))
        
        // Calculate milestones with error handling
        try {
          const newMilestones = generateAdvancedMilestones(
            currentBalance, 
            newMonthlySavings, 
            scenario.annualReturn, 
            scenario.inflation
          )
          setMilestones(newMilestones)
        } catch (milestoneError) {
          console.warn('Error calculating milestones:', milestoneError)
          setMilestones([])
        }
        
        // Calculate retirement readiness with error handling
        try {
          const retirement = calculateRetirementReadiness(
            currentAge,
            retirementAge,
            currentBalance,
            newMonthlySavings,
            scenario.annualReturn,
            scenario.inflation
          )
          setRetirementData(retirement)
        } catch (retirementError) {
          console.warn('Error calculating retirement readiness:', retirementError)
          setRetirementData(null)
        }
        
        // Calculate Monte Carlo simulation with error handling
        try {
          const monteCarlo = monteCarloSimulation(
            currentBalance,
            newMonthlySavings,
            scenario.annualReturn,
            scenario.annualReturn * 0.15, // 15% volatility
            timeRange
          )
          setMonteCarloData(monteCarlo)
        } catch (monteCarloError) {
          console.warn('Error calculating Monte Carlo simulation:', monteCarloError)
          setMonteCarloData(null)
        }
      
      } catch (error) {
        console.error('Error in calculations:', error)
        setDataValidation({
          isValid: false,
          errors: ['Calculation error: ' + error.message],
          warnings: []
        })
        // Set safe fallback values
        setProjections(null)
        setMilestones([])
        setRetirementData(null)
        setMonteCarloData(null)
      }
    } catch (error) {
      console.error('Error in projection calculation:', error)
      setDataValidation({
        isValid: false,
        errors: ['Projection calculation failed: ' + error.message],
        warnings: []
      })
      // Set safe fallback values to prevent crashes
      setProjections(null)
      setMilestones([])
      setRetirementData(null)
      setMonteCarloData(null)
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
      // Start audio loading UI for 3 seconds while we request audio playback
      setIsAudioLoading(true)
      setAudioLoadingProgress(0)
      // Start audio playback request concurrently
      try {
        playStoryAudio(forecast).catch(err => console.error('playStoryAudio error:', err))
      } catch (err) {
        console.error('Error initiating audio playback:', err)
      }

      // Animate progress for 3 seconds
      const start = Date.now()
      const duration = 5000
      const interval = setInterval(() => {
        const elapsed = Date.now() - start
        const pct = Math.min(100, Math.round((elapsed / duration) * 100))
        setAudioLoadingProgress(pct)
        if (elapsed >= duration) {
          clearInterval(interval)
          setIsAudioLoading(false)
          setShowAiForecast(true)
        }
      }, 100)
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
    try {
      if (!projections || !projections.projections || !Array.isArray(projections.projections) || projections.projections.length === 0) {
        console.warn('No valid projections data available for chart')
        return []
      }
      
      // Take yearly points (every 12 months), map to readable year and ensure ascending order
      const yearly = projections.projections
        .filter((_, index) => index % 12 === 0)
        .map((point) => ({
          // Use the projection's date for an accurate year label when available
          year: point.date ? new Date(point.date).getFullYear() : (point.year || 0),
          balance: point.balance || 0,
          realValue: point.realValue || 0,
          contributions: point.totalContributions || 0,
          interest: point.totalInterest || 0
        }))

      // Sort by year ascending to ensure chart x-axis is increasing
      yearly.sort((a, b) => a.year - b.year)
      return yearly
    } catch (error) {
      console.error('Error preparing chart data:', error)
      return []
    }
  }

  const prepareContributionData = () => {
    try {
      if (!projections || !projections.projections || !Array.isArray(projections.projections) || projections.projections.length === 0) {
        console.warn('No valid projections data available for contribution chart')
        return []
      }
      
      const final = projections.projections[projections.projections.length - 1]
      if (!final) {
        console.warn('No final projection data available')
        return []
      }
      
      return [
        { name: 'Contributions', value: final.totalContributions || 0, color: '#4A90E2' },
        { name: 'Interest Earned', value: final.totalInterest || 0, color: '#7B68EE' }
      ]
    } catch (error) {
      console.error('Error preparing contribution data:', error)
      return []
    }
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
                <div className="grid grid-cols-3 gap-1">
                  {Object.entries(FINANCIAL_SCENARIOS).map(([key, scenario]) => (
                    <button
                      key={key}
                      onClick={() => setSelectedScenario(key)}
                      className={`retro-button text-xs py-1.5 px-1 min-h-[2rem] flex items-center justify-center text-center ${
                        selectedScenario === key ? 'bg-blue-500 text-white' : ''
                      }`}
                      style={{ backgroundColor: selectedScenario === key ? scenario.color : undefined }}
                    >
                      <span className="truncate w-full">{scenario.name}</span>
                    </button>
                  ))}
                </div>
                <div className="text-xs text-gray-600 mt-1 leading-tight">
                  {FINANCIAL_SCENARIOS[selectedScenario].description}
                </div>
              </div>

              {/* Time Range */}
              <div className="retro-info">
                <div className="text-sm font-bold mb-2">TIME RANGE</div>
                <select
                  value={timeRange}
                  onChange={(e) => setTimeRange(parseInt(e.target.value))}
                  className="retro-input w-full text-xs py-2 px-2 min-h-[2rem]"
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
                    <label className="text-xs block mb-1">Current Age</label>
                    <input
                      type="number"
                      value={currentAge}
                      onChange={(e) => setCurrentAge(parseInt(e.target.value))}
                      className="retro-input w-full text-xs py-1.5 px-2 min-h-[2rem] text-center"
                    />
                  </div>
                  <div>
                    <label className="text-xs block mb-1">Retirement Age</label>
                    <input
                      type="number"
                      value={retirementAge}
                      onChange={(e) => setRetirementAge(parseInt(e.target.value))}
                      className="retro-input w-full text-xs py-1.5 px-2 min-h-[2rem] text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Savings Adjustment */}
              <div className="retro-info">
                <div className="text-sm font-bold mb-2">SAVINGS ADJUSTMENT</div>
                <div className="text-xs text-gray-600 mb-2 leading-tight">
                  Current: ${projections?.currentMonthlySavings ?? Math.round((financialData?.balance || 0) * 0)} /month
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
                    <span className="truncate">Data Quality:</span>
                    <span className={`font-bold text-xs ${
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
                { id: 'analysis', label: '🔍 Analysis', icon: '📋' }
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
                {projections && projections.summary && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="retro-chart text-center">
                      <div className="text-sm font-bold mb-2">FINAL BALANCE</div>
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${(projections.summary.finalBalance || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        in {timeRange} years
                      </div>
                    </div>
                    <div className="retro-chart text-center">
                      <div className="text-sm font-bold mb-2">REAL VALUE</div>
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        ${(projections.summary.finalRealValue || 0).toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-600">
                        inflation-adjusted
                      </div>
                    </div>
                    <div className="retro-chart text-center">
                      <div className="text-sm font-bold mb-2">INTEREST EARNED</div>
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        ${(projections.summary.totalInterest || 0).toLocaleString()}
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
                        <YAxis domain={["dataMin", "dataMax"]} />
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

            {/* Audio Loading Overlay (3s) */}
            {isAudioLoading && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-60">
                <div className="retro-window p-6 max-w-md mx-4">
                  <div className="text-center font-bold mb-4">🔊 Preparing Forecast Audio</div>
                  <div className="retro-boot-screen text-center">
                    <div className="mb-4">Loading audio engine... please wait</div>
                    <div className="flex items-center justify-center">
                      <div className="retro-progress-bar w-64">
                        <div className="retro-progress-fill" style={{ width: `${audioLoadingProgress}%` }} />
                      </div>
                    </div>
                    <div className="text-xs mt-2">{audioLoadingProgress}%</div>
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
