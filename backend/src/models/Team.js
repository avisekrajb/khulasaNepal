// src/models/Team.js - FIXED VERSION
const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Team = db.define('Team', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Name is required'
      }
    }
  },
  position: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'Position is required'
      }
    }
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    // REMOVED isUrl validation - we store relative paths like /uploads/team/...
    validate: {
      // Optional: Add custom validation if you want to check format
      isValidPath(value) {
        if (value && !value.startsWith('/uploads/') && !value.startsWith('http')) {
          throw new Error('Image path must be a relative upload path or valid URL');
        }
      }
    }
  },
  displayOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: {
        msg: 'Must be a valid email address'
      }
    }
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  socialLinks: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: {
      facebook: null,
      twitter: null,
      linkedin: null,
      instagram: null
    }
  }
}, {
  tableName: 'teams',
  timestamps: true,
  indexes: [
    {
      fields: ['displayOrder']
    },
    {
      fields: ['isActive']
    }
  ]
});

module.exports = Team;