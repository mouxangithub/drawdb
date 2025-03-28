import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button, Card, Space, Typography, Popconfirm, Tooltip, Modal } from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconShareStroked, IconEyeOpened } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { databases } from '../../data/databases';
import Canvas from '../EditorCanvas/Canvas';
import { CanvasContextProvider } from '../../context/CanvasContext';
import TransformContextProvider from '../../context/TransformContext';
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
import './DiagramPreviewCard.css'; // 确保创建相应的CSS文件
import { useTransform } from '../../hooks'; // 添加useTransform钩子导入
import { formatDateTime } from '../../utils/utils';
import { calculateInitialView } from '../../utils/viewUtils';
import { normalizeDiagramData } from '../../utils/diagramUtils';
import PreviewZoomController from './PreviewZoomController';

/**
 * 创建一个示例表用于预览图表
 * 当图表没有实际表时使用此函数创建示例表
 * 
 * @param {string} database 数据库类型
 * @param {string} name 图表名称
 * @returns {Object} 包含示例表的图表数据 
 */
const createSampleDiagram = (database, name) => {
  return {
    tables: [
      {
        id: 0,
        name: name.length > 10 ? name.substring(0, 10) + '...' : name,
        x: 10,
        y: 10,
        width: 180,  // 添加宽度
        height: 100, // 添加高度
        fields: [
          {
            name: 'id',
            type: 'INTEGER',
            default: '',
            check: '',
            primary: true,
            unique: true,
            notNull: true,
            increment: true,
            comment: '',
            id: 0
          },
          {
            name: 'name',
            type: 'VARCHAR(255)',
            default: '',
            check: '',
            primary: false,
            unique: false,
            notNull: true,
            increment: false,
            comment: '',
            id: 1
          }
        ],
        comment: '',
        indices: [],
        color: '#2f68ad',
        key: Date.now()
      }
    ],
    relationships: []
  };
};

/**
 * 图表预览卡片组件
 * 用于在列表页面中显示图表的预览
 * 
 * @param {Object} props - 组件属性
 * @param {Object} props.diagram - 图表数据
 * @param {Function} props.onEdit - 编辑按钮点击回调
 * @param {Function} props.onShare - 分享按钮点击回调
 * @param {Function} props.onDelete - 删除按钮点击回调
 * @param {Function} props.onView - 查看按钮点击回调
 */
