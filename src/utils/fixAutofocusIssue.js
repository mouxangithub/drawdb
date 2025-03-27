import { useEffect } from 'react';

/**
 * 自定义 Hook，用于修复 Semi UI 组件中的 autofocus 属性问题
 * 这个 Hook 会在组件挂载后扫描 DOM，移除错误的 autofocus 属性
 */
export const useFixAutofocusIssue = () => {
  useEffect(() => {
    // 使用 MutationObserver 监听 DOM 变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          // 当元素的属性发生变化时
          if (mutation.attributeName === 'autofocus') {
            const element = mutation.target;
            // 将 autofocus 属性替换为 autoFocus
            if (element.hasAttribute('autofocus')) {
              element.removeAttribute('autofocus');
            }
          }
        } else if (mutation.type === 'childList') {
          // 当子节点发生变化时，检查是否有新的带有 autofocus 的元素
          const autofocusElements = document.querySelectorAll('[autofocus]');
          autofocusElements.forEach(element => {
            element.removeAttribute('autofocus');
          });
        }
      });
    });

    // 配置 observer 监听整个文档的变化
    observer.observe(document.body, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['autofocus']
    });

    // 组件卸载时停止监听
    return () => {
      observer.disconnect();
    };
  }, []);
}; 