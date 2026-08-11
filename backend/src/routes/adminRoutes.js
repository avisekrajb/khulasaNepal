const express = require('express');
const router = express.Router();
const Admin = require('../models/Admin');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logAdminAction } = require('../utils/adminLogger');


// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No authentication token provided'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const admin = await Admin.findByPk(decoded.id, {
      attributes: ['id', 'email', 'role', 'isActive', 'createdAt', 'updatedAt']
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated'
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

// Role-based authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${roles.join(' or ')} role required.`
      });
    }

    next();
  };
};

// Invitation token check
const checkInvitationToken = async (req, res, next) => {
  const { invitationToken } = req.body;
  
  if (!invitationToken) {
    return res.status(403).json({ 
      success: false,
      message: 'Invitation token is required for registration' 
    });
  }

  try {
    const Invitation = require('../models/Invitation');
    const { Op } = require('sequelize');
    
    const invitation = await Invitation.findOne({ 
      where: { 
        token: invitationToken,
        used: false,
        expiresAt: { [Op.gt]: new Date() }
      }
    });

    if (!invitation) {
      return res.status(403).json({ 
        success: false,
        message: 'Invalid or expired invitation token' 
      });
    }

    req.invitation = invitation;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error validating invitation',
      error: error.message
    });
  }
};

// Password strength validator
const validatePasswordStrength = (password) => {
  if (!password) return { valid: false, errors: ['Password is required'] };
  
  const errors = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  const weakPasswords = ['password', '12345678', 'admin123', 'password123'];
  if (weakPasswords.includes(password.toLowerCase())) {
    errors.push('Password is too common');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

// ============================================
// RATE LIMITING
// ============================================

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many registration attempts, please try again later'
});
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  skipSuccessfulRequests: true, 
  skip: (req) => req.method === 'OPTIONS', 
  message: 'Too many login attempts, please try again later'
});


const updateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many update attempts, please try again later'
});

// ============================================
// PUBLIC ROUTES
// ============================================

// Register new user with invitation
router.post('/register', 
  registerLimiter,
  checkInvitationToken,
  async (req, res) => {
    try {
      const { email, password, role } = req.body;

      // Validation
      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid email format'
        });
      }

      // Validate password strength
      const passwordCheck = validatePasswordStrength(password);
      if (!passwordCheck.valid) {
        return res.status(400).json({ 
          success: false,
          message: 'Password does not meet security requirements',
          errors: passwordCheck.errors
        });
      }

      // Check if email exists
      const existingAdmin = await Admin.findOne({ where: { email } });
      if (existingAdmin) {
        return res.status(400).json({ 
          success: false,
          message: 'User with this email already exists' 
        });
      }

      // Validate role
      const userRole = role || 'journalist';
      if (!['admin', 'journalist'].includes(userRole)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid role. Must be admin or journalist'
        });
      }

      // Create user
      const admin = await Admin.create({ 
        email, 
        password,
        role: userRole,
        isActive: true
      });

      // Mark invitation as used
      await req.invitation.update({ 
        used: true,
        usedBy: admin.id,
        usedAt: new Date()
      });

      console.log(`✅ New ${userRole} registered: ${email}`);

      // Audit log
      await logAdminAction(req, {
        action: 'create',
        entityType: 'admin',
        entityId: admin.id,
        description: `Registered new ${userRole}: ${admin.email}`,
        details: { email: admin.email, role: admin.role }
      });

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('❌ Registration error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error creating account', 
        error: error.message 
      });
    }
  }
);

// Login
router.post('/login', 
  // loginLimiter,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required'
        });
      }

      const admin = await Admin.findOne({ where: { email } });
      if (!admin) {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Check if user is active
      if (!admin.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Your account has been deactivated. Please contact administrator.'
        });
      }

      const isMatch = await admin.comparePassword(password);
      if (!isMatch) {
        console.log(`❌ Failed login attempt for: ${email}`);
        return res.status(401).json({ 
          success: false,
          message: 'Invalid credentials' 
        });
      }

      // Update last login
      admin.lastLoginAt = new Date();
      await admin.save();

      // Generate token with role
      const token = jwt.sign(
        { id: admin.id, email: admin.email, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
      );

      console.log(`✅ Successful login: ${email} (${admin.role})`);

      // Audit log login
      req.admin = { id: admin.id, email: admin.email, role: admin.role };
      await logAdminAction(req, {
        action: 'login',
        entityType: 'admin',
        entityId: admin.id,
        description: `Admin logged in: ${admin.email}`,
        details: { email: admin.email, role: admin.role }
      });

      res.status(200).json({
        success: true,
        message: 'Login successful',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        },
        token: token
      });
    } catch (error) {
      console.error('❌ Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error logging in', 
        error: error.message 
      });
    }
  }
);

