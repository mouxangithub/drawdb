import { Tooltip, Badge, Avatar, Typography, Spin } from "@douyinfe/semi-ui";
import { useWebSocket } from "../hooks";
import { IconWifi, IconClose, IconUser, IconLoading } from "@douyinfe/semi-icons";
import { useTranslation } from "react-i18next";
import "../styles/components/CollaborationStatus.css";
import { useCollaboration } from "../context/CollaborationContext";

const { Text } = Typography;

/**
 * 根据用户标识符生成一致的颜色名称
 * @param {string} identifier - 用户标识符
 * @returns {string} 颜色名称
 */
const getColorByIdentifier = (identifier) => {
  // Semi Design支持的颜色列表
  const colorNames = [
    "red", "pink", "purple", "violet", "indigo", 
    "blue", "light-blue", "cyan", "teal", "green", 
    "light-green", "lime", "yellow", "amber", "orange"
  ];
  
  // 根据标识符生成一个一致的索引
  let hash = 0;
  if (identifier) {
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
      hash |= 0; // 转换为32位整数
    }
  }
  
  // 使用绝对值并取模得到一个有效的颜色索引
  const colorIndex = Math.abs(hash) % colorNames.length;
  return colorNames[colorIndex];
};

/**
 * 协作状态组件
 * 显示WebSocket连接状态和在线用户
 */
export default function CollaborationStatus() {
  const { connected, users, lastError, loading } = useWebSocket();
  const { t } = useTranslation();

  // 最多显示的用户数量
  const maxDisplayUsers = 3;

  // 计算可显示的用户和溢出数量
  const displayUsers = users.slice(0, maxDisplayUsers);
  const overflowCount = Math.max(0, users.length - maxDisplayUsers);

  // 确定显示状态
  let connectionStatus;
  let statusContent;
  
  if (loading) {
    connectionStatus = 'loading';
    statusContent = t("正在连接...");
  } else if (connected) {
    connectionStatus = 'connected';
    statusContent = t("协作模式");
  } else {
    connectionStatus = 'disconnected';
    statusContent = t("离线模式");
  }

  return (
    <div className={`collaboration-container ${connectionStatus}`}>
      {loading ? (
        <Tooltip content={t("正在建立协作连接")}>
          <Spin spinning indicator={<IconLoading size="small" />} />
        </Tooltip>
      ) : connected ? (
        <Tooltip content={t("协作连接已建立")}>
          <Badge dot status="success">
            <IconWifi size="small" style={{ color: 'var(--semi-color-success)' }} />
          </Badge>
        </Tooltip>
      ) : (
        <Tooltip content={lastError || t("协作连接已断开")}>
          <Badge dot status="danger">
            <IconClose size="small" style={{ color: 'var(--semi-color-danger)' }} />
          </Badge>
        </Tooltip>
      )}

      <Text size="small">
        {statusContent}
      </Text>

      {connected && users.length > 0 && (
        <div className="users-container">
          <IconUser size="small" style={{ color: 'var(--semi-color-text-2)' }} />
          
          <div className="user-avatars">
            {displayUsers.map(user => (
              <Tooltip key={user.clientId} content={user.username}>
                <Avatar 
                  size="extra-extra-small"
                  color={getColorByIdentifier(user.identifier || user.clientId)}
                  className="user-avatar"
                >
                  {user.username.charAt(0).toUpperCase()}
                </Avatar>
              </Tooltip>
            ))}
            
            {overflowCount > 0 && (
              <Tooltip content={users.slice(maxDisplayUsers).map(u => u.username).join(', ')}>
                <Avatar size="extra-extra-small" className="user-avatar" color="grey">
                  +{overflowCount}
                </Avatar>
              </Tooltip>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 