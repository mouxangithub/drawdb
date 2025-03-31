/**
 * WebSocket服务
 * 处理实时协同编辑功能
 */
import { WebSocketServer } from 'ws';
import url from 'url';
import { v4 as uuidv4 } from 'uuid';
import { Diagram } from '../models/index.js';
import { generateUniqueId } from '../utils/idGenerator.js';

// 存储连接的客户端，按图表ID分组
const clients = new Map();
// 存储每个客户端信息
const clientsInfo = new Map();
// 存储用户ID映射到客户端ID，处理重连场景
const userIdentifierMap = new Map();
// 存储操作历史，用于冲突解决
const operationHistory = new Map();
// 存储最后一次修改时间戳
const lastModified = new Map();

/**
 * 初始化WebSocket服务
 * @param {Object} server - HTTP服务器实例
 */
export const initWebSocketServer = (server) => {
  const wss = new WebSocketServer({ noServer: true });

  // 处理升级请求（HTTP升级到WebSocket）
  server.on('upgrade', (request, socket, head) => {
    const pathname = url.parse(request.url).pathname;

    // 仅处理/ws/diagrams路径的WebSocket连接
    if (pathname === '/ws/diagrams') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        // 获取客户端IP地址
        const ip = request.headers['x-forwarded-for'] ||
          request.connection.remoteAddress ||
          request.socket.remoteAddress;

        wss.emit('connection', ws, request, ip);
      });
    } else {
      socket.destroy();
    }
  });

  // 处理连接事件
  wss.on('connection', (ws, request, ip) => {
    // 为每个连接生成唯一ID
    const clientId = uuidv4();

    console.log(`WebSocket客户端 ${clientId} 已连接, IP: ${ip}`);

    // 解析URL中的查询参数
    const parsedUrl = url.parse(request.url, true);
    const { token, diagramId } = parsedUrl.query;

    // 如果URL中有diagramId和token，自动加入该图表
    if (diagramId && token) {
      // 构造加入消息
      const joinData = {
        type: 'join',
        diagramId,
        identifier: token,
        username: `用户_${token.substring(0, 6)}`,
        color: getRandomColor()
      };

      // 异步处理加入请求
      console.log(`客户端 ${clientId} 通过URL参数请求加入图表 ${diagramId}`);
      handleJoin(ws, clientId, joinData, ip).catch(error => {
        console.error(`通过URL参数加入图表失败:`, error);
        try {
          ws.send(JSON.stringify({
            type: 'error',
            message: '通过URL参数加入图表失败: ' + error.message
          }));
        } catch (e) {
          // 忽略发送错误
        }
      });
    }

    // 处理消息
    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message);

        // 根据消息类型处理
        switch (data.type) {
          case 'join':
            // 客户端加入图表编辑
            await handleJoin(ws, clientId, data, ip);
            break;

          case 'leave':
            // 客户端离开图表编辑
            handleLeave(clientId);
            break;

          case 'operation':
            // 客户端进行操作
            handleOperation(clientId, data);
            break;

          case 'cursor':
            // 客户端光标移动
            handleCursorMove(clientId, data);
            break;

          case 'ping':
            // 保持连接活跃
            ws.send(JSON.stringify({ type: 'pong' }));
            break;

          case 'save_diagram':
            // 保存图表数据
            await handleSaveDiagram(ws, clientId, data);
            break;

          case 'get_diagram':
            // 获取图表数据
            await handleGetDiagram(ws, clientId, data);
            break;

          case 'create_diagram':
            // 创建新图表
            await handleCreateDiagram(ws, clientId, data);
            break;

          default:
            console.warn(`未知的消息类型: ${data.type}`);
            ws.send(JSON.stringify({
              type: 'error',
              message: '不支持的操作类型'
            }));
        }
      } catch (error) {
        console.error('处理WebSocket消息时出错:', error);
        try {
          ws.send(JSON.stringify({
            type: 'error',
            message: '处理消息时出错: ' + error.message
          }));
        } catch (e) {
          // 忽略发送错误
        }
      }
    });

    // 处理关闭事件
    ws.on('close', () => {
      handleLeave(clientId);
      console.log(`WebSocket客户端 ${clientId} 已断开连接`);
    });

    // 处理错误事件
    ws.on('error', (error) => {
      console.error(`WebSocket客户端 ${clientId} 错误:`, error);
      handleLeave(clientId);
    });
  })
};

