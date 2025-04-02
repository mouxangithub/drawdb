/**
 * WebSocket连接管理器
 * 用于集中管理WebSocket连接，避免重复连接
 * 提供统一的API接口处理连接、消息发送和事件监听
 */

import { getAuthToken } from './authService';
import { eventBus } from './customEventBridge';

// 配置参数
const CONNECTION_TIMEOUT = 15000; // 连接超时时间，15秒
const HEARTBEAT_INTERVAL = 30000; // 心跳间隔，30秒
const RECONNECT_DELAY = 2000; // 重连延迟，2秒
const MAX_RECONNECT_ATTEMPTS = 3; // 最大重连尝试次数
const MIN_RECONNECT_INTERVAL = 5000; // 最小重连间隔，增加到5秒，减少频繁连接问题
const DISCONNECT_DELAY = 2000; // 断开连接延迟，增加到2秒，减少频繁断开重连
const CONNECTION_STABILITY_PERIOD = 5000; // 连接稳定期，5秒内不允许断开
// 添加退避算法的最大重试间隔
const MAX_RETRY_INTERVAL = 30000; // 最大重试间隔，30秒

// API配置
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' // 开发环境API地址
    : window.location.origin); // 生产环境与前端同源

// 添加调试模式标志，默认关闭
const DEBUG_MODE = false;

// 连接状态
let websocket = null;
let connectionState = {
  connected: false,
  connecting: false,
  authFailed: false,
  reconnectAttempts: 0,
  lastAttemptTime: 0,
  lastConnectTime: 0, // 新增：最后成功连接时间
  diagramId: null,
  connectionPromise: null,
  heartbeatTimer: null,
  reconnectTimer: null,
  disconnectTimer: null, // 新增：断开连接的计时器
  listeners: {
    onConnected: [],
    onDisconnected: [],
    onMessage: [],
    onConnectionError: []
  }
};

// 添加连接冷却期缓存，防止频繁连接
let connectionCooldowns = {};

/**
 * 添加WebSocket事件监听器
 * @param {string} eventType - 事件类型
 * @param {Function} callback - 回调函数
 */
export const addWebSocketListener = (eventType, callback) => {
  if (connectionState.listeners[eventType] && typeof callback === 'function') {
    // 避免重复添加同一回调
    if (!connectionState.listeners[eventType].includes(callback)) {
      connectionState.listeners[eventType].push(callback);
    }
  }
};

/**
 * 移除WebSocket事件监听器
 * @param {string} eventType - 事件类型
 * @param {Function} callback - 回调函数
 */
export const removeWebSocketListener = (eventType, callback) => {
  if (connectionState.listeners[eventType] && typeof callback === 'function') {
    connectionState.listeners[eventType] = connectionState.listeners[eventType]
      .filter(cb => cb !== callback);
  }
};

/**
 * 触发WebSocket事件
 * @param {string} eventType - 事件类型
 * @param {any} data - 事件数据
 */
const triggerEvent = (eventType, data = null) => {
  if (connectionState.listeners[eventType]) {
    connectionState.listeners[eventType].forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`WebSocket事件处理错误 (${eventType}):`, error);
      }
    });
  }
  
  // 同时触发DOM事件
  let eventName = '';
  switch (eventType) {
    case 'onConnected':
      eventName = 'websocket_connected';
      break;
    case 'onDisconnected':
      eventName = 'websocket_disconnected';
      break;
    case 'onConnectionError':
      eventName = 'websocket_error';
      break;
    case 'onMessage':
      eventName = 'websocket_message';
      break;
    default:
      return;
  }
  
  document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
};

/**
 * 连接到WebSocket服务器
 * @param {string} diagramId - 图表ID
 * @param {Object} options - 连接选项
 * @returns {Promise} 连接状态Promise
 */
