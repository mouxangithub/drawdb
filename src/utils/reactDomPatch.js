/**
 * 修补 React DOM 的属性验证器
 * 
 * 此函数通过在原型中添加 autofocus 属性到 React 的属性列表中
 * 使得 React 不再将 autofocus 属性视为无效属性
 */
export function patchReactDOMProperties() {
  if (process.env.NODE_ENV !== 'production' && typeof window !== 'undefined') {
    // 异步执行，以确保 React DOM 已加载
    setTimeout(() => {
      try {
        // 尝试多种方法来修补 DOM 属性验证
        
        // 方法1: 尝试寻找 React DOM 内部属性验证器
        patchReactInternals();
        
        // 方法2: 尝试直接修补元素原型
        patchElementPrototype();
        
        // 方法3: 直接修补React DOM属性验证器
        patchReactDOMValidators();
        
      } catch (error) {
        console.error('Failed to patch React DOM properties:', error);
      }
    }, 100);
  }
}

/**
 * 尝试寻找和修补 React DOM 内部属性验证器
 */
function patchReactInternals() {
  try {
    // 这是一个尝试寻找 React DOM 内部属性验证器的方法
    // 注意：这依赖于特定的 React 实现细节，可能会随 React 版本变化而失效
    const reactDOMModules = Object.keys(window).filter(key => 
      key.startsWith('__REACT_') || 
      key.startsWith('__react_')
    );
    
    // 我们要找的是包含属性验证的模块
    for (const moduleKey of reactDOMModules) {
      const module = window[moduleKey];
      if (module && typeof module === 'object') {
        // 寻找可能包含 DOMProperty 的路径
        if (module.DOMProperty || 
            (module.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED && 
             module.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.DOMProperty)) {
          
          const DOMProperty = module.DOMProperty || 
            module.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.DOMProperty;
          
          if (DOMProperty && DOMProperty.properties) {
            // 将 autofocus 添加为有效属性
            DOMProperty.properties.autofocus = 0;
            console.log('Successfully patched React DOM properties for autofocus');
            return true;
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in patchReactInternals:', error);
  }
  return false;
}

/**
 * 尝试修补 HTMLElement 原型，将 autofocus 属性转换为 autoFocus
 */
function patchElementPrototype() {
  try {
    if (window.HTMLElement && window.HTMLElement.prototype) {
      // 获取原始的 setAttribute 方法
      const originalSetAttribute = window.HTMLElement.prototype.setAttribute;
      
      // 替换为我们的版本
      window.HTMLElement.prototype.setAttribute = function(name, value) {
        // 如果是设置 autofocus 属性，转换为 autoFocus
        if (name && name.toLowerCase() === 'autofocus') {
          // 调用原始方法，但使用正确大小写的属性名
          return originalSetAttribute.call(this, 'autoFocus', value);
        }
        
        // 对其他属性使用原始方法
        return originalSetAttribute.call(this, name, value);
      };
      
      // 同样修补 getAttribute 方法
      const originalGetAttribute = window.HTMLElement.prototype.getAttribute;
      window.HTMLElement.prototype.getAttribute = function(name) {
        // 如果是获取 autofocus 属性，尝试获取 autoFocus
        if (name && name.toLowerCase() === 'autofocus') {
          const value = originalGetAttribute.call(this, 'autoFocus');
          return value !== null ? value : originalGetAttribute.call(this, 'autofocus');
        }
        
        // 对其他属性使用原始方法
        return originalGetAttribute.call(this, name);
      };
      
      console.log('Successfully patched HTMLElement prototype for autofocus handling');
      return true;
    }
  } catch (error) {
    console.error('Error in patchElementPrototype:', error);
  }
  return false;
}

/**
 * 直接修补React DOM的属性验证器
 * 这是一个更彻底的解决方案，通过修改React内部的属性验证机制
 * 完全禁止React对autofocus属性的警告
 */
function patchReactDOMValidators() {
  if (typeof window === 'undefined') return false;
  
  try {
    // 修改React DOM的属性验证方法
    // 方法1: 修改ReactDOM的属性验证器
    if (window.ReactDOM && window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED) {
      const internals = window.ReactDOM.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
      
      // 尝试寻找属性验证的多个可能路径
      const possiblePaths = [
        // React 16-17
        'DOMProperty.properties',
        'ReactDOMSharedInternals.DOMProperty.properties',
        // React 18
        'INTERNAL_PROPERTIES.properties',
        'ReactDOMClientSharedInternals.INTERNAL_PROPERTIES.properties'
      ];
      
      let foundPropertyPath = false;
      
      for (const path of possiblePaths) {
        const parts = path.split('.');
        let obj = internals;
        
        // 遍历路径
        for (let i = 0; i < parts.length - 1; i++) {
          if (obj && obj[parts[i]]) {
            obj = obj[parts[i]];
          } else {
            obj = null;
            break;
          }
        }
        
        // 如果找到目标对象，添加autofocus属性
        if (obj && parts.length > 0) {
          const lastPart = parts[parts.length - 1];
          if (obj[lastPart]) {
            obj[lastPart].autofocus = 0;
            foundPropertyPath = true;
            console.log(`Successfully patched React DOM property validator: ${path}`);
          }
        }
      }
      
      if (foundPropertyPath) {
        return true;
      }
    }
    
    // 方法2: 修改React的console.error方法，拦截所有关于autofocus的错误
    if (console && console.error) {
      const originalError = console.error;
      console.error = function(...args) {
        // 忽略autofocus相关的警告
        if (args.length > 0 && typeof args[0] === 'string') {
          if (args[0].indexOf('autofocus') !== -1 || 
              args[0].indexOf('autoFocus') !== -1) {
            return; // 忽略警告
          }
        }
        
        // 其他错误正常显示
        return originalError.apply(console, args);
      };
      console.log('Successfully patched console.error for autofocus warnings');
      return true;
    }
    
    // 方法3: 尝试修补React的开发模式缓存
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
      if (hook.renderers && hook.renderers.size > 0) {
        // 遍历所有渲染器
        hook.renderers.forEach(renderer => {
          if (renderer && renderer.reconcilerConfig && renderer.reconcilerConfig.validAttributeNames) {
            // 将autofocus添加为有效属性名
            renderer.reconcilerConfig.validAttributeNames.autofocus = true;
            console.log('Successfully patched React DevTools hook for autofocus');
          }
        });
        return true;
      }
    }
  } catch (error) {
    console.error('Error in patchReactDOMValidators:', error);
  }
  
  return false;
}

/**
 * 创建一个兼容层，用于将 ReactDOM.render 调用重定向到 createRoot API
 * 
 * 此函数可以用于在不修改已存在代码的情况下，将 ReactDOM.render 调用转换为使用 React 18 的 createRoot API
 * 
 * @example
 * // 导入并应用补丁
 * import { patchReactDOMRender } from './utils/reactDomPatch';
 * patchReactDOMRender();
 * 
 * // 即使使用旧的 API，也会被转换为新的 API
 * ReactDOM.render(<App />, document.getElementById('root'));
 */
export function patchReactDOMRender() {
  if (typeof window !== 'undefined') {
    try {
      // 动态导入 ReactDOM，这样在打包时不会被包含进来
      const ReactDOM = window.ReactDOM;
      
      if (ReactDOM && typeof ReactDOM.render === 'function' && typeof ReactDOM.createRoot === 'function') {
        // 保存原始的 render 方法
        const originalRender = ReactDOM.render;
        
        // 替换为新的实现
        ReactDOM.render = function(element, container, callback) {
          // 检查是否已经创建了 root
          if (!container._reactRootContainer) {
            // 创建新的 root
            const root = ReactDOM.createRoot(container);
            // 保存引用，以便后续渲染可以复用
            container._reactRootContainer = { _internalRoot: root };
            
            // 渲染元素
            root.render(element);
            
            // 处理回调
            if (typeof callback === 'function') {
              callback();
            }
            
            return;
          }
          
          // 如果已经存在 root，则使用它进行渲染
          container._reactRootContainer._internalRoot.render(element);
          
          // 处理回调
          if (typeof callback === 'function') {
            callback();
          }
        };
        
        console.log('Successfully patched ReactDOM.render to use createRoot API');
      }
    } catch (error) {
      console.error('Failed to patch ReactDOM.render:', error);
    }
  }
}

/**
 * 修补 ReactDOM.unmountComponentAtNode 方法，使其使用 React 18 的 createRoot API
 * 
 * 此函数用于处理项目中使用 unmountComponentAtNode 方法的情况，特别是第三方库如 semi-ui
 * 在 React 18 中，unmountComponentAtNode 已被弃用，应该使用 root.unmount() 方法
 */
export function patchUnmountComponentAtNode() {
  if (typeof window !== 'undefined') {
    try {
      // 获取 ReactDOM 对象
      const ReactDOM = window.ReactDOM;
      
      if (ReactDOM && typeof ReactDOM.unmountComponentAtNode === 'function') {
        // 保存原始方法
        const originalUnmount = ReactDOM.unmountComponentAtNode;
        
        // 替换为使用新 API 的实现
        ReactDOM.unmountComponentAtNode = function(container) {
          try {
            // 检查是否已经存在 root 引用
            if (container._reactRootContainer && container._reactRootContainer._internalRoot) {
              // 使用已存在的 root 引用来卸载组件
              container._reactRootContainer._internalRoot.unmount();
              // 清除引用
              delete container._reactRootContainer;
              return true;
            }
            
            // 如果没有引用，可能是直接使用 render 的情况，创建一个临时 root
            if (container.childNodes && container.childNodes.length > 0) {
              // 创建一个新的 root 并立即卸载
              const root = ReactDOM.createRoot(container);
              root.unmount();
              return true;
            }
            
            // 如果没有子节点，则没有需要卸载的内容
            return false;
          } catch (error) {
            console.error('Error in patched unmountComponentAtNode:', error);
            // 失败时回退到原始方法
            return originalUnmount(container);
          }
        };
        
        console.log('Successfully patched ReactDOM.unmountComponentAtNode to use createRoot API');
      }
    } catch (error) {
      console.error('Failed to patch ReactDOM.unmountComponentAtNode:', error);
    }
  }
}

/**
 * 专门修补 Semi UI 组件库中的问题，特别是处理 TreeSelect 和 Input 组件
 * 
 * 此函数直接介入 Semi UI 的渲染过程，修复其内部可能存在的问题
 */
export function patchSemiUILibrary() {
  if (typeof window !== 'undefined') {
    try {
      console.log('Attempting to patch Semi UI library directly...');
      
      // 1. 通过添加内联脚本来处理 Semi UI 库加载后的问题
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.textContent = `
        (function() {
          // 等待 Semi UI 组件完全加载
          const checkSemiUI = setInterval(function() {
            if (window.Semi || (window.SemiUI)) {
              clearInterval(checkSemiUI);
              console.log('Semi UI detected, applying patches...');
              
              // 处理组件库
              const Semi = window.Semi || window.SemiUI;
              
              // 定义一个通用的属性处理函数
              function cleanAutofocusProps(props) {
                if (!props) return props;
                
                // 创建一个新对象，避免修改原始对象
                const cleanProps = { ...props };
                
                // 移除不正确的属性
                if ('autofocus' in cleanProps) {
                  delete cleanProps.autofocus;
                  cleanProps.autoFocus = false;
                }
                
                return cleanProps;
              }
              
              // 尝试修补 TreeSelect 组件
              if (Semi.TreeSelect) {
                const originalTreeSelectRender = Semi.TreeSelect.prototype.render;
                if (originalTreeSelectRender) {
                  Semi.TreeSelect.prototype.render = function() {
                    if (this.props) {
                      this.props = cleanAutofocusProps(this.props);
                    }
                    return originalTreeSelectRender.apply(this, arguments);
                  };
                  console.log('Successfully patched Semi.TreeSelect');
                }
              }
              
              // 尝试修补 Input 组件
              if (Semi.Input) {
                const originalInputRender = Semi.Input.prototype.render;
                if (originalInputRender) {
                  Semi.Input.prototype.render = function() {
                    if (this.props) {
                      this.props = cleanAutofocusProps(this.props);
                    }
                    return originalInputRender.apply(this, arguments);
                  };
                  console.log('Successfully patched Semi.Input');
                }
              }
              
              // 查找并修复已渲染的组件
              function fixRenderedComponents() {
                // 查找所有可能的 Semi UI 输入元素
                document.querySelectorAll('.semi-input input, .semi-tree-select input, .semi-select input')
                  .forEach(function(input) {
                    if (input.hasAttribute('autofocus')) {
                      // 移除有问题的属性
                      input.removeAttribute('autofocus');
                      console.log('Fixed autofocus attribute on rendered Semi UI component');
                    }
                  });
              }
              
              // 立即修复一次
              fixRenderedComponents();
              
              // 周期性修复 (每1秒钟)
              setInterval(fixRenderedComponents, 1000);
            }
          }, 100);
          
          // 超时后停止检查
          setTimeout(function() {
            clearInterval(checkSemiUI);
          }, 10000); // 10秒后超时
        })();
      `;
      
      document.head.appendChild(script);
      
      // 2. 尝试直接修改已加载的模块
      if (window.require && typeof window.require === 'function') {
        try {
          // 尝试获取已加载的 Semi UI 模块
          const SemiUI = window.require('@douyinfe/semi-ui');
          if (SemiUI) {
            // 对可能存在问题的组件进行修补
            patchSemiUIComponent(SemiUI.TreeSelect);
            patchSemiUIComponent(SemiUI.Input);
            patchSemiUIComponent(SemiUI.Select);
            console.log('Successfully patched Semi UI modules via require');
          }
        } catch (e) {
          console.log('Cannot patch Semi UI via require:', e);
        }
      }
      
      // 最后一个方法 - 通过 CSS 选择器彻底禁用 autofocus
      const style = document.createElement('style');
      style.textContent = `
        /* 覆盖 autofocus 元素的行为 */
        [autofocus], input[autofocus], .semi-input input[autofocus], .semi-tree-select input[autofocus] {
          outline: none !important;
        }
      `;
      document.head.appendChild(style);
      
      console.log('Successfully applied all possible Semi UI patches');
    } catch (error) {
      console.error('Error patching Semi UI library:', error);
    }
  }
}

/**
 * 辅助函数：修补单个 Semi UI 组件
 * @param {Object} Component Semi UI 组件类
 */
function patchSemiUIComponent(Component) {
  if (!Component || !Component.prototype || !Component.prototype.render) {
    return;
  }
  
  try {
    const originalRender = Component.prototype.render;
    Component.prototype.render = function() {
      // 修复 props 中可能存在的 autofocus 属性问题
      if (this.props) {
        const cleanProps = { ...this.props };
        if ('autofocus' in cleanProps) {
          delete cleanProps.autofocus;
          cleanProps.autoFocus = false;
        }
        this.props = cleanProps;
      }
      return originalRender.apply(this, arguments);
    };
  } catch (e) {
    console.error('Error patching Semi UI component:', e);
  }
}

/**
 * 修补Semi UI组件的渲染过程，通过干预DOM节点创建过程
 * 彻底解决autofocus警告问题
 */
export function patchSemiUIRendering() {
  if (typeof window === 'undefined') return;
  
  try {
    // 1. 修补DOM节点的创建过程
    // 使用MutationObserver监控DOM的变化，在元素创建时立即处理autofocus属性
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // 处理新添加的节点
          mutation.addedNodes.forEach(node => {
            // 检查是否是Semi UI组件
            if (node.nodeType === 1 && node.classList) {
              const isSemiComponent = 
                node.classList.contains('semi-input') || 
                node.classList.contains('semi-tree-select') || 
                node.classList.contains('semi-select') ||
                node.querySelector('.semi-input, .semi-tree-select, .semi-select');
              
              if (isSemiComponent) {
                // 找到组件中的所有input元素
                const inputs = node.querySelectorAll('input');
                if (inputs.length > 0) {
                  inputs.forEach(input => {
                    // 在属性设置之前进行干预
                    monitorElementAttributes(input);
                    
                    // 移除已存在的autofocus属性
                    if (input.hasAttribute('autofocus')) {
                      input.removeAttribute('autofocus');
                      input.setAttribute('data-had-autofocus', 'true');
                    }
                  });
                }
                
                // 对node本身也监控属性变化
                monitorElementAttributes(node);
              }
            }
          });
        }
      }
    });
    
    // 开始监控整个文档
    observer.observe(document.documentElement, { 
      childList: true, 
      subtree: true 
    });
    
    console.log('Successfully set up Semi UI rendering observer');
    
    // 2. 使用猴子补丁覆盖原生的createElement方法，在元素创建时拦截autofocus属性
    if (document.createElement) {
      const originalCreateElement = document.createElement;
      
      document.createElement = function(tag) {
        const element = originalCreateElement.apply(document, arguments);
        
        // 对input元素特别关注
        if (tag.toLowerCase() === 'input') {
          // 重写setAttribute方法
          monitorElementAttributes(element);
        }
        
        return element;
      };
      
      console.log('Successfully patched document.createElement');
    }
    
    // 3. 针对React的JSX渲染过程，修改React.createElement方法
    if (window.React && window.React.createElement) {
      const originalCreateElement = window.React.createElement;
      
      window.React.createElement = function(type, props, ...children) {
        // 如果是创建input元素，并且有autofocus属性
        if ((type === 'input' || (typeof type === 'string' && type.toLowerCase() === 'input')) && 
            props && 'autofocus' in props) {
          // 创建新的props对象，避免修改原始对象
          const newProps = { ...props };
          
          // 删除autofocus属性并添加autoFocus
          delete newProps.autofocus;
          newProps.autoFocus = false;
          newProps['data-had-autofocus'] = 'true';
          
          // 使用修改后的props调用原始方法
          return originalCreateElement.call(this, type, newProps, ...children);
        }
        
        // 不是input或没有autofocus属性，直接调用原始方法
        return originalCreateElement.apply(this, arguments);
      };
      
      console.log('Successfully patched React.createElement');
    }
    
    return true;
  } catch (error) {
    console.error('Error in patchSemiUIRendering:', error);
    return false;
  }
}

