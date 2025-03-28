import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import App from "./App.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";

// 导入必要的警告修复工具 - 精简为主要必要的几个
import { 
  disableReactAutofocusWarning,  // 禁用autofocus警告
  disableFindDOMNodeWarning,     // 禁用findDOMNode警告
  fixAutofocusInDOM              // 修复DOM中的autofocus
} from "./utils/reactWarningFix";

// 导入React DOM补丁工具 - 精简为主要必要的几个
import { 
  patchReactDOMProperties,       // 修补React DOM属性
  forceDisableAutofocusWarnings  // 强制禁用autofocus警告
} from "./utils/reactDomPatch";

// 检查是否是生产环境
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

// 仅在生产环境中导入分析组件
let Analytics, SpeedInsights;
if (isProduction) {
  import('@vercel/analytics/react').then(module => {
    Analytics = module.Analytics;
  });
  import('@vercel/speed-insights/react').then(module => {
    SpeedInsights = module.SpeedInsights;
  });
}

// 应用核心修复
disableReactAutofocusWarning(); // 禁用 autofocus 警告
disableFindDOMNodeWarning();    // 禁用 findDOMNode 警告
patchReactDOMProperties();      // 修补 React DOM 属性验证
fixAutofocusInDOM();            // 修复 DOM 中的 autofocus 属性
forceDisableAutofocusWarnings(); // 终极解决方案：强制禁用所有警告

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <App />
    {isProduction && Analytics && <Analytics debug={false} mode="production" />}
    {isProduction && SpeedInsights && <SpeedInsights />}
  </LocaleProvider>,
);
