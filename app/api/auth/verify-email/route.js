import { NextResponse } from 'next/server';
import { User } from '@/models/User';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const { token } = await request.json();

    if (!token) {
      return NextResponse.json({ success: false, error: 'notoken' }, { status: 400 });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findByEmailVerificationToken(hashedToken);

    if (!user) {
      return NextResponse.json({ success: false, error: 'invalidtoken' }, { status: 400 });
    }

    await User.verifyEmail(user._id);

    console.log(`✅ Email verified successfully for user: ${user.email}`);
    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Email verification error:', error);
    return NextResponse.json({ success: false, error: 'servererror' }, { status: 500 });
  }
} 