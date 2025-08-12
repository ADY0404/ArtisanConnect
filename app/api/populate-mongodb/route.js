import { NextResponse } from 'next/server'
import Category from '@/models/Category'
import BusinessList from '@/models/BusinessList'

// Sample data to populate the database
const SAMPLE_CATEGORIES = [
  {
    name: 'Cleaning',
    backgroundColor: '#10B981',
    icon: '/cleaning.svg',
    description: 'Professional cleaning services for homes and offices'
  },
  {
    name: 'Repair',
    backgroundColor: '#F59E0B',
    icon: '/repair.svg',
    description: 'Expert repair services for appliances and fixtures'
  },
  {
    name: 'Painting',
    backgroundColor: '#8B5CF6',
    icon: '/painting.svg',
    description: 'Interior and exterior painting services'
  },
  {
    name: 'Shifting',
    backgroundColor: '#EF4444',
    icon: '/shifting.svg',
    description: 'Moving and relocation services'
  },
  {
    name: 'Plumbing',
    backgroundColor: '#3B82F6',
    icon: '/plumbing.svg',
    description: 'Professional plumbing installation and repair'
  },
  {
    name: 'Electric',
    backgroundColor: '#F97316',
    icon: '/electric.svg',
    description: 'Electrical installation and maintenance services'
  }
]

