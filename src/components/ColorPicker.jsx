import { Button } from "@douyinfe/semi-ui";
import { IconCheckboxTick } from "@douyinfe/semi-icons";
import { tableThemes } from "../data/constants";
import { useTranslation } from "react-i18next";

/**
 * 颜色选择器组件
 * 提供一系列预设颜色供用户选择
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.currentColor - 当前选中的颜色
 * @param {Function} props.onClearColor - 清除颜色的回调函数
 * @param {Function} props.onPickColor - 选择颜色的回调函数
 */
export default function ColorPicker({
  currentColor,
  onClearColor,
  onPickColor,
}) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="flex justify-between items-center p-2">
        <div className="font-medium">{t("theme")}</div>
        <Button type="tertiary" size="small" onClick={onClearColor}>
          {t("clear")}
        </Button>
      </div>
      <hr />
      <div className="py-3 space-y-3">
        <div className="flex flex-wrap w-72 gap-y-2">
          {tableThemes.map((c) => (
            <button
              key={c}
              style={{ backgroundColor: c }}
              className="w-10 h-10 rounded-full mx-1"
              onClick={() => onPickColor(c)}
            >
              <IconCheckboxTick
                className="pt-1"
                style={{
                  color: currentColor === c ? "white" : c,
                }}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
