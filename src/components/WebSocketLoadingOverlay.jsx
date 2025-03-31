import React, { useEffect, useState } from 'react';
import { Spin, Typography, Button } from '@douyinfe/semi-ui';
import { IconLoading, IconRefresh, IconClose, IconInfoCircle, IconAlertTriangle, IconWifi } from '@douyinfe/semi-icons';
import { useWebSocket } from '../hooks';
import { useTranslation } from 'react-i18next';
import { diagramWebSocketApi } from '../services/diagramWebSocketService';
import '../styles/components/WebSocketLoadingOverlay.css';

const { Text, Title } = Typography;

/**
 * WebSocket加载覆盖层组件
 * 在WebSocket连接或请求处理过程中显示加载状态
 */
export default function WebSocketLoadingOverlay() {
  const { loading, connected, lastError, connectionAttempts, refresh, clearAuthError } = useWebSocket();
  const { t } = useTranslation();
  
  // 检查是否认证失败
  const isAuthFailed = diagramWebSocketApi.isAuthFailed && diagramWebSocketApi.isAuthFailed();
  
  // 是否显示连接错误（非认证错误）
  const hasConnectionError = !connected && lastError && !isAuthFailed;
  
  // 显示条件：正在加载、认证失败或连接错误
  if (!loading && !isAuthFailed && !hasConnectionError) {
    return null;
  }
  
  // 根据连接尝试次数和状态生成合适的消息
  let message = t('connecting_to_collaboration');
  let statusIcon = <IconLoading size="large" />;
  
  if (isAuthFailed) {
    message = t('auth_failed');
    statusIcon = <IconAlertTriangle size="large" style={{ color: 'var(--semi-color-danger)' }} />;
  } else if (hasConnectionError) {
    message = t('connection_failed');
    statusIcon = <IconWifi size="large" style={{ color: 'var(--semi-color-danger)' }} />;
  } else if (connectionAttempts > 1) {
    message = t('reconnecting', { count: connectionAttempts });
    statusIcon = <IconRefresh size="large" style={{ color: 'var(--semi-color-warning)' }} />;
  } else if (connected) {
    message = t('synchronizing_data');
    statusIcon = <IconInfoCircle size="large" style={{ color: 'var(--semi-color-info)' }} />;
  }
  
  // 刷新页面处理函数
  const handleRefresh = () => {
    window.location.reload();
  };
  
  // 重新连接处理函数
  const handleReconnect = () => {
    refresh().catch(error => {
      console.error('手动重连失败:', error);
    });
  };
  
  // 重置认证错误处理函数
  const handleResetAuth = () => {
    if (clearAuthError) {
      clearAuthError();
    }
  };
  
  // 获取可能的API地址（用于提示用户）
  const possibleApiUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : window.location.origin;
  
  return (
    <div className="websocket-loading-overlay">
      <div className="loading-content">
        <div className="status-icon">
          {statusIcon}
        </div>
        <div className="message-container">
          <Text className={hasConnectionError || isAuthFailed ? 'error-text' : 'loading-text'}>
            {message}
          </Text>
          
          {(hasConnectionError || isAuthFailed) && (
            <div className="actions">
              {hasConnectionError && (
                <Button icon={<IconRefresh />} onClick={handleReconnect}>
                  {t('reconnect')}
                </Button>
              )}
              
              {isAuthFailed && (
                <Button icon={<IconRefresh />} onClick={handleResetAuth}>
                  {t('reset_auth_status')}
                </Button>
              )}
              
              <Button icon={<IconRefresh />} onClick={handleRefresh}>
                {t('refresh_page')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 