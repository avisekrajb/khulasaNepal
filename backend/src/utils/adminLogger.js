const AdminLog = require('../models/AdminLog');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || null;
};

async function logAdminAction(req, { action, entityType, entityId = null, description = '', details = null }) {
  try {
    if (!req.admin) return null;
    await AdminLog.create({
      adminId: req.admin.id,
      adminEmail: req.admin.email,
      action,
      entityType,
      entityId: entityId != null ? String(entityId) : null,
      description,
      details: details ? JSON.stringify(details) : null,
      ipAddress: getClientIp(req)
    });
  } catch (error) {
    console.error('❌ Error logging admin action:', error.message);
    return null;
  }
}

module.exports = { logAdminAction, getClientIp };
