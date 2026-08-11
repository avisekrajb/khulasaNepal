// newsRoutes.js - COMPLETE WITH SEARCH FUNCTIONALITY
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const News = require('../models/News');
const Category = require('../models/Category');
const { authenticate } = require('../middleware/auth');
const { logAdminAction } = require('../utils/adminLogger');

// ============================================
// CACHE CONFIGURATION
// ============================================

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(prefix, params = {}) {
  return `${prefix}_${JSON.stringify(params)}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    console.log(`✅ Cache HIT: ${key}`);
    return cached.data;
  }
  console.log(`🔄 Cache MISS: ${key}`);
  return null;
}

function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
  console.log(`💾 Cached: ${key}`);
}

// Clear cache every 10 minutes
setInterval(() => {
  cache.clear();
  console.log('🗑️ Cache cleared');
}, 10 * 60 * 1000);

// ============================================
// UPLOAD CONFIGURATION
// ============================================

const uploadDir = './uploads/news';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});

const uploadImages = upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'journalistImage', maxCount: 1 }
]);

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getCategoryMeta(categoryValue) {
  try {
    const category = await Category.findOne({ 
      where: { value: categoryValue } 
    });
    
    return category ? {
      value: category.value,
      label: category.label,
      icon: category.icon,
      color: category.color,
      displayOrder: category.displayOrder
    } : null;
  } catch (error) {
    console.error('Error fetching category meta:', error);
    return null;
  }
}

async function validateCategory(categoryValue, strict = false) {
  const category = await Category.findOne({ 
    where: { value: categoryValue } 
  });
  
  if (!category) {
    console.warn(`⚠️  Category "${categoryValue}" not found in database`);
    return !strict;
  }
  
  if (!category.isActive) {
    console.warn(`⚠️  Category "${categoryValue}" is inactive`);
    return !strict;
  }
  
  return true;
}

async function getActiveCategoryValues() {
  const categories = await Category.findAll({
    where: { isActive: true },
    attributes: ['value'],
    order: [['displayOrder', 'ASC']]
  });
  
  return categories.map(cat => cat.value);
}

function cleanupFiles(files) {
  if (!files) return;
  
  Object.values(files).forEach(fileArray => {
    fileArray.forEach(file => {
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });
  });
}

// ============================================
// ============================================
// SEARCH ROUTE - ADD THIS!
// ============================================
// ============================================

// GET /api/news/search - Search news articles
router.get('/search', async (req, res) => {
  try {
    const { q, category, limit = 20, page = 1 } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required',
        data: []
      });
    }

    console.log(`🔍 Search query: "${q}"`);

    // Check cache first
    const cacheKey = getCacheKey('search', { q: q.trim(), category, limit, page });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ ...cachedData, cached: true });
    }

    // Build search conditions
    const searchTerm = q.trim();
    const whereClause = {
      status: 'published',
      [Op.or]: [
        { title: { [Op.like]: `%${searchTerm}%` } },
        { subtitle: { [Op.like]: `%${searchTerm}%` } },
        { paragraph: { [Op.like]: `%${searchTerm}%` } },
        { journalistName: { [Op.like]: `%${searchTerm}%` } }
      ]
    };

    // Add category filter if provided
    if (category) {
      whereClause.category = category;
    }

    // Calculate pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Execute search with pagination
    const { count, rows: results } = await News.findAndCountAll({
      where: whereClause,
      order: [
        ['isFeatured', 'DESC'],
        ['publishedDate', 'DESC']
      ],
      limit: parseInt(limit),
      offset: offset
    });

    // Enhance results with category metadata
    const enhancedResults = await Promise.all(
      results.map(async (item) => ({
        ...item.toJSON(),
        categoryMeta: await getCategoryMeta(item.category)
      }))
    );

    const response = {
      success: true,
      data: enhancedResults,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      query: searchTerm
    };

    // Cache results
    setCache(cacheKey, response);

    console.log(`✅ Search found ${count} results for "${searchTerm}"`);
    res.json(response);

  } catch (error) {
    console.error('❌ Search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error performing search',
      error: error.message,
      data: []
    });
  }
});

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/news/categories - Return all available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await Category.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']],
      attributes: ['value', 'label', 'icon', 'color', 'displayOrder']
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

// GET /api/news - Get all news with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, limit, featured, status } = req.query;
    
    const cacheKey = getCacheKey('all-news', { category, limit, featured, status });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ ...cachedData, cached: true });
    }
    
    const whereClause = { status: status || 'published' };
    
    if (category) {
      const isValid = await validateCategory(category, false);
      if (!isValid) {
        console.warn(`⚠️  Proceeding with potentially invalid category: ${category}`);
      }
      whereClause.category = category;
    }
    
    if (featured === 'true') {
      whereClause.isFeatured = true;
    }
    
    const news = await News.findAll({
      where: whereClause,
      order: [['publishedDate', 'DESC']],
      limit: limit ? parseInt(limit) : undefined
    });
    
    const enhancedNews = await Promise.all(
      news.map(async (item) => ({
        ...item.toJSON(),
        categoryMeta: await getCategoryMeta(item.category)
      }))
    );
    
    const result = {
      success: true,
      count: enhancedNews.length,
      data: enhancedNews
    };
    
    setCache(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching news', 
      error: error.message 
    });
  }
});

// GET /api/news/category/:category - Get news by specific category
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const { limit, excludeIds, status } = req.query;
    
    const cacheKey = getCacheKey('category', { category, limit, excludeIds, status });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ ...cachedData, cached: true });
    }
    
    const isValid = await validateCategory(category, false);
    if (!isValid) {
      console.warn(`⚠️  Fetching news for unvalidated category: ${category}`);
    }
    
    const whereClause = { 
      category,
      status: status || 'published'
    };
    
    if (excludeIds) {
      const idsArray = excludeIds.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (idsArray.length > 0) {
        whereClause.id = { [Op.notIn]: idsArray };
      }
    }
    
    const news = await News.findAll({
      where: whereClause,
      order: [['publishedDate', 'DESC']],
      limit: limit ? parseInt(limit) : undefined
    });
    
    const categoryMeta = await getCategoryMeta(category);
    
    const result = {
      success: true,
      category: categoryMeta || { value: category, label: category },
      count: news.length,
      data: news
    };
    
    setCache(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching category news:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching category news', 
      error: error.message 
    });
  }
});

// GET /api/news/homepage - Get organized homepage data
router.get('/homepage', async (req, res) => {
  try {
    const { mainLimit = 20 } = req.query;
    
    const cacheKey = getCacheKey('homepage', { mainLimit });
    const cachedData = getFromCache(cacheKey);
    if (cachedData) {
      return res.json({ ...cachedData, cached: true });
    }
    
    console.log(' Homepage endpoint called');
    
    const activeCategories = await Category.findAll({
      where: { isActive: true },
      order: [['displayOrder', 'ASC']],
      attributes: ['value', 'label', 'icon', 'color', 'displayOrder']
    });
    
    if (activeCategories.length === 0) {
      console.warn('  No active categories found - returning empty data');
      return res.json({
        success: true,
        message: 'No active categories found',
        main: [],
        categories: {}
      });
    }
    
    const allNewsForMain = await News.findAll({
      where: { status: 'published' },
      order: [['publishedDate', 'DESC']],
      limit: parseInt(mainLimit)
    });
    
    const mainIds = allNewsForMain.map(n => n.id);
    
    const categoryPromises = activeCategories.map(cat =>
      News.findAll({
        where: { 
          category: cat.value,
          status: 'published',
          id: { [Op.notIn]: mainIds }
        },
        order: [['publishedDate', 'DESC']]
      })
    );
    
    const categoryResults = await Promise.all(categoryPromises);
    
    const result = {
      success: true,
      main: allNewsForMain,
      categories: {}
    };
    
    activeCategories.forEach((cat, index) => {
      const categoryKey = cat.value;
      result.categories[categoryKey] = {
        meta: {
          value: cat.value,
          label: cat.label,
          icon: cat.icon,
          color: cat.color,
          displayOrder: cat.displayOrder
        },
        articles: categoryResults[index],
        count: categoryResults[index].length
      };
      
      result[categoryKey] = categoryResults[index];
    });
    
    console.log('✓ Homepage data prepared:', {
      main: result.main.length,
      categories: activeCategories.length,
      ...activeCategories.reduce((acc, cat) => ({
        ...acc,
        [cat.value]: result[cat.value]?.length || 0
      }), {})
    });
    
    setCache(cacheKey, result);
    
    res.json(result);
  } catch (error) {
    console.error('❌ Homepage error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching homepage data', 
      error: error.message 
    });
  }
});

// GET /api/news/mixed-feed/:excludeId - Get mixed category feed
router.get('/mixed-feed/:excludeId', async (req, res) => {
  try {
    const { excludeId } = req.params;
    const { limit = 18 } = req.query;
    
    console.log(`🔀 Mixed feed requested, excluding ID: ${excludeId}`);
    
    const activeCategories = await getActiveCategoryValues();
    
    if (activeCategories.length === 0) {
      console.warn('⚠️  No active categories for mixed feed');
      return res.json({
        success: true,
        message: 'No active categories found',
        data: []
      });
    }
    
    const articlesPerCategory = Math.ceil(parseInt(limit) / activeCategories.length);
    
    const categoryPromises = activeCategories.map(category =>
      News.findAll({
        where: {
          category,
          id: { [Op.ne]: parseInt(excludeId) },
          status: 'published'
        },
        order: [['publishedDate', 'DESC']],
        limit: articlesPerCategory
      })
    );
    
    const categoryResults = await Promise.all(categoryPromises);
    
    let allNews = [];
    for (let i = 0; i < categoryResults.length; i++) {
      const articles = categoryResults[i];
      const categoryMeta = await getCategoryMeta(activeCategories[i]);
      
      articles.forEach(article => {
        allNews.push({
          ...article.toJSON(),
          categoryMeta
        });
      });
    }
    
    allNews.sort((a, b) => new Date(b.publishedDate) - new Date(a.publishedDate));
    allNews = allNews.slice(0, parseInt(limit));
    
    console.log(`✓ Mixed feed: ${allNews.length} articles from ${activeCategories.length} categories`);
    
    res.json({
      success: true,
      count: allNews.length,
      data: allNews
    });
    
  } catch (error) {
    console.error('❌ Mixed feed error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching mixed feed', 
      error: error.message 
    });
  }
});

// GET /api/news/:id - Get single news by ID
router.get('/:id', async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: 'News not found' 
      });
    }
    
    await news.increment('views');
    
    const categoryMeta = await getCategoryMeta(news.category);
    
    res.json({
      success: true,
      data: {
        ...news.toJSON(),
        categoryMeta
      }
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching news', 
      error: error.message 
    });
  }
});

// ============================================
// PROTECTED ROUTES (Admin only)
// ============================================

// POST /api/news - Create news
router.post('/', authenticate, uploadImages, async (req, res) => {
  try {
    const { 
      title, 
      subtitle, 
      paragraph, 
      publishedDate, 
      journalistName,
      category,
      isFeatured,
      status
    } = req.body;
    
    console.log('📝 Creating news article:', { title, category });
    
    if (!title || !category) {
      cleanupFiles(req.files);
      return res.status(400).json({ 
        success: false,
        message: 'Title and category are required' 
      });
    }
    
    const isValidCategory = await validateCategory(category, false);
    if (!isValidCategory) {
      console.warn(`⚠️  Creating article with unvalidated category: ${category}`);
    }
    
    const image = req.files?.['image'] 
      ? `/uploads/news/${req.files['image'][0].filename}` 
      : req.body.imageUrl;
      
    const journalistImage = req.files?.['journalistImage']
      ? `/uploads/news/${req.files['journalistImage'][0].filename}`
      : req.body.journalistImageUrl;
    
    if (!image) {
      cleanupFiles(req.files);
      return res.status(400).json({ 
        success: false,
        message: 'News image is required' 
      });
    }
    
    const news = await News.create({
      category,
      image,
      title,
      subtitle: subtitle || null,
      paragraph: paragraph || null,
      publishedDate: publishedDate ? new Date(publishedDate) : new Date(),
      journalistName,
      journalistImage,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      status: status || 'published'
    });
    
    const categoryMeta = await getCategoryMeta(category);
    console.log(`✅ News created: "${title}" in ${categoryMeta?.label || category}`);
    await logAdminAction(req, { action: 'create', entityType: 'news', description: `News "${title}" created in ${categoryMeta?.label || category}`, entityId: news.id });
    clearNewsCache();
    res.status(201).json({ 
      success: true,
      message: `News created successfully in ${categoryMeta?.label || category}`, 
      news: {
        ...news.toJSON(),
        categoryMeta
      }
    });
  } catch (error) {
    console.error('❌ Error creating news:', error);
    cleanupFiles(req.files);
    
    res.status(400).json({ 
      success: false,
      message: 'Error creating news', 
      error: error.message 
    });
  }
});

// PUT /api/news/:id - Update news
router.put('/:id', authenticate, uploadImages, async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      cleanupFiles(req.files);
      return res.status(404).json({ 
        success: false,
        message: 'News not found' 
      });
    }
    
    const { 
      title, 
      subtitle, 
      paragraph, 
      publishedDate, 
      journalistName,
      category,
      isFeatured,
      status
    } = req.body;
    
    if (category && category !== news.category) {
      const isValidCategory = await validateCategory(category, false);
      if (!isValidCategory) {
        console.warn(`⚠️  Updating to unvalidated category: ${category}`);
      }
    }
    
    const updateData = {
      title: title || news.title,
      subtitle: subtitle !== undefined ? subtitle : news.subtitle,
      paragraph: paragraph !== undefined ? paragraph : news.paragraph,
      publishedDate: publishedDate ? new Date(publishedDate) : news.publishedDate,
      journalistName: journalistName !== undefined ? journalistName : news.journalistName,
      category: category || news.category,
      isFeatured: isFeatured !== undefined ? (isFeatured === 'true' || isFeatured === true) : news.isFeatured,
      status: status || news.status
    };
    
    if (req.files?.['image']) {
      if (news.image && news.image.startsWith('/uploads/news/')) {
        const oldPath = path.join('.', news.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = `/uploads/news/${req.files['image'][0].filename}`;
    } else if (req.body.imageUrl !== undefined) {
      if (news.image && news.image.startsWith('/uploads/news/')) {
        const oldPath = path.join('.', news.image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.image = req.body.imageUrl || news.image;
    }
    
    if (req.files?.['journalistImage']) {
      if (news.journalistImage && news.journalistImage.startsWith('/uploads/news/')) {
        const oldPath = path.join('.', news.journalistImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.journalistImage = `/uploads/news/${req.files['journalistImage'][0].filename}`;
    } else if (req.body.journalistImageUrl !== undefined) {
      if (news.journalistImage && news.journalistImage.startsWith('/uploads/news/')) {
        const oldPath = path.join('.', news.journalistImage);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updateData.journalistImage = req.body.journalistImageUrl || news.journalistImage;
    }
    
    await news.update(updateData);
    
    const categoryMeta = await getCategoryMeta(news.category);
    console.log(`✅ News updated: "${news.title}" in ${categoryMeta?.label || news.category}`);
    await logAdminAction(req, { action: 'update', entityType: 'news', description: `News "${news.title}" updated`, entityId: news.id });
    clearNewsCache();
    res.json({ 
      success: true,
      message: 'News updated successfully', 
      news: {
        ...news.toJSON(),
        categoryMeta
      }
    });
  } catch (error) {
    console.error('❌ Error updating news:', error);
    cleanupFiles(req.files);
    
    res.status(400).json({ 
      success: false,
      message: 'Error updating news', 
      error: error.message 
    });
  }
});

// DELETE /api/news/:id - Delete news
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const news = await News.findByPk(req.params.id);
    
    if (!news) {
      return res.status(404).json({ 
        success: false,
        message: 'News not found' 
      });
    }
    
    const newsTitle = news.title;
    const categoryMeta = await getCategoryMeta(news.category);
    
    if (news.image && news.image.startsWith('/uploads/news/')) {
      const imagePath = path.join('.', news.image);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    
    if (news.journalistImage && news.journalistImage.startsWith('/uploads/news/')) {
      const journalistPath = path.join('.', news.journalistImage);
      if (fs.existsSync(journalistPath)) fs.unlinkSync(journalistPath);
    }
    
    await news.destroy();
    
    console.log(`✅ News deleted: "${newsTitle}" from ${categoryMeta?.label || news.category}`);
    await logAdminAction(req, { action: 'delete', entityType: 'news', description: `News "${newsTitle}" deleted from ${categoryMeta?.label || news.category}`, entityId: req.params.id });
    clearNewsCache();
    res.json({ 
      success: true,
      message: 'News deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting news:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting news', 
      error: error.message 
    });
  }
});

function clearNewsCache() {
  cache.clear();
  console.log('🗑️ Cache cleared due to data change');
}

module.exports = router;