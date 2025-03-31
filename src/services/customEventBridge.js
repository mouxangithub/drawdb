/**
 * 自定义事件桥
 * 提供组件间通信的事件总线
 */

// 事件监听器映射
const listeners = new Map();

// 节流控制 - 用于限制事件频率
let throttleTimers = new Map();
const MIN_EVENT_INTERVAL = 50; // 最小事件间隔（毫秒）

/**
 * 事件总线对象
 * 提供事件的订阅、发布和取消订阅功能
 */
export const eventBus = {
  /**
   * 订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  on(event, callback) {
    if (!listeners.has(event)) {
      listeners.set(event, []);
    }
    
    // 避免重复添加相同回调
    const callbacks = listeners.get(event);
    if (!callbacks.includes(callback)) {
      callbacks.push(callback);
    }
  },
  
  /**
   * 取消订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  off(event, callback) {
    if (!listeners.has(event)) return;
    
    const callbacks = listeners.get(event);
    const index = callbacks.indexOf(callback);
    
    if (index !== -1) {
      callbacks.splice(index, 1);
      
      // 如果没有监听器，则删除事件
      if (callbacks.length === 0) {
        listeners.delete(event);
      }
    }
  },
  
  /**
   * 发布事件
   * @param {string} event - 事件名称
   * @param {any} data - 事件数据
   */
  emit(event, data) {
    // 应用节流控制
    if (throttleTimers.has(event)) {
      return;
    }
    
    // 设置节流定时器
    throttleTimers.set(event, setTimeout(() => {
      throttleTimers.delete(event);
    }, MIN_EVENT_INTERVAL));
    
    // 如果没有监听器，使用DOM事件分发
    if (!listeners.has(event)) {
      // 创建并分发自定义事件
      document.dispatchEvent(new CustomEvent(event, { detail: data }));
      return;
    }
    
    // 调用所有监听器
    const callbacks = listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`事件处理错误 (${event}):`, error);
      }
    });
    
    // 同时触发DOM事件以支持非React组件
    document.dispatchEvent(new CustomEvent(event, { detail: data }));
  },
  
  /**
   * 一次性订阅事件
   * @param {string} event - 事件名称
   * @param {Function} callback - 回调函数
   */
  once(event, callback) {
    const onceCallback = (data) => {
      callback(data);
      this.off(event, onceCallback);
    };
    
    this.on(event, onceCallback);
  },
  
  /**
   * 清除所有事件监听器
   * @param {string} [event] - 可选的事件名称，如不提供则清除所有事件
   */
  clear(event) {
    if (event) {
      listeners.delete(event);
    } else {
      listeners.clear();
    }
  }
};

/**
 * 使用DOM事件API创建文档级事件
 * 注意：这主要用于非React组件或不共享React上下文的组件间通信
 * @param {string} eventName 事件名称
 * @param {Object} data 事件数据
 */
export function createCustomEvent(eventName, data) {
  document.dispatchEvent(new CustomEvent(eventName, { detail: data }));
}

/**
 * 带防抖功能的事件发布
 * @param {string} event - 事件名称
 * @param {any} data - 事件数据
 * @param {number} wait - 防抖延迟（毫秒）
 */
const debounceTimers = {};
export function debounceEmit(event, data, wait = 200) {
  if (debounceTimers[event]) {
    clearTimeout(debounceTimers[event]);
  }
  
  debounceTimers[event] = setTimeout(() => {
    eventBus.emit(event, data);
    delete debounceTimers[event];
  }, wait);
}

/**
 * 自定义事件桥接模块
 * 为WebSocket操作提供基于自定义事件的通信机制
 */

