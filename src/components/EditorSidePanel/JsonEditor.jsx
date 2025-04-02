import { Tab } from "../../data/constants";
import { useState, useEffect, useMemo } from "react";
import { useJsonEditor, useSelect, useDiagram, useAreas, useNotes, useTypes, useEnums } from "../../hooks";
import { useTranslation } from "react-i18next";
import { json } from "@codemirror/lang-json";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { githubLight } from "@uiw/codemirror-theme-github";
import CodeMirror from "@uiw/react-codemirror";
import { useSettings } from "../../hooks";
import { databases } from "../../data/databases";
import TabsContainer from "../common/TabsContainer";
import { isRtl } from "../../i18n/utils/rtl";
import i18n from "../../i18n/i18n";

/**
 * JSON编辑器组件
 * 提供实时编辑表、关系、主题区域和注释的功能
 * 
 * @param {Object} props 组件属性
 * @param {number} props.width 编辑器宽度
 * @param {boolean} props.resize 是否正在调整大小
 * @param {Function} props.setResize 设置调整大小状态的函数
 * @returns {JSX.Element} JSON编辑器组件
 */
export default function JsonEditor({ width, resize, setResize }) {
    const { t } = useTranslation();
    const { settings } = useSettings();
    const { selectedElement, setSelectedElement } = useSelect();
    const { tables, relationships, database, tablesCount, relationshipsCount } = useDiagram();
    const { areasCount, areas } = useAreas();
    const { notesCount, notes } = useNotes();
    const { typesCount, types } = useTypes();
    const { enumsCount, enums } = useEnums();
    const [tablesJson, setTablesJson] = useState("");
    const [relationshipsJson, setRelationshipsJson] = useState("");
    const [areasJson, setAreasJson] = useState("");
    const [notesJson, setNotesJson] = useState("");
    const [typesJson, setTypesJson] = useState("");
    const [enumsJson, setEnumsJson] = useState("");
    const { editorPosition } = useJsonEditor();

    // 添加自己的宽度控制状态
    const [editorWidth, setEditorWidth] = useState(width || 360);
    // 添加自己的调整状态
    const [isResizing, setIsResizing] = useState(false);

    // 处理拖动调整大小
    const handleEditorResize = (e) => {
        if (!isResizing) return;

        const currentX = e.clientX;
        const windowWidth = window.innerWidth;

        let newWidth;
        // 根据编辑器位置和RTL设置计算宽度
        if (editorPosition === "right") {
            // 编辑器在右侧，拖动条在左侧
            newWidth = isRtl(i18n.language) ? currentX : windowWidth - currentX;
        } else {
            // 编辑器在左侧，拖动条在右侧
            newWidth = isRtl(i18n.language) ? windowWidth - currentX : currentX;
        }

        // 确保最小宽度
        if (newWidth > 300) {
            setEditorWidth(newWidth);
        }
    };

    // 添加指针事件监听器
    useEffect(() => {
        if (isResizing) {
            document.addEventListener('pointermove', handleEditorResize);
            document.addEventListener('pointerup', () => setIsResizing(false));
            document.addEventListener('pointerleave', () => setIsResizing(false));
        }

        return () => {
            document.removeEventListener('pointermove', handleEditorResize);
            document.removeEventListener('pointerup', () => setIsResizing(false));
            document.removeEventListener('pointerleave', () => setIsResizing(false));
        };
    }, [isResizing]);

    // 当数据变化时更新JSON文本
    useEffect(() => {
        setTablesJson(JSON.stringify(tables, null, 2));
        setRelationshipsJson(JSON.stringify(relationships, null, 2));
        setAreasJson(JSON.stringify(areas, null, 2));
        setNotesJson(JSON.stringify(notes, null, 2));
        if (types) setTypesJson(JSON.stringify(types, null, 2));
        if (enums) setEnumsJson(JSON.stringify(enums, null, 2));
    }, [tables, relationships, areas, notes, types, enums]);

    // 处理JSON内容变化
    const handleJsonChange = (value, type) => {
        switch (type) {
            case "tables":
                setTablesJson(value);
                break;
            case "relationships":
                setRelationshipsJson(value);
                break;
            case "areas":
                setAreasJson(value);
                break;
            case "notes":
                setNotesJson(value);
                break;
            case "types":
                setTypesJson(value);
                break;
            case "enums":
                setEnumsJson(value);
                break;
            default:
                break;
        }
    };

    // 配置标签页
    const tabList = useMemo(() => {
        const tabs = [
            {
                tab: t("tables"),
                itemKey: Tab.TABLES,
                count: tablesCount,
                component: (
                    <CodeMirror
                        value={tablesJson}
                        extensions={[json()]}
                        onChange={(value) => handleJsonChange(value, "tables")}
                        theme={settings.mode === "dark" ? vscodeDark : githubLight}
                    />
                ),
            },
            {
                tab: t("relationships"),
                itemKey: Tab.RELATIONSHIPS,
                count: relationshipsCount,
                component: (
                    <CodeMirror
                        value={relationshipsJson}
                        extensions={[json()]}
                        onChange={(value) => handleJsonChange(value, "relationships")}
                        theme={settings.mode === "dark" ? vscodeDark : githubLight}
                    />
                ),
            },
            {
                tab: t("subject_areas"),
                itemKey: Tab.AREAS,
                count: areasCount,
                component: (
                    <CodeMirror
                        value={areasJson}
                        extensions={[json()]}
                        onChange={(value) => handleJsonChange(value, "areas")}
                        theme={settings.mode === "dark" ? vscodeDark : githubLight}
                    />
                ),
            },
            {
                tab: t("notes"),
                itemKey: Tab.NOTES,
                count: notesCount,
                component: (
                    <CodeMirror
                        value={notesJson}
                        extensions={[json()]}
                        onChange={(value) => handleJsonChange(value, "notes")}
                        theme={settings.mode === "dark" ? vscodeDark : githubLight}
                    />
                ),
            },
        ];
        if (databases[database].hasTypes) {
            tabs.push({
                tab: t("types"),
                itemKey: Tab.TYPES,
                count: typesCount,
                component: (
                    <CodeMirror
                        value={typesJson}
                        extensions={[json()]}
                        onChange={(value) => handleJsonChange(value, "types")}
                        theme={settings.mode === "dark" ? vscodeDark : githubLight}
                    />
                ),
            });
        }
        if (databases[database].hasEnums) {
            tabs.push({
                tab: t("enums"),
                itemKey: Tab.ENUMS,
                count: enumsCount,
                component: (
                    <CodeMirror
                        value={enumsJson}
                        extensions={[json()]}
                        onChange={(value) => handleJsonChange(value, "enums")}
                        theme={settings.mode === "dark" ? vscodeDark : githubLight}
                    />
                ),
            });
        }
        return isRtl(i18n.language) ? tabs.reverse() : tabs;
    }, [
        t,
        database,
        tablesCount,
        relationshipsCount,
        areasCount,
        typesCount,
        enumsCount,
        notesCount,
        tablesJson,
        relationshipsJson,
        areasJson,
        notesJson,
        typesJson,
        enumsJson,
        settings.mode,
    ]);

    return (
        <div className="flex h-full">
            {/* 当编辑器在右侧时，拖动条在左侧 */}
            {editorPosition === "right" && (
                <div
                    className={`flex justify-center items-center p-1 h-auto hover-2 cursor-col-resize ${isResizing && "bg-semi-grey-2"
                        }`}
                    onPointerDown={(e) => {
                        if (e.isPrimary) {
                            e.preventDefault();
                            setIsResizing(true);
                        }
                    }}
                >
                    <div className="w-1 border-x border-color h-1/6" />
                </div>
            )}
            <div
                className="flex flex-col h-full relative border-l border-color"
                style={{ width: `${editorWidth}px` }}
            >
                <TabsContainer
                    activeKey={selectedElement.currentTab}
                    onChange={(key) => setSelectedElement((prev) => ({ ...prev, currentTab: key }))}
                    tabs={tabList}
                    lazyRender={true}
                    keepDOM={false}
                    stickyHeader={true}
                />
            </div>
            {/* 当编辑器在左侧时，拖动条在右侧 */}
            {editorPosition === "left" && (
                <div
                    className={`flex justify-center items-center p-1 h-auto hover-2 cursor-col-resize ${isResizing && "bg-semi-grey-2"
                        }`}
                    onPointerDown={(e) => {
                        if (e.isPrimary) {
                            e.preventDefault();
                            setIsResizing(true);
                        }
                    }}
                >
                    <div className="w-1 border-x border-color h-1/6" />
                </div>
            )}
        </div>
    );
} 