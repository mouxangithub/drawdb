import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { Button, Card, Space, Typography, Popconfirm, Tooltip, Modal } from '@douyinfe/semi-ui';
import { IconEdit, IconDelete, IconShareStroked, IconEyeOpened } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { databases } from '../../data/databases';
import { darkBgTheme } from '../../data/constants';
import DiagramPreviewThumb from './DiagramPreviewThumb';

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
        return { 
          ...diagram,
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
    if (!diagram?.lastModified) return t('no_update_time');
    
    try {
      const date = new Date(diagram.lastModified);
      
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
        >
          <DiagramPreviewThumb 
            diagram={diagramData} 
            onClick={handleView}
          />
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
              {formattedUpdateTime}
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