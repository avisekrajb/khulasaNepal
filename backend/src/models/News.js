// models/News.js - FIXED VERSION
const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const News = sequelize.define('News', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  
  // CATEGORY FIELD - Simple string, no foreign key constraint
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'news',
    validate: {
      notEmpty: true,
      len: [2, 50]
    }
  },
  
  image: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  
  title: {
    type: DataTypes.STRING(500),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [3, 500]
    }
  },
  
  subtitle: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  
  paragraph: {
    type: DataTypes.TEXT,
    allowNull: true,
    defaultValue: ''
  },
  
  publishedDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  
  journalistName: {
    type: DataTypes.STRING,
    allowNull: true

  },
  
  journalistImage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  
  views: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  
  status: {
    type: DataTypes.ENUM('draft', 'published'),
    defaultValue: 'published'
  }
}, {
  tableName: 'news',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['publishedDate']
    },
    {
      fields: ['isFeatured']
    },
    {
      fields: ['status']
    }
  ]
});

// Optional: Virtual association (doesn't create FK constraint)
// This allows you to use .include() in queries but doesn't enforce referential integrity
News.associate = function(models) {
  News.belongsTo(models.Category, {
    foreignKey: 'category',
    targetKey: 'value',
    as: 'categoryData',
    constraints: false // This prevents Sequelize from creating a foreign key constraint
  });
};

module.exports = News;