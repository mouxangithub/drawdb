/**
 * 模板路由
 * @swagger
 * tags:
 *   name: Templates
 *   description: 模板管理 API
 */
import express from 'express';
import * as templateController from '../controllers/templateController.js';

const router = express.Router();

/**
 * @swagger
 * /templates:
 *   get:
 *     summary: 获取所有模板
 *     tags: [Templates]
 *     description: 获取系统中的所有模板列表
 *     responses:
 *       200:
 *         description: 成功获取模板列表
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: 模板的唯一ID
 *                   name:
 *                     type: string
 *                     description: 模板名称
 *                   content:
 *                     type: object
 *                     description: 模板内容
 *                   isBuiltIn:
 *                     type: boolean
 *                     description: 是否为内置模板
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
router.get('/', templateController.getAllTemplates);

/**
 * @swagger
 * /templates/custom:
 *   get:
 *     summary: 获取自定义模板
 *     tags: [Templates]
 *     description: 获取用户自定义的模板列表
 *     responses:
 *       200:
 *         description: 成功获取自定义模板列表
 *       500:
 *         description: 服务器错误
 */
router.get('/custom', templateController.getCustomTemplates);

/**
 * @swagger
 * /templates/{id}:
 *   get:
 *     summary: 获取单个模板
 *     tags: [Templates]
 *     description: 通过ID获取特定模板的详细信息
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 模板的唯一ID
 *     responses:
 *       200:
 *         description: 成功获取模板
 *       404:
 *         description: 模板不存在
 *       500:
 *         description: 服务器错误
 */
router.get('/:id', templateController.getTemplateById);

/**
 * @swagger
 * /templates:
 *   post:
 *     summary: 创建新模板
 *     tags: [Templates]
 *     description: 创建一个新的模板
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 description: 模板名称
 *               content:
 *                 type: object
 *                 description: 模板内容
 *               isBuiltIn:
 *                 type: boolean
 *                 default: false
 *                 description: 是否为内置模板
 *     responses:
 *       201:
 *         description: 成功创建模板
 *       400:
 *         description: 无效的请求数据
 *       500:
 *         description: 服务器错误
 */
router.post('/', templateController.createTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   put:
 *     summary: 更新模板
 *     tags: [Templates]
 *     description: 更新现有模板的信息
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 模板的唯一ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: 模板名称
 *               content:
 *                 type: object
 *                 description: 模板内容
 *     responses:
 *       200:
 *         description: 成功更新模板
 *       404:
 *         description: 模板不存在
 *       500:
 *         description: 服务器错误
 */
router.put('/:id', templateController.updateTemplate);

/**
 * @swagger
 * /templates/{id}:
 *   delete:
 *     summary: 删除模板
 *     tags: [Templates]
 *     description: 删除指定的模板
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: 模板的唯一ID
 *     responses:
 *       200:
 *         description: 成功删除模板
 *       404:
 *         description: 模板不存在
 *       500:
 *         description: 服务器错误
 */
router.delete('/:id', templateController.deleteTemplate);

export default router; 