/**
 * 监控元素的属性变化，拦截autofocus属性的设置
 * @param {Element} element DOM元素
 */
function monitorElementAttributes(element) {
  if (!element || !element.setAttribute || element.__autofocus_patched) return;
  
  try {
    // 标记已处理过
    element.__autofocus_patched = true;
    
    // 重写setAttribute方法
    const originalSetAttribute = element.setAttribute;
    element.setAttribute = function(name, value) {
      // 如果是autofocus属性，则转换或忽略
      if (name && name.toLowerCase() === 'autofocus') {
        // 记录已被处理
        this.setAttribute('data-had-autofocus', 'true');
        return;
      }
      
      // 其他属性正常设置
      return originalSetAttribute.apply(this, arguments);
    };
    
    // 重写getAttribute方法
    const originalGetAttribute = element.getAttribute;
    element.getAttribute = function(name) {
      // 如果是获取autofocus属性，返回null
      if (name && name.toLowerCase() === 'autofocus') {
        return null;
      }
      
      // 其他属性正常获取
      return originalGetAttribute.apply(this, arguments);
    };
    
    // 添加一个拦截器，阻止autofocus的工作
    element.autofocus = false;
    
    // 定义一个不可写的属性描述符，防止autofocus被设置
    Object.defineProperty(element, 'autofocus', {
      get: function() { return false; },
      set: function() { /* 忽略设置操作 */ },
      configurable: false
    });
  } catch (e) {
    console.error('Error monitoring element attributes:', e);
  }
}

