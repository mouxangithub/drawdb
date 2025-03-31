import { createContext, useState, useEffect, useCallback, useRef } from "react";
import { 
  connectToWebSocket,
  disconnectWebSocket,
  sendOperation, 
  sendCursorPosition,
  isConnected,
  addWebSocketListener,
  removeWebSocketListener,
  getConnectionState,
  refreshConnection,
  resetConnectionState,
  sendLeaveMessage
} from "../services/websocketManager";
import { diagramWebSocketApi } from "../services/diagramWebSocketService";

export const WebSocketContext = createContext({
  connected: false,
  users: [],
  lastError: null,
  connect: () => {},
  disconnect: () => {},
  refresh: () => {},
  sendData: () => {},
  getStatus: () => {},
  loading: false,
  isAuthFailed: false,
});

/**
 * WebSocket上下文提供者组件
 * 管理WebSocket连接及相关状态
 */
export default function WebSocketContextProvider({ children }) {
  // 连接状态
  const [connected, setConnected] = useState(isConnected());
  // 在线用户列表
  const [users, setUsers] = useState([]);
  // 最近错误信息
  const [lastError, setLastError] = useState(null);
  // 数据请求状态
  const [loading, setLoading] = useState(false);
  // 保存请求ID映射到回调
  const [requestCallbacks] = useState(new Map());
  // 当前请求ID
  const [requestId, setRequestId] = useState(1);
  // 连接尝试次数计数器
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  // 当前图表ID
  const [currentDiagramId, setCurrentDiagramId] = useState(null);
  // 标记是否已安排重连（防止重复安排）
  const [scheduledReconnect, setScheduledReconnect] = useState(false);
  // 用于追踪最近一次连接尝试时间
  const lastReconnectAttemptRef = useRef(0);
  // 添加用户离开页面事件监听
  const currentDiagramIdRef = useRef(null);

  // 从连接管理器获取认证状态
  const isAuthFailed = getConnectionState().authFailed;

  /**
   * 获取下一个请求ID
   * @returns {string} 请求ID
   */
  const getNextRequestId = useCallback(() => {
    const nextId = `req_${requestId}`;
    setRequestId(prev => prev + 1);
    return nextId;
  }, [requestId]);

  /**
   * 连接到WebSocket服务器
   * @param {string} diagramId - 图表ID
   * @param {Object} options - 连接选项
   */
  const connect = useCallback((diagramId, options = {}) => {
    // 如果已经连接到相同图表，直接返回成功
    if (connected && currentDiagramId === diagramId) {
      return Promise.resolve();
    }
    
    // 在连接之前检查是否需要更新状态
    if (getConnectionState().diagramId !== diagramId) {
      setCurrentDiagramId(diagramId);
    }
    
    // 保存当前图表ID到ref，用于页面卸载时发送离开消息
    currentDiagramIdRef.current = diagramId;
    
    // 设置加载状态
    setLoading(true);
    setConnectionAttempts(prev => prev + 1);
    
    // 记录最近一次连接尝试时间
    lastReconnectAttemptRef.current = Date.now();
    
    // 使用统一连接管理器
    return connectToWebSocket(diagramId, options)
      .catch(error => {
        console.error('WebSocket连接错误:', error);
        setLastError(error.message);
        throw error; // 继续传递错误
      });
  }, [currentDiagramId, connected]);

  /**
   * 断开WebSocket连接
   * @param {boolean} immediate - 是否立即断开
   */
  const disconnect = useCallback((immediate = false) => {
    // 先发送离开消息，确保其他用户收到通知
    if (connected && currentDiagramIdRef.current) {
      const clientId = localStorage.getItem('drawdb_client_id');
      if (clientId) {
        // 从websocketManager导入的sendLeaveMessage函数
        sendLeaveMessage(currentDiagramIdRef.current, clientId);
      }
    }
    
    // 然后断开连接
    disconnectWebSocket(immediate);
    setConnected(false);
    setUsers([]);
    currentDiagramIdRef.current = null;
  }, [connected]);

  /**
   * 发送WebSocket消息，支持Promise回调
   * @param {Object} data - 消息数据
   * @returns {Promise} 消息响应Promise
   */
  const sendData = useCallback((data) => {
    return new Promise((resolve, reject) => {
      // 检查连接和认证状态
      if (getConnectionState().authFailed) {
        reject(new Error("认证失败，请刷新页面重试"));
        return;
      }
      
      if (!isConnected()) {
        reject(new Error("WebSocket未连接"));
        return;
      }

      // 设置请求加载状态
      setLoading(true);

      const reqId = getNextRequestId();
      const messageData = {
        ...data,
        requestId: reqId
      };

      // 保存回调函数，用于处理响应
      requestCallbacks.set(reqId, { 
        resolve: (data) => {
          setLoading(false);
          resolve(data);
        }, 
        reject: (error) => {
          setLoading(false);
          reject(error);
        } 
      });
      
      // 设置超时，如果超过指定时间未收到响应则拒绝Promise
      setTimeout(() => {
        if (requestCallbacks.has(reqId)) {
          const callbacks = requestCallbacks.get(reqId);
          requestCallbacks.delete(reqId);
          setLoading(false);
          callbacks.reject(new Error("请求超时"));
        }
      }, 15000); // 15秒超时
      
      // 发送消息
      try {
        sendOperation(messageData);
      } catch (error) {
        // 如果发送失败，清理回调并拒绝Promise
        requestCallbacks.delete(reqId);
        setLoading(false);
        reject(error);
      }
    });
  }, [getNextRequestId, requestCallbacks]);

  /**
   * 获取WebSocket状态
   * @returns {Object} 连接状态信息
   */
  const getStatus = useCallback(() => {
    const state = getConnectionState();
    return {
      connected,
      users,
      lastError,
      loading,
      isAuthFailed: state.authFailed,
      diagramId: state.diagramId
    };
  }, [connected, users, lastError, loading]);

  /**
   * 处理消息响应
   * @param {Object} data - 响应数据
   */
  const handleMessage = useCallback((data) => {
    const { requestId, type } = data;
    
    // 如果是对某个请求的响应
    if (requestId && requestCallbacks.has(requestId)) {
      const callbacks = requestCallbacks.get(requestId);
      requestCallbacks.delete(requestId);
      
      // 根据消息类型处理成功/失败
      if (type === 'error') {
        const errorMsg = data.message || '未知错误';
        callbacks.reject(new Error(errorMsg));
      } else {
        callbacks.resolve(data);
      }
      
      // 对于带有requestId的save_success等事件，一定是对特定请求的响应
      // 已经在上面处理过了，不应再处理，避免重复处理
      return;
    }
    
    // 检查是否是保存相关操作且不是当前客户端发起的
    if ((type === 'save_diagram' || type === 'save_success' || 
         (type === 'operation' && data.operation && data.operation.type === 'save'))) {
      
      // 获取源客户端ID，从不同可能的位置
      const sourceClientId = data.sourceClientId || 
                           (data.operation ? data.operation.sourceClientId : null);
      
      if (sourceClientId) {
        // 获取本地客户端ID
        const localClientId = localStorage.getItem('drawdb_client_id');
        
        // 如果不是本客户端发起的保存操作，不处理
        if (localClientId && sourceClientId !== localClientId) {
          return;
        }
      }
    }
    
    // 处理连接状态更新
    if (type === 'joined') {
      setConnected(true);
      setLoading(false);
      
      // 设置用户列表，确保包含活跃状态信息
      if (data.onlineUsers) {
        // 处理每个在线用户的活跃状态
        const usersWithActivity = data.onlineUsers.map(user => ({
          ...user,
          // 确保活跃状态字段存在
          isActive: user.isActive !== undefined ? user.isActive : true,
          lastActive: user.lastActive || Date.now()
        }));
        setUsers(usersWithActivity);
      } else {
        setUsers([]);
      }
      
      // 设置本地客户端ID，用于后续的消息过滤
      if (data.clientId && typeof window !== 'undefined') {
        localStorage.setItem('drawdb_client_id', data.clientId);
      }
    } else if (type === 'user_joined' || type === 'user_left') {
      // 处理用户加入或离开事件，包含活跃状态信息
      if (data.onlineUsers) {
        // 处理每个在线用户的活跃状态
        const usersWithActivity = data.onlineUsers.map(user => ({
          ...user,
          // 确保活跃状态字段存在
          isActive: user.isActive !== undefined ? user.isActive : true,
          lastActive: user.lastActive || Date.now()
        }));
        setUsers(usersWithActivity);
      } else {
        setUsers([]);
      }
    } else if (type === 'activity_ack') {
      // 处理活跃状态确认消息，这类消息有requestId但前面已处理
      // 不需要额外处理，因为已通过Promise回调处理
      return;
    } else if (type === 'save_success') {
      // 对于save_success事件，如果没有requestId，那可能是其他客户端的保存操作
      // 这种情况应该跳过，不触发额外的事件
      // 有requestId的情况在前面已经处理
      if (!requestId) {
        return;
      }
    } else if (type === 'diagram_updated') {
      // 检查是否有完整数据
      const diagramData = data.diagram || data.diagramData;
      const hasCompleteData = diagramData && (diagramData.tables || diagramData.references);
      
      // 收到更新事件时记录全局时间戳，用于限流
      window.lastReceivedUpdateTimestamp = Date.now();
      
      // 记录更新事件频率
      const messageFrequency = window.messageFrequency || {};
      const now = Date.now();
      const timeWindow = Math.floor(now / 5000); // 5秒时间窗口
      messageFrequency[timeWindow] = (messageFrequency[timeWindow] || 0) + 1;
      window.messageFrequency = messageFrequency;
      
      // 清理旧记录
      Object.keys(messageFrequency).forEach(key => {
        if (parseInt(key) < timeWindow - 1) {
          delete messageFrequency[key];
        }
      });
      
      // 计算当前消息频率
      const currentFrequency = messageFrequency[timeWindow] || 0;
      
      // 高频消息状态下，跳过一些低优先级消息
      const isHighFrequency = currentFrequency > 10; // 超过每5秒10条消息认为是高频
      const isLowPriority = data.priority === 'low' || data.isDrag;
      
      // 处理跟踪已发送消息的ID，防止反复处理自己发出的消息
      if (data.sourceUserId) {
        // 检查是否是自己发出的消息
        const localUserId = localStorage.getItem('drawdb_user_id');
        if (data.sourceUserId === localUserId && data.operationId) {
          // 获取已发送操作的集合
          const sentOperationIds = window.sentOperationIds || new Set();
          
          // 如果是自己发送的消息，且ID已记录，则跳过处理
          if (sentOperationIds.has(data.operationId)) {
            
            // 从集合中移除，避免内存泄漏
            sentOperationIds.delete(data.operationId);
            window.sentOperationIds = sentOperationIds;
            
            return;
          }
        }
      }
      
      // 如果是高频状态下的低优先级消息，可能跳过一些
      if (isHighFrequency && isLowPriority && !data.forceUpdate) {
        // 使用限流算法，以一定概率跳过消息
        // 频率越高，跳过概率越大
        const skipRate = Math.min(0.8, (currentFrequency - 10) * 0.05);
        if (Math.random() < skipRate) {
          return;
        }
      }
      
      if (hasCompleteData) {
        // 触发协作操作事件，包含完整数据，同时传递所有额外参数
        document.dispatchEvent(new CustomEvent('collaboration_operation', {
          detail: {
            type: 'diagram_updated',
            data: diagramData,
            sender: data.username || '协作者',
            senderId: data.userId,
            timestamp: data.timestamp || Date.now(),
            lastModified: data.lastModified || data.timestamp || Date.now(),
            isDrag: data.isDrag || false,
            silent: data.silent || false,
            hasCompleteData: true,
            priority: data.priority || 'normal',
            batchable: data.batchable || false,
            forceUpdate: data.forceUpdate || false,
            operationId: data.operationId,
            sourceUserId: data.sourceUserId
          }
        }));
      } else if (currentDiagramId) {
        // 没有完整数据，请求最新数据，但避免频繁请求
        // 检查是否最近刚请求过数据
        const lastFetchTime = window.lastDiagramFetchTime || 0;
        const now = Date.now();
        
        // 如果最近500毫秒内已经请求过数据，则跳过此次请求
        if (now - lastFetchTime < 500) {
          return;
        }
        
        // 更新最近请求时间
        window.lastDiagramFetchTime = now;
        setLoading(true);
        
        // 使用getAndBroadcast方法获取并广播完整数据
        diagramWebSocketApi.getAndBroadcast(currentDiagramId, {
          forceUpdate: true, // 强制更新
          priority: 'high'   // 高优先级
        })
        .then(() => {
          
          // 不再触发额外事件，服务器广播会自动触发事件
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
          setLastError('获取图表数据失败');
        });
      }
    } else if (type === 'operation') {
      // 处理协作操作
      if (data.operation) {
        document.dispatchEvent(new CustomEvent('collaboration_operation', {
          detail: {
            type: data.operation.type,
            data: data.operation.data,
            sender: data.sender || data.username || '协作者',
            senderId: data.senderId || data.userId,
            timestamp: data.timestamp || Date.now(),
            isDrag: data.operation.isDrag || false,
            silent: data.operation.silent || false,
            operationId: data.operation.operationId || data.operationId,
            sourceUserId: data.operation.sourceUserId || data.sourceUserId,
            importance: data.operation.importance || 'normal'
          }
        }));
      }
    } else if (type === 'cursor') {
      // 处理光标位置更新
      document.dispatchEvent(new CustomEvent('cursor_update', {
        detail: {
          position: data.position,
          userId: data.userId,
          username: data.username
        }
      }));
    } else if (type === 'auth_error') {
      // 处理认证错误
      setLastError('认证失败');
    }
  }, [requestCallbacks, currentDiagramId]);

  // 初始化WebSocket事件监听器
  useEffect(() => {
    // 连接成功处理函数
    const handleConnected = () => {
      setConnected(true);
      setLoading(false);
      setLastError(null);
    };
    
    // 断开连接处理函数
    const handleDisconnected = () => {
      setConnected(false);
      setUsers([]);
      setLoading(false);
    };
    
    // 连接错误处理函数
    const handleError = (error) => {
      setLoading(false);
      setConnected(false);
      setLastError(error.message || '连接错误');
    };
    
    // 添加事件监听器
    addWebSocketListener('onConnected', handleConnected);
    addWebSocketListener('onDisconnected', handleDisconnected);
    addWebSocketListener('onConnectionError', handleError);
    
    // 添加DOM事件监听器处理消息
    const messageHandler = (event) => {
      try {
        if (event.detail && event.detail.data) {
          const data = JSON.parse(event.detail.data);
          handleMessage(data);
        }
      } catch (error) {
        // 忽略解析错误
      }
    };
    
    document.addEventListener('websocket_message', messageHandler);
    
    // 清理函数
    return () => {
      removeWebSocketListener('onConnected', handleConnected);
      removeWebSocketListener('onDisconnected', handleDisconnected);
      removeWebSocketListener('onConnectionError', handleError);
      document.removeEventListener('websocket_message', messageHandler);
    };
  }, [handleMessage]);
  
  // 同步连接状态
  useEffect(() => {
    // 定期检查连接状态，确保UI状态与实际连接状态一致
    const connectionStateCheck = setInterval(() => {
      if (connected !== isConnected()) {
        setConnected(isConnected());
      }
      
      // 如果加载状态已持续15秒，但仍未连接成功，重置加载状态
      if (loading && !isConnected()) {
        const connectionState = getConnectionState();
        if (Date.now() - connectionState.lastAttemptTime > 15000) {
          setLoading(false);
          if (!lastError) {
            setLastError('连接超时，请重试');
          }
        }
      }
    }, 1000);
    
    return () => {
      clearInterval(connectionStateCheck);
    };
  }, [connected, loading, lastError]);

  /**
   * 刷新WebSocket连接
   * 用于在连接断开后手动恢复连接
   */
  const refresh = useCallback(() => {
    if (!currentDiagramId) {
      setLastError('无法刷新连接：没有当前图表ID');
      return Promise.reject(new Error('无法刷新连接：没有当前图表ID'));
    }
    
    setLoading(true);
    setLastError(null);
    
    return refreshConnection()
      .catch(error => {
        console.error('刷新连接错误:', error);
        setLastError(error.message);
        throw error;
      });
  }, [currentDiagramId]);

  // 自动重连逻辑
  useEffect(() => {
    // 检查是否符合重连条件
    const shouldReconnect = () => {
      return Boolean(
        currentDiagramId && // 有图表ID
        !connected && // 当前未连接
        !loading && // 不在加载中
        !isAuthFailed // 不是认证失败
      );
    };
    
    // 检查距离上次连接尝试的时间
    const checkTimeSinceLastAttempt = () => {
      const now = Date.now();
      const minReconnectInterval = 5000; // 至少5秒间隔
      return (now - lastReconnectAttemptRef.current) > minReconnectInterval;
    };
    
    if (shouldReconnect() && !scheduledReconnect && checkTimeSinceLastAttempt()) {
      setScheduledReconnect(true);
      
      // 使用随机延时，避免大量客户端同时重连
      const randomDelay = 3000 + Math.random() * 2000;
      
      const timer = setTimeout(() => {
        if (shouldReconnect()) { // 再次检查状态
          connect(currentDiagramId);
        }
        setScheduledReconnect(false);
      }, randomDelay);
      
      return () => {
        clearTimeout(timer);
        setScheduledReconnect(false);
      };
    }
  }, [currentDiagramId, connected, loading, isAuthFailed, connect, scheduledReconnect]);
  
  // 清除认证错误状态，提供重试机制
  const clearAuthError = useCallback(() => {
    diagramWebSocketApi.resetAuth();
    setLastError(null);
    if (currentDiagramId) {
      setTimeout(() => connect(currentDiagramId), 500);
    }
  }, [currentDiagramId, connect]);

  // 添加用户离开页面事件监听
  useEffect(() => {
    // 用户离开页面时的处理函数
    const handleBeforeUnload = () => {
      // 发送特定的用户离开消息，让服务器立即更新用户列表
      if (connected) {
        try {
          // 获取客户端ID
          const clientId = localStorage.getItem('drawdb_client_id');
          if (clientId) {
            // 优先尝试直接通过WebSocket发送（如果可用）
            if (isConnected()) {
              // 使用websocketManager中的sendLeaveMessage函数
              sendLeaveMessage(
                currentDiagramIdRef.current || currentDiagramId,
                clientId,
                true // 发送后立即断开连接
              );
            } else {
              // 备用方案：使用Beacon API
              const leaveMessage = {
                type: 'user_leave',
                clientId,
                diagramId: currentDiagramIdRef.current || currentDiagramId,
                forceDisconnect: true
              };
              
              // 使用sendBeacon确保消息能够发送，即使是在页面卸载过程中
              navigator.sendBeacon(
                `${import.meta.env.VITE_API_BASE_URL || window.location.origin}/api/leave`,
                JSON.stringify(leaveMessage)
              );
            }
            
            // 强制设置为断开状态，确保UI显示正确
            setConnected(false);
            setUsers([]);
          }
        } catch (error) {
          console.error('发送用户离开消息失败:', error);
        }
      }
    };
    
    // 添加页面卸载事件监听
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // 清理函数
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [connected, currentDiagramId]);

  return (
    <WebSocketContext.Provider
      value={{
        connected,
        users,
        lastError,
        connect,
        disconnect,
        refresh,
        sendData,
        getStatus,
        loading,
        setLoading,
        connectionAttempts,
        isAuthFailed,
        clearAuthError
      }}
    >
      {children}
    </WebSocketContext.Provider>
  );
} 