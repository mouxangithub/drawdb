import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Input, 
  Empty, 
  Card,
  Notification,
  Toast,
  Modal,
  Select,
  DatePicker,
  Popover,
  Tag,
  Pagination
} from '@douyinfe/semi-ui';
import { 
  IconPlus, 
  IconSearch,
  IconArticle,
  IconGridRectangle,
  IconEdit,
  IconShareStroked,
  IconDelete,
  IconFilter,
  IconClose
} from '@douyinfe/semi-icons';
import { diagramApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import ShareModal from '../components/common/ShareModal';
import DiagramPreviewCard from '../components/common/DiagramPreviewCard';
import DiagramViewModal from '../components/common/DiagramViewModal';
import ThemeLanguageSwitcher from '../components/common/ThemeLanguageSwitcher';
import { formatDateTime } from '../utils/utils';
import '../styles/pages/DiagramList.css'; // 添加CSS导入
import { databases } from '../data/databases'; // 添加数据库常量
import { useSettings } from '../hooks'; // 添加设置钩子

/**
 * 图表列表页面
 * 显示所有图表，提供新建、编辑、删除、分享等功能
 * 重构版本：增加了图表预览功能、数据库筛选和时间筛选
 */
export default function DiagramList() {
  // 图表数据状态
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(9); // 默认每页9条记录，适合3x3网格
  
  // 搜索和筛选状态
  const [searchTerm, setSearchTerm] = useState('');
  const [databaseFilter, setDatabaseFilter] = useState([]);
  const [createTimeRange, setCreateTimeRange] = useState([null, null]);
  const [updateTimeRange, setUpdateTimeRange] = useState([null, null]);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [activeFilters, setActiveFilters] = useState(0);
  const [databaseOptions, setDatabaseOptions] = useState([]);
  
  // 模态框状态
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  const [detailedDiagram, setDetailedDiagram] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' 或 'table'
  
  // 添加数据库选择模态框状态
  const [showDbSelectModal, setShowDbSelectModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState('');
  
  // 添加图表名称状态
  const [diagramName, setDiagramName] = useState('');
  
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  
  // 使用ref避免在状态更新过程中获取过时的状态值
  const loadingRef = useRef(false);
  const searchTimeout = useRef(null);
  
  // 添加refs - 只保留Semi UI原生组件的refs
  const paginationRef = useRef(null);
  const popoverRef = useRef(null);
  
  // 加载图表列表 - 修改为使用筛选参数
  const fetchDiagrams = useCallback(async (page = currentPage, size = pageSize) => {
    if (loadingRef.current) return; // 防止重复请求
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      // 构建查询参数
      const params = {
        page,
        pageSize: size,
        sortBy: 'lastModified',
        sortOrder: 'DESC'
      };
      
      // 添加搜索参数（如果有）
      if (searchTerm) {
        params.name = searchTerm;
      }
      
      // 添加数据库筛选 - 修改为支持多选
      if (databaseFilter && Array.isArray(databaseFilter) && databaseFilter.length > 0) {
        params.database = databaseFilter.join(',');
      }
      
      // 添加创建时间筛选
      if (createTimeRange[0]) {
        params.createdAtStart = createTimeRange[0];
      }
      if (createTimeRange[1]) {
        params.createdAtEnd = createTimeRange[1];
      }
      
      // 添加更新时间筛选
      if (updateTimeRange[0]) {
        params.updatedAtStart = updateTimeRange[0];
      }
      if (updateTimeRange[1]) {
        params.updatedAtEnd = updateTimeRange[1];
      }
      
      // 发送请求
      const result = await diagramApi.getAll(params);
      
      // 更新状态
      setDiagrams(result.data);
      setTotal(result.pagination.total);
      setCurrentPage(result.pagination.page);
    } catch (error) {
      console.error('获取图表列表失败:', error);
      Notification.error({
        title: t('error'),
        content: t('get_diagram_list_failed'),
        duration: 3,
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [t, searchTerm, databaseFilter, createTimeRange, updateTimeRange, currentPage, pageSize]);

  // 初始加载和筛选变化时重新获取数据
  useEffect(() => {
    // 在首次加载或筛选条件变化时重置到第一页
    fetchDiagrams(1, pageSize);
  }, [searchTerm, databaseFilter, createTimeRange, updateTimeRange, pageSize]);

  // 页码变化时获取数据
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
    fetchDiagrams(page, pageSize);
  }, [fetchDiagrams, pageSize]);

  // 每页显示数量变化时获取数据
  const handlePageSizeChange = useCallback((size) => {
    setPageSize(size);
    // 重置到第一页
    setCurrentPage(1);
    fetchDiagrams(1, size);
  }, [fetchDiagrams]);

  // 初始化加载图表和显示模式
  useEffect(() => {
    document.title = "drawDB | " + t("diagram_list");
    
    // 确保页面背景适配主题
    document.body.setAttribute('class', 'theme');
    
    // 初始化显示模式（从本地存储获取用户首选项）
    const savedMode = localStorage.getItem('diagramDisplayMode');
    if (savedMode) {
      setDisplayMode(savedMode);
    }
    
    return () => {
      // 清理函数，移除添加的类
      document.body.removeAttribute('class');
      loadingRef.current = false;
    };
  }, [t]);

  // 获取所有可用的数据库类型选项
  useEffect(() => {
    const fetchDatabaseOptions = async () => {
      try {
        // 获取所有数据库类型（这里可以添加专门的接口，或者从现有数据中提取）
        const response = await diagramApi.getDatabaseTypes();
        if (response && Array.isArray(response)) {
          setDatabaseOptions(response.map(type => ({
            label: type,
            value: type
          })));
        }
      } catch (error) {
        console.error('获取数据库类型失败:', error);
        // 失败时使用空列表
        setDatabaseOptions([]);
      }
    };
    
    fetchDatabaseOptions();
  }, []);

  // 搜索处理 - 使用防抖
  const handleSearch = useCallback((value) => {
    setSearchTerm(value);
    
    // 清除之前的定时器
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // 设置新的定时器，延迟500ms执行查询
    searchTimeout.current = setTimeout(() => {
      fetchDiagrams(1, pageSize);
    }, 500);
  }, [fetchDiagrams, pageSize]);

  // 重置所有筛选条件 - 修改为支持多选数据库类型
  const resetFilters = useCallback(() => {
    setDatabaseFilter([]);
    setCreateTimeRange([null, null]);
    setUpdateTimeRange([null, null]);
    // 重置后自动刷新数据
  }, []);

  // 计算活跃的筛选条件数量 - 修改为支持多选数据库类型
  useEffect(() => {
    let count = 0;
    if (databaseFilter && Array.isArray(databaseFilter) && databaseFilter.length > 0) count++;
    if (createTimeRange[0] || createTimeRange[1]) count++;
    if (updateTimeRange[0] || updateTimeRange[1]) count++;
    
    setActiveFilters(count);
  }, [databaseFilter, createTimeRange, updateTimeRange]);

  // 创建新图表 - 修改为显示数据库选择对话框
  const handleCreateDiagram = useCallback(() => {
    setSelectedDb('');
    setDiagramName('');
    setShowDbSelectModal(true);
  }, []);
  
  // 添加处理数据库选择的函数
  const handleDbSelect = useCallback((dbLabel) => {
    setSelectedDb(dbLabel);
    // 如果用户还没有输入名称，则生成默认名称
    if (!diagramName) {
      const dbName = Object.values(databases).find(x => x.label === dbLabel)?.name || 'Database';
      setDiagramName(`${dbName} Diagram ${new Date().toLocaleDateString()}`);
    }
  }, [diagramName]);

  // 创建并导航到新图表
  const handleCreateAndNavigate = useCallback(async () => {
    if (!selectedDb) return;
    
    try {
      setLoading(true);
      
      // 准备图表数据
      const diagramData = {
        name: diagramName || 'Untitled Diagram',
        database: selectedDb,
        lastModified: new Date(),
        tables: [],
        references: [],
        notes: [],
        areas: []
      };
      
      // 创建新图表
      const newDiagram = await diagramApi.create(diagramData);
      
      // 导航到编辑页面
      navigate(`/editor/${newDiagram.id}`);
    } catch (error) {
      console.error('创建图表失败:', error);
      Notification.error({
        title: t('error'),
        content: t('create_diagram_failed'),
        duration: 3
      });
      setLoading(false);
    }
  }, [navigate, selectedDb, diagramName, t]);

  // 编辑图表
  const handleEditDiagram = useCallback((id) => {
    navigate(`/editor/${id}`);
  }, [navigate]);

  // 查看图表
  const handleViewDiagram = useCallback((id) => {
    // 从已加载的图表数据中查找对应ID的图表
    const diagram = diagrams.find(diagram => diagram.id === id);
    
    if (diagram) {
      // 检查图表是否有表格数据
      const hasNoTables = !diagram.tables || diagram.tables.length === 0;
      
      if (hasNoTables) {
        console.warn('图表没有表格数据');
        Toast.info({
          content: t('diagram_has_no_tables'),
          duration: 3,
        });
      }
      
      // 设置详细数据并显示视图模态框
      setDetailedDiagram(diagram);
      setViewModalVisible(true);
    } else {
      console.error(`未找到ID为 ${id} 的图表`);
      Notification.error({
        title: t('error'),
        content: t('diagram_not_found'),
        duration: 3,
      });
    }
  }, [diagrams, t]);

  // 删除图表
  const handleDeleteDiagram = useCallback(async (id, name) => {
    if (loadingRef.current) return; // 防止重复请求
    
    Modal.confirm({
      title: t('confirm_delete'),
      content: t('confirm_delete_diagram', { name: name || t('this_diagram') }),
      onOk: async () => {
        try {
          loadingRef.current = true;
          setLoading(true);
          
          await diagramApi.delete(id);
          
          // 更新本地状态，从diagrams数组中过滤掉已删除的图表
          setDiagrams((prevDiagrams) => {
            const updatedDiagrams = prevDiagrams.filter((diagram) => diagram.id !== id);
            // 优化：只有在本地过滤后列表为空时才重新请求数据
            if (updatedDiagrams.length === 0) {
              // 使用setTimeout确保状态更新后再发起请求
              setTimeout(() => fetchDiagrams(), 0);
            }
            return updatedDiagrams;
          });
          
          Notification.success({
            title: t('success'),
            content: t('diagram_deleted'),
            duration: 3,
          });
        } catch (error) {
          console.error('删除图表失败:', error);
          Notification.error({
            title: t('error'),
            content: t('delete_diagram_failed'),
            duration: 3,
          });
          // 在出错情况下重新获取列表以确保UI显示正确
          fetchDiagrams();
        } finally {
          loadingRef.current = false;
          setLoading(false);
        }
      }
    });
  }, [t, fetchDiagrams]);

  // 分享图表
  const handleShare = useCallback((diagram) => {
    setCurrentDiagram(diagram);
    setShareModalVisible(true);
  }, []);
  
  // 关闭分享模态框
  const handleCloseShareModal = useCallback(() => {
    setShareModalVisible(false);
    setCurrentDiagram(null);
  }, []);
  
  // 关闭查看模态框
  const handleCloseViewModal = useCallback(() => {
    setViewModalVisible(false);
    setDetailedDiagram(null);
  }, []);
  
  // 切换显示模式
  const handleModeChange = useCallback((mode) => {
    setDisplayMode(mode);
    localStorage.setItem('diagramDisplayMode', mode);
  }, []);

  // 筛选面板内容 - 更新为使用i18n
  const filterContent = (
    <div className="p-4 w-80 filter-popover-content">
      <div className="flex justify-between items-center mb-4">
        <Typography.Title heading={5} className="text-color">
          {t('advanced_filters')}
        </Typography.Title>
        <Button 
          type="tertiary" 
          theme="borderless" 
          icon={<IconClose />} 
          size="small"
          onClick={resetFilters}
          aria-label={t('reset_filters')}
        >
          {t('reset')}
        </Button>
      </div>
      
      <div className="filter-group">
        <Typography.Text className="text-color mb-2 block">
          {t('database_type')}
        </Typography.Text>
        <Select
          placeholder={t('select_database_type')}
          style={{ width: '100%' }}
          value={databaseFilter}
          onChange={setDatabaseFilter}
          optionList={databaseOptions}
          multiple
          clearable
          aria-label={t('select_database_type')}
          emptyContent={t('no_database_types')}
          maxTagCount={2}
        />
      </div>
      
      <div className="filter-group">
        <Typography.Text className="text-color mb-2 block">
          {t('create_time_range')}
        </Typography.Text>
        <div className="date-range-container">
          <DatePicker
            type="dateRange"
            style={{ width: '100%' }}
            value={createTimeRange}
            onChange={setCreateTimeRange}
            placeholder={[t('start_date'), t('end_date')]}
            aria-label={t('create_time_range')}
            format="yyyy-MM-dd"
            localeCode={t('locale_code')}
          />
        </div>
      </div>
      
      <div className="filter-group">
        <Typography.Text className="text-color mb-2 block">
          {t('update_time_range')}
        </Typography.Text>
        <div className="date-range-container">
          <DatePicker
            type="dateRange"
            style={{ width: '100%' }}
            value={updateTimeRange}
            onChange={setUpdateTimeRange}
            placeholder={[t('start_date'), t('end_date')]}
            aria-label={t('update_time_range')}
            format="yyyy-MM-dd"
            localeCode={t('locale_code')}
          />
        </div>
      </div>
    </div>
  );

  // 活跃筛选器标签 - 修改为支持多选数据库类型
  const renderActiveFilterTags = () => {
    const tags = [];
    
    if (databaseFilter && Array.isArray(databaseFilter) && databaseFilter.length > 0) {
      tags.push(
        <Tag 
          key="db-filter" 
          closable 
          onClose={() => setDatabaseFilter([])}
          color="blue"
          className="filter-tag"
        >
          <span className="tag-label">{t('database')}:</span>
          <span className="tag-value">{databaseFilter.join(', ')}</span>
        </Tag>
      );
    }
    
    if (createTimeRange[0] || createTimeRange[1]) {
      const startStr = createTimeRange[0] ? formatDateTime(createTimeRange[0]) : '...';
      const endStr = createTimeRange[1] ? formatDateTime(createTimeRange[1]) : '...';
      
      tags.push(
        <Tag 
          key="create-time-filter" 
          closable 
          onClose={() => setCreateTimeRange([null, null])}
          color="green"
          className="filter-tag"
        >
          <span className="tag-label">{t('create_time')}:</span>
          <span className="tag-value">{startStr} - {endStr}</span>
        </Tag>
      );
    }
    
    if (updateTimeRange[0] || updateTimeRange[1]) {
      const startStr = updateTimeRange[0] ? formatDateTime(updateTimeRange[0]) : '...';
      const endStr = updateTimeRange[1] ? formatDateTime(updateTimeRange[1]) : '...';
      
      tags.push(
        <Tag 
          key="update-time-filter" 
          closable 
          onClose={() => setUpdateTimeRange([null, null])}
          color="orange"
          className="filter-tag"
        >
          <span className="tag-label">{t('last_modified_time')}:</span>
          <span className="tag-value">{startStr} - {endStr}</span>
        </Tag>
      );
    }
    
    return tags.length > 0 ? (
      <div className="active-filters-container">
        {tags}
        {tags.length > 1 && (
          <Button
            size="small"
            type="tertiary"
            onClick={resetFilters}
            icon={<IconClose />}
          >
            {t('clear_all_filters')}
          </Button>
        )}
      </div>
    ) : null;
  };

  return (
    <div className="p-6 theme">
      {/* 添加主题和语言切换组件 */}
      <ThemeLanguageSwitcher />
      
      <div className="mb-6">
        <Typography.Title heading={2} className="text-color">
          {t("diagram_list")}
        </Typography.Title>
        <Typography.Text className="text-color">
          {t("diagram_list_welcome")}
        </Typography.Text>
      </div>
      
      <Card className="card-theme">
        <div className="flex justify-between items-center mb-4 filter-controls">
          <div className="flex items-center gap-4">
            <Input
              prefix={<IconSearch />}
              placeholder={t('search_diagram')}
              value={searchTerm}
              onChange={handleSearch}
              style={{ width: '300px' }}
              className="text-color"
              aria-label={t('search_diagram')}
            />
            <Popover
              ref={popoverRef}
              content={filterContent}
              trigger="click"
              position="bottomLeft"
              visible={filtersVisible}
              onVisibleChange={setFiltersVisible}
              className="text-color"
            >
              <Button
                icon={<IconFilter />}
                type={activeFilters > 0 ? 'primary' : 'tertiary'}
                className={activeFilters > 0 ? 'filter-button-active' : ''}
                aria-label={t('advanced_filters')}
                aria-expanded={filtersVisible}
                aria-haspopup="dialog"
                onClick={() => setFiltersVisible(!filtersVisible)}
              >
                {t('filters')}
                {activeFilters > 0 && (
                  <Tag size="small" type="primary" style={{ marginLeft: 8 }}>
                    {activeFilters}
                  </Tag>
                )}
              </Button>
            </Popover>
            <div className="flex items-center">
              <Button
                icon={<IconGridRectangle />}
                type={displayMode === 'grid' ? 'primary' : 'tertiary'}
                onClick={() => handleModeChange('grid')}
                className="me-2"
                aria-label={t('display_as_grid')}
                aria-pressed={displayMode === 'grid'}
              />
              <Button
                icon={<IconArticle />}
                type={displayMode === 'table' ? 'primary' : 'tertiary'}
                onClick={() => handleModeChange('table')}
                aria-label={t('display_as_table')}
                aria-pressed={displayMode === 'table'}
              />
            </div>
          </div>
          <Button
            icon={<IconPlus />}
            type="primary"
            onClick={handleCreateDiagram}
            aria-label={t('new_diagram')}
          >
            {t('new_diagram')}
          </Button>
        </div>

        {/* 渲染活跃的筛选标签 */}
        {renderActiveFilterTags()}

        {loading ? (
          <div className="text-center py-8 text-color">
            <div className="semi-spin semi-spin-large semi-spin-wrapper">
              <div className="semi-spin-main">
                <div className="semi-spin-dot semi-spin-dot-spin">
                  <span className="semi-spin-dot-item"></span>
                  <span className="semi-spin-dot-item"></span>
                  <span className="semi-spin-dot-item"></span>
                  <span className="semi-spin-dot-item"></span>
                </div>
              </div>
            </div>
          </div>
        ) : diagrams.length === 0 ? (
          <Empty
            image={
              <div className="empty-diagram-illustration">
                <svg width="160" height="120" viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label={t('diagram_illustration')}>
                  {/* 背景 */}
                  <rect x="0" y="0" width="160" height="120" rx="4" fill="#f0f7ff" className="bg-shape" filter="url(#shadow)" />
                  
                  {/* 过滤器 - 阴影效果 */}
                  <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
                  </filter>
                  
                  {/* 数据库图标 */}
                  <ellipse cx="80" cy="30" rx="35" ry="15" stroke="#1890ff" strokeWidth="2" fill="transparent" className="db-shape"/>
                  <line x1="45" y1="30" x2="45" y2="65" stroke="#1890ff" strokeWidth="2" className="db-shape"/>
                  <line x1="115" y1="30" x2="115" y2="65" stroke="#1890ff" strokeWidth="2" className="db-shape"/>
                  <ellipse cx="80" cy="65" rx="35" ry="15" stroke="#1890ff" strokeWidth="2" fill="transparent" className="db-shape"/>
                  
                  {/* 表格连线 */}
                  <rect x="25" y="90" width="35" height="25" rx="2" stroke="#1890ff" strokeWidth="2" fill="transparent" className="table-shape"/>
                  <rect x="100" y="90" width="35" height="25" rx="2" stroke="#1890ff" strokeWidth="2" fill="transparent" className="table-shape"/>
                  
                  {/* 连接线 */}
                  <path d="M45 65 L42.5 90" stroke="#1890ff" strokeWidth="1.5" strokeDasharray="3 2" className="connection-line"/>
                  <path d="M115 65 L117.5 90" stroke="#1890ff" strokeWidth="1.5" strokeDasharray="3 2" className="connection-line"/>
                  
                  {/* 表中的行 */}
                  <line x1="28" y1="97" x2="57" y2="97" stroke="#1890ff" strokeWidth="1" className="table-row"/>
                  <line x1="28" y1="103" x2="52" y2="103" stroke="#1890ff" strokeWidth="1" className="table-row"/>
                  <line x1="28" y1="109" x2="55" y2="109" stroke="#1890ff" strokeWidth="1" className="table-row"/>
                  
                  <line x1="103" y1="97" x2="132" y2="97" stroke="#1890ff" strokeWidth="1" className="table-row"/>
                  <line x1="103" y1="103" x2="127" y2="103" stroke="#1890ff" strokeWidth="1" className="table-row"/>
                  <line x1="103" y1="109" x2="130" y2="109" stroke="#1890ff" strokeWidth="1" className="table-row"/>
                </svg>
              </div>
            }
            title={t('no_diagram_data')}
            description={
              searchTerm || activeFilters > 0 ? t('no_matching_diagrams') : t('click_to_create')
            }
            className="text-color"
          >
            {!searchTerm && activeFilters === 0 && (
              <div className="mt-6">
                <button 
                  className="empty-state-create-button"
                  onClick={handleCreateDiagram}
                  aria-label={t('new_diagram')}
                >
                  <IconPlus size="large" aria-hidden="true" />
                  <span>{t('new_diagram')}</span>
                </button>
              </div>
            )}
          </Empty>
        ) : (
          <>
            {displayMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-4">
                {diagrams.map((diagram) => (
                  <DiagramPreviewCard
                    key={diagram.id}
                    diagram={diagram}
                    onEdit={handleEditDiagram}
                    onShare={handleShare}
                    onDelete={() => handleDeleteDiagram(diagram.id, diagram.name)}
                    onView={handleViewDiagram}
                  />
                ))}
              </div>
            ) : (
              <table className="w-full border-collapse text-color" role="grid" aria-label={t('diagram_list')}>
                <thead>
                  <tr className="border-b border-color">
                    <th className="px-4 py-2 text-left" scope="col">{t('diagram_name')}</th>
                    <th className="px-4 py-2 text-left" scope="col">{t('database_type')}</th>
                    <th className="px-4 py-2 text-left" scope="col">{t('last_modified_time')}</th>
                    <th className="px-4 py-2 text-left" scope="col">{t('create_time')}</th>
                    <th className="px-4 py-2 text-right" scope="col">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {diagrams.map((diagram) => (
                    <tr 
                      key={diagram.id} 
                      className="border-b border-color hover-1 cursor-pointer"
                    >
                      <td className="px-4 py-3">{diagram.name}</td>
                      <td className="px-4 py-3">{diagram.database}</td>
                      <td className="px-4 py-3">{formatDateTime(diagram.updatedAt)}</td>
                      <td className="px-4 py-3">{formatDateTime(diagram.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          icon={<IconSearch />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // 防止触发行点击事件
                            handleViewDiagram(diagram.id);
                          }}
                          className="me-2"
                        >
                          {t('view')}
                        </Button>
                        <Button
                          icon={<IconEdit />}
                          type="primary"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // 防止触发行点击事件
                            handleEditDiagram(diagram.id);
                          }}
                          className="me-2"
                        >
                          {t('edit')}
                        </Button>
                        <Button
                          icon={<IconShareStroked />}
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // 防止触发行点击事件
                            handleShare(diagram);
                          }}
                          className="me-2"
                        >
                          {t('share')}
                        </Button>
                        <Button
                          icon={<IconDelete />}
                          type="danger"
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation(); // 防止触发行点击事件
                            handleDeleteDiagram(diagram.id, diagram.name);
                          }}
                        >
                          {t('delete')}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            
            {/* 添加分页控件 - 确保使用国际化文本 */}
            {total > 0 && (
              <div className="flex justify-center mt-6">
                <Pagination
                  ref={paginationRef}
                  total={total}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  pageSizeOpts={[9, 12, 15, 18]}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  showSizeChanger
                  aria-label={t('pagination')}
                  popoverProps={{ position: 'topRight' }}
                  style={{ marginTop: '16px' }}
                />
              </div>
            )}
          </>
        )}
      </Card>
      
      {/* 添加数据库选择对话框 */}
      <Modal
        centered
        size="medium"
        closable={true}
        hasCancel={true}
        title={t("pick_db")}
        okText={t("confirm")}
        visible={showDbSelectModal}
        onOk={handleCreateAndNavigate}
        onCancel={() => setShowDbSelectModal(false)}
        okButtonProps={{ 
          disabled: selectedDb === "",
          loading: loading
        }}
      >
        <div className="space-y-4">
          {/* 添加图表名称输入框 */}
          <div>
            <Typography.Text className="text-color mb-2 block">
              {t('diagram_name')}
            </Typography.Text>
            <Input
              value={diagramName}
              onChange={setDiagramName}
              placeholder={t('enter_diagram_name')}
              className="w-full"
            />
          </div>
          
          {/* 数据库选择网格 */}
          <div className="grid grid-cols-3 gap-4 place-content-center">
            {Object.values(databases).map((x) => (
              <div
                key={x.name}
                onClick={() => handleDbSelect(x.label)}
                className={`space-y-3 py-3 px-4 rounded-md border-2 select-none cursor-pointer ${
                  document.body.getAttribute('theme-mode') === "dark"
                    ? "bg-zinc-700 hover:bg-zinc-600"
                    : "bg-zinc-100 hover:bg-zinc-200"
                } ${selectedDb === x.label ? "border-zinc-400" : "border-transparent"}`}
              >
                <div className="font-semibold">{x.name}</div>
                {x.image && (
                  <img
                    src={x.image}
                    className="h-10"
                    style={{
                      filter:
                        "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                    }}
                  />
                )}
                <div className="text-xs">{x.description}</div>
              </div>
            ))}
          </div>
        </div>
      </Modal>
      
      {/* 分享模态框 */}
      <ShareModal 
        visible={shareModalVisible}
        onClose={handleCloseShareModal}
        title={currentDiagram?.name}
        diagramId={currentDiagram?.id}
      />
      
      {/* 查看图表模态框 */}
      <DiagramViewModal
        visible={viewModalVisible}
        diagram={detailedDiagram}
        onClose={handleCloseViewModal}
        onEdit={handleEditDiagram}
        onShare={handleShare}
      />
    </div>
  );
} 