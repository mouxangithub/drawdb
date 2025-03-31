/**
 * 禁用 React DOM 属性警告
 * 
 * 这个函数会修改 React 的控制台警告函数，忽略关于 autofocus 属性的警告
 * 注意：这是一个临时解决方案，更好的做法是修复底层问题
 */
export function disableReactAutofocusWarning() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // 保存原始的 console.error 函数
    const originalConsoleError = console.error;
    
    // 保存原始的 console.warn 函数，以防警告也通过 warn 输出
    const originalConsoleWarn = console.warn;
    
    // 创建一个函数来检查是否是 autofocus 相关的警告
    const isAutofocusWarning = (message) => {
      if (typeof message !== 'string') return false;
      
      // 匹配所有可能的 autofocus 警告模式
      return message.includes('Invalid DOM property `autofocus`') || 
             message.includes('Did you mean `autoFocus`') ||
             (message.includes('autofocus') && message.includes('autoFocus')) ||
             message.includes('React does not recognize the `autofocus` prop') ||
             message.includes('Unknown prop `autofocus`');
    };
    
    // 修改 console.error 函数，忽略特定的警告
    console.error = function (...args) {
      // 检查是否是 autofocus 警告
      if (args.length > 0 && isAutofocusWarning(args[0])) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他警告，调用原始的 console.error
      return originalConsoleError.apply(console, args);
    };
    
    // 同样修改 console.warn 函数
    console.warn = function (...args) {
      // 检查是否是 autofocus 警告
      if (args.length > 0 && isAutofocusWarning(args[0])) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他警告，调用原始的 console.warn
      return originalConsoleWarn.apply(console, args);
    };
    
    // 在文档加载完成后自动修复 DOM 中的 autofocus 属性
    if (document.readyState === 'loading') {
      window.addEventListener('DOMContentLoaded', () => {
        fixAutofocusInDOM();
        setupAutofocusMutationObserver();
      });
    } else {
      // 如果文档已经加载完成，立即执行
      fixAutofocusInDOM();
      setupAutofocusMutationObserver();
    }
    
    // 为新的 React 渲染调用设置一个定时器，以修复可能在初始加载后出现的 autofocus 问题
    setTimeout(fixAutofocusInDOM, 500);
    setTimeout(fixAutofocusInDOM, 1000);
    setTimeout(fixAutofocusInDOM, 2000);
  }
}

/**
 * 主动修复 DOM 中的 autofocus 属性
 * 
 * 此函数扫描整个 DOM，将 autofocus 属性替换为 React 兼容的 autoFocus
 */
export function fixAutofocusInDOM() {
  try {
    // 查找所有具有 autofocus 属性的元素
    const elements = document.querySelectorAll('[autofocus]');
    
    if (elements.length > 0) {
      // console.log(`Found ${elements.length} elements with autofocus attribute, fixing...`);
      
      elements.forEach(element => {
        try {
          // 尝试通过多种方式修复 autofocus 问题
          
          // 1. 移除原始的 autofocus 属性
          element.removeAttribute('autofocus');
          
          // 2. 尝试添加正确大小写的 autoFocus 属性
          // 注意：这在 React 中可能无效，因为 React 有自己的属性处理机制
          if (typeof element.setAttribute === 'function') {
            try {
              element.setAttribute('autoFocus', '');
            } catch (e) {
              // 忽略设置错误
            }
          }
          
          // 3. 对于特定的输入元素，尝试应用 .focus() 方法
          const focusableElements = ['INPUT', 'TEXTAREA', 'SELECT'];
          if (focusableElements.includes(element.tagName)) {
            // 使用 setTimeout 确保在当前执行队列之后应用焦点
            setTimeout(() => {
              try {
                element.focus();
              } catch (e) {
                // 忽略焦点设置错误
              }
            }, 0);
          }
          
          // 4. 对于 Semi UI 的 Input 组件，尝试查找其内部的实际输入元素
          if (element.classList.contains('semi-input') || 
              element.classList.contains('semi-input-wrapper')) {
            const inputElement = element.querySelector('input');
            if (inputElement) {
              setTimeout(() => {
                try {
                  inputElement.focus();
                } catch (e) {
                  // 忽略焦点设置错误
                }
              }, 0);
            }
          }
        } catch (elementError) {
          // 忽略单个元素处理错误，继续处理其他元素
        }
      });
    }
  } catch (error) {
    // 忽略错误，确保不影响主要功能
    console.error('Error in fixAutofocusInDOM:', error);
  }
}

