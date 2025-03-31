import { useSettings } from "../../../hooks";
import DiagramThumbnail from "../../common/DiagramThumbnail";
import { useTranslation } from "react-i18next";

export default function New({ selectedTemplateId, setSelectedTemplateId }) {
  const { settings } = useSettings();
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-3 gap-2 overflow-auto px-1">
      <div onClick={() => setSelectedTemplateId(0)}>
        <div
          className={`rounded-md h-[180px] border-2 hover:border-dashed ${
            selectedTemplateId === 0 ? "border-blue-400" : "border-zinc-400"
          }`}
        >
          <DiagramThumbnail i={0} diagram={{}} zoom={0.24} theme={settings.mode} />
        </div>
        <div className="text-center mt-1">{t("blank")}</div>
      </div>
    </div>
  );
}
