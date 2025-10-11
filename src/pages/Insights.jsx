import TopNav from '../components/TopNav'
import SideBar from '../components/SideBar'

const Insights = () => {
  return (
    <div className="min-h-screen p-4">
      <TopNav />
      <div className="flex">
        <SideBar />
        <div className="flex-1">
          <div className="retro-window p-4">
            <div className="text-center font-bold text-lg mb-4 text-retro-dark">
              🔍 AI INSIGHTS
            </div>
            <div className="retro-info text-center">
              <div className="text-4xl mb-4">🧠</div>
              <div className="text-lg mb-2">AI-Powered Financial Analysis</div>
              <div className="text-sm text-gray-600">
                Coming soon: Advanced AI insights powered by Google Gemini
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Insights
