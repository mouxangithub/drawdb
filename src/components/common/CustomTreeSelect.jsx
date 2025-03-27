import React, { useEffect, useRef } from 'react';
import { TreeSelect } from '@douyinfe/semi-ui';

/**
 * 自定义 TreeSelect 包装组件，修复 autofocus 问题
 * @param {Object} props - 组件属性
 * @returns {React.ReactElement} 包装后的 TreeSelect 组件
 */
const CustomTreeSelect = (props) => {
  const containerRef = useRef(null);
  const observerRef = useRef(null);

  // 强制处理 autofocus 属性，从 props 中彻底移除
  const cleanedProps = { ...props };
  if ('autofocus' in cleanedProps) {
    delete cleanedProps.autofocus;
  }

  useEffect(() => {
    // 对根元素应用样式，便于识别和调试
    if (containerRef.current) {
      containerRef.current.setAttribute('data-fixed-autofocus', 'true');
    }

    // 立即执行一次强制修复
    setTimeout(() => {
      fixAllAutofocusAttributes();
    }, 0);

    // 再执行几次延迟修复，确保覆盖异步加载的组件
    setTimeout(() => fixAllAutofocusAttributes(), 100);
    setTimeout(() => fixAllAutofocusAttributes(), 500);

    return () => {
      // 清理
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, []);

  // 全局处理函数，也可用于外部触发修复
  const fixAllAutofocusAttributes = () => {
    if (!containerRef.current) return;

    try {
      // 1. 修复 input 元素
      const inputs = containerRef.current.querySelectorAll('input');
      inputs.forEach(input => {
        // 移除 autofocus 属性，避免警告
        if (input.hasAttribute('autofocus')) {
          input.removeAttribute('autofocus');
        }

        // 还要检查可能动态设置的属性
        const attrs = input.attributes;
        for (let i = 0; i < attrs.length; i++) {
          if (attrs[i].name.toLowerCase() === 'autofocus') {
            input.removeAttributeNode(attrs[i]);
            i--; // 因为移除了一个节点，需要回退索引
          }
        }
      });

      // 2. 特别处理 semi-ui 内部组件
      const semiElements = containerRef.current.querySelectorAll('.semi-input, .semi-input-wrapper, .semi-select');
      semiElements.forEach(element => {
        // 为这些元素添加特殊标记，方便调试
        element.setAttribute('data-fixed-autofocus', 'true');
      });

      // 3. 只设置一次观察器
      if (!observerRef.current) {
        setupMutationObserver();
      }
    } catch (error) {
      console.error('Error fixing autofocus attributes:', error);
    }
  };

  // 设置 MutationObserver 持续监视
  const setupMutationObserver = () => {
    try {
      if (!containerRef.current || observerRef.current) return;

      const observer = new MutationObserver((mutations) => {
        let shouldFix = false;

        mutations.forEach(mutation => {
          // 检查是否有需要修复的变化
          if (mutation.type === 'attributes' && 
              mutation.attributeName && 
              mutation.attributeName.toLowerCase() === 'autofocus') {
            shouldFix = true;
          } else if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // 检查新添加的节点是否有可能包含需要修复的元素
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              if (node.nodeType === 1) { // 元素节点
                shouldFix = true;
                break;
              }
            }
          }
        });

        // 如果需要修复，执行修复
        if (shouldFix) {
          fixAllAutofocusAttributes();
        }
      });

      // 配置 observer 监听所有可能的变化
      observer.observe(containerRef.current, {
        attributes: true,
        childList: true,
        subtree: true,
        characterData: false
      });

      // 保存观察器引用
      observerRef.current = observer;
    } catch (error) {
      console.error('Error setting up mutation observer:', error);
    }
  };

  // 渲染时确保不传递 autofocus 属性
  return (
    <div ref={containerRef} className="custom-tree-select-container">
      <TreeSelect 
        {...cleanedProps} 
        dropdownClassName={`custom-tree-select-dropdown ${cleanedProps.dropdownClassName || ''}`}
        autoFocus={false} // 确保始终禁用自动焦点
      />
    </div>
  );
};

export default CustomTreeSelect; 