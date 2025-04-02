import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Tab,
  ObjectType,
  tableFieldHeight,
  tableHeaderHeight,
  tableColorStripHeight,
} from "../../data/constants";
import {
  IconEdit,
  IconMore,
  IconMinus,
  IconDeleteStroked,
  IconKeyStroked,
} from "@douyinfe/semi-icons";
import { Popover, Tag, Button, SideSheet } from "@douyinfe/semi-ui";
import { useLayout, useSettings, useDiagram, useSelect } from "../../hooks";
import TableInfo from "../EditorSidePanel/TablesTab/TableInfo";
import { useTranslation } from "react-i18next";
import { dbToTypes } from "../../data/datatypes";
import { isRtl } from "../../i18n/utils/rtl";
import i18n from "../../i18n/i18n";

export default function Table(props) {
  const [hoveredField, setHoveredField] = useState(-1);
  const { database } = useDiagram();
  const {
    tableData,
    onPointerDown,
    setHoveredTable,
    handleGripField,
    setLinkingLine,
    readOnly = false,
  } = props;
  const { layout } = useLayout();
  const { deleteTable, deleteField } = useDiagram();
  const { settings } = useSettings();
  const { t } = useTranslation();
  const { selectedElement, setSelectedElement } = useSelect();
  const [isConnectingField, setIsConnectingField] = useState(false);

  const borderColor = useMemo(
    () => (settings.mode === "light" ? "border-zinc-300" : "border-zinc-600"),
    [settings.mode],
  );

  const height = useMemo(() => 
    tableData.fields.length * tableFieldHeight + tableHeaderHeight + 7,
    [tableData.fields.length]
  );

  const openEditor = useCallback(() => {
    if (readOnly) return; // 只读模式下不能打开编辑器
    
    if (!layout.sidebar) {
      setSelectedElement((prev) => ({
        ...prev,
        element: ObjectType.TABLE,
        id: tableData.id,
        open: true,
      }));
    } else {
      setSelectedElement((prev) => ({
        ...prev,
        currentTab: Tab.TABLES,
        element: ObjectType.TABLE,
        id: tableData.id,
        open: true,
      }));
    }
  }, [readOnly, layout.sidebar, tableData.id, setSelectedElement]);

  useEffect(() => {
    if (selectedElement.element === ObjectType.TABLE && 
        selectedElement.id === tableData.id && 
        selectedElement.open && 
        layout.sidebar && 
        selectedElement.currentTab === Tab.TABLES) {
      // 这里使用RAF替代setTimeout进行DOM操作
      const scrollToElement = () => {
        const element = document.getElementById(`scroll_table_${tableData.id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      };
      
      // 使用requestAnimationFrame，等待DOM更新后再滚动
      const frameId = requestAnimationFrame(scrollToElement);
      
      // 清理函数
      return () => cancelAnimationFrame(frameId);
    }
  }, [selectedElement, tableData.id, layout.sidebar]);

  // 使用useCallback包装字段指针事件处理程序
  const handleFieldPointerEnter = useCallback((index, e) => {
    if (!e.isPrimary) return;
    
    setHoveredField(index);
    
    if (!readOnly) {
      setHoveredTable({
        tableId: tableData.id,
        field: index,
      });
    }
  }, [readOnly, tableData.id, setHoveredTable]);

  const handleFieldPointerLeave = useCallback((e) => {
    if (!e.isPrimary) return;
    setHoveredField(-1);
  }, []);

  const handleFieldPointerDown = useCallback((index, e) => {
    e.target.releasePointerCapture(e.pointerId);
  }, []);

  const handleGripFieldClick = useCallback((index, e) => {
    if (!e.isPrimary) return;
    if (readOnly) return;

    // 阻止事件冒泡，防止在拖动字段时也拖动整个表格
    e.stopPropagation();
    
    // 设置连接字段状态为true
    setIsConnectingField(true);
    
    // 通知Canvas组件开始连接字段
    handleGripField(index);
    setLinkingLine((prev) => ({
      ...prev,
      startFieldId: index,
      startTableId: tableData.id,
      startX: tableData.x + 15,
      startY: tableData.y + index * tableFieldHeight + tableHeaderHeight + tableColorStripHeight + 12,
      endX: tableData.x + 15,
      endY: tableData.y + index * tableFieldHeight + tableHeaderHeight + tableColorStripHeight + 12,
    }));
  }, [handleGripField, readOnly, setLinkingLine, tableData, setIsConnectingField]);

  // 处理表格的指针按下事件，确保不会与字段连接器冲突
  const handleTablePointerDown = useCallback((e) => {
    // 如果正在连接字段，则不触发表格拖动
    if (isConnectingField) {
      e.stopPropagation();
      return;
    }
    
    // 否则调用原始的onPointerDown进行表格拖动
    onPointerDown(e);
  }, [onPointerDown, isConnectingField]);

  // 在连接完成后重置状态
  useEffect(() => {
    // 监听指针抬起事件，重置连接字段状态
    const handlePointerUp = () => {
      setIsConnectingField(false);
    };
    
    window.addEventListener('pointerup', handlePointerUp);
    
    return () => {
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, []);

  // 使用memo缓存rendering字段列表
  const renderedFields = useMemo(() => {
    return tableData.fields.map((fieldData, index) => {
      const isLastField = index === tableData.fields.length - 1;
      const isHovered = hoveredField === index;
      
      return (
        <div
          key={index}
          className={`${
            isLastField ? "" : "border-b border-gray-400"
          } group h-[36px] px-2 py-1 flex justify-between items-center gap-1 w-full overflow-hidden`}
          onPointerEnter={(e) => handleFieldPointerEnter(index, e)}
          onPointerLeave={handleFieldPointerLeave}
          onPointerDown={handleFieldPointerDown}
        >
          <div
            className={`${
              isHovered ? "text-zinc-400" : ""
            } flex items-center gap-2 overflow-hidden`}
          >
            {!readOnly && (
              <button
                className="shrink-0 w-[10px] h-[10px] bg-[#2f68adcc] rounded-full"
                onPointerDown={(e) => handleGripFieldClick(index, e)}
                onClick={(e) => e.stopPropagation()} /* 防止点击冒泡 */
              />
            )}
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">
              {fieldData.name}
            </span>
          </div>
          <div className="text-zinc-400">
            {isHovered && !readOnly ? (
              <Button
                theme="solid"
                size="small"
                style={{
                  backgroundColor: "#d42020b3",
                }}
                icon={<IconMinus />}
                onClick={(e) => {
                  e.stopPropagation(); /* 防止点击冒泡 */
                  deleteField(fieldData, tableData.id);
                }}
              />
            ) : settings.showDataTypes ? (
              <div className="flex gap-1 items-center">
                {fieldData.primary && <IconKeyStroked />}
                {!fieldData.notNull && <span>?</span>}
                <span>
                  {fieldData.type +
                    ((dbToTypes[database][fieldData.type].isSized ||
                      dbToTypes[database][fieldData.type].hasPrecision) &&
                    fieldData.size &&
                    fieldData.size !== ""
                      ? `(${fieldData.size})`
                      : "")}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      );
    });
  }, [
    tableData.fields, 
    hoveredField, 
    readOnly, 
    settings.showDataTypes, 
    database,
    handleFieldPointerEnter,
    handleFieldPointerLeave,
    handleFieldPointerDown,
    handleGripFieldClick,
    deleteField,
    tableData.id
  ]);

  return (
    <>
      <foreignObject
        key={tableData.id}
        x={tableData.x}
        y={tableData.y}
        width={settings.tableWidth}
        height={height}
        className={`group drop-shadow-lg rounded-md ${readOnly ? 'cursor-default' : 'cursor-move'}`}
        onPointerDown={handleTablePointerDown}
      >
        <div
          onDoubleClick={readOnly ? null : openEditor}
          className={`border-2 ${!readOnly ? 'hover:border-dashed hover:border-blue-500' : ''}
               select-none rounded-lg w-full ${
                 settings.mode === "light"
                   ? "bg-zinc-100 text-zinc-800"
                   : "bg-zinc-800 text-zinc-200"
               } ${
                 selectedElement.id === tableData.id &&
                 selectedElement.element === ObjectType.TABLE
                   ? "border-solid border-blue-500"
                   : borderColor
               }`}
          style={{ direction: "ltr" }}
        >
          <div
            className="h-[10px] w-full rounded-t-md"
            style={{ backgroundColor: tableData.color }}
          />
          <div
            className={`overflow-hidden font-bold h-[40px] flex justify-between items-center border-b border-gray-400 ${
              settings.mode === "light" ? "bg-zinc-200" : "bg-zinc-900"
            }`}
          >
            <div className=" px-3 overflow-hidden text-ellipsis whitespace-nowrap">
              {tableData.name}
            </div>
            {!readOnly ? (
              <div className="hidden group-hover:block">
                <div className="flex justify-end items-center mx-2">
                  <Button
                    icon={<IconEdit />}
                    size="small"
                    theme="solid"
                    style={{
                      backgroundColor: "#2f68adb3",
                      marginRight: "6px",
                    }}
                    onClick={openEditor}
                  />
                  <Popover
                    key={tableData.key}
                    content={
                      <div className="popover-theme">
                        <div className="mb-2">
                          <strong>{t("comment")}:</strong>{" "}
                          {tableData.comment === "" ? (
                            t("not_set")
                          ) : (
                            <div>{tableData.comment}</div>
                          )}
                        </div>
                        <div>
                          <strong
                            className={`${
                              tableData.indices.length === 0 ? "" : "block"
                            }`}
                          >
                            {t("indices")}:
                          </strong>{" "}
                          {tableData.indices.length === 0 ? (
                            t("not_set")
                          ) : (
                            <div>
                              {tableData.indices.map((index, k) => (
                                <div
                                  key={k}
                                  className={`flex items-center my-1 px-2 py-1 rounded ${
                                    settings.mode === "light"
                                      ? "bg-gray-100"
                                      : "bg-zinc-800"
                                  }`}
                                >
                                  <i className="fa-solid fa-thumbtack me-2 mt-1 text-slate-500"></i>
                                  <div>
                                    {index.fields.map((f) => (
                                      <Tag color="blue" key={f} className="me-1">
                                        {f}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <Button
                          icon={<IconDeleteStroked />}
                          type="danger"
                          block
                          style={{ marginTop: "8px" }}
                          onClick={() => deleteTable(tableData.id)}
                        >
                          {t("delete")}
                        </Button>
                      </div>
                    }
                    position="rightTop"
                    showArrow
                    trigger="click"
                    style={{ width: "200px", wordBreak: "break-word" }}
                  >
                    <Button
                      icon={<IconMore />}
                      type="tertiary"
                      size="small"
                      style={{
                        backgroundColor: "#808080b3",
                        color: "white",
                      }}
                    />
                  </Popover>
                </div>
              </div>
            ) : (
              <div className="hidden group-hover:block">
                <div className="flex justify-end items-center mx-2">
                  <Popover
                    key={tableData.key}
                    content={
                      <div className="popover-theme">
                        <div className="mb-2">
                          <strong>{t("comment")}:</strong>{" "}
                          {tableData.comment === "" ? (
                            t("not_set")
                          ) : (
                            <div>{tableData.comment}</div>
                          )}
                        </div>
                        <div>
                          <strong
                            className={`${
                              tableData.indices.length === 0 ? "" : "block"
                            }`}
                          >
                            {t("indices")}:
                          </strong>{" "}
                          {tableData.indices.length === 0 ? (
                            t("not_set")
                          ) : (
                            <div>
                              {tableData.indices.map((index, k) => (
                                <div
                                  key={k}
                                  className={`flex items-center my-1 px-2 py-1 rounded ${
                                    settings.mode === "light"
                                      ? "bg-gray-100"
                                      : "bg-zinc-800"
                                  }`}
                                >
                                  <i className="fa-solid fa-thumbtack me-2 mt-1 text-slate-500"></i>
                                  <div>
                                    {index.fields.map((f) => (
                                      <Tag color="blue" key={f} className="me-1">
                                        {f}
                                      </Tag>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    }
                    position="rightTop"
                    showArrow
                    trigger="click"
                    style={{ width: "200px", wordBreak: "break-word" }}
                  >
                    <Button
                      icon={<IconMore />}
                      type="tertiary"
                      size="small"
                      style={{
                        backgroundColor: "#808080b3",
                        color: "white",
                      }}
                    />
                  </Popover>
                </div>
              </div>
            )}
          </div>
          {settings.showFieldSummary 
            ? tableData.fields.map((e, i) => (
                <Popover
                  key={i}
                  content={
                    <div className="popover-theme">
                      <div
                        className="flex justify-between items-center pb-2"
                        style={{ direction: "ltr" }}
                      >
                        <p className="me-4 font-bold">{e.name}</p>
                        <p className="ms-4">
                          {e.type +
                            ((dbToTypes[database][e.type].isSized ||
                              dbToTypes[database][e.type].hasPrecision) &&
                            e.size &&
                            e.size !== ""
                              ? "(" + e.size + ")"
                              : "")}
                        </p>
                      </div>
                      <hr />
                      {e.primary && (
                        <Tag color="blue" className="me-2 my-2">
                          {t("primary")}
                        </Tag>
                      )}
                      {e.unique && (
                        <Tag color="amber" className="me-2 my-2">
                          {t("unique")}
                        </Tag>
                      )}
                      {e.notNull && (
                        <Tag color="purple" className="me-2 my-2">
                          {t("not_null")}
                        </Tag>
                      )}
                      {e.increment && (
                        <Tag color="green" className="me-2 my-2">
                          {t("autoincrement")}
                        </Tag>
                      )}
                      <p>
                        <strong>{t("default_value")}: </strong>
                        {e.default === "" ? t("not_set") : e.default}
                      </p>
                      <p>
                        <strong>{t("comment")}: </strong>
                        {e.comment === "" ? t("not_set") : e.comment}
                      </p>
                    </div>
                  }
                  position="right"
                  showArrow
                  style={
                    isRtl(i18n.language)
                      ? { direction: "rtl" }
                      : { direction: "ltr" }
                  }
                >
                  {renderedFields[i]}
                </Popover>
              ))
            : renderedFields
          }
        </div>
      </foreignObject>
      {!readOnly && (
        <SideSheet
          title={t("edit")}
          size="small"
          visible={
            selectedElement.element === ObjectType.TABLE &&
            selectedElement.id === tableData.id &&
            selectedElement.open &&
            !layout.sidebar
          }
          onCancel={() =>
            setSelectedElement((prev) => ({
              ...prev,
              open: !prev.open,
            }))
          }
          style={{ paddingBottom: "16px" }}
        >
          <div className="sidesheet-theme">
            <TableInfo data={tableData} />
          </div>
        </SideSheet>
      )}
    </>
  );
}