/**
 * 处理客户端加入图表编辑
 * @param {Object} ws - WebSocket连接
 * @param {string} clientId - 客户端ID
 * @param {Object} data - 消息数据
 * @param {string} ip - 客户端IP地址
 */
const handleJoin = async (ws, clientId, data, ip) => {
  const { diagramId, username, color, identifier } = data;

  // 使用IP地址作为默认标识符，但允许客户端自定义
  // 处理IP地址，保留足够信息同时保证隐私
  const ipIdentifier = ip ? `ip_${ip.replace(/[^\w\d]/g, '_')}` : `user_${Date.now()}`;
  const userIdentifier = identifier || ipIdentifier;

  // 验证图表是否存在
  try {
    const diagram = await Diagram.findByPk(diagramId);
    if (!diagram) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '图表不存在'
      }));
      return;
    }
  } catch (error) {
    console.error('验证图表存在时出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '验证图表出错'
    }));
    return;
  }

  // 检查是否是相同用户重连（基于用户标识符）
  const existingClientId = userIdentifierMap.get(`${diagramId}-${userIdentifier}`);
  if (existingClientId && existingClientId !== clientId) {
    // 同一用户的不同连接，关闭旧连接
    const oldClientInfo = clientsInfo.get(existingClientId);
    if (oldClientInfo && oldClientInfo.ws) {
      try {
        oldClientInfo.ws.send(JSON.stringify({
          type: 'error',
          message: '您在其他窗口中登录了该图表'
        }));
        oldClientInfo.ws.close();
      } catch (e) {
        // 忽略错误
      }
    }

    // 如果有旧连接，从图表组中移除
    if (clients.has(diagramId)) {
      clients.get(diagramId).delete(existingClientId);
    }

    // 清除旧客户端信息
    clientsInfo.delete(existingClientId);
  }

  // 更新用户标识符映射
  userIdentifierMap.set(`${diagramId}-${userIdentifier}`, clientId);

  // 生成用户友好的名称
  const displayName = username || `用户_${userIdentifier.substring(0, 6)}`;

  // 存储客户端信息
  clientsInfo.set(clientId, {
    ws,
    diagramId,
    username: displayName,
    color: color || getRandomColor(),
    identifier: userIdentifier,
    ip,
    joinedAt: new Date()
  });

  // 将客户端添加到图表组
  if (!clients.has(diagramId)) {
    clients.set(diagramId, new Set());

    // 初始化操作历史
    if (!operationHistory.has(diagramId)) {
      operationHistory.set(diagramId, []);
    }

    // 初始化最后修改时间
    if (!lastModified.has(diagramId)) {
      lastModified.set(diagramId, Date.now());
    }
  }
  clients.get(diagramId).add(clientId);

  // 获取当前在线用户信息
  const onlineUsers = getOnlineUsers(diagramId);

  // 向新加入的客户端发送确认消息
  ws.send(JSON.stringify({
    type: 'joined',
    diagramId,
    clientId,
    username: clientsInfo.get(clientId).username,
    color: clientsInfo.get(clientId).color,
    identifier: userIdentifier,
    onlineUsers,
    timestamp: Date.now(),
    lastModified: lastModified.get(diagramId) || Date.now()
  }));

  // 向其他客户端广播新用户加入的消息
  broadcastToDiagram(diagramId, {
    type: 'user_joined',
    diagramId,
    clientId,
    username: clientsInfo.get(clientId).username,
    color: clientsInfo.get(clientId).color,
    identifier: userIdentifier,
    onlineUsers
  }, clientId); // 排除自己

  console.log(`客户端 ${clientId} (${userIdentifier}) 加入图表 ${diagramId}, 当前在线用户: ${onlineUsers.length}`);
};

/**
 * 处理客户端离开图表编辑
 * @param {string} clientId - 客户端ID
 */
