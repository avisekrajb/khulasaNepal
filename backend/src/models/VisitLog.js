const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const VisitLog = sequelize.define('VisitLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  }
}, {
  tableName: 'visit_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    { name: 'visit_logs_date_idx', fields: ['date'], unique: true }
  ]
});

module.exports = VisitLog;
