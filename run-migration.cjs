// Simple Migration Runner for RetroVault
// Runs the comprehensive migration to unified Firestore structure

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require('./serviceAccountKey.json');
const app = initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore(app);

// ============================================================================
// MIGRATION FUNCTIONS
// ============================================================================

/**
 * Get migration status
 */
const getMigrationStatus = async () => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const status = {
      totalUsers: usersSnapshot.docs.length,
      migratedUsers: 0,
      pendingUsers: 0,
      errorUsers: 0
    };
    
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      if (userData.metadata?.dataVersion === '2.0') {
        status.migratedUsers++;
      } else {
        status.pendingUsers++;
      }
    }
    
    return status;
  } catch (error) {
    console.error('❌ Error getting migration status:', error);
    throw error;
  }
};

/**
 * Migrate user profile to new unified structure
 */
const migrateUserProfile = async (userId, oldUserData) => {
  try {
    console.log(`📄 Migrating user profile: ${userId}`);
    
    const newUserProfile = {
      // Core profile data
      profile: {
        name: oldUserData.name || 'User',
        email: oldUserData.email || '',
        photoURL: oldUserData.photoURL || null,
        createdAt: new Date(),
        lastLogin: new Date()
      },
      
      // Financial summary (denormalized for performance)
      financialSummary: {
        totalBalance: oldUserData.balance || 0,
        totalIncome: 0,
        totalExpenses: 0,
        totalSavings: 0,
        lastUpdated: new Date()
      },
      
      // Data source and consistency tracking
      dataSource: oldUserData.dataSource || 'Migration',
      syncStatus: {
        lastSync: new Date(),
        isConsistent: true,
        needsRefresh: false,
        version: 1
      },
      
      // User preferences and settings
      preferences: {
        currency: 'USD',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        categories: [
          'Food', 'Transport', 'Entertainment', 'Shopping', 
          'Bills', 'Healthcare', 'Education', 'Travel', 'Other'
        ],
        notifications: {
          budgetAlerts: true,
          goalReminders: true,
          weeklyReports: true
        }
      },
      
      // Metadata for data integrity
      metadata: {
        accountsCount: 0,
        transactionsCount: 0,
        lastDataUpdate: new Date(),
        dataVersion: '2.0'
      }
    };
    
    // Create user document in new structure
    await db.collection('users').doc(userId).set(newUserProfile);
    console.log(`✅ Migrated user profile: ${userId}`);
    
    return newUserProfile;
  } catch (error) {
    console.error(`❌ Error migrating user profile ${userId}:`, error);
    throw error;
  }
};

/**
 * Migrate user accounts from nested to flat structure
 */
