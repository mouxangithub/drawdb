/**
 * 图表控制器
 * 处理图表相关的业务逻辑
 */
import { Diagram } from '../models/index.js';
import { generateRandomId, generateUniqueId } from '../utils/idGenerator.js';
import { Op } from 'sequelize';

/**
 * 获取所有图表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAllDiagrams = async (req, res) => {
  try {
    // 禁用缓存，确保不返回304
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // 生成时间戳，确保每次响应内容都不同
    const responseTimestamp = Date.now();

    // 解析查询参数
    const {
      page = 1,
      pageSize = 10,
      name,
      database,
      createdAtStart,
      createdAtEnd,
      updatedAtStart,
      updatedAtEnd,
      sortBy = 'lastModified',
      sortOrder = 'DESC'
    } = req.query;

    // 构建筛选条件
    const where = {};
    
    // 处理排序 - 确保排序字段存在
    let orderField = sortBy;
    // 如果排序字段是version但数据库中没有这个字段，使用lastModified作为默认排序
    if (sortBy === 'version') {
      orderField = 'lastModified';
    }
    const order = [[orderField, sortOrder]];

    // 根据名称筛选
    if (name) {
      where.name = {
        [Op.like]: `%${name}%` 
      };
    }

    // 根据数据库类型筛选 - 更新为支持多选
    if (database) {
      // 检查是否为逗号分隔的多个值
      const databaseTypes = database.split(',').map(type => type.trim());
      
      if (databaseTypes.length > 1) {
        // 如果有多个值，使用 OR 条件
        where.database = {
          [Op.or]: databaseTypes.map(type => ({ [Op.eq]: type }))
        };
      } else {
        // 单个值使用简单等于
        where.database = database;
      }
    }

    // 根据创建时间筛选
    if (createdAtStart || createdAtEnd) {
      where.createdAt = {};
      if (createdAtStart) {
        where.createdAt[Op.gte] = new Date(createdAtStart);
      }
      if (createdAtEnd) {
        where.createdAt[Op.lte] = new Date(createdAtEnd);
      }
    }

    // 根据更新时间筛选
    if (updatedAtStart || updatedAtEnd) {
      where.lastModified = {};
      if (updatedAtStart) {
        where.lastModified[Op.gte] = new Date(updatedAtStart);
      }
      if (updatedAtEnd) {
        where.lastModified[Op.lte] = new Date(updatedAtEnd);
      }
    }

    // 计算分页偏移量
    const offset = (parseInt(page) - 1) * parseInt(pageSize);
    const limit = parseInt(pageSize);

    // 查询总记录数
    const total = await Diagram.count({ where });
    
    // 查询指定页的记录
    const diagrams = await Diagram.findAll({
      where,
      order,
      offset,
      limit
    });
    
    // 为每个图表添加时间戳，确保内容每次都不同
    const enhancedDiagrams = diagrams.map(diagram => {
      const diagramObj = diagram.toJSON();
      diagramObj._responseTimestamp = responseTimestamp;
      diagramObj._responseId = Math.random().toString(36).substring(2, 15);
      return diagramObj;
    });
    
    // 返回数据和分页信息
    res.status(200).json({
      data: enhancedDiagrams,
      pagination: {
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        totalPages: Math.ceil(total / parseInt(pageSize))
      }
    });
  } catch (error) {
    console.error('获取图表列表失败:', error);
    res.status(500).json({ message: '获取图表列表失败', error: error.message });
  }
};

/**
 * 获取图表详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getDiagramById = async (req, res) => {
  try {
    // 禁用缓存，确保不返回304
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    const { id } = req.params;
    
    const diagram = await Diagram.findByPk(id);
    
    if (!diagram) {
      return res.status(404).json({ message: '图表不存在' });
    }
    
    // 添加时间戳确保每次响应内容都不同
    const diagramObj = diagram.toJSON();
    diagramObj._responseTimestamp = Date.now();
    diagramObj._responseId = Math.random().toString(36).substring(2, 15);
    
    // 强制返回200状态码和完整内容
    res.status(200).json(diagramObj);
  } catch (error) {
    console.error('获取图表详情失败:', error);
    res.status(500).json({ message: '获取图表详情失败', error: error.message });
  }
};

/**
 * 创建新图表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createDiagram = async (req, res) => {
  try {
    const diagramData = req.body;
    
    // 确保图表有名称
    if (!diagramData.name) {
      diagramData.name = 'Untitled Diagram';
    }
    
    // 设置创建/修改时间
    diagramData.lastModified = new Date();
    
    // 生成唯一ID (16位字母数字组合)
    diagramData.id = await generateUniqueId(async (id) => {
      const existingDiagram = await Diagram.findByPk(id);
      return existingDiagram !== null;
    });
    
    // 创建新图表
    const diagram = await Diagram.create(diagramData);
    
    res.status(201).json(diagram);
  } catch (error) {
    console.error('创建图表失败:', error);
    res.status(500).json({ message: '创建图表失败', error: error.message });
  }
};

/**
 * 更新图表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const updateDiagram = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const clientVersion = updateData.version;

    // 设置更新时间
    updateData.lastModified = new Date();
    
    // 查找图表
    const diagram = await Diagram.findByPk(id);
    
    if (!diagram) {
      return res.status(404).json({ message: '图表不存在' });
    }

    // 乐观锁检查 - 版本不匹配，说明数据已被其他用户修改
    if (clientVersion !== undefined && diagram.version !== clientVersion) {
      return res.status(409).json({ 
        message: '数据冲突：该图表已被其他用户修改',
        serverVersion: diagram.version,
        yourVersion: clientVersion
      });
    }
    
    // 增加版本号
    updateData.version = (diagram.version || 0) + 1;
    
    // 更新图表
    await diagram.update(updateData);
    
    res.status(200).json(diagram);
  } catch (error) {
    console.error('更新图表失败:', error);
    res.status(500).json({ message: '更新图表失败', error: error.message });
  }
};

/**
 * 删除图表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteDiagram = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找图表
    const diagram = await Diagram.findByPk(id);
    
    if (!diagram) {
      return res.status(404).json({ message: '图表不存在' });
    }
    
    // 删除图表
    await diagram.destroy();
    
    res.status(200).json({ message: '图表删除成功' });
  } catch (error) {
    console.error('删除图表失败:', error);
    res.status(500).json({ message: '删除图表失败', error: error.message });
  }
};

/**
 * 获取最新图表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getLatestDiagram = async (req, res) => {
  try {
    // 禁用缓存，确保不返回304
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    const diagram = await Diagram.findOne({
      order: [['lastModified', 'DESC']]
    });
    
    if (!diagram) {
      return res.status(404).json({ message: '没有找到任何图表' });
    }
    
    // 添加时间戳确保每次响应内容都不同
    const diagramObj = diagram.toJSON();
    diagramObj._responseTimestamp = Date.now();
    diagramObj._responseId = Math.random().toString(36).substring(2, 15);
    
    // 强制返回200状态码和完整内容
    res.status(200).json(diagramObj);
  } catch (error) {
    console.error('获取最新图表失败:', error);
    res.status(500).json({ message: '获取最新图表失败', error: error.message });
  }
};

/**
 * 获取所有可用的数据库类型
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getDatabaseTypes = async (req, res) => {
  try {
    // 禁用缓存
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
    
    // 查询所有不同的数据库类型
    const dbTypes = await Diagram.findAll({
      attributes: ['database'],
      group: ['database'],
      raw: true
    });
    
    // 提取数据库类型列表
    const databaseTypes = dbTypes
      .map(item => item.database)
      .filter(type => !!type); // 过滤掉null或空值
    
    res.status(200).json(databaseTypes);
  } catch (error) {
    console.error('获取数据库类型列表失败:', error);
    res.status(500).json({ message: '获取数据库类型列表失败', error: error.message });
  }
};

export {
  getAllDiagrams,
  getDiagramById,
  createDiagram,
  updateDiagram,
  deleteDiagram,
  getLatestDiagram,
  getDatabaseTypes
}; 