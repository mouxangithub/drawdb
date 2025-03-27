/**
 * 分享数据模型
 * 用于替代原先的Gist分享功能
 */
import { DataTypes } from 'sequelize';
import crypto from 'crypto';

export default (sequelize) => {
  const Share = sequelize.define('Share', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    shareId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      defaultValue: () => crypto.randomBytes(8).toString('hex') // 生成16位随机字符作为分享ID
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Shared Diagram'
    },
    database: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GENERIC',
    },
    content: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    tables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    relationships: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    subjectAreas: {
      type: DataTypes.JSON,
      allowNull: true, 
      defaultValue: [],
    },
    types: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    enums: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    transform: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { zoom: 1, pan: { x: 0, y: 0 } },
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true, // 可以设置分享的有效期
    },
    views: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0, // 记录查看次数
    },
    isPublic: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true, // 是否公开分享
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // 在实现用户认证后可改为false
    },
    diagramId: {
      type: DataTypes.INTEGER,
      allowNull: true, // 关联的原始图表ID
    }
  });

  return Share;
}; 