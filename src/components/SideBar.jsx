import React, { useState } from 'react'
import { useUnifiedData } from '../contexts/UnifiedDataContext'
import ErrorBoundary from './ErrorBoundary'
import { safeTimestamp } from '../utils/timestampUtils'
import BudgetTool from './tools/BudgetTool'
import ExpensesTool from './tools/ExpensesTool'
import GoalsTool from './tools/GoalsTool'
import SettingsTool from './tools/SettingsTool'
import ReportsTool from './tools/ReportsTool'
import SyncTool from './tools/SyncTool'
import ElizaTool from './tools/ElizaTool'
import { play as playSound } from '../utils/soundPlayer'

const SideBar = () => {
  const { financialData, refreshData } = useUnifiedData()
  const [activeTool, setActiveTool] = useState(null)
  const [isToolOpen, setIsToolOpen] = useState(false)

  const toolComponents = {
    budget: BudgetTool,
    expenses: ExpensesTool,
    goals: GoalsTool,
    settings: SettingsTool,
    reports: ReportsTool,
    sync: SyncTool,
    eliza: ElizaTool
  }

  const sidebarItems = [
    { icon: '■', label: 'Budget', action: 'budget' },
    { icon: '◆', label: 'Transaction', action: 'expenses' },
    { icon: '▲', label: 'Goals', action: 'goals' },
    { icon: '●', label: 'Eliza AI', action: 'eliza' },
    { icon: '★', label: 'Settings', action: 'settings' },
    { icon: '♦', label: 'Reports', action: 'reports' },
    { icon: '▲', label: 'Sync', action: 'sync' }
  ]

  const handleToolClick = (item) => {
    playSound('click1')
    setActiveTool(item.action)
    setIsToolOpen(true)
  }

  const closeTool = () => {
    playSound('click2')
    setIsToolOpen(false)
    setActiveTool(null)
  }

  const handleDataUpdate = () => {
    // Reload data after any changes
    if (financialData?.user) {
      refreshData()
    }
  }

  return (
    <>
      <div className="w-48 md:w-48 w-full md:w-auto bg-retro-gray retro-window p-2 mr-4 retro-sidebar-slide">
        <div className="text-center text-sm font-bold text-retro-dark mb-4 border-b border-gray-400 pb-2 retro-text-reveal">
          TOOLBAR
        </div>
        
        {sidebarItems.map((item, index) => (
          <button
            key={index}
            className="sidebar-button flex items-center space-x-2 retro-fade-in retro-card-hover w-full p-2 mb-1 text-left"
            style={{animationDelay: `${index * 0.1}s`}}
            onClick={() => handleToolClick(item)}
          >
            <span className="text-lg">{item.icon}</span>
            <span className="retro-text-reveal" style={{animationDelay: `${index * 0.1 + 0.3}s`}}>{item.label}</span>
          </button>
        ))}
        
        {/* Status Bar */}
        <div className="mt-4 p-2 bg-white border-2 inset border-gray-400 text-xs retro-fade-in-delay-1">
          <div className="flex justify-between">
            <span className="retro-text-reveal">Status:</span>
            <span className="text-green-600 retro-status-pulse">● Online</span>
          </div>
          <div className="flex justify-between">
            <span className="retro-text-reveal" style={{animationDelay: '0.2s'}}>Last Sync:</span>
            <span className="retro-fade-in-delay-2">
              {safeTimestamp(financialData?.lastUpdated, 'Never')}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="retro-text-reveal" style={{animationDelay: '0.3s'}}>Data:</span>
            <span className="retro-fade-in-delay-3">
              {financialData?.transactions?.length || 0} transactions
            </span>
          </div>
        </div>
      </div>

      {/* Tool Modal */}
      {isToolOpen && activeTool && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
          <div className="retro-window max-w-4xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto">
            <div className="title-bar">
              <div className="title-bar-text">🛠️ {sidebarItems.find(item => item.action === activeTool)?.label} Tool</div>
              <div className="title-bar-controls">
                <button aria-label="Minimize"></button>
                <button aria-label="Maximize"></button>
                <button aria-label="Close" onClick={closeTool}></button>
              </div>
            </div>
            <div className="window-body">
              {activeTool && toolComponents[activeTool] && (
                <ErrorBoundary>
                  {React.createElement(toolComponents[activeTool], {
                    financialData: financialData,
                    onClose: closeTool,
                    onDataUpdate: handleDataUpdate
                  })}
                </ErrorBoundary>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SideBar