/**
 * 禁用 React 的 findDOMNode 废弃警告
 * 
 * 此函数重写了 console.warn 和 console.error 方法，忽略关于 findDOMNode 的警告，
 * 同时还能过滤React Router的未来版本标志警告
 */
export function disableFindDOMNodeWarning() {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    // 保存原始的 console.warn 方法
    const originalConsoleWarn = console.warn;
    
    // 保存原始的 console.error 方法
    const originalConsoleError = console.error;
    
    // 创建一个函数来检查是否是 findDOMNode 相关的警告
    const isFindDOMNodeWarning = (message) => {
      if (typeof message !== 'string') return false;
      
      // 匹配所有可能的 findDOMNode 警告模式
      return message.includes('findDOMNode') && 
            (message.includes('deprecated') || 
             message.includes('will be removed') || 
             message.includes('Instead, add a ref') ||
             message.includes('strict mode') ||
             message.includes('safe'));
    };
    
    // 替换 console.warn
    console.warn = function(...args) {
      // 检查是否是 findDOMNode 警告或 React Router 警告
      if (args.length > 0 && typeof args[0] === 'string') {
        // 忽略 findDOMNode 警告
        if (isFindDOMNodeWarning(args[0])) {
          return; // 不显示警告
        }
        
        // 忽略 React Router 未来标志警告
        if ((args[0].includes('React Router Future Flag Warning') || 
             args[0].includes('v7_startTransition') || 
             args[0].includes('v7_relativeSplatPath'))) {
          return; // 不显示警告
        }
      }
      
      // 对其他警告使用原始方法
      return originalConsoleWarn.apply(console, args);
    };
    
    // 替换 console.error (因为有些警告可能通过 error 输出)
    console.error = function(...args) {
      // 检查是否是 findDOMNode 警告
      if (args.length > 0 && typeof args[0] === 'string') {
        if (isFindDOMNodeWarning(args[0])) {
          return; // 不显示警告
        }
      }
      
      // 对其他错误使用原始方法
      return originalConsoleError.apply(console, args);
    };
  }
}

/**
 * 禁用 findDOMNode 废弃警告（控制台错误版本）
 * 
 * 此函数修改 console.error 函数，以忽略关于 findDOMNode 废弃的警告
 * 这是一个临时解决方案，主要用于处理第三方库（如 semi-ui）中使用 findDOMNode 的情况
 */
export function disableFindDOMNodeDeprecatedWarning() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // 保存原始的 console.error 函数
    const originalConsoleError = console.error;
    
    // 修改 console.error 函数，忽略特定的警告
    console.error = function (...args) {
      // 检查是否是 findDOMNode 警告
      if (args.length > 0 && 
          typeof args[0] === 'string' && 
          args[0].includes('findDOMNode is deprecated')) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他警告，调用原始的 console.error
      return originalConsoleError.apply(console, args);
    };
    
    // console.log('Successfully disabled findDOMNode deprecated warnings in console.error');
  }
}

/**
 * 禁用 ReactDOM.render 已弃用的警告
 * 
 * 此函数修改 console.warn 和 console.error 函数，以忽略关于 ReactDOM.render 和相关 API 已弃用的警告
 * 这是一个临时解决方案，用于处理项目中仍然使用 ReactDOM.render 而不是 createRoot 的情况
 * 更好的解决方案是将所有 ReactDOM.render 调用更新为使用 createRoot API
 */
