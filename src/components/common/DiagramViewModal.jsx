import { useState, useEffect, useCallback, useContext } from 'react';
import { Modal, Spin, Typography, Button, Space } from '@douyinfe/semi-ui';
import {
  IconEdit,
  IconShareStroked,
  IconFullScreenStroked,
  IconPlus,
  IconMinus
} from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { databases } from '../../data/databases';
import Canvas from '../EditorCanvas/Canvas';
import { CanvasContextProvider } from '../../context/CanvasContext';
import TransformContextProvider, { TransformContext } from '../../context/TransformContext';
import TablesContextProvider from '../../context/DiagramContext';
import SelectContextProvider from '../../context/SelectContext';
import UndoRedoContextProvider from '../../context/UndoRedoContext';
import LayoutContextProvider from '../../context/LayoutContext';
import NotesContextProvider from '../../context/NotesContext';
import AreasContextProvider from '../../context/AreasContext';
import SaveStateContextProvider from '../../context/SaveStateContext';
import EnumsContextProvider from '../../context/EnumsContext';
import TypesContextProvider from '../../context/TypesContext';
import TasksContextProvider from '../../context/TasksContext';
import { ReadOnlyContextProvider } from '../../context/ReadOnlyContext';
import { formatDateTime } from '../../utils/utils';
import './DiagramViewModal.css'; // 导入CSS样式

/**
 * 计算合适的初始视图参数
 * @param {Object} diagram - 图表数据
 * @returns {Object} 包含zoom和pan属性的对象
 */
const calculateInitialView = (diagram) => {
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
    const minX = Math.min(...allPoints.map(p => p.x)) - 100;
    const minY = Math.min(...allPoints.map(p => p.y)) - 100;
    const maxX = Math.max(...allPoints.map(p => p.x)) + 100;
    const maxY = Math.max(...allPoints.map(p => p.y)) + 100;

    // 计算尺寸和中心点
    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = minX + width / 2;
    const centerY = minY + height / 2;

    // 计算合适的缩放比例
    const containerWidth = 2000; // 假设的容器宽度
    const containerHeight = 1000; // 假设的容器高度
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const zoom = Math.min(scaleX, scaleY, 1) * 0.85; // 限制最大缩放为1，并留些边距

    return {
      zoom: diagram.zoom || zoom,
      pan: diagram.pan || { x: centerX, y: centerY }
    };
  } catch (error) {
    console.error('计算初始视图错误:', error);
    return { zoom: 0.8, pan: { x: 0, y: 0 } };
  }
};

/**
 * 缩放控制组件
 * 显示当前画布的缩放比例并提供缩放控制按钮
 * @param {Object} props - 组件属性
 * @param {Object} props.transform - 变换状态对象
 * @param {Function} props.setTransform - 设置变换状态的函数
 */