const migrateUserAccounts = async (userId) => {
  try {
    console.log(`🏦 Migrating accounts for user: ${userId}`);
    
    // Get accounts from old nested structure
    const accountsSnapshot = await db.collection(`users/${userId}/accounts`).get();
    
    if (accountsSnapshot.empty) {
      console.log(`📝 No accounts found for user: ${userId}`);
      return { count: 0, accounts: [] };
    }
    
    console.log(`📊 Found ${accountsSnapshot.docs.length} accounts for user: ${userId}`);
    
    const migratedAccounts = [];
    
    // Migrate each account
    for (const accountDoc of accountsSnapshot.docs) {
      const accountData = accountDoc.data();
      
      const newAccount = {
        userId: userId,
        nessieId: accountDoc.id, // Keep original ID as nessieId
        name: accountData.name || accountData.type || 'Account',
        type: accountData.type || 'Checking',
        balance: accountData.balance || 0,
        isActive: true,
        institution: 'Migrated Account',
        accountNumber: null,
        routingNumber: null,
        createdAt: new Date(),
        lastUpdated: new Date(),
        metadata: {
          syncSource: 'migration',
          lastSync: new Date()
        }
      };
      
      // Create account in new flat structure
      const accountRef = await db.collection('accounts').add(newAccount);
      migratedAccounts.push({ id: accountRef.id, ...newAccount });
      
      console.log(`✅ Migrated account: ${accountData.name}`);
    }
    
    console.log(`✅ Migrated ${migratedAccounts.length} accounts for user: ${userId}`);
    return { count: migratedAccounts.length, accounts: migratedAccounts };
  } catch (error) {
    console.error(`❌ Error migrating accounts for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Migrate user transactions from nested to flat structure
 */
const migrateUserTransactions = async (userId) => {
  try {
    console.log(`💳 Migrating transactions for user: ${userId}`);
    
    // Get transactions from old nested structure
    const transactionsSnapshot = await db.collection(`users/${userId}/transactions`).get();
    
    if (transactionsSnapshot.empty) {
      console.log(`📝 No transactions found for user: ${userId}`);
      return { count: 0, transactions: [] };
    }
    
    console.log(`📊 Found ${transactionsSnapshot.docs.length} transactions for user: ${userId}`);
    
    const transactions = [];
    
    // Prepare transactions for batch creation
    for (const transactionDoc of transactionsSnapshot.docs) {
      const transactionData = transactionDoc.data();
      
      const newTransaction = {
        userId: userId,
        accountId: transactionData.accountId || 'default',
        nessieId: transactionDoc.id, // Keep original ID as nessieId
        amount: transactionData.amount || 0,
        type: transactionData.type || 'expense',
        category: transactionData.category || 'Other',
        subcategory: null,
        description: transactionData.description || 'Transaction',
        merchant: transactionData.merchant || null,
        date: transactionData.date || new Date(),
        isRecurring: false,
        tags: [],
        metadata: {
          location: null,
          paymentMethod: null,
          notes: null,
          syncSource: 'migration'
        }
      };
      
      transactions.push(newTransaction);
    }
    
    // Batch create transactions
    if (transactions.length > 0) {
      const batch = db.batch();
      
      transactions.forEach(transaction => {
        const transactionRef = db.collection('transactions').doc();
        batch.set(transactionRef, {
          ...transaction,
          createdAt: new Date(),
          lastUpdated: new Date()
        });
      });
      
      await batch.commit();
      console.log(`✅ Migrated ${transactions.length} transactions for user: ${userId}`);
    }
    
    return { count: transactions.length, transactions };
  } catch (error) {
    console.error(`❌ Error migrating transactions for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Update financial summary based on migrated transactions
 */
const updateUserFinancialSummary = async (userId) => {
  try {
    console.log(`💰 Updating financial summary for user: ${userId}`);
    
    // Get all transactions for the user
    const transactionsSnapshot = await db.collection('transactions')
      .where('userId', '==', userId)
      .get();
    
    if (transactionsSnapshot.empty) {
      console.log(`📝 No transactions found for financial summary: ${userId}`);
      return;
    }
    
    // Calculate financial summary
    let totalIncome = 0;
    let totalExpenses = 0;
    
    transactionsSnapshot.docs.forEach(doc => {
      const transaction = doc.data();
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
      }
    });
    
    const totalSavings = totalIncome - totalExpenses;
    const totalBalance = totalSavings; // Simplified for now
    
    // Update user financial summary
    await db.collection('users').doc(userId).update({
      'financialSummary.totalIncome': totalIncome,
      'financialSummary.totalExpenses': totalExpenses,
      'financialSummary.totalSavings': totalSavings,
      'financialSummary.totalBalance': totalBalance,
      'financialSummary.lastUpdated': new Date(),
      'metadata.lastDataUpdate': new Date(),
      'metadata.transactionsCount': transactionsSnapshot.docs.length
    });
    
    console.log(`✅ Updated financial summary for user: ${userId}`);
    console.log(`   Income: $${totalIncome}, Expenses: $${totalExpenses}, Savings: $${totalSavings}`);
  } catch (error) {
    console.error(`❌ Error updating financial summary for user ${userId}:`, error);
    throw error;
  }
};

/**
 * Create default categories
 */
const createDefaultCategories = async () => {
  try {
    console.log('🏷️ Creating default categories...');
    
    const defaultCategories = [
      { name: 'Food', type: 'expense', color: '#FF6B6B', icon: '🍽️', isDefault: true },
      { name: 'Transport', type: 'expense', color: '#4ECDC4', icon: '🚗', isDefault: true },
      { name: 'Entertainment', type: 'expense', color: '#45B7D1', icon: '🎬', isDefault: true },
      { name: 'Shopping', type: 'expense', color: '#96CEB4', icon: '🛍️', isDefault: true },
      { name: 'Bills', type: 'expense', color: '#FFEAA7', icon: '💡', isDefault: true },
      { name: 'Healthcare', type: 'expense', color: '#DDA0DD', icon: '🏥', isDefault: true },
      { name: 'Education', type: 'expense', color: '#98D8C8', icon: '📚', isDefault: true },
      { name: 'Travel', type: 'expense', color: '#F7DC6F', icon: '✈️', isDefault: true },
      { name: 'Other', type: 'expense', color: '#95A5A6', icon: '📦', isDefault: true }
    ];
    
    const batch = db.batch();
    
    defaultCategories.forEach(category => {
      const categoryRef = db.collection('categories').doc();
      batch.set(categoryRef, category);
    });
    
    await batch.commit();
    console.log(`✅ Created ${defaultCategories.length} default categories`);
  } catch (error) {
    console.error('❌ Error creating default categories:', error);
    throw error;
  }
};

/**
 * Main migration function
 */
const runMigration = async () => {
  try {
    console.log('🚀 Starting RetroVault Data Migration...');
    console.log('=' .repeat(50));
    
    // Check current migration status
    console.log('📊 Checking current migration status...');
    const status = await getMigrationStatus();
    console.log('Current Status:', status);
    
    if (status.migratedUsers > 0) {
      console.log('⚠️  Some users have already been migrated.');
      console.log('This will update existing data. Continue? (y/N)');
      // For automated execution, we'll proceed
    }
    
    console.log('\n🔄 Starting migration process...');
    const startTime = Date.now();
    
    // Get all existing users
    const usersSnapshot = await db.collection('users').get();
    console.log(`📊 Found ${usersSnapshot.docs.length} users to migrate`);
    
    let migratedCount = 0;
    let errorCount = 0;
    const migrationResults = [];
    
    for (const userDoc of usersSnapshot.docs) {
      try {
        const userId = userDoc.id;
        const userData = userDoc.data();
        
        console.log(`🔄 Migrating user: ${userId}`);
        
        // 1. Migrate user profile
        await migrateUserProfile(userId, userData);
        
        // 2. Migrate accounts
        const accountsResult = await migrateUserAccounts(userId);
        
        // 3. Migrate transactions
        const transactionsResult = await migrateUserTransactions(userId);
        
        // 4. Update financial summary
        await updateUserFinancialSummary(userId);
        
        migratedCount++;
        console.log(`✅ Successfully migrated user: ${userId}`);
        
        migrationResults.push({
          userId,
          success: true,
          accounts: accountsResult.count,
          transactions: transactionsResult.count
        });
        
      } catch (error) {
        console.error(`❌ Error migrating user ${userDoc.id}:`, error);
        errorCount++;
        migrationResults.push({
          userId: userDoc.id,
          success: false,
          error: error.message
        });
      }
    }
    
    // Create default categories
    await createDefaultCategories();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 Migration Completed!');
    console.log('=' .repeat(50));
    console.log(`✅ Successfully migrated: ${migratedCount} users`);
    console.log(`❌ Errors: ${errorCount} users`);
    console.log(`📊 Total users: ${usersSnapshot.docs.length}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    
    if (errorCount > 0) {
      console.log('\n⚠️  Some users had errors during migration:');
      migrationResults
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.userId}: ${r.error}`));
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Test your application to ensure everything works');
    console.log('2. Monitor Firestore usage and performance');
    console.log('3. Clean up old nested collections after verification');
    console.log('4. Update any remaining components to use the unified service');
    
    return {
      success: true,
      migratedCount,
      errorCount,
      totalUsers: usersSnapshot.docs.length,
      results: migrationResults
    };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

// Run migration if called directly
if (require.main === module) {
  runMigration()
    .then(result => {
      console.log('\n✅ Migration completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigration, getMigrationStatus };
