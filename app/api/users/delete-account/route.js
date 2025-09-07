import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { User } from '@/models/User';
import bcrypt from 'bcryptjs';

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ 
        success: false, 
        error: 'Unauthorized' 
      }, { status: 401 });
    }
    
    const data = await request.json();
    const { userId, password } = data;
    
    // Validate request
    if (!userId || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }
    
    // Ensure user can only delete their own account (unless admin)
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ 
        success: false, 
        error: 'Access denied' 
      }, { status: 403 });
    }
    
    // Verify password
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not found' 
      }, { status: 404 });
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password' 
      }, { status: 400 });
    }
    
    // Deactivate account instead of hard delete
    const result = await User.deactivateUser(userId);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Account deleted successfully'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'Failed to delete account'
      }, { status: 400 });
    }
    
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Failed to delete account' 
    }, { status: 500 });
  }
} 