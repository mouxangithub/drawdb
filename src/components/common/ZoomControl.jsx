import { useState, useEffect } from 'react';
import { Button } from '@douyinfe/semi-ui';
import { IconPlus, IconMinus } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';

/**
 * 缩放控制组件
 * 显示当前画布的缩放比例并提供缩放控制按钮
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.transform - 变换状态对象
 * @param {Function} props.setTransform - 设置变换状态的函数
 * @param {number} props.minZoom - 最小缩放比例，默认0.1
 * @param {number} props.maxZoom - 最大缩放比例，默认5
 * @param {number} props.zoomInFactor - 放大因子，默认1.25
 * @param {number} props.zoomOutFactor - 缩小因子，默认0.8
 */
const ZoomControl = ({ 
  transform, 
  setTransform,
  minZoom = 0.1,
  maxZoom = 5,
  zoomInFactor = 1.25,
  zoomOutFactor = 0.8
}) => {
  const { t } = useTranslation();
  const percentage = Math.round(transform.zoom * 100);
  const [inputValue, setInputValue] = useState(percentage.toString());

  // 当transform改变时更新输入值
  useEffect(() => {
    setInputValue(percentage.toString());
  }, [percentage]);

  // 放大画布
  const handleZoomIn = (event) => {
    event.stopPropagation();
    setTransform(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom * zoomInFactor, maxZoom)
    }));
  };

  // 缩小画布
  const handleZoomOut = (event) => {
    event.stopPropagation();
    setTransform(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom * zoomOutFactor, minZoom)
    }));
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 处理输入确认
  const handleInputConfirm = (e) => {
    // 阻止事件冒泡
    e.stopPropagation();

    // 如果按下的是回车键或者输入框失去焦点
    if (e.type === 'blur' || (e.type === 'keydown' && e.key === 'Enter')) {
      // 解析输入的百分比值
      const newPercentage = parseInt(inputValue.replace(/[^0-9]/g, ''), 10);

      // 检查是否有效数字
      if (!isNaN(newPercentage) && newPercentage > 0) {
        const newZoom = Math.min(Math.max(newPercentage / 100, minZoom), maxZoom);
        setTransform(prev => ({
          ...prev,
          zoom: newZoom
        }));
      } else {
        // 如果输入无效，恢复为当前缩放值
        setInputValue(percentage.toString());
      }

      // 如果是按下回车，则失去焦点
      if (e.type === 'keydown') {
        e.target.blur();
      }
    }
  };

  return (
    <div className="zoom-control-container rounded-lg flex items-center" style={{ height: '40px' }}>
      <Button
        icon={<IconMinus />}
        size="large"
        onClick={handleZoomOut}
        aria-label={t('zoom_out')}
        className="zoom-button"
      />
      <div
        style={{
          margin: '0 8px',
          padding: '0 4px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputConfirm}
          onKeyDown={handleInputConfirm}
          className="zoom-input text-color"
          style={{
            width: '50px',
            textAlign: 'center',
            background: 'transparent',
            border: '1px solid transparent',
            fontWeight: 'bold',
            outline: 'none',
            borderRadius: '4px',
            padding: '4px'
          }}
          onFocus={(e) => e.target.select()}
          onClick={(e) => e.stopPropagation()}
        />
        <span className="text-color" style={{ fontWeight: 'bold' }}>%</span>
      </div>
      <Button
        icon={<IconPlus />}
        size="large"
        onClick={handleZoomIn}
        aria-label={t('zoom_in')}
        className="zoom-button"
      />
    </div>
  );
};

export default ZoomControl;
