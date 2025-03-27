/**
 * ID生成器工具
 * 提供生成唯一随机ID的功能
 */

import crypto from 'crypto';

/**
 * 生成指定长度的随机ID字符串（字母+数字组合）
 * @param {number} length - ID长度，默认为16
 * @returns {string} 随机生成的ID
 */
export const generateRandomId = (length = 16) => {
  // 创建可用字符集（字母+数字）
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  // 使用crypto模块生成随机字节
  const randomBytes = crypto.randomBytes(length);
  let result = '';
  
  // 将随机字节映射到字符集
  for (let i = 0; i < length; i++) {
    const index = randomBytes[i] % characters.length;
    result += characters.charAt(index);
  }
  
  return result;
};

/**
 * 生成唯一ID并确保与现有ID不重复
 * @param {Function} checkExistence - 检查ID是否已存在的回调函数
 * @param {number} length - ID长度，默认为16
 * @returns {Promise<string>} 生成的唯一ID
 */
export const generateUniqueId = async (checkExistence, length = 16) => {
  let id;
  let exists = true;
  
  // 循环生成ID直到找到不重复的
  while (exists) {
    id = generateRandomId(length);
    exists = await checkExistence(id);
  }
  
  return id;
}; 