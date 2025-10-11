const SideBar = () => {
  const sidebarItems = [
    { icon: '💰', label: 'Budget', action: 'budget' },
    { icon: '💳', label: 'Expenses', action: 'expenses' },
    { icon: '🎯', label: 'Goals', action: 'goals' },
    { icon: '⚙️', label: 'Settings', action: 'settings' },
    { icon: '📊', label: 'Reports', action: 'reports' },
    { icon: '🔄', label: 'Sync', action: 'sync' }
  ]

  return (
    <div className="w-48 bg-retro-gray retro-window p-2 mr-4 retro-sidebar-slide">
      <div className="text-center text-sm font-bold text-retro-dark mb-4 border-b border-gray-400 pb-2 retro-text-reveal">
        TOOLBAR
      </div>
      
      {sidebarItems.map((item, index) => (
        <button
          key={index}
          className="sidebar-button flex items-center space-x-2 retro-fade-in retro-card-hover"
          style={{animationDelay: `${index * 0.1}s`}}
          onClick={() => console.log(`${item.label} clicked`)}
        >
          <span className="text-lg retro-icon-bounce" style={{animationDelay: `${index * 0.1 + 0.2}s`}}>{item.icon}</span>
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
          <span className="retro-fade-in-delay-2">2:34 PM</span>
        </div>
      </div>
    </div>
  )
}

export default SideBar
