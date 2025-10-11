// Deployment script for RetroVault
import { populateSampleProfiles } from '../src/scripts/populateSampleProfiles.js'

/**
 * Main deployment function
 */
const deploy = async () => {
  try {
    console.log('🚀 Starting RetroVault deployment...')
    
    // Populate sample profiles
    console.log('📊 Populating sample profiles...')
    const result = await populateSampleProfiles()
    console.log(`✅ Created ${result.count} sample profiles`)
    
    console.log('🎉 Deployment completed successfully!')
    console.log('')
    console.log('Next steps:')
    console.log('1. Set up your Firebase project')
    console.log('2. Configure environment variables')
    console.log('3. Deploy to Vercel')
    console.log('4. Test the authentication flow')
    
  } catch (error) {
    console.error('❌ Deployment failed:', error)
    process.exit(1)
  }
}

// Run deployment
deploy()
