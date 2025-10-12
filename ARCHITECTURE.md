# RetroVault Architecture Overview

## 🏗️ Clean Architecture Structure

### Core Services
- **`src/services/authService.js`** - Unified authentication service
- **`src/services/dataSeedingService.js`** - Data seeding for new users
- **`src/contexts/UnifiedDataContext.jsx`** - Single source of truth for all financial data

### Data Layer
- **`src/api/unifiedFirestoreService.js`** - Unified Firestore operations
- **`src/api/nessieService.js`** - Capital One Nessie API integration
- **`src/data/sampleData.js`** - Sample data generator
- **`src/data/mockData.js`** - Mock data generator

### Authentication Flow
1. **New User**: Creates Nessie customer → Creates account → Seeds sample data → Populates dashboard
2. **Existing User**: Loads existing data from Firestore → No re-seeding

### Data Storage Strategy
```
users/{userId} - User profile + financial summary
├── profile: { name, email, photoURL, createdAt, lastLogin }
├── financialSummary: { totalBalance, totalIncome, totalExpenses, totalSavings }
├── dataSource: 'Nessie' | 'Sample' | 'Mock'
├── syncStatus: { lastSync, isConsistent, needsRefresh, version }
└── metadata: { accountsCount, transactionsCount, dataVersion }

accounts/{accountId} - Flat account structure
transactions/{transactionId} - Flat transaction structure
```

### Key Features
- ✅ **Unified Data Context**: Single source of truth
- ✅ **Robust Fallbacks**: Nessie → Sample → Mock data
- ✅ **Clean Authentication**: Handles new vs existing users
- ✅ **Real-time Updates**: Firestore listeners
- ✅ **Error Handling**: Graceful degradation
- ✅ **Type Safety**: Consistent data structures

### Removed Legacy Code
- ❌ `FinancialDataContext.jsx` (replaced by UnifiedDataContext)
- ❌ `useFinancialStore.js` (replaced by UnifiedDataContext)
- ❌ Old authentication patterns (replaced by authService)
- ❌ Duplicate data management (consolidated)

### API Integration Status
- ✅ **Nessie API**: Working for customers and accounts
- ✅ **Sample Data**: Fallback when Nessie transactions unavailable
- ✅ **Mock Data**: Final fallback for complete functionality
- ✅ **Firestore**: Primary data storage with real-time sync

## 🚀 Benefits of New Architecture

1. **Single Source of Truth**: All components use UnifiedDataContext
2. **Consistent Data Flow**: Predictable data loading and updates
3. **Robust Error Handling**: Multiple fallback mechanisms
4. **Clean Separation**: Services, contexts, and data layers are distinct
5. **Maintainable**: Clear responsibilities and minimal duplication
6. **Scalable**: Easy to add new data sources or features

## 🔧 Usage

```jsx
// In any component
import { useUnifiedData } from '../contexts/UnifiedDataContext'

const MyComponent = () => {
  const { 
    user, 
    financialData, 
    isLoading, 
    error,
    refreshData,
    signOut 
  } = useUnifiedData()
  
  // Use the data...
}
```

This architecture ensures a clean, maintainable, and robust financial data management system.