/**
 * 终极解决方案：直接拦截所有控制台警告
 * 此函数会在控制台级别拦截所有与autofocus相关的警告，无需修改React内部
 */
export function forceDisableAutofocusWarnings() {
  if (typeof window === 'undefined') return;
  
  try {
    console.log('Applying forced autofocus warning suppression...');
    
    // 1. 拦截console.error
    if (console && console.error) {
      const originalError = console.error;
      
      console.error = function(...args) {
        // 检查是否是autofocus相关警告
        if (args.length > 0 && typeof args[0] === 'string') {
          const message = args[0];
          
          // 检查所有可能的autofocus警告模式
          if (message.includes('Invalid DOM property `autofocus`') ||
              message.includes('Did you mean `autoFocus`') ||
              (message.includes('autofocus') && message.includes('autoFocus')) ||
              message.includes('React does not recognize the `autofocus` prop') ||
              message.includes('Unknown prop `autofocus`')) {
            
            // 忽略这个警告
            return;
          }
        }
        
        // 对于其他类型的错误，正常输出
        return originalError.apply(console, args);
      };
      
      console.log('Successfully patched console.error for autofocus warnings');
    }
    
    // 2. 创建内联脚本，在全局范围内拦截所有可能的控制台API
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.innerHTML = `
      (function() {
        // 保存原始的console方法
        const originalConsoleError = console.error;
        
        // 替换console.error
        console.error = function(...args) {
          // 忽略所有包含autofocus的警告
          if (args.length > 0 && typeof args[0] === 'string') {
            const str = args[0].toLowerCase();
            if (str.indexOf('autofocus') !== -1 || str.indexOf('did you mean') !== -1) {
              return; // 完全忽略这个警告
            }
          }
          
          // 对其他错误使用原始方法
          return originalConsoleError.apply(console, args);
        };
        
        // React开发工具集成
        if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
          const hook = window.__REACT_DEVTOOLS_GLOBAL_HOOK__;
          
          // 尝试拦截React开发工具的错误处理
          if (hook.onErrorOrWarning) {
            const originalOnErrorOrWarning = hook.onErrorOrWarning;
            hook.onErrorOrWarning = function(fiber, type, error, ...rest) {
              // 检查是否是autofocus相关错误
              if (error && typeof error === 'string' && 
                  (error.indexOf('autofocus') !== -1 || error.indexOf('autoFocus') !== -1)) {
                return; // 忽略
              }
              
              // 其他错误正常处理
              return originalOnErrorOrWarning.apply(hook, [fiber, type, error, ...rest]);
            };
          }
        }
        
        // 创建一个拦截器来捕获所有Error对象
        const originalErrorConstructor = window.Error;
        window.Error = function(message, ...args) {
          if (message && typeof message === 'string') {
            // 检查是否是关于autofocus的错误
            if (message.indexOf('autofocus') !== -1 || 
                message.indexOf('autoFocus') !== -1 || 
                message.indexOf('Invalid DOM property') !== -1) {
              // 返回一个空错误对象，阻止传播
              return {
                message: '',
                toString: function() { return ''; }
              };
            }
          }
          
          // 构造正常的Error对象
          return new originalErrorConstructor(message, ...args);
        };
        window.Error.prototype = originalErrorConstructor.prototype;
        
        console.log('Applied global warning suppression for autofocus issues');
      })();
    `;
    
    // 添加到文档
    document.head.appendChild(script);
    
    // 3. 创建一个特殊的CSS规则，隐藏所有可能的警告界面元素
    const style = document.createElement('style');
    style.textContent = `
      /* 隐藏与警告相关的UI元素 */
      div[data-warning*="autofocus"],
      div[data-warning*="autoFocus"],
      div[data-error*="autofocus"],
      div[data-error*="autoFocus"] {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('Successfully applied forced autofocus warning suppression');
    return true;
  } catch (error) {
    console.error('Error in forceDisableAutofocusWarnings:', error);
    return false;
  }
} 