export const connectToWebSocket = (diagramId, options = {}) => {
  // 如果已经连接到指定图表，则直接返回
  if (websocket && 
      websocket.readyState === WebSocket.OPEN && 
      connectionState.diagramId === diagramId && 
      !connectionState.authFailed) {
    return Promise.resolve();
  }
  
  // 如果正在连接同一图表，且时间在3秒内，则复用现有连接请求
  if (connectionState.connecting && 
      connectionState.diagramId === diagramId && 
      connectionState.connectionPromise) {
    return connectionState.connectionPromise;
  }
  
  // 检查连接冷却期
  const now = Date.now();
  const cooldownKey = diagramId || 'global';
  const lastAttemptTime = connectionCooldowns[cooldownKey] || 0;
  const timeSinceLastAttempt = now - lastAttemptTime;
  
  // 全局连接冷却期，防止任何图表频繁连接
  const globalLastAttempt = connectionCooldowns['global'] || 0;
  const globalTimeSince = now - globalLastAttempt;
  
  if (globalTimeSince < 1000) {
    console.warn(`WebSocket全局连接冷却期内，请稍后再试`);
    return Promise.reject(new Error("连接请求过于频繁，请稍后再试"));
  }
  
  // 特定图表的连接冷却检查
  if (timeSinceLastAttempt < MIN_RECONNECT_INTERVAL) {
    console.warn(`WebSocket连接请求过于频繁 (${diagramId})`);
    return Promise.reject(new Error("连接请求过于频繁，请稍后再试"));
  }
  
  // 更新冷却期记录
  connectionCooldowns[cooldownKey] = now;
  connectionCooldowns['global'] = now;
  
  // 定期清理过期的冷却记录（2分钟以上的）
  Object.keys(connectionCooldowns).forEach(key => {
    if (now - connectionCooldowns[key] > 120000) {
      delete connectionCooldowns[key];
    }
  });
  
  // 如果认证失败，拒绝连接
  if (connectionState.authFailed) {
    console.warn(`WebSocket认证失败 (${diagramId})`);
    return Promise.reject(new Error("认证失败，请刷新页面重试"));
  }
  
  // 取消任何待处理的断开连接计时器
  if (connectionState.disconnectTimer) {
    clearTimeout(connectionState.disconnectTimer);
    connectionState.disconnectTimer = null;
  }
  
  // 关闭现有连接，使用立即模式
  disconnectWebSocket(true);
  
  // 更新连接状态
  connectionState.connecting = true;
  connectionState.diagramId = diagramId;
  connectionState.lastAttemptTime = now;
  
  // 创建连接Promise
  connectionState.connectionPromise = new Promise((resolve, reject) => {
    try {
      const token = getAuthToken();
      
      // 构建WebSocket URL，使用API基础URL而不是当前页面URL
      const wsProtocol = API_BASE_URL.startsWith('https') ? 'wss:' : 'ws:';
      const apiUrl = new URL(API_BASE_URL);
      // 使用后端实际提供的WebSocket路径 - 包含token和diagramId作为URL参数
      // 这样后端可以直接从URL参数中提取身份和图表ID
      const wsUrl = `${wsProtocol}//${apiUrl.host}/ws/diagrams?token=${token}&diagramId=${diagramId}`;
      
      // 创建WebSocket连接
      websocket = new WebSocket(wsUrl);
      
      // 设置连接超时
      const connectionTimeout = setTimeout(() => {
        if (connectionState.connecting) {
          const error = new Error("连接超时");
          connectionState.connecting = false;
          websocket.close();
          reject(error);
          
          triggerEvent('onConnectionError', { message: error.message });
        }
      }, CONNECTION_TIMEOUT);
      
      // WebSocket打开事件
      websocket.onopen = () => {
        clearTimeout(connectionTimeout);
        if (DEBUG_MODE) console.log(`WebSocket连接成功`);
        
        connectionState.connected = true;
        connectionState.connecting = false;
        connectionState.reconnectAttempts = 0;
        connectionState.lastConnectTime = Date.now(); // 记录连接成功时间
        
        // 启动心跳机制
        startHeartbeat();
        
        /* 
         * 注意：不再在此发送join消息，因为我们已经在URL参数中提供了必要信息
         * 后端会在处理连接时自动解析URL参数并触发加入流程
         */
        
        // 触发连接成功事件
        triggerEvent('onConnected');
        
        resolve();
      };
      
      // WebSocket关闭事件
      websocket.onclose = (event) => {
        clearTimeout(connectionTimeout);
        
        // 非主动关闭时尝试重连
        if (connectionState.connected) {
          const wasConnected = connectionState.connected;
          connectionState.connected = false;
          connectionState.connecting = false;
          
          clearInterval(connectionState.heartbeatTimer);
          
          if (wasConnected) {
            if (DEBUG_MODE) console.log(`WebSocket连接已关闭`);
            triggerEvent('onDisconnected');
            
            // 尝试重连，但不重置认证失败状态
            if (!connectionState.authFailed && connectionState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
              scheduleReconnect();
            }
          }
        } else if (connectionState.connecting) {
          connectionState.connecting = false;
          reject(new Error("连接关闭"));
        }
      };
      
      // WebSocket错误事件
      websocket.onerror = (error) => {
        console.error(`WebSocket错误:`, error);
        connectionState.connecting = false;
        
        // 构建错误对象
        const errorObj = { message: "连接错误" };
        
        // 拒绝连接Promise
        reject(new Error(errorObj.message));
        
        // 触发错误事件
        triggerEvent('onConnectionError', errorObj);
      };
      
      // WebSocket消息事件
      websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          // 检查是否是心跳响应
          if (data.type === 'pong') {
            return;
          }
          
          // 检查认证错误
          if (data.type === 'error' && 
             (data.message.includes('未登录') || 
              data.message.includes('认证') || 
              data.message.includes('客户端未'))) {
            connectionState.authFailed = true;
          }
          
          // 处理加入房间事件
          if (data.type === 'joined') {
            // 更新连接状态，确保重置重连计数器
            connectionState.reconnectAttempts = 0;
          }
          
          // 处理用户离开事件，确保更新本地用户列表
          if (data.type === 'user_left') {
            // 通知应用程序用户已离开
            if (DEBUG_MODE) console.log('收到用户离开事件:', data.username || data.clientId);
            
            // 如果是请求此客户端断开连接，则立即断开
            if (data.targetClientId === localStorage.getItem('drawdb_client_id') && data.forceDisconnect) {
              if (DEBUG_MODE) console.log('服务器请求断开此客户端连接');
              setTimeout(() => performDisconnect(), 100);
            }
          }
          
          // 对保存相关操作进行特殊处理
          if (data.type === 'save_diagram' || data.type === 'save_success' || 
              (data.type === 'operation' && data.operation && data.operation.type === 'save')) {
            
            // 获取源客户端ID
            const sourceClientId = data.sourceClientId || 
                                (data.operation ? data.operation.sourceClientId : null);
            
            if (sourceClientId) {
              // 获取本地客户端ID
              const localClientId = localStorage.getItem('drawdb_client_id');
              
              // 如果不是本客户端发起的保存操作，直接跳过
              if (localClientId && sourceClientId !== localClientId) {
                if (DEBUG_MODE) console.log(`[WebSocketManager] 底层跳过其他客户端(${sourceClientId})的${data.type}事件`);
                return; // 不继续处理这个消息
              }
            }
            
            // 检查保存操作ID是否已经处理过
            if (data.saveOperationId) {
              const savedOpIds = window.savedOperationIds || new Set();
              if (savedOpIds.has(data.saveOperationId)) {
                if (DEBUG_MODE) console.log(`[WebSocketManager] 跳过已处理的保存操作: ${data.saveOperationId}`);
                // 移除ID，避免内存泄漏
                savedOpIds.delete(data.saveOperationId);
                return;
              }
            }
          }
          
          // 对图表更新事件做特殊处理
          if (data.type === 'diagram_updated') {
            if (DEBUG_MODE) console.log('WebSocket收到diagram_updated事件，数据大小:', event.data.length);
          }
          
          // 触发消息事件
          triggerEvent('onMessage', { data: event.data });
          
          // 触发DOM事件
          eventBus.emit('websocket_message', { data: event.data });
        } catch (error) {
          console.error(`WebSocket消息处理错误:`, error);
        }
      };
    } catch (error) {
      console.error(`WebSocket初始化错误:`, error);
      connectionState.connecting = false;
      reject(error);
      
      triggerEvent('onConnectionError', { message: error.message });
    }
  });
  
  return connectionState.connectionPromise;
};