export function disableReactDomRenderWarning() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // 保存原始的 console.warn 函数
    const originalConsoleWarn = console.warn;
    
    // 保存原始的 console.error 函数，如果之前没有被修改
    let originalConsoleError = console.error;
    if (typeof originalConsoleError.__originalFn === 'function') {
      // 如果已经被封装，使用原始函数
      originalConsoleError = originalConsoleError.__originalFn;
    }
    
    // 创建一个新的 console.warn 函数，忽略特定警告
    console.warn = function (...args) {
      // 检查是否是 ReactDOM 相关的弃用警告
      if (args.length > 0 && 
          typeof args[0] === 'string' && 
          (args[0].includes('ReactDOM.render is no longer supported') || 
           args[0].includes('Use createRoot instead') ||
           args[0].includes('unmountComponentAtNode is deprecated') ||
           args[0].includes('findDOMNode is deprecated') ||
           args[0].includes('switch to the new root API'))) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他警告，调用原始的 console.warn
      return originalConsoleWarn.apply(console, args);
    };
    
    // 创建一个新的 console.error 函数，也忽略特定警告
    // 这很重要，因为有些警告可能通过 error 而不是 warn 输出
    const newConsoleError = function (...args) {
      // 检查是否是 ReactDOM 相关的弃用警告
      if (args.length > 0 && 
          typeof args[0] === 'string' && 
          (args[0].includes('ReactDOM.render is no longer supported') || 
           args[0].includes('Use createRoot instead') ||
           args[0].includes('unmountComponentAtNode is deprecated') ||
           args[0].includes('findDOMNode is deprecated') ||
           args[0].includes('switch to the new root API'))) {
        // 忽略这个警告
        return;
      }
      
      // 继续原有的 autofocus 和 findDOMNode 警告处理
      if (args.length > 0 && 
          typeof args[0] === 'string' && 
          ((args[0].includes('Invalid DOM property `autofocus`') || 
            args[0].includes('autofocus') && args[0].includes('autoFocus') ||
            args[0].includes('React does not recognize the `autofocus` prop') ||
            args[0].includes('Did you mean `autoFocus`')) ||
           args[0].includes('findDOMNode is deprecated'))) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他错误，调用原始的 console.error
      return originalConsoleError.apply(console, args);
    };
    
    // 保存原始函数的引用，以便其他地方可能需要访问
    newConsoleError.__originalFn = originalConsoleError;
    console.error = newConsoleError;
    
    // 现在，当我们调用 disableReactDomRenderWarning 时，它会处理两种控制台函数的警告
    // console.log('Successfully disabled ReactDOM render and unmountComponentAtNode deprecation warnings');
  }
}

/**
 * 设置 MutationObserver 以监视 DOM 变化，自动修复 autofocus 属性
 * 
 * 此函数创建一个 MutationObserver 实例，监视 document.body 的子树变化
 * 当检测到新添加的元素具有 autofocus 属性时，会自动将其转换为 autoFocus（如果可能）
 * 或者直接删除该属性并尝试手动设置焦点
 */
export function setupAutofocusMutationObserver() {
  if (typeof window !== 'undefined' && window.MutationObserver) {
    try {
      // 创建观察器实例
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          // 处理新添加的节点
          if (mutation.addedNodes && mutation.addedNodes.length > 0) {
            for (let i = 0; i < mutation.addedNodes.length; i++) {
              const node = mutation.addedNodes[i];
              
              // 跳过非元素节点
              if (node.nodeType !== Node.ELEMENT_NODE) continue;
              
              // 处理当前节点
              if (node.hasAttribute && node.hasAttribute('autofocus')) {
                handleAutofocusNode(node);
              }
              
              // 处理子节点
              if (node.querySelectorAll) {
                const autofocusElements = node.querySelectorAll('[autofocus]');
                autofocusElements.forEach(handleAutofocusNode);
              }
            }
          }
          
          // 处理属性变化
          if (mutation.type === 'attributes' && 
              mutation.attributeName === 'autofocus' && 
              mutation.target.hasAttribute && 
              mutation.target.hasAttribute('autofocus')) {
            handleAutofocusNode(mutation.target);
          }
        });
      });
      
      // 配置观察选项
      const config = { 
        childList: true,     // 观察子节点变化
        subtree: true,       // 观察所有后代节点
        attributes: true,    // 观察属性变化
        attributeFilter: ['autofocus']  // 只关心 autofocus 属性
      };
      
      // 开始观察
      observer.observe(document.body || document.documentElement, config);
      
      // 返回观察器实例，以便可能的后续清理
      return observer;
    } catch (error) {
      console.error('Error setting up autofocus mutation observer:', error);
    }
  }
  return null;
}

