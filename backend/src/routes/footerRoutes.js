// src/routes/footerRoutes.js
const express = require('express');
const router = express.Router();
const Footer = require('../models/Footer');
const { authenticate } = require('../middleware/auth');
const { Op } = require('sequelize');

// ============================================
// PUBLIC ROUTES
// ============================================

// Get active footer data (public)
router.get('/public', async (req, res) => {
  try {
    const footer = await Footer.findOne({
      where: { isActive: true },
      order: [['updatedAt', 'DESC']]
    });

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer data not found'
      });
    }

    // Parse usefulLinks if it's a string
    let footerData = footer.toJSON();
    if (typeof footerData.usefulLinks === 'string') {
      try {
        footerData.usefulLinks = JSON.parse(footerData.usefulLinks);
      } catch (e) {
        footerData.usefulLinks = [];
      }
    }

    res.json({
      success: true,
      footer: footerData
    });
  } catch (error) {
    console.error('❌ Error fetching footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching footer data',
      error: error.message
    });
  }
});

// ============================================
// PROTECTED ROUTES - ADMIN ONLY
// ============================================

// Get all footer configurations
router.get('/', authenticate, async (req, res) => {
  try {
    const footers = await Footer.findAll({
      order: [['updatedAt', 'DESC']]
    });

    // Parse usefulLinks for each footer
    const formattedFooters = footers.map(footer => {
      const footerData = footer.toJSON();
      if (typeof footerData.usefulLinks === 'string') {
        try {
          footerData.usefulLinks = JSON.parse(footerData.usefulLinks);
        } catch (e) {
          footerData.usefulLinks = [];
        }
      }
      return footerData;
    });

    res.json({
      success: true,
      count: formattedFooters.length,
      footers: formattedFooters
    });
  } catch (error) {
    console.error('❌ Error fetching footers:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching footer configurations',
      error: error.message
    });
  }
});

// Get specific footer by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const footer = await Footer.findByPk(req.params.id);

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer configuration not found'
      });
    }

    // Parse usefulLinks if it's a string
    let footerData = footer.toJSON();
    if (typeof footerData.usefulLinks === 'string') {
      try {
        footerData.usefulLinks = JSON.parse(footerData.usefulLinks);
      } catch (e) {
        footerData.usefulLinks = [];
      }
    }

    res.json({
      success: true,
      footer: footerData
    });
  } catch (error) {
    console.error('❌ Error fetching footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching footer configuration',
      error: error.message
    });
  }
});

// Create new footer configuration
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      address, phone, email, chairman, itEditor, legalAdvisor,
      advisor, coEditor, companyName, pressName, departmentRegNo,
      pressCouncilNo, facebookUrl, whatsappNumber, twitterUrl,
      instagramUrl, youtubeUrl, copyrightText, aboutText,
      logoUrl, bgMediaUrl, bgMediaType, usefulLinks, isActive
    } = req.body;

    // If setting as active, deactivate all others
    if (isActive) {
      await Footer.update(
        { isActive: false },
        { where: { isActive: true } }
      );
    }

    // Ensure bgMediaType is set correctly
    const mediaType = bgMediaType || (bgMediaUrl ? 'image' : null);

    const footer = await Footer.create({
      address, phone, email, chairman, itEditor, legalAdvisor,
      advisor, coEditor, companyName, pressName, departmentRegNo,
      pressCouncilNo, facebookUrl, whatsappNumber, twitterUrl,
      instagramUrl, youtubeUrl, copyrightText, aboutText,
      logoUrl,
      bgMediaUrl,
      bgMediaType: mediaType,
      usefulLinks: usefulLinks || '[]',
      isActive: isActive !== undefined ? isActive : true
    });

    console.log(`✅ Footer created by admin: ${req.admin?.email || 'Unknown'}`);

    res.status(201).json({
      success: true,
      message: 'Footer configuration created successfully',
      footer
    });
  } catch (error) {
    console.error('❌ Error creating footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating footer configuration',
      error: error.message
    });
  }
});

