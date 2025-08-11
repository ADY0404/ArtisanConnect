import { NextResponse } from 'next/server'
import MongoApi from '@/app/_services/MongoApi'
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { businessId } = await request.json();
    const userEmail = session.user.email;

    if (!businessId) {
      return NextResponse.json({ error: 'Business ID is required' }, { status: 400 });
    }

    const { hasBooking } = await MongoApi.verifyUserBooking(userEmail, businessId);
    
    return NextResponse.json({ hasBooking });

  } catch (error) {
    console.error('Error verifying booking:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 