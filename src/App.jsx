import { Routes, Route } from 'react-router-dom'
import RetroDashboard from './pages/RetroDashboard'
import TimeMachine from './pages/TimeMachine'
import Insights from './pages/Insights'
import StoryMode from './pages/StoryMode'

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-blue-700">
      <Routes>
        <Route path="/" element={<RetroDashboard />} />
        <Route path="/dashboard" element={<RetroDashboard />} />
        <Route path="/time" element={<TimeMachine />} />
        <Route path="/insights" element={<Insights />} />
        <Route path="/story" element={<StoryMode />} />
      </Routes>
    </div>
  )
}

export default App
