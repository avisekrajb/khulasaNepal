// routes/adRoutes.js - COMPLETE PRODUCTION VERSION WITH GIF SUPPORT
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Ad = require('../models/Ads');
const { authenticate } = require('../middleware/auth');
const { logAdminAction } = require('../utils/adminLogger');
const { Op } = require('sequelize');

// ========================================
// MULTER CONFIGURATION - SUPPORTS GIF, JPEG, PNG, WEBP
// ========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/ads';
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'ad-' + uniqueSuffix + ext);
  }
});

// Updated fileFilter to support GIF
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp|svg/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, GIF, WEBP, SVG) are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit for GIFs
  },
  fileFilter: fileFilter
});

// ========================================
// PUBLIC ROUTES
// ========================================

router.get('/position/:position', async (req, res) => {
  try {
    const { position } = req.params;
    const { page, category } = req.query;
    
    console.log(`📊 Fetching ads for position: ${position}, page: ${page}, category: ${category}`);
    
    const ads = await Ad.getActiveByPosition(position, { page, category });
    
    console.log(`✅ Found ${ads.length} matching ads`);
    
    res.json({
      success: true,
      count: ads.length,
      ads
    });
  } catch (error) {
    console.error('Error fetching ads by position:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching ads', 
      error: error.message 
    });
  }
});

router.post('/:id/impression', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }
    
    await ad.recordImpression();
    
    res.json({ 
      success: true,
      message: 'Impression recorded',
      impressions: ad.impressions
    });
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error recording impression', 
      error: error.message 
    });
  }
});

router.post('/:id/click', async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }
    
    await ad.recordClick();
    
    res.json({ 
      success: true,
      message: 'Click recorded',
      clicks: ad.clicks,
      linkUrl: ad.linkUrl 
    });
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error recording click', 
      error: error.message 
    });
  }
});

// ========================================
// PROTECTED ROUTES (Admin only)
// ========================================

router.get('/', authenticate, async (req, res) => {
  try {
    const { position, isActive } = req.query;
    
    const whereClause = {};
    
    if (position) whereClause.position = position;
    if (isActive !== undefined) whereClause.isActive = isActive === 'true';
    
    const ads = await Ad.findAll({
      where: whereClause,
      order: [['priority', 'DESC'], ['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: ads.length,
      ads
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching ads', 
      error: error.message 
    });
  }
});

router.get('/pages/available', authenticate, async (req, res) => {
  try {
    const pages = [
      { value: 'home', label: 'Home Page' },
      { value: 'article', label: 'Article Pages' },
      { value: 'category', label: 'Category Pages' },
      { value: 'about', label: 'About Page' },
      { value: 'contact', label: 'Contact Page' },
      { value: 'news', label: 'News Section' },
      { value: 'local', label: 'Local Section' },
      { value: 'sports', label: 'Sports Section' },
      { value: 'society', label: 'Society Section' },
      { value: 'more', label: 'More Section' },
    ];
    
    res.json({
      success: true,
      pages
    });
  } catch (error) {
    console.error('Error fetching available pages:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching pages', 
      error: error.message 
    });
  }
});

router.get('/categories/available', authenticate, async (req, res) => {
  try {
    const Category = require('../models/Category');
    
    const categories = await Category.findAll({
      where: { isActive: true },
      attributes: ['value', 'label'],
      order: [['displayOrder', 'ASC']]
    });
    
    const formattedCategories = categories.map(cat => ({
      value: cat.value,
      label: cat.label
    }));
    
    res.json({
      success: true,
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching available categories:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching categories', 
      error: error.message 
    });
  }
});

// POST - Create ad with GIF support
router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ 
        success: false,
        message: 'Image file is required' 
      });
    }
    
    // Detect if file is GIF
    const isGif = req.file.mimetype === 'image/gif';
    
    const adData = {
      title: req.body.title,
      position: req.body.position || 'sidebar-top',
      imageUrl: `/uploads/ads/${req.file.filename}`,
      imageMimeType: req.file.mimetype, // Store MIME type
      linkUrl: req.body.linkUrl,
      openInNewTab: req.body.openInNewTab !== 'false',
      priority: parseInt(req.body.priority) || 0,
      isActive: req.body.isActive !== 'false',
      startDate: req.body.startDate || null,
      endDate: req.body.endDate || null,
      width: req.body.width ? parseInt(req.body.width) : null,
      height: req.body.height ? parseInt(req.body.height) : null,
      advertiser: req.body.advertiser || null,
      notes: req.body.notes || null,
      targetPages: req.body.targetPages ? JSON.parse(req.body.targetPages) : [],
      targetCategories: req.body.targetCategories ? JSON.parse(req.body.targetCategories) : [],
      excludePages: req.body.excludePages ? JSON.parse(req.body.excludePages) : [],
      excludeCategories: req.body.excludeCategories ? JSON.parse(req.body.excludeCategories) : [],
      displayFrequency: req.body.displayFrequency || 'always',
      displayPercentage: req.body.displayPercentage ? parseInt(req.body.displayPercentage) : 100,
      maxImpressions: req.body.maxImpressions ? parseInt(req.body.maxImpressions) : null,
      maxClicks: req.body.maxClicks ? parseInt(req.body.maxClicks) : null
    };
    
    console.log(`📝 Creating ad: ${adData.title} (${isGif ? 'GIF' : 'Image'})`);
    
    const ad = await Ad.create(adData);
    
    console.log(`✅ Ad created: "${ad.title}"`);
    await logAdminAction(req, { action: 'create', entityType: 'ad', description: `Ad "${ad.title}" created`, entityId: ad.id });
    
    res.status(201).json({ 
      success: true,
      message: 'Ad created successfully', 
      ad
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    console.error('❌ Error creating ad:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error creating ad', 
      error: error.message 
    });
  }
});

