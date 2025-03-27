import React from 'react';
import { useTranslation } from 'react-i18next';
import FadeIn from '../animations/FadeIn';

/**
 * 特性展示组件
 * 用于显示产品主要特性的卡片网格
 * @param {Object} props - 组件属性
 * @param {Array} props.features - 特性列表
 * @returns {JSX.Element}
 */
export default function Features({ features = [] }) {
  const { t } = useTranslation();
  
  // 如果没有提供特性列表，使用默认特性
  const featuresList = features.length > 0 ? features : [
    {
      title: t('导出'),
      content: t('将图表导出为SQL脚本，JSON或图像'),
      footer: ''
    },
    {
      title: t('反向工程'),
      content: t('从现有SQL脚本导入并生成图表'),
      footer: ''
    },
    {
      title: t('自定义工作区'),
      content: t('根据个人喜好自定义界面和组件'),
      footer: ''
    },
    {
      title: t('键盘快捷键'),
      content: t('使用快捷键加速开发和设计流程'),
      footer: ''
    }
  ];
  
  return (
    <div className="py-8 px-6 md:px-8" id="features">
      <FadeIn duration={1}>
        <div className="text-base font-medium text-center text-sky-900">
          {t('不止是编辑器')}
        </div>
        <div className="text-2xl mt-1 font-medium text-center">
          {t('drawDB提供的功能')}
        </div>
        <div className="grid grid-cols-3 gap-8 mt-10 md:grid-cols-2 sm:grid-cols-1">
          {featuresList.map((feature, index) => (
            <div
              key={`feature-${index}`}
              className="flex rounded-xl hover:bg-zinc-100 border border-zinc-100 shadow-xs hover:-translate-y-2 transition-all duration-300"
            >
              <div className="bg-sky-700 px-0.5 rounded-l-xl" />
              <div className="px-8 py-4">
                <div className="text-lg font-semibold mb-3">{feature.title}</div>
                <div>{feature.content}</div>
                {feature.footer && (
                  <div className="mt-2 text-xs opacity-60">{feature.footer}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </FadeIn>
    </div>
  );
} 