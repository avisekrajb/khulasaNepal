const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const AdminLog = sequelize.define('AdminLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  adminId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'admin_id'
  },
  adminEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'admin_email'
  },
  action: {
    type: DataTypes.STRING(50),
    allowNull: false
  },
  entityType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'entity_type'
  },
  entityId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'entity_id'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  details: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  ipAddress: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'ip_address'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  }
}, {
  tableName: 'admin_logs',
  timestamps: true,
  updatedAt: false,
  underscored: true,
  indexes: [
    { name: 'admin_logs_admin_id_idx', fields: ['admin_id'] },
    { name: 'admin_logs_entity_idx', fields: ['entity_type', 'entity_id'] },
    { name: 'admin_logs_created_at_idx', fields: ['created_at'] }
  ]
});

module.exports = AdminLog;