// PUT - Update ad with GIF support
router.put('/:id', authenticate, upload.single('image'), async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    
    if (!ad) {
      if (req.file) {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error('Error deleting file:', err);
        });
      }
      
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }
    
    console.log('📝 Updating ad:', ad.title);
    
    const updateData = {
      title: req.body.title || ad.title,
      position: req.body.position || ad.position,
      linkUrl: req.body.linkUrl !== undefined ? req.body.linkUrl : ad.linkUrl,
      openInNewTab: req.body.openInNewTab !== undefined ? req.body.openInNewTab !== 'false' : ad.openInNewTab,
      priority: req.body.priority !== undefined ? parseInt(req.body.priority) : ad.priority,
      isActive: req.body.isActive !== undefined ? req.body.isActive !== 'false' : ad.isActive,
      startDate: req.body.startDate !== undefined ? req.body.startDate : ad.startDate,
      endDate: req.body.endDate !== undefined ? req.body.endDate : ad.endDate,
      width: req.body.width !== undefined ? parseInt(req.body.width) : ad.width,
      height: req.body.height !== undefined ? parseInt(req.body.height) : ad.height,
      advertiser: req.body.advertiser !== undefined ? req.body.advertiser : ad.advertiser,
      notes: req.body.notes !== undefined ? req.body.notes : ad.notes,
      targetPages: req.body.targetPages !== undefined ? JSON.parse(req.body.targetPages) : ad.targetPages,
      targetCategories: req.body.targetCategories !== undefined ? JSON.parse(req.body.targetCategories) : ad.targetCategories,
      excludePages: req.body.excludePages !== undefined ? JSON.parse(req.body.excludePages) : ad.excludePages,
      excludeCategories: req.body.excludeCategories !== undefined ? JSON.parse(req.body.excludeCategories) : ad.excludeCategories,
      displayFrequency: req.body.displayFrequency !== undefined ? req.body.displayFrequency : ad.displayFrequency,
      displayPercentage: req.body.displayPercentage !== undefined ? parseInt(req.body.displayPercentage) : ad.displayPercentage,
      maxImpressions: req.body.maxImpressions !== undefined ? parseInt(req.body.maxImpressions) : ad.maxImpressions,
      maxClicks: req.body.maxClicks !== undefined ? parseInt(req.body.maxClicks) : ad.maxClicks
    };
    
    if (req.file) {
      if (ad.imageUrl) {
        const oldImagePath = path.join(__dirname, '..', ad.imageUrl);
        fs.unlink(oldImagePath, (err) => {
          if (err) console.error('Error deleting old image:', err);
        });
      }
      
      updateData.imageUrl = `/uploads/ads/${req.file.filename}`;
      updateData.imageMimeType = req.file.mimetype;
    }
    
    await ad.update(updateData);
    
    console.log(`✅ Ad updated: "${ad.title}"`);
    await logAdminAction(req, { action: 'update', entityType: 'ad', description: `Ad "${ad.title}" updated`, entityId: ad.id });
    
    res.json({ 
      success: true,
      message: 'Ad updated successfully', 
      ad
    });
  } catch (error) {
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    
    console.error('❌ Error updating ad:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false,
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Error updating ad', 
      error: error.message 
    });
  }
});

router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }
    
    await ad.update({ isActive: !ad.isActive });
    
    console.log(`✅ Ad ${ad.isActive ? 'activated' : 'deactivated'}: "${ad.title}"`);
    await logAdminAction(req, { action: 'toggle', entityType: 'ad', description: `Ad "${ad.title}" ${ad.isActive ? 'activated' : 'deactivated'}`, entityId: ad.id });
    
    res.json({ 
      success: true,
      message: `Ad ${ad.isActive ? 'activated' : 'deactivated'} successfully`, 
      ad
    });
  } catch (error) {
    console.error('❌ Error toggling ad:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error toggling ad status', 
      error: error.message 
    });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }
    
    if (ad.imageUrl) {
      const imagePath = path.join(__dirname, '..', ad.imageUrl);
      fs.unlink(imagePath, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }
    
    const adTitle = ad.title;
    await ad.destroy();
    
    console.log(`✅ Ad deleted: "${adTitle}"`);
    await logAdminAction(req, { action: 'delete', entityType: 'ad', description: `Ad "${adTitle}" deleted`, entityId: req.params.id });
    
    res.json({ 
      success: true,
      message: 'Ad deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting ad:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting ad', 
      error: error.message 
    });
  }
});

router.get('/stats/overview', authenticate, async (req, res) => {
  try {
    const totalAds = await Ad.count();
    const activeAds = await Ad.count({ where: { isActive: true } });
    const totalImpressions = await Ad.sum('impressions') || 0;
    const totalClicks = await Ad.sum('clicks') || 0;
    
    const overallCTR = totalImpressions > 0 
      ? ((totalClicks / totalImpressions) * 100).toFixed(2) 
      : 0;
    
    res.json({
      success: true,
      stats: {
        totalAds,
        activeAds,
        inactiveAds: totalAds - activeAds,
        totalImpressions,
        totalClicks,
        overallCTR: parseFloat(overallCTR)
      }
    });
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching statistics', 
      error: error.message 
    });
  }
});

router.get('/:id', authenticate, async (req, res) => {
  try {
    const ad = await Ad.findByPk(req.params.id);
    
    if (!ad) {
      return res.status(404).json({ 
        success: false,
        message: 'Ad not found' 
      });
    }
    
    res.json({
      success: true,
      ad
    });
  } catch (error) {
    console.error('Error fetching ad:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching ad', 
      error: error.message 
    });
  }
});

module.exports = router;