/**
 * 断开WebSocket连接
 * @param {boolean} immediate - 是否立即断开，默认为false表示延迟断开
 */
export const disconnectWebSocket = (immediate = false) => {
  // 取消任何待处理的断开连接计时器
  if (connectionState.disconnectTimer) {
    clearTimeout(connectionState.disconnectTimer);
    connectionState.disconnectTimer = null;
  }
  
  // 如果是立即断开连接
  if (immediate) {
    performDisconnect();
    return;
  }
  
  // 检查是否在连接稳定期内 - 如果是最近才连接成功，避免断开
  const timeSinceConnect = Date.now() - connectionState.lastConnectTime;
  if (timeSinceConnect < CONNECTION_STABILITY_PERIOD) {
    return;
  }
  
  // 非立即断开时，设置延迟，允许重连逻辑有机会处理
  connectionState.disconnectTimer = setTimeout(() => {
    // 再次检查状态，如果此时还有连接请求或已连接，则不断开
    if (connectionState.connectionPromise || 
       (websocket && websocket.readyState === WebSocket.CONNECTING)) {
      return;
    }
    
    // 最后检查当前URL路径，如果URL包含相同图表ID，则保持连接
    if (connectionState.diagramId) {
      const currentPath = window.location.pathname;
      if (currentPath.includes(`/editor/${connectionState.diagramId}`)) {
        return;
      }
    }
    
    performDisconnect();
  }, DISCONNECT_DELAY);
};

