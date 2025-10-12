import { useState, useEffect } from 'react'
import { doc, updateDoc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../../firebaseClient'
import { safeTimestamp } from '../../utils/timestampUtils'
import { play as playSound } from '../../utils/soundPlayer'

const SettingsTool = ({ financialData, transactions, accounts, user, onClose, onDataUpdate }) => {
  const [settings, setSettings] = useState({
    currency: 'USD',
    dateFormat: 'MM/DD/YYYY',
    notifications: true,
    autoSync: true,
    theme: 'retro',
    language: 'en',
    timezone: 'America/New_York',
    privacy: 'private',
    dataRetention: '1year'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' }
  ]

  const dateFormats = [
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (US)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (EU)' },
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' }
  ]

  const themes = [
    { value: 'retro', label: 'Retro (Windows 98)' },
    { value: 'modern', label: 'Modern' },
    { value: 'dark', label: 'Dark Mode' }
  ]

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }
  ]

  const timezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Australia/Sydney'
  ]

  const privacyOptions = [
    { value: 'private', label: 'Private (Recommended)' },
    { value: 'friends', label: 'Friends Only' },
    { value: 'public', label: 'Public' }
  ]

  const dataRetentionOptions = [
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
    { value: '2years', label: '2 Years' },
    { value: 'forever', label: 'Forever' }
  ]

  useEffect(() => {
    loadSettings()
  }, [financialData])

  const loadSettings = async () => {
    if (!user) return
    
    try {
      setIsLoading(true)
      const settingsDoc = await getDoc(doc(db, 'users', user.uid, 'settings', 'preferences'))
      if (settingsDoc.exists()) {
        setSettings({ ...settings, ...settingsDoc.data() })
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      setMessage('Failed to load settings')
    } finally {
      setIsLoading(false)
    }
  }

  const updateSetting = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const saveSettings = async () => {
    if (!user) return
    
    try {
      setIsSaving(true)
      await setDoc(doc(db, 'users', user.uid, 'settings', 'preferences'), {
        ...settings,
        lastUpdated: new Date().toISOString()
      })
      setMessage('✅ Settings saved successfully!')
        playSound('success')
      setTimeout(() => setMessage(''), 3000)
      onDataUpdate()
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage('❌ Failed to save settings')
        playSound('error')
    } finally {
      setIsSaving(false)
    }
  }

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings({
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        notifications: true,
        autoSync: true,
        theme: 'retro',
        language: 'en',
        timezone: 'America/New_York',
        privacy: 'private',
        dataRetention: '1year'
      })
      setMessage('Settings reset to default')
        playSound('click1')
      setTimeout(() => setMessage(''), 3000)
    }
  }

  const exportData = () => {
    const data = {
      user: user,
      transactions: transactions,
      accounts: accounts,
      settings: settings,
      exportDate: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `retrovault-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setMessage('✅ Data exported successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="text-lg font-bold mb-4">Loading settings... 💾</div>
        <div className="text-sm text-gray-600">Please wait while we fetch your preferences</div>
      </div>
    )
  }

  return (
    <div className="p-4">
      <div className="text-center font-bold text-lg mb-6 text-retro-dark">
        ⚙️ SETTINGS & PREFERENCES
      </div>

      {/* General Settings */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">GENERAL SETTINGS</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Currency:</label>
            <select
              value={settings.currency}
              onChange={(e) => updateSetting('currency', e.target.value)}
              className="retro-input w-full"
            >
              {currencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.name} ({currency.code})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Date Format:</label>
            <select
              value={settings.dateFormat}
              onChange={(e) => updateSetting('dateFormat', e.target.value)}
              className="retro-input w-full"
            >
              {dateFormats.map(format => (
                <option key={format.value} value={format.value}>
                  {format.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Language:</label>
            <select
              value={settings.language}
              onChange={(e) => updateSetting('language', e.target.value)}
              className="retro-input w-full"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Timezone:</label>
            <select
              value={settings.timezone}
              onChange={(e) => updateSetting('timezone', e.target.value)}
              className="retro-input w-full"
            >
              {timezones.map(tz => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Display Settings */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">DISPLAY SETTINGS</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Theme:</label>
            <select
              value={settings.theme}
              onChange={(e) => updateSetting('theme', e.target.value)}
              className="retro-input w-full"
            >
              {themes.map(theme => (
                <option key={theme.value} value={theme.value}>
                  {theme.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={settings.notifications}
                onChange={(e) => updateSetting('notifications', e.target.checked)}
                className="retro-checkbox"
              />
              <span className="text-sm font-bold">Enable Notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">PRIVACY & DATA</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold mb-1">Privacy Level:</label>
            <select
              value={settings.privacy}
              onChange={(e) => updateSetting('privacy', e.target.value)}
              className="retro-input w-full"
            >
              {privacyOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-bold mb-1">Data Retention:</label>
            <select
              value={settings.dataRetention}
              onChange={(e) => updateSetting('dataRetention', e.target.value)}
              className="retro-input w-full"
            >
              {dataRetentionOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sync Settings */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">SYNC SETTINGS</div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={settings.autoSync}
              onChange={(e) => updateSetting('autoSync', e.target.checked)}
              className="retro-checkbox"
            />
            <span className="text-sm font-bold">Auto-sync with external accounts</span>
          </label>
        </div>
      </div>

      {/* Data Management */}
      <div className="retro-chart mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">DATA MANAGEMENT</div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            className="retro-button px-4 py-2"
            onClick={exportData}
          >
            📤 Export Data
          </button>
          
          <button
            className="retro-button px-4 py-2"
            onClick={resetSettings}
          >
            🔄 Reset Settings
          </button>
        </div>
      </div>

      {/* Account Info */}
      <div className="retro-info mb-6 p-4">
        <div className="text-center font-bold mb-4 text-sm">ACCOUNT INFORMATION</div>
        <div className="text-sm space-y-2">
          <div><strong>User:</strong> {financialData?.user?.name || 'Unknown'}</div>
          <div><strong>Email:</strong> {financialData?.user?.email || 'Unknown'}</div>
          <div><strong>Data Source:</strong> {financialData?.dataSource || 'Unknown'}</div>
          <div><strong>Last Updated:</strong> {safeTimestamp(financialData?.lastUpdated, 'Never')}</div>
          <div><strong>Transactions:</strong> {financialData?.transactions?.length || 0}</div>
          <div><strong>Accounts:</strong> {financialData?.accounts?.length || 0}</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 justify-center">
        <button
          className="retro-button px-6 py-3 text-lg font-bold"
          onClick={saveSettings}
          disabled={isSaving}
        >
          {isSaving ? '⏳ Saving...' : '💾 Save Settings'}
        </button>
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

      {/* Settings Tips */}
      <div className="retro-info mt-6">
        <div className="text-center">
          <div className="text-lg font-bold mb-2">💡 Settings Tips</div>
          <div className="text-sm text-gray-600 space-y-1">
            <div>• Choose your preferred currency for accurate financial tracking</div>
            <div>• Enable notifications to stay updated on your finances</div>
            <div>• Export your data regularly for backup purposes</div>
            <div>• Adjust privacy settings based on your comfort level</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SettingsTool
