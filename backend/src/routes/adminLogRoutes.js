const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const AdminLog = require('../models/AdminLog');
const Admin = require('../models/Admin');
const { authenticate, authorize } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Superadmin - Get all admin logs with pagination and filtering
router.get('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { page = 1, limit = 20, action, entityType, search } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (action) whereClause.action = action;
    if (entityType) whereClause.entityType = entityType;

    if (search) {
      whereClause[Op.or] = [
        { adminEmail: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { entityId: { [Op.like]: `%${search}%` } }
      ];
    }

    const { count, rows } = await AdminLog.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    successResponse(res, 'Admin logs fetched successfully', {
      logs: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching admin logs:', error);
    errorResponse(res, 'Failed to fetch admin logs: ' + error.message, 500);
  }
});

// Superadmin - Get log statistics
router.get('/stats', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const totalLogs = await AdminLog.count();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayLogs = await AdminLog.count({
      where: { createdAt: { [Op.gte]: today } }
    });

    const createLogs = await AdminLog.count({ where: { action: 'create' } });
    const updateLogs = await AdminLog.count({ where: { action: 'update' } });
    const deleteLogs = await AdminLog.count({ where: { action: 'delete' } });

    const activeAdmins = await Admin.count({ where: { isActive: true } });

    successResponse(res, 'Admin log statistics fetched successfully', {
      totalLogs,
      todayLogs,
      createLogs,
      updateLogs,
      deleteLogs,
      activeAdmins
    });
  } catch (error) {
    console.error('❌ Error fetching log stats:', error);
    errorResponse(res, 'Failed to fetch statistics', 500);
  }
});

// Superadmin - Get distinct entity types / actions for filters
router.get('/filters', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const actions = await AdminLog.aggregate('action', 'DISTINCT', { plain: false });
    const entityTypes = await AdminLog.aggregate('entityType', 'DISTINCT', { plain: false });

    successResponse(res, 'Filters fetched successfully', {
      actions: actions.map(a => a.action).filter(Boolean).sort(),
      entityTypes: entityTypes.map(e => e.entityType).filter(Boolean).sort()
    });
  } catch (error) {
    console.error('❌ Error fetching filters:', error);
    errorResponse(res, 'Failed to fetch filters', 500);
  }
});

// Superadmin - Clear logs older than X days (default 90)
router.delete('/purge', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - parseInt(days));

    const deleted = await AdminLog.destroy({
      where: { createdAt: { [Op.lt]: cutoff } }
    });

    successResponse(res, `Deleted ${deleted} log entries older than ${days} days`, { deleted });
  } catch (error) {
    console.error('❌ Error purging admin logs:', error);
    errorResponse(res, 'Failed to purge admin logs', 500);
  }
});

module.exports = router;
