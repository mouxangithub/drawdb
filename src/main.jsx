import ReactDOM from "react-dom/client";
import { LocaleProvider } from "@douyinfe/semi-ui";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import App from "./App.jsx";
import en_US from "@douyinfe/semi-ui/lib/es/locale/source/en_US";
import "./index.css";
import "./i18n/i18n.js";
import { disableReactAutofocusWarning, disableFindDOMNodeWarning, fixAutofocusInDOM, disableReactDomRenderWarning, patchSemiUIComponents, disableFindDOMNodeDeprecatedWarning } from "./utils/reactWarningFix";
import { patchReactDOMProperties, patchReactDOMRender, patchUnmountComponentAtNode, patchSemiUILibrary, patchSemiUIRendering, forceDisableAutofocusWarnings } from "./utils/reactDomPatch";

// 应用修复，禁用 autofocus 警告
disableReactAutofocusWarning();
// 禁用 findDOMNode 废弃警告和React Router未来标志警告
disableFindDOMNodeWarning();
// 禁用 findDOMNode 废弃警告(控制台错误版本)
disableFindDOMNodeDeprecatedWarning();
// 禁用 ReactDOM.render 废弃警告
disableReactDomRenderWarning();
// 尝试修补 React DOM 属性验证
patchReactDOMProperties();
// 修补 ReactDOM.render 方法，使其使用 createRoot API
patchReactDOMRender();
// 修补 ReactDOM.unmountComponentAtNode 方法，使其使用 createRoot API
patchUnmountComponentAtNode();
// 特别处理 Semi UI 组件的 autofocus 问题
patchSemiUIComponents();
// 直接修补 Semi UI 库的内部实现
patchSemiUILibrary();
// 新增：修补 Semi UI 组件的渲染过程，从源头解决问题
patchSemiUIRendering();
// 额外的 DOM 修复，确保移除所有 autofocus 属性
fixAutofocusInDOM();
// 终极解决方案：强制禁用所有autofocus相关警告
forceDisableAutofocusWarnings();

// 检查是否是生产环境
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <LocaleProvider locale={en_US}>
    <App />
    {isProduction && <Analytics debug={false} mode="production" />}
    {isProduction && <SpeedInsights />}
  </LocaleProvider>,
);
