import { createContext, useState } from "react";

export const JsonEditorContext = createContext(null);

export default function JsonEditorContextProvider({ children }) {
  // 初始化JSON编辑器的状态
  const [jsonData, setJsonData] = useState({
    tables: {},
    relationships: {},
    areas: {},
    notes: {}
  });

  // 是否显示JSON编辑器
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  // 编辑器位置（左侧或右侧）
  const [editorPosition, setEditorPosition] = useState("right");

  // 更新特定类型的数据
  const updateJsonData = (type, data) => {
    setJsonData(prev => ({
      ...prev,
      [type]: data
    }));
  };

  return (
    <JsonEditorContext.Provider 
      value={{ 
        jsonData, 
        setJsonData, 
        updateJsonData,
        showJsonEditor, 
        setShowJsonEditor,
        editorPosition,
        setEditorPosition
      }}
    >
      {children}
    </JsonEditorContext.Provider>
  );
} 