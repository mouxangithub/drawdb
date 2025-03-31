/**
 * 生成随机颜色
 * 生成一个适合界面的柔和随机颜色
 * 
 * @returns {string} 十六进制颜色代码
 */
export function getRandomColor() {
  // 使用较柔和的颜色（避免太亮或太暗）
  const r = Math.floor(Math.random() * 155 + 100);
  const g = Math.floor(Math.random() * 155 + 100);
  const b = Math.floor(Math.random() * 155 + 100);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * 根据字符串生成确定性颜色
 * 相同的字符串始终生成相同的颜色
 * 
 * @param {string} str - 输入字符串
 * @returns {string} 十六进制颜色代码
 */
export function getHashColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // 确保颜色适合界面（不太亮不太暗）
  let r = (hash & 0xFF0000) >> 16;
  let g = (hash & 0x00FF00) >> 8;
  let b = hash & 0x0000FF;
  
  // 调整亮度范围
  r = Math.min(Math.max(r, 100), 200);
  g = Math.min(Math.max(g, 100), 200);
  b = Math.min(Math.max(b, 100), 200);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
} 