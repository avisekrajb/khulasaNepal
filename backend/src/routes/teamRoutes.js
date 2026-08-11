// routes/teamRoutes.js - PRODUCTION-READY TEAM MANAGEMENT
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Team = require('../models/Team');
const { authenticate } = require('../middleware/auth');

// ============================================
// UPLOAD CONFIGURATION
// ============================================

const uploadDir = './uploads/team';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, `team-${uniqueSuffix}-${sanitizedName}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter
});

// ============================================
// HELPER FUNCTIONS
// ============================================

function cleanupFile(filePath) {
  if (!filePath) return;
  
  const fullPath = path.join('.', filePath);
  if (fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
      console.log(`🗑️  Deleted file: ${filePath}`);
    } catch (err) {
      console.error(`❌ Failed to delete file: ${filePath}`, err);
    }
  }
}

function validateEmail(email) {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateUrl(url) {
  if (!url) return true; // URL is optional
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function sanitizeSocialLinks(links) {
  if (!links || typeof links !== 'object') {
    return { facebook: null, twitter: null, linkedin: null, instagram: null };
  }
  
  const sanitized = {
    facebook: links.facebook?.trim() || null,
    twitter: links.twitter?.trim() || null,
    linkedin: links.linkedin?.trim() || null,
    instagram: links.instagram?.trim() || null
  };
  
  // Validate each URL (convert empty strings to null)
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === '') {
      sanitized[key] = null;
    } else if (sanitized[key] && !validateUrl(sanitized[key])) {
      console.warn(`⚠️  Invalid ${key} URL, removing: ${sanitized[key]}`);
      sanitized[key] = null;
    }
  });
  
  return sanitized;
}

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/team/public - Get all active team members (public view)
router.get('/public', async (req, res) => {
  try {
    const { limit } = req.query;
    
    const teamMembers = await Team.findAll({
      where: { isActive: true },
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'ASC']
      ],
      limit: limit ? parseInt(limit) : undefined,
      attributes: {
        exclude: ['createdAt', 'updatedAt'] // Hide timestamps from public view
      }
    });
    
    console.log(`📋 Public team request: ${teamMembers.length} active members`);
    
    res.json({
      success: true,
      count: teamMembers.length,
      team: teamMembers
    });
  } catch (error) {
    console.error('❌ Error fetching public team:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching team members', 
      error: error.message 
    });
  }
});

// GET /api/team/public/:id - Get single team member (public view)
router.get('/public/:id', async (req, res) => {
  try {
    const member = await Team.findOne({
      where: { 
        id: req.params.id,
        isActive: true 
      },
      attributes: {
        exclude: ['createdAt', 'updatedAt']
      }
    });
    
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found' 
      });
    }
    
    res.json({
      success: true,
      team: member
    });
  } catch (error) {
    console.error('❌ Error fetching team member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching team member', 
      error: error.message 
    });
  }
});

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

// GET /api/team - Get all team members (admin view)
router.get('/', authenticate, async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const whereClause = includeInactive === 'true' ? {} : { isActive: true };
    
    const teamMembers = await Team.findAll({
      where: whereClause,
      order: [
        ['displayOrder', 'ASC'],
        ['createdAt', 'ASC']
      ]
    });
    
    console.log(`📋 Admin team request: ${teamMembers.length} members`);
    
    res.json({
      success: true,
      count: teamMembers.length,
      team: teamMembers
    });
  } catch (error) {
    console.error('❌ Error fetching team:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching team members', 
      error: error.message 
    });
  }
});

// GET /api/team/:id - Get single team member (admin view)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const member = await Team.findByPk(req.params.id);
    
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found' 
      });
    }
    
    res.json({
      success: true,
      team: member
    });
  } catch (error) {
    console.error('❌ Error fetching team member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching team member', 
      error: error.message 
    });
  }
});

// POST /api/team - Create new team member
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { 
      name, 
      position, 
      bio, 
      email, 
      phone, 
      socialLinks,
      isActive,
      displayOrder
    } = req.body;
    
    console.log('📝 Creating team member:', { name, position });
    
    // Validation
    if (!name || !name.trim()) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ 
        success: false,
        message: 'Name is required' 
      });
    }
    
    if (!position || !position.trim()) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ 
        success: false,
        message: 'Position is required' 
      });
    }
    
    if (email && !validateEmail(email)) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }
    
    // Parse social links if provided
    let parsedSocialLinks = null;
    if (socialLinks) {
      try {
        parsedSocialLinks = typeof socialLinks === 'string' 
          ? JSON.parse(socialLinks) 
          : socialLinks;
        parsedSocialLinks = sanitizeSocialLinks(parsedSocialLinks);
      } catch (err) {
        console.warn('⚠️  Invalid social links format, using defaults');
        parsedSocialLinks = { facebook: null, twitter: null, linkedin: null, instagram: null };
      }
    }
    
    // Get the highest display order if not specified
    let order = displayOrder ? parseInt(displayOrder) : null;
    if (order === null) {
      const maxOrder = await Team.max('displayOrder');
      order = (maxOrder || 0) + 1;
    }
    
    const imageUrl = req.file ? `/uploads/team/${req.file.filename}` : null;
    
    const member = await Team.create({
      name: name.trim(),
      position: position.trim(),
      bio: bio?.trim() || null,
      email: email?.trim() || null,
      phone: phone?.trim() || null,
      imageUrl,
      socialLinks: parsedSocialLinks,
      isActive: isActive === 'true' || isActive === true,
      displayOrder: order
    });
    
    console.log(`✅ Team member created: "${member.name}" (${member.position})`);
    
    res.status(201).json({ 
      success: true,
      message: 'Team member created successfully', 
      team: member
    });
  } catch (error) {
    console.error('❌ Error creating team member:', error);
    if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
    
    res.status(400).json({ 
      success: false,
      message: 'Error creating team member', 
      error: error.message 
    });
  }
});

// PUT /api/team/:id - Update team member
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const member = await Team.findByPk(req.params.id);
    
    if (!member) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found' 
      });
    }
    
    const { 
      name, 
      position, 
      bio, 
      email, 
      phone, 
      socialLinks,
      isActive,
      displayOrder
    } = req.body;
    
    console.log(`📝 Updating team member: ${member.name}`);
    
    // Validation
    if (name !== undefined && (!name || !name.trim())) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ 
        success: false,
        message: 'Name cannot be empty' 
      });
    }
    
    if (position !== undefined && (!position || !position.trim())) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ 
        success: false,
        message: 'Position cannot be empty' 
      });
    }
    
    if (email && !validateEmail(email)) {
      if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
      return res.status(400).json({ 
        success: false,
        message: 'Invalid email format' 
      });
    }
    
    const updateData = {};
    
    if (name !== undefined) updateData.name = name.trim();
    if (position !== undefined) updateData.position = position.trim();
    if (bio !== undefined) updateData.bio = bio?.trim() || null;
    if (email !== undefined) updateData.email = email?.trim() || null;
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (displayOrder !== undefined) updateData.displayOrder = parseInt(displayOrder);
    if (isActive !== undefined) updateData.isActive = isActive === 'true' || isActive === true;
    
    // Handle social links update
    if (socialLinks !== undefined) {
      try {
        const parsedLinks = typeof socialLinks === 'string' 
          ? JSON.parse(socialLinks) 
          : socialLinks;
        updateData.socialLinks = sanitizeSocialLinks(parsedLinks);
      } catch (err) {
        console.warn('⚠️  Invalid social links format, keeping existing');
      }
    }
    
    // Handle image update
    if (req.file) {
      // Delete old image if it exists
      if (member.imageUrl) {
        cleanupFile(member.imageUrl);
      }
      updateData.imageUrl = `/uploads/team/${req.file.filename}`;
    } else if (req.body.imageUrl !== undefined) {
      // If imageUrl is explicitly set (even to empty string), handle it
      if (req.body.imageUrl === '' || req.body.imageUrl === null) {
        // Delete old image if removing
        if (member.imageUrl) {
          cleanupFile(member.imageUrl);
        }
        updateData.imageUrl = null;
      } else if (req.body.imageUrl !== member.imageUrl) {
        // Only update if it's different
        updateData.imageUrl = req.body.imageUrl;
      }
    }
    
    await member.update(updateData);
    
    console.log(`✅ Team member updated: "${member.name}"`);
    
    res.json({ 
      success: true,
      message: 'Team member updated successfully', 
      team: member
    });
  } catch (error) {
    console.error('❌ Error updating team member:', error);
    if (req.file) cleanupFile(`/uploads/team/${req.file.filename}`);
    
    res.status(400).json({ 
      success: false,
      message: 'Error updating team member', 
      error: error.message 
    });
  }
});

// PATCH /api/team/:id/toggle - Toggle active status
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const member = await Team.findByPk(req.params.id);
    
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found' 
      });
    }
    
    await member.update({ isActive: !member.isActive });
    
    console.log(`✅ Team member ${member.isActive ? 'activated' : 'deactivated'}: "${member.name}"`);
    
    res.json({ 
      success: true,
      message: `Team member ${member.isActive ? 'activated' : 'deactivated'}`, 
      team: member
    });
  } catch (error) {
    console.error('❌ Error toggling team member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling team member status', 
      error: error.message 
    });
  }
});

// POST /api/team/reorder - Reorder team members
router.post('/reorder', authenticate, async (req, res) => {
  try {
    const { teamIds } = req.body;
    
    if (!Array.isArray(teamIds) || teamIds.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: 'teamIds array is required' 
      });
    }
    
    console.log('🔄 Reordering team members:', teamIds);
    
    // Update display order for each member
    const updatePromises = teamIds.map((id, index) => 
      Team.update(
        { displayOrder: index },
        { where: { id } }
      )
    );
    
    await Promise.all(updatePromises);
    
    console.log('✅ Team members reordered successfully');
    
    res.json({ 
      success: true,
      message: 'Team members reordered successfully' 
    });
  } catch (error) {
    console.error('❌ Error reordering team members:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error reordering team members', 
      error: error.message 
    });
  }
});

// DELETE /api/team/:id - Delete team member
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const member = await Team.findByPk(req.params.id);
    
    if (!member) {
      return res.status(404).json({ 
        success: false,
        message: 'Team member not found' 
      });
    }
    
    const memberName = member.name;
    
    // Delete associated image
    if (member.imageUrl) {
      cleanupFile(member.imageUrl);
    }
    
    await member.destroy();
    
    console.log(`✅ Team member deleted: "${memberName}"`);
    
    res.json({ 
      success: true,
      message: 'Team member deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting team member:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting team member', 
      error: error.message 
    });
  }
});

module.exports = router;