// ============================================
// PROTECTED ROUTES - ALL AUTHENTICATED USERS
// ============================================

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.admin.id, {
      attributes: ['id', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
    });
    
    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      admin
    });
  } catch (error) {
    console.error('❌ Error fetching profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching profile', 
      error: error.message 
    });
  }
});

// Update own profile
router.put('/:id', 
  authenticate, 
  updateLimiter,
  async (req, res) => {
    try {
      const { email, password, currentPassword } = req.body;
      
      // Users can only update their own profile, except superadmins can update any account
      if (req.admin.id !== parseInt(req.params.id) && req.admin.role !== 'superadmin') {
        console.warn(`⚠️  Unauthorized update attempt: User ${req.admin.id} tried to update User ${req.params.id}`);
        return res.status(403).json({ 
          success: false,
          message: 'You can only update your own account' 
        });
      }
      
      const admin = await Admin.findByPk(req.params.id);

      if (!admin) {
        return res.status(404).json({ 
          success: false,
          message: 'User not found' 
        });
      }

      // Handle password update
      if (password) {
        // Superadmins can change their password without the current password
        const isSuperAdmin = req.admin.role === 'superadmin';

        if (!currentPassword && !isSuperAdmin) {
          return res.status(400).json({ 
            success: false,
            message: 'Current password is required to change password' 
          });
        }

        if (!isSuperAdmin) {
          const isCurrentPasswordValid = await admin.comparePassword(currentPassword);
          if (!isCurrentPasswordValid) {
            console.warn(`⚠️  Failed password change attempt for: ${admin.email}`);
            return res.status(401).json({ 
              success: false,
              message: 'Current password is incorrect' 
            });
          }
        }

        const passwordCheck = validatePasswordStrength(password);
        if (!passwordCheck.valid) {
          return res.status(400).json({ 
            success: false,
            message: 'New password does not meet security requirements',
            errors: passwordCheck.errors
          });
        }

        const isSamePassword = await admin.comparePassword(password);
        if (isSamePassword) {
          return res.status(400).json({ 
            success: false,
            message: 'New password must be different from current password' 
          });
        }

        admin.password = password;
      }

      // Update email
      if (email && email !== admin.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid email format'
          });
        }

        const { Op } = require('sequelize');
        const existingAdmin = await Admin.findOne({ 
          where: { 
            email,
            id: { [Op.ne]: admin.id }
          }
        });
        
        if (existingAdmin) {
          return res.status(400).json({ 
            success: false,
            message: 'Email already in use by another user' 
          });
        }
        
        admin.email = email;
      }

      await admin.save();

      console.log(`✅ User updated: ${admin.email}`);

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        user: {
          id: admin.id,
          email: admin.email,
          role: admin.role
        }
      });
    } catch (error) {
      console.error('❌ Error updating user:', error);
      res.status(500).json({ 
        success: false,
        message: 'Error updating user', 
        error: error.message 
      });
    }
  }
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

// Get all users (admin only)
router.get('/', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const { role, isActive, search } = req.query;
    const { Op } = require('sequelize');
    
    const whereClause = {};

    // Admin role cannot view superadmin accounts
    if (req.admin.role !== 'superadmin') {
      whereClause.role = { [Op.ne]: 'superadmin' };
    }
    
    if (role) {
      whereClause.role = role;
    }
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    if (search) {
      whereClause[Op.or] = [
        { email: { [Op.like]: `%${search}%` } }
      ];
    }
    
    const admins = await Admin.findAll({
      where: whereClause,
      attributes: ['id', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: admins.length,
      admins
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
});

// Get user statistics (admin only)
router.get('/stats', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const totalUsers = await Admin.count();
    const totalAdmins = await Admin.count({ where: { role: 'admin' } });
    const totalJournalists = await Admin.count({ where: { role: 'journalist' } });
    const activeUsers = await Admin.count({ where: { isActive: true } });
    const inactiveUsers = await Admin.count({ where: { isActive: false } });
    
    res.json({
      success: true,
      stats: {
        totalUsers,
        totalAdmins,
        totalJournalists,
        activeUsers,
        inactiveUsers
      }
    });
  } catch (error) {
    console.error('❌ Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

// Get specific user (admin only)
router.get('/:id', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id, {
      attributes: ['id', 'email', 'role', 'isActive', 'lastLoginAt', 'createdAt', 'updatedAt']
    });

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Admin role cannot view superadmin accounts
    if (req.admin.role !== 'superadmin' && admin.role === 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Cannot view superadmin accounts.'
      });
    }

    res.status(200).json({
      success: true,
      admin
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error fetching user', 
      error: error.message 
    });
  }
});

