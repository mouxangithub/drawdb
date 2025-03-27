/**
 * 模板控制器
 * 处理模板相关的业务逻辑
 */
import { Template } from '../models/index.js';

/**
 * 获取所有模板
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getAllTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      order: [['id', 'ASC']]
    });
    
    res.status(200).json(templates);
  } catch (error) {
    console.error('获取模板列表失败:', error);
    res.status(500).json({ message: '获取模板列表失败', error: error.message });
  }
};

/**
 * 获取模板详情
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }
    
    res.status(200).json(template);
  } catch (error) {
    console.error('获取模板详情失败:', error);
    res.status(500).json({ message: '获取模板详情失败', error: error.message });
  }
};

/**
 * 创建新模板
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createTemplate = async (req, res) => {
  try {
    const templateData = req.body;
    
    // 创建新模板
    const template = await Template.create(templateData);
    
    res.status(201).json(template);
  } catch (error) {
    console.error('创建模板失败:', error);
    res.status(500).json({ message: '创建模板失败', error: error.message });
  }
};

/**
 * 更新模板
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 查找模板
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }
    
    // 更新模板
    await template.update(updateData);
    
    res.status(200).json(template);
  } catch (error) {
    console.error('更新模板失败:', error);
    res.status(500).json({ message: '更新模板失败', error: error.message });
  }
};

/**
 * 删除模板
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 查找模板
    const template = await Template.findByPk(id);
    
    if (!template) {
      return res.status(404).json({ message: '模板不存在' });
    }
    
    // 检查是否为自定义模板
    if (!template.custom) {
      return res.status(403).json({ message: '不能删除系统模板' });
    }
    
    // 删除模板
    await template.destroy();
    
    res.status(200).json({ message: '模板删除成功' });
  } catch (error) {
    console.error('删除模板失败:', error);
    res.status(500).json({ message: '删除模板失败', error: error.message });
  }
};

/**
 * 获取自定义模板
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getCustomTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { custom: true },
      order: [['id', 'ASC']]
    });
    
    res.status(200).json(templates);
  } catch (error) {
    console.error('获取自定义模板列表失败:', error);
    res.status(500).json({ message: '获取自定义模板列表失败', error: error.message });
  }
};

export {
  getAllTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  getCustomTemplates
}; 