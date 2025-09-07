import { NextResponse } from 'next/server'
import { connectToDatabase } from '@/lib/mongodb'

export async function GET() {
  try {
    console.log('🔍 Testing new database schemas...')
    
    // Connect to database
    const { db } = await connectToDatabase()
    console.log('✅ Database connected')
    
    // List all collections
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map(c => c.name)
    
    console.log('📋 Available collections:', collectionNames)
    
    // Check for our new collections
    const expectedCollections = ['work_sessions', 'work_updates', 'quotes']
    const results = {
      existingCollections: collectionNames,
      newSchemas: {},
      tests: {}
    }
    
    // Test each new collection
    for (const collectionName of expectedCollections) {
      try {
        const collection = db.collection(collectionName)
        
        // Check if collection exists by trying to get stats
        const stats = await collection.stats().catch(() => null)
        
        if (stats) {
          results.newSchemas[collectionName] = {
            exists: true,
            documentCount: stats.count || 0,
            size: stats.size || 0
          }
        } else {
          results.newSchemas[collectionName] = {
            exists: false,
            documentCount: 0,
            size: 0
          }
        }
        
        // Test basic operations
        const testDoc = {
          test: true,
          createdAt: new Date(),
          collectionType: collectionName
        }
        
        // Insert test document
        const insertResult = await collection.insertOne(testDoc)
        
        // Find the document
        const foundDoc = await collection.findOne({ _id: insertResult.insertedId })
        
        // Delete the test document
        await collection.deleteOne({ _id: insertResult.insertedId })
        
        results.tests[collectionName] = {
          insert: !!insertResult.insertedId,
          find: !!foundDoc,
          delete: true,
          status: 'success'
        }
        
        console.log(`✅ ${collectionName} - tests passed`)
        
      } catch (error) {
        results.tests[collectionName] = {
          insert: false,
          find: false,
          delete: false,
          status: 'failed',
          error: error.message
        }
        console.error(`❌ ${collectionName} - tests failed:`, error.message)
      }
    }
    
    // Test specific schema operations
    console.log('🧪 Testing specific schema operations...')
    
    // Test work session schema
    try {
      const workSessionsCollection = db.collection('work_sessions')
      const testWorkSession = {
        bookingId: 'test-booking-' + Date.now(),
        providerId: 'test-provider-' + Date.now(),
        startTime: new Date(),
        status: 'in_progress',
        workNotes: 'Test work session for schema validation',
        photos: [
          {
            type: 'before',
            url: 'https://example.com/before.jpg',
            caption: 'Before photo',
            uploadedAt: new Date()
          }
        ],
        materials: [
          {
            name: 'Test Material',
            quantity: 2,
            cost: 25.50,
            notes: 'Test material for schema validation'
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const workSessionResult = await workSessionsCollection.insertOne(testWorkSession)
      const foundWorkSession = await workSessionsCollection.findOne({ _id: workSessionResult.insertedId })
      await workSessionsCollection.deleteOne({ _id: workSessionResult.insertedId })
      
      results.tests.work_sessions_schema = {
        success: true,
        hasPhotos: foundWorkSession.photos && foundWorkSession.photos.length > 0,
        hasMaterials: foundWorkSession.materials && foundWorkSession.materials.length > 0,
        hasCorrectFields: !!(foundWorkSession.bookingId && foundWorkSession.providerId && foundWorkSession.status)
      }
      
    } catch (error) {
      results.tests.work_sessions_schema = {
        success: false,
        error: error.message
      }
    }
    
    // Test quotes schema
    try {
      const quotesCollection = db.collection('quotes')
      const testQuote = {
        providerId: 'test-provider-' + Date.now(),
        customerEmail: 'test@example.com',
        serviceType: 'Plumbing',
        description: 'Test quote for schema validation',
        items: [
          {
            description: 'Test Service Item',
            quantity: 1,
            unitPrice: 100.00,
            total: 100.00
          }
        ],
        subtotal: 100.00,
        tax: 8.00,
        total: 108.00,
        status: 'draft',
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      const quoteResult = await quotesCollection.insertOne(testQuote)
      const foundQuote = await quotesCollection.findOne({ _id: quoteResult.insertedId })
      await quotesCollection.deleteOne({ _id: quoteResult.insertedId })
      
      results.tests.quotes_schema = {
        success: true,
        hasItems: foundQuote.items && foundQuote.items.length > 0,
        hasCorrectCalculations: foundQuote.subtotal === 100.00 && foundQuote.total === 108.00,
        hasCorrectFields: !!(foundQuote.providerId && foundQuote.customerEmail && foundQuote.status)
      }
      
    } catch (error) {
      results.tests.quotes_schema = {
        success: false,
        error: error.message
      }
    }
    
    const summary = {
      totalCollections: collectionNames.length,
      newSchemasCreated: Object.keys(results.newSchemas).filter(key => results.newSchemas[key].exists).length,
      testsPassedCount: Object.keys(results.tests).filter(key => results.tests[key].success || results.tests[key].status === 'success').length,
      allTestsPassed: Object.values(results.tests).every(test => test.success || test.status === 'success')
    }
    
    console.log('🎉 Schema testing completed')
    console.log('📊 Summary:', summary)
    
    return NextResponse.json({
      success: true,
      message: 'Database schema testing completed',
      summary,
      results,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Schema testing failed:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Schema testing failed',
      details: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
} 