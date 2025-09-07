import { NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/mongodb'
import Category from '@/models/Category'
import BusinessList from '@/models/BusinessList'
import { User } from '@/models/User'
import { Booking } from '@/models/Booking'
import { Review } from '@/models/Review'

export async function POST() {
  try {
    console.log('🌱 Starting comprehensive database seeding...')
    await ensureConnection()

    const seedData = {
      users: [],
      categories: [],
      businesses: [],
      bookings: [],
      reviews: []
    }

    // 1. Create Users with proper roles and permissions
    console.log('👥 Creating users...')
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@homeservice.com',
        password: 'Admin123!',
        role: 'ADMIN',
        phone: '+1234567890',
        address: 'Admin Office, Tech City',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Test Customer',
        email: 'customer@test.com',
        password: 'Test123!',
        role: 'CUSTOMER',
        phone: '+1234567891',
        address: '123 Customer Street, City',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Test Provider',
        email: 'provider@test.com',
        password: 'Test123!',
        role: 'PROVIDER',
        phone: '+1234567892',
        address: '456 Provider Avenue, City',
        emailVerified: true,
        isActive: true
      },
      // Additional customers
      {
        name: 'Sarah Johnson',
        email: 'sarah.johnson@email.com',
        password: 'Password123!',
        role: 'CUSTOMER',
        phone: '+1234567893',
        address: '789 Maple Street, Springfield',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Mike Wilson',
        email: 'mike.wilson@email.com',
        password: 'Password123!',
        role: 'CUSTOMER',
        phone: '+1234567894',
        address: '321 Oak Drive, Riverside',
        emailVerified: true,
        isActive: true
      },
      // Additional providers
      {
        name: 'Emily Davis',
        email: 'emily.davis@cleanpro.com',
        password: 'Provider123!',
        role: 'PROVIDER',
        phone: '+1234567895',
        address: '555 Business Plaza, Downtown',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Robert Brown',
        email: 'robert.brown@repairs.com',
        password: 'Provider123!',
        role: 'PROVIDER',
        phone: '+1234567896',
        address: '777 Industrial Ave, Workshop District',
        emailVerified: true,
        isActive: true
      },
      {
        name: 'Lisa Chen',
        email: 'lisa.chen@paintpro.com',
        password: 'Provider123!',
        role: 'PROVIDER',
        phone: '+1234567897',
        address: '888 Artist Lane, Creative Quarter',
        emailVerified: true,
        isActive: true
      }
    ]

    for (const userData of users) {
      try {
        const result = await User.create(userData)
        seedData.users.push(result.user)
        console.log(`✅ Created user: ${userData.email} (${userData.role})`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ User already exists: ${userData.email}`)
        } else {
          console.error(`❌ Error creating user ${userData.email}:`, error.message)
        }
      }
    }

    // 2. Create Categories
    console.log('📂 Creating categories...')
    
    const categories = [
      {
        name: 'Cleaning',
        backgroundColor: '#10B981',
        icon: '/cleaning-icon.svg',
        description: 'Professional home and office cleaning services'
      },
      {
        name: 'Repair',
        backgroundColor: '#F59E0B',
        icon: '/repair-icon.svg',
        description: 'General repair and maintenance services'
      },
      {
        name: 'Painting',
        backgroundColor: '#EF4444',
        icon: '/painting-icon.svg',
        description: 'Interior and exterior painting services'
      },
      {
        name: 'Shifting',
        backgroundColor: '#8B5CF6',
        icon: '/shifting-icon.svg',
        description: 'Moving and relocation services'
      },
      {
        name: 'Plumbing',
        backgroundColor: '#06B6D4',
        icon: '/plumbing-icon.svg',
        description: 'Professional plumbing and water system services'
      },
      {
        name: 'Electric',
        backgroundColor: '#F97316',
        icon: '/electric-icon.svg',
        description: 'Electrical installation and repair services'
      }
    ]

    for (const categoryData of categories) {
      try {
        const result = await Category.create(categoryData)
        seedData.categories.push(result.category)
        console.log(`✅ Created category: ${categoryData.name}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`⚠️ Category already exists: ${categoryData.name}`)
          // Get existing category
          const existing = await Category.findByName(categoryData.name)
          if (existing) seedData.categories.push(existing)
        } else {
          console.error(`❌ Error creating category ${categoryData.name}:`, error.message)
        }
      }
    }

    // 3. Create Businesses
    console.log('🏢 Creating businesses...')
    
    const businesses = [
      // Cleaning Services
      {
        name: 'CleanPro Elite Services',
        about: 'Premium residential and commercial cleaning with eco-friendly products. Over 10 years of experience serving the community.',
        address: '123 Clean Street, Downtown, City 12345',
        contactPerson: 'Emily Davis',
        email: 'emily.davis@cleanpro.com',
        phone: '+1234567895',
        images: ['/business1.jpg', '/business1-2.jpg'],
        specializations: ['Deep Cleaning', 'Office Cleaning', 'Eco-Friendly', 'Post-Construction'],
        certifications: ['Certified Cleaning Professional', 'Green Cleaning Certified', 'Insured & Bonded'],
        experience: '10+ years in professional cleaning services',
        portfolio: ['/portfolio1.jpg', '/portfolio2.jpg', '/portfolio3.jpg'],
        rating: 4.8,
        totalReviews: 156,
        providerEmail: 'emily.davis@cleanpro.com',
        createdBy: 'emily.davis@cleanpro.com'
      },
      {
        name: 'Sparkle Home Cleaning',
        about: 'Affordable and reliable home cleaning services. We make your home shine like new!',
        address: '456 Sparkle Ave, Residential District, City 12346',
        contactPerson: 'Maria Rodriguez',
        email: 'maria@sparkle.com',
        phone: '+1234567898',
        images: ['/business2.jpg'],
        specializations: ['Regular Cleaning', 'Move-in/Move-out', 'Weekly Service'],
        certifications: ['Insured', 'Background Checked'],
        experience: '5 years of dedicated home cleaning',
        portfolio: ['/portfolio4.jpg', '/portfolio5.jpg'],
        rating: 4.5,
        totalReviews: 89,
        providerEmail: 'provider@test.com',
        createdBy: 'provider@test.com'
      },
      // Repair Services
      {
        name: 'FixIt Pro Repairs',
        about: 'Complete home repair solutions. From minor fixes to major renovations, we do it all with precision and care.',
        address: '789 Repair Road, Workshop Area, City 12347',
        contactPerson: 'Robert Brown',
        email: 'robert.brown@repairs.com',
        phone: '+1234567896',
        images: ['/business3.jpg', '/business3-2.jpg'],
        specializations: ['Carpentry', 'Drywall', 'Flooring', 'General Maintenance'],
        certifications: ['Licensed Contractor', 'Insured', '20 Years Experience'],
        experience: '20+ years in home repairs and renovations',
        portfolio: ['/portfolio6.jpg', '/portfolio7.jpg'],
        rating: 4.9,
        totalReviews: 234,
        providerEmail: 'robert.brown@repairs.com',
        createdBy: 'robert.brown@repairs.com'
      },
      {
        name: 'Quick Fix Solutions',
        about: 'Fast and affordable repair services for busy homeowners. Same-day service available.',
        address: '321 Quick Street, Service Hub, City 12348',
        contactPerson: 'David Kim',
        email: 'david@quickfix.com',
        phone: '+1234567899',
        images: ['/business4.jpg'],
        specializations: ['Emergency Repairs', 'Appliance Repair', 'Furniture Assembly'],
        certifications: ['Certified Technician', 'Same-Day Service'],
        experience: '8 years of quick repair solutions',
        portfolio: ['/portfolio8.jpg'],
        rating: 4.3,
        totalReviews: 67,
        providerEmail: 'provider@test.com',
        createdBy: 'provider@test.com'
      },
      // Painting Services
      {
        name: 'ColorCraft Painting Studio',
        about: 'Professional painting services with artistic touch. We transform spaces with premium quality paints and expert techniques.',
        address: '555 Paint Plaza, Artist Quarter, City 12349',
        contactPerson: 'Lisa Chen',
        email: 'lisa.chen@paintpro.com',
        phone: '+1234567897',
        images: ['/business5.jpg', '/business5-2.jpg'],
        specializations: ['Interior Painting', 'Exterior Painting', 'Decorative Finishes', 'Color Consultation'],
        certifications: ['Master Painter Certified', 'Color Specialist', 'Eco-Paint Certified'],
        experience: '15+ years of professional painting',
        portfolio: ['/portfolio9.jpg', '/portfolio10.jpg', '/portfolio11.jpg'],
        rating: 4.7,
        totalReviews: 178,
        providerEmail: 'lisa.chen@paintpro.com',
        createdBy: 'lisa.chen@paintpro.com'
      }
      // Additional businesses will be added for other categories...
    ]

    for (const businessData of businesses) {
      try {
        // Find category by name
        const category = seedData.categories.find(cat => {
          if (businessData.name.toLowerCase().includes('clean')) return cat.name === 'Cleaning'
          if (businessData.name.toLowerCase().includes('repair') || businessData.name.toLowerCase().includes('fix')) return cat.name === 'Repair'
          if (businessData.name.toLowerCase().includes('paint')) return cat.name === 'Painting'
          return false
        })

        if (!category) {
          console.log(`⚠️ No category found for business: ${businessData.name}`)
          continue
        }

        const businessWithCategory = {
          ...businessData,
          categoryId: category._id
        }

        const business = new BusinessList(businessWithCategory)
        const savedBusiness = await business.save()
        seedData.businesses.push(savedBusiness)
        console.log(`✅ Created business: ${businessData.name}`)
      } catch (error) {
        console.error(`❌ Error creating business ${businessData.name}:`, error.message)
      }
    }

    // 4. Create Sample Bookings
    console.log('📅 Creating bookings...')
    
    const bookings = [
      {
        businessId: seedData.businesses[0]?._id,
        userEmail: 'customer@test.com',
        userName: 'Test Customer',
        date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        time: '10:00',
        status: 'CONFIRMED',
        serviceDetails: 'Deep cleaning for 3-bedroom house',
        totalAmount: 150,
        paymentStatus: 'PAID'
      },
      {
        businessId: seedData.businesses[1]?._id,
        userEmail: 'sarah.johnson@email.com',
        userName: 'Sarah Johnson',
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
        time: '14:00',
        status: 'COMPLETED',
        serviceDetails: 'Regular weekly cleaning',
        totalAmount: 80,
        paymentStatus: 'PAID',
        rating: 5,
        review: 'Excellent service! Very thorough and professional.'
      },
      {
        businessId: seedData.businesses[2]?._id,
        userEmail: 'mike.wilson@email.com',
        userName: 'Mike Wilson',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        time: '09:00',
        status: 'CONFIRMED',
        serviceDetails: 'Kitchen cabinet repair and bathroom tile fix',
        totalAmount: 200,
        paymentStatus: 'PENDING'
      }
    ]

    for (const bookingData of bookings) {
      if (bookingData.businessId) {
        try {
          const result = await Booking.create(bookingData)
          seedData.bookings.push(result.booking)
          console.log(`✅ Created booking for ${bookingData.userName}`)
        } catch (error) {
          console.error(`❌ Error creating booking:`, error.message)
        }
      }
    }

    // 5. Create Sample Reviews
    console.log('⭐ Creating reviews...')
    
    const reviews = [
      {
        businessId: seedData.businesses[0]?._id,
        userEmail: 'sarah.johnson@email.com',
        userName: 'Sarah Johnson',
        rating: 5,
        comment: 'Amazing service! They cleaned every corner of my house perfectly. Will definitely book again.',
        isVerified: true
      },
      {
        businessId: seedData.businesses[0]?._id,
        userEmail: 'mike.wilson@email.com',
        userName: 'Mike Wilson',
        rating: 4,
        comment: 'Great cleaning service, arrived on time and did a thorough job. Slightly expensive but worth it.',
        isVerified: true
      },
      {
        businessId: seedData.businesses[2]?._id,
        userEmail: 'customer@test.com',
        userName: 'Test Customer',
        rating: 5,
        comment: 'Excellent repair work! Fixed my kitchen cabinets perfectly and cleaned up after the work.',
        isVerified: true
      }
    ]

    for (const reviewData of reviews) {
      if (reviewData.businessId) {
        try {
          const result = await Review.create(reviewData)
          seedData.reviews.push(result.review)
          console.log(`✅ Created review by ${reviewData.userName}`)
        } catch (error) {
          if (!error.message.includes('already reviewed')) {
            console.error(`❌ Error creating review:`, error.message)
          }
        }
      }
    }

    console.log('🎉 Database seeding completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Test database seeded successfully with comprehensive data',
      summary: {
        users: seedData.users.length,
        categories: seedData.categories.length,
        businesses: seedData.businesses.length,
        bookings: seedData.bookings.length,
        reviews: seedData.reviews.length
      },
      testCredentials: {
        admin: { email: 'admin@homeservice.com', password: 'Admin123!' },
        customer: { email: 'customer@test.com', password: 'Test123!' },
        provider: { email: 'provider@test.com', password: 'Test123!' }
      }
    })

  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
} 