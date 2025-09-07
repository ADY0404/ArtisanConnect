const { connectDB } = require('./db-connection')
const TinRegistry = require('../models/TinRegistry')
const GhanaCardRegistry = require('../models/GhanaCardRegistry')

// Test functions for verification system
const testTinRegistry = async () => {
  console.log('\n🧪 Testing TIN Registry...')
  
  try {
    // Test TIN format validation
    console.log('\n📋 Testing TIN format validation:')
    const validTin = 'TIN-2024-000001'
    const invalidTin = 'INVALID-TIN'
    
    const validResult = TinRegistry.validateTinFormat(validTin)
    const invalidResult = TinRegistry.validateTinFormat(invalidTin)
    
    console.log(`   ✅ Valid TIN (${validTin}):`, validResult.isValid ? 'PASS' : 'FAIL')
    console.log(`   ❌ Invalid TIN (${invalidTin}):`, !invalidResult.isValid ? 'PASS' : 'FAIL')
    
    // Test database queries
    console.log('\n🔍 Testing database queries:')
    const totalTins = await TinRegistry.countDocuments()
    const activeTins = await TinRegistry.countDocuments({ 'registrationInfo.isActive': true })
    
    console.log(`   - Total TIN records: ${totalTins}`)
    console.log(`   - Active TIN records: ${activeTins}`)
    
    // Test finding specific TIN
    console.log('\n🎯 Testing TIN lookup:')
    const testTin = await TinRegistry.findOne().limit(1)
    if (testTin) {
      const foundTin = await TinRegistry.findActiveTin(testTin.tinNumber)
      console.log(`   - Test TIN lookup (${testTin.tinNumber}):`, foundTin ? 'FOUND' : 'NOT FOUND')
      
      if (foundTin) {
        const businessData = foundTin.getBusinessData()
        console.log(`   - Business data extraction:`, Object.keys(businessData).length > 0 ? 'SUCCESS' : 'FAILED')
      }
    }
    
    // Test business categories
    console.log('\n📊 Testing business categories:')
    const categories = await TinRegistry.distinct('businessCategory.primary')
    console.log(`   - Categories found: ${categories.join(', ')}`)
    
    // Test regions
    console.log('\n🌍 Testing regions:')
    const regions = await TinRegistry.distinct('businessAddress.region')
    console.log(`   - Regions found: ${regions.join(', ')}`)
    
    console.log('\n✅ TIN Registry tests completed')
    
  } catch (error) {
    console.error('❌ TIN Registry test failed:', error)
    throw error
  }
}