// Update footer configuration
router.put('/:id', authenticate, async (req, res) => {
  try {
    const footer = await Footer.findByPk(req.params.id);

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer configuration not found'
      });
    }

    const {
      address, phone, email, chairman, itEditor, legalAdvisor,
      advisor, coEditor, companyName, pressName, departmentRegNo,
      pressCouncilNo, facebookUrl, whatsappNumber, twitterUrl,
      instagramUrl, youtubeUrl, copyrightText, aboutText,
      logoUrl, bgMediaUrl, bgMediaType, usefulLinks, isActive
    } = req.body;

    // If setting as active, deactivate all others
    if (isActive && !footer.isActive) {
      await Footer.update(
        { isActive: false },
        { where: { isActive: true, id: { [Op.ne]: footer.id } } }
      );
    }

    // Prepare update data
    const updateData = {
      address: address !== undefined ? address : footer.address,
      phone: phone !== undefined ? phone : footer.phone,
      email: email !== undefined ? email : footer.email,
      chairman: chairman !== undefined ? chairman : footer.chairman,
      itEditor: itEditor !== undefined ? itEditor : footer.itEditor,
      legalAdvisor: legalAdvisor !== undefined ? legalAdvisor : footer.legalAdvisor,
      advisor: advisor !== undefined ? advisor : footer.advisor,
      coEditor: coEditor !== undefined ? coEditor : footer.coEditor,
      companyName: companyName !== undefined ? companyName : footer.companyName,
      pressName: pressName !== undefined ? pressName : footer.pressName,
      departmentRegNo: departmentRegNo !== undefined ? departmentRegNo : footer.departmentRegNo,
      pressCouncilNo: pressCouncilNo !== undefined ? pressCouncilNo : footer.pressCouncilNo,
      facebookUrl: facebookUrl !== undefined ? facebookUrl : footer.facebookUrl,
      whatsappNumber: whatsappNumber !== undefined ? whatsappNumber : footer.whatsappNumber,
      twitterUrl: twitterUrl !== undefined ? twitterUrl : footer.twitterUrl,
      instagramUrl: instagramUrl !== undefined ? instagramUrl : footer.instagramUrl,
      youtubeUrl: youtubeUrl !== undefined ? youtubeUrl : footer.youtubeUrl,
      copyrightText: copyrightText !== undefined ? copyrightText : footer.copyrightText,
      aboutText: aboutText !== undefined ? aboutText : footer.aboutText,
      logoUrl: logoUrl !== undefined ? logoUrl : footer.logoUrl,
      isActive: isActive !== undefined ? isActive : footer.isActive
    };

    // Handle background media
    if (bgMediaUrl !== undefined) {
      updateData.bgMediaUrl = bgMediaUrl;
    }
    if (bgMediaType !== undefined) {
      updateData.bgMediaType = bgMediaType;
    } else if (bgMediaUrl) {
      // Auto-detect media type if not provided
      updateData.bgMediaType = bgMediaUrl.startsWith('data:video') ? 'video' : 'image';
    }

    // Handle usefulLinks
    if (usefulLinks !== undefined) {
      updateData.usefulLinks = typeof usefulLinks === 'string' 
        ? usefulLinks 
        : JSON.stringify(usefulLinks || []);
    }

    await footer.update(updateData);

    console.log(`✅ Footer updated by admin: ${req.admin?.email || 'Unknown'}`);

    // Fetch updated footer with parsed data
    const updatedFooter = await Footer.findByPk(footer.id);
    let footerData = updatedFooter.toJSON();
    if (typeof footerData.usefulLinks === 'string') {
      try {
        footerData.usefulLinks = JSON.parse(footerData.usefulLinks);
      } catch (e) {
        footerData.usefulLinks = [];
      }
    }

    res.json({
      success: true,
      message: 'Footer configuration updated successfully',
      footer: footerData
    });
  } catch (error) {
    console.error('❌ Error updating footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating footer configuration',
      error: error.message
    });
  }
});

// Delete footer configuration
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const footer = await Footer.findByPk(req.params.id);

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer configuration not found'
      });
    }

    // If deleting active footer, activate another one
    if (footer.isActive) {
      const anotherFooter = await Footer.findOne({
        where: { id: { [Op.ne]: footer.id } },
        order: [['updatedAt', 'DESC']]
      });
      if (anotherFooter) {
        await anotherFooter.update({ isActive: true });
      }
    }

    await footer.destroy();

    console.log(`✅ Footer deleted by admin: ${req.admin?.email || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Footer configuration deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting footer configuration',
      error: error.message
    });
  }
});

// Toggle active status
router.patch('/:id/toggle', authenticate, async (req, res) => {
  try {
    const footer = await Footer.findByPk(req.params.id);

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer configuration not found'
      });
    }

    // If activating this footer, deactivate all others
    if (!footer.isActive) {
      await Footer.update(
        { isActive: false },
        { where: { isActive: true, id: { [Op.ne]: footer.id } } }
      );
    }

    footer.isActive = !footer.isActive;
    await footer.save();

    console.log(`✅ Footer toggled by admin: ${req.admin?.email || 'Unknown'}`);

    res.json({
      success: true,
      message: `Footer ${footer.isActive ? 'activated' : 'deactivated'} successfully`,
      footer
    });
  } catch (error) {
    console.error('❌ Error toggling footer status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling footer status',
      error: error.message
    });
  }
});

// Bulk update - set one footer as active
router.patch('/set-active/:id', authenticate, async (req, res) => {
  try {
    const footer = await Footer.findByPk(req.params.id);

    if (!footer) {
      return res.status(404).json({
        success: false,
        message: 'Footer configuration not found'
      });
    }

    // Deactivate all footers
    await Footer.update(
      { isActive: false },
      { where: {} }
    );

    // Activate the selected footer
    await footer.update({ isActive: true });

    console.log(`✅ Footer set as active by admin: ${req.admin?.email || 'Unknown'}`);

    res.json({
      success: true,
      message: 'Footer set as active successfully',
      footer
    });
  } catch (error) {
    console.error('❌ Error setting active footer:', error);
    res.status(500).json({
      success: false,
      message: 'Error setting active footer',
      error: error.message
    });
  }
});

// Get footer statistics
router.get('/stats', authenticate, async (req, res) => {
  try {
    const total = await Footer.count();
    const active = await Footer.count({ where: { isActive: true } });
    const inactive = await Footer.count({ where: { isActive: false } });

    // Get latest update
    const latest = await Footer.findOne({
      order: [['updatedAt', 'DESC']],
      attributes: ['id', 'companyName', 'updatedAt']
    });

    res.json({
      success: true,
      stats: {
        total,
        active,
        inactive,
        latest: latest ? {
          id: latest.id,
          companyName: latest.companyName,
          updatedAt: latest.updatedAt
        } : null
      }
    });
  } catch (error) {
    console.error('❌ Error fetching footer stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching footer statistics',
      error: error.message
    });
  }
});

module.exports = router;