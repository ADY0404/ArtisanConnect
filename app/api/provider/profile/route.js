import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../auth/[...nextauth]/route'
import BusinessList from '@/models/BusinessList'

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { db } = await connectToDatabase()
    
    // Get provider profile from database
    const profile = await db.collection('providerProfiles').findOne({
      userId: session.user.id || session.user.email
    })

    // Get business information
    const business = await BusinessList.findOne({
      providerEmail: session.user.email
    }).populate('categoryId')

    if (!profile) {
      // Return default profile structure with business data if available
      return NextResponse.json({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: '',
        profileImage: session.user.image || '',
        businessName: business?.name || '',
        businessDescription: business?.about || '',
        businessAddress: business?.address || '',
        businessPhone: business?.phone || '',
        businessEmail: business?.email || '',
        businessImages: business?.images || [],
        category: business?.categoryId?.name || '',
        services: [],
        serviceArea: '',
        experience: business?.experience || '',
        certifications: business?.certifications || [],
        workingHours: {
          monday: { start: '09:00', end: '17:00', available: true },
          tuesday: { start: '09:00', end: '17:00', available: true },
          wednesday: { start: '09:00', end: '17:00', available: true },
          thursday: { start: '09:00', end: '17:00', available: true },
          friday: { start: '09:00', end: '17:00', available: true },
          saturday: { start: '09:00', end: '15:00', available: true },
          sunday: { start: '10:00', end: '14:00', available: false }
        },
        basePrice: '',
        emergencyRate: '',
        autoAcceptBookings: false,
        emailNotifications: true,
        smsNotifications: false
      })
    }

    // Merge profile with business data
    const profileWithBusiness = {
      ...profile,
      businessImages: business?.images || profile.businessImages || []
    }

    return NextResponse.json(profileWithBusiness)

  } catch (error) {
    console.error('Error fetching provider profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const profileData = await request.json()
    const { db } = await connectToDatabase()

    // Remove _id field if it exists to prevent MongoDB error
    if (profileData._id) {
      delete profileData._id;
    }

    // Update or create provider profile
    const result = await db.collection('providerProfiles').updateOne(
      { userId: session.user.id || session.user.email },
      {
        $set: {
          ...profileData,
          userId: session.user.id || session.user.email,
          updatedAt: new Date()
        }
      },
      { upsert: true }
    )

    // If business images are provided, update the business listing
    if (profileData.businessImages && Array.isArray(profileData.businessImages)) {
      try {
        // Find the business first to get its ID
        const business = await BusinessList.findOne({ providerEmail: session.user.email });
        
        if (business) {
          await BusinessList.updateOne(
            { _id: business._id },
            {
              $set: {
                images: profileData.businessImages,
                updatedAt: new Date()
              }
            }
          );
        }
      } catch (businessError) {
        console.error('Error updating business images:', businessError)
        // Don't fail the entire request if business update fails
      }
    }

    // Update other business fields if provided
    const businessUpdateFields = {};
    if (profileData.businessName) businessUpdateFields.name = profileData.businessName;
    if (profileData.businessDescription) businessUpdateFields.about = profileData.businessDescription;
    if (profileData.businessAddress) businessUpdateFields.address = profileData.businessAddress;
    if (profileData.businessPhone) businessUpdateFields.phone = profileData.businessPhone;
    if (profileData.businessEmail) businessUpdateFields.email = profileData.businessEmail;
    if (profileData.experience) businessUpdateFields.experience = profileData.experience;

    if (Object.keys(businessUpdateFields).length > 0) {
      try {
        // Find the business first to get its ID
        const business = await BusinessList.findOne({ providerEmail: session.user.email });
        
        if (business) {
          await BusinessList.updateOne(
            { _id: business._id },
            {
              $set: {
                ...businessUpdateFields,
                updatedAt: new Date()
              }
            }
          );
        }
      } catch (businessError) {
        console.error('Error updating business information:', businessError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Profile updated successfully',
      profileId: result.upsertedId || 'existing'
    })

  } catch (error) {
    console.error('Error updating provider profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
} 