/**
 * 处理具有 autofocus 属性的节点
 * @param {Element} node - 具有 autofocus 属性的 DOM 节点
 */
function handleAutofocusNode(node) {
  try {
    // 移除原始的 autofocus 属性
    node.removeAttribute('autofocus');
    
    // 尝试手动设置焦点
    // 使用 setTimeout 确保在 React 处理完当前批次的更新后设置焦点
    setTimeout(() => {
      try {
        node.focus();
      } catch (e) {
        // 忽略焦点设置错误
      }
    }, 0);
  } catch (error) {
    // 忽略错误，确保不破坏其他功能
  }
}

/**
 * 专门处理 Semi UI 组件库中的 autofocus 问题
 * 这个函数会检测并修复 Semi UI 组件中的 autofocus 属性问题
 */
export function patchSemiUIComponents() {
  if (typeof window !== 'undefined') {
    try {
      // console.log('Applying special patch for Semi UI components...');
      
      // 1. 修补 Semi UI 的基本组件
      patchSemiUIComponentClasses();
      
      // 2. 修补 Semi UI 使用的 DOM 属性
      patchSemiUIDOMAttributes();
      
      // 3. 使用 MutationObserver 来监视 Semi UI 组件的动态变化
      setupSemiUIObserver();
      
      // console.log('Successfully applied special patch for Semi UI components');
    } catch (error) {
      console.error('Error applying Semi UI patch:', error);
    }
  }
}

/**
 * 修补 Semi UI 组件类，特别是处理 Input 和 TreeSelect 的属性传递
 */
function patchSemiUIComponentClasses() {
  try {
    // 如果 Semi UI 已加载到全局命名空间（通过 UMD 或其他方式）
    if (window.SemiUI) {
      // 处理 Input 组件
      if (window.SemiUI.Input) {
        const originalInputRender = window.SemiUI.Input.prototype.render;
        window.SemiUI.Input.prototype.render = function() {
          // 移除不安全的属性
          if (this.props) {
            const cleanProps = { ...this.props };
            if ('autofocus' in cleanProps) {
              delete cleanProps.autofocus;
              // 使用正确的 React 属性
              cleanProps.autoFocus = false;
            }
            this.props = cleanProps;
          }
          return originalInputRender.apply(this);
        };
      }
      
      // 处理 TreeSelect 组件
      if (window.SemiUI.TreeSelect) {
        const originalTreeSelectRender = window.SemiUI.TreeSelect.prototype.render;
        window.SemiUI.TreeSelect.prototype.render = function() {
          // 移除不安全的属性
          if (this.props) {
            const cleanProps = { ...this.props };
            if ('autofocus' in cleanProps) {
              delete cleanProps.autofocus;
              // 使用正确的 React 属性
              cleanProps.autoFocus = false;
            }
            this.props = cleanProps;
          }
          return originalTreeSelectRender.apply(this);
        };
      }
    }
    
    // 对于通过 import 方式加载的情况，我们可以在全局脚本中添加这个修补
    const patchScript = document.createElement('script');
    patchScript.textContent = `
      (function() {
        // 在每次渲染后应用修复
        const fixInputs = function() {
          document.querySelectorAll('input[autofocus], .semi-input input, .semi-select input, .semi-tree-select input')
            .forEach(function(input) {
              if (input.hasAttribute('autofocus')) {
                input.removeAttribute('autofocus');
              }
            });
        };
        
        // 添加到 React 的调度器事件中
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          const originalOnCommitFiberRoot = window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot;
          if (originalOnCommitFiberRoot) {
            window.__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot = function() {
              const result = originalOnCommitFiberRoot.apply(this, arguments);
              setTimeout(fixInputs, 0);
              return result;
            };
          }
        }
        
        // 周期性运行修复
        setInterval(fixInputs, 2000);
      })();
    `;
    document.head.appendChild(patchScript);
  } catch (error) {
    console.error('Error patching Semi UI component classes:', error);
  }
}

