const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const Comment = require('../models/Comment');
const News = require('../models/News');
const { authenticate, authorize } = require('../middleware/auth');
const { logAdminAction } = require('../utils/adminLogger');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/comments';
    if (file.fieldname === 'voice') {
      uploadPath = 'uploads/comments/voice';
    } else if (file.fieldname === 'video') {
      uploadPath = 'uploads/comments/video';
    }
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `comment-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === 'voice') {
    const allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed for voice comments'), false);
    }
  } else if (file.fieldname === 'video') {
    const allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed for video comments'), false);
    }
  } else {
    cb(null, true);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024
  }
});

// ============================================
// PUBLIC ROUTES
// ============================================

// Get comments for a news article
router.get('/news/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;
    const { page = 1, limit = 15 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: {
        newsId: newsId,
        parentId: null,
        isActive: true
      },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const commentsWithReplies = await Promise.all(rows.map(async (comment) => {
      const replies = await Comment.findAll({
        where: {
          parentId: comment.id,
          isActive: true
        },
        order: [['createdAt', 'ASC']],
        limit: 8
      });

      const totalReplies = await Comment.count({
        where: {
          parentId: comment.id,
          isActive: true
        }
      });

      return {
        ...comment.toJSON(),
        replies: replies,
        totalReplies: totalReplies,
        hasMoreReplies: totalReplies > 8
      };
    }));

    successResponse(res, 'Comments fetched successfully', {
      comments: commentsWithReplies,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    errorResponse(res, 'Failed to fetch comments', 500);
  }
});

// Get replies for a specific comment
router.get('/:commentId/replies', async (req, res) => {
  try {
    const { commentId } = req.params;
    const { page = 1, limit = 8 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Comment.findAndCountAll({
      where: {
        parentId: commentId,
        isActive: true
      },
      order: [['createdAt', 'ASC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    successResponse(res, 'Replies fetched successfully', {
      replies: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching replies:', error);
    errorResponse(res, 'Failed to fetch replies', 500);
  }
});

// Add a comment
router.post('/', upload.fields([
  { name: 'voice', maxCount: 1 },
  { name: 'video', maxCount: 1 }
]), async (req, res) => {
  try {
    const { newsId, parentId, userName, text, commentType } = req.body;

    if (!newsId || !userName) {
      return errorResponse(res, 'News ID and user name are required', 400);
    }

    if (text && text.length > 200) {
      return errorResponse(res, 'Text comment cannot exceed 200 characters', 400);
    }

    let type = commentType || 'text';
    let voiceUrl = null;
    let videoUrl = null;

    if (type === 'voice' && req.files && req.files.voice) {
      voiceUrl = `/uploads/comments/voice/${req.files.voice[0].filename}`;
    } else if (type === 'video' && req.files && req.files.video) {
      videoUrl = `/uploads/comments/video/${req.files.video[0].filename}`;
    } else if (type === 'text' && !text) {
      return errorResponse(res, 'Text comment is required for text type', 400);
    }

    const comment = await Comment.create({
      newsId,
      parentId: parentId || null,
      userName: userName.trim(),
      text: text || null,
      voiceUrl,
      videoUrl,
      commentType: type,
      likes: 0
    });

    successResponse(res, 'Comment added successfully', comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    errorResponse(res, 'Failed to add comment', 500);
  }
});

// Like a comment
router.post('/:commentId/like', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    comment.likes = comment.likes + 1;
    await comment.save();

    successResponse(res, 'Comment liked successfully', { likes: comment.likes });
  } catch (error) {
    console.error('Error liking comment:', error);
    errorResponse(res, 'Failed to like comment', 500);
  }
});

// Delete a comment (soft delete)
router.delete('/:commentId', async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    comment.isActive = false;
    await comment.save();

    successResponse(res, 'Comment deleted successfully');
  } catch (error) {
    console.error('Error deleting comment:', error);
    errorResponse(res, 'Failed to delete comment', 500);
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// Admin - Get all comments with pagination
router.get('/admin/all', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    console.log('📊 Admin comments fetch started');
    const { page = 1, limit = 20, type = 'all' } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { isActive: true };
    if (type !== 'all') {
      whereClause.commentType = type;
    }

    console.log('🔍 Where clause:', whereClause);

    const { count, rows } = await Comment.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    console.log(`✅ Found ${count} comments`);

    // Get news titles separately
    const commentsWithNews = await Promise.all(rows.map(async (comment) => {
      let news = null;
      if (comment.newsId) {
        try {
          news = await News.findOne({
            where: { id: comment.newsId },
            attributes: ['id', 'title', 'category', 'image']
          });
        } catch (err) {
          console.error(`Error fetching news for comment ${comment.id}:`, err);
        }
      }
      return {
        ...comment.toJSON(),
        news: news
      };
    }));

    successResponse(res, 'Comments fetched successfully', {
      comments: commentsWithNews,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin comments:', error);
    errorResponse(res, 'Failed to fetch comments: ' + error.message, 500);
  }
});

// Admin - Get comment statistics (registered before /admin/:commentId)
router.get('/admin/stats', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const totalComments = await Comment.count({
      where: { isActive: true }
    });

    const textComments = await Comment.count({
      where: { 
        isActive: true,
        commentType: 'text'
      }
    });

    const voiceComments = await Comment.count({
      where: { 
        isActive: true,
        commentType: 'voice'
      }
    });

    const videoComments = await Comment.count({
      where: { 
        isActive: true,
        commentType: 'video'
      }
    });

    const totalLikes = await Comment.sum('likes', {
      where: { isActive: true }
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayComments = await Comment.count({
      where: {
        isActive: true,
        createdAt: {
          [Op.gte]: today
        }
      }
    });

    successResponse(res, 'Comment statistics fetched successfully', {
      totalComments,
      textComments,
      voiceComments,
      videoComments,
      totalLikes,
      todayComments
    });
  } catch (error) {
    console.error('Error fetching comment stats:', error);
    errorResponse(res, 'Failed to fetch statistics', 500);
  }
});

// Admin - Get comment by ID with full details
router.get('/admin/:commentId', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    // Get news separately
    let news = null;
    if (comment.newsId) {
      news = await News.findOne({
        where: { id: comment.newsId },
        attributes: ['id', 'title', 'category', 'image']
      });
    }

    // Get reply count
    const replyCount = await Comment.count({
      where: {
        parentId: commentId,
        isActive: true
      }
    });

    successResponse(res, 'Comment fetched successfully', {
      ...comment.toJSON(),
      news: news,
      replyCount
    });
  } catch (error) {
    console.error('Error fetching comment:', error);
    errorResponse(res, 'Failed to fetch comment', 500);
  }
});

// Admin - Delete comment permanently
router.delete('/admin/:commentId', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { commentId } = req.params;
    
    const comment = await Comment.findByPk(commentId);
    if (!comment) {
      return errorResponse(res, 'Comment not found', 404);
    }

    await Comment.destroy({
      where: {
        parentId: commentId
      }
    });

    await comment.destroy();

    // Audit log
    await logAdminAction(req, {
      action: 'delete',
      entityType: 'comment',
      entityId: commentId,
      description: `Deleted comment by "${comment.userName}"`,
      details: { commentId, text: comment.text, commentType: comment.commentType }
    });

    successResponse(res, 'Comment and its replies deleted permanently');
  } catch (error) {
    console.error('Error deleting comment:', error);
    errorResponse(res, 'Failed to delete comment', 500);
  }
});

// Admin - Bulk delete comments
router.delete('/admin/bulk-delete', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { commentIds } = req.body;

    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return errorResponse(res, 'Comment IDs are required', 400);
    }

    await Comment.destroy({
      where: {
        parentId: commentIds
      }
    });

    const deleted = await Comment.destroy({
      where: {
        id: commentIds
      }
    });

    successResponse(res, `${deleted} comments deleted successfully`);
  } catch (error) {
    console.error('Error bulk deleting comments:', error);
    errorResponse(res, 'Failed to delete comments', 500);
  }
});

module.exports = router;