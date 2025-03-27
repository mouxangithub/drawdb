import { useState } from "react";
import ShareModal from "../../common/ShareModal";
import { MODAL } from "../../../data/constants";

/**
 * 编辑器页面的分享组件处理器
 * 使用通用ShareModal组件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.title - 图表标题
 * @param {function} props.setModal - 设置模态框状态的函数
 * @param {string} props.diagramId - 图表ID
 */
export default function Share({ title, setModal, diagramId }) {
  const [visible, setVisible] = useState(true);
  
  // 处理关闭回调
  const handleClose = () => {
    setVisible(false);
    setModal(MODAL.NONE);
  };
  
  return (
    <ShareModal 
      visible={visible}
      onClose={handleClose}
      title={title}
      diagramId={diagramId}
    />
  );
}
