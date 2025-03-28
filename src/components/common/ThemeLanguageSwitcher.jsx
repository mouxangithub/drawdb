import React, { useState, useCallback, useEffect } from 'react';
import { Button, Tooltip, Modal } from '@douyinfe/semi-ui';
import { IconLanguage, IconMoon, IconSun } from '@douyinfe/semi-icons';
import { useTranslation } from 'react-i18next';
import { languages } from '../../i18n/i18n';

/**
 * 主题和语言切换组件
 * 提供主题切换和语言切换功能，可以在不同页面复用
 * @returns {JSX.Element}
 */
export default function ThemeLanguageSwitcher() {
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const { t, i18n } = useTranslation();

  // 初始化主题
  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDarkMode(true);
      document.body.setAttribute('theme-mode', 'dark');
    } else {
      setIsDarkMode(false);
      document.body.setAttribute('theme-mode', 'light');
    }
  }, []);

  // 切换主题模式
  const toggleTheme = useCallback(() => {
    const body = document.body;
    if (isDarkMode) {
      // 切换到亮色模式
      body.setAttribute('theme-mode', 'light');
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
    } else {
      // 切换到暗色模式
      body.setAttribute('theme-mode', 'dark');
      localStorage.setItem('theme', 'dark');
      setIsDarkMode(true);
    }
  }, [isDarkMode]);

  return (
    <>
      <div className="fixed top-4 right-6 flex gap-2 z-10">
        <Tooltip content={t('change_language')}>
          <Button
            theme="borderless"
            icon={<IconLanguage size="large" />}
            onClick={() => setLanguageModalVisible(true)}
            aria-label={t('change_language')}
          />
        </Tooltip>
        <Tooltip content={isDarkMode ? t('light_mode') : t('dark_mode')}>
          <Button
            theme="borderless"
            icon={isDarkMode ? <IconSun size="large" /> : <IconMoon size="large" />}
            onClick={toggleTheme}
            aria-label={isDarkMode ? t('light_mode') : t('dark_mode')}
          />
        </Tooltip>
      </div>

      {/* 语言切换模态框 */}
      <Modal
        title={t('language')}
        visible={languageModalVisible}
        onCancel={() => setLanguageModalVisible(false)}
        footer={null}
        width={600}
      >
        <div className="grid grid-cols-4 md:grid-cols-2 gap-4" style={{ maxHeight: '400px', overflowY: 'auto', padding: '4px' }}>
          {languages.map((l) => (
            <button
              key={l.code}
              onClick={() => {
                i18n.changeLanguage(l.code);
                setLanguageModalVisible(false);
              }}
              className={`space-y-1 py-3 px-4 rounded-md border-2 ${
                isDarkMode
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-100 hover:bg-zinc-200"
              } ${i18n.language === l.code ? "border-zinc-400" : "border-transparent"}`}
            >
              <div className="flex justify-between items-center">
                <div className="font-semibold">{l.native_name}</div>
                <div className="opacity-60">{l.code}</div>
              </div>
              <div className="text-start">{l.name}</div>
            </button>
          ))}
        </div>
      </Modal>
    </>
  );
}