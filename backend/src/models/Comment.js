const { DataTypes } = require('sequelize');
const db = require('../config/db');

const Comment = db.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  newsId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'news_id'
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'parent_id'
  },
  userName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'user_name'
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  voiceUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'voice_url'
  },
  videoUrl: {
    type: DataTypes.STRING(500),
    allowNull: true,
    field: 'video_url'
  },
  commentType: {
    type: DataTypes.ENUM('text', 'voice', 'video'),
    defaultValue: 'text',
    field: 'comment_type'
  },
  likes: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'created_at'
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'updated_at'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'comments_news_id_idx',
      fields: ['news_id']
    },
    {
      name: 'comments_parent_id_idx',
      fields: ['parent_id']
    },
    {
      name: 'comments_created_at_idx',
      fields: ['created_at']
    }
  ]
});

// Association method
Comment.associate = function(models) {
  Comment.belongsTo(models.News, {
    foreignKey: 'newsId',
    as: 'news'
  });
  
  Comment.hasMany(models.Comment, {
    foreignKey: 'parentId',
    as: 'replies'
  });
  
  Comment.belongsTo(models.Comment, {
    foreignKey: 'parentId',
    as: 'parent'
  });
};

module.exports = Comment;