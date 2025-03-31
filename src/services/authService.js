/**
 * 认证服务
 * 处理用户认证和令牌管理
 */

// 存储令牌的键名
const AUTH_TOKEN_KEY = 'draw_db_auth_token';
const USER_ID_KEY = 'draw_db_user_id';
const USER_NAME_KEY = 'draw_db_user_name';

/**
 * 获取认证令牌
 * @returns {string|null} 认证令牌或null
 */
export function getAuthToken() {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);
  return token || generateGuestToken();
}

/**
 * 设置认证令牌
 * @param {string} token - 认证令牌
 */
export function setAuthToken(token) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

/**
 * 清除认证令牌
 */
export function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * 获取用户ID
 * @returns {string} 用户ID
 */
export function getUserId() {
  let userId = localStorage.getItem(USER_ID_KEY);
  
  if (!userId) {
    // 生成一个随机ID
    userId = generateUserId();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  
  return userId;
}

/**
 * 获取用户名
 * @returns {string} 用户名
 */
export function getUserName() {
  let userName = localStorage.getItem(USER_NAME_KEY);
  
  if (!userName) {
    // 使用随机用户名
    userName = `用户${getUserId().substring(0, 6)}`;
    localStorage.setItem(USER_NAME_KEY, userName);
  }
  
  return userName;
}

/**
 * 设置用户名
 * @param {string} name - 用户名
 */
export function setUserName(name) {
  localStorage.setItem(USER_NAME_KEY, name);
}

/**
 * 生成客户访问令牌
 * @returns {string} 生成的客户令牌
 */
function generateGuestToken() {
  // 检查本地存储中是否已有客户令牌
  const existingToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (existingToken) {
    return existingToken;
  }
  
  // 生成新的客户令牌：guest_user_{随机字符串}_{时间戳}_{随机字符串}
  const randomId = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const token = `guest_user_${randomId}_${timestamp}_${randomSuffix}`;
  
  // 将令牌保存到本地存储
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  
  // 同时保存默认用户标识
  if (!localStorage.getItem(USER_ID_KEY)) {
    localStorage.setItem(USER_ID_KEY, `guest_${randomId}`);
  }
  
  // 保存默认用户名，如果没有设置的话
  if (!localStorage.getItem(USER_NAME_KEY)) {
    localStorage.setItem(USER_NAME_KEY, `访客_${randomId.substring(0, 6)}`);
  }
  
  return token;
}

/**
 * 生成唯一用户ID
 * @returns {string} 用户ID
 */
function generateUserId() {
  return 'user_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * 检查用户是否已认证
 * @returns {boolean} 是否已认证
 */
export function isAuthenticated() {
  return !!getAuthToken();
} 