const testGhanaCardRegistry = async () => {
  console.log('\n🧪 Testing Ghana Card Registry...')
  
  try {
    // Test Ghana Card format validation
    console.log('\n📋 Testing Ghana Card format validation:')
    const validCard = 'GHA-123456789-1'
    const invalidCard = 'INVALID-CARD'
    
    const validResult = GhanaCardRegistry.validateCardNumber(validCard)
    const invalidResult = GhanaCardRegistry.validateCardNumber(invalidCard)
    
    console.log(`   ✅ Valid Card (${validCard}):`, validResult.isValid ? 'PASS' : `FAIL - ${validResult.error}`)
    console.log(`   ❌ Invalid Card (${invalidCard}):`, !invalidResult.isValid ? 'PASS' : 'FAIL')
    
    // Test check digit calculation
    console.log('\n🔢 Testing check digit calculation:')
    const testNumber = '123456789'
    const checkDigit = GhanaCardRegistry.calculateCheckDigit(testNumber)
    console.log(`   - Check digit for ${testNumber}: ${checkDigit}`)
    
    // Test database queries
    console.log('\n🔍 Testing database queries:')
    const totalCards = await GhanaCardRegistry.countDocuments()
    const activeCards = await GhanaCardRegistry.countDocuments({ 'identificationInfo.cardStatus': 'ACTIVE' })
    
    console.log(`   - Total Ghana Card records: ${totalCards}`)
    console.log(`   - Active Ghana Card records: ${activeCards}`)
    
    // Test finding specific card
    console.log('\n🎯 Testing Ghana Card lookup:')
    const testCard = await GhanaCardRegistry.findOne().limit(1)
    if (testCard) {
      const foundCard = await GhanaCardRegistry.findActiveCard(testCard.cardNumber)
      console.log(`   - Test card lookup (${testCard.cardNumber}):`, foundCard ? 'FOUND' : 'NOT FOUND')
      
      if (foundCard) {
        const cardData = foundCard.getCardData()
        console.log(`   - Card data extraction:`, Object.keys(cardData).length > 0 ? 'SUCCESS' : 'FAILED')
        
        // Test card status methods
        console.log(`   - Is card active:`, foundCard.isActive() ? 'YES' : 'NO')
        console.log(`   - Is card expired:`, foundCard.isExpired() ? 'YES' : 'NO')
      }
    }
    
    // Test gender distribution
    console.log('\n👥 Testing gender distribution:')
    const maleCount = await GhanaCardRegistry.countDocuments({ 'personalInfo.gender': 'MALE' })
    const femaleCount = await GhanaCardRegistry.countDocuments({ 'personalInfo.gender': 'FEMALE' })
    console.log(`   - Male: ${maleCount}, Female: ${femaleCount}`)
    
    console.log('\n✅ Ghana Card Registry tests completed')
    
  } catch (error) {
    console.error('❌ Ghana Card Registry test failed:', error)
    throw error
  }
}

const testCrossReference = async () => {
  console.log('\n🧪 Testing Cross-Reference Functionality...')
  
  try {
    // Find a TIN record
    const tinRecord = await TinRegistry.findOne({ 'registrationInfo.isActive': true })
    if (!tinRecord) {
      console.log('   ⚠️ No active TIN records found for cross-reference test')
      return
    }
    
    console.log(`\n🔗 Testing cross-reference with TIN: ${tinRecord.tinNumber}`)
    
    // Find corresponding Ghana Card
    const ghanaCardNumber = tinRecord.ownerInfo.ghanaCardNumber
    const cardRecord = await GhanaCardRegistry.findActiveCard(ghanaCardNumber)
    
    if (cardRecord) {
      console.log(`   ✅ Found matching Ghana Card: ${cardRecord.cardNumber}`)
      
      // Verify data consistency
      const tinBusinessData = tinRecord.getBusinessData()
      const cardData = cardRecord.getCardData()
      
      console.log('\n📊 Data consistency check:')
      console.log(`   - Name match: ${tinBusinessData.ownerName === cardData.fullName ? 'MATCH' : 'MISMATCH'}`)
      console.log(`   - Phone match: ${tinBusinessData.phone === cardData.phoneNumber ? 'MATCH' : 'MISMATCH'}`)
      console.log(`   - Region match: ${tinBusinessData.address.region === cardData.address.region ? 'MATCH' : 'MISMATCH'}`)
      
    } else {
      console.log(`   ❌ No matching Ghana Card found for: ${ghanaCardNumber}`)
    }
    
    console.log('\n✅ Cross-reference tests completed')
    
  } catch (error) {
    console.error('❌ Cross-reference test failed:', error)
    throw error
  }
}

