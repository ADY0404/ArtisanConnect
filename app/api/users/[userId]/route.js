import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { User } from '@/models/User';
import { ObjectId } from 'mongodb';

export async function GET(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = params;
    
    // Only allow users to access their own profile or admins to access any profile
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Remove sensitive information
    const { password, ...safeUser } = user;
    
    return NextResponse.json(safeUser);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { userId } = params;
    
    // Only allow users to update their own profile or admins to update any profile
    if (session.user.id !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }
    
    const data = await request.json();
    
    // Update user profile
    const result = await User.updateProfile(userId, data);
    
    if (result.success) {
      console.log(`✅ User profile updated: ${userId}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Profile updated successfully' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to update profile' 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to update profile' 
    }, { status: 500 });
  }
} 