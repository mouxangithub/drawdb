import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { WebSocketContext } from './WebSocketContext';
import { sendCursorPosition, sendOperation } from '../services/websocketManager';
import { throttle } from '../utils/debounceUtils';
import { useAuth } from './AuthContext';
import { Toast } from '@douyinfe/semi-ui';

// 创建协作上下文
export const CollaborationContext = createContext({
  collaborators: [],
  activeUsers: [],
  isCollaborating: false,
  lastUpdate: null,
  startCollaboration: () => {},
  stopCollaboration: () => {},
  sendCollaborationOperation: () => {},
  sendCollaborationCursor: () => {},
  pendingOperations: [],
  handleCollaborationOperation: () => {},
});

/**
 * 协作提供者组件
 * 管理实时协作状态和操作
 */
export function CollaborationProvider({ children }) {
  const { id: diagramId } = useParams();
  const websocket = useContext(WebSocketContext);
  const { user } = useAuth() || { user: null };
  
  // 协作状态
  const [isCollaborating, setIsCollaborating] = useState(false);
  // 在线协作者
  const [collaborators, setCollaborators] = useState([]);
  // 活跃用户（最近有操作的用户）
  const [activeUsers, setActiveUsers] = useState([]);
  // 最后更新时间
  const [lastUpdate, setLastUpdate] = useState(null);
  // 待处理的操作
  const [pendingOperations, setPendingOperations] = useState([]);
  // 用于标记当前处理中的消息，避免循环处理
  const processingMessageRef = useRef(null);
  // 保存当前用户的ID，用于过滤自己发送的消息
  const currentUserIdRef = useRef(user?.id || localStorage.getItem('draw_db_user_id'));
  // 记录最近处理过的diagram_updated消息，避免短时间内重复处理同类消息
  const processedUpdatesRef = useRef(new Map());
  // 定义diagram_updated消息的去重时间窗口(毫秒)
  const UPDATE_DEDUP_WINDOW = 3000;
  
  // 批量操作缓冲区，用于合并短时间内的同类操作
  const operationBufferRef = useRef({
    operations: {},      // 按类型存储操作
    timeout: null,       // 延迟发送的定时器
    lastFlush: 0,        // 上次发送时间
    bufferTimeout: 200,  // 缓冲区延迟时间(ms)
    maxBufferSize: 5     // 最大缓冲数量
  });
  
  // 当前活跃用户的最后活动时间
  const activeUserTimestampsRef = useRef(new Map());
  // 最后一次清理时间
  const lastCleanupTimeRef = useRef(Date.now());
  // 用户活动防抖定时器
  const activityTimeoutRef = useRef(null);
  // 活跃检查时间间隔（30秒）
  const ACTIVITY_CHECK_INTERVAL = 30000;
  // 用户被视为离线的不活跃时间（2分钟）
  const INACTIVITY_THRESHOLD = 120000;
  // 记录最近接收到的在线用户列表
  const onlineUsersRef = useRef(new Map());
  
  // 自动从WebSocket上下文中获取在线用户
  useEffect(() => {
    if (websocket.users && websocket.users.length > 0) {
      // 过滤掉当前用户
      const otherUsers = websocket.users.filter(u => {
        // 这里根据用户ID进行过滤
        const currentUserId = user?.id || localStorage.getItem('draw_db_user_id');
        currentUserIdRef.current = currentUserId;
        return u.clientId !== currentUserId;
      });
      
      setCollaborators(otherUsers);
    } else {
      setCollaborators([]);
    }
  }, [websocket.users, user]);
  
  // 启动协作
  const startCollaboration = useCallback((options = {}) => {
    if (!diagramId) return;
    
    // 连接WebSocket
    websocket.connect(diagramId, options);
    setIsCollaborating(true);
    
    // 记录最后更新时间
    setLastUpdate(new Date());
  }, [diagramId, websocket]);
  
  // 停止协作
  const stopCollaboration = useCallback(() => {
    websocket.disconnect();
    setIsCollaborating(false);
    setCollaborators([]);
    setActiveUsers([]);
  }, [websocket]);
  
  /**
   * 检查是否应该处理diagram_updated消息
   * 简化处理逻辑，确保每条消息都被处理
   * @returns {boolean} 是否应该处理该消息
   */
  const shouldProcessDiagramUpdate = useCallback(() => {
    // 始终处理所有diagram_updated消息，确保图表始终是最新的
    return true;
  }, []);
  
  /**
   * 处理接收到的协作操作
   * @param {Object} operation - 操作数据
   */
  const handleCollaborationOperation = useCallback((operation) => {
    // 检查操作ID，避免处理重复操作
    if (operation.operationId) {
      const operationKey = `${operation.type}_${operation.operationId}`;
      const processedOperations = processedUpdatesRef.current;
      
      // 如果此操作最近处理过，跳过重复处理
      if (processedOperations.has(operationKey)) {
        console.log('跳过重复操作:', operationKey);
        return;
      }
      
      // 记录已处理的操作ID
      processedOperations.set(operationKey, Date.now());
      
      // 清理超时的记录，避免内存泄漏
      const now = Date.now();
      processedOperations.forEach((timestamp, key) => {
        if (now - timestamp > UPDATE_DEDUP_WINDOW) {
          processedOperations.delete(key);
        }
      });
    }
    
    // 跳过自己发送的消息，避免循环处理
    if (operation.senderId === currentUserIdRef.current || 
        operation.sourceUserId === currentUserIdRef.current) {
      console.log('跳过自己发送的操作:', operation.type);
      return;
    }
    
    // 如果当前正在处理相同的消息，跳过
    if (processingMessageRef.current === JSON.stringify(operation)) {
      return;
    }
    
    // 检查协作是否已启用，未启用则不处理
    if (!isCollaborating) {
      console.log('协作未启用，跳过消息处理');
      return;
    }
    
    // 标记当前正在处理的消息
    processingMessageRef.current = JSON.stringify(operation);
    
    try {
      // 触发事件，通知组件处理数据变更
      if (operation.type && operation.data) {
        // 处理图表更新事件
        if (operation.type === 'diagram_updated' || operation.type === 'full_update') {
          // 检查是否是低优先级拖拽更新，并且在高频率下
          const isPotentiallySkippable = operation.isDrag && operation.priority === 'low';
          
          if (isPotentiallySkippable) {
            // 获取系统当前负载状态
            const systemBusy = window.pendingUpdates > 2;
            const now = Date.now();
            const lastUpdateTime = window.lastDiagramUpdateTime || 0;
            const updateFrequency = now - lastUpdateTime;
            
            // 更新时间戳
            window.lastDiagramUpdateTime = now;
            
            // 在高频率高负载状态下，可能跳过一些拖拽更新
            if (systemBusy && updateFrequency < 300) {
              console.log('系统负载高，跳过低优先级拖拽更新');
              processingMessageRef.current = null;
              return;
            }
          }
          
          // 简化diagram_updated事件处理，直接触发事件
          document.dispatchEvent(new CustomEvent('collaboration_operation', {
            detail: {
              type: 'diagram_updated',
              data: operation.data,
              sender: operation.sender,
              senderId: operation.senderId,
              timestamp: operation.timestamp,
              isDrag: operation.isDrag || false,
              silent: operation.silent || false,
              hasCompleteData: true,
              forceUpdate: operation.forceUpdate || false,
              priority: operation.priority || 'normal',
              operationId: operation.operationId,
              sourceUserId: operation.sourceUserId
            }
          }));
        } else {
          // 正常触发其他类型的操作事件
          document.dispatchEvent(new CustomEvent('collaboration_operation', {
            detail: {
              ...operation,
              operationId: operation.operationId,
              sourceUserId: operation.sourceUserId
            }
          }));
        }
        
        // 显示协作操作通知，但减少频率
        if (operation.sender && !operation.silent) {
          // 非拖动操作才显示通知
          const actionName = getOperationActionName(operation.type);
          const entityName = getOperationEntityName(operation.type);
          Toast.info(`${operation.sender} ${actionName}了${entityName}`);
        }
        
        // 更新最后更新时间
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('处理协作操作失败:', error);
    } finally {
      // 短暂延迟后清除当前处理的消息标记
      setTimeout(() => {
        processingMessageRef.current = null;
      }, 100);
    }
  }, [isCollaborating]);
  
  // 获取操作类型的中文名称
  const getOperationActionName = (type) => {
    if (type.includes('add')) return '添加';
    if (type.includes('update')) return '更新';
    if (type.includes('delete')) return '删除';
    return '修改';
  };
  
  // 获取操作实体的中文名称
  const getOperationEntityName = (type) => {
    if (type.includes('table')) return '表格';
    if (type.includes('relationship')) return '关系';
    if (type.includes('note')) return '注释';
    if (type.includes('area')) return '区域';
    if (type.includes('title')) return '标题';
    return '数据';
  };
  
  /**
   * 延迟发送缓冲区中的操作
   */
  const flushOperationBuffer = useCallback(() => {
    const buffer = operationBufferRef.current;
    
    // 清除可能的延迟发送计时器
    if (buffer.timeout) {
      clearTimeout(buffer.timeout);
      buffer.timeout = null;
    }
    
    // 如果缓冲区为空，不处理
    if (Object.keys(buffer.operations).length === 0) {
      return;
    }
    
    // 记录本次flush时间
    buffer.lastFlush = Date.now();
    
    // 处理每种类型的操作
    Object.entries(buffer.operations).forEach(([opType, opData]) => {
      // 根据操作类型采取不同策略
      if (opType.includes('drag') || opType.includes('move')) {
        // 拖拽类操作只发送最新的一个
        const latestOp = opData.operations[opData.operations.length - 1];
        // 发送操作
        sendOperation({
          type: 'operation',
          operation: latestOp,
          diagramId,
          timestamp: Date.now(),
          senderId: user?.id || localStorage.getItem('draw_db_user_id'),
          sender: user?.username || localStorage.getItem('draw_db_user_name') || '未知用户'
        });
      } else {
        // 其他类型可以全部发送
        opData.operations.forEach(operation => {
          // 发送操作
          sendOperation({
            type: 'operation',
            operation,
            diagramId,
            timestamp: Date.now(),
            senderId: user?.id || localStorage.getItem('draw_db_user_id'),
            sender: user?.username || localStorage.getItem('draw_db_user_name') || '未知用户'
          });
        });
      }
    });
    
    // 清空缓冲区
    buffer.operations = {};
  }, [diagramId, user]);
  
  // 添加操作到缓冲区
  const addToOperationBuffer = useCallback((operation) => {
    const buffer = operationBufferRef.current;
    const opType = operation.type;
    
    // 高优先级操作直接发送，不进入缓冲区
    if (operation.forceUpdate || operation.importance === 'high') {
      // 发送操作
      sendOperation({
        type: 'operation',
        operation,
        diagramId,
        timestamp: Date.now(),
        senderId: user?.id || localStorage.getItem('draw_db_user_id'),
        sender: user?.username || localStorage.getItem('draw_db_user_name') || '未知用户'
      });
      return;
    }
    
    // 初始化该类型的缓冲区
    if (!buffer.operations[opType]) {
      buffer.operations[opType] = {
        operations: [],
        lastAdded: Date.now()
      };
    }
    
    // 添加到对应类型的缓冲区
    buffer.operations[opType].operations.push(operation);
    buffer.operations[opType].lastAdded = Date.now();
    
    // 检查是否应该立即发送
    const now = Date.now();
    const bufferSize = Object.values(buffer.operations).reduce(
      (total, data) => total + data.operations.length, 0
    );
    
    // 以下情况立即发送：
    // 1. 缓冲区操作总数超过阈值
    // 2. 距离上次flush超过指定时间
    // 3. 特定类型的操作数过多
    if (bufferSize >= buffer.maxBufferSize || 
        now - buffer.lastFlush > 500 ||
        buffer.operations[opType].operations.length >= 3) {
      flushOperationBuffer();
    } else if (!buffer.timeout) {
      // 否则设置延迟发送定时器
      buffer.timeout = setTimeout(flushOperationBuffer, buffer.bufferTimeout);
    }
  }, [flushOperationBuffer, diagramId, user]);
  
  // 发送协作操作
  const sendCollaborationOperation = useCallback((operation) => {
    if (!isCollaborating || !websocket.connected) return;
    
    // 更新最后更新时间
    setLastUpdate(new Date());
    
    try {
      // 使用操作缓冲区延迟发送
      addToOperationBuffer(operation);
    } catch (error) {
      console.error('发送协作操作失败:', error);
      // 将失败的操作添加到待处理队列
      setPendingOperations(prev => [...prev, operation]);
    }
  }, [isCollaborating, websocket.connected, addToOperationBuffer]);
  
  // 创建节流版本的发送光标位置函数
  const throttledSendCursorPosition = useRef(
    throttle((data) => {
      if (!isCollaborating || !websocket.connected) return;
      try {
        sendCursorPosition(data);
      } catch (error) {
        console.error('发送光标位置失败:', error);
      }
    }, 100) // 100毫秒的节流间隔
  ).current;
  
  // 发送光标位置
  const sendCollaborationCursor = useCallback((position) => {
    if (!isCollaborating || !websocket.connected) return;
    
    // 更新最后更新时间
    setLastUpdate(new Date());
    
    // 使用节流版本发送光标位置
    throttledSendCursorPosition({
      type: 'cursor',
      position,
      diagramId,
      userId: user?.id || localStorage.getItem('draw_db_user_id'),
      username: user?.username || localStorage.getItem('draw_db_user_name') || '未知用户',
      timestamp: Date.now()
    });
  }, [isCollaborating, websocket.connected, diagramId, throttledSendCursorPosition, user]);
  
  // 监听WebSocket消息
  useEffect(() => {
    // 处理WebSocket消息
    const handleWebSocketMessage = (event) => {
      try {
        const data = typeof event.detail?.data === 'string' 
          ? JSON.parse(event.detail.data)
          : event.detail?.data;
        
        // 处理用户活跃状态消息
        if (data && data.type === 'user_activity') {
          const { clientId, timestamp } = data;
          if (clientId) {
            // 记录用户活跃时间
            activeUserTimestampsRef.current.set(clientId, timestamp || Date.now());
            
            // 更新活跃用户列表
            const activeClientIds = Array.from(activeUserTimestampsRef.current.keys());
            setActiveUsers(activeClientIds);
          }
          return; // 活跃状态消息不需要进一步处理
        }
        
        // 只处理操作类型的消息
        if (data && data.type === 'operation' && data.operation) {
          handleCollaborationOperation({
            ...data.operation,
            sender: data.sender,
            senderId: data.senderId,
            timestamp: data.timestamp
          });
        }
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    };
    
    // 添加消息监听器
    document.addEventListener('websocket_message', handleWebSocketMessage);
    
    // 清理函数
    return () => {
      document.removeEventListener('websocket_message', handleWebSocketMessage);
    };
  }, [handleCollaborationOperation]);
  
  // 当连接状态发生变化时更新协作状态
  useEffect(() => {
    if (websocket.connected && diagramId) {
      setIsCollaborating(true);
    } else if (!websocket.connected) {
      setIsCollaborating(false);
    }
  }, [websocket.connected, diagramId]);
  
  // 当重新连接时重试待处理的操作
  useEffect(() => {
    if (isCollaborating && websocket.connected && pendingOperations.length > 0) {
      // 获取并清空待处理操作队列
      const operations = [...pendingOperations];
      setPendingOperations([]);
      
      // 重试每个操作
      operations.forEach(operation => {
        sendCollaborationOperation(operation);
      });
    }
  }, [isCollaborating, websocket.connected, pendingOperations, sendCollaborationOperation]);
  
  // 自动启动协作（如果有图表ID）
  useEffect(() => {
    if (diagramId && !isCollaborating && !websocket.connected) {
      // 延迟启动协作，避免频繁切换页面时出现连接冲突
      const timer = setTimeout(() => {
        startCollaboration();
      }, 300);
      
      return () => {
        clearTimeout(timer);
      };
    }
    
    return () => {
      // 在组件卸载时不立即停止协作
      // 让WebSocketManager处理连接的生命周期
      // 这样可以避免因为路由快速切换导致的连接/断开循环
    };
  }, [diagramId, isCollaborating, websocket.connected, startCollaboration]);
  
  // 在组件卸载时清理
  useEffect(() => {
    return () => {
      // 清理定时器
      const buffer = operationBufferRef.current;
      if (buffer.timeout) {
        clearTimeout(buffer.timeout);
        buffer.timeout = null;
      }
    };
  }, []);
  
  /**
   * 检查并清理离线用户
   * 定期检查用户活跃状态，移除离线用户
   */
  useEffect(() => {
    if (!isCollaborating || !diagramId) return;
    
    /**
     * 更新在线用户列表和活跃状态
     * @param {Array} users - 服务器发送的用户列表
     */
    const updateOnlineUsers = (users) => {
      if (!Array.isArray(users)) return;
      
      // 更新在线用户列表
      const now = Date.now();
      const newActiveUsers = [];
      
      users.forEach(user => {
        if (user.clientId) {
          // 记录用户活跃状态
          const isActive = user.isActive !== undefined ? user.isActive : true;
          
          if (isActive) {
            newActiveUsers.push(user.clientId);
          }
          
          // 更新用户最后活跃时间
          activeUserTimestampsRef.current.set(
            user.clientId, 
            user.lastActive || now
          );
          
          // 记录用户信息
          onlineUsersRef.current.set(user.clientId, user);
        }
      });
      
      // 更新当前活跃用户列表
      setActiveUsers(newActiveUsers);
    };
    
    // 处理用户列表更新事件
    const handleUserListUpdate = (event) => {
      try {
        const data = event.detail?.data;
        if (!data) return;
        
        // 解析数据
        const messageData = typeof data === 'string' ? JSON.parse(data) : data;
        
        // 处理用户加入/离开事件
        if (messageData.type === 'user_joined' || messageData.type === 'user_left') {
          // 更新用户列表
          if (messageData.onlineUsers) {
            updateOnlineUsers(messageData.onlineUsers);
          }
        } else if (messageData.type === 'joined') {
          // 初始连接时更新用户列表
          if (messageData.onlineUsers) {
            updateOnlineUsers(messageData.onlineUsers);
          }
        }
      } catch (error) {
        console.error('处理用户列表更新失败:', error);
      }
    };
    
    // 添加监听器
    document.addEventListener('websocket_message', handleUserListUpdate);
    
    // 清理函数
    return () => {
      document.removeEventListener('websocket_message', handleUserListUpdate);
    };
  }, [isCollaborating, diagramId]);
  
  return (
    <CollaborationContext.Provider
      value={{
        collaborators,
        activeUsers,
        isCollaborating,
        lastUpdate,
        startCollaboration,
        stopCollaboration,
        sendCollaborationOperation,
        sendCollaborationCursor,
        pendingOperations,
        handleCollaborationOperation,
      }}
    >
      {children}
    </CollaborationContext.Provider>
  );
}

/**
 * 使用协作上下文的钩子
 * @returns {Object} 协作上下文
 */
export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration必须在CollaborationProvider内部使用');
  }
  return context;
} 