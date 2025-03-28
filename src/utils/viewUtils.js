/**
 * 计算合适的初始视图参数
 * 根据图表数据的表格位置和尺寸计算合适的缩放比例和中心点
 * 
 * @param {Object} diagram - 图表数据
 * @param {Object} options - 配置选项
 * @param {number} options.containerWidth - 容器宽度，默认为2000
 * @param {number} options.containerHeight - 容器高度，默认为1000
 * @param {number} options.zoomFactor - 缩放因子，可微调最终缩放比例，默认为0.85
 * @param {number} options.padding - 边界填充像素，默认为100
 * @returns {Object} 包含zoom和pan属性的对象
 */
export function calculateInitialView(diagram, options = {}) {
  const {
    containerWidth = 2000,
    containerHeight = 1000,
    zoomFactor = 0.85,
    padding = 100
  } = options;

  if (!diagram || !diagram.tables || diagram.tables.length === 0) {
    return { zoom: 1, pan: { x: 0, y: 0 } };
  }

  try {
    // 确保所有表格都有宽度和高度
    const tablesWithDimensions = diagram.tables.map(table => ({
      ...table,
      width: table.width || 180,
      height: table.height || (table.fields?.length * 30 + 40) || 100
    }));

    // 计算所有表格的边界点
    const allPoints = tablesWithDimensions.flatMap(table => [
      { x: table.x, y: table.y },
      { x: table.x + table.width, y: table.y + table.height }
    ]);

    // 计算边界框
    const minX = Math.min(...allPoints.map(p => p.x)) - padding;
    const minY = Math.min(...allPoints.map(p => p.y)) - padding;
    const maxX = Math.max(...allPoints.map(p => p.x)) + padding;
    const maxY = Math.max(...allPoints.map(p => p.y)) + padding;

    // 计算尺寸和中心点
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    // 计算合适的缩放比例
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const zoom = Math.min(scaleX, scaleY, 1) * zoomFactor; // 限制最大缩放为1，并留些边距

    return {
      zoom: diagram.zoom || zoom,
      pan: diagram.pan || { x: centerX, y: centerY }
    };
  } catch (error) {
    console.error('计算初始视图错误:', error);
    return { zoom: 0.8, pan: { x: 0, y: 0 } };
  }
}

/**
 * 用于全屏显示的工具函数
 * 处理不同浏览器的全屏API兼容性
 */
export const fullscreenUtils = {
  /**
   * 进入全屏模式
   * @param {HTMLElement} element - 要全屏显示的元素
   */
  enterFullscreen(element) {
    if (!element) return;
    
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.mozRequestFullScreen) {
      element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen();
    }
  },
  
  /**
   * 退出全屏模式
   */
  exitFullscreen() {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  },
  
  /**
   * 检查是否处于全屏模式
   * @returns {boolean} 是否处于全屏模式
   */
  isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.mozFullScreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  },
  
  /**
   * 切换全屏模式
   * @param {HTMLElement} element - 要全屏显示的元素
   */
  toggleFullscreen(element) {
    if (this.isFullscreen()) {
      this.exitFullscreen();
    } else {
      this.enterFullscreen(element);
    }
  }
}; 