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
    <div className="w-48 bg-retro-gray retro-window p-2 mr-4">
      <div className="text-center text-sm font-bold text-retro-dark mb-4 border-b border-gray-400 pb-2">
        TOOLBAR
      </div>
      
      {sidebarItems.map((item, index) => (
        <button
          key={index}
          className="sidebar-button flex items-center space-x-2"
          onClick={() => console.log(`${item.label} clicked`)}
        >
          <span className="text-lg">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
      
      {/* Status Bar */}
      <div className="mt-4 p-2 bg-white border-2 inset border-gray-400 text-xs">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className="text-green-600">● Online</span>
        </div>
        <div className="flex justify-between">
          <span>Last Sync:</span>
          <span>2:34 PM</span>
        </div>
      </div>
    </div>
  )
}

export default SideBar
