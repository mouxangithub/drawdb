/**
 * 图表WebSocket服务
 * 提供通过WebSocket进行图表的增删改查操作
 */
import { 
  connectToWebSocket, 
  isConnected, 
  sendOperation, 
  getConnectionState,
  resetAuthFailedState
} from "./websocketManager";

// 请求超时时间(ms)
const REQUEST_TIMEOUT = 20000;
// 最大重试次数
const MAX_RETRY_ATTEMPTS = 3;
// 重试延迟(ms)基数 - 使用指数退避算法
const BASE_RETRY_DELAY = 1000;

// 广播操作缓冲区，用于合并短时间内的操作
const broadcastBuffer = {
  operations: {},  // 按优先级分组的操作
  timeout: null,   // 延迟发送的定时器
  lastFlush: 0,    // 上次发送时间
  flushInterval: 300, // 刷新间隔(ms)
  
  // 添加操作到缓冲区
  addOperation(operation, diagramId, options = {}) {
    const priority = options.priority || 'normal';
    
    // 高优先级操作直接发送，不进入缓冲区
    if (priority === 'high' || options.forceUpdate) {
      this.sendBroadcast(diagramId, operation, options);
      return Promise.resolve({ success: true });
    }
    
    // 如果是不可合并的操作，直接发送
    if (options.batchable === false) {
      this.sendBroadcast(diagramId, operation, options);
      return Promise.resolve({ success: true });
    }
    
    // 初始化该优先级的缓冲区
    if (!this.operations[priority]) {
      this.operations[priority] = [];
    }
    
    // 对于拖拽操作，如果是同一个图表的，只保留最新的
    if (options.isDrag && options.batchable) {
      // 移除同一图表的旧拖拽操作
      this.operations[priority] = this.operations[priority].filter(op => 
        !(op.options.isDrag && op.diagramId === diagramId)
      );
    }
    
    // 添加到对应优先级的缓冲区
    this.operations[priority].push({
      operation,
      diagramId,
      options,
      timestamp: Date.now()
    });
    
    // 检查是否应该立即发送
    const now = Date.now();
    if (now - this.lastFlush >= this.flushInterval) {
      this.flush();
    } else if (!this.timeout) {
      // 设置延迟发送定时器
      this.timeout = setTimeout(() => this.flush(), 
                               this.flushInterval - (now - this.lastFlush));
    }
    
    return Promise.resolve({ success: true, batched: true });
  },
  
  // 发送广播
  sendBroadcast(diagramId, operation, options = {}) {
    try {
      if (!isConnected()) {
        console.warn('WebSocket未连接，无法发送广播');
        return false;
      }
      
      // 发送广播操作
      sendOperation({
        type: 'broadcast_update',
        diagramId,
        data: operation,
        ...options,
        timestamp: Date.now()
      });
      
      return true;
    } catch (error) {
      console.error('发送广播失败:', error);
      return false;
    }
  },
  
  // 刷新缓冲区，发送所有操作
  flush() {
    // 清除可能的延迟发送计时器
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
    
    // 记录本次flush时间
    this.lastFlush = Date.now();
    
    // 按优先级顺序处理操作
    const priorities = ['high', 'normal', 'low'];
    
    for (const priority of priorities) {
      const operations = this.operations[priority] || [];
      
      if (operations.length === 0) continue;
      
      // 处理该优先级的所有操作
      for (const op of operations) {
        this.sendBroadcast(op.diagramId, op.operation, {
          ...op.options,
          batched: true  // 标记为批处理的一部分
        });
      }
      
      // 清空该优先级的缓冲区
      this.operations[priority] = [];
    }
  }
};

// 定期自动刷新缓冲区，确保操作不会长时间积压
setInterval(() => {
  const now = Date.now();
  if (now - broadcastBuffer.lastFlush >= 500) {
    broadcastBuffer.flush();
  }
}, 500);

// 添加调试模式标志，默认关闭
const DEBUG_MODE = false;

/**
 * 确保WebSocket已连接
 * @param {string} diagramId - 图表ID
 * @returns {Promise} 连接成功后的Promise
 */
const ensureConnection = async (diagramId) => {
  // 如果认证已失败，直接拒绝
  if (getConnectionState().authFailed) {
    console.error('WebSocket认证已失败，请刷新页面重试');
    return Promise.reject(new Error('认证失败，请刷新页面重试'));
  }
  
  // 如果WebSocket已经连接，直接返回
  if (isConnected() && getConnectionState().diagramId === diagramId) {
    if (DEBUG_MODE) console.log(`WebSocket已连接到图表 ${diagramId}`);
    return Promise.resolve();
  }
  
  // 使用连接管理器进行连接
  try {
    if (DEBUG_MODE) console.log(`尝试连接到图表 ${diagramId}...`);
    await connectToWebSocket(diagramId);
    if (DEBUG_MODE) console.log(`成功连接到图表 ${diagramId}`);
    return Promise.resolve();
  } catch (error) {
    console.error(`WebSocket连接失败:`, error);
    
    // 检查错误是否与认证相关
    if (isAuthError(error)) {
      console.error('连接失败原因: 认证问题');
    }
    
    return Promise.reject(error);
  }
};

