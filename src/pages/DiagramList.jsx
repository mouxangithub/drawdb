import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Button, 
  Typography, 
  Input, 
  Empty, 
  Card,
  Notification,
  Tabs,
  Toast,
  Modal
} from '@douyinfe/semi-ui';
import { 
  IconPlus, 
  IconSearch,
  IconArticle,
  IconGridRectangle,
  IconEdit,
  IconShareStroked,
  IconDelete
} from '@douyinfe/semi-icons';
import { diagramApi } from '../services/api';
import { useTranslation } from 'react-i18next';
import ShareModal from '../components/common/ShareModal';
import DiagramPreviewCard from '../components/common/DiagramPreviewCard';
import DiagramViewModal from '../components/common/DiagramViewModal';

/**
 * 图表列表页面
 * 显示所有图表，提供新建、编辑、删除、分享等功能
 * 重构版本：增加了图表预览功能
 */
export default function DiagramList() {
  const [diagrams, setDiagrams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [viewModalVisible, setViewModalVisible] = useState(false);
  const [currentDiagram, setCurrentDiagram] = useState(null);
  const [detailedDiagram, setDetailedDiagram] = useState(null);
  const [displayMode, setDisplayMode] = useState('grid'); // 'grid' 或 'table'
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  // 使用ref避免在状态更新过程中获取过时的状态值
  const loadingRef = useRef(false);
  
  // 加载图表列表
  const fetchDiagrams = useCallback(async () => {
    if (loadingRef.current) return; // 防止重复请求
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const data = await diagramApi.getAll();
      setDiagrams(data);
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
  }, [t]);

  // 加载详细图表数据
  const fetchDiagramDetail = useCallback(async (id) => {
    if (loadingRef.current) return; // 防止重复请求
    
    try {
      loadingRef.current = true;
      setLoading(true);
      
      const data = await diagramApi.getById(id);
      
      if (!data) {
        throw new Error('未找到图表数据');
      }
      
      // 检查图表是否有表格数据
      const hasNoTables = !data.tables || data.tables.length === 0;
      
      if (hasNoTables) {
        console.warn('图表没有表格数据');
        // 可以选择在这里添加通知，但仍然显示视图模态框
        Toast.info({
          content: t('diagram_has_no_tables'),
          duration: 3,
        });
      }
      
      // 先设置详细数据
      setDetailedDiagram(data);
      setViewModalVisible(true);
      
    } catch (error) {
      console.error(`获取图表 ${id} 详情失败:`, error);
      Notification.error({
        title: t('error'),
        content: t('get_diagram_detail_failed'),
        duration: 3,
      });
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [t]);

  // 初始化加载图表
  useEffect(() => {
    document.title = "drawDB | " + t("diagram_list");
    fetchDiagrams();
    
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
  }, [t, fetchDiagrams]);

  // 过滤图表
  const filteredDiagrams = diagrams.filter(
    (diagram) => diagram.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 创建新图表
  const handleCreateDiagram = useCallback(() => {
    navigate('/editor');
  }, [navigate]);

  // 编辑图表
  const handleEditDiagram = useCallback((id) => {
    navigate(`/editor/${id}`);
  }, [navigate]);

  // 查看图表
  const handleViewDiagram = useCallback((id) => {
    fetchDiagramDetail(id);
  }, [fetchDiagramDetail]);

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

  return (
    <div className="p-6 theme">
      <div className="mb-6">
        <Typography.Title heading={2} className="text-color">
          {t("diagram_list")}
        </Typography.Title>
        <Typography.Text className="text-color">
          {t("diagram_list_welcome")}
        </Typography.Text>
      </div>
      
      <Card className="card-theme">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <Input
              prefix={<IconSearch />}
              placeholder={t('search_diagram')}
              value={searchTerm}
              onChange={setSearchTerm}
              style={{ width: '300px' }}
              className="text-color"
            />
            <div className="flex items-center">
              <Button
                icon={<IconGridRectangle />}
                type={displayMode === 'grid' ? 'primary' : 'tertiary'}
                onClick={() => handleModeChange('grid')}
                className="me-2"
              />
              <Button
                icon={<IconArticle />}
                type={displayMode === 'table' ? 'primary' : 'tertiary'}
                onClick={() => handleModeChange('table')}
              />
            </div>
          </div>
          <Button
            icon={<IconPlus />}
            type="primary"
            onClick={handleCreateDiagram}
          >
            {t('new_diagram')}
          </Button>
        </div>

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
        ) : filteredDiagrams.length === 0 ? (
          <Empty
            image={<div className="semi-empty-image"></div>}
            title={t('no_diagram_data')}
            description={
              searchTerm ? t('no_matching_diagrams') : t('click_to_create')
            }
            className="text-color"
          />
        ) : (
          <>
            {displayMode === 'grid' ? (
              <div className="grid grid-cols-3 gap-4">
                {filteredDiagrams.map((diagram) => (
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
              <table className="w-full border-collapse text-color">
                <thead>
                  <tr className="border-b border-color">
                    <th className="px-4 py-2 text-left">{t('diagram_name')}</th>
                    <th className="px-4 py-2 text-left">{t('database_type')}</th>
                    <th className="px-4 py-2 text-left">{t('last_modified_time')}</th>
                    <th className="px-4 py-2 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDiagrams.map((diagram) => (
                    <tr 
                      key={diagram.id} 
                      className="border-b border-color hover-1 cursor-pointer"
                      onClick={() => handleViewDiagram(diagram.id)}
                    >
                      <td className="px-4 py-3">{diagram.name}</td>
                      <td className="px-4 py-3">{diagram.database}</td>
                      <td className="px-4 py-3">{new Date(diagram.lastModified).toLocaleString()}</td>
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
          </>
        )}
      </Card>
      
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