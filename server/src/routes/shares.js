/**
 * 分享路由
 * @swagger
 * tags:
 *   name: Shares
 *   description: 分享管理 API
 */
import express from 'express';
import * as shareController from '../controllers/shareController.js';

const router = express.Router();

/**
 * @swagger
 * /shares:
 *   post:
 *     summary: 创建分享
 *     tags: [Shares]
 *     description: 为指定图表创建一个分享链接
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - diagramId
 *             properties:
 *               diagramId:
 *                 type: string
 *                 description: 要分享的图表ID
 *               expireAt:
 *                 type: string
 *                 format: date-time
 *                 description: 分享链接的过期时间（可选）
 *     responses:
 *       201:
 *         description: 成功创建分享
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: 分享的唯一ID
 *                 shareUrl:
 *                   type: string
 *                   description: 分享链接
 *       400:
 *         description: 无效的请求数据
 *       404:
 *         description: 图表不存在
 *       500:
 *         description: 服务器错误
 */
router.post('/', shareController.createShare);

/**
 * @swagger
 * /shares/{shareId}:
 *   get:
 *     summary: 获取分享内容
 *     tags: [Shares]
 *     description: 通过分享ID获取完整的分享内容，包括图表数据
 *     parameters:
 *       - in: path
 *         name: shareId
 *         schema:
 *           type: string
 *         required: true
 *         description: 分享的唯一ID
 *     responses:
 *       200:
 *         description: 成功获取分享内容
 *       404:
 *         description: 分享不存在或已过期
 *       500:
 *         description: 服务器错误
 */
router.get('/:shareId', shareController.getShareById);

/**
 * @swagger
 * /shares/{shareId}/info:
 *   get:
 *     summary: 获取分享信息
 *     tags: [Shares]
 *     description: 通过分享ID获取分享的基本信息，不包括图表完整内容
 *     parameters:
 *       - in: path
 *         name: shareId
 *         schema:
 *           type: string
 *         required: true
 *         description: 分享的唯一ID
 *     responses:
 *       200:
 *         description: 成功获取分享信息
 *       404:
 *         description: 分享不存在或已过期
 *       500:
 *         description: 服务器错误
 */
router.get('/:shareId/info', shareController.getShareInfo);

/**
 * @swagger
 * /shares/diagram/{diagramId}:
 *   get:
 *     summary: 获取图表的所有分享
 *     tags: [Shares]
 *     description: 获取指定图表的所有分享链接
 *     parameters:
 *       - in: path
 *         name: diagramId
 *         schema:
 *           type: string
 *         required: true
 *         description: 图表的唯一ID
 *     responses:
 *       200:
 *         description: 成功获取图表的分享列表
 *       404:
 *         description: 图表不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/diagram/:diagramId', shareController.getSharesByDiagramId);

/**
 * @swagger
 * /shares/{shareId}:
 *   delete:
 *     summary: 删除分享
 *     tags: [Shares]
 *     description: 删除指定的分享链接
 *     parameters:
 *       - in: path
 *         name: shareId
 *         schema:
 *           type: string
 *         required: true
 *         description: 分享的唯一ID
 *     responses:
 *       200:
 *         description: 成功删除分享
 *       404:
 *         description: 分享不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:shareId', shareController.deleteShare);

export default router; 