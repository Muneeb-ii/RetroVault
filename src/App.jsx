import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import RetroDashboard from './pages/RetroDashboard'
import TimeMachine from './pages/TimeMachine'
import Insights from './pages/Insights'
import StoryMode from './pages/StoryMode'
import ProtectedRoute from './routes/ProtectedRoute'
import { FinancialDataProvider } from './contexts/FinancialDataContext'

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Authentication Page */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected Dashboard Routes with Financial Data Context */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <FinancialDataProvider>
              <RetroDashboard />
            </FinancialDataProvider>
          </ProtectedRoute>
        } />
        <Route path="/time" element={
          <ProtectedRoute>
            <FinancialDataProvider>
              <TimeMachine />
            </FinancialDataProvider>
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <FinancialDataProvider>
              <Insights />
            </FinancialDataProvider>
          </ProtectedRoute>
        } />
        <Route path="/story" element={
          <ProtectedRoute>
            <FinancialDataProvider>
              <StoryMode />
            </FinancialDataProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