const DiagramPreviewCard = ({ diagram, onEdit, onShare, onDelete, onView }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [canRenderPreview, setCanRenderPreview] = useState(false);
  const loadingTimerRef = useRef(null);
  const mountedRef = useRef(true);
  
  // 使用useMemo直接计算预处理后的图表数据，避免使用状态变量
  const diagramData = useMemo(() => 
    normalizeDiagramData(diagram), 
  [diagram]);

  // 计算初始转换参数
  const initialTransform = useMemo(() => 
    calculateInitialView(diagramData, {
      containerWidth: 200,
      containerHeight: 200,
      zoomFactor: 0.5
    }), 
  [diagramData]);
  
  // 组件挂载/卸载生命周期管理
  useEffect(() => {
    mountedRef.current = true;
    
    // 延迟设置渲染预览状态，避免过早渲染导致问题
    const previewTimer = setTimeout(() => {
      if (mountedRef.current) {
        setCanRenderPreview(true);
      }
    }, 100);
    
    return () => {
      mountedRef.current = false;
      clearTimeout(previewTimer);
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);
  
  // 使用useEffect来处理加载状态变化
  useEffect(() => {
    if (diagramData && canRenderPreview) {
      loadingTimerRef.current = setTimeout(() => {
        if (mountedRef.current) {
          setLoading(false);
        }
      }, 300);
    }
    
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
        loadingTimerRef.current = null;
      }
    };
  }, [diagramData, canRenderPreview]);
  
  // 使用useCallback优化按钮回调
  const handleView = useCallback(() => {
    if (diagram && diagram.id) {
      onView(diagram.id);
    }
  }, [diagram, onView]);
  
  const handleEdit = useCallback(() => {
    if (diagram && diagram.id) {
      onEdit(diagram.id);
    }
  }, [diagram, onEdit]);
  
  const handleShare = useCallback(() => {
    if (diagram && diagram.id) {
      onShare(diagram);
    }
  }, [diagram, onShare]);
  
  const handleDelete = useCallback(() => {
    if (diagram && diagram.id) {
      onDelete(diagram.id, diagram.name);
    }
  }, [diagram, onDelete]);

  // 获取数据库类型名称
  const dbName = useMemo(() => {
    if (diagram && diagram.database) {
      return databases[diagram.database]?.name || diagram.database || t('generic');
    }
    return t('generic');
  }, [diagram, t]);

  // 渲染Canvas预览
  const renderCanvasPreview = () => {
    if (!diagramData || !canRenderPreview) return null;
    
    return (
      <div className="interactive-preview-container">
        <LayoutContextProvider>
          <TransformContextProvider>
            <PreviewZoomController zoom={0.3} pan={initialTransform.pan} delay={100} />
            <UndoRedoContextProvider>
              <SelectContextProvider>
                <TasksContextProvider>
                  <AreasContextProvider initialAreas={diagramData?.areas || []}>
                    <NotesContextProvider initialNotes={diagramData?.notes || []}>
                      <TypesContextProvider>
                        <EnumsContextProvider>
                          <TablesContextProvider
                            initialTables={diagramData?.tables || []}
                            initialRelationships={diagramData?.references || []}
                            initialDatabase={diagramData?.database || 'GENERIC'}
                          >
                            <SaveStateContextProvider>
                              <ReadOnlyContextProvider initialReadOnly={true}>
                                <CanvasContextProvider className="h-full w-full preview-canvas">
                                  <Canvas />
                                </CanvasContextProvider>
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
    );
  };

  return (
    <Card
      className="diagram-card hover:shadow-md transition-shadow duration-300 dark:shadow-gray-800"
      bordered={false}
      bodyStyle={{ padding: '12px', height: '100%' }}
      shadows="hover"
    >
      <div className="flex flex-col h-full">
        <div 
          style={{ height: '200px' }}
          className="preview-card-canvas-container"
        >
          {loading ? (
            <div className="flex items-center justify-center h-full bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="spinner"></div>
            </div>
          ) : (
            renderCanvasPreview()
          )}
        </div>
        
        <div className="mt-2">
          <div className="flex justify-between items-center">
            <Typography.Title
              heading={5}
              className="text-color m-0 truncate flex-1"
              title={diagram?.name || ''}
            >
              {diagram?.name || t('untitled')}
            </Typography.Title>
          </div>
          
          <div className="mt-1">
            <Typography.Text 
              className="text-color-secondary text-xs block" 
              type="tertiary"
            >
              {dbName}
            </Typography.Text>
            <Typography.Text 
              className="text-color-secondary text-xs block mt-1" 
              type="tertiary"
            >
              {t('last_modified')}: {formatDateTime(diagram?.updatedAt)}
            </Typography.Text>
            <Typography.Text 
              className="text-color-secondary text-xs block mt-1" 
              type="tertiary"
            >
              {t('create_time')}: {formatDateTime(diagram?.createdAt)}
            </Typography.Text>
          </div>
        </div>
        
        <div className="flex justify-end items-center mt-auto pt-2">
          <Space>
            <Button
              icon={<IconEyeOpened />}
              type="tertiary"
              onClick={handleView}
              title={t('view')}
            />
            <Button
              icon={<IconEdit />}
              type="tertiary"
              onClick={handleEdit}
              title={t('edit')}
            />
            <Button
              icon={<IconShareStroked />}
              type="tertiary"
              onClick={handleShare}
              title={t('share')}
            />
            <Button
              icon={<IconDelete />}
              type="tertiary"
              onClick={handleDelete}
              title={t('delete')}
              className="text-red-500"
            />
          </Space>
        </div>
      </div>
    </Card>
  );
};

export default DiagramPreviewCard; 