const SAMPLE_BUSINESSES = [
  {
    name: 'SparkleClean Pro',
    about: 'Professional residential and commercial cleaning services with eco-friendly products and experienced staff.',
    address: '123 Main Street, Downtown',
    contactPerson: 'Sarah Johnson',
    email: 'sarah@sparkleclean.com',
    phone: '+1-555-0101',
    categoryName: 'Cleaning',
    images: ['/cleaning-service-1.jpg'],
    rating: 4.8,
    totalReviews: 127,
    specializations: ['Deep Cleaning', 'Office Cleaning', 'Move-in/Move-out', 'Eco-Friendly Cleaning', 'Post-Construction Cleanup'],
    experience: '8 years',
    certifications: [
      {
        name: 'Certified Commercial Cleaner',
        issuer: 'International Cleaning Association',
        issuedDate: '2021-03-15',
        type: 'certification',
        verified: true
      },
      {
        name: 'Eco-Friendly Cleaning Specialist',
        issuer: 'Green Cleaning Institute',
        issuedDate: '2022-05-20',
        type: 'certification',
        verified: true
      },
      {
        name: 'Business License',
        issuer: 'City Business Department',
        issuedDate: '2020-01-10',
        type: 'license',
        verified: true
      }
    ],
    portfolio: [
      {
        title: 'Corporate Office Deep Clean',
        description: 'Complete deep cleaning of 50,000 sq ft office building including carpet cleaning and window washing.',
        image: 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=600&fit=crop',
        category: 'Commercial',
        location: 'Downtown Business District',
        completedDate: '2024-01-15',
        duration: '3 days',
        tags: ['Office Cleaning', 'Deep Clean', 'Carpet Cleaning', 'Window Washing']
      },
      {
        title: 'Luxury Home Move-out Cleaning',
        description: 'Complete move-out cleaning for a 4-bedroom luxury home with detailed attention to all areas.',
        image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop',
        category: 'Residential',
        location: 'Suburban Area',
        completedDate: '2024-02-10',
        duration: '1 day',
        tags: ['Move-out Cleaning', 'Luxury Home', 'Deep Clean']
      }
    ]
  },
  {
    name: 'FixIt Masters',
    about: 'Expert repair services for appliances, furniture, and home fixtures with 24/7 emergency support.',
    address: '456 Oak Avenue, City Center',
    contactPerson: 'Mike Wilson',
    email: 'mike@fixitmasters.com',
    phone: '+1-555-0102',
    categoryName: 'Repair',
    images: ['/repair-service-1.jpg'],
    rating: 4.6,
    totalReviews: 89,
    specializations: ['Appliance Repair', 'Furniture Repair', 'Emergency Repairs']
  },
  {
    name: 'ColorCraft Painting',
    about: 'Transform your space with our professional painting services using premium paints and expert techniques.',
    address: '789 Pine Road, Suburbs',
    contactPerson: 'David Chen',
    email: 'david@colorcraft.com',
    phone: '+1-555-0103',
    categoryName: 'Painting',
    images: ['/painting-service-1.jpg'],
    rating: 4.7,
    totalReviews: 156,
    specializations: ['Interior Painting', 'Exterior Painting', 'Commercial Painting']
  },
  {
    name: 'SwiftMove Solutions',
    about: 'Reliable moving and relocation services with careful handling and timely delivery nationwide.',
    address: '321 Elm Street, Industrial Area',
    contactPerson: 'Lisa Rodriguez',
    email: 'lisa@swiftmove.com',
    phone: '+1-555-0104',
    categoryName: 'Shifting',
    images: ['/moving-service-1.jpg'],
    rating: 4.5,
    totalReviews: 203,
    specializations: ['Local Moving', 'Long Distance', 'Office Relocation']
  },
  {
    name: 'AquaFlow Plumbing',
    about: 'Licensed plumbing professionals offering installation, repair, and maintenance services 24/7.',
    address: '654 Maple Drive, Residential Area',
    contactPerson: 'Tom Martinez',
    email: 'tom@aquaflow.com',
    phone: '+1-555-0105',
    categoryName: 'Plumbing',
    images: ['/plumbing-service-1.jpg'],
    rating: 4.9,
    totalReviews: 178,
    specializations: ['Emergency Plumbing', 'Pipe Installation', 'Drain Cleaning']
  },
  {
    name: 'PowerGrid Electric',
    about: 'Certified electricians providing safe and reliable electrical services for residential and commercial properties.',
    address: '987 Cedar Lane, Tech District',
    contactPerson: 'Alex Thompson',
    email: 'alex@powergrid.com',
    phone: '+1-555-0106',
    categoryName: 'Electric',
    images: ['/electric-service-1.jpg'],
    rating: 4.7,
    totalReviews: 145,
    specializations: ['Wiring Installation', 'Panel Upgrades', 'Smart Home Setup', 'Solar Installation', 'Emergency Electrical'],
    experience: '12 years',
    certifications: [
      {
        name: 'Licensed Electrician',
        issuer: 'State Electrical Board',
        issuedDate: '2018-06-15',
        expiryDate: '2026-06-15',
        type: 'license',
        verified: true,
        credentialId: 'EL-2018-4578'
      },
      {
        name: 'Smart Home Specialist',
        issuer: 'Home Automation Institute',
        issuedDate: '2022-09-10',
        type: 'certification',
        verified: true
      },
      {
        name: 'Solar Installation Certified',
        issuer: 'Solar Energy Association',
        issuedDate: '2023-02-05',
        type: 'certification',
        verified: true
      },
      {
        name: 'General Liability Insurance',
        issuer: 'SafeWork Insurance',
        issuedDate: '2024-01-01',
        expiryDate: '2025-01-01',
        type: 'insurance',
        verified: true
      }
    ],
    portfolio: [
      {
        title: 'Smart Home Automation System',
        description: 'Complete smart home setup including automated lighting, security system, and climate control for a modern 3-bedroom home.',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=600&fit=crop',
        category: 'Smart Home',
        location: 'Tech District',
        completedDate: '2024-01-20',
        duration: '2 weeks',
        client: 'Johnson Family',
        tags: ['Smart Lighting', 'Security System', 'Climate Control', 'Home Automation'],
        additionalImages: [
          'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=400&h=300&fit=crop',
          'https://images.unsplash.com/photo-1556909114-79ad0bf93b23?w=400&h=300&fit=crop'
        ]
      },
      {
        title: 'Commercial Electrical Panel Upgrade',
        description: 'Upgraded electrical panels for a 20,000 sq ft warehouse to handle increased power demands.',
        image: 'https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=800&h=600&fit=crop',
        category: 'Commercial',
        location: 'Industrial Area',
        completedDate: '2023-12-15',
        duration: '1 week',
        tags: ['Panel Upgrade', 'Commercial', 'High Voltage', 'Industrial']
      },
      {
        title: 'Emergency Electrical Repair',
        description: 'Emergency repair of electrical system after storm damage, restoring power to residential complex.',
        image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800&h=600&fit=crop',
        category: 'Emergency',
        location: 'Residential Complex',
        completedDate: '2024-02-28',
        duration: '24 hours',
        tags: ['Emergency Repair', 'Storm Damage', 'Power Restoration']
      }
    ]
  }
]

