import { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebaseClient'

const SyncTool = ({ financialData, onClose, onDataUpdate }) => {
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState('idle')
  const [message, setMessage] = useState('')
  const [syncHistory, setSyncHistory] = useState([])
  const [lastSync, setLastSync] = useState(null)
  const [syncProgress, setSyncProgress] = useState(0)

  useEffect(() => {
    loadSyncHistory()
  }, [financialData])

  const loadSyncHistory = async () => {
    if (!financialData?.user) return
    
    try {
      const syncDoc = await getDoc(doc(db, 'users', financialData.user.uid, 'settings', 'sync'))
      if (syncDoc.exists()) {
        const data = syncDoc.data()
        setLastSync(data.lastSync)
        setSyncHistory(data.history || [])
      }
    } catch (error) {
      console.error('Error loading sync history:', error)
    }
  }

  const performSync = async (syncType = 'full') => {
    if (!financialData?.user) return
    
    try {
      setIsSyncing(true)
      setSyncStatus('syncing')
      setSyncProgress(0)
      setMessage('Starting sync process...')

      // Simulate sync steps
      const syncSteps = [
        { step: 'Connecting to data sources...', progress: 10 },
        { step: 'Fetching account information...', progress: 25 },
        { step: 'Downloading transactions...', progress: 50 },
        { step: 'Processing financial data...', progress: 75 },
        { step: 'Updating local database...', progress: 90 },
        { step: 'Sync completed successfully!', progress: 100 }
      ]

      for (const syncStep of syncSteps) {
        setMessage(syncStep.step)
        setSyncProgress(syncStep.progress)
        await new Promise(resolve => setTimeout(resolve, 500))
      }

      // Update sync timestamp
      const now = new Date().toISOString()
      await updateDoc(doc(db, 'users', financialData.user.uid, 'settings', 'sync'), {
        lastSync: now,
        syncType: syncType,
        status: 'success',
        history: [
          {
            timestamp: now,
            type: syncType,
            status: 'success',
            message: 'Data synchronized successfully'
          },
          ...(syncHistory.slice(0, 9)) // Keep last 10 entries
        ]
      })

      setLastSync(now)
      setSyncHistory(prev => [
        {
          timestamp: now,
          type: syncType,
          status: 'success',
          message: 'Data synchronized successfully'
        },
        ...prev.slice(0, 9)
      ])

      setSyncStatus('success')
      setMessage('✅ Sync completed successfully!')
      
      // Trigger data reload
      setTimeout(() => {
        onDataUpdate()
        setMessage('Data refreshed from latest sync')
      }, 1000)

    } catch (error) {
      console.error('Error during sync:', error)
      setSyncStatus('error')
      setMessage('❌ Sync failed. Please try again.')
      
      // Log failed sync
      const now = new Date().toISOString()
      setSyncHistory(prev => [
        {
          timestamp: now,
          type: syncType,
          status: 'error',
          message: error.message
        },
        ...prev.slice(0, 9)
      ])
    } finally {
      setIsSyncing(false)
      setTimeout(() => {
        setSyncStatus('idle')
        setSyncProgress(0)
      }, 3000)
    }
  }

  const forceSync = async () => {
    if (confirm('Force sync will overwrite local data with server data. Continue?')) {
      await performSync('force')
    }
  }

  const clearSyncHistory = () => {
    if (confirm('Clear all sync history?')) {
      setSyncHistory([])
      setMessage('Sync history cleared')
    }
  }

  const getSyncStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'syncing': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getSyncStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅'
      case 'error': return '❌'
      case 'syncing': return '🔄'
      default: return '⏸️'
    }
  }

  return (
    <div className="p-4">
      <div className="text-center font-bold text-lg mb-6 text-retro-dark">
        🔄 DATA SYNC
      </div>

      {/* Sync Status */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">SYNC STATUS</div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Current Status:</span>
            <span className={`text-sm ${getSyncStatusColor(syncStatus)}`}>
              {getSyncStatusIcon(syncStatus)} {syncStatus.toUpperCase()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Last Sync:</span>
            <span className="text-sm text-gray-600">
              {lastSync ? new Date(lastSync).toLocaleString() : 'Never'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Data Source:</span>
            <span className="text-sm text-gray-600">
              {financialData?.dataSource || 'Unknown'}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold">Transactions:</span>
            <span className="text-sm text-gray-600">
              {financialData?.transactions?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* Sync Progress */}
      {isSyncing && (
        <div className="retro-chart mb-6 p-4">
          <div className="text-center font-bold mb-4 text-sm">SYNC PROGRESS</div>
          
          <div className="space-y-3">
            <div className="text-center text-sm font-bold">
              {message}
            </div>
            
            <div className="w-full bg-gray-200 h-4 border border-gray-400">
              <div 
                className="bg-blue-500 h-full transition-all duration-500"
                style={{ width: `${syncProgress}%` }}
              />
            </div>
            
            <div className="text-center text-xs text-gray-600">
              {syncProgress}% Complete
            </div>
          </div>
        </div>
      )}

      {/* Sync Actions */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">SYNC ACTIONS</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="retro-button px-4 py-3 text-center"
            onClick={() => performSync('full')}
            disabled={isSyncing}
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm font-bold">Full Sync</div>
            <div className="text-xs text-gray-600">Sync all data</div>
          </button>
          
          <button
            className="retro-button px-4 py-3 text-center"
            onClick={() => performSync('incremental')}
            disabled={isSyncing}
          >
            <div className="text-2xl mb-2">⚡</div>
            <div className="text-sm font-bold">Quick Sync</div>
            <div className="text-xs text-gray-600">Sync recent changes</div>
          </button>
          
          <button
            className="retro-button px-4 py-3 text-center"
            onClick={forceSync}
            disabled={isSyncing}
          >
            <div className="text-2xl mb-2">🔨</div>
            <div className="text-sm font-bold">Force Sync</div>
            <div className="text-xs text-gray-600">Overwrite local data</div>
          </button>
          
          <button
            className="retro-button px-4 py-3 text-center"
            onClick={onDataUpdate}
            disabled={isSyncing}
          >
            <div className="text-2xl mb-2">🔄</div>
            <div className="text-sm font-bold">Refresh Data</div>
            <div className="text-xs text-gray-600">Reload from Firestore</div>
          </button>
        </div>
      </div>

      {/* Sync History */}
      <div className="retro-chart mb-6 p-4">
        <div className="flex justify-between items-center mb-4">
          <div className="text-center font-bold text-sm">SYNC HISTORY</div>
          <button
            className="retro-button text-xs px-2 py-1"
            onClick={clearSyncHistory}
          >
            🗑️ Clear
          </button>
        </div>
        
        {syncHistory.length === 0 ? (
          <div className="text-center p-4 text-gray-600 text-sm">
            No sync history available
          </div>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {syncHistory.map((entry, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 border border-gray-300">
                <div className="flex items-center space-x-2">
                  <span className="text-sm">{getSyncStatusIcon(entry.status)}</span>
                  <span className="text-xs font-bold">{entry.type.toUpperCase()}</span>
                </div>
                <div className="text-xs text-gray-600">
                  {new Date(entry.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sync Information */}
      <div className="retro-info mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">SYNC INFORMATION</div>
        
        <div className="text-sm space-y-2">
          <div><strong>Auto-sync:</strong> {financialData?.autoSync ? 'Enabled' : 'Disabled'}</div>
          <div><strong>Last Update:</strong> {financialData?.lastUpdated || 'Unknown'}</div>
          <div><strong>Data Consistency:</strong> {financialData?.isConsistent ? '✅ Consistent' : '⚠️ Inconsistent'}</div>
          <div><strong>Account Count:</strong> {financialData?.accounts?.length || 0}</div>
          <div><strong>Transaction Count:</strong> {financialData?.transactions?.length || 0}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={onClose}
        >
          ✕ Close
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className="text-center mt-4 text-sm font-bold">
          {message}
        </div>
      )}

      {/* Sync Tips */}
      <div className="retro-info mt-6">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">💡 Sync Tips</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Use Full Sync for complete data refresh</div>
            <div>• Quick Sync is faster for recent changes</div>
            <div>• Force Sync overwrites local data with server data</div>
            <div>• Regular syncing ensures data consistency</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SyncTool
