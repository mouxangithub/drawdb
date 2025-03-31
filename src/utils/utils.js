import { dbToTypes } from "../data/datatypes";

export function dataURItoBlob(dataUrl) {
  const byteString = atob(dataUrl.split(",")[1]);
  const mimeString = dataUrl.split(",")[0].split(":")[1].split(";")[0];
  const arrayBuffer = new ArrayBuffer(byteString.length);
  const intArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    intArray[i] = byteString.charCodeAt(i);
  }

  return new Blob([intArray], { type: mimeString });
}

export function arrayIsEqual(arr1, arr2) {
  return JSON.stringify(arr1) === JSON.stringify(arr2);
}

export function strHasQuotes(str) {
  if (str.length < 2) return false;

  return (
    (str[0] === str[str.length - 1] && str[0] === "'") ||
    (str[0] === str[str.length - 1] && str[0] === '"') ||
    (str[0] === str[str.length - 1] && str[0] === "`")
  );
}

const keywords = ["CURRENT_TIMESTAMP", "NULL"];

export function isKeyword(str) {
  return keywords.includes(str.toUpperCase());
}

export function isFunction(str) {
  return /\w+\([^)]*\)$/.test(str);
}

export function areFieldsCompatible(db, field1, field2) {
  const same = field1.type === field2.type;
  if (dbToTypes[db][field1.type].compatibleWith) {
    return (
      dbToTypes[db][field1.type].compatibleWith.includes(field2.type) || same
    );
  }
  return same;
}

/**
 * 格式化日期时间为本地格式
 * @param {string|Date} dateTime - 日期时间字符串或Date对象
 * @returns {string} 格式化后的日期时间字符串
 */
export function formatDateTime(dateTime) {
  if (!dateTime) return '';

  try {
    const date = new Date(dateTime);
    if (isNaN(date.getTime())) return '';

    return new Intl.DateTimeFormat(navigator.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch (error) {
    console.error('日期格式化错误:', error);
    return '';
  }
}

/**
 * 生成随机用户名
 * @returns {string} 随机用户名
 */
export const getRandomName = () => {
  const adjectives = [
    '快乐的', '聪明的', '勇敢的', '友好的', '热情的',
    '活泼的', '机智的', '温柔的', '耐心的', '认真的',
    '积极的', '幽默的', '开朗的', '细心的', '善良的'
  ];
  
  const nouns = [
    '熊猫', '老虎', '狮子', '大象', '长颈鹿',
    '猴子', '兔子', '狐狸', '浣熊', '松鼠',
    '海豚', '企鹅', '蜜蜂', '蝴蝶', '孔雀'
  ];
  
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adj}${noun}`;
};

/**
 * 创建一个防抖函数
 * 防抖函数会在指定的延迟时间后调用函数，如果在延迟时间内函数被多次调用，则重新计时
 * 
 * @param {Function} func 要防抖的函数
 * @param {number} wait 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
export function debounce(func, wait) {
  let timeout;
  
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 创建一个节流函数
 * 节流函数会确保在指定的时间间隔内函数最多只执行一次
 * 
 * @param {Function} func 要节流的函数
 * @param {number} limit 时间间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
export function throttle(func, limit) {
  let inThrottle;
  
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
