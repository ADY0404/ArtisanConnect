import mongoose from 'mongoose'

const CategorySchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true // This already creates an index, so we don't need manual index
  },
  backgroundColor: { 
    type: String, 
    default: '#3B82F6' 
  },
  icon: { 
    type: String, 
    default: '/default-icon.svg' 
  },
  description: { 
    type: String, 
    default: '' 
  },
  isActive: { 
    type: Boolean, 
    default: true,
    index: true // Use schema-level index instead of manual
  }
}, {
  timestamps: true
})

// Static methods for backward compatibility
CategorySchema.statics.create = async function(categoryData) {
  try {
    // Check if category already exists
    const existingCategory = await this.findOne({ 
      name: { $regex: new RegExp('^' + categoryData.name + '$', 'i') }
    })
    if (existingCategory) {
      throw new Error('Category already exists with this name')
    }

    const category = new this(categoryData)
    const savedCategory = await category.save()
    
    console.log(`✅ Category created: ${categoryData.name}`)
    return {
      success: true,
      categoryId: savedCategory._id,
      category: savedCategory
    }
  } catch (error) {
    console.error('❌ Error creating category:', error)
    throw error
  }
}

CategorySchema.statics.getAll = async function() {
  try {
    console.log('🔍 Category.getAll() called - fetching active categories...')
    const activeCategories = await this.find({ isActive: true }).sort({ name: 1 })
    console.log('✅ Found active categories:', activeCategories.map(cat => ({
      id: cat._id.toString(),
      name: cat.name,
      isActive: cat.isActive
    })))
    return activeCategories
  } catch (error) {
    console.error('❌ Error fetching categories:', error)
    throw error
  }
}

CategorySchema.statics.findByName = async function(name) {
  try {
    return await this.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') }
    })
  } catch (error) {
    console.error('❌ Error finding category by name:', error)
    throw error
  }
}

CategorySchema.statics.update = async function(categoryId, updateData) {
  try {
    const { _id, createdAt, ...safeUpdateData } = updateData
    
    const result = await this.updateOne(
      { _id: categoryId },
      { 
        $set: { 
          ...safeUpdateData, 
          updatedAt: new Date() 
        } 
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('Category not found')
    }

    console.log(`✅ Category updated: ${categoryId}`)
    return { success: true, modifiedCount: result.modifiedCount }
  } catch (error) {
    console.error('❌ Error updating category:', error)
    throw error
  }
}

CategorySchema.statics.delete = async function(categoryId) {
  try {
    // First check if this category has any businesses associated with it
    const BusinessList = mongoose.models.BusinessList || mongoose.model('BusinessList')
    const businessCount = await BusinessList.countDocuments({ categoryId: categoryId })
    
    if (businessCount > 0) {
      console.log(`⚠️ Category has ${businessCount} businesses associated with it`)
      
      // Delete all businesses associated with this category
      const deleteResult = await BusinessList.deleteMany({ categoryId: categoryId })
      console.log(`✅ Deleted ${deleteResult.deletedCount} businesses associated with category ${categoryId}`)
      
      // Mark the category as inactive
      const result = await this.updateOne(
        { _id: categoryId },
        { 
          $set: { 
            isActive: false, 
            updatedAt: new Date() 
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('Category not found')
      }

      console.log(`✅ Category marked as inactive: ${categoryId}`)
      return { 
        success: true,
        hasBusinesses: true,
        businessCount: deleteResult.deletedCount,
        businessesDeleted: true
      }
    } else {
      // No businesses associated, can safely mark as inactive
      const result = await this.updateOne(
        { _id: categoryId },
        { 
          $set: { 
            isActive: false, 
            updatedAt: new Date() 
          } 
        }
      )

      if (result.matchedCount === 0) {
        throw new Error('Category not found')
      }

      console.log(`✅ Category deleted: ${categoryId}`)
      return { 
        success: true,
        hasBusinesses: false
      }
    }
  } catch (error) {
    console.error('❌ Error deleting category:', error)
    throw error
  }
}

// New method to reactivate an inactive category
CategorySchema.statics.reactivate = async function(categoryId) {
  try {
    const result = await this.updateOne(
      { _id: categoryId },
      { 
        $set: { 
          isActive: true, 
          updatedAt: new Date() 
        } 
      }
    )

    if (result.matchedCount === 0) {
      throw new Error('Category not found')
    }

    if (result.modifiedCount === 0) {
      throw new Error('Category is already active')
    }

    console.log(`✅ Category reactivated: ${categoryId}`)
    return { 
      success: true,
      modifiedCount: result.modifiedCount
    }
  } catch (error) {
    console.error('❌ Error reactivating category:', error)
    throw error
  }
}

export default mongoose.models.Category || mongoose.model('Category', CategorySchema) 