import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import RetroDashboard from './pages/RetroDashboard'
import TimeMachine from './pages/TimeMachine'
import Insights from './pages/Insights'
import StoryMode from './pages/StoryMode'
import ProtectedRoute from './routes/ProtectedRoute'
import { UnifiedDataProvider } from './contexts/UnifiedDataContext'

function App() {
  return (
    <div className="min-h-screen page-bg-transparent">
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Authentication Page */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected Dashboard Routes with Unified Data Context */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <UnifiedDataProvider>
              <RetroDashboard />
            </UnifiedDataProvider>
          </ProtectedRoute>
        } />
        <Route path="/time" element={
          <ProtectedRoute>
            <UnifiedDataProvider>
              <TimeMachine />
            </UnifiedDataProvider>
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <UnifiedDataProvider>
              <Insights />
            </UnifiedDataProvider>
          </ProtectedRoute>
        } />
        <Route path="/story" element={
          <ProtectedRoute>
            <UnifiedDataProvider>
              <StoryMode />
            </UnifiedDataProvider>
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
