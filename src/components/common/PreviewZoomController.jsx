import { useEffect, useRef } from 'react';
import { useTransform } from '../../hooks';

/**
 * 预览缩放控制器组件
 * 用于在预览模式下自动设置缩放级别和平移位置
 * 
 * @param {Object} props - 组件属性
 * @param {number} props.zoom - 缩放级别
 * @param {Object} props.pan - 平移位置，包含x和y坐标
 * @param {number} props.delay - 设置缩放延时，毫秒，默认50
 */
const PreviewZoomController = ({ zoom, pan, delay = 50 }) => {
  const { setTransform } = useTransform();
  const isMounted = useRef(true);
  
  // 组件挂载后立即设置缩放值
  useEffect(() => {
    // 使用setTimeout确保在TransformContext完全初始化后执行
    const timer = setTimeout(() => {
      // 检查组件是否仍然挂载
      if (isMounted.current) {
        setTransform({
          zoom: zoom,
          pan: pan
        });
      }
    }, delay);
    
    // 清理函数
    return () => {
      isMounted.current = false;
      clearTimeout(timer);
    };
  }, [zoom, pan, delay, setTransform]);
  
  return null; // 这个组件不渲染任何内容
};

export default PreviewZoomController;