const handleLeave = (clientId) => {
  const clientInfo = clientsInfo.get(clientId);
  if (!clientInfo) return;

  const { diagramId, identifier } = clientInfo;

  // 从用户标识符映射中移除
  if (identifier) {
    const mapKey = `${diagramId}-${identifier}`;
    if (userIdentifierMap.get(mapKey) === clientId) {
      userIdentifierMap.delete(mapKey);
    }
  }

  // 从图表组中移除客户端
  if (clients.has(diagramId)) {
    clients.get(diagramId).delete(clientId);

    // 如果图表组没有客户端了，移除该组
    if (clients.get(diagramId).size === 0) {
      clients.delete(diagramId);
    } else {
      // 向其他客户端广播用户离开的消息
      broadcastToDiagram(diagramId, {
        type: 'user_left',
        diagramId,
        clientId,
        identifier: identifier,
        onlineUsers: getOnlineUsers(diagramId)
      }, clientId);
    }
  }

  // 清除客户端信息
  clientsInfo.delete(clientId);

  console.log(`客户端 ${clientId} (${identifier || 'unknown'}) 离开图表 ${diagramId}`);
};

/**
 * 处理客户端操作
 * @param {string} clientId - 客户端ID
 * @param {Object} data - 操作数据
 */
const handleOperation = (clientId, data) => {
  const clientInfo = clientsInfo.get(clientId);
  if (!clientInfo) return;

  const { diagramId, identifier } = clientInfo;
  const { operation, timestamp } = data;

  // 更新最后修改时间
  lastModified.set(diagramId, timestamp || Date.now());

  // 记录操作历史
  if (operationHistory.has(diagramId)) {
    const history = operationHistory.get(diagramId);
    // 限制历史记录数量，保留最近50条
    if (history.length >= 50) {
      history.shift();
    }

    history.push({
      clientId,
      identifier,
      username: clientInfo.username,
      timestamp: timestamp || Date.now(),
      operation
    });
  }
};

/**
 * 处理客户端光标移动
 * @param {string} clientId - 客户端ID
 * @param {Object} data - 光标数据
 */
const handleCursorMove = (clientId, data) => {
  const clientInfo = clientsInfo.get(clientId);
  if (!clientInfo) return;

  const { diagramId, identifier } = clientInfo;

  // 向同一图表的其他客户端广播光标位置
  broadcastToDiagram(diagramId, {
    type: 'cursor',
    clientId,
    identifier,
    username: clientInfo.username,
    color: clientInfo.color,
    position: data.position,
    timestamp: Date.now()
  }, clientId);
};

/**
 * 向特定图表的所有客户端广播消息
 * @param {string} diagramId - 图表ID
 * @param {Object} message - 消息内容
 * @param {string} excludeClientId - 要排除的客户端ID
 */
const broadcastToDiagram = (diagramId, message, excludeClientId = null) => {
  if (!clients.has(diagramId)) return;

  const diagramClients = clients.get(diagramId);
  for (const clientId of diagramClients) {
    // 排除指定的客户端
    if (excludeClientId && clientId === excludeClientId) continue;

    const clientInfo = clientsInfo.get(clientId);
    if (clientInfo && clientInfo.ws) {
      try {
        clientInfo.ws.send(JSON.stringify(message));
      } catch (error) {
        console.error(`向客户端 ${clientId} 发送消息时出错:`, error);
      }
    }
  }
};

/**
 * 获取图表的在线用户列表
 * @param {string} diagramId - 图表ID
 * @returns {Array} 在线用户列表
 */
const getOnlineUsers = (diagramId) => {
  if (!clients.has(diagramId)) return [];

  const now = Date.now();
  const users = [];
  for (const clientId of clients.get(diagramId)) {
    const clientInfo = clientsInfo.get(clientId);
    if (clientInfo) {
      // 计算用户活跃状态 - 连接中的用户视为活跃
      const isActive = true; // 默认所有连接的用户都是活跃的
      
      users.push({
        clientId,
        username: clientInfo.username,
        color: clientInfo.color,
        identifier: clientInfo.identifier,
        joinedAt: clientInfo.joinedAt,
        // 添加活跃状态信息
        lastActive: clientInfo.joinedAt?.getTime() || now,
        isActive
      });
    }
  }

  return users;
};

/**
 * 生成随机颜色
 * @returns {string} 随机颜色
 */
