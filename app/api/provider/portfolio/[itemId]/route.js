import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { connectToDatabase } from '@/lib/mongodb'
import { authOptions } from '../../../auth/[...nextauth]/route'

export async function DELETE(request, { params }) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { itemId } = params
    const { db } = await connectToDatabase()

    // Delete the portfolio item (only if it belongs to the current provider)
    const result = await db.collection('portfolioItems').deleteOne({
      id: itemId,
      providerId: session.user.id || session.user.email
    })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Portfolio item not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ 
      success: true,
      message: 'Portfolio item deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting portfolio item:', error)
    return NextResponse.json(
      { error: 'Failed to delete portfolio item' },
      { status: 500 }
    )
  }
} 