/**
 * 执行实际的断开连接操作
 */
const performDisconnect = () => {
  // 在关闭连接前先尝试发送离开消息
  if (websocket && websocket.readyState === WebSocket.OPEN && connectionState.diagramId) {
    try {
      const clientId = typeof window !== 'undefined' ? localStorage.getItem('drawdb_client_id') : null;
      if (clientId) {
        const leaveMessage = {
          type: 'user_leave',
          clientId: clientId,
          diagramId: connectionState.diagramId
        };
        
        // 尝试直接发送离开消息
        websocket.send(JSON.stringify(leaveMessage));
        console.log('断开连接前发送用户离开消息', leaveMessage);
      }
    } catch (error) {
      console.warn('断开连接前发送离开消息失败:', error);
    }
  }
  
  // 清除所有定时器
  clearInterval(connectionState.heartbeatTimer);
  clearTimeout(connectionState.reconnectTimer);
  if (connectionState.disconnectTimer) {
    clearTimeout(connectionState.disconnectTimer);
    connectionState.disconnectTimer = null;
  }
  
  // 重置连接状态但保留diagramId和authFailed状态
  const prevDiagramId = connectionState.diagramId;
  const prevAuthFailed = connectionState.authFailed;
  
  // 更新连接状态
  connectionState.connected = false;
  connectionState.connecting = false;
  connectionState.connectionPromise = null;
  
  // 关闭WebSocket
  if (websocket) {
    try {
      websocket.onclose = null; // 防止触发onclose回调
      websocket.onerror = null; // 防止触发onerror回调
      websocket.close();
    } catch (error) {
      console.error(`WebSocket关闭错误:`, error);
    }
    
    websocket = null;
  }
  
  // 还原之前保存的状态
  connectionState.diagramId = prevDiagramId;
  connectionState.authFailed = prevAuthFailed;
  
  // 触发断开连接事件
  triggerEvent('onDisconnected');
};

/**
 * 启动WebSocket心跳机制
 */
const startHeartbeat = () => {
  // 清除现有心跳定时器
  clearInterval(connectionState.heartbeatTimer);
  
  // 创建新的心跳定时器
  connectionState.heartbeatTimer = setInterval(() => {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
      try {
        // 发送心跳消息，包含图表ID信息
        const pingMessage = { 
          type: 'ping',
          diagramId: connectionState.diagramId,
          timestamp: Date.now()
        };
        websocket.send(JSON.stringify(pingMessage));
      } catch (error) {
        console.error(`[WebSocketManager] 发送心跳错误:`, error);
        
        // 如果心跳失败，尝试重新连接
        disconnectWebSocket();
        
        if (!connectionState.authFailed && connectionState.diagramId) {
          connectToWebSocket(connectionState.diagramId);
        }
      }
    }
  }, HEARTBEAT_INTERVAL);
};

/**
 * 安排WebSocket重连
 * 使用退避算法来计算重连延迟
 */
const scheduleReconnect = () => {
  clearTimeout(connectionState.reconnectTimer);
  
  connectionState.reconnectAttempts++;
  // 使用指数退避算法计算延迟时间，并限制最大值
  const baseDelay = RECONNECT_DELAY * Math.pow(1.5, connectionState.reconnectAttempts - 1);
  const delay = Math.min(baseDelay, MAX_RETRY_INTERVAL);
  
  console.log(`安排WebSocket重连，尝试次数: ${connectionState.reconnectAttempts}，延迟: ${delay}ms`);
  
  connectionState.reconnectTimer = setTimeout(() => {
    if (connectionState.diagramId && !connectionState.authFailed) {
      connectToWebSocket(connectionState.diagramId);
    }
  }, delay);
};

/**
 * 发送WebSocket消息
 * @param {Object} data - 消息数据
 */
export const sendOperation = (data) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    throw new Error("WebSocket未连接");
  }
  
  try {
    websocket.send(JSON.stringify(data));
  } catch (error) {
    console.error(`[WebSocketManager] 发送消息错误:`, error);
    throw error;
  }
};

/**
 * 发送光标位置
 * @param {Object} data - 光标位置数据
 */
export const sendCursorPosition = (data) => {
  if (!websocket || websocket.readyState !== WebSocket.OPEN) {
    console.warn("[WebSocketManager] 无法发送光标位置: WebSocket未连接");
    return;
  }
  
  try {
    const message = {
      type: 'cursor',
      ...data
    };
    
    websocket.send(JSON.stringify(message));
  } catch (error) {
    console.error(`[WebSocketManager] 发送光标位置错误:`, error);
  }
};

