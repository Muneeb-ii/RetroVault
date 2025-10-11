import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'
import MainPanel from '../components/MainPanel'

const RetroDashboard = () => {
  return (
    <div className="min-h-screen p-4">
      {/* Top Navigation */}
      <TopNav />
      
      {/* Main Content Area */}
      <div className="flex">
        {/* Sidebar */}
        <SideBar />
        
        {/* Main Panel */}
        <div className="flex-1">
          <div className="retro-window p-4">
            <div className="text-center font-bold text-lg mb-4 text-retro-dark">
              📊 FINANCIAL DASHBOARD
            </div>
            <MainPanel />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RetroDashboard
