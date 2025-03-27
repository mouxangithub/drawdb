import { createContext, useContext, useState } from 'react';

/**
 * 只读模式上下文
 * 用于控制画布是否处于只读模式，在预览模式下只允许拖动和缩放查看，不允许编辑和删除
 */
const ReadOnlyContext = createContext({
  readOnly: false,
  setReadOnly: () => {},
});

/**
 * 只读模式上下文提供者
 * @param {Object} props - 组件属性
 * @param {boolean} props.initialReadOnly - 初始只读状态
 * @param {React.ReactNode} props.children - 子组件
 */
export function ReadOnlyContextProvider({ initialReadOnly = false, children }) {
  const [readOnly, setReadOnly] = useState(initialReadOnly);

  return (
    <ReadOnlyContext.Provider value={{ readOnly, setReadOnly }}>
      {children}
    </ReadOnlyContext.Provider>
  );
}

/**
 * 使用只读模式上下文的钩子
 * @returns {Object} 包含只读状态和设置只读状态的函数的对象
 */
export function useReadOnly() {
  return useContext(ReadOnlyContext);
}

export default ReadOnlyContext; 