import { useState, useEffect, useRef, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

/**
 * 用户活跃状态监控钩子
 * @param {string} diagramId - 当前图表ID
 * @param {number} inactiveThreshold - 用户被视为不活跃的时间阈值(毫秒)，默认2分钟
 * @param {number} checkInterval - 检查活跃状态的时间间隔(毫秒)，默认30秒
 * @returns {Object} 用户活跃状态相关功能
 */
export const useUserActivity = (
  diagramId,
  inactiveThreshold = 120000,
  checkInterval = 30000
) => {
  const { sendData, connected } = useWebSocket();
  const [activeUsers, setActiveUsers] = useState([]);
  const [lastActiveTime, setLastActiveTime] = useState({});
  
  // 记录用户活跃时间的Ref
  const activeUserTimestampsRef = useRef(new Map());
  
  // 最后一次清理时间
  const lastCleanupTimeRef = useRef(Date.now());
  
  // 用户活动防抖定时器
  const activityTimeoutRef = useRef(null);
  
  /**
   * 报告当前用户活跃状态
   */
  const reportActivity = useCallback(() => {
    if (!connected || !diagramId) return;
    
    try {
      const clientId = localStorage.getItem('drawdb_client_id');
      if (clientId) {
        const activityMessage = {
          type: 'user_activity',
          clientId,
          diagramId,
          timestamp: Date.now()
        };
        
        // 发送活跃消息
        sendData(activityMessage).catch(err => {
          console.warn('发送活跃消息失败', err);
        });
      }
    } catch (error) {
      console.error('记录用户活跃状态失败:', error);
    }
  }, [connected, diagramId, sendData]);
  
  /**
   * 清理不活跃用户
   */
  const cleanupInactiveUsers = useCallback(() => {
    const now = Date.now();
    
    // 如果距离上次清理不到检查间隔，跳过
    if (now - lastCleanupTimeRef.current < checkInterval) {
      return;
    }
    
    lastCleanupTimeRef.current = now;
    
    // 检测不活跃用户
    const inactiveUsers = [];
    const currentActiveUsers = [];
    
    activeUserTimestampsRef.current.forEach((timestamp, userId) => {
      if (now - timestamp > inactiveThreshold) {
        inactiveUsers.push(userId);
      } else {
        currentActiveUsers.push(userId);
      }
    });
    
    // 更新活跃用户列表
    setActiveUsers(currentActiveUsers);
    
    // 从活跃时间表中移除不活跃用户
    inactiveUsers.forEach(userId => {
      activeUserTimestampsRef.current.delete(userId);
    });
    
    // 如果有不活跃用户，请求刷新用户列表
    if (inactiveUsers.length > 0) {
      console.log('检测到不活跃用户，请求刷新用户列表:', inactiveUsers);
      document.dispatchEvent(new CustomEvent('request_refresh_users'));
    }
  }, [inactiveThreshold, checkInterval]);
  
  /**
   * 记录用户活跃状态
   * @param {string} userId - 用户ID
   * @param {number} timestamp - 活跃时间戳
   */
  const recordUserActivity = useCallback((userId, timestamp = Date.now()) => {
    if (!userId) return;
    
    // 更新活跃时间
    activeUserTimestampsRef.current.set(userId, timestamp);
    
    // 更新最后活跃时间状态
    setLastActiveTime(prev => ({
      ...prev,
      [userId]: timestamp
    }));
  }, []);
  
  /**
   * 处理用户活跃状态消息
   */
  const handleUserActivityMessage = useCallback((message) => {
    if (!message || message.type !== 'user_activity') return;
    
    const { clientId, timestamp } = message;
    if (clientId) {
      recordUserActivity(clientId, timestamp);
    }
  }, [recordUserActivity]);
  
  // 监听服务器发送的用户活跃状态消息
  useEffect(() => {
    const handleWebSocketMessage = (event) => {
      try {
        const data = typeof event.detail?.data === 'string' 
          ? JSON.parse(event.detail.data)
          : event.detail?.data;
        
        if (data && data.type === 'user_activity') {
          handleUserActivityMessage(data);
        }
      } catch (error) {
        console.error('处理WebSocket活跃状态消息失败:', error);
      }
    };
    
    // 添加消息监听器
    document.addEventListener('websocket_message', handleWebSocketMessage);
    
    // 清理函数
    return () => {
      document.removeEventListener('websocket_message', handleWebSocketMessage);
    };
  }, [handleUserActivityMessage]);
  
  // 定期检查用户活跃状态
  useEffect(() => {
    if (!diagramId || !connected) return;
    
    // 创建用户活跃状态检查定时器
    const activityInterval = setInterval(() => {
      // 报告当前用户活跃
      reportActivity();
      
      // 清理不活跃用户
      cleanupInactiveUsers();
    }, checkInterval);
    
    // 监听用户互动，记录活跃状态
    const userActivityEvents = ['mousemove', 'keydown', 'click', 'scroll'];
    
    // 使用防抖函数避免频繁触发
    const handleUserActivity = () => {
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      activityTimeoutRef.current = setTimeout(() => {
        reportActivity();
      }, 500);
    };
    
    // 添加用户活跃事件监听
    userActivityEvents.forEach(eventType => {
      document.addEventListener(eventType, handleUserActivity, { passive: true });
    });
    
    // 初始化时也发送一次活跃状态
    reportActivity();
    
    // 清理函数
    return () => {
      clearInterval(activityInterval);
      
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current);
      }
      
      userActivityEvents.forEach(eventType => {
        document.removeEventListener(eventType, handleUserActivity);
      });
    };
  }, [
    diagramId, 
    connected, 
    reportActivity, 
    cleanupInactiveUsers, 
    checkInterval
  ]);
  
  return {
    activeUsers,
    lastActiveTime,
    recordUserActivity,
    reportActivity
  };
}; 