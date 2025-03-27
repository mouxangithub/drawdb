import { Button, Input, Modal as SemiModal, Toast } from "@douyinfe/semi-ui";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { IconLink } from "@douyinfe/semi-icons";
import { MODAL } from "../../data/constants";

/**
 * 共享的分享模态框组件
 * 提供通用的分享功能，可以被DiagramList和编辑器页面共用
 * 直接共享当前图表ID的URL，不再使用shareId
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.title - 图表标题
 * @param {function} props.onClose - 关闭模态框的回调
 * @param {boolean} props.visible - 是否显示模态框
 * @param {string} props.diagramId - 图表ID
 */
export default function ShareModal({ 
  title, 
  onClose, 
  visible, 
  diagramId
}) {
  const { t } = useTranslation();
  
  // 生成分享链接URL - 直接使用/editor/:id形式
  const getShareUrl = useCallback(() => {
    if (!diagramId) return '';
    return `${window.location.origin}/editor/${diagramId}`;
  }, [diagramId]);

  // 复制分享链接
  const handleCopyLink = useCallback(() => {
    const url = getShareUrl();
    if (!url) {
      Toast.error(t("no_diagram_to_share"));
      return;
    }
    
    navigator.clipboard.writeText(url)
      .then(() => {
        Toast.success(t("copied_to_clipboard"));
        // 复制成功后自动关闭弹窗
        onClose(MODAL.NONE);
      })
      .catch(() => {
        Toast.error(t("oops_smth_went_wrong"));
      });
  }, [getShareUrl, t, onClose]);

  return (
    <SemiModal
      title={t("share")}
      visible={visible}
      onCancel={() => onClose(MODAL.NONE)}
      footer={null}
      closeOnEsc={true}
      width={500}
      centered
    >
      <div>
        <div className="flex gap-3">
          <Input value={getShareUrl()} size="large" readOnly />
        </div>
        <div className="text-xs mt-2">{t("share_info")}</div>
        <div className="flex gap-2 mt-3 mb-6">
          <Button 
            block 
            theme="solid" 
            icon={<IconLink />} 
            onClick={handleCopyLink}
            size="large"
            style={{ height: '42px', borderRadius: '8px' }}
          >
            {t("copy_link")}
          </Button>
        </div>
      </div>
    </SemiModal>
  );
} 