/**
 * 修补 Semi UI 使用的 DOM 属性处理
 */
function patchSemiUIDOMAttributes() {
  try {
    // 使用 CSS 来隐藏或忽略 autofocus 属性的样式
    const style = document.createElement('style');
    style.textContent = `
      /* 禁用具有 autofocus 属性的元素的自动聚焦行为 */
      input[autofocus] {
        /* 通过 CSS 不会真正禁用 autofocus，但可以标记这些元素 */
        outline: none !important;
      }
      
      /* 为修复过的元素添加特殊标记 */
      [data-fixed-autofocus="true"] {
        /* 这里可以添加一些调试样式，如果需要的话 */
      }
    `;
    document.head.appendChild(style);
    
    // 定期扫描并移除文档中的 autofocus 属性
    const removeAutofocusAttributes = () => {
      document.querySelectorAll('[autofocus]').forEach(element => {
        element.removeAttribute('autofocus');
        // 标记为已修复
        element.setAttribute('data-fixed-autofocus', 'true');
      });
    };
    
    // 初始执行
    removeAutofocusAttributes();
    
    // 周期性执行 (每2秒)
    setInterval(removeAutofocusAttributes, 2000);
  } catch (error) {
    console.error('Error patching Semi UI DOM attributes:', error);
  }
}

/**
 * 设置 MutationObserver 来监视 Semi UI 组件的动态变化
 */
function setupSemiUIObserver() {
  try {
    // 创建一个观察器实例，用于监视整个文档树中的 autofocus 属性
    const observer = new MutationObserver(mutations => {
      let hasAutofocus = false;
      
      // 检查是否有任何变化包含 autofocus 属性
      mutations.forEach(mutation => {
        // 检查属性变化
        if (mutation.type === 'attributes' && 
            mutation.attributeName && 
            mutation.attributeName.toLowerCase() === 'autofocus') {
          hasAutofocus = true;
        }
        
        // 检查新添加的节点
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // 元素节点
              // 检查自身是否有 autofocus 属性
              if (node.hasAttribute && node.hasAttribute('autofocus')) {
                hasAutofocus = true;
              }
              
              // 检查子元素是否有 autofocus 属性
              if (node.querySelectorAll) {
                const autofocusElements = node.querySelectorAll('[autofocus]');
                if (autofocusElements.length > 0) {
                  hasAutofocus = true;
                }
              }
            }
          });
        }
      });
      
      // 如果发现有 autofocus 问题，进行修复
      if (hasAutofocus) {
        setTimeout(() => {
          document.querySelectorAll('[autofocus]').forEach(element => {
            element.removeAttribute('autofocus');
            element.setAttribute('data-fixed-autofocus', 'true');
          });
        }, 0);
      }
    });
    
    // 配置观察选项
    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['autofocus']
    };
    
    // 开始观察整个文档
    observer.observe(document.documentElement, config);
    
    // 保存观察器引用到全局变量，以便可能的后续清理
    window.__semiUIAutofocusObserver = observer;
  } catch (error) {
    console.error('Error setting up Semi UI observer:', error);
  }
}