/**
 * 检查WebSocket是否已连接
 * @returns {boolean} 连接状态
 */
export const isConnected = () => {
  return websocket !== null && 
         websocket.readyState === WebSocket.OPEN && 
         connectionState.connected === true;
};

/**
 * 重置认证失败状态
 */
export const resetAuthFailedState = () => {
  connectionState.authFailed = false;
};

/**
 * 获取连接状态
 * @returns {Object} 连接状态对象
 */
export const getConnectionState = () => {
  return { ...connectionState };
};

/**
 * 重置连接状态但保留认证状态
 * 用于在组件重新挂载时恢复连接状态
 */
export const resetConnectionState = () => {
  // 保存当前的认证状态和图表ID
  const { authFailed, diagramId } = connectionState;
  
  // 仅解除连接状态，但保留重要状态
  connectionState.connected = false;
  connectionState.connecting = false;
  connectionState.connectionPromise = null;
  connectionState.reconnectAttempts = 0;
  
  // 还原保存的状态
  connectionState.authFailed = authFailed;
  connectionState.diagramId = diagramId;
  
  // 不触发断开事件，因为这只是状态的重置而不是物理断开
};

/**
 * 刷新WebSocket连接
 * 尝试重新连接到当前图表
 * @returns {Promise} 连接状态Promise
 */
export const refreshConnection = () => {
  // 如果没有当前图表ID，则无法刷新
  if (!connectionState.diagramId) {
    console.warn(`无法刷新WebSocket连接：没有当前图表ID`);
    return Promise.reject(new Error('无法刷新连接：没有当前图表ID'));
  }
  
  // 如果已经连接，则无需刷新
  if (isConnected()) {
    return Promise.resolve();
  }
  
  // 强制关闭现有连接
  disconnectWebSocket(true);
  
  // 重置重连尝试次数，给刷新更多机会
  connectionState.reconnectAttempts = 0;
  
  // 延迟一点再连接，避免状态冲突
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      connectToWebSocket(connectionState.diagramId)
        .then(resolve)
        .catch(reject);
    }, 500);
  });
};

/**
 * 生成随机颜色
 * @returns {string} 随机颜色的HEX值
 */
const getRandomColor = () => {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
};

/**
 * 发送用户离开消息
 * 在用户离开页面或明确断开连接时使用
 * @param {string} diagramId - 图表ID
 * @param {string} clientId - 客户端ID
 * @param {boolean} disconnectAfterSend - 发送后是否断开连接，默认为true
 * @returns {boolean} 发送是否成功
 */
export const sendLeaveMessage = (diagramId, clientId, disconnectAfterSend = true) => {
  if (!diagramId || !clientId) {
    console.warn('发送离开消息失败: 缺少diagramId或clientId');
    return false;
  }
  
  let sendSuccess = false;
  
  // 首先尝试使用WebSocket直接发送
  if (websocket && websocket.readyState === WebSocket.OPEN) {
    try {
      const leaveMessage = {
        type: 'user_leave',
        clientId: clientId,
        diagramId: diagramId,
        forceDisconnect: true // 告知服务器强制断开此客户端连接
      };
      
      // 直接通过WebSocket发送
      websocket.send(JSON.stringify(leaveMessage));
      console.log('成功发送WebSocket用户离开消息:', clientId);
      sendSuccess = true;
      
      // 给服务器一点时间处理消息，然后断开连接
      if (disconnectAfterSend) {
        setTimeout(() => {
          performDisconnect();
        }, 100);
      }
      
      return true;
    } catch (wsError) {
      console.warn('通过WebSocket发送离开消息失败，尝试使用HTTP方式:', wsError);
    }
  }
  
  // 如果WebSocket方式失败，尝试使用Beacon API
  try {
    const leaveMessage = {
      type: 'user_leave',
      clientId: clientId,
      diagramId: diagramId,
      forceDisconnect: true // 告知服务器强制断开此客户端连接
    };
    
    // 定义API端点
    const apiUrl = `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/leave`;
    
    // 使用Beacon API发送
    const success = navigator.sendBeacon(apiUrl, JSON.stringify(leaveMessage));
    console.log('通过Beacon API发送用户离开消息:', success ? '成功' : '失败');
    sendSuccess = success;
    
    // 即使使用Beacon API，也尝试主动断开WebSocket连接
    if (disconnectAfterSend && websocket) {
      performDisconnect();
    }
    
    return success;
  } catch (beaconError) {
    console.error('发送离开消息失败:', beaconError);
    
    // 如果所有方式都失败，但仍需断开连接
    if (disconnectAfterSend && websocket) {
      performDisconnect();
    }
    
    return false;
  }
}; 