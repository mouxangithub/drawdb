import { Tabs, TabPane } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { isRtl } from "../../i18n/utils/rtl";
import i18n from "../../i18n/i18n";

/**
 * 通用标签页容器组件
 * 提供一致的标签页样式和行为，可以被 SidePanel 和 JsonEditor 等组件复用
 * 
 * @param {Object} props 组件属性
 * @param {string} props.activeKey 当前激活的标签页键值
 * @param {Function} props.onChange 标签页切换时的回调函数
 * @param {Array} props.tabs 标签页配置数组，每项包含 tab（标签名）、itemKey（标签键）、count（可选计数）、component（标签内容组件）
 * @param {boolean} props.stickyHeader 是否使用固定标题样式
 * @param {Object} props.tabBarExtraContent 标签栏额外内容
 * @param {boolean} props.lazyRender 是否懒加载标签内容
 * @param {boolean} props.keepDOM 是否保持DOM
 * @returns {JSX.Element} 标签页容器组件
 */
export default function TabsContainer({
  activeKey,
  onChange,
  tabs,
  stickyHeader = false,
  tabBarExtraContent = null,
  lazyRender = false,
  keepDOM = true,
  className = "",
}) {
  const { t } = useTranslation();

  const headerClassName = stickyHeader ? "sticky top-0 z-10 bg-inherit" : "";
  
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className={headerClassName}>
        <Tabs
          type="card"
          activeKey={activeKey}
          onChange={onChange}
          tabBarStyle={{ direction: "ltr" }}
          tabBarExtraContent={tabBarExtraContent}
          lazyRender={lazyRender}
          keepDOM={keepDOM}
          collapsible
        >
          {tabs.map((tab) => (
            <TabPane 
              tab={tab.count !== undefined ? `${tab.tab} (${tab.count})` : tab.tab} 
              itemKey={tab.itemKey} 
              key={tab.itemKey}
            >
              {tab.content !== undefined && (
                <div className="p-2">{tab.content}</div>
              )}
            </TabPane>
          ))}
        </Tabs>
      </div>
      <div className="h-full flex-1 overflow-y-auto">
        {tabs.map((tab) => (
          activeKey === tab.itemKey && tab.component && (
            <div key={tab.itemKey} className="p-2">
              {tab.component}
            </div>
          )
        ))}
      </div>
    </div>
  );
} 