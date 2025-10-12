// Migration Runner Script
// Executes the comprehensive migration to unified Firestore structure

import { migrateToUnifiedStructure, getMigrationStatus, verifyMigration } from './comprehensiveMigration.js'

/**
 * Run the migration with progress tracking
 */
const runMigration = async () => {
  try {
    console.log('🚀 Starting RetroVault Data Migration...')
    console.log('=' .repeat(50))
    
    // Check current migration status
    console.log('📊 Checking current migration status...')
    const status = await getMigrationStatus()
    console.log('Current Status:', status)
    
    if (status.migratedUsers > 0) {
      console.log('⚠️  Some users have already been migrated.')
      console.log('This will update existing data. Continue? (y/N)')
      // For automated execution, we'll proceed
    }
    
    console.log('\n🔄 Starting migration process...')
    const startTime = Date.now()
    
    // Run the migration
    const result = await migrateToUnifiedStructure()
    
    const endTime = Date.now()
    const duration = (endTime - startTime) / 1000
    
    console.log('\n🎉 Migration Completed!')
    console.log('=' .repeat(50))
    console.log(`✅ Successfully migrated: ${result.migratedCount} users`)
    console.log(`❌ Errors: ${result.errorCount} users`)
    console.log(`📊 Total users: ${result.totalUsers}`)
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`)
    
    if (result.errorCount > 0) {
      console.log('\n⚠️  Some users had errors during migration:')
      result.results
        .filter(r => !r.success)
        .forEach(r => console.log(`  - ${r.userId}: ${r.error}`))
    }
    
    // Verify migration for a sample user
    if (result.migratedCount > 0) {
      console.log('\n🔍 Verifying migration integrity...')
      const sampleUser = result.results.find(r => r.success)
      if (sampleUser) {
        try {
          const verification = await verifyMigration(sampleUser.userId)
          console.log('✅ Migration verification successful!')
          console.log(`  - Accounts: ${verification.accountsCount}`)
          console.log(`  - Transactions: ${verification.transactionsCount}`)
          console.log(`  - Budgets: ${verification.budgetsCount}`)
          console.log(`  - Goals: ${verification.goalsCount}`)
        } catch (error) {
          console.log('⚠️  Migration verification failed:', error.message)
        }
      }
    }
    
    console.log('\n📋 Next Steps:')
    console.log('1. Test your application to ensure everything works')
    console.log('2. Monitor Firestore usage and performance')
    console.log('3. Clean up old nested collections after verification')
    console.log('4. Update any remaining components to use the unified service')
    
    return result
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    console.error('Stack trace:', error.stack)
    throw error
  }
}

/**
 * Check migration status without running migration
 */
const checkStatus = async () => {
  try {
    console.log('📊 Checking migration status...')
    const status = await getMigrationStatus()
    
    console.log('Migration Status:')
    console.log(`  Total Users: ${status.totalUsers}`)
    console.log(`  Migrated: ${status.migratedUsers}`)
    console.log(`  Pending: ${status.pendingUsers}`)
    console.log(`  Errors: ${status.errorUsers}`)
    
    if (status.migratedUsers > 0) {
      console.log('\n✅ Some users have been migrated to the new structure')
    } else {
      console.log('\n📝 No users have been migrated yet')
    }
    
    return status
    
  } catch (error) {
    console.error('❌ Error checking status:', error)
    throw error
  }
}

/**
 * Verify migration for a specific user
 */
const verifyUserMigration = async (userId) => {
  try {
    console.log(`🔍 Verifying migration for user: ${userId}`)
    const verification = await verifyMigration(userId)
    
    console.log('Verification Results:')
    console.log(`  ✅ User Profile: Found`)
    console.log(`  📊 Accounts: ${verification.accountsCount}`)
    console.log(`  💳 Transactions: ${verification.transactionsCount}`)
    console.log(`  💰 Budgets: ${verification.budgetsCount}`)
    console.log(`  🎯 Goals: ${verification.goalsCount}`)
    
    if (verification.financialSummary) {
      console.log('\n💰 Financial Summary:')
      console.log(`  Balance: $${verification.financialSummary.totalBalance}`)
      console.log(`  Income: $${verification.financialSummary.totalIncome}`)
      console.log(`  Expenses: $${verification.financialSummary.totalExpenses}`)
      console.log(`  Savings: $${verification.financialSummary.totalSavings}`)
    }
    
    return verification
    
  } catch (error) {
    console.error(`❌ Error verifying user ${userId}:`, error)
    throw error
  }
}

// Export functions for use
export { runMigration, checkStatus, verifyUserMigration }

// If running directly, execute migration
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  
  if (args.includes('--status')) {
    await checkStatus()
  } else if (args.includes('--verify')) {
    const userId = args[args.indexOf('--verify') + 1]
    if (userId) {
      await verifyUserMigration(userId)
    } else {
      console.log('❌ Please provide a user ID: --verify <userId>')
    }
  } else {
    await runMigration()
  }
}
