const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const VisitLog = require('../models/VisitLog');
const { authenticate, authorize } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/responseHandler');

// Public - Record a visit (called on every page load / refresh)
router.post('/record', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [visit, created] = await VisitLog.findOrCreate({
      where: { date: today },
      defaults: { date: today, count: 1 }
    });

    if (!created) {
      visit.count += 1;
      await visit.save();
    }

    res.status(200).json({ success: true, message: 'Visit recorded' });
  } catch (error) {
    console.error('❌ Error recording visit:', error);
    errorResponse(res, 'Failed to record visit', 500);
  }
});

// Protected - Get visit statistics
router.get('/stats', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [todayRow, yesterdayRow] = await Promise.all([
      VisitLog.findOne({ where: { date: today } }),
      VisitLog.findOne({ where: { date: yesterday } })
    ]);

    const totalVisits = await VisitLog.sum('count') || 0;

    const weekRows = await VisitLog.findAll({
      where: { date: { [Op.gte]: weekAgo, [Op.lte]: today } },
      order: [['date', 'ASC']]
    });

    const thisWeek = weekRows.reduce((sum, row) => sum + row.count, 0);

    const daily = weekRows.map(row => ({
      date: row.date,
      count: row.count
    }));

    successResponse(res, 'Visit statistics fetched successfully', {
      totalVisits,
      todayVisits: todayRow ? todayRow.count : 0,
      yesterdayVisits: yesterdayRow ? yesterdayRow.count : 0,
      thisWeek,
      daily
    });
  } catch (error) {
    console.error('❌ Error fetching visit stats:', error);
    errorResponse(res, 'Failed to fetch visit statistics', 500);
  }
});

module.exports = router;