export async function GET() {
  try {
    // Get existing data counts
    const existingCategories = await Category.getAll()
    const existingBusinesses = await BusinessList.getAll()

    return NextResponse.json({
      success: true,
      message: 'Database status',
      data: {
        existingCategories: existingCategories.length,
        existingBusinesses: existingBusinesses.length,
        categories: existingCategories.map(cat => ({
          id: cat._id.toString(),
          name: cat.name
        }))
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check database status',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST() {
  try {
    const results = {
      categories: [],
      businesses: [],
      errors: []
    }

    console.log('🚀 Starting MongoDB population...')

    // 1. Create Categories
    console.log('📂 Creating categories...')
    const categoryMap = {}

    for (const categoryData of SAMPLE_CATEGORIES) {
      try {
        // Check if category already exists
        const existingCategory = await Category.findByName(categoryData.name)
        if (existingCategory) {
          console.log(`⚠️ Category ${categoryData.name} already exists`)
          categoryMap[categoryData.name] = existingCategory._id.toString()
          results.categories.push({
            name: categoryData.name,
            status: 'exists',
            id: existingCategory._id.toString()
          })
          continue
        }

        const result = await Category.create(categoryData)
        categoryMap[categoryData.name] = result.categoryId.toString()
        results.categories.push({
          name: categoryData.name,
          status: 'created',
          id: result.categoryId.toString()
        })
        console.log(`✅ Created category: ${categoryData.name}`)
      } catch (error) {
        results.errors.push({
          type: 'category',
          name: categoryData.name,
          error: error.message
        })
        console.error(`❌ Failed to create category ${categoryData.name}:`, error.message)
      }
    }

    // 2. Create Businesses
    console.log('🏢 Creating businesses...')
    for (const businessData of SAMPLE_BUSINESSES) {
      try {
        const categoryId = categoryMap[businessData.categoryName]
        if (!categoryId) {
          throw new Error(`Category ${businessData.categoryName} not found`)
        }

        // Check if business already exists
        const existingBusiness = await BusinessList.findByEmail ? 
          await BusinessList.findByEmail(businessData.email) : 
          null

        if (existingBusiness) {
          console.log(`⚠️ Business ${businessData.name} already exists`)
          results.businesses.push({
            name: businessData.name,
            status: 'exists',
            id: existingBusiness._id.toString()
          })
          continue
        }

        const { categoryName, ...businessCreateData } = businessData
        const result = await BusinessList.create({
          ...businessCreateData,
          categoryId: categoryId
        })

        results.businesses.push({
          name: businessData.name,
          status: 'created',
          id: result.businessId.toString()
        })
        console.log(`✅ Created business: ${businessData.name}`)
      } catch (error) {
        results.errors.push({
          type: 'business',
          name: businessData.name,
          error: error.message
        })
        console.error(`❌ Failed to create business ${businessData.name}:`, error.message)
      }
    }

    const summary = {
      categoriesCreated: results.categories.filter(c => c.status === 'created').length,
      categoriesExisted: results.categories.filter(c => c.status === 'exists').length,
      businessesCreated: results.businesses.filter(b => b.status === 'created').length,
      businessesExisted: results.businesses.filter(b => b.status === 'exists').length,
      totalErrors: results.errors.length
    }

    console.log('📊 Population Summary:', summary)

    return NextResponse.json({
      success: true,
      message: 'MongoDB population completed',
      summary,
      results
    })

  } catch (error) {
    console.error('💥 Population failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to populate MongoDB',
      details: error.message
    }, { status: 500 })
  }
} 