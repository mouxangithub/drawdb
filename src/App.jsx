import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect, useEffect, useState } from "react";
import { LocaleProvider } from '@douyinfe/semi-ui';
import zh_CN from '@douyinfe/semi-ui/lib/es/locale/source/zh_CN';
import en_US from '@douyinfe/semi-ui/lib/es/locale/source/en_US';
import { useTranslation } from "react-i18next";
import Editor from "./pages/Editor";
import DiagramList from "./pages/DiagramList";
import SettingsContextProvider from "./context/SettingsContext";
import { useSettings } from "./hooks";
import NotFound from "./pages/NotFound";
import { useFixAutofocusIssue } from "./utils/fixAutofocusIssue";

// 返回当前语言对应的 Semi UI 本地化配置
const getLocale = (i18nLang) => {
  switch (i18nLang) {
    case 'zh':
      return zh_CN;
    case 'en':
    default:
      return en_US;
  }
};

export default function App() {
  const { i18n } = useTranslation();
  const [locale, setLocale] = useState(getLocale(i18n.language));

  // 监听语言变化，更新 Semi UI 本地化配置
  useEffect(() => {
    const updateLocale = () => {
      setLocale(getLocale(i18n.language));
    };

    // 初始设置
    updateLocale();

    // 监听语言变化
    i18n.on('languageChanged', updateLocale);

    // 清理函数
    return () => {
      i18n.off('languageChanged', updateLocale);
    };
  }, [i18n]);

  return (
    <LocaleProvider locale={locale}>
      <SettingsContextProvider>
        <BrowserRouter>
          <RestoreScroll />
          <Routes>
            <Route
              path="/"
              element={
                <ThemedPage>
                  <DiagramList />
                </ThemedPage>
              }
            />
            <Route
              path="/editor"
              element={
                <ThemedPage>
                  <Editor />
                </ThemedPage>
              }
            />
            <Route
              path="/editor/:id"
              element={
                <ThemedPage>
                  <Editor />
                </ThemedPage>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </SettingsContextProvider>
    </LocaleProvider>
  );
}

function ThemedPage({ children }) {
  const { setSettings } = useSettings();
  useFixAutofocusIssue();

  useLayoutEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setSettings((prev) => ({ ...prev, mode: "dark" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "dark");
      }
    } else {
      setSettings((prev) => ({ ...prev, mode: "light" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "light");
      }
    }
  }, [setSettings]);

  return children;
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
