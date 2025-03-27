/**
 * 分享控制器
 * 替代原有的GitHub Gist分享功能
 */
import { Share } from '../models/index.js';

/**
 * 创建新的分享
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const createShare = async (req, res) => {
  try {
    const { title, database, tables, relationships, notes, subjectAreas, types, enums, transform, diagramId } = req.body;
    
    // 创建完整的内容JSON
    const content = {
      title,
      database,
      tables,
      relationships,
      notes,
      subjectAreas,
      types,
      enums,
      transform
    };
    
    // 创建分享记录
    const share = await Share.create({
      title,
      database,
      content,
      tables,
      relationships,
      notes,
      subjectAreas,
      types,
      enums,
      transform,
      diagramId
    });
    
    res.status(201).json({
      message: '分享创建成功',
      shareId: share.shareId
    });
  } catch (error) {
    console.error('创建分享失败:', error);
    res.status(500).json({ message: '创建分享失败', error: error.message });
  }
};

/**
 * 获取分享内容
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getShareById = async (req, res) => {
  try {
    const { shareId } = req.params;
    
    // 查找分享记录
    const share = await Share.findOne({
      where: { shareId }
    });
    
    if (!share) {
      return res.status(404).json({ message: '分享不存在或已过期' });
    }
    
    // 检查分享是否过期
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(404).json({ message: '分享已过期' });
    }
    
    // 增加查看次数
    await share.update({
      views: share.views + 1
    });
    
    // 返回分享内容
    res.status(200).json(share.content);
  } catch (error) {
    console.error('获取分享内容失败:', error);
    res.status(500).json({ message: '获取分享内容失败', error: error.message });
  }
};

/**
 * 获取分享信息（不含完整内容）
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getShareInfo = async (req, res) => {
  try {
    const { shareId } = req.params;
    
    // 查找分享记录
    const share = await Share.findOne({
      where: { shareId },
      attributes: ['id', 'shareId', 'title', 'database', 'createdAt', 'views', 'isPublic']
    });
    
    if (!share) {
      return res.status(404).json({ message: '分享不存在或已过期' });
    }
    
    // 检查分享是否过期
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      return res.status(404).json({ message: '分享已过期' });
    }
    
    // 返回分享信息
    res.status(200).json(share);
  } catch (error) {
    console.error('获取分享信息失败:', error);
    res.status(500).json({ message: '获取分享信息失败', error: error.message });
  }
};

/**
 * 删除分享
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const deleteShare = async (req, res) => {
  try {
    const { shareId } = req.params;
    
    // 查找分享记录
    const share = await Share.findOne({
      where: { shareId }
    });
    
    if (!share) {
      return res.status(200).json({ message: '分享已删除' });
    } else {
      // 删除分享
      await share.destroy();
      return res.status(200).json({ message: '分享已删除' });
    }
  } catch (error) {
    console.error('删除分享失败:', error);
    res.status(500).json({ message: '删除分享失败', error: error.message });
  }
};

/**
 * 获取图表的所有分享
 * @param {Object} req - 请求对象
 * @param {Object} res - 响应对象
 */
const getSharesByDiagramId = async (req, res) => {
  try {
    const { diagramId } = req.params;
    
    // 查找分享记录
    const shares = await Share.findAll({
      where: { diagramId },
      attributes: ['id', 'shareId', 'title', 'createdAt', 'views', 'isPublic']
    });
    
    res.status(200).json(shares);
  } catch (error) {
    console.error('获取图表分享列表失败:', error);
    res.status(500).json({ message: '获取图表分享列表失败', error: error.message });
  }
};

export {
  createShare,
  getShareById,
  getShareInfo,
  deleteShare,
  getSharesByDiagramId
}; 