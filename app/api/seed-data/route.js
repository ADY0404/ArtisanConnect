import { NextResponse } from 'next/server'
import { ensureConnection } from '@/lib/mongodb'
import Category from '@/models/Category'
import BusinessList from '@/models/BusinessList'

export async function POST() {
  try {
    await ensureConnection()
    
    // Sample categories
    const categoriesData = [
      {
        name: 'Cleaning',
        backgroundColor: '#3B82F6',
        icon: '/cleaning.png'
      },
      {
        name: 'Repair',
        backgroundColor: '#EF4444',
        icon: '/repair.png'
      },
      {
        name: 'Painting',
        backgroundColor: '#10B981',
        icon: '/painting.png'
      },
      {
        name: 'Shifting',
        backgroundColor: '#F59E0B',
        icon: '/shifting.png'
      },
      {
        name: 'Plumbing',
        backgroundColor: '#8B5CF6',
        icon: '/plumbing.png'
      },
      {
        name: 'Electric',
        backgroundColor: '#F97316',
        icon: '/electric.png'
      }
    ]

    // Clear existing data and insert new categories
    console.log('🗑️ Clearing existing categories...')
    await Category.deleteMany({})
    
    console.log('📝 Creating categories...')
    const createdCategories = await Category.insertMany(categoriesData)
    console.log(`✅ Created ${createdCategories.length} categories`)

    // Sample businesses for each category
    const businessesData = []
    
    for (const category of createdCategories) {
      // Create 2-3 businesses per category
      const businessCount = 2 + Math.floor(Math.random() * 2) // 2-3 businesses
      
      for (let i = 0; i < businessCount; i++) {
        businessesData.push({
          name: `${category.name} Pro ${i + 1}`,
          about: `Professional ${category.name.toLowerCase()} services with 5+ years of experience. We provide quality work at competitive prices.`,
          address: `${100 + i} Main Street, City Center, State 12345`,
          contactPerson: `${category.name} Expert ${i + 1}`,
          email: `${category.name.toLowerCase()}${i + 1}@example.com`,
          phone: `+1-555-${category.name.substring(0, 3).toUpperCase()}-${1000 + i}`,
          images: [
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
          ],
          categoryId: category._id,
          specializations: [`Expert ${category.name}`, 'Emergency Services', '24/7 Support'],
          certifications: ['Licensed Professional', 'Insured', 'Background Checked'],
          experience: `${5 + i} years of professional experience`,
          portfolio: [
            'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=300&h=200&fit=crop',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop'
          ],
          rating: 4.0 + (Math.random() * 1), // 4.0 to 5.0 rating
          totalReviews: Math.floor(Math.random() * 50) + 10, // 10-60 reviews
          providerEmail: `provider${category.name.toLowerCase()}${i + 1}@example.com`,
          createdBy: `provider${category.name.toLowerCase()}${i + 1}@example.com`,
          isActive: true
        })
      }
    }

    // Clear existing businesses and insert new ones
    console.log('🗑️ Clearing existing businesses...')
    await BusinessList.deleteMany({})
    
    console.log('🏢 Creating businesses...')
    const createdBusinesses = await BusinessList.insertMany(businessesData)
    console.log(`✅ Created ${createdBusinesses.length} businesses`)

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        categoriesCreated: createdCategories.length,
        businessesCreated: createdBusinesses.length
      }
    })
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 })
  }
} 