/**
 * Comprehensive Test Data Seeder for Payment System Testing
 * Creates realistic dummy data for end-to-end testing
 */

import { connectDB } from '../lib/mongodb.js'
import { Booking } from '../models/Booking.js'
import { PaymentTransaction } from '../models/PaymentTransaction.js'

const testProviders = [
  {
    email: 'john.plumber@test.com',
    name: 'John Doe',
    phone: '+233123456789',
    tier: 'VERIFIED',
    businessType: 'Plumbing',
    joinDate: new Date('2023-06-15'),
    totalEarned: 2450.00,
    completedJobs: 25
  },
  {
    email: 'jane.cleaner@test.com',
    name: 'Jane Smith',
    phone: '+233987654321',
    tier: 'PREMIUM',
    businessType: 'Cleaning',
    joinDate: new Date('2023-04-20'),
    totalEarned: 3200.00,
    completedJobs: 42
  },
  {
    email: 'mike.electrician@test.com',
    name: 'Mike Johnson',
    phone: '+233555666777',
    tier: 'NEW',
    businessType: 'Electrical',
    joinDate: new Date('2024-01-01'),
    totalEarned: 800.00,
    completedJobs: 8
  },
  {
    email: 'sarah.painter@test.com',
    name: 'Sarah Wilson',
    phone: '+233444555666',
    tier: 'ENTERPRISE',
    businessType: 'Painting',
    joinDate: new Date('2022-08-10'),
    totalEarned: 5600.00,
    completedJobs: 78
  }
]

const testCustomers = [
  {
    email: 'customer1@test.com',
    name: 'Alice Brown',
    phone: '+233111222333'
  },
  {
    email: 'customer2@test.com',
    name: 'Bob Green',
    phone: '+233444555666'
  },
  {
    email: 'customer3@test.com',
    name: 'Carol White',
    phone: '+233777888999'
  },
  {
    email: 'customer4@test.com',
    name: 'David Black',
    phone: '+233222333444'
  }
]

const testBookings = [
  // Completed bookings ready for invoice generation
  {
    businessId: '507f1f77bcf86cd799439011',
    userEmail: 'customer1@test.com',
    userName: 'Alice Brown',
    providerEmail: 'john.plumber@test.com',
    date: new Date('2024-01-15'),
    time: '10:00 AM',
    status: 'COMPLETED',
    serviceDetails: 'Emergency pipe repair in kitchen',
    serviceType: 'EMERGENCY',
    totalAmount: 0, // Will be set during invoice generation
    paymentStatus: 'PENDING',
    invoiceGenerated: false,
    createdAt: new Date('2024-01-14')
  },
  {
    businessId: '507f1f77bcf86cd799439012',
    userEmail: 'customer2@test.com',
    userName: 'Bob Green',
    providerEmail: 'jane.cleaner@test.com',
    date: new Date('2024-01-16'),
    time: '2:00 PM',
    status: 'COMPLETED',
    serviceDetails: 'Weekly house cleaning service',
    serviceType: 'RECURRING',
    totalAmount: 0,
    paymentStatus: 'PENDING',
    invoiceGenerated: false,
    createdAt: new Date('2024-01-15')
  },
  {
    businessId: '507f1f77bcf86cd799439013',
    userEmail: 'customer3@test.com',
    userName: 'Carol White',
    providerEmail: 'mike.electrician@test.com',
    date: new Date('2024-01-17'),
    time: '9:00 AM',
    status: 'COMPLETED',
    serviceDetails: 'Install ceiling fan in bedroom',
    serviceType: 'STANDARD',
    totalAmount: 0,
    paymentStatus: 'PENDING',
    invoiceGenerated: false,
    createdAt: new Date('2024-01-16')
  },
  
  // Bookings with invoices generated (cash payments)
  {
    businessId: '507f1f77bcf86cd799439014',
    userEmail: 'customer4@test.com',
    userName: 'David Black',
    providerEmail: 'john.plumber@test.com',
    date: new Date('2024-01-10'),
    time: '11:00 AM',
    status: 'COMPLETED',
    serviceDetails: 'Bathroom sink installation',
    serviceType: 'STANDARD',
    totalAmount: 350.00,
    platformCommission: 0,
    providerPayout: 350.00,
    commissionOwed: 63.00, // 18% commission
    paymentMethod: 'CASH',
    paymentStatus: 'COMPLETED',
    invoiceGenerated: true,
    invoiceId: 'INV-1705123456-439014',
    serviceCompletionDate: new Date('2024-01-10'),
    createdAt: new Date('2024-01-09')
  },
  {
    businessId: '507f1f77bcf86cd799439015',
    userEmail: 'customer1@test.com',
    userName: 'Alice Brown',
    providerEmail: 'jane.cleaner@test.com',
    date: new Date('2024-01-12'),
    time: '3:00 PM',
    status: 'COMPLETED',
    serviceDetails: 'Deep cleaning after renovation',
    serviceType: 'STANDARD',
    totalAmount: 280.00,
    platformCommission: 0,
    providerPayout: 280.00,
    commissionOwed: 42.00, // 15% for premium provider
    paymentMethod: 'CASH',
    paymentStatus: 'COMPLETED',
    invoiceGenerated: true,
    invoiceId: 'INV-1705234567-439015',
    serviceCompletionDate: new Date('2024-01-12'),
    createdAt: new Date('2024-01-11')
  },
  
  // Bookings with Paystack payments (commission auto-deducted)
  {
    businessId: '507f1f77bcf86cd799439016',
    userEmail: 'customer2@test.com',
    userName: 'Bob Green',
    providerEmail: 'sarah.painter@test.com',
    date: new Date('2024-01-08'),
    time: '8:00 AM',
    status: 'COMPLETED',
    serviceDetails: 'Living room painting',
    serviceType: 'STANDARD',
    totalAmount: 450.00,
    platformCommission: 54.00, // 12% for enterprise provider
    providerPayout: 396.00,
    commissionOwed: 0,
    paymentMethod: 'PAYSTACK',
    paymentStatus: 'PAID',
    paystackReference: 'PAY_1705098765_ABC123',
    paystackTransactionId: 'txn_1705098765',
    invoiceGenerated: true,
    invoiceId: 'INV-1705098765-439016',
    serviceCompletionDate: new Date('2024-01-08'),
    createdAt: new Date('2024-01-07')
  }
]

