import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

function parseTime(timeStr, format = '24h') {
  let hours, minutes;
  if (format === '12h') {
    const [time, ampm] = timeStr.split(' ');
    [hours, minutes] = time.split(':').map(Number);
    if (ampm === 'PM' && hours !== 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
  } else {
    [hours, minutes] = timeStr.split(':').map(Number);
  }
  return hours * 60 + minutes;
}

function formatTime(minutes) {
  const hours = Math.floor(minutes / 60) % 12 || 12;
  const mins = minutes % 60;
  const ampm = minutes < 720 ? 'AM' : 'PM';
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

export async function GET(request, { params }) {
  try {
    const { businessId } = params;
    const date = request.nextUrl.searchParams.get('date');
    if (!date) {
      return NextResponse.json({ error: 'Date is required' }, { status: 400 });
    }

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
      return NextResponse.json({ error: 'No provider associated' }, { status: 404 });
    }
    let availability = await db.collection('provider_availability').findOne({ providerEmail });
    if (!availability) {
      availability = {
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
        slotDuration: 30,
        bufferTime: 0
      };
    }

    const dayOfWeek = new Date(date).toLocaleString('en-us', { weekday: 'long' }).toLowerCase();
    const dayHours = availability.workingHours[dayOfWeek];
    if (!dayHours.enabled) {
      return NextResponse.json([]);
    }

    const startMin = parseTime(dayHours.start);
    const endMin = parseTime(dayHours.end);
    const slotDuration = availability.slotDuration || 30;
    const bufferTime = availability.bufferTime || 0;

    // Generate possible slots
    const possibleSlots = [];
    let current = startMin;
    while (current + slotDuration <= endMin) {
      possibleSlots.push(current);
      current += slotDuration + bufferTime;
    }

    // Get blocked ranges
    const blockedRanges = availability.blockedSlots
      .filter(slot => slot.date === date)
      .map(slot => ({ start: parseTime(slot.startTime), end: parseTime(slot.endTime) }));

    // Get booked ranges (assume 60 min duration for now)
    let bookingsCollection = db.collection('bookings');
    let bookingsQuery = {
      date: date,
      status: { $in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] }
    };
    try {
      bookingsQuery.businessId = new ObjectId(businessId);
    } catch (e) {
      if (e.name === 'BSONError') {
        bookingsQuery.businessId = businessId;
      } else {
        throw e;
      }
    }
    const bookings = await bookingsCollection.find(bookingsQuery).toArray();
    const bookedRanges = bookings.map(booking => {
      const startMin = parseTime(booking.time, '12h');
      return { start: startMin, end: startMin + 60 }; // Assume 60 min
    });

    // Filter available slots
    const availableMinutes = possibleSlots.filter(slotStart => {
      const slotEnd = slotStart + slotDuration;
      // Check overlap with blocked
      for (let range of [...blockedRanges, ...bookedRanges]) {
        if (slotStart < range.end && slotEnd > range.start) {
          return false;
        }
      }
      return true;
    });

    const availableSlots = availableMinutes.map(formatTime);

    return NextResponse.json(availableSlots);
  } catch (error) {
    console.error('Error computing available slots:', error);
    return NextResponse.json({ error: 'Failed to compute available slots' }, { status: 500 });
  }
} 