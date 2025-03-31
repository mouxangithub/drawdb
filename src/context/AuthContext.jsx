import React, { createContext, useState, useContext, useEffect } from 'react';
import { getUserId, getUserName, setUserName } from '../services/authService';

// 创建认证上下文
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  updateUser: () => {},
});

/**
 * 认证上下文提供者
 * 管理用户认证状态
 */
export function AuthProvider({ children }) {
  // 用户状态
  const [user, setUser] = useState(null);
  // 是否已认证
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 初始化用户信息
  useEffect(() => {
    const userId = getUserId();
    const userName = getUserName();
    
    if (userId) {
      // 设置用户信息
      setUser({
        id: userId,
        username: userName,
        isGuest: true, // 默认为游客用户
      });
      
      setIsAuthenticated(true);
    }
  }, []);
  
  /**
   * 更新用户信息
   * @param {Object} userData - 用户数据
   */
  const updateUser = (userData) => {
    if (!userData) return;
    
    // 更新用户状态
    setUser(prev => ({
      ...prev,
      ...userData,
    }));
    
    // 如果更新了用户名，保存到本地存储
    if (userData.username) {
      setUserName(userData.username);
    }
  };
  
  // 构造上下文值
  const contextValue = {
    user,
    isAuthenticated,
    updateUser,
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 使用认证上下文的钩子
 * @returns {Object} 认证上下文
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    return {
      user: { 
        id: getUserId(),
        username: getUserName(),
        isGuest: true
      },
      isAuthenticated: !!getUserId(),
      updateUser: () => {}
    };
  }
  return context;
} 