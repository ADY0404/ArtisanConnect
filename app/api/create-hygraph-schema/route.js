import { NextResponse } from 'next/server'
import { gql, request } from 'graphql-request'

// Helper to check existing schema
const checkExistingSchema = async () => {
  try {
    const CONTENT_URL = `https://eu-west-2.cdn.hygraph.com/content/${process.env.NEXT_PUBLIC_MASTER_URL_KEY}/master`
    
    const introspectionQuery = gql`
      query {
        __schema {
          queryType {
            fields {
              name
              type {
                name
              }
            }
          }
        }
      }
    `
    
    const result = await request(CONTENT_URL, introspectionQuery)
    const fields = result.__schema.queryType.fields.map(f => f.name)
    
    return {
      hasCategories: fields.includes('categories'),
      hasBusinessLists: fields.includes('businessLists'), 
      hasBookings: fields.includes('bookings'),
      hasReviews: fields.includes('reviews'),
      allFields: fields
    }
  } catch (error) {
    console.error('Schema check failed:', error)
    return {
      hasCategories: false,
      hasBusinessLists: false,
      hasBookings: false,
      hasReviews: false,
      allFields: []
    }
  }
}

export async function POST() {
  try {
    console.log('🚀 Starting smart Hygraph schema creation...')
    
    const MANAGEMENT_TOKEN = process.env.HYGRAPH_MANAGEMENT_TOKEN
    const CONTENT_API_URL = `https://eu-west-2.cdn.hygraph.com/content/${process.env.NEXT_PUBLIC_MASTER_URL_KEY}/master`

    if (!MANAGEMENT_TOKEN) {
      return NextResponse.json({ 
        error: 'HYGRAPH_MANAGEMENT_TOKEN not found in environment variables' 
      }, { status: 500 })
    }

    // Check existing schema first
    console.log('🔍 Checking existing schema...')
    const existingSchema = await checkExistingSchema()
    console.log('📊 Schema status:', existingSchema)

    // Import the Management SDK
    const { Client } = await import('@hygraph/management-sdk')
    
    const client = new Client({
      endpoint: CONTENT_API_URL,
      authToken: MANAGEMENT_TOKEN,
      name: `schema-fix-${Date.now()}`
    })

    console.log('✅ Client instance created')

    const modelsToCreate = []
    const fieldsToCreate = []

    // 1. CATEGORY MODEL (skip if exists)
    if (!existingSchema.hasCategories) {
      console.log('📝 Adding Category model to creation queue...')
      modelsToCreate.push('Category')
      
      client.createModel({
        apiId: 'Category',
        apiIdPlural: 'Categories', 
        displayName: 'Category',
        description: 'Service categories for the home service marketplace'
      })

      client.createSimpleField({
        apiId: 'name',
        displayName: 'Name',
        type: 'STRING',
        isRequired: true,
        isTitle: true,
        isUnique: true,
        modelApiId: 'Category'
      })

      client.createSimpleField({
        apiId: 'icon',
        displayName: 'Icon',
        type: 'STRING',
        description: 'Icon URL or identifier for the category',
        isRequired: true,
        modelApiId: 'Category'
      })

      client.createSimpleField({
        apiId: 'bgcolor',
        displayName: 'Background Color',
        type: 'STRING',
        description: 'Background color for the category card (e.g., #f3f4f6)',
        modelApiId: 'Category'
      })

      fieldsToCreate.push('Category: name, icon, bgcolor')
    } else {
      console.log('⏭️ Category model already exists, skipping...')
    }

    // 2. BUSINESSLIST MODEL
    if (!existingSchema.hasBusinessLists) {
      console.log('📝 Adding BusinessList model to creation queue...')
      modelsToCreate.push('BusinessList')
      
      client.createModel({
        apiId: 'BusinessList',
        apiIdPlural: 'BusinessLists',
        displayName: 'Business List',
        description: 'Service provider businesses'
      })

      client.createSimpleField({
        apiId: 'name',
        displayName: 'Business Name',
        type: 'STRING',
        isRequired: true,
        isTitle: true,
        modelApiId: 'BusinessList'
      })

      client.createSimpleField({
        apiId: 'about',
        displayName: 'About',
        type: 'RICHTEXT',
        description: 'Description of the business and services',
        isRequired: true,
        modelApiId: 'BusinessList'
      })

      client.createSimpleField({
        apiId: 'address',
        displayName: 'Address',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'BusinessList'
      })

      client.createSimpleField({
        apiId: 'contactPerson',
        displayName: 'Contact Person',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'BusinessList'
      })

      client.createSimpleField({
        apiId: 'email',
        displayName: 'Email',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'BusinessList'
      })

      client.createSimpleField({
        apiId: 'images',
        displayName: 'Images',
        type: 'STRING',
        isList: true,
        description: 'Business image URLs',
        modelApiId: 'BusinessList'
      })

      // Category relation (only if Category exists)
      if (existingSchema.hasCategories || modelsToCreate.includes('Category')) {
        client.createRelationalField({
          apiId: 'category',
          displayName: 'Category',
          type: 'RELATION',
          modelApiId: 'BusinessList',
          isRequired: true,
          reverseField: {
            apiId: 'businessLists',
            displayName: 'Business Lists',
            modelApiId: 'Category',
            isList: true
          }
        })
      }

      fieldsToCreate.push('BusinessList: name, about, address, contactPerson, email, images, category')
    } else {
      console.log('⏭️ BusinessList model already exists, skipping...')
    }

    // 3. BOOKING MODEL
    if (!existingSchema.hasBookings) {
      console.log('📝 Adding Booking model to creation queue...')
      modelsToCreate.push('Booking')
      
      client.createModel({
        apiId: 'Booking',
        apiIdPlural: 'Bookings',
        displayName: 'Booking',
        description: 'Service bookings made by customers'
      })

      client.createSimpleField({
        apiId: 'date',
        displayName: 'Date',
        type: 'STRING',
        isRequired: true,
        description: 'Booking date in DD-MMM-yyyy format',
        modelApiId: 'Booking'
      })

      client.createSimpleField({
        apiId: 'time',
        displayName: 'Time',
        type: 'STRING',
        isRequired: true,
        description: 'Booking time slot (e.g., 10:00 AM)',
        modelApiId: 'Booking'
      })

      client.createSimpleField({
        apiId: 'userEmail',
        displayName: 'User Email',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'Booking'
      })

      client.createSimpleField({
        apiId: 'userName',
        displayName: 'User Name',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'Booking'
      })

      // BookingStatus enumeration
      client.createEnumeration({
        apiId: 'BookingStatus',
        displayName: 'Booking Status',
        description: 'Status of the booking',
        values: [
          { apiId: 'Booked', displayName: 'Booked' },
          { apiId: 'Confirmed', displayName: 'Confirmed' },
          { apiId: 'Completed', displayName: 'Completed' },
          { apiId: 'Cancelled', displayName: 'Cancelled' }
        ]
      })

      client.createSimpleField({
        apiId: 'bookingStatus',
        displayName: 'Booking Status',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'Booking',
        description: 'Booking status: Booked, Confirmed, Completed, or Cancelled'
      })

      // BusinessList relation (only if BusinessList exists or will be created)
      if (existingSchema.hasBusinessLists || modelsToCreate.includes('BusinessList')) {
        client.createRelationalField({
          apiId: 'businessList',
          displayName: 'Business',
          type: 'RELATION',
          modelApiId: 'Booking',
          isRequired: true,
          reverseField: {
            apiId: 'bookings',
            displayName: 'Bookings',
            modelApiId: 'BusinessList',
            isList: true
          }
        })
      }

      fieldsToCreate.push('Booking: date, time, userEmail, userName, bookingStatus, businessList')
    } else {
      console.log('⏭️ Booking model already exists, skipping...')
    }

    // 4. REVIEW MODEL
    if (!existingSchema.hasReviews) {
      console.log('📝 Adding Review model to creation queue...')
      modelsToCreate.push('Review')
      
      client.createModel({
        apiId: 'Review',
        apiIdPlural: 'Reviews',
        displayName: 'Review',
        description: 'Customer reviews for businesses'
      })

      client.createSimpleField({
        apiId: 'rating',
        displayName: 'Rating',
        type: 'INT',
        isRequired: true,
        description: 'Rating from 1 to 5',
        modelApiId: 'Review'
      })

      client.createSimpleField({
        apiId: 'comment',
        displayName: 'Comment',
        type: 'RICHTEXT',
        description: 'Review comment',
        modelApiId: 'Review'
      })

      client.createSimpleField({
        apiId: 'userName',
        displayName: 'User Name',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'Review'
      })

      client.createSimpleField({
        apiId: 'userEmail',
        displayName: 'User Email',
        type: 'STRING',
        isRequired: true,
        modelApiId: 'Review'
      })

      // BusinessList relation
      if (existingSchema.hasBusinessLists || modelsToCreate.includes('BusinessList')) {
        client.createRelationalField({
          apiId: 'businessList',
          displayName: 'Business',
          type: 'RELATION',
          modelApiId: 'Review',
          isRequired: true,
          reverseField: {
            apiId: 'reviews',
            displayName: 'Reviews',
            modelApiId: 'BusinessList',
            isList: true
          }
        })
      }

      fieldsToCreate.push('Review: rating, comment, userName, userEmail, businessList')
    } else {
      console.log('⏭️ Review model already exists, skipping...')
    }

    // Check if anything needs to be created
    if (modelsToCreate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All schemas already exist! No changes needed.',
        existingSchema: existingSchema,
        action: 'no_changes_required'
      })
    }

    // Run dry run for new models only
    console.log('🧪 Testing creation of new models with dry run...')
    console.log('📋 Models to create:', modelsToCreate)
    
    const dryRunResult = await client.dryRun()
    console.log('Dry run operations:', dryRunResult.length)

    // Run the migration
    console.log('🚀 Running migration for missing models...')
    const result = await client.run(true)

    if (result.errors && result.errors.length > 0) {
      console.error('❌ Migration errors:', result.errors)
      return NextResponse.json({
        success: false,
        error: 'Migration failed',
        details: result.errors,
        modelsAttempted: modelsToCreate
      }, { status: 500 })
    }

    console.log('🎉 Schema creation completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${modelsToCreate.length} missing schemas!`,
      migrationName: result.name,
      migrationId: result.id,
      finishedAt: result.finishedAt,
      existingSchema: existingSchema,
      modelsCreated: modelsToCreate,
      fieldsCreated: fieldsToCreate,
      nextSteps: [
        'Schema creation complete ✅',
        'Now populate with sample data',
        'Test your application'
      ]
    })

  } catch (error) {
    console.error('❌ Schema creation failed:', error)
    return NextResponse.json({
      error: 'Schema creation failed',
      message: error.message,
      stack: error.stack
    }, { status: 500 })
  }
} 