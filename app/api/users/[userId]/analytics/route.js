import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { userId } = params;
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    const { db } = await connectToDatabase();
    const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    // Fetch bookings
    const bookings = await db.collection('bookings').find({ userEmail: user.email }).toArray();
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'COMPLETED').length;
    const totalSpent = bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    // Fetch reviews
    const reviews = await db.collection('reviews').find({ userEmail: user.email }).toArray();
    const totalReviews = reviews.length;
    // Favorite categories (mocked by most booked)
    const categoryCounts = bookings.reduce((acc, b) => {
      const cat = b.category || 'Unknown';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {});
    const favoriteCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    return NextResponse.json({
      totalBookings,
      completedBookings,
      totalSpent,
      totalReviews,
      favoriteCategory,
      recentActivity: bookings.slice(0, 5).map(b => ({ date: b.date, service: b.businessName, status: b.status })),
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
} 