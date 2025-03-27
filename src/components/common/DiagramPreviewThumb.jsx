import { useRef, useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography } from '@douyinfe/semi-ui';
import { darkBgTheme } from '../../data/constants';

/**
 * 图表交互式缩略图预览组件
 * 可以拖动和缩放预览，与编辑页面视图相似
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.diagram - 图表数据
 * @param {Function} props.onClick - 点击时的回调函数
 */
const DiagramPreviewThumb = ({ diagram, onClick }) => {
  const { t } = useTranslation();
  const canvasRef = useRef(null);
  const [transform, setTransform] = useState({
    pan: diagram?.pan || { x: 0, y: 0 },
    zoom: diagram?.zoom || 1
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  
  // 没有传入图表数据或没有表格数据时显示占位符
  if (!diagram || !diagram.tables || diagram.tables.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg h-full">
        <div className="text-center text-color">
          <Typography.Text className="text-sm font-medium mb-1">{t('diagram_has_no_tables')}</Typography.Text>
          <Typography.Text className="text-xs">{t('create_example_tables_to_start')}</Typography.Text>
        </div>
      </div>
    );
  }
  
  // 计算预览视口的尺寸
  const tables = diagram.tables || [];
  const relationships = diagram.references || [];
  const areas = diagram.areas || [];
  const notes = diagram.notes || [];
  
  // 确保表格数据有宽度和高度，如果没有则添加默认值
  const tablesWithDimensions = tables.map(table => {
    return {
      ...table,
      width: table.width || 180,
      height: table.height || (table.fields?.length * 30 + 40) || 100
    };
  });
  
  // 计算所有元素的边界框 (包括表格、区域和笔记)
  const allObjects = [
    ...tablesWithDimensions.map(t => ({ x: t.x, y: t.y, width: t.width, height: t.height })),
    ...areas.map(a => ({ x: a.x, y: a.y, width: a.width || 150, height: a.height || 100 })),
    ...notes.map(n => ({ x: n.x, y: n.y, width: n.width || 220, height: n.height || 100 }))
  ];
  
  if (allObjects.length === 0) {
    // 如果没有有效的对象，则使用默认视口
    return (
      <div className="flex-grow relative overflow-hidden rounded-lg h-full" ref={canvasRef}>
        <div 
          className="w-full h-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center" 
        >
          <div className="text-center text-color">
            <Typography.Text className="text-sm font-medium">{t('no_preview_available')}</Typography.Text>
          </div>
        </div>
      </div>
    );
  }
  
  // 获取所有对象的边界
  const minX = Math.min(...allObjects.map(obj => obj.x)) - 20;
  const minY = Math.min(...allObjects.map(obj => obj.y)) - 20;
  const maxX = Math.max(...allObjects.map(obj => obj.x + obj.width)) + 20;
  const maxY = Math.max(...allObjects.map(obj => obj.y + obj.height)) + 20;
  
  // 计算边界框宽高
  const width = Math.max(maxX - minX, 200);  // 确保最小宽度
  const height = Math.max(maxY - minY, 150); // 确保最小高度
  
  // 计算初始视口，优先使用图表自带的缩放和平移
  const viewBox = diagram.pan && diagram.zoom 
    ? {
        left: diagram.pan.x,
        top: diagram.pan.y,
        width: width / diagram.zoom,
        height: height / diagram.zoom
      }
    : {
        left: minX,
        top: minY,
        width: width,
        height: height
      };
  
  // 获取主题色
  const theme = localStorage.getItem("theme");
  const backgroundColor = theme === "dark" ? darkBgTheme : "white";
  
  // 处理鼠标按下以启动平移
  const handlePointerDown = (e) => {
    // 防止冒泡和默认行为
    e.preventDefault();
    e.stopPropagation();
    
    // 设置为平移状态
    setPanning({
      isPanning: true,
      panStart: transform.pan,
      cursorStart: { x: e.clientX, y: e.clientY },
    });
  };
  
  // 处理鼠标移动 - 使用 useCallback 包装
  const handlePointerMove = useCallback((e) => {
    if (panning.isPanning) {
      const deltaX = (panning.cursorStart.x - e.clientX) / transform.zoom;
      const deltaY = (panning.cursorStart.y - e.clientY) / transform.zoom;
      
      setTransform(prev => ({
        ...prev,
        pan: {
          x: panning.panStart.x + deltaX,
          y: panning.panStart.y + deltaY,
        },
      }));
    }
  }, [panning.isPanning, panning.cursorStart, panning.panStart, transform.zoom]);
  
  // 处理鼠标释放 - 使用 useCallback 包装
  const handlePointerUp = useCallback(() => {
    if (panning.isPanning) {
      setPanning({
        isPanning: false,
        panStart: { x: 0, y: 0 },
        cursorStart: { x: 0, y: 0 },
      });
    }
  }, [panning.isPanning]);
  
  // 处理滚轮缩放 - 使用 useCallback 包装
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    
    // 计算缩放增量
    const delta = e.deltaY * -0.005;
    const newZoom = Math.max(0.1, Math.min(2, transform.zoom * (1 + delta)));
    
    // 计算缩放点为鼠标位置
    const rect = canvasRef.current?.getBoundingClientRect() || { left: 0, top: 0 };
    const mouseX = (e.clientX - rect.left) / transform.zoom + viewBox.left;
    const mouseY = (e.clientY - rect.top) / transform.zoom + viewBox.top;
    
    // 更新缩放和平移
    setTransform(prev => {
      const scale = newZoom / prev.zoom;
      
      return {
        zoom: newZoom,
        pan: {
          x: mouseX - (mouseX - prev.pan.x) * scale,
          y: mouseY - (mouseY - prev.pan.y) * scale,
        },
      };
    });
  }, [transform.zoom, viewBox.left, viewBox.top]);
  
  // 注册和移除事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      
      return () => {
        canvas.removeEventListener('wheel', handleWheel);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
      };
    }
  }, [panning.isPanning, handlePointerMove, handlePointerUp, handleWheel]);
  
  // 更新初始变换
  useEffect(() => {
    if (diagram?.pan && diagram?.zoom) {
      setTransform({
        pan: diagram.pan,
        zoom: diagram.zoom
      });
    }
  }, [diagram]);
  
  return (
    <div
      className="flex-grow relative overflow-hidden rounded-lg h-full cursor-grab touch-none"
      ref={canvasRef}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      style={{ cursor: panning.isPanning ? 'grabbing' : 'grab' }}
    >
      <div 
        className="w-full h-full" 
        style={{ backgroundColor }}
      >
        <svg
          className="w-full h-full touch-none"
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* 渲染区域 */}
          {areas.map(area => (
            <g key={`area-${area.id}`}>
              <foreignObject
                x={area.x}
                y={area.y}
                width={area.width || 150}
                height={area.height || 100}
              >
                <div
                  className="w-full h-full p-2 rounded border-2 border-slate-400"
                  style={{ backgroundColor: `${area.color || '#f0f0f0'}66` }}
                >
                  <div className="text-color select-none overflow-hidden text-ellipsis">
                    {area.name}
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
          
          {/* 渲染关系线 */}
          {relationships.map(rel => {
            const sourceTable = tablesWithDimensions.find(t => t.id === rel.sourceTableId);
            const targetTable = tablesWithDimensions.find(t => t.id === rel.targetTableId);
            
            if (!sourceTable || !targetTable) return null;
            
            // 简化的计算连接点的逻辑
            // 从源表边缘到目标表边缘绘制线条
            const sourceCenter = {
              x: sourceTable.x + sourceTable.width / 2,
              y: sourceTable.y + sourceTable.height / 2
            };
            const targetCenter = {
              x: targetTable.x + targetTable.width / 2,
              y: targetTable.y + targetTable.height / 2
            };
            
            // 计算线的方向
            const direction = {
              x: targetCenter.x - sourceCenter.x,
              y: targetCenter.y - sourceCenter.y
            };
            
            return (
              <g key={`rel-${rel.id}`}>
                <line
                  x1={sourceCenter.x}
                  y1={sourceCenter.y}
                  x2={targetCenter.x}
                  y2={targetCenter.y}
                  stroke="var(--semi-color-primary)"
                  strokeWidth={1.5}
                  strokeDasharray={rel.type?.includes('MANY') ? "3,3" : "none"}
                />
              </g>
            );
          })}
          
          {/* 渲染表格 */}
          {tablesWithDimensions.map(table => (
            <g key={`table-${table.id}`}>
              <foreignObject
                x={table.x}
                y={table.y}
                width={table.width}
                height={table.height}
                className="drop-shadow-lg rounded-md"
              >
                <div
                  className="select-none rounded-lg w-full bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border-2 border-gray-300 overflow-hidden"
                >
                  <div
                    className="h-[10px] w-full rounded-t-md"
                    style={{ backgroundColor: table.color || '#3498db' }}
                  />
                  <div
                    className="overflow-hidden font-bold h-[30px] flex justify-center items-center border-b border-gray-400 bg-zinc-200 dark:bg-zinc-900 px-2"
                  >
                    <span className="truncate text-sm">{table.name}</span>
                  </div>
                </div>
              </foreignObject>
            </g>
          ))}
          
          {/* 渲染笔记 */}
          {notes.map(note => {
            // 笔记样式常量
            const w = note.width || 220;
            const r = 12;
            const fold = 30;
            
            return (
              <g key={`note-${note.id}`}>
                <path
                  d={`M${note.x + fold} ${note.y} L${note.x + w - r} ${
                    note.y
                  } A${r} ${r} 0 0 1 ${note.x + w} ${note.y + r} L${note.x + w} ${
                    note.y + note.height - r
                  } A${r} ${r} 0 0 1 ${note.x + w - r} ${note.y + note.height} L${
                    note.x + r
                  } ${note.y + note.height} A${r} ${r} 0 0 1 ${note.x} ${
                    note.y + note.height - r
                  } L${note.x} ${note.y + fold}`}
                  fill={note.color || '#f8e896'}
                  stroke="rgb(168 162 158)"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
                <path
                  d={`M${note.x} ${note.y + fold} L${note.x + fold - r} ${
                    note.y + fold
                  } A${r} ${r} 0 0 0 ${note.x + fold} ${note.y + fold - r} L${
                    note.x + fold
                  } ${note.y} L${note.x} ${note.y + fold} Z`}
                  fill={note.color || '#f8e896'}
                  stroke="rgb(168 162 158)"
                  strokeWidth="1.2"
                  strokeLinejoin="round"
                />
              </g>
            );
          })}
        </svg>
      </div>
      
      {/* 缩放指示器 */}
      <div className="absolute bottom-2 right-2 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-lg text-xs opacity-70">
        {Math.round(transform.zoom * 100)}%
      </div>
    </div>
  );
};

export default DiagramPreviewThumb; 