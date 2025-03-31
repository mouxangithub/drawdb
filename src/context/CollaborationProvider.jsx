import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { WebSocketContext } from './WebSocketContext';
import { useAuth } from './AuthContext';
import { 
  sendCursorPosition,
  isConnected,
  addWebSocketListener,
  removeWebSocketListener
} from '../services/websocketManager';
import { getRandomColor } from '../utils/colorUtils';
import { debounce } from '../utils/debounceUtils';

// 创建协作上下文
export const CollaborationContext = createContext({
  collaborators: [],
  cursors: {},
  sendCursorUpdate: () => {},
  currentUser: null,
});

/**
 * 协作提供者组件
 * 管理实时协作状态
 */
export default function CollaborationProvider({ children }) {
  // 上下文
  const { user } = useAuth();
  const wsContext = useContext(WebSocketContext);
  
  // 状态
  const [collaborators, setCollaborators] = useState([]);
  const [cursors, setCursors] = useState({});
  const cursorUpdateTimerId = useRef(null);
  
  // 用户颜色映射
  const [userColors] = useState(() => {
    const colors = {};
    // 为当前用户分配随机颜色
    if (user && user.id) {
      colors[user.id] = getRandomColor();
    }
    return colors;
  });
  
  /**
   * 处理WebSocket消息
   * @param {Object} event - 消息事件
   */
  const handleWSMessage = useCallback((event) => {
    try {
      if (event.data) {
        const data = JSON.parse(event.data);
        
        // 处理在线用户更新
        if (data.type === 'joined' || data.type === 'user_joined' || data.type === 'user_left') {
          setCollaborators(data.onlineUsers || []);
          
          // 为新用户分配颜色
          if (data.onlineUsers) {
            data.onlineUsers.forEach(u => {
              if (u.id && !userColors[u.id]) {
                userColors[u.id] = getRandomColor();
              }
            });
          }
        }
        
        // 处理光标位置更新
        if (data.type === 'cursor') {
          const { userId, position, username } = data;
          if (userId && position && userId !== user?.id) {
            setCursors(prev => {
              const updatedCursors = { ...prev };
              
              // 为用户分配颜色（如果没有）
              if (!userColors[userId]) {
                userColors[userId] = getRandomColor();
              }
              
              updatedCursors[userId] = {
                ...position,
                username: username || `用户 ${userId.substring(0, 6)}`,
                color: userColors[userId],
                timestamp: Date.now()
              };
              
              return updatedCursors;
            });
          }
        }
      }
    } catch (error) {
      console.error('解析协作消息错误:', error);
    }
  }, [user, userColors]);
  
  /**
   * 发送光标位置更新
   * 使用节流函数避免频繁发送
   */
  const sendCursorUpdate = useCallback(
    debounce((position) => {
      if (!user || !position || !isConnected()) {
        return;
      }
      
      try {
        // 发送光标位置
        sendCursorPosition({
          userId: user.id,
          username: user.username || user.email,
          position
        });
      } catch (error) {
        console.warn('发送光标位置更新失败:', error);
      }
    }, 50), // 50ms节流
    [user]
  );
  
  // 监听WebSocket消息
  useEffect(() => {
    // 添加WebSocket消息监听器
    const messageHandler = (event) => {
      handleWSMessage(event);
    };
    
    // 使用新的WebSocketManager监听器
    addWebSocketListener('onMessage', messageHandler);
    
    // 监听DOM事件（兼容性处理）
    const domMessageHandler = (event) => {
      if (event.detail && event.detail.data) {
        handleWSMessage({ data: event.detail.data });
      }
    };
    
    document.addEventListener('websocket_message', domMessageHandler);
    
    return () => {
      // 清理监听器
      removeWebSocketListener('onMessage', messageHandler);
      document.removeEventListener('websocket_message', domMessageHandler);
    };
  }, [handleWSMessage]);
  
  // 同步在线用户状态
  useEffect(() => {
    // 当连接状态更新时，同步用户列表
    setCollaborators(wsContext.users || []);
  }, [wsContext.users]);
  
  // 清理过期光标位置（超过5秒未更新）
  useEffect(() => {
    const CURSOR_TIMEOUT = 5000; // 5秒
    
    const cleanupTimer = setInterval(() => {
      const now = Date.now();
      
      setCursors(prev => {
        const updatedCursors = { ...prev };
        let hasChanges = false;
        
        Object.keys(updatedCursors).forEach(userId => {
          if (now - updatedCursors[userId].timestamp > CURSOR_TIMEOUT) {
            delete updatedCursors[userId];
            hasChanges = true;
          }
        });
        
        return hasChanges ? updatedCursors : prev;
      });
    }, 1000); // 每秒检查一次
    
    return () => {
      clearInterval(cleanupTimer);
    };
  }, []);
  
  // 清理
  useEffect(() => {
    return () => {
      // 清理任何定时器
      if (cursorUpdateTimerId.current) {
        clearTimeout(cursorUpdateTimerId.current);
      }
    };
  }, []);
  
  // 构造上下文值
  const contextValue = {
    collaborators,
    cursors,
    sendCursorUpdate,
    currentUser: user,
  };
  
  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
} 