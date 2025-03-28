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
