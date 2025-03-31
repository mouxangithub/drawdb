import React from 'react';
import { Modal, Button, Typography } from '@douyinfe/semi-ui';
import { useTranslation } from 'react-i18next';

/**
 * 通用确认对话框组件
 * 提供带有确认和取消选项的对话框
 * 
 * @param {Object} props - 组件属性
 * @param {boolean} props.visible - 是否显示对话框
 * @param {Function} props.onClose - 关闭对话框的回调函数
 * @param {Function} props.onConfirm - 点击确认按钮的回调函数
 * @param {string} props.title - 对话框标题
 * @param {string|React.ReactNode} props.content - 对话框内容
 * @param {string} props.confirmText - 确认按钮文本
 * @param {string} props.cancelText - 取消按钮文本
 * @param {string} props.confirmType - 确认按钮类型 (primary, warning, danger, secondary, tertiary)
 * @param {boolean} props.loading - 确认按钮是否显示加载状态
 */
const ConfirmationPrompt = ({
  visible = false,
  onClose,
  onConfirm,
  title,
  content,
  confirmText,
  cancelText,
  confirmType = 'primary',
  loading = false
}) => {
  const { t } = useTranslation();
  
  return (
    <Modal
      title={title || t('confirmation')}
      visible={visible}
      onCancel={onClose}
      footer={null}
      closeOnEsc={!loading}
      maskClosable={!loading}
      size="small"
    >
      <div className="confirmation-prompt-content">
        {typeof content === 'string' ? (
          <Typography.Paragraph className="text-color">
            {content}
          </Typography.Paragraph>
        ) : (
          content
        )}
      </div>
      <div className="confirmation-prompt-footer" style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Button
          disabled={loading}
          onClick={onClose}
        >
          {cancelText || t('cancel')}
        </Button>
        <Button
          type={confirmType}
          loading={loading}
          onClick={onConfirm}
        >
          {confirmText || t('confirm')}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmationPrompt; 