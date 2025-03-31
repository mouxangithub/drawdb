import React, { useMemo, useEffect, useState } from 'react';
import { Tooltip, Avatar, Badge } from '@douyinfe/semi-ui';
import { useCollaboration } from '../context/CollaborationContext';
import { IconUser } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

/**
 * 在线协作用户列表组件
 * 显示当前在线协作的用户，超过5个则省略并显示总数
 */
export default function CollaboratorsList() {
  const { collaborators } = useCollaboration();
  const { t } = useTranslation();
  
  // 本地状态，用于平滑过渡
  const [localCollaborators, setLocalCollaborators] = useState([]);
  
  // 定期检测离线用户
  useEffect(() => {
    // 更新本地协作者列表，平滑过渡
    setLocalCollaborators(collaborators);
    
    // 创建定时器，每60秒请求刷新用户列表
    const refreshInterval = setInterval(() => {
      // 触发自定义事件，请求刷新用户列表
      document.dispatchEvent(new CustomEvent('request_refresh_users'));
    }, 60000); // 每分钟刷新一次
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [collaborators]);
  
  // 计算显示的用户和是否显示更多
  const { displayUsers, hasMore, totalUsers } = useMemo(() => {
    const total = localCollaborators.length;
    const display = localCollaborators.slice(0, 5);
    return {
      displayUsers: display,
      hasMore: total > 5,
      totalUsers: total
    };
  }, [localCollaborators]);
  
  // 如果没有协作者则不显示
  if (!localCollaborators || localCollaborators.length === 0) {
    return null;
  }
  
  return (
    <div className="collaborators-list" style={{ display: 'flex', alignItems: 'center', margin: '0 16px 0 8px' }}>
      {/* 显示前五个用户头像 */}
      <div className="collaborators-avatars" style={{ display: 'flex' }}>
        {displayUsers.map((user, index) => (
          <Tooltip key={user.clientId || index} content={user.username || t('collaborator')}>
            <div 
              style={{ 
                marginRight: '-8px', 
                zIndex: 5 - index,
                transition: 'all 0.3s ease-in-out',
                animation: 'fadeIn 0.5s' 
              }}
            >
              <Badge dot status="success" position="rightBottom">
                <Avatar 
                  size="small" 
                  color={getUserColor(user.color) || getRandomColor(user.clientId || index.toString())}
                >
                  {getUserInitials(user.username)}
                </Avatar>
              </Badge>
            </div>
          </Tooltip>
        ))}
      </div>
      
      {/* 如果有更多用户则显示数量 */}
      {hasMore && (
        <Tooltip content={t('more_collaborators', { count: totalUsers - 5 })}>
          <div 
            className="more-collaborators" 
            style={{ 
              marginLeft: '4px', 
              fontSize: '12px', 
              color: 'var(--semi-color-text-2)',
              transition: 'all 0.3s ease'
            }}
          >
            +{totalUsers - 5}
          </div>
        </Tooltip>
      )}
      
      {/* 添加CSS动画 */}
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}

/**
 * 根据用户名获取首字母头像
 * @param {string} username 用户名
 * @returns {string} 首字母或默认图标
 */
function getUserInitials(username) {
  if (!username) return <IconUser />;
  
  // 提取首字母
  const initials = username
    .split(/\s+/)
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
    
  return initials || <IconUser />;
}

/**
 * 将十六进制颜色转换为Avatar支持的颜色名称
 * @param {string} color 颜色值（十六进制或颜色名称）
 * @returns {string} Avatar支持的颜色名称
 */
function getUserColor(color) {
  // 如果没有颜色或已经是有效颜色名，直接返回
  if (!color) return null;
  
  // 有效的Avatar颜色列表
  const validColors = [
    "grey","red","pink","purple","violet","indigo","blue",
    "light-blue","cyan","teal","green","light-green",
    "lime","yellow","amber","orange","white"
  ];
  
  // 如果已经是有效颜色名，直接返回
  if (validColors.includes(color)) {
    return color;
  }
  
  // 十六进制颜色映射到Avatar支持的颜色
  const colorMap = {
    '#F44336': 'red',
    '#E91E63': 'pink',
    '#9C27B0': 'purple',
    '#673AB7': 'violet',
    '#3F51B5': 'indigo',
    '#2196F3': 'blue',
    '#03A9F4': 'light-blue',
    '#00BCD4': 'cyan',
    '#009688': 'teal',
    '#4CAF50': 'green',
    '#8BC34A': 'light-green',
    '#CDDC39': 'lime',
    '#FFEB3B': 'yellow',
    '#FFC107': 'amber',
    '#FF9800': 'orange',
    '#FF5722': 'orange',
    '#795548': 'grey',
    '#9E9E9E': 'grey',
    '#607D8B': 'grey'
  };
  
  // 查找最接近的颜色名
  return colorMap[color] || 'blue';
}

/**
 * 根据ID生成随机但固定的颜色
 * @param {string} id 用户ID
 * @returns {string} 颜色值
 */
function getRandomColor(id) {
  const colors = [
    'amber', 'blue', 'cyan', 'green', 
    'indigo', 'light-blue', 'lime', 'orange',
    'pink', 'purple', 'red', 'teal', 'violet'
  ];
  
  // 使用ID的哈希值来选择颜色，确保同一用户总是得到相同颜色
  const hash = id.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  return colors[hash % colors.length];
} 