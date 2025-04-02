import { Tab } from "../../data/constants";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useJsonEditor, useSelect, useDiagram, useAreas, useNotes, useTypes, useEnums, useSaveState } from "../../hooks";
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
import { State } from "../../data/constants";
import { Toast, Banner } from "@douyinfe/semi-ui";
import { Validator } from "jsonschema";
import { tableSchema, areaSchema, noteSchema, typeSchema, enumSchema } from "../../data/schemas";

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
    const { tables, relationships, database, tablesCount, relationshipsCount, setTables, setRelationships } = useDiagram();
    const { areasCount, areas, setAreas } = useAreas();
    const { notesCount, notes, setNotes } = useNotes();
    const { typesCount, types, setTypes } = useTypes();
    const { enumsCount, enums, setEnums } = useEnums();
    const { setSaveState } = useSaveState();
    const [tablesJson, setTablesJson] = useState("");
    const [relationshipsJson, setRelationshipsJson] = useState("");
    const [areasJson, setAreasJson] = useState("");
    const [notesJson, setNotesJson] = useState("");
    const [typesJson, setTypesJson] = useState("");
    const [enumsJson, setEnumsJson] = useState("");
    const { editorPosition } = useJsonEditor();

    // 添加JSON验证错误状态
    const [validationError, setValidationError] = useState(null);

    // 添加自己的宽度控制状态
    const [editorWidth, setEditorWidth] = useState(width || 360);
    // 添加自己的调整状态
    const [isResizing, setIsResizing] = useState(false);
    // 添加防抖定时器引用
    const debounceTimerRef = useRef(null);
    // 添加JSON验证器
    const validator = useRef(new Validator());

    // 创建关系的Schema
    const relationshipSchema = useMemo(() => ({
        type: "object",
        properties: {
            startTableId: { type: "integer" },
            startFieldId: { type: "integer" },
            endTableId: { type: "integer" },
            endFieldId: { type: "integer" },
            name: { type: "string" },
            cardinality: { type: "string" },
            updateConstraint: { type: "string" },
            deleteConstraint: { type: "string" },
            id: { type: "integer" },
        },
        required: [
            "startTableId",
            "startFieldId",
            "endTableId",
            "endFieldId",
            "name",
            "cardinality",
            "updateConstraint",
            "deleteConstraint",
            "id",
        ],
    }), []);

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
        
        // 清除验证错误
        setValidationError(null);
    }, [tables, relationships, areas, notes, types, enums]);

    // 验证JSON数据是否符合预期结构
    const validateJson = useCallback((data, schema, type) => {
        const result = validator.current.validate(data, { type: "array", items: schema });
        if (!result.valid) {
            // 获取错误详情
            const errors = result.errors.map(err => {
                // 提取错误路径和消息，格式化成友好的提示
                const path = err.property.replace('instance', '');
                const message = err.message;
                return `${path}: ${message}`;
            });
            
            // 设置验证错误信息
            setValidationError({
                type,
                message: errors.join('\n'),
                timestamp: Date.now()
            });
            
            return false;
        }
        
        return true;
    }, [t]);

    // 找出JSON字符串中指定位置的行号
    const findLineNumber = useCallback((text, position) => {
        if (position === undefined || position < 0 || position >= text.length) {
            return -1;
        }
        
        // 计算行号
        let line = 1;
        for (let i = 0; i < position; i++) {
            if (text[i] === '\n') {
                line++;
            }
        }
        return line;
    }, []);

    // 处理JSON解析错误，提取行号信息
    const handleJsonParseError = useCallback((error, text, type) => {
        // 尝试从错误消息中获取错误位置
        let errorPosition = -1;
        let errorMessage = error.message;
        
        // 解析错误消息，提取位置信息
        const posMatch = error.message.match(/at position (\d+)/);
        if (posMatch && posMatch[1]) {
            errorPosition = parseInt(posMatch[1], 10);
        }
        
        // 查找行号
        const lineNumber = findLineNumber(text, errorPosition);
        
        // 构建带行号的错误消息
        if (lineNumber > 0) {
            // 提取出错行的内容
            const lines = text.split('\n');
            const errorLine = lines[lineNumber - 1];
            
            // 格式化错误信息，包含行号和行内容
            errorMessage = `第 ${lineNumber} 行: ${errorMessage}\n错误行内容: "${errorLine.trim()}"`;
        }
        
        // 设置验证错误信息
        setValidationError({
            type,
            message: errorMessage,
            line: lineNumber,
            timestamp: Date.now()
        });
    }, [findLineNumber]);

    // 使用防抖函数延迟更新应用状态，并触发保存
    const debounceUpdate = useCallback((updateFn, parsedData, schema, type) => {
        // 清除之前的定时器
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        // 设置新的定时器，减少延迟时间实现更实时的保存
        debounceTimerRef.current = setTimeout(() => {
            try {
                // 先进行Schema验证
                if (schema && !validateJson(parsedData, schema, type)) {
                    return; // 验证失败，不更新
                }
                
                // 验证通过，执行更新
                updateFn();
                
                // 清除错误状态
                setValidationError(null);
                
                // 更新成功后触发保存
                setSaveState(State.SAVING);
            } catch (error) {
                console.error("JSON处理错误:", error);
                setValidationError({
                    type,
                    message: error.message,
                    timestamp: Date.now()
                });
            }
        }, 300); // 减少到300毫秒，实现更实时的响应
    }, [setSaveState, validateJson]);

    // 处理JSON内容变化
    const handleJsonChange = (value, type) => {
        try {
            // 先尝试解析JSON，确保基本的JSON格式是正确的
            const parsedData = JSON.parse(value);
            
            switch (type) {
                case "tables":
                    setTablesJson(value);
                    debounceUpdate(() => setTables(parsedData), parsedData, tableSchema, "tables");
                    break;
                case "relationships":
                    setRelationshipsJson(value);
                    debounceUpdate(() => setRelationships(parsedData), parsedData, relationshipSchema, "relationships");
                    break;
                case "areas":
                    setAreasJson(value);
                    debounceUpdate(() => setAreas(parsedData), parsedData, areaSchema, "subject_areas");
                    break;
                case "notes":
                    setNotesJson(value);
                    debounceUpdate(() => setNotes(parsedData), parsedData, noteSchema, "notes");
                    break;
                case "types":
                    setTypesJson(value);
                    debounceUpdate(() => setTypes(parsedData), parsedData, typeSchema, "types");
                    break;
                case "enums":
                    setEnumsJson(value);
                    debounceUpdate(() => setEnums(parsedData), parsedData, enumSchema, "enums");
                    break;
                default:
                    break;
            }
        } catch (error) {
            // JSON解析错误
            console.error("JSON解析错误:", error);
            
            // 更新相应的JSON文本
            switch (type) {
                case "tables": 
                    setTablesJson(value); 
                    handleJsonParseError(error, value, "tables");
                    break;
                case "relationships": 
                    setRelationshipsJson(value); 
                    handleJsonParseError(error, value, "relationships");
                    break;
                case "areas": 
                    setAreasJson(value); 
                    handleJsonParseError(error, value, "subject_areas");
                    break;
                case "notes": 
                    setNotesJson(value); 
                    handleJsonParseError(error, value, "notes");
                    break;
                case "types": 
                    setTypesJson(value); 
                    handleJsonParseError(error, value, "types");
                    break;
                case "enums": 
                    setEnumsJson(value); 
                    handleJsonParseError(error, value, "enums");
                    break;
                default: 
                    break;
            }
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
                    <div>
                        {/* 针对tables的错误显示 */}
                        {validationError && validationError.type === "tables" && (
                            <Banner
                                type="danger"
                                closeIcon={null}
                                className="mb-3"
                                description={
                                    <div className="text-xs">
                                        <strong>{t("tables")}格式错误：</strong>
                                        <pre className="max-h-24 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            {validationError.message}
                                        </pre>
                                        <div className="mt-1 italic text-gray-600 dark:text-gray-400">
                                            {validationError.line > 0 ? 
                                                `位置: 第 ${validationError.line} 行` : 
                                                "请检查JSON格式和对象结构"}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <CodeMirror
                            value={tablesJson}
                            extensions={[json()]}
                            onChange={(value) => handleJsonChange(value, "tables")}
                            theme={settings.mode === "dark" ? vscodeDark : githubLight}
                        />
                    </div>
                ),
            },
            {
                tab: t("relationships"),
                itemKey: Tab.RELATIONSHIPS,
                count: relationshipsCount,
                component: (
                    <div>
                        {/* 针对relationships的错误显示 */}
                        {validationError && validationError.type === "relationships" && (
                            <Banner
                                type="danger"
                                closeIcon={null}
                                className="mb-3"
                                description={
                                    <div className="text-xs">
                                        <strong>{t("relationships")}格式错误：</strong>
                                        <pre className="max-h-24 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            {validationError.message}
                                        </pre>
                                        <div className="mt-1 italic text-gray-600 dark:text-gray-400">
                                            {validationError.line > 0 ? 
                                                `位置: 第 ${validationError.line} 行` : 
                                                "请检查JSON格式和对象结构"}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <CodeMirror
                            value={relationshipsJson}
                            extensions={[json()]}
                            onChange={(value) => handleJsonChange(value, "relationships")}
                            theme={settings.mode === "dark" ? vscodeDark : githubLight}
                        />
                    </div>
                ),
            },
            {
                tab: t("subject_areas"),
                itemKey: Tab.AREAS,
                count: areasCount,
                component: (
                    <div>
                        {/* 针对areas的错误显示 */}
                        {validationError && validationError.type === "subject_areas" && (
                            <Banner
                                type="danger"
                                closeIcon={null}
                                className="mb-3"
                                description={
                                    <div className="text-xs">
                                        <strong>{t("subject_areas")}格式错误：</strong>
                                        <pre className="max-h-24 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            {validationError.message}
                                        </pre>
                                        <div className="mt-1 italic text-gray-600 dark:text-gray-400">
                                            {validationError.line > 0 ? 
                                                `位置: 第 ${validationError.line} 行` : 
                                                "请检查JSON格式和对象结构"}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <CodeMirror
                            value={areasJson}
                            extensions={[json()]}
                            onChange={(value) => handleJsonChange(value, "areas")}
                            theme={settings.mode === "dark" ? vscodeDark : githubLight}
                        />
                    </div>
                ),
            },
            {
                tab: t("notes"),
                itemKey: Tab.NOTES,
                count: notesCount,
                component: (
                    <div>
                        {/* 针对notes的错误显示 */}
                        {validationError && validationError.type === "notes" && (
                            <Banner
                                type="danger"
                                closeIcon={null}
                                className="mb-3"
                                description={
                                    <div className="text-xs">
                                        <strong>{t("notes")}格式错误：</strong>
                                        <pre className="max-h-24 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            {validationError.message}
                                        </pre>
                                        <div className="mt-1 italic text-gray-600 dark:text-gray-400">
                                            {validationError.line > 0 ? 
                                                `位置: 第 ${validationError.line} 行` : 
                                                "请检查JSON格式和对象结构"}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <CodeMirror
                            value={notesJson}
                            extensions={[json()]}
                            onChange={(value) => handleJsonChange(value, "notes")}
                            theme={settings.mode === "dark" ? vscodeDark : githubLight}
                        />
                    </div>
                ),
            },
        ];
        if (databases[database].hasTypes) {
            tabs.push({
                tab: t("types"),
                itemKey: Tab.TYPES,
                count: typesCount,
                component: (
                    <div>
                        {/* 针对types的错误显示 */}
                        {validationError && validationError.type === "types" && (
                            <Banner
                                type="danger"
                                closeIcon={null}
                                className="mb-3"
                                description={
                                    <div className="text-xs">
                                        <strong>{t("types")}格式错误：</strong>
                                        <pre className="max-h-24 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            {validationError.message}
                                        </pre>
                                        <div className="mt-1 italic text-gray-600 dark:text-gray-400">
                                            {validationError.line > 0 ? 
                                                `位置: 第 ${validationError.line} 行` : 
                                                "请检查JSON格式和对象结构"}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <CodeMirror
                            value={typesJson}
                            extensions={[json()]}
                            onChange={(value) => handleJsonChange(value, "types")}
                            theme={settings.mode === "dark" ? vscodeDark : githubLight}
                        />
                    </div>
                ),
            });
        }
        if (databases[database].hasEnums) {
            tabs.push({
                tab: t("enums"),
                itemKey: Tab.ENUMS,
                count: enumsCount,
                component: (
                    <div>
                        {/* 针对enums的错误显示 */}
                        {validationError && validationError.type === "enums" && (
                            <Banner
                                type="danger"
                                closeIcon={null}
                                className="mb-3"
                                description={
                                    <div className="text-xs">
                                        <strong>{t("enums")}格式错误：</strong>
                                        <pre className="max-h-24 overflow-auto whitespace-pre-wrap bg-gray-100 dark:bg-gray-800 p-2 rounded">
                                            {validationError.message}
                                        </pre>
                                        <div className="mt-1 italic text-gray-600 dark:text-gray-400">
                                            {validationError.line > 0 ? 
                                                `位置: 第 ${validationError.line} 行` : 
                                                "请检查JSON格式和对象结构"}
                                        </div>
                                    </div>
                                }
                            />
                        )}
                        <CodeMirror
                            value={enumsJson}
                            extensions={[json()]}
                            onChange={(value) => handleJsonChange(value, "enums")}
                            theme={settings.mode === "dark" ? vscodeDark : githubLight}
                        />
                    </div>
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
        validationError, // 添加验证错误状态到依赖数组
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