// 简化版本的事件桥接逻辑
document.addEventListener('DOMContentLoaded', () => {
  // 保存原始WebSocket类
  const OriginalWebSocket = window.WebSocket;
  
  // 重新定义WebSocket构造函数来劫持事件
  window.WebSocket = function(url, protocols) {
    // 调用原始WebSocket构造函数
    const socket = protocols ? new OriginalWebSocket(url, protocols) : new OriginalWebSocket(url);
    
    // 保存原始处理函数的引用
    const originalAddEventListener = socket.addEventListener;
    
    // 全局事件监听器，提供统一的事件转发
    const addGlobalListener = (type) => {
      originalAddEventListener.call(socket, type, (event) => {
        try {
          // 根据事件类型创建自定义事件
          let customEvent;
          
          if (type === 'open') {
            customEvent = new CustomEvent('websocket_connected');
          } else if (type === 'message') {
            customEvent = new CustomEvent('websocket_message', { detail: event });
          } else if (type === 'error') {
            customEvent = new CustomEvent('websocket_error', {
              detail: { message: '连接错误' }
            });
          } else if (type === 'close') {
            customEvent = new CustomEvent('websocket_disconnected', {
              detail: { code: event.code, reason: event.reason }
            });
          }
          
          if (customEvent) {
            document.dispatchEvent(customEvent);
          }
        } catch (error) {
          console.error(`分发WebSocket ${type} 事件失败:`, error);
        }
      });
    };
    
    // 添加所有标准事件的监听器
    addGlobalListener('open');
    addGlobalListener('message');
    addGlobalListener('error');
    addGlobalListener('close');
    
    return socket;
  };
  
  // 继承原始WebSocket的原型链和静态属性
  window.WebSocket.prototype = OriginalWebSocket.prototype;
  window.WebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
  window.WebSocket.OPEN = OriginalWebSocket.OPEN;
  window.WebSocket.CLOSING = OriginalWebSocket.CLOSING;
  window.WebSocket.CLOSED = OriginalWebSocket.CLOSED;
});

/**
 * WebSocket事件桥接
 * 通过自定义DOM事件提供WebSocket事件的桥接，方便不同组件之间的通信
 */
import { debounce } from '../utils/debounceUtils';

// 用于追踪连接状态的全局变量
let connectionInProgress = false;
// 最后一次连接尝试的时间戳
let lastConnectionAttempt = 0;
// 最小连接间隔(ms)
const MIN_CONNECTION_INTERVAL = 3000;

/**
 * 确保WebSocket已连接
 * @param {Function} initWebSocketFn - WebSocket初始化函数
 * @param {Function} isConnectedFn - WebSocket连接状态检查函数
 * @param {string} diagramId - 图表ID
 * @returns {Promise} 连接成功后的Promise
 */
export const ensureConnection = async (initWebSocketFn, isConnectedFn, diagramId) => {
  // 如果已连接，直接返回
  if (isConnectedFn()) {
    return Promise.resolve();
  }
  
  // 防止频繁连接 - 检查当前是否有连接进行中，以及上次连接时间
  const now = Date.now();
  if (connectionInProgress && now - lastConnectionAttempt < MIN_CONNECTION_INTERVAL) {
    return Promise.reject(new Error('连接尝试过于频繁，请稍后再试'));
  }
  
  // 更新状态
  connectionInProgress = true;
  lastConnectionAttempt = now;
  
  return new Promise((resolve, reject) => {
    // 设置连接超时
    const timeoutId = setTimeout(() => {
      connectionInProgress = false;
      reject(new Error('连接超时'));
    }, 10000); // 10秒超时
    
    // 成功连接的处理函数
    const connectedHandler = () => {
      clearTimeout(timeoutId);
      document.removeEventListener('websocket_connected', connectedHandler);
      document.removeEventListener('websocket_error', errorHandler);
      connectionInProgress = false;
      resolve();
    };
    
    // 连接错误的处理函数
    const errorHandler = (event) => {
      clearTimeout(timeoutId);
      document.removeEventListener('websocket_connected', connectedHandler);
      document.removeEventListener('websocket_error', errorHandler);
      connectionInProgress = false;
      reject(new Error(event.detail?.message || '连接错误'));
    };
    
    // 监听连接事件
    document.addEventListener('websocket_connected', connectedHandler);
    document.addEventListener('websocket_error', errorHandler);
    
    // 初始化WebSocket连接
    try {
      initWebSocketFn(diagramId);
    } catch (error) {
      clearTimeout(timeoutId);
      document.removeEventListener('websocket_connected', connectedHandler);
      document.removeEventListener('websocket_error', errorHandler);
      connectionInProgress = false;
      reject(error);
    }
  });
};

/**
 * 使用防抖的方式派发连接成功事件
 */
export const dispatchConnectedEvent = debounce(() => {
  try {
    document.dispatchEvent(new CustomEvent('websocket_connected'));
  } catch (error) {
    console.error('派发连接成功事件失败:', error);
  }
}, 100);

/**
 * 使用防抖的方式派发连接错误事件
 * @param {string} message - 错误消息
 */
export const dispatchErrorEvent = debounce((message) => {
  try {
    document.dispatchEvent(new CustomEvent('websocket_error', { 
      detail: { message }
    }));
  } catch (error) {
    console.error('派发连接错误事件失败:', error);
  }
}, 100); 