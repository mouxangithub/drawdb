import { useContext } from "react";
import { WebSocketContext } from "../context/WebSocketContext";

/**
 * WebSocket钩子函数，提供WebSocket连接、操作和状态管理
 * @returns {Object} WebSocket相关的状态和方法
 */
export default function useWebSocket() {
  const context = useContext(WebSocketContext);
  
  if (!context) {
    throw new Error("useWebSocket必须在WebSocketContextProvider内部使用");
  }
  
  return context;
} 