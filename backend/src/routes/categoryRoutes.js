// routes/categoryRoutes.js
const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const News = require('../models/News');
const { authenticate } = require('../middleware/auth');
const { logAdminAction } = require('../utils/adminLogger');
const { Op } = require('sequelize');

// ============================================
// PUBLIC ROUTES

// GET /api/categories - Get all categories (public can see active only)
router.get('/', async (req, res) => {
  try {
    const { includeInactive, includeProtected } = req.query;
    
    const whereClause = {};
    
    // Only show active categories to public users
    if (!includeInactive || includeInactive !== 'true') {
      whereClause.isActive = true;
    }
    
    const categories = await Category.findAll({
      where: whereClause,
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
      attributes: ['id', 'value', 'label', 'icon', 'color', 'displayOrder', 'isActive', 'isProtected', 'description']
    });
    
    res.json({
      success: true,
      count: categories.length,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// GET /api/categories/stats - Get article count per category
router.get('/stats', async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'value', 'label']
    });
    
    const stats = await Promise.all(
      categories.map(async (category) => {
        const newsCount = await News.count({
          where: { category: category.value }
        });
        
        return {
          id: category.id,
          value: category.value,
          label: category.label,
          newsCount
        };
      })
    );
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching category stats', 
      error: error.message 
    });
  }
});

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

// POST /api/categories - Create new category
router.post('/', authenticate, async (req, res) => {
  try {
    const { value, label, icon, color, description, isActive } = req.body;
    
    console.log('📝 Creating category:', { value, label });
    
    // Validate required fields
    if (!value || !label) {
      return res.status(400).json({ 
        success: false,
        message: 'Value and label are required' 
      });
    }
    
    // Validate value format (lowercase, no spaces)
    if (!/^[a-z0-9-]+$/.test(value)) {
      return res.status(400).json({ 
        success: false,
        message: 'Value must contain only lowercase letters, numbers, and hyphens' 
      });
    }
    
    // Check if category already exists
    const existingCategory = await Category.findOne({ 
      where: { value } 
    });
    
    if (existingCategory) {
      return res.status(400).json({ 
        success: false,
        message: `Category with value "${value}" already exists` 
      });
    }
    
    // Get max display order
    const maxOrder = await Category.max('displayOrder') || 0;
    
    // Create category
    const category = await Category.create({
      value,
      label,
      icon: icon || null,
      color: color || 'blue',
      description: description || null,
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: maxOrder + 1,
      isProtected: false // New categories are never protected
    });
    
    console.log(`✅ Category created: "${label}" (${value})`);
    await logAdminAction(req, { action: 'create', entityType: 'category', description: `Category "${label}" (${value}) created`, entityId: category.id });
    
    res.status(201).json({ 
      success: true,
      message: 'Category created successfully', 
      category
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    // Handle unique constraint errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'A category with this value already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating category', 
      error: error.message 
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }
    
    const { value, label, icon, color, description, isActive } = req.body;
    
    console.log('📝 Updating category:', category.value);
    
    // Prevent changing value of protected categories
    if (category.isProtected && value && value !== category.value) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot change value of protected category' 
      });
    }
    
    // If changing value, check for uniqueness
    if (value && value !== category.value) {
      if (!/^[a-z0-9-]+$/.test(value)) {
        return res.status(400).json({ 
          success: false,
          message: 'Value must contain only lowercase letters, numbers, and hyphens' 
        });
      }
      
      const existingCategory = await Category.findOne({ 
        where: { 
          value,
          id: { [Op.ne]: req.params.id }
        } 
      });
      
      if (existingCategory) {
        return res.status(400).json({ 
          success: false,
          message: `Category with value "${value}" already exists` 
        });
      }
    }
    
    // Update category
    const updateData = {
      label: label || category.label,
      icon: icon !== undefined ? icon : category.icon,
      color: color || category.color,
      description: description !== undefined ? description : category.description,
      isActive: isActive !== undefined ? isActive : category.isActive
    };
    
    // Only update value if not protected
    if (!category.isProtected && value) {
      updateData.value = value;
    }
    
    await category.update(updateData);
    
    console.log(`✅ Category updated: "${category.label}"`);
    await logAdminAction(req, { action: 'update', entityType: 'category', description: `Category "${category.label}" updated`, entityId: category.id });
    
    res.json({ 
      success: true,
      message: 'Category updated successfully', 
      category
    });
  } catch (error) {
    console.error('❌ Error updating category:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ 
        success: false,
        message: 'A category with this value already exists'
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating category', 
      error: error.message 
    });
  }
});

// PATCH /api/categories/:id/toggle - Toggle category active status
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }
    
    await category.update({ isActive: !category.isActive });
    
    console.log(`✅ Category ${category.isActive ? 'activated' : 'deactivated'}: "${category.label}"`);
    await logAdminAction(req, { action: 'toggle', entityType: 'category', description: `Category "${category.label}" ${category.isActive ? 'activated' : 'deactivated'}`, entityId: category.id });
    
    res.json({ 
      success: true,
      message: `Category ${category.isActive ? 'activated' : 'deactivated'} successfully`, 
      category
    });
  } catch (error) {
    console.error('❌ Error toggling category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling category status', 
      error: error.message 
    });
  }
});

// POST /api/categories/reorder - Reorder categories
router.post('/reorder', authenticate, async (req, res) => {
  try {
    const { categoryIds } = req.body;
    
    if (!Array.isArray(categoryIds) || categoryIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'categoryIds must be a non-empty array' 
      });
    }
    
    console.log('🔄 Reordering categories:', categoryIds);
    
    // Update display order for each category
    await Promise.all(
      categoryIds.map((id, index) =>
        Category.update(
          { displayOrder: index },
          { where: { id } }
        )
      )
    );
    
    console.log('✅ Categories reordered successfully');
    
    res.json({ 
      success: true,
      message: 'Categories reordered successfully'
    });
  } catch (error) {
    console.error('❌ Error reordering categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error reordering categories', 
      error: error.message 
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ 
        success: false,
        message: 'Category not found' 
      });
    }
    
    console.log('🗑️ Attempting to delete category:', category.value);
    
    // Check if can be deleted
    const canDelete = await category.canBeDeleted();
    
    if (!canDelete.allowed) {
      return res.status(400).json({ 
        success: false,
        message: canDelete.reason,
        newsCount: canDelete.newsCount
      });
    }
    
    const categoryLabel = category.label;
    await category.destroy();
    
    console.log(`✅ Category deleted: "${categoryLabel}"`);
    await logAdminAction(req, { action: 'delete', entityType: 'category', description: `Category "${categoryLabel}" deleted`, entityId: req.params.id });
    
    res.json({ 
      success: true,
      message: 'Category deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting category:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting category', 
      error: error.message 
    });
  }
});

module.exports = router;