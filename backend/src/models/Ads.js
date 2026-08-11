// models/Ads.js - COMPLETE PRODUCTION VERSION WITH GIF SUPPORT
const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/db');

const Ad = sequelize.define('Ad', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  position: {
    type: DataTypes.ENUM(
      'navbar-top',
      'header', 
      'sidebar-top', 
      'sidebar-middle', 
      'sidebar-bottom', 
      'article-top', 
      'article-middle', 
      'article-bottom',
      'homepage-banner',
      'category-banner'
    ),
    allowNull: false,
    defaultValue: 'sidebar-top'
  },
  
  imageUrl: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'imageUrl',
    validate: {
      notEmpty: true
    }
  },
  
  // NEW: Store MIME type for GIF support
  imageMimeType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'imageMimeType'
  },
  
  linkUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'linkUrl'
  },
  
  openInNewTab: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'openInNewTab'
  },
  
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'isActive'
  },
  
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'startDate'
  },
  
  endDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'endDate'
  },
  
  impressions: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  clicks: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  width: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  height: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  advertiser: {
    type: DataTypes.STRING(200),
    allowNull: true
  },
  
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  targetPages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const val = this.getDataValue('targetPages');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val || [];
    }
  },

  excludePages: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const val = this.getDataValue('excludePages');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val || [];
    }
  },

  targetCategories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const val = this.getDataValue('targetCategories');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val || [];
    }
  },

  excludeCategories: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
    get() {
      const val = this.getDataValue('excludeCategories');
      if (typeof val === 'string') {
        try { return JSON.parse(val); } catch { return []; }
      }
      return val || [];
    }
  },
  
  displayFrequency: {
    type: DataTypes.ENUM('always', 'rotation', 'percentage'),
    defaultValue: 'always'
  },
  
  displayPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
    validate: {
      min: 0,
      max: 100
    }
  },
  
  maxImpressions: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  
  maxClicks: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'ads',
  timestamps: true,
  underscored: false,
  indexes: [
    { fields: ['position'] },
    { fields: ['isActive'] },
    { fields: ['priority'] },
    { fields: ['startDate'] },
    { fields: ['endDate'] }
  ]
});

// Static method to get active ads by position with targeting
Ad.getActiveByPosition = async function(position, options = {}) {
  const { page, category } = options;
  const now = new Date();
  
  const ads = await this.findAll({
    where: {
      position,
      isActive: true,
      [Op.or]: [
        { startDate: null },
        { startDate: { [Op.lte]: now } }
      ],
      [Op.and]: [
        {
          [Op.or]: [
            { endDate: null },
            { endDate: { [Op.gte]: now } }
          ]
        }
      ]
    },
    order: [['priority', 'DESC'], ['createdAt', 'DESC']]
  });
  
  const filteredAds = ads.filter(ad => {
    if (ad.maxImpressions && ad.impressions >= ad.maxImpressions) {
      return false;
    }
    
    if (ad.maxClicks && ad.clicks >= ad.maxClicks) {
      return false;
    }
    
    if (page) {
      const targetPages = ad.targetPages || [];
      const excludePages = ad.excludePages || [];
      
      if (excludePages.includes(page)) {
        return false;
      }
      
      if (targetPages.length > 0 && !targetPages.includes(page)) {
        return false;
      }
    }
    
    if (category) {
      const targetCategories = ad.targetCategories || [];
      const excludeCategories = ad.excludeCategories || [];
      
      if (excludeCategories.includes(category)) {
        return false;
      }
      
      if (targetCategories.length > 0 && !targetCategories.includes(category)) {
        return false;
      }
    }
    
    if (ad.displayFrequency === 'percentage') {
      const randomValue = Math.random() * 100;
      if (randomValue > ad.displayPercentage) {
        return false;
      }
    }
    
    return true;
  });
  
  return filteredAds;
};

Ad.prototype.isCurrentlyActive = function() {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  if (this.startDate && new Date(this.startDate) > now) {
    return false;
  }
  
  if (this.endDate && new Date(this.endDate) < now) {
    return false;
  }
  
  if (this.maxImpressions && this.impressions >= this.maxImpressions) {
    return false;
  }
  
  if (this.maxClicks && this.clicks >= this.maxClicks) {
    return false;
  }
  
  return true;
};

Ad.prototype.recordImpression = async function() {
  this.impressions += 1;
  await this.save();
};

Ad.prototype.recordClick = async function() {
  this.clicks += 1;
  await this.save();
};

Ad.prototype.getCTR = function() {
  if (this.impressions === 0) return 0;
  return ((this.clicks / this.impressions) * 100).toFixed(2);
};

Ad.prototype.matchesTargeting = function(page, category) {
  if (page) {
    const targetPages = this.targetPages || [];
    const excludePages = this.excludePages || [];
    
    if (excludePages.includes(page)) {
      return false;
    }
    
    if (targetPages.length > 0 && !targetPages.includes(page)) {
      return false;
    }
  }
  
  if (category) {
    const targetCategories = this.targetCategories || [];
    const excludeCategories = this.excludeCategories || [];
    
    if (excludeCategories.includes(category)) {
      return false;
    }
    
    if (targetCategories.length > 0 && !targetCategories.includes(category)) {
      return false;
    }
  }
  
  return true;
};

module.exports = Ad;