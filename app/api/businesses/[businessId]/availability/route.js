import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const { businessId } = params;
    const { db } = await connectToDatabase();
    const collection = db.collection('businesslists');
    let business;
    try {
      const oid = new ObjectId(businessId);
      business = await collection.findOne({ _id: oid });
    } catch (e) {
      if (e.name === 'BSONError') {
        business = await collection.findOne({ _id: businessId });
      } else {
        throw e;
      }
    }
    if (!business) {
      return NextResponse.json({ error: 'Business not found' }, { status: 404 });
    }
    const providerEmail = business.providerEmail;
    if (!providerEmail) {
      return NextResponse.json({ error: 'No provider associated with this business' }, { status: 404 });
    }
    const availability = await db.collection('provider_availability').findOne({ providerEmail });
    if (!availability) {
      // Return default availability
      const defaultAvailability = {
        workingHours: {
          monday: { enabled: true, start: '09:00', end: '17:00' },
          tuesday: { enabled: true, start: '09:00', end: '17:00' },
          wednesday: { enabled: true, start: '09:00', end: '17:00' },
          thursday: { enabled: true, start: '09:00', end: '17:00' },
          friday: { enabled: true, start: '09:00', end: '17:00' },
          saturday: { enabled: false, start: '09:00', end: '17:00' },
          sunday: { enabled: false, start: '09:00', end: '17:00' }
        },
        blockedSlots: [],
        timezone: 'America/New_York',
        slotDuration: 60,
        bufferTime: 15,
        advanceBooking: 7
      };
      return NextResponse.json(defaultAvailability);
    }
    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json({ error: 'Failed to fetch availability' }, { status: 500 });
  }
} 