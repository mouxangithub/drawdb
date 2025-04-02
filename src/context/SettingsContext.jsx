import { createContext, useEffect, useState } from "react";
import { tableWidth } from "../data/constants";

// 获取主题
const getTheme = () => {
  const theme = localStorage.getItem('theme');
  if (theme === 'dark') {
    document.body.setAttribute('theme-mode', 'dark');
    return 'dark';
  } else {
    document.body.setAttribute('theme-mode', 'light');
    return 'light';
  }
};

const defaultSettings = {
  strictMode: false,
  showFieldSummary: true,
  showGrid: true,
  showDataTypes: true,
  mode: getTheme(), // 使用localStorage中的theme作为默认值
  autosave: true,
  panning: true,
  showCardinality: true,
  showRelationshipLabels: true,
  tableWidth: tableWidth,
  showDebugCoordinates: false,
};

export const SettingsContext = createContext(defaultSettings);

export default function SettingsContextProvider({ children }) {
  const [settings, setSettings] = useState(defaultSettings);

  // 监听主题变化
  useEffect(() => {
    const handleThemeChange = () => {
      const theme = localStorage.getItem('theme');
      if (theme) {
        setSettings(prev => ({
          ...prev,
          mode: theme
        }));
      }
    };

    // 监听storage事件
    window.addEventListener('storage', handleThemeChange);
    return () => window.removeEventListener('storage', handleThemeChange);
  }, []);

  // 从localStorage加载设置
  useEffect(() => {
    const savedSettings = localStorage.getItem("settings");
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      setSettings(prev => ({
        ...prev,
        ...parsedSettings
      }));
    }
  }, []);

  // 保存设置到localStorage
  useEffect(() => {
    localStorage.setItem("settings", JSON.stringify(settings));
  }, [settings]);

  return (
    <SettingsContext.Provider value={{ settings, setSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}
