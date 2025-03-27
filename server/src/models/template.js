/**
 * 模板数据模型
 * 对应原IndexedDB中的templates表
 */
import { DataTypes } from 'sequelize';

export default (sequelize) => {
  const Template = sequelize.define('Template', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    database: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'GENERIC',
    },
    custom: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
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
    todos: {
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
  });

  return Template;
}; 