const testDataIntegrity = async () => {
  console.log('\n🧪 Testing Data Integrity...')
  
  try {
    // Test for duplicate TIN numbers
    console.log('\n🔍 Checking for duplicate TIN numbers:')
    const tinDuplicates = await TinRegistry.aggregate([
      { $group: { _id: '$tinNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])
    console.log(`   - Duplicate TIN numbers found: ${tinDuplicates.length}`)
    
    // Test for duplicate Ghana Card numbers
    console.log('\n🔍 Checking for duplicate Ghana Card numbers:')
    const cardDuplicates = await GhanaCardRegistry.aggregate([
      { $group: { _id: '$cardNumber', count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } }
    ])
    console.log(`   - Duplicate Ghana Card numbers found: ${cardDuplicates.length}`)
    
    // Test for orphaned Ghana Cards (cards without corresponding TIN)
    console.log('\n🔍 Checking for orphaned Ghana Cards:')
    const allTinGhanaCards = await TinRegistry.distinct('ownerInfo.ghanaCardNumber')
    const allGhanaCards = await GhanaCardRegistry.distinct('cardNumber')
    const orphanedCards = allGhanaCards.filter(card => !allTinGhanaCards.includes(card))
    console.log(`   - Orphaned Ghana Cards found: ${orphanedCards.length}`)
    
    // Test for missing Ghana Cards (TINs without corresponding cards)
    console.log('\n🔍 Checking for missing Ghana Cards:')
    const missingCards = allTinGhanaCards.filter(card => !allGhanaCards.includes(card))
    console.log(`   - Missing Ghana Cards found: ${missingCards.length}`)
    
    // Test date consistency
    console.log('\n📅 Checking date consistency:')
    const allCards = await GhanaCardRegistry.find({}).select('identificationInfo.cardIssuedDate identificationInfo.cardExpiryDate')
    let invalidDates = 0
    allCards.forEach(card => {
      if (card.identificationInfo.cardExpiryDate < card.identificationInfo.cardIssuedDate) {
        invalidDates++
      }
    })
    console.log(`   - Invalid date records found: ${invalidDates}`)
    
    console.log('\n✅ Data integrity tests completed')
    
  } catch (error) {
    console.error('❌ Data integrity test failed:', error)
    throw error
  }
}

const testPerformance = async () => {
  console.log('\n🧪 Testing Performance...')
  
  try {
    // Test TIN lookup performance
    console.log('\n⚡ Testing TIN lookup performance:')
    const testTin = await TinRegistry.findOne().limit(1)
    if (testTin) {
      const startTime = Date.now()
      await TinRegistry.findActiveTin(testTin.tinNumber)
      const endTime = Date.now()
      console.log(`   - TIN lookup time: ${endTime - startTime}ms`)
    }
    
    // Test Ghana Card lookup performance
    console.log('\n⚡ Testing Ghana Card lookup performance:')
    const testCard = await GhanaCardRegistry.findOne().limit(1)
    if (testCard) {
      const startTime = Date.now()
      await GhanaCardRegistry.findActiveCard(testCard.cardNumber)
      const endTime = Date.now()
      console.log(`   - Ghana Card lookup time: ${endTime - startTime}ms`)
    }
    
    // Test bulk query performance
    console.log('\n⚡ Testing bulk query performance:')
    const bulkStartTime = Date.now()
    await TinRegistry.find({ 'registrationInfo.isActive': true }).limit(10)
    const bulkEndTime = Date.now()
    console.log(`   - Bulk query time (10 records): ${bulkEndTime - bulkStartTime}ms`)
    
    console.log('\n✅ Performance tests completed')
    
  } catch (error) {
    console.error('❌ Performance test failed:', error)
    throw error
  }
}

// Main test function
const runAllTests = async () => {
  try {
    console.log('🚀 Starting Verification Database Tests...')
    console.log('=' .repeat(50))
    
    // Connect to database
    await connectDB()
    console.log('✅ Database connected successfully')
    
    // Run all tests
    await testTinRegistry()
    await testGhanaCardRegistry()
    await testCrossReference()
    await testDataIntegrity()
    await testPerformance()
    
    console.log('\n' + '=' .repeat(50))
    console.log('🎉 All verification database tests completed successfully!')
    
  } catch (error) {
    console.error('\n💥 Test suite failed:', error)
    process.exit(1)
  }
}

// Run tests if called directly
if (require.main === module) {
  runAllTests()
    .then(() => {
      console.log('🏁 Test process completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Test process failed:', error)
      process.exit(1)
    })
}

module.exports = { 
  runAllTests, 
  testTinRegistry, 
  testGhanaCardRegistry, 
  testCrossReference, 
  testDataIntegrity, 
  testPerformance 
}
