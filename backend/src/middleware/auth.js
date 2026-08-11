const jwt = require('jsonwebtoken');
const { errorResponse } = require('../utils/responseHandler');
const Admin = require('../models/Admin');

const authenticate = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'No token provided', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if admin exists and is active
    const admin = await Admin.findByPk(decoded.id);
    if (!admin) {
      return errorResponse(res, 'Admin not found', 401);
    }

    if (!admin.isActive) {
      return errorResponse(res, 'Your account has been deactivated', 403);
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 'Invalid token', 401);
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 'Token expired', 401);
    }
    return errorResponse(res, 'Authentication failed', 401);
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return errorResponse(res, 'Authentication required', 401);
    }
    if (!roles.includes(req.admin.role)) {
      return errorResponse(res, `Access denied. ${roles.join(' or ')} role required.`, 403);
    }
    next();
  };
};

module.exports = { authenticate, authorize };