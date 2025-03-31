import React, { useMemo } from 'react';
import { Tag, Tooltip, Avatar, Typography } from '@douyinfe/semi-ui';
import { IconTick, IconInfoCircle } from '@douyinfe/semi-icons';
import { useCollaboration } from '../context/CollaborationContext';
import { useTranslation } from 'react-i18next';

/**
 * 用户活跃状态指示器组件
 * 显示当前在线和活跃用户状态
 */
const UserActivityIndicator = () => {
  const { t } = useTranslation();
  const { collaborators, activeUsers } = useCollaboration();
  const { Text } = Typography;

  // 格式化用户最后活跃时间
  const formatLastActive = (timestamp) => {
    if (!timestamp) return t('unknown');
    
    const now = Date.now();
    const diff = now - timestamp;
    
    if (diff < 60000) {
      return t('just_now');
    } else if (diff < 3600000) {
      return t('minutes_ago', { minutes: Math.floor(diff / 60000) });
    } else {
      return t('hours_ago', { hours: Math.floor(diff / 3600000) });
    }
  };

  // 添加活跃状态信息到协作者数据
  const collaboratorsWithStatus = useMemo(() => {
    if (!collaborators || !collaborators.length) return [];
    
    return collaborators.map(user => {
      // 首先检查服务器返回的isActive标志
      let isActive = user.isActive;
      
      // 如果服务器未提供状态，则使用本地跟踪的活跃用户列表
      if (isActive === undefined && activeUsers && activeUsers.length) {
        isActive = activeUsers.includes(user.clientId);
      }
      
      // 如果两种方式都没有确定，默认为活跃状态
      if (isActive === undefined) {
        isActive = true; // 连接中的用户默认视为活跃
      }
      
      return {
        ...user,
        isActive
      };
    });
  }, [collaborators, activeUsers]);

  // 如果没有协作者，不渲染
  if (!collaboratorsWithStatus || collaboratorsWithStatus.length === 0) {
    return null;
  }

  return (
    <div className="user-activity-container">
      <div className="user-activity-header">
        <IconInfoCircle style={{ marginRight: '8px' }} />
        <Text strong>{t('active_users')}</Text>
      </div>
      
      <div className="user-activity-list">
        {collaboratorsWithStatus.map((user) => (
          <Tooltip
            key={user.clientId}
            content={
              <div>
                <div>{user.username}</div>
                <div>{t('status')}: {user.isActive ? t('active') : t('inactive')}</div>
                {user.lastActive && (
                  <div>{t('last_active')}: {formatLastActive(user.lastActive)}</div>
                )}
              </div>
            }
          >
            <div className={`user-activity-item ${user.isActive ? 'active' : 'inactive'}`}>
              <Avatar
                size="small"
                color={user.color || (user.isActive ? 'green' : 'grey')}
                style={{ marginRight: '8px' }}
              >
                {user.username?.slice(0, 2) || '??'}
              </Avatar>
              <Text ellipsis={{ showTooltip: true }} style={{ maxWidth: '100px' }}>
                {user.username}
              </Text>
              {user.isActive && (
                <Tag size="small" color="green" style={{ marginLeft: '8px' }}>
                  <IconTick size="small" />
                </Tag>
              )}
            </div>
          </Tooltip>
        ))}
      </div>

      <style jsx>{`
        .user-activity-container {
          padding: 12px;
          background-color: var(--semi-color-bg-2);
          border-radius: 4px;
          margin-bottom: 16px;
        }
        
        .user-activity-header {
          display: flex;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .user-activity-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .user-activity-item {
          display: flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
          background-color: var(--semi-color-bg-1);
          transition: all 0.3s ease;
        }
        
        .user-activity-item.active {
          border-left: 2px solid var(--semi-color-success);
        }
        
        .user-activity-item.inactive {
          opacity: 0.7;
          border-left: 2px solid var(--semi-color-tertiary);
        }
      `}</style>
    </div>
  );
};

export default UserActivityIndicator; 