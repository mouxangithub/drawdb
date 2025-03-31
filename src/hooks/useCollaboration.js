import { useContext } from 'react';
import { CollaborationContext } from '../context/CollaborationContext';

/**
 * 使用协作上下文的钩子
 * 提供对协作功能的访问
 * 
 * @returns {Object} 协作上下文
 * @property {Array} collaborators - 在线协作者列表
 * @property {Array} activeUsers - 活跃用户列表（最近有操作的用户）
 * @property {boolean} isCollaborating - 是否正在协作
 * @property {Date} lastUpdate - 最后更新时间
 * @property {Function} startCollaboration - 启动协作
 * @property {Function} stopCollaboration - 停止协作
 * @property {Function} sendCollaborationOperation - 发送协作操作
 * @property {Function} sendCollaborationCursor - 发送光标位置
 * @property {Array} pendingOperations - 待处理的操作
 */
export default function useCollaboration() {
  const context = useContext(CollaborationContext);
  
  if (!context) {
    throw new Error('useCollaboration必须在CollaborationProvider内部使用');
  }
  
  return context;
} 