// Create new user (admin only)
router.post('/', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { email, password, role } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }
    
    if (!['superadmin', 'admin', 'journalist'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role. Must be superadmin, admin or journalist'
      });
    }

    if (role === 'superadmin' && req.admin.role !== 'superadmin') {
      return res.status(403).json({
        success: false,
        message: 'Only superadmins can create superadmin accounts'
      });
    }
    
    const passwordCheck = validatePasswordStrength(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({ 
        success: false,
        message: 'Password does not meet security requirements',
        errors: passwordCheck.errors
      });
    }
    
    const existingUser = await Admin.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already in use'
      });
    }
    
    const user = await Admin.create({
      email,
      password,
      role: role || 'journalist',
      isActive: true
    });
    
    console.log(`✅ User created: ${user.email} (${user.role}) by Admin ${req.admin.id}`);
    
    // Audit log
    await logAdminAction(req, {
      action: 'create',
      entityType: 'admin',
      entityId: user.id,
      description: `Created ${user.role}: ${user.email}`,
      details: { email: user.email, role: user.role }
    });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('❌ Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
});

// Update user role/status (superadmin only)
router.patch('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const { role, isActive } = req.body;
    
    const user = await Admin.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Prevent admin from modifying their own role/status
    if (user.id === req.admin.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot modify your own role or status'
      });
    }
    
    if (role && ['admin', 'journalist'].includes(role)) {
      user.role = role;
    }
    
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    
    await user.save();
    
    console.log(`✅ User modified: ${user.email} by Admin ${req.admin.id}`);
    
    // Audit log
    await logAdminAction(req, {
      action: 'update',
      entityType: 'admin',
      entityId: user.id,
      description: `Updated admin account: ${user.email}`,
      details: { email: user.email, role: user.role, isActive: user.isActive }
    });
    
    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('❌ Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: error.message
    });
  }
});

// Delete user (superadmin only)
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const admin = await Admin.findByPk(req.params.id);

    if (!admin) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    if (req.admin.id === admin.id) {
      return res.status(403).json({ 
        success: false,
        message: 'You cannot delete your own account' 
      });
    }

    const adminEmail = admin.email;
    await admin.destroy();

    console.log(`✅ User deleted: ${adminEmail} by Admin ${req.admin.id}`);

    // Audit log
    await logAdminAction(req, {
      action: 'delete',
      entityType: 'admin',
      entityId: req.params.id,
      description: `Deleted admin account: ${adminEmail}`,
      details: { email: adminEmail }
    });

    res.status(200).json({ 
      success: true,
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('❌ Error deleting user:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error deleting user', 
      error: error.message 
    });
  }
});

// ============================================
// INVITATION MANAGEMENT (Admin only)
// ============================================

router.post('/invitations/create', authenticate, authorize('superadmin'), async (req, res) => {
  try {
    const Invitation = require('../models/Invitation');
    
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    
    const invitation = await Invitation.create({
      token,
      createdBy: req.admin.id,
      expiresAt,
      used: false
    });
    
    console.log(`✅ Invitation created by Admin ${req.admin.id}`);
    
    // Audit log
    await logAdminAction(req, {
      action: 'create',
      entityType: 'invitation',
      entityId: invitation.id,
      description: 'Created admin invitation link',
      details: { token: invitation.token, expiresAt: invitation.expiresAt }
    });
    
    res.status(201).json({
      success: true,
      message: 'Invitation created successfully',
      token: invitation.token,
      expiresAt: invitation.expiresAt
    });
  } catch (error) {
    console.error('❌ Error creating invitation:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error creating invitation', 
      error: error.message 
    });
  }
});

router.get('/invitations', authenticate, authorize('superadmin', 'admin'), async (req, res) => {
  try {
    const Invitation = require('../models/Invitation');
    
    const invitations = await Invitation.findAll({
      order: [['createdAt', 'DESC']],
      include: [{
        model: Admin,
        as: 'creator',
        attributes: ['id', 'email']
      }]
    });
    
    res.json({
      success: true,
      count: invitations.length,
      invitations
    });
  } catch (error) {
    console.error('❌ Error fetching invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching invitations',
      error: error.message
    });
  }
});

module.exports = router;
module.exports.authenticate = authenticate;
module.exports.authorize = authorize;