/**
 * 判断错误是否是认证失败
 * @param {Error} error - 错误对象
 * @returns {boolean} 是否是认证失败
 */
const isAuthError = (error) => {
  return error && error.message && (
    error.message.includes('未登录') || 
    error.message.includes('登录') || 
    error.message.includes('认证') || 
    error.message.includes('auth') || 
    error.message.includes('客户端未')
  );
};

/**
 * 带指数退避的重试操作执行器
 * @param {Function} operation - 要执行的操作函数
 * @param {number} maxRetries - 最大重试次数
 * @param {number} baseDelay - 基础重试延迟(ms)
 * @returns {Promise<any>} 操作结果
 */
const withRetry = async (operation, maxRetries = MAX_RETRY_ATTEMPTS, baseDelay = BASE_RETRY_DELAY) => {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 执行操作
      return await operation();
    } catch (error) {
      lastError = error;
      console.warn(`操作失败 (尝试 ${attempt + 1}/${maxRetries + 1}): ${error.message}`);
      
      // 如果是认证错误，不再重试
      if (isAuthError(error)) {
        console.error("认证失败，不再重试:", error.message);
        throw error;
      }
      
      // 如果不是最后一次尝试，等待后重试
      if (attempt < maxRetries) {
        // 使用指数退避算法计算延迟时间，增加随机因子避免雪崩
        const delay = baseDelay * Math.pow(2, attempt) + (Math.random() * 1000);
        console.log(`将在 ${Math.round(delay/1000)} 秒后重试...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // 如果所有尝试都失败，抛出最后一个错误
  throw lastError;
};

/**
 * 通过WebSocket发送请求并等待响应
 * @param {Object} data - 请求数据
 * @returns {Promise<Object>} 响应数据
 */
const sendRequest = (data) => {
  return new Promise((resolve, reject) => {
    // 如果认证已失败，直接拒绝
    if (getConnectionState().authFailed) {
      reject(new Error('认证失败，请刷新页面重试'));
      return;
    }
    
    // 确保WebSocket已连接
    if (!isConnected()) {
      reject(new Error('WebSocket未连接'));
      return;
    }
    
    // 生成唯一请求ID
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // 获取客户端ID
    const clientId = typeof window !== 'undefined' ? 
      localStorage.getItem('drawdb_client_id') : null;
    
    // 添加请求ID和客户端ID
    const requestData = {
      ...data,
      requestId,
      sourceClientId: clientId, // 添加源客户端ID，用于标识请求来源
    };
    
    // 设置一次性消息处理器
    const messageHandler = (event) => {
      try {
        const response = typeof event.data === 'string' ? 
          JSON.parse(event.data) : 
          (event.detail ? JSON.parse(event.detail.data) : null);
        
        // 检查是否为此请求的响应
        if (response && response.requestId === requestId) {
          // 根据响应类型处理结果
          if (response.type === 'error') {
            const errorMsg = response.message || '请求失败';
            
            // 检查是否是认证错误
            if (isAuthError({ message: errorMsg })) {
              // 修改全局认证状态（通过连接管理器）
              // 注意：全局状态应该由websocketManager来管理
            }
            
            reject(new Error(errorMsg));
          } else {
            resolve(response);
          }
          
          // 清除消息处理器
          document.removeEventListener('websocket_message', messageHandler);
          clearTimeout(timeoutId);
        }
      } catch (error) {
        // 忽略解析错误
      }
    };
    
    // 添加消息处理器到文档事件
    document.addEventListener('websocket_message', messageHandler);
    
    // 添加超时处理
    const timeoutId = setTimeout(() => {
      document.removeEventListener('websocket_message', messageHandler);
      reject(new Error('请求超时'));
    }, REQUEST_TIMEOUT);
    
    // 发送请求
    try {
      sendOperation(requestData);
    } catch (error) {
      // 如果发送失败，清理事件监听器并拒绝Promise
      document.removeEventListener('websocket_message', messageHandler);
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

/**
 * 图表WebSocket API
 */
export const diagramWebSocketApi = {
  /**
   * 获取单个图表
   * @param {string} id - 图表ID
   * @returns {Promise<Object>} 图表数据
   */
  getById: async (id) => {
    try {
      // 确保WebSocket已连接
      await ensureConnection(id);
      
      if (DEBUG_MODE) console.log(`正在获取图表 ${id} 数据...`);
      
      // 直接发送获取图表请求，不使用缓存
      const response = await sendRequest({
        type: 'get_diagram',
        diagramId: id,
        forceUpdate: true,
        timestamp: Date.now()
      });
      
      if (!response.diagram) {
        throw new Error('服务器返回了空的图表数据');
      }
      
      return response.diagram;
    } catch (error) {
      console.error(`获取图表 ${id} 失败:`, error);
      throw error;
    }
  },
  
  /**
   * 保存图表
   * @param {string} id - 图表ID
   * @param {Object} diagramData - 图表数据
   * @returns {Promise<Object>} 保存结果
   */
  save: async (id, diagramData) => {
    return withRetry(async () => {
      try {
        // 确保WebSocket已连接
        await ensureConnection(id);
        
        // 获取本地客户端ID
        const clientId = typeof window !== 'undefined' ? 
          localStorage.getItem('drawdb_client_id') : null;
        
        // 生成保存操作ID，用于防止重复处理
        const saveOperationId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // 保存到本地记录，用于识别自己发出的请求
        if (typeof window !== 'undefined') {
          const savedOpIds = window.savedOperationIds || new Set();
          savedOpIds.add(saveOperationId);
          window.savedOperationIds = savedOpIds;
          
          // 5秒后自动清理，避免内存泄漏
          setTimeout(() => {
            if (window.savedOperationIds) {
              window.savedOperationIds.delete(saveOperationId);
            }
          }, 5000);
        }
        
        // 发送保存图表请求
        const response = await sendRequest({
          type: 'save_diagram',
          diagramData: {
            ...diagramData,
            id
          },
          nonBroadcast: true,         // 标记为非广播
          doNotBroadcast: true,       // 冗余标记，防止字段名不一致
          privateOperation: true,     // 私有操作，不应发送给其他用户
          sourceClientId: clientId,   // 源客户端ID
          saveOperation: true,        // 标记为保存操作
          saveOperationId,            // 保存操作ID，用于防止重复处理
          processBySenderOnly: true   // 明确指示仅由发送者处理
        });
        
        // 返回保存结果
        return {
          success: true,
          version: response.version,
          timestamp: response.timestamp,
          saveOperationId
        };
      } catch (error) {
        console.error(`通过WebSocket保存图表 ${id} 失败:`, error);
        throw error;
      }
    });
  },
  
  /**
   * 创建新图表
   * @param {Object} diagramData - 图表数据
   * @returns {Promise<Object>} 创建结果
   */
  create: async (diagramData) => {
    return withRetry(async () => {
      try {
        // 确保WebSocket已连接 (无图表ID)
        await ensureConnection();
        
        // 获取本地客户端ID
        const clientId = typeof window !== 'undefined' ? 
          localStorage.getItem('drawdb_client_id') : null;
        
        // 发送创建图表请求
        const response = await sendRequest({
          type: 'create_diagram',
          diagramData,
          nonBroadcast: true, // 标记这是不应该广播给其他客户端的操作
          sourceClientId: clientId, // 添加源客户端ID
          saveOperation: true // 标记这是保存操作，服务器应特殊处理
        });
        
        // 返回创建结果
        return response.diagram;
      } catch (error) {
        console.error('通过WebSocket创建图表失败:', error);
        throw error;
      }
    });
  },
  
  /**
   * 广播图表更新
   * @param {string} diagramId - 图表ID 
   * @param {Object} diagramData - 图表数据
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 广播结果
   */
  broadcastUpdate: async (diagramId, diagramData, options = {}) => {
    try {
      // 确保WebSocket已连接
      await ensureConnection(diagramId);
      
      // 使用缓冲区管理广播操作
      return broadcastBuffer.addOperation(diagramData, diagramId, {
        silent: options.silent === undefined ? false : options.silent,
        isDrag: options.isDrag === undefined ? false : options.isDrag,
        priority: options.priority || 'normal',
        batchable: options.batchable === undefined ? false : options.batchable,
        returnCompleteData: options.returnCompleteData === undefined ? true : options.returnCompleteData,
        forceUpdate: options.forceUpdate === undefined ? false : options.forceUpdate,
        operationId: options.operationId,
        sourceUserId: options.sourceUserId,
        timestamp: options.timestamp || Date.now()
      });
    } catch (error) {
      console.error(`广播图表 ${diagramId} 更新失败:`, error);
      throw error;
    }
  },
  
  /**
   * 获取并广播图表数据
   * @param {string} diagramId - 图表ID
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 图表数据
   */
  getAndBroadcast: async (diagramId, options = {}) => {
    try {
      const diagram = await diagramWebSocketApi.getById(diagramId);
      
      if (!diagram) {
        throw new Error('获取图表数据失败');
      }
      
      // 广播获取到的图表数据
      await broadcastBuffer.addOperation(diagram, diagramId, {
        silent: true, // 静默更新
        priority: 'high', // 高优先级
        returnCompleteData: true,
        ...options
      });
      
      return diagram;
    } catch (error) {
      console.error(`获取并广播图表 ${diagramId} 失败:`, error);
      throw error;
    }
  },
  
  /**
   * 检查WebSocket连接状态
   * @returns {boolean} 是否已连接
   */
  isConnected: () => {
    return isConnected();
  },
  
  /**
   * 重置WebSocket认证失败状态
   */
  resetAuthFailed: () => {
    resetAuthFailedState();
  }
};

// 将API暴露为全局对象，方便其他模块直接访问
if (typeof window !== 'undefined') {
  window.diagramWebSocketApi = diagramWebSocketApi;
} 