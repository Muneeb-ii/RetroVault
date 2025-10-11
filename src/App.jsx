import { Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AuthPage from './pages/AuthPage'
import RetroDashboard from './pages/RetroDashboard'
import TimeMachine from './pages/TimeMachine'
import Insights from './pages/Insights'
import StoryMode from './pages/StoryMode'
import ProtectedRoute from './routes/ProtectedRoute'
import './utils/firebaseDiagnostics' // Run Firebase diagnostics
import './utils/connectionDiagnostics' // Run connection diagnostics

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<Landing />} />
        
        {/* Authentication Page */}
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Protected Dashboard Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <RetroDashboard />
          </ProtectedRoute>
        } />
        <Route path="/time" element={
          <ProtectedRoute>
            <TimeMachine />
          </ProtectedRoute>
        } />
        <Route path="/insights" element={
          <ProtectedRoute>
            <Insights />
          </ProtectedRoute>
        } />
        <Route path="/story" element={
          <ProtectedRoute>
            <StoryMode />
          </ProtectedRoute>
        } />
      </Routes>
    </div>
  )
}

export default App
