import React, { useState, useEffect } from 'react';
import { Button, Divider } from '@douyinfe/semi-ui';
import { IconPlus, IconMinus } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { useTransform, useLayout } from '../../hooks';
import { exitFullscreen } from '../../utils/fullscreen';

/**
 * 浮动控制栏组件，包含缩放控制和退出全屏功能
 * 在全屏模式下显示在右下角
 * 
 * @returns {JSX.Element} 浮动控制栏组件
 */
const FloatingControls = () => {
  const { transform, setTransform } = useTransform();
  const { setLayout } = useLayout();
  const { t } = useTranslation();
  const [inputValue, setInputValue] = useState(`${Math.round(transform.zoom * 100)}`);

  // 当transform.zoom变化时更新输入值
  useEffect(() => {
    setInputValue(`${Math.round(transform.zoom * 100)}`);
  }, [transform.zoom]);

  // 放大
  const handleZoomIn = () => {
    setTransform(prev => ({
      ...prev,
      zoom: prev.zoom * 1.2
    }));
  };

  // 缩小
  const handleZoomOut = () => {
    setTransform(prev => ({
      ...prev,
      zoom: prev.zoom / 1.2
    }));
  };

  // 处理输入改变
  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // 处理输入确认 (失去焦点或按下回车)
  const handleInputConfirm = (e) => {
    if (e.type === 'blur' || e.key === 'Enter') {
      const numValue = parseInt(inputValue, 10);
      if (!isNaN(numValue) && numValue > 0) {
        setTransform(prev => ({
          ...prev,
          zoom: numValue / 100
        }));
      } else {
        // 如果输入无效，恢复为当前zoom值
        setInputValue(`${Math.round(transform.zoom * 100)}`);
      }
    }
  };

  // 退出全屏
  const handleExitFullscreen = () => {
    setLayout((prev) => ({
      ...prev,
      sidebar: true,
      toolbar: true,
      header: true,
    }));
    exitFullscreen();
  };

  return (
    <div className="floating-controls flex gap-2">
      <div className="popover-theme flex rounded-lg items-center">
        <button
          className="px-3 py-2"
          onClick={handleZoomOut}
          aria-label={t('zoom_out')}
        >
          <IconMinus />
        </button>
        <Divider align="center" layout="vertical" />
        <div className="px-3 py-2">
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputConfirm}
            onKeyDown={handleInputConfirm}
            className="bg-transparent border-none w-[40px] text-center"
            style={{ outline: 'none' }}
          />%
        </div>
        <Divider align="center" layout="vertical" />
        <button
          className="px-3 py-2"
          onClick={handleZoomIn}
          aria-label={t('zoom_in')}
        >
          <IconPlus />
        </button>
      </div>
      <button
        className="px-3 py-2 rounded-lg popover-theme"
        onClick={handleExitFullscreen}
        aria-label={t('exit')}
      >
        <i className="bi bi-fullscreen-exit" />
      </button>
    </div>
  );
};

export default FloatingControls;
