// models/Category.js - FIXED VERSION
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  value: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      isLowercase: true,
      is: /^[a-z0-9-]+$/ // Only lowercase letters, numbers, hyphens
    }
  },
  
  label: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  icon: {
    type: DataTypes.STRING(50), 
    allowNull: true,
    defaultValue: null
  },
  
  color: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'blue',
    validate: {
      isIn: [['blue', 'green', 'purple', 'orange', 'pink', 'red', 'yellow', 'teal', 'indigo', 'cyan', 'gray', 'slate']]
    }
  },
  
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  isProtected: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: 'Protected categories cannot be deleted (news, local, sports, society, more)'
  },
  
  description: {
    type: DataTypes.STRING(255),
    allowNull: true
  }
}, {
  tableName: 'categories',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['value']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['displayOrder']
    },
    {
      fields: ['isProtected']
    }
  ]
});

// Virtual association (no FK constraint)
Category.associate = function(models) {
  Category.hasMany(models.News, {
    foreignKey: 'category',
    sourceKey: 'value',
    as: 'newsArticles',
    constraints: false // This prevents Sequelize from creating a foreign key constraint
  });
};

// Static method to get all active categories
Category.getActive = async function() {
  return await this.findAll({
    where: { isActive: true },
    order: [['displayOrder', 'ASC'], ['createdAt', 'ASC']]
  });
};

// Static method to get category by value
Category.getByValue = async function(value) {
  return await this.findOne({ where: { value } });
};

// Static method to check if category is being used
Category.isInUse = async function(categoryValue) {
  const News = require('./News');
  const count = await News.count({ where: { category: categoryValue } });
  return count > 0;
};

// Instance method to check if can be deleted
Category.prototype.canBeDeleted = async function() {
  if (this.isProtected) {
    return { 
      allowed: false, 
      reason: 'This is a protected system category and cannot be deleted' 
    };
  }
  
  const inUse = await Category.isInUse(this.value);
  if (inUse) {
    const News = require('./News');
    const count = await News.count({ where: { category: this.value } });
    return { 
      allowed: false, 
      reason: `Cannot delete category. ${count} news article(s) are using this category`,
      newsCount: count
    };
  }
  
  return { allowed: true };
};

module.exports = Category;