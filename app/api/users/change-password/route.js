import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { User } from '@/models/User';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const data = await request.json();
    const { userId, currentPassword, newPassword } = data;
    
    // Validate request
    if (!userId || !currentPassword || !newPassword) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Ensure user can only change their own password (unless admin)
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }
    
    // Change password
    const result = await User.changePassword(userId, currentPassword, newPassword);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Password changed successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to change password'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to change password' 
    }, { status: 500 });
  }
} 