const getRandomColor = () => {
  const colors = [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5',
    '#2196F3', '#03A9F4', '#00BCD4', '#009688', '#4CAF50',
    '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800',
    '#FF5722', '#795548', '#9E9E9E', '#607D8B'
  ];

  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * 处理保存图表数据请求
 * @param {Object} ws - WebSocket连接
 * @param {string} clientId - 客户端ID
 * @param {Object} data - 包含要保存的图表数据
 */
const handleSaveDiagram = async (ws, clientId, data) => {
  const clientInfo = clientsInfo.get(clientId);
  if (!clientInfo) {
    ws.send(JSON.stringify({
      type: 'error',
      message: '客户端未登录',
      requestId: data.requestId
    }));
    return;
  }

  try {
    const { diagramData, requestId } = data;
    const { diagramId, identifier } = clientInfo;

    // 确保diagramData包含必要字段
    if (!diagramData || !diagramData.id) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '无效的图表数据',
        requestId
      }));
      return;
    }

    // 确保客户端只能保存自己正在编辑的图表
    if (diagramData.id !== diagramId) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '无权保存此图表',
        requestId
      }));
      return;
    }

    // 查找现有图表
    let diagram = await Diagram.findByPk(diagramId);

    if (!diagram) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '图表不存在',
        requestId
      }));
      return;
    }

    // 设置最后修改时间和版本号
    diagramData.lastModified = new Date();
    diagramData.version = (diagram.version || 0) + 1;

    // 更新图表数据
    await diagram.update(diagramData);

    // 更新最后修改时间
    lastModified.set(diagramId, Date.now());

    // 向客户端发送保存成功的响应
    ws.send(JSON.stringify({
      type: 'save_success',
      diagramId,
      version: diagramData.version,
      timestamp: Date.now(),
      requestId,
      username: clientInfo.username
    }));

    // 向其他客户端广播图表已更新的消息
    broadcastToDiagram(diagramId, {
      type: 'diagram_updated',
      diagramId,
      updatedBy: {
        clientId,
        username: clientInfo.username,
        identifier
      },
      diagram: diagram.toJSON(),
      timestamp: Date.now(),
      version: diagramData.version
    }, clientId);

    console.log(`客户端 ${clientId} (${identifier}) 保存了图表 ${diagramId}`);
  } catch (error) {
    console.error('保存图表时出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '保存图表失败: ' + error.message,
      requestId: data.requestId
    }));
  }
};

/**
 * 处理获取图表数据请求
 * @param {Object} ws - WebSocket连接
 * @param {string} clientId - 客户端ID
 * @param {Object} data - 包含要获取的图表ID
 */
const handleGetDiagram = async (ws, clientId, data) => {
  try {
    const { diagramId, requestId } = data;

    // 查找图表
    const diagram = await Diagram.findByPk(diagramId);

    if (!diagram) {
      ws.send(JSON.stringify({
        type: 'error',
        message: '图表不存在',
        requestId
      }));
      return;
    }

    // 向客户端发送图表数据
    ws.send(JSON.stringify({
      type: 'diagram_data',
      diagram: diagram.toJSON(),
      timestamp: Date.now(),
      requestId
    }));

    console.log(`客户端 ${clientId} 获取了图表 ${diagramId}`);
  } catch (error) {
    console.error('获取图表时出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '获取图表失败: ' + error.message,
      requestId: data.requestId
    }));
  }
};

/**
 * 处理创建新图表请求
 * @param {Object} ws - WebSocket连接
 * @param {string} clientId - 客户端ID
 * @param {Object} data - 包含要创建的图表数据
 */
const handleCreateDiagram = async (ws, clientId, data) => {
  const clientInfo = clientsInfo.get(clientId);
  const ip = clientInfo ? clientInfo.ip : 'unknown';

  try {
    const { diagramData, requestId } = data;

    // 设置创建/修改时间
    diagramData.lastModified = new Date();

    // 生成唯一ID (16位字母数字组合)
    diagramData.id = await generateUniqueId(async (id) => {
      const existingDiagram = await Diagram.findByPk(id);
      return existingDiagram !== null;
    });

    // 确保初始版本号为0
    diagramData.version = 0;

    // 创建新图表
    const diagram = await Diagram.create(diagramData);

    // 向客户端发送创建成功的响应
    ws.send(JSON.stringify({
      type: 'create_success',
      diagram: diagram.toJSON(),
      timestamp: Date.now(),
      requestId
    }));

    console.log(`客户端 ${clientId} (IP: ${ip}) 创建了新图表 ${diagram.id}`);
  } catch (error) {
    console.error('创建图表时出错:', error);
    ws.send(JSON.stringify({
      type: 'error',
      message: '创建图表失败: ' + error.message,
      requestId: data.requestId
    }));
  }
}; 