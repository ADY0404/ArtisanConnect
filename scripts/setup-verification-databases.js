const { connectDB } = require('./db-connection')
const TinRegistry = require('../models/TinRegistry')
const GhanaCardRegistry = require('../models/GhanaCardRegistry')

// Sample data for TIN Registry
const generateTinSampleData = () => {
  const businessTypes = ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LIMITED_COMPANY', 'NGO']
  const regions = ['Greater Accra', 'Ashanti', 'Northern', 'Western', 'Eastern', 'Central']
  const categories = ['Cleaning', 'Repair', 'Painting', 'Shifting', 'Plumbing', 'Electric']
  const cities = {
    'Greater Accra': ['Accra', 'Tema', 'Kasoa', 'Madina'],
    'Ashanti': ['Kumasi', 'Obuasi', 'Ejisu', 'Mampong'],
    'Northern': ['Tamale', 'Yendi', 'Savelugu'],
    'Western': ['Takoradi', 'Tarkwa', 'Axim'],
    'Eastern': ['Koforidua', 'Akosombo', 'Akim Oda'],
    'Central': ['Cape Coast', 'Elmina', 'Winneba']
  }

  const sampleData = []
  
  for (let i = 1; i <= 50; i++) {
    const year = 2020 + (i % 5) // Years 2020-2024
    const sequence = String(i).padStart(6, '0')
    const tinNumber = `TIN-${year}-${sequence}`
    
    const region = regions[i % regions.length]
    const cityList = cities[region]
    const city = cityList[i % cityList.length]
    const category = categories[i % categories.length]
    const businessType = businessTypes[i % businessTypes.length]
    
    // Generate Ghana Card number with valid check digit
    const mainNumber = String(100000000 + i).padStart(9, '0')
    const checkDigit = calculateCheckDigit(mainNumber)
    const ghanaCardNumber = `GHA-${mainNumber}-${checkDigit}`
    
    const issuedDate = new Date(year, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const expiryDate = new Date(year + 3, issuedDate.getMonth(), issuedDate.getDate())
    
    sampleData.push({
      tinNumber,
      businessName: generateBusinessName(category, i),
      businessType,
      registrationYear: year,
      ownerInfo: {
        fullName: generateOwnerName(i),
        ghanaCardNumber,
        phoneNumber: `+233${20 + (i % 8)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        email: `business${i}@${generateEmailDomain(i)}`
      },
      businessAddress: {
        street: generateStreetAddress(i),
        city,
        region,
        digitalAddress: generateDigitalAddress(region, i),
        coordinates: generateCoordinates(region, i)
      },
      businessCategory: {
        primary: category,
        secondary: generateSecondaryServices(category),
        description: generateBusinessDescription(category, businessType)
      },
      financialInfo: {
        expectedAnnualRevenue: (Math.floor(Math.random() * 100) + 10) * 1000, // 10k - 110k
        employeeCount: Math.floor(Math.random() * 20) + 1,
        hasPayrollTax: Math.random() > 0.3
      },
      registrationInfo: {
        issuedDate,
        expiryDate,
        isActive: Math.random() > 0.05, // 95% active
        lastUpdated: new Date(),
        issuingOffice: `GRA - ${region} Office`
      }
    })
  }
  
  return sampleData
}

// Sample data for Ghana Card Registry
const generateGhanaCardSampleData = (tinData) => {
  const genders = ['MALE', 'FEMALE']
  const regions = ['Greater Accra', 'Ashanti', 'Northern', 'Western', 'Eastern', 'Central']
  const issuingCenters = [
    'NIA - Accra Center', 'NIA - Kumasi Center', 'NIA - Tamale Center',
    'NIA - Cape Coast Center', 'NIA - Koforidua Center', 'NIA - Takoradi Center'
  ]

  const cardData = []
  
  // Create Ghana Cards for TIN registry owners
  tinData.forEach((tin, index) => {
    const names = tin.ownerInfo.fullName.split(' ')
    const firstName = names[0] || 'UNKNOWN'
    const lastName = names[names.length - 1] || 'UNKNOWN'
    const middleName = names.length > 2 ? names.slice(1, -1).join(' ') : ''
    
    const birthYear = 1960 + (index % 40) // Ages 25-65
    const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    
    const cardIssuedDate = new Date(2018 + (index % 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const cardExpiryDate = new Date(cardIssuedDate.getFullYear() + 10, cardIssuedDate.getMonth(), cardIssuedDate.getDate())
    
    cardData.push({
      cardNumber: tin.ownerInfo.ghanaCardNumber,
      personalInfo: {
        firstName: firstName.toUpperCase(),
        middleName: middleName.toUpperCase(),
        lastName: lastName.toUpperCase(),
        fullName: tin.ownerInfo.fullName.toUpperCase(),
        dateOfBirth,
        placeOfBirth: `${tin.businessAddress.city}, ${tin.businessAddress.region}`,
        nationality: 'Ghanaian',
        gender: genders[index % 2]
      },
      identificationInfo: {
        cardIssuedDate,
        cardExpiryDate,
        issuingCenter: issuingCenters[index % issuingCenters.length],
        cardStatus: Math.random() > 0.05 ? 'ACTIVE' : 'EXPIRED', // 95% active
        cardVersion: 'v2.0'
      },
      contactInfo: {
        address: {
          houseNumber: `H/No. ${Math.floor(Math.random() * 999) + 1}`,
          streetName: tin.businessAddress.street,
          area: generateArea(index),
          city: tin.businessAddress.city,
          region: tin.businessAddress.region,
          digitalAddress: tin.businessAddress.digitalAddress
        },
        phoneNumber: tin.ownerInfo.phoneNumber,
        emergencyContact: {
          name: generateEmergencyContactName(index),
          relationship: generateRelationship(index),
          phone: `+233${20 + (index % 8)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
        }
      },
      biometricInfo: {
        fingerprintHash: `FP_${Date.now()}_${index}`,
        photoHash: `PH_${Date.now()}_${index}`,
        signatureHash: `SG_${Date.now()}_${index}`,
        biometricTemplate: generateBiometricTemplate(index)
      },
      verificationFlags: {
        isVerified: true,
        lastVerificationDate: new Date(),
        verificationMethod: 'MANUAL',
        verificationNotes: 'Initial registration verification',
        verificationCount: 1
      },
      securityInfo: {
        accessHistory: [],
        flaggedForReview: false,
        reviewReason: '',
        lastSecurityCheck: new Date()
      }
    })
  })
  
  // Add additional independent Ghana Cards (people not in TIN registry)
  for (let i = 51; i <= 100; i++) {
    const mainNumber = String(100000000 + i).padStart(9, '0')
    const checkDigit = calculateCheckDigit(mainNumber)
    const ghanaCardNumber = `GHA-${mainNumber}-${checkDigit}`
    
    const firstName = generateFirstName(i)
    const lastName = generateLastName(i)
    const middleName = Math.random() > 0.5 ? generateMiddleName(i) : ''
    const fullName = [firstName, middleName, lastName].filter(n => n).join(' ').toUpperCase()
    
    const birthYear = 1950 + (i % 50) // Ages 25-75
    const dateOfBirth = new Date(birthYear, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    
    const cardIssuedDate = new Date(2018 + (i % 6), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
    const cardExpiryDate = new Date(cardIssuedDate.getFullYear() + 10, cardIssuedDate.getMonth(), cardIssuedDate.getDate())
    
    const region = regions[i % regions.length]
    
    cardData.push({
      cardNumber: ghanaCardNumber,
      personalInfo: {
        firstName: firstName.toUpperCase(),
        middleName: middleName.toUpperCase(),
        lastName: lastName.toUpperCase(),
        fullName,
        dateOfBirth,
        placeOfBirth: `${generateCityForRegion(region)}, ${region}`,
        nationality: 'Ghanaian',
        gender: genders[i % 2]
      },
      identificationInfo: {
        cardIssuedDate,
        cardExpiryDate,
        issuingCenter: issuingCenters[i % issuingCenters.length],
        cardStatus: Math.random() > 0.05 ? 'ACTIVE' : 'EXPIRED',
        cardVersion: 'v2.0'
      },
      contactInfo: {
        address: {
          houseNumber: `H/No. ${Math.floor(Math.random() * 999) + 1}`,
          streetName: generateStreetAddress(i),
          area: generateArea(i),
          city: generateCityForRegion(region),
          region,
          digitalAddress: generateDigitalAddress(region, i)
        },
        phoneNumber: `+233${20 + (i % 8)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
        emergencyContact: {
          name: generateEmergencyContactName(i),
          relationship: generateRelationship(i),
          phone: `+233${20 + (i % 8)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`
        }
      },
      biometricInfo: {
        fingerprintHash: `FP_${Date.now()}_${i}`,
        photoHash: `PH_${Date.now()}_${i}`,
        signatureHash: `SG_${Date.now()}_${i}`,
        biometricTemplate: generateBiometricTemplate(i)
      },
      verificationFlags: {
        isVerified: true,
        lastVerificationDate: new Date(),
        verificationMethod: 'BIOMETRIC',
        verificationNotes: 'Standard biometric verification',
        verificationCount: 1
      },
      securityInfo: {
        accessHistory: [],
        flaggedForReview: false,
        reviewReason: '',
        lastSecurityCheck: new Date()
      }
    })
  }
  
  return cardData
}

// Helper functions
const calculateCheckDigit = (numberString) => {
  let sum = 0
  for (let i = 0; i < numberString.length; i++) {
    let digit = parseInt(numberString[i])
    if (i % 2 === 0) digit *= 2
    if (digit > 9) digit = Math.floor(digit / 10) + (digit % 10)
    sum += digit
  }
  return (10 - (sum % 10)) % 10
}

const generateBusinessName = (category, index) => {
  const prefixes = ['Premium', 'Professional', 'Expert', 'Quality', 'Reliable', 'Modern', 'Advanced']
  const suffixes = ['Services', 'Solutions', 'Works', 'Enterprise', 'Company', 'Group']
  const locations = ['Accra', 'Kumasi', 'Tema', 'Takoradi', 'Cape Coast']
  
  const prefix = prefixes[index % prefixes.length]
  const location = locations[index % locations.length]
  const suffix = suffixes[index % suffixes.length]
  
  return `${location} ${prefix} ${category} ${suffix}`
}

const generateOwnerName = (index) => {
  const firstNames = [
    'Kwame', 'Kofi', 'Kwaku', 'Yaw', 'Kofi', 'Kwesi', 'Kwabena',
    'Akosua', 'Adwoa', 'Abenaa', 'Akua', 'Yaa', 'Afua', 'Ama'
  ]
  const lastNames = [
    'Asante', 'Osei', 'Mensah', 'Boateng', 'Adjei', 'Owusu', 'Appiah',
    'Gyasi', 'Amoah', 'Frimpong', 'Yeboah', 'Agyei', 'Opoku', 'Acheampong'
  ]
  
  const firstName = firstNames[index % firstNames.length]
  const lastName = lastNames[index % lastNames.length]
  
  return `${firstName} ${lastName}`
}

const generateFirstName = (index) => {
  const names = [
    'Kwame', 'Kofi', 'Kwaku', 'Yaw', 'Kwesi', 'Kwabena', 'Emmanuel',
    'Akosua', 'Adwoa', 'Abenaa', 'Akua', 'Yaa', 'Afua', 'Ama', 'Grace'
  ]
  return names[index % names.length]
}

const generateLastName = (index) => {
  const names = [
    'Asante', 'Osei', 'Mensah', 'Boateng', 'Adjei', 'Owusu', 'Appiah',
    'Gyasi', 'Amoah', 'Frimpong', 'Yeboah', 'Agyei', 'Opoku', 'Acheampong'
  ]
  return names[index % names.length]
}

const generateMiddleName = (index) => {
  const names = ['Osei', 'Ama', 'Kwame', 'Akua', 'Kofi', 'Yaa']
  return names[index % names.length]
}

const generateStreetAddress = (index) => {
  const streets = [
    'Ring Road Central', 'Liberation Road', 'Independence Avenue',
    'Cantonments Road', 'Osu Oxford Street', 'Labone Beach Road',
    'Airport Hills', 'East Legon', 'Dansoman High Street'
  ]
  return streets[index % streets.length]
}

const generateEmailDomain = (index) => {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com']
  return domains[index % domains.length]
}

const generateDigitalAddress = (region, index) => {
  const codes = {
    'Greater Accra': 'GA',
    'Ashanti': 'AK',
    'Northern': 'NR',
    'Western': 'WR',
    'Eastern': 'ER',
    'Central': 'CR'
  }
  
  const code = codes[region] || 'GA'
  const num1 = String(100 + (index % 900)).padStart(3, '0')
  const num2 = String(1000 + (index % 9000)).padStart(4, '0')
  
  return `${code}-${num1}-${num2}`
}

const generateCoordinates = (region, index) => {
  const coordinates = {
    'Greater Accra': { lat: 5.6037, lng: -0.1870 },
    'Ashanti': { lat: 6.6885, lng: -1.6244 },
    'Northern': { lat: 9.4034, lng: -0.8424 },
    'Western': { lat: 4.8960, lng: -1.7756 },
    'Eastern': { lat: 6.0833, lng: -0.2500 },
    'Central': { lat: 5.1375, lng: -1.2833 }
  }
  
  const base = coordinates[region] || coordinates['Greater Accra']
  
  return {
    latitude: base.lat + (Math.random() - 0.5) * 0.5,
    longitude: base.lng + (Math.random() - 0.5) * 0.5
  }
}

const generateSecondaryServices = (category) => {
  const services = {
    'Cleaning': ['Deep Cleaning', 'Office Cleaning', 'Carpet Cleaning'],
    'Repair': ['Electronics Repair', 'Appliance Repair', 'Furniture Repair'],
    'Painting': ['Interior Painting', 'Exterior Painting', 'Decorative Painting'],
    'Shifting': ['Home Moving', 'Office Moving', 'Packing Services'],
    'Plumbing': ['Pipe Repair', 'Installation', 'Emergency Services'],
    'Electric': ['Wiring', 'Installation', 'Maintenance']
  }
  
  return services[category] || []
}

const generateBusinessDescription = (category, type) => {
  return `Professional ${category.toLowerCase()} services provider operating as ${type.replace(/_/g, ' ').toLowerCase()}. Committed to quality service delivery and customer satisfaction.`
}

const generateArea = (index) => {
  const areas = [
    'Adabraka', 'Osu', 'Labone', 'Cantonments', 'Airport Residential',
    'East Legon', 'Dansoman', 'Achimota', 'Tesano', 'Dzorwulu'
  ]
  return areas[index % areas.length]
}

const generateEmergencyContactName = (index) => {
  const names = [
    'Mary Asante', 'John Osei', 'Grace Mensah', 'Peter Boateng',
    'Linda Adjei', 'Samuel Owusu', 'Joyce Appiah', 'Daniel Gyasi'
  ]
  return names[index % names.length]
}

const generateRelationship = (index) => {
  const relationships = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend']
  return relationships[index % relationships.length]
}

const generateCityForRegion = (region) => {
  const cities = {
    'Greater Accra': 'Accra',
    'Ashanti': 'Kumasi',
    'Northern': 'Tamale',
    'Western': 'Takoradi',
    'Eastern': 'Koforidua',
    'Central': 'Cape Coast'
  }
  return cities[region] || 'Accra'
}

const generateBiometricTemplate = (index) => {
  // Generate a mock base64 biometric template
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < 64; i++) {
    result += chars.charAt((index + i) % chars.length)
  }
  return result
}

// Main setup function
const setupVerificationDatabases = async () => {
  try {
    console.log('🔄 Starting verification databases setup...')
    
    // Connect to database
    await connectDB()
    console.log('✅ Database connected')
    
    // Clear existing data (development only)
    console.log('🗑️ Clearing existing data...')
    await TinRegistry.deleteMany({})
    await GhanaCardRegistry.deleteMany({})
    console.log('✅ Existing data cleared')
    
    // Generate sample data
    console.log('📊 Generating sample data...')
    const tinSampleData = generateTinSampleData()
    const cardSampleData = generateGhanaCardSampleData(tinSampleData)
    
    // Insert TIN Registry data
    console.log('💾 Inserting TIN Registry data...')
    const tinResult = await TinRegistry.insertMany(tinSampleData)
    console.log(`✅ Inserted ${tinResult.length} TIN registry records`)
    
    // Insert Ghana Card Registry data
    console.log('💾 Inserting Ghana Card Registry data...')
    const cardResult = await GhanaCardRegistry.insertMany(cardSampleData)
    console.log(`✅ Inserted ${cardResult.length} Ghana Card registry records`)
    
    // Verify data integrity
    console.log('🔍 Verifying data integrity...')
    const tinCount = await TinRegistry.countDocuments()
    const cardCount = await GhanaCardRegistry.countDocuments()
    const activeTinCount = await TinRegistry.countDocuments({ 'registrationInfo.isActive': true })
    const activeCardCount = await GhanaCardRegistry.countDocuments({ 'identificationInfo.cardStatus': 'ACTIVE' })
    
    console.log('📈 Database Statistics:')
    console.log(`   - Total TIN records: ${tinCount}`)
    console.log(`   - Active TIN records: ${activeTinCount}`)
    console.log(`   - Total Ghana Card records: ${cardCount}`)
    console.log(`   - Active Ghana Card records: ${activeCardCount}`)
    
    console.log('🎉 Verification databases setup completed successfully!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
    process.exit(1)
  }
}

// Run setup if called directly
if (require.main === module) {
  setupVerificationDatabases()
    .then(() => {
      console.log('🏁 Setup process completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('💥 Setup process failed:', error)
      process.exit(1)
    })
}

module.exports = { setupVerificationDatabases, generateTinSampleData, generateGhanaCardSampleData }
