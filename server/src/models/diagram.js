/**
 * 图表数据模型
 * 对应原IndexedDB中的diagrams表
 */
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Diagram = sequelize.define('Diagram', {
    id: {
      type: DataTypes.STRING(16),
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'Untitled Diagram',
    },
    database: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GENERIC',
    },
    gistId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    loadedFromGistId: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    lastModified: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    tables: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    references: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    notes: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    areas: {
      type: DataTypes.JSON, 
      allowNull: false,
      defaultValue: [],
    },
    todos: {
      type: DataTypes.JSON,
      allowNull: false,
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
    pan: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: { x: 0, y: 0 },
    },
    zoom: {
      type: DataTypes.FLOAT,
      allowNull: true,
      defaultValue: 1.0,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true, // 在实现用户认证后可改为false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: '乐观锁版本号，用于处理并发编辑'
    },
  });

  return Diagram;
}; 