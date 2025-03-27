import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button, Card, Space, Typography, Popconfirm, Tooltip, Modal } from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconShareStroked, IconEyeOpened } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { databases } from '../../data/databases';
import { darkBgTheme } from '../../data/constants';
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
    const containerWidth = 200; // 预览卡片宽度
    const containerHeight = 200; // 预览卡片高度
    const scaleX = containerWidth / width;
    const scaleY = containerHeight / height;
    const zoom = Math.min(scaleX, scaleY, 1) * 0.5; // 限制最大缩放为1，并设置为50%显示比例

    return {
      zoom: zoom,
      pan: { x: centerX, y: centerY }
    };
  } catch (error) {
    console.error('计算初始视图错误:', error);
    return { zoom: 0.8, pan: { x: 0, y: 0 } };
  }
};

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
  
  // 使用useMemo直接计算预处理后的图表数据，避免使用状态变量
  const diagramData = useMemo(() => {
    if (!diagram) return null;
    
    try {
      // 确保tables和relationships都是数组
      let tables = Array.isArray(diagram.tables) ? diagram.tables : [];
      // 兼容旧版数据结构，references字段和relationships字段都可能存在
      let relationships = Array.isArray(diagram.references) 
        ? diagram.references 
        : (Array.isArray(diagram.relationships) ? diagram.relationships : []);
      
      // 确保至少有一个表格才显示预览，否则创建示例表格
      if (tables.length > 0) {
        // 创建新对象，但不包含原始的zoom和pan属性
        const { zoom, pan, ...diagramWithoutTransform } = diagram;
        return { 
          ...diagramWithoutTransform,
          tables, 
          references: relationships
        };
      } else {
        console.log('图表没有表格数据，创建示例表:', diagram.id);
        // 使用createSampleDiagram创建示例表格
        const sampleDiagram = createSampleDiagram(diagram.database, diagram.name || '');
        return {
          ...diagram,
          tables: sampleDiagram.tables,
          references: sampleDiagram.relationships
        };
      }
    } catch (error) {
      console.error('解析图表数据失败', error);
      // 出错时也创建示例表格
      const sampleDiagram = createSampleDiagram('GENERIC', diagram.name || 'Unnamed');
      return {
        ...diagram,
        tables: sampleDiagram.tables,
        references: sampleDiagram.relationships
      };
    }
  }, [diagram]);

  // 计算初始转换参数
  const initialTransform = useMemo(() => {
    return calculateInitialView(diagramData);
  }, [diagramData]);
  
  // 使用useEffect来处理加载状态变化
  useEffect(() => {
    if (diagramData) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [diagramData]);
  
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

  // 获取数据库名称
  const dbName = useMemo(() => {
    if (diagram && diagram.database) {
      return databases[diagram.database]?.name || diagram.database || t('generic');
    }
    return t('generic');
  }, [diagram, t]);

  // 格式化更新时间
  const formattedUpdateTime = useMemo(() => {
    if (!diagram?.updatedAt) return t('no_update_time');
    
    try {
      const date = new Date(diagram.updatedAt);
      
      // 格式化为 YYYY-MM-DD HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return t('invalid_date');
    }
  }, [diagram, t]);

  // 格式化创建时间
  const formattedCreateTime = useMemo(() => {
    if (!diagram?.createdAt) return t('no_create_time');
    
    try {
      const date = new Date(diagram.createdAt);
      
      // 格式化为 YYYY-MM-DD HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    } catch (e) {
      return t('invalid_date');
    }
  }, [diagram, t]);

  // 渲染Canvas预览
  const renderCanvasPreview = () => {
    if (!diagramData) return null;

    return (
      <div className="interactive-preview-container">
        <LayoutContextProvider>
          <TransformContextProvider>
            <PreviewZoomController zoom={0.3} pan={initialTransform.pan} />
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
          onClick={handleView}
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
              {t('last_modified')}: {formattedUpdateTime}
            </Typography.Text>
            <Typography.Text 
              className="text-color-secondary text-xs block mt-1" 
              type="tertiary"
            >
              {t('created')}: {formattedCreateTime}
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

// 创建一个内部组件来控制缩放
const PreviewZoomController = ({ zoom, pan }) => {
  const { setTransform } = useTransform();
  
  // 组件挂载后立即设置缩放值
  useEffect(() => {
    // 使用setTimeout确保在TransformContext完全初始化后执行
    const timer = setTimeout(() => {
      setTransform({
        zoom: zoom,
        pan: pan
      });
    }, 50);
    
    return () => clearTimeout(timer);
  }, [zoom, pan, setTransform]);
  
  return null; // 这个组件不渲染任何内容
};

export default DiagramPreviewCard; 