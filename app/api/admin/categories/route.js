import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { ensureConnection } from '@/lib/mongodb';
import mongoose from 'mongoose';
import Category from '@/models/Category';

// GET: List all categories (including inactive ones for admin)
export async function GET(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ensure database connection
    await ensureConnection();

    // Get all categories, including inactive ones
    const categories = await Category.find({}).sort({ name: 1 });
    
    const response = NextResponse.json({
      success: true,
      categories: categories.map(cat => ({
        id: cat._id.toString(),
        name: cat.name,
        backgroundColor: cat.backgroundColor,
        icon: cat.icon,
        description: cat.description,
        isActive: cat.isActive
      }))
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response;
  } catch (error) {
    console.error('❌ Error fetching admin categories:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch categories'
    }, { status: 500 });
  }
}

// POST: Create a new category
export async function POST(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ensure database connection
    await ensureConnection();

    const categoryData = await request.json();
    
    // Validate required fields
    if (!categoryData.name) {
      return NextResponse.json({
        success: false,
        error: 'Category name is required'
      }, { status: 400 });
    }

    // Create category
    const result = await Category.create(categoryData);
    
    const response = NextResponse.json({
      success: true,
      category: result.category
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response;
  } catch (error) {
    console.error('❌ Error creating category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create category'
    }, { status: 500 });
  }
}

// PUT: Update an existing category
export async function PUT(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ensure database connection
    await ensureConnection();

    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    // Update category
    const result = await Category.update(id, updateData);
    
    const response = NextResponse.json({
      success: true,
      result
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response;
  } catch (error) {
    console.error('❌ Error updating category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to update category'
    }, { status: 500 });
  }
}

// DELETE: Soft delete a category (set isActive to false)
export async function DELETE(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ensure database connection
    await ensureConnection();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    console.log(`🗑️ Attempting to delete category: ${id}`);
    
    // Delete category (soft delete)
    const result = await Category.delete(id);
    
    console.log(`✅ Delete result:`, result);
    
    const response = NextResponse.json({
      success: true,
      result,
      hasBusinesses: result.hasBusinesses,
      businessCount: result.businessCount || 0,
      businessesDeleted: result.businessesDeleted || false,
      message: result.hasBusinesses 
        ? `Category marked as inactive and ${result.businessCount} businesses have been deleted.` 
        : 'Category deleted successfully.'
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response;
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to delete category'
    }, { status: 500 });
  }
}

// PATCH: Reactivate a category
export async function PATCH(request) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Ensure database connection
    await ensureConnection();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({
        success: false,
        error: 'Category ID is required'
      }, { status: 400 });
    }

    console.log(`🔄 Attempting to reactivate category: ${id}`);
    
    // Make sure we have the Category model with all static methods
    const CategoryModel = mongoose.models.Category || mongoose.model('Category');
    
    // Reactivate category using the model's static method
    const result = await CategoryModel.updateOne(
      { _id: id },
      { $set: { isActive: true, updatedAt: new Date() } }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json({
        success: false,
        error: 'Category not found'
      }, { status: 404 });
    }
    
    console.log(`✅ Category reactivated: ${id}`);
    
    const response = NextResponse.json({
      success: true,
      message: 'Category reactivated successfully'
    });

    // Add cache control headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response;
  } catch (error) {
    console.error('❌ Error reactivating category:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to reactivate category'
    }, { status: 500 });
  }
} 