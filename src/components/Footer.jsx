import React from 'react';
import { useTranslation } from 'react-i18next';
import { socials } from '../data/socials';

/**
 * 页脚组件
 * 显示版权信息和社交媒体链接
 * @returns {JSX.Element}
 */
export default function Footer() {
  const { t } = useTranslation();
  
  return (
    <footer className="bg-zinc-100 py-6">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-zinc-600">
              &copy; {new Date().getFullYear()} <strong>drawDB</strong> - {t('版权所有')}
            </p>
          </div>
          
          <div className="flex space-x-4">
            <a
              href={socials.github}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-600 hover:text-zinc-900 transition-colors"
              title="GitHub"
            >
              <i className="bi bi-github text-xl"></i>
            </a>
            <a
              href={socials.discord}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-600 hover:text-zinc-900 transition-colors"
              title="Discord"
            >
              <i className="bi bi-discord text-xl"></i>
            </a>
            <a
              href={socials.twitter}
              target="_blank"
              rel="noreferrer"
              className="text-zinc-600 hover:text-zinc-900 transition-colors"
              title="Twitter"
            >
              <i className="bi bi-twitter-x text-xl"></i>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 