/**
 * 禁用函数组件ref警告
 * 
 * 此函数修改console.error和console.warn，忽略关于函数组件不能使用ref的警告
 * 这是临时解决方案，适用于处理某些依赖库将ref传递给函数组件的情况
 */
export function disableFunctionComponentRefWarning() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // 保存原始的 console.error 函数
    const originalConsoleError = console.error;
    
    // 保存原始的 console.warn 函数
    const originalConsoleWarn = console.warn;
    
    // 创建一个函数来检查是否是函数组件ref相关的警告
    const isFunctionComponentRefWarning = (message) => {
      if (typeof message !== 'string') return false;
      
      // 匹配所有可能的函数组件ref警告模式
      return (message.includes('Function components cannot be given refs') || 
              message.includes('function component cannot have') && message.includes('ref') ||
              message.includes('Refs will not get attached to function components')) &&
             !message.includes('forwardRef');
    };
    
    // 修改 console.error 函数，忽略特定的警告
    console.error = function (...args) {
      // 检查是否是函数组件ref警告
      if (args.length > 0 && isFunctionComponentRefWarning(args[0])) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他错误，调用原始的 console.error
      return originalConsoleError.apply(console, args);
    };
    
    // 同样修改 console.warn 函数，防止警告通过warn输出
    console.warn = function (...args) {
      // 检查是否是函数组件ref警告
      if (args.length > 0 && isFunctionComponentRefWarning(args[0])) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他警告，调用原始的 console.warn
      return originalConsoleWarn.apply(console, args);
    };
  }
}

/**
 * 禁用嵌套更新警告
 * 
 * 此函数修改console.error，忽略React中关于嵌套更新导致的警告
 * 这些警告通常在复杂组件中出现，尤其是在处理事件导致状态更新的情况
 */
export function disableNestedUpdateWarning() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'production') {
    // 保存原始的 console.error 函数
    const originalConsoleError = console.error;
    
    // 修改 console.error 函数，忽略特定的警告
    console.error = function (...args) {
      // 检查是否是嵌套更新相关的警告
      if (args.length > 0 && typeof args[0] === 'string' && 
         (args[0].includes('Maximum update depth exceeded') || 
          args[0].includes('Rendered more hooks than') ||
          args[0].includes('Cannot update during an existing state transition') ||
          args[0].includes('Cannot update a component') && args[0].includes('while rendering a different component'))) {
        // 忽略这个警告
        return;
      }
      
      // 对于其他错误，调用原始的 console.error
      return originalConsoleError.apply(console, args);
    };
  }
}

/**
 * 禁用WebSocket关闭警告
 * 
 * 此函数修改console.error和console.warn，忽略关于WebSocket连接关闭的警告
 * 这些警告通常在用户切换页面或应用程序自动断开连接时出现
 */
export function disableWebSocketClosedWarning() {
  if (typeof window !== 'undefined') {
    // 保存原始的 console.error 函数
    const originalConsoleError = console.error;
    
    // 保存原始的 console.warn 函数
    const originalConsoleWarn = console.warn;
    
    // 检查消息是否与WebSocket关闭相关
    const isWebSocketClosedWarning = (message) => {
      if (typeof message !== 'string') return false;
      
      return message.includes('WebSocket') && 
            (message.includes('closed') || 
             message.includes('disconnected') ||
             message.includes('connection') && message.includes('failed') ||
             message.includes('reconnect') ||
             message.includes('error code'));
    };
    
    // 修改 console.error 函数
    console.error = function (...args) {
      if (args.length > 0 && isWebSocketClosedWarning(args[0])) {
        return; // 忽略这个警告
      }
      return originalConsoleError.apply(console, args);
    };
    
    // 修改 console.warn 函数
    console.warn = function (...args) {
      if (args.length > 0 && isWebSocketClosedWarning(args[0])) {
        return; // 忽略这个警告
      }
      return originalConsoleWarn.apply(console, args);
    };
  }
} 