const testPaymentTransactions = [
  // Cash payment transactions (commission owed)
  {
    bookingId: '507f1f77bcf86cd799439014',
    invoiceId: 'INV-1705123456-439014',
    providerEmail: 'john.plumber@test.com',
    customerEmail: 'customer4@test.com',
    businessId: '507f1f77bcf86cd799439014',
    totalAmount: 350.00,
    platformCommission: 0,
    providerPayout: 350.00,
    commissionOwed: 63.00,
    paymentMethod: 'CASH',
    paymentStatus: 'COMPLETED',
    commissionStatus: 'PENDING',
    metadata: {
      providerTier: 'VERIFIED',
      serviceType: 'STANDARD',
      commissionRate: 0.18
    },
    createdAt: new Date('2024-01-10')
  },
  {
    bookingId: '507f1f77bcf86cd799439015',
    invoiceId: 'INV-1705234567-439015',
    providerEmail: 'jane.cleaner@test.com',
    customerEmail: 'customer1@test.com',
    businessId: '507f1f77bcf86cd799439015',
    totalAmount: 280.00,
    platformCommission: 0,
    providerPayout: 280.00,
    commissionOwed: 42.00,
    paymentMethod: 'CASH',
    paymentStatus: 'COMPLETED',
    commissionStatus: 'PENDING',
    metadata: {
      providerTier: 'PREMIUM',
      serviceType: 'STANDARD',
      commissionRate: 0.15
    },
    createdAt: new Date('2024-01-12')
  },
  
  // Paystack payment transaction (commission collected)
  {
    bookingId: '507f1f77bcf86cd799439016',
    invoiceId: 'INV-1705098765-439016',
    providerEmail: 'sarah.painter@test.com',
    customerEmail: 'customer2@test.com',
    businessId: '507f1f77bcf86cd799439016',
    totalAmount: 450.00,
    platformCommission: 54.00,
    providerPayout: 396.00,
    commissionOwed: 0,
    paymentMethod: 'PAYSTACK',
    paymentStatus: 'COMPLETED',
    commissionStatus: 'COLLECTED',
    paystackReference: 'PAY_1705098765_ABC123',
    paystackTransactionId: 'txn_1705098765',
    paystackFees: 8.55, // Paystack fees
    metadata: {
      providerTier: 'ENTERPRISE',
      serviceType: 'STANDARD',
      commissionRate: 0.12
    },
    createdAt: new Date('2024-01-08')
  }
]

export async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...')
    
    // Connect to database
    await connectDB()
    
    // Clear existing test data
    console.log('🧹 Clearing existing test data...')
    await clearTestData()
    
    // Seed bookings
    console.log('📋 Seeding test bookings...')
    for (const bookingData of testBookings) {
      const booking = new Booking(bookingData)
      const result = await Booking.create(booking)
      console.log(`✅ Created booking: ${result.booking._id}`)
    }
    
    // Seed payment transactions
    console.log('💳 Seeding payment transactions...')
    for (const transactionData of testPaymentTransactions) {
      const result = await PaymentTransaction.create(transactionData)
      console.log(`✅ Created transaction: ${result.transactionId}`)
    }
    
    console.log('🎉 Test data seeding completed successfully!')
    
    // Print summary
    printTestDataSummary()
    
  } catch (error) {
    console.error('❌ Error seeding test data:', error)
    throw error
  }
}

export async function clearTestData() {
  try {
    // Clear test bookings (those with test emails)
    const testEmails = testCustomers.map(c => c.email).concat(testProviders.map(p => p.email))
    
    // Note: In a real implementation, you'd clear from actual collections
    console.log('🧹 Test data cleared (mock implementation)')
    
  } catch (error) {
    console.error('❌ Error clearing test data:', error)
    throw error
  }
}

function printTestDataSummary() {
  console.log('\n📊 TEST DATA SUMMARY')
  console.log('====================')
  console.log(`👥 Providers: ${testProviders.length}`)
  console.log(`🏠 Customers: ${testCustomers.length}`)
  console.log(`📋 Bookings: ${testBookings.length}`)
  console.log(`💳 Transactions: ${testPaymentTransactions.length}`)
  console.log('\n🎯 TEST SCENARIOS READY:')
  console.log('- Invoice generation for completed services')
  console.log('- Cash payment commission tracking')
  console.log('- Paystack payment processing')
  console.log('- Commission calculation for different tiers')
  console.log('- Payment portal testing')
  console.log('- Admin dashboard testing')
  console.log('\n🚀 Ready for end-to-end testing!')
}

export { testProviders, testCustomers, testBookings, testPaymentTransactions }