const ZoomControl = ({ transform, setTransform }) => {
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
      zoom: prev.zoom * 1.25
    }));
  };

  // 缩小画布
  const handleZoomOut = (event) => {
    event.stopPropagation();
    setTransform(prev => ({
      ...prev,
      zoom: prev.zoom * 0.8
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
        const newZoom = Math.min(Math.max(newPercentage / 100, 0.1), 5); // 限制缩放范围在10%到500%
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

/**
 * 添加一个新的InfoPanel组件
 * @param {Object} props - 组件属性
 * @param {Object} props.diagram - 图表数据
 */
const InfoPanel = ({ diagram }) => {
  const { t } = useTranslation();
  
  if (!diagram) return null;
  
  return (
    <div className="info-panel" style={{
      position: 'absolute',
      right: 'calc(50% - 120px)',
      top: '10px',
      zIndex: 999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <Typography.Title heading={5} className="text-color m-0">
        {diagram.name || t('untitled_diagram')}
      </Typography.Title>
      <Typography.Text className="text-color">
        {databases[diagram.database]?.name || diagram.database || t('generic')}
      </Typography.Text>
      {(diagram.updatedAt || diagram.lastModified) && (
        <Typography.Text type="tertiary" className="text-color">
          {t('last_modified')}: {formatDateTime(diagram.updatedAt || diagram.lastModified)}
        </Typography.Text>
      )}
      {(diagram.createdAt) && (
        <Typography.Text type="tertiary" className="text-color">
          {t('create_time')}: {formatDateTime(diagram.createdAt)}
        </Typography.Text>
      )}
    </div>
  );
};

/**
 * 控制面板组件
 * 包含缩放控制和全屏切换等操作按钮
 */
const ControlPanel = ({ isFullScreen, toggleFullScreen, onShare, onEdit, loading, diagram, needsReset }) => {
  const { t } = useTranslation();
  const transformContext = useContext(TransformContext);

  // 确保获取到了TransformContext
  if (!transformContext) {
    console.warn('TransformContext not available in ControlPanel');
    return null;
  }

  const { transform, setTransform } = transformContext;

  // 处理事件冒泡
  const handleButtonClick = (callback) => (event) => {
    event.stopPropagation();
    event.preventDefault();
    callback();
  };

  return (
    <div className="control-panel centered-control-panel" style={{
      position: 'absolute',
      left: '50%',
      bottom: '16px',
      transform: 'translateX(-50%)',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      gap: '8px'
    }}>
      {!loading && (
        <>
          <ZoomControl transform={transform} setTransform={setTransform} />

          <Button
            className="control-button"
            icon={<IconFullScreenStroked />}
            size="large"
            onClick={handleButtonClick(toggleFullScreen)}
            aria-label={isFullScreen ? t('exit_fullscreen') : t('fullscreen')}
          >
            {isFullScreen ? t('exit_fullscreen') : t('fullscreen')}
          </Button>
          
          <Button
            className="control-button"
            icon={<IconShareStroked />}
            size="large"
            onClick={handleButtonClick(onShare)}
            aria-label={t('share')}
          >
            {t('share')}
          </Button>
          
          <Button
            className="control-button-primary"
            icon={<IconEdit />}
            type="primary"
            size="large"
            onClick={handleButtonClick(onEdit)}
            aria-label={t('edit')}
          >
            {t('edit')}
          </Button>
        </>
      )}
    </div>
  );
};

/**
 * 图表查看模态框组件
 * 用于在列表页面中查看完整图表
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 是否显示模态框
 * @param {Object} props.diagram - 图表数据
 * @param {Function} props.onClose - 关闭模态框回调
 * @param {Function} props.onEdit - 编辑按钮点击回调
 * @param {Function} props.onShare - 分享按钮点击回调
 */
const DiagramViewModal = ({ visible, diagram, onClose, onEdit, onShare }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [showEmptyState, setShowEmptyState] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [needsReset, setNeedsReset] = useState(false);

  // 使用useEffect来处理加载状态变化
  useEffect(() => {
    let timer;

    if (visible) {
      setLoading(true);
      setNeedsReset(true);

      // 如果有数据，则设置加载状态和空状态
      if (diagram) {
        // 检查图表是否有表格数据
        const hasTableData = diagram.tables && diagram.tables.length > 0;

        timer = setTimeout(() => {
          setLoading(false);
          setShowEmptyState(!hasTableData);
        }, 300);
      }
    } else {
      setLoading(true);
      setShowEmptyState(false);
      setIsFullScreen(false);
      setNeedsReset(false);
    }

    // 清理函数
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [visible, diagram]);

  // 处理编辑按钮点击
  const handleEdit = useCallback(() => {
    if (diagram && diagram.id) {
      onClose();
      onEdit(diagram.id);
    }
  }, [diagram, onClose, onEdit]);

  // 处理分享按钮点击
  const handleShare = useCallback(() => {
    if (diagram) {
      if (isFullScreen) {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(err => {
            console.error(`退出全屏错误: ${err.message}`);
          });
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }

        setTimeout(() => {
          onShare({ ...diagram, shareModalConfig: { closable: false, cancelText: null, okText: t('close') } });
        }, 100);
      } else {
        onShare({ ...diagram, shareModalConfig: { closable: false, cancelText: null, okText: t('close') } });
      }
    }
  }, [diagram, isFullScreen, onShare, t]);

  // 处理全屏切换
  const toggleFullScreen = () => {
    const container = document.querySelector('.diagram-canvas-container');
    if (!container) return;

    if (!isFullScreen) {
      // 进入全屏
      if (container.requestFullscreen) {
        container.requestFullscreen();
      } else if (container.mozRequestFullScreen) {
        container.mozRequestFullScreen();
      } else if (container.webkitRequestFullscreen) {
        container.webkitRequestFullscreen();
      } else if (container.msRequestFullscreen) {
        container.msRequestFullscreen();
      }
    } else {
      // 退出全屏
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullScreenChange = () => {
      setIsFullScreen(
        document.fullscreenElement ||
        document.mozFullScreenElement ||
        document.webkitFullscreenElement ||
        document.msFullscreenElement
      );
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    document.addEventListener('mozfullscreenchange', handleFullScreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullScreenChange);
    document.addEventListener('MSFullscreenChange', handleFullScreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullScreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullScreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullScreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullScreenChange);
    };
  }, []);

  // 处理图表没有表格数据的情况
  const renderEmptyState = () => {
    return (
      <div className="text-center py-8 text-color flex flex-col items-center justify-center h-full">
        <Typography.Title heading={4} className="mb-4">{t('diagram_has_no_tables')}</Typography.Title>
        <Typography.Text className="mb-6">{t('create_example_tables_to_start')}</Typography.Text>
        <Space>
          <Button
            type="primary"
            onClick={handleEdit}
            size="large"
          >
            {t('edit_diagram')}
          </Button>
        </Space>
      </div>
    );
  };

  // 如果没有diagram数据且不在加载状态，则不显示模态框
  if (!visible) return null;

  return (
    <Modal
      closable={false}
      title={null}
      visible={visible}
      onCancel={onClose}
      footer={null}
      className="diagram-view-modal"
      style={{
        '--semi-color-primary': 'var(--semi-color-primary)',
        '--semi-color-primary-hover': 'var(--semi-color-primary-hover)',
        height: 'auto'
      }}
      width="85%"
      height="85%"
      centered
      bodyStyle={{
        height: 'calc(85vh - 20px)',
        overflow: 'hidden',
        margin: '-15px',
        padding: 0,
        borderRadius: 'var(--semi-border-radius-large)',
        position: 'relative'
      }}
    >
      {loading || !diagram ? (
        <div className="text-center py-8 text-color flex items-center justify-center h-full">
          <Spin size="large" />
        </div>
      ) : showEmptyState ? (
        renderEmptyState()
      ) : (
        <div className="h-full flex flex-col" style={{ margin: 0, padding: 0 }}>
          <div
            className="diagram-canvas-container"
            style={{
              position: 'relative',
              flex: 1,
              overflow: 'hidden',
              margin: 0,
              padding: 0
            }}
          >
            <div style={{
              position: 'absolute',
              inset: 0,
              pointerEvents: 'none',
              margin: 0,
              padding: 0
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                pointerEvents: 'auto',
                margin: 0,
                padding: 0
              }}>
                <LayoutContextProvider>
                  <TransformContextProvider initialTransform={calculateInitialView(diagram)}>
                    <UndoRedoContextProvider>
                      <SelectContextProvider>
                        <TasksContextProvider>
                          <AreasContextProvider initialAreas={diagram?.areas || []}>
                            <NotesContextProvider initialNotes={diagram?.notes || []}>
                              <TypesContextProvider>
                                <EnumsContextProvider>
                                  <TablesContextProvider
                                    initialTables={diagram?.tables || []}
                                    initialRelationships={diagram?.references || []}
                                    initialDatabase={diagram?.database || 'GENERIC'}
                                  >
                                    <SaveStateContextProvider>
                                      <ReadOnlyContextProvider initialReadOnly={true}>
                                        <CanvasContextProvider className="h-full w-full">
                                          <Canvas key={needsReset ? 'reset' : 'normal'} />
                                        </CanvasContextProvider>
                                        <ControlPanel
                                          isFullScreen={isFullScreen}
                                          toggleFullScreen={toggleFullScreen}
                                          onShare={handleShare}
                                          onEdit={handleEdit}
                                          loading={loading}
                                          diagram={diagram}
                                          needsReset={needsReset}
                                        />
                                        <InfoPanel diagram={diagram} />
                                      </ReadOnlyContextProvider>
                                    </SaveStateContextProvider>
                                  </TablesContextProvider>
                                </EnumsContextProvider>
                              </TypesContextProvider>
                            </NotesContextProvider>
                          </AreasContextProvider>
                        </TasksContextProvider>
                      </SelectContextProvider>
                    </UndoRedoContextProvider>
                  </TransformContextProvider>
                </LayoutContextProvider>
              </div>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default DiagramViewModal; 