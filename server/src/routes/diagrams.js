/**
 * 图表路由
 * @swagger
 * tags:
 *   name: Diagrams
 *   description: 图表管理 API
 */
import express from 'express';
import * as diagramController from '../controllers/diagramController.js';

const router = express.Router();

/**
 * @swagger
 * /diagrams:
 *   get:
 *     summary: 获取所有图表
 *     tags: [Diagrams]
 *     description: 获取系统中的所有图表列表
 *     responses:
 *       200:
 *         description: 成功获取图表列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 图表的唯一ID
 *                   name:
 *                     type: string
 *                     description: 图表名称
 *                   content:
 *                     type: object
 *                     description: 图表内容
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                     description: 创建时间
 *                   updatedAt:
 *                     type: string
 *                     format: date-time
 *                     description: 最后更新时间
 *       500:
 *         description: 服务器错误
 */
router.get('/', diagramController.getAllDiagrams);

/**
 * @swagger
 * /diagrams/latest:
 *   get:
 *     summary: 获取最新的图表
 *     tags: [Diagrams]
 *     description: 获取系统中最新创建的图表
 *     responses:
 *       200:
 *         description: 成功获取最新图表
 *       404:
 *         description: 未找到任何图表
 *       500:
 *         description: 服务器错误
 */
router.get('/latest', diagramController.getLatestDiagram);

/**
 * @swagger
 * /diagrams/{id}:
 *   get:
 *     summary: 获取单个图表
 *     tags: [Diagrams]
 *     description: 通过ID获取特定图表的详细信息
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 图表的唯一ID
 *     responses:
 *       200:
 *         description: 成功获取图表
 *       404:
 *         description: 图表不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', diagramController.getDiagramById);

/**
 * @swagger
 * /diagrams:
 *   post:
 *     summary: 创建新图表
 *     tags: [Diagrams]
 *     description: 创建一个新的图表
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: 图表名称
 *               content:
 *                 type: object
 *                 description: 图表内容
 *     responses:
 *       201:
 *         description: 成功创建图表
 *       400:
 *         description: 无效的请求数据
 *       500:
 *         description: 服务器错误
 */
router.post('/', diagramController.createDiagram);

/**
 * @swagger
 * /diagrams/{id}:
 *   put:
 *     summary: 更新图表
 *     tags: [Diagrams]
 *     description: 更新现有图表的信息
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 图表的唯一ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 图表名称
 *               content:
 *                 type: object
 *                 description: 图表内容
 *     responses:
 *       200:
 *         description: 成功更新图表
 *       404:
 *         description: 图表不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', diagramController.updateDiagram);

/**
 * @swagger
 * /diagrams/{id}:
 *   delete:
 *     summary: 删除图表
 *     tags: [Diagrams]
 *     description: 删除指定的图表
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 图表的唯一ID
 *     responses:
 *       200:
 *         description: 成功删除图表
 *       404:
 *         description: 图表不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', diagramController.deleteDiagram);

export default router; 