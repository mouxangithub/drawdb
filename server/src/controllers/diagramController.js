/**
 * 图表控制器
 * 处理图表相关的业务逻辑
 */
import { Diagram } from '../models/index.js';
import { generateRandomId, generateUniqueId } from '../utils/idGenerator.js';

/**
 * 获取所有图表
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAllDiagrams = async (req, res) => {
  try {
    // 后续可添加用户认证，筛选当前用户的图表
    const diagrams = await Diagram.findAll({
      order: [['lastModified', 'DESC']]
    });
    
    res.status(200).json(diagrams);
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
    const { id } = req.params;
    
    const diagram = await Diagram.findByPk(id);
    
    if (!diagram) {
      return res.status(404).json({ message: '图表不存在' });
    }
    
    res.status(200).json(diagram);
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
    
    // 设置更新时间
    updateData.lastModified = new Date();
    
    // 查找图表
    const diagram = await Diagram.findByPk(id);
    
    if (!diagram) {
      return res.status(404).json({ message: '图表不存在' });
    }
    
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
    const diagram = await Diagram.findOne({
      order: [['lastModified', 'DESC']]
    });
    
    if (!diagram) {
      return res.status(404).json({ message: '没有找到任何图表' });
    }
    
    res.status(200).json(diagram);
  } catch (error) {
    console.error('获取最新图表失败:', error);
    res.status(500).json({ message: '获取最新图表失败', error: error.message });
  }
};

export {
  getAllDiagrams,
  getDiagramById,
  createDiagram,
  updateDiagram,
  deleteDiagram,
  getLatestDiagram
}; 