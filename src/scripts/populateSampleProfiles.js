// Script to populate Firestore with sample profiles
import { db, sampleProfilesCollection } from '../firebaseAdmin.js'
import { generateMockData } from '../data/mockData.js'

const sampleProfiles = [
  {
    name: 'Tech Professional',
    balance: 15420,
    accountInfo: {
      accountId: 'tech-account-1',
      accountType: 'Checking',
      accountName: 'Tech Professional Account'
    },
    accounts: [
      {
        id: 'tech-account-1',
        name: 'Primary Checking',
        type: 'Checking',
        balance: 15420,
        createdAt: new Date('2023-01-15')
      },
      {
        id: 'tech-savings-1',
        name: 'High-Yield Savings',
        type: 'Savings',
        balance: 8500,
        createdAt: new Date('2023-02-01')
      }
    ],
    transactions: [
      {
        id: 'tech-tx-1',
        amount: 4500,
        category: 'Income',
        description: 'Monthly Salary',
        date: '2024-01-15',
        type: 'income'
      },
      {
        id: 'tech-tx-2',
        amount: 1200,
        category: 'Rent',
        description: 'Monthly Rent Payment',
        date: '2024-01-01',
        type: 'expense'
      },
      {
        id: 'tech-tx-3',
        amount: 350,
        category: 'Food',
        description: 'Grocery Shopping',
        date: '2024-01-10',
        type: 'expense'
      },
      {
        id: 'tech-tx-4',
        amount: 89,
        category: 'Entertainment',
        description: 'Netflix Subscription',
        date: '2024-01-05',
        type: 'expense'
      },
      {
        id: 'tech-tx-5',
        amount: 200,
        category: 'Transport',
        description: 'Gas & Transportation',
        date: '2024-01-08',
        type: 'expense'
      }
    ]
  },
  {
    name: 'Freelance Designer',
    balance: 8750,
    accountInfo: {
      accountId: 'freelance-account-1',
      accountType: 'Checking',
      accountName: 'Freelance Business Account'
    },
    accounts: [
      {
        id: 'freelance-account-1',
        name: 'Business Checking',
        type: 'Checking',
        balance: 8750,
        createdAt: new Date('2023-06-01')
      }
    ],
    transactions: [
      {
        id: 'freelance-tx-1',
        amount: 3200,
        category: 'Income',
        description: 'Client Project Payment',
        date: '2024-01-12',
        type: 'income'
      },
      {
        id: 'freelance-tx-2',
        amount: 1800,
        category: 'Income',
        description: 'Logo Design Project',
        date: '2024-01-05',
        type: 'income'
      },
      {
        id: 'freelance-tx-3',
        amount: 950,
        category: 'Rent',
        description: 'Studio Apartment Rent',
        date: '2024-01-01',
        type: 'expense'
      },
      {
        id: 'freelance-tx-4',
        amount: 150,
        category: 'Food',
        description: 'Organic Groceries',
        date: '2024-01-08',
        type: 'expense'
      },
      {
        id: 'freelance-tx-5',
        amount: 45,
        category: 'Entertainment',
        description: 'Spotify Premium',
        date: '2024-01-03',
        type: 'expense'
      }
    ]
  },
  {
    name: 'College Student',
    balance: 2340,
    accountInfo: {
      accountId: 'student-account-1',
      accountType: 'Checking',
      accountName: 'Student Account'
    },
    accounts: [
      {
        id: 'student-account-1',
        name: 'Student Checking',
        type: 'Checking',
        balance: 2340,
        createdAt: new Date('2023-09-01')
      }
    ],
    transactions: [
      {
        id: 'student-tx-1',
        amount: 1200,
        category: 'Income',
        description: 'Part-time Job',
        date: '2024-01-10',
        type: 'income'
      },
      {
        id: 'student-tx-2',
        amount: 800,
        category: 'Income',
        description: 'Financial Aid Refund',
        date: '2024-01-15',
        type: 'income'
      },
      {
        id: 'student-tx-3',
        amount: 650,
        category: 'Rent',
        description: 'Dorm Room Payment',
        date: '2024-01-01',
        type: 'expense'
      },
      {
        id: 'student-tx-4',
        amount: 120,
        category: 'Food',
        description: 'Campus Dining',
        date: '2024-01-12',
        type: 'expense'
      },
      {
        id: 'student-tx-5',
        amount: 85,
        category: 'Education',
        description: 'Textbook Purchase',
        date: '2024-01-05',
        type: 'expense'
      }
    ]
  },
  {
    name: 'Retiree',
    balance: 45600,
    accountInfo: {
      accountId: 'retiree-account-1',
      accountType: 'Savings',
      accountName: 'Retirement Savings'
    },
    accounts: [
      {
        id: 'retiree-account-1',
        name: 'Retirement Savings',
        type: 'Savings',
        balance: 45600,
        createdAt: new Date('2020-01-01')
      },
      {
        id: 'retiree-checking-1',
        name: 'Monthly Expenses',
        type: 'Checking',
        balance: 3200,
        createdAt: new Date('2020-01-01')
      }
    ],
    transactions: [
      {
        id: 'retiree-tx-1',
        amount: 2800,
        category: 'Income',
        description: 'Social Security',
        date: '2024-01-03',
        type: 'income'
      },
      {
        id: 'retiree-tx-2',
        amount: 1200,
        category: 'Income',
        description: 'Pension Payment',
        date: '2024-01-01',
        type: 'income'
      },
      {
        id: 'retiree-tx-3',
        amount: 450,
        category: 'Healthcare',
        description: 'Medical Insurance',
        date: '2024-01-01',
        type: 'expense'
      },
      {
        id: 'retiree-tx-4',
        amount: 200,
        category: 'Food',
        description: 'Grocery Shopping',
        date: '2024-01-10',
        type: 'expense'
      },
      {
        id: 'retiree-tx-5',
        amount: 150,
        category: 'Entertainment',
        description: 'Golf Club Membership',
        date: '2024-01-05',
        type: 'expense'
      }
    ]
  },
  {
    name: 'Small Business Owner',
    balance: 28900,
    accountInfo: {
      accountId: 'business-account-1',
      accountType: 'Business',
      accountName: 'Business Operating Account'
    },
    accounts: [
      {
        id: 'business-account-1',
        name: 'Business Operating',
        type: 'Business',
        balance: 28900,
        createdAt: new Date('2022-03-01')
      },
      {
        id: 'business-savings-1',
        name: 'Business Savings',
        type: 'Savings',
        balance: 15000,
        createdAt: new Date('2022-03-01')
      }
    ],
    transactions: [
      {
        id: 'business-tx-1',
        amount: 8500,
        category: 'Income',
        description: 'Monthly Revenue',
        date: '2024-01-15',
        type: 'income'
      },
      {
        id: 'business-tx-2',
        amount: 3200,
        category: 'Income',
        description: 'Client Payment',
        date: '2024-01-10',
        type: 'income'
      },
      {
        id: 'business-tx-3',
        amount: 1800,
        category: 'Rent',
        description: 'Office Rent',
        date: '2024-01-01',
        type: 'expense'
      },
      {
        id: 'business-tx-4',
        amount: 450,
        category: 'Utilities',
        description: 'Office Utilities',
        date: '2024-01-05',
        type: 'expense'
      },
      {
        id: 'business-tx-5',
        amount: 320,
        category: 'Marketing',
        description: 'Digital Marketing',
        date: '2024-01-08',
        type: 'expense'
      }
    ]
  }
]

/**
 * Populate Firestore with sample profiles
 */
export const populateSampleProfiles = async () => {
  try {
    console.log('Starting to populate sample profiles...')
    
    for (const profile of sampleProfiles) {
      const docRef = sampleProfilesCollection().doc()
      await docRef.set(profile)
      console.log(`Created sample profile: ${profile.name}`)
    }
    
    console.log('Successfully populated all sample profiles!')
    return { success: true, count: sampleProfiles.length }
    
  } catch (error) {
    console.error('Error populating sample profiles:', error)
    throw error
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  populateSampleProfiles()
    .then(result => {
      console.log('Sample profiles populated:', result)
      process.exit(0)
    })
    .catch(error => {
      console.error('Failed to populate sample profiles:', error)
      process.exit(1)
    })
}
