const { errorResponse } = require('../utils/responseHandler');

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateRegister = (req, res, next) => {
  const { email, password } = req.body;

  // Check if fields are present
  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    return errorResponse(res, 'Invalid email format', 400);
  }

  // Validate password strength
  if (password.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters long', 400);
  }

  next();
};

const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Check if fields are present
  if (!email || !password) {
    return errorResponse(res, 'Email and password are required', 400);
  }

  // Validate email format
  if (!emailRegex.test(email)) {
    return errorResponse(res, 'Invalid email format', 400);
  }

  next();
};

const validateUpdate = (req, res, next) => {
  const { email, password } = req.body;

  // Check if at least one field is present
  if (!email && !password) {
    return errorResponse(res, 'At least one field (email or password) is required', 400);
  }

  // Validate email format if provided
  if (email && !emailRegex.test(email)) {
    return errorResponse(res, 'Invalid email format', 400);
  }

  // Validate password strength if provided
  if (password && password.length < 6) {
    return errorResponse(res, 'Password must be at least 6 characters long', 400);
  }

  next();
};

module.exports = {
  validateRegister,
  validateLogin,
  validateUpdate
};