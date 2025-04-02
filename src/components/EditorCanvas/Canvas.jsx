import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Action,
  Cardinality,
  Constraint,
  darkBgTheme,
  ObjectType,
} from "../../data/constants";
import { Toast } from "@douyinfe/semi-ui";
import Table from "./Table";
import Area from "./Area";
import Relationship from "./Relationship";
import Note from "./Note";
import {
  useCanvas,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useSelect,
  useAreas,
  useNotes,
  useLayout,
  useReadOnly,
} from "../../hooks";
import { useTranslation } from "react-i18next";
import { useEventListener } from "usehooks-ts";
import { areFieldsCompatible } from "../../utils/utils";

/**
 * 节流函数 - 限制函数在指定时间内最多执行一次
 * @param {Function} func 要执行的函数
 * @param {number} limit 时间限制(ms)
 * @returns {Function} 节流后的函数
 */
function throttle(func, limit) {
  let inThrottle;
  let lastFunc;
  let lastRan;
  
  return function() {
    const context = this;
    const args = arguments;
    
    if (!inThrottle) {
      func.apply(context, args);
      lastRan = Date.now();
      inThrottle = true;
    } else {
      clearTimeout(lastFunc);
      lastFunc = setTimeout(function() {
        if (Date.now() - lastRan >= limit) {
          func.apply(context, args);
          lastRan = Date.now();
        }
      }, limit - (Date.now() - lastRan));
    }
  };
}

export default function Canvas() {
  const { t } = useTranslation();
  const { readOnly } = useReadOnly();

  const canvasRef = useRef(null);
  const canvasContextValue = useCanvas();
  const {
    canvas: { viewBox },
    pointer,
  } = canvasContextValue;

  const { tables, updateTable, relationships, addRelationship, database } =
    useDiagram();
  const { areas, updateArea } = useAreas();
  const { notes, updateNote } = useNotes();
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { setUndoStack, setRedoStack } = useUndoRedo();
  const { transform, setTransform } = useTransform();
  const { selectedElement, setSelectedElement } = useSelect();
  const [dragging, setDragging] = useState({
    element: ObjectType.NONE,
    id: -1,
    prevX: 0,
    prevY: 0,
  });
  const [linking, setLinking] = useState(false);
  const [linkingLine, setLinkingLine] = useState({
    startTableId: -1,
    startFieldId: -1,
    endTableId: -1,
    endFieldId: -1,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });
  const [grabOffset, setGrabOffset] = useState({ x: 0, y: 0 });
  const [hoveredTable, setHoveredTable] = useState({
    tableId: -1,
    field: -2,
  });
  const [panning, setPanning] = useState({
    isPanning: false,
    panStart: { x: 0, y: 0 },
    cursorStart: { x: 0, y: 0 },
  });
  const [areaResize, setAreaResize] = useState({ id: -1, dir: "none" });
  const [initCoords, setInitCoords] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    pointerX: 0,
    pointerY: 0,
  });

  // 添加一个批处理更新的机制
  const pendingUpdates = useRef({
    table: null,
    area: null,
    note: null
  });
  
  // 使用requestAnimationFrame进行视觉更新
  const rafRef = useRef(null);

  // 使用useMemo缓存计算结果，减少重复计算
  const movableElements = useMemo(() => {
    return {
      tables: tables.map(t => ({ id: t.id, x: t.x, y: t.y })),
      areas: areas.map(a => ({ id: a.id, x: a.x, y: a.y })),
      notes: notes.map(n => ({ id: n.id, x: n.x, y: n.y }))
    };
  }, [tables, areas, notes]);

  // 使用useCallback包装处理函数，避免不必要的重新渲染
  const handlePointerDownOnElement = useCallback((e, id, type) => {
    if (selectedElement.open && !layout.sidebar) return;
    if (!e.isPrimary) return;
    
    if (readOnly) return;

    if (type === ObjectType.TABLE) {
      const table = tables.find((t) => t.id === id);
      setGrabOffset({
        x: table.x - pointer.spaces.diagram.x,
        y: table.y - pointer.spaces.diagram.y,
      });
      setDragging({
        element: type,
        id: id,
        prevX: table.x,
        prevY: table.y,
      });
    } else if (type === ObjectType.AREA) {
      const area = areas.find((t) => t.id === id);
      setGrabOffset({
        x: area.x - pointer.spaces.diagram.x,
        y: area.y - pointer.spaces.diagram.y,
      });
      setDragging({
        element: type,
        id: id,
        prevX: area.x,
        prevY: area.y,
      });
    } else if (type === ObjectType.NOTE) {
      const note = notes.find((t) => t.id === id);
      setGrabOffset({
        x: note.x - pointer.spaces.diagram.x,
        y: note.y - pointer.spaces.diagram.y,
      });
      setDragging({
        element: type,
        id: id,
        prevX: note.x,
        prevY: note.y,
      });
    }
    
    // 更新选中元素状态
    setSelectedElement((prev) => ({
      ...prev,
      element: type,
      id: id,
      open: false,
    }));
  }, [selectedElement, layout.sidebar, readOnly, tables, areas, notes, pointer.spaces.diagram, setSelectedElement]);

  // 使用节流优化元素移动的处理
  const updateElementPosition = useCallback((element, id, x, y) => {
    switch(element) {
      case ObjectType.TABLE:
        updateTable(id, { x, y });
        break;
      case ObjectType.AREA:
        updateArea(id, { x, y });
        break;
      case ObjectType.NOTE:
        updateNote(id, { x, y });
        break;
      default:
        break;
    }
  }, [updateTable, updateArea, updateNote]);
  
  // 创建一个节流版本的更新函数
  const throttledUpdatePosition = useCallback(
    throttle(updateElementPosition, 16), // 约60fps
    [updateElementPosition]
  );

  // 使用useEffect处理元素移动，避免在渲染期间更新状态
  useEffect(() => {
    if (dragging.element !== ObjectType.NONE && dragging.id >= 0 && !readOnly) {
      const updatedX = pointer.spaces.diagram.x + grabOffset.x;
      const updatedY = pointer.spaces.diagram.y + grabOffset.y;
      
      // 判断是否可以移动（如果是AREA且正在调整大小则不移动）
      if (dragging.element === ObjectType.AREA && areaResize.id !== -1) {
        return;
      }
      
      // 使用requestAnimationFrame调度更新
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        throttledUpdatePosition(dragging.element, dragging.id, updatedX, updatedY);
      });
    }
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    dragging.element, 
    dragging.id, 
    pointer.spaces.diagram.x, 
    pointer.spaces.diagram.y, 
    grabOffset, 
    areaResize.id, 
    readOnly,
    throttledUpdatePosition
  ]);

  // 创建一个节流版本的区域调整函数
  const updateAreaSize = useCallback((id, dims) => {
    updateArea(id, dims);
  }, [updateArea]);
  
  const throttledUpdateAreaSize = useCallback(
    throttle(updateAreaSize, 16),
    [updateAreaSize]
  );

  // 处理区域调整的useEffect
  useEffect(() => {
    // 只在区域调整模式下处理
    if (areaResize.id !== -1 && areaResize.dir !== "none" && !readOnly) {
      let newDims = { ...initCoords };
      delete newDims.pointerX;
      delete newDims.pointerY;
      
      // 设置panning状态为false
      setPanning(old => ({ ...old, isPanning: false }));
      
      // 根据拖拽方向计算新的尺寸
      switch (areaResize.dir) {
        case "br":
          newDims.width = Math.max(50, pointer.spaces.diagram.x - initCoords.x);
          newDims.height = Math.max(50, pointer.spaces.diagram.y - initCoords.y);
          break;
        case "tl":
          newDims.x = pointer.spaces.diagram.x;
          newDims.y = pointer.spaces.diagram.y;
          newDims.width = Math.max(50, initCoords.x + initCoords.width - pointer.spaces.diagram.x);
          newDims.height = Math.max(50, initCoords.y + initCoords.height - pointer.spaces.diagram.y);
          break;
        case "tr":
          newDims.y = pointer.spaces.diagram.y;
          newDims.width = Math.max(50, pointer.spaces.diagram.x - initCoords.x);
          newDims.height = Math.max(50, initCoords.y + initCoords.height - pointer.spaces.diagram.y);
          break;
        case "bl":
          newDims.x = pointer.spaces.diagram.x;
          newDims.width = Math.max(50, initCoords.x + initCoords.width - pointer.spaces.diagram.x);
          newDims.height = Math.max(50, pointer.spaces.diagram.y - initCoords.y);
          break;
        default:
          return; // 不处理未知的拖拽方向
      }
      
      // 使用requestAnimationFrame调度更新
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      rafRef.current = requestAnimationFrame(() => {
        throttledUpdateAreaSize(areaResize.id, newDims);
      });
    }
    
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    areaResize.id,
    areaResize.dir,
    readOnly,
    initCoords,
    pointer.spaces.diagram.x,
    pointer.spaces.diagram.y,
    throttledUpdateAreaSize,
    setPanning
  ]);

  // 修改handlePointerMove为节流函数
  const handlePointerMoveRaw = useCallback((e) => {
    if (selectedElement.open && !layout.sidebar) return;
    if (!e.isPrimary) return;

    if (linking) {
      if (readOnly) return;
      
      setLinkingLine({
        ...linkingLine,
        endX: pointer.spaces.diagram.x,
        endY: pointer.spaces.diagram.y,
      });
    } else if (
      panning.isPanning &&
      dragging.element === ObjectType.NONE &&
      areaResize.id === -1
    ) {
      if (!settings.panning) {
        return;
      }
      
      setTransform((prev) => ({
        ...prev,
        pan: {
          x:
            panning.panStart.x +
            (panning.cursorStart.x - pointer.spaces.screen.x) / transform.zoom,
          y:
            panning.panStart.y +
            (panning.cursorStart.y - pointer.spaces.screen.y) / transform.zoom,
        },
      }));
    }
  }, [
    selectedElement.open,
    layout.sidebar,
    linking,
    readOnly,
    linkingLine,
    panning,
    dragging.element,
    areaResize.id,
    settings.panning,
    transform.zoom,
    pointer.spaces
  ]);
  
  // 创建节流版本的指针移动处理函数
  const handlePointerMove = useMemo(() => 
    throttle(handlePointerMoveRaw, 16),
    [handlePointerMoveRaw]
  );

  /**
   * @param {PointerEvent} e
   */
  const handlePointerDown = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;
    
    // 如果正在链接字段，则不进行拖动或平移操作
    if (linking) return;

    // don't pan if the sidesheet for editing a table is open
    if (
      selectedElement.element === ObjectType.TABLE &&
      selectedElement.open &&
      !layout.sidebar
    )
      return;

    setPanning({
      isPanning: true,
      panStart: transform.pan,
      // Diagram space depends on the current panning.
      // Use screen space to avoid circular dependencies and undefined behavior.
      cursorStart: pointer.spaces.screen,
    });
    pointer.setStyle("grabbing");
  };

  const coordsDidUpdate = (element) => {
    switch (element) {
      case ObjectType.TABLE:
        return !(
          dragging.prevX === tables[dragging.id].x &&
          dragging.prevY === tables[dragging.id].y
        );
      case ObjectType.AREA:
        return !(
          dragging.prevX === areas[dragging.id].x &&
          dragging.prevY === areas[dragging.id].y
        );
      case ObjectType.NOTE:
        return !(
          dragging.prevX === notes[dragging.id].x &&
          dragging.prevY === notes[dragging.id].y
        );
      default:
        return false;
    }
  };

  const didResize = (id) => {
    return !(
      areas[id].x === initCoords.x &&
      areas[id].y === initCoords.y &&
      areas[id].width === initCoords.width &&
      areas[id].height === initCoords.height
    );
  };

  const didPan = () =>
    !(transform.pan.x === panning.x && transform.pan.y === panning.y);

  const getMovedElementDetails = () => {
    switch (dragging.element) {
      case ObjectType.TABLE:
        return {
          name: tables[dragging.id].name,
          x: Math.round(tables[dragging.id].x),
          y: Math.round(tables[dragging.id].y),
        };
      case ObjectType.AREA:
        return {
          name: areas[dragging.id].name,
          x: Math.round(areas[dragging.id].x),
          y: Math.round(areas[dragging.id].y),
        };
      case ObjectType.NOTE:
        return {
          name: notes[dragging.id].title,
          x: Math.round(notes[dragging.id].x),
          y: Math.round(notes[dragging.id].y),
        };
      default:
        return false;
    }
  };

  /**
   * @param {PointerEvent} e
   */
  const handlePointerUp = (e) => {
    if (selectedElement.open && !layout.sidebar) return;

    if (!e.isPrimary) return;

    if (coordsDidUpdate(dragging.element) && !readOnly) {
      const info = getMovedElementDetails();
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.MOVE,
          element: dragging.element,
          x: dragging.prevX,
          y: dragging.prevY,
          toX: info.x,
          toY: info.y,
          id: dragging.id,
          message: t("move_element", {
            coords: `(${info.x}, ${info.y})`,
            name: info.name,
          }),
        },
      ]);
      setRedoStack([]);
    }
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    
    // 在只读模式下也保留平移功能，但不添加到撤销栈
    if (panning.isPanning) {
      if (didPan() && !readOnly) {
        setUndoStack((prev) => [
          ...prev,
          {
            action: Action.PAN,
            undo: { x: panning.x, y: panning.y },
            redo: transform.pan,
            message: t("move_element", {
              coords: `(${transform?.pan.x}, ${transform?.pan.y})`,
              name: "diagram",
            }),
          },
        ]);
        setRedoStack([]);
        setSelectedElement((prev) => ({
          ...prev,
          element: ObjectType.NONE,
          id: -1,
          open: false,
        }));
      }
      setPanning((old) => ({ ...old, isPanning: false }));
    }
    
    pointer.setStyle("default");
    if (linking) handleLinking();
    setLinking(false);
    
    if (areaResize.id !== -1 && didResize(areaResize.id) && !readOnly) {
      setUndoStack((prev) => [
        ...prev,
        {
          action: Action.EDIT,
          element: ObjectType.AREA,
          aid: areaResize.id,
          undo: {
            ...areas[areaResize.id],
            x: initCoords.x,
            y: initCoords.y,
            width: initCoords.width,
            height: initCoords.height,
          },
          redo: areas[areaResize.id],
          message: t("edit_area", {
            areaName: areas[areaResize.id].name,
            extra: "[resize]",
          }),
        },
      ]);
      setRedoStack([]);
    }
    
    setAreaResize({ id: -1, dir: "none" });
    setInitCoords({
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      pointerX: 0,
      pointerY: 0,
    });
  };

  const handleGripField = () => {
    if (readOnly) return;
    
    setPanning((old) => ({ ...old, isPanning: false }));
    setDragging({ element: ObjectType.NONE, id: -1, prevX: 0, prevY: 0 });
    setLinking(true);
  };

  const handleLinking = () => {
    if (hoveredTable.tableId < 0) return;
    if (hoveredTable.field < 0) return;
    if (
      !areFieldsCompatible(
        database,
        tables[linkingLine.startTableId].fields[linkingLine.startFieldId],
        tables[hoveredTable.tableId].fields[hoveredTable.field],
      )
    ) {
      Toast.info(t("cannot_connect"));
      return;
    }
    if (
      linkingLine.startTableId === hoveredTable.tableId &&
      linkingLine.startFieldId === hoveredTable.field
    )
      return;

    const newRelationship = {
      ...linkingLine,
      endTableId: hoveredTable.tableId,
      endFieldId: hoveredTable.field,
      cardinality: Cardinality.ONE_TO_ONE,
      updateConstraint: Constraint.NONE,
      deleteConstraint: Constraint.NONE,
      name: `fk_${tables[linkingLine.startTableId].name}_${
        tables[linkingLine.startTableId].fields[linkingLine.startFieldId].name
      }_${tables[hoveredTable.tableId].name}`,
      id: relationships.length,
    };
    delete newRelationship.startX;
    delete newRelationship.startY;
    delete newRelationship.endX;
    delete newRelationship.endY;
    addRelationship(newRelationship);
  };

  // Handle mouse wheel scrolling
  useEventListener(
    "wheel",
    (e) => {
      e.preventDefault();

      if (e.ctrlKey || e.metaKey) {
        // How "eager" the viewport is to
        // center the cursor's coordinates
        const eagernessFactor = 0.05;
        setTransform((prev) => ({
          pan: {
            x:
              prev.pan.x -
              (pointer.spaces.diagram.x - prev.pan.x) *
                eagernessFactor *
                Math.sign(e.deltaY),
            y:
              prev.pan.y -
              (pointer.spaces.diagram.y - prev.pan.y) *
                eagernessFactor *
                Math.sign(e.deltaY),
          },
          zoom: e.deltaY <= 0 ? prev.zoom * 1.05 : prev.zoom / 1.05,
        }));
      } else if (e.shiftKey) {
        setTransform((prev) => ({
          ...prev,
          pan: {
            ...prev.pan,
            x: prev.pan.x + e.deltaY / prev.zoom,
          },
        }));
      } else {
        setTransform((prev) => ({
          ...prev,
          pan: {
            x: prev.pan.x + e.deltaX / prev.zoom,
            y: prev.pan.y + e.deltaY / prev.zoom,
          },
        }));
      }
    },
    canvasRef,
    { passive: false },
  );

  const theme = localStorage.getItem("theme");

  return (
    <div className="grow h-full touch-none" id="canvas">
      <div
        className="w-full h-full"
        style={{
          cursor: pointer.style,
          backgroundColor: theme === "dark" ? darkBgTheme : "white",
        }}
      >
        {settings.showGrid && (
          <svg className="absolute w-full h-full">
            <defs>
              <pattern
                id="pattern-circles"
                x="0"
                y="0"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
                patternContentUnits="userSpaceOnUse"
              >
                <circle
                  id="pattern-circle"
                  cx="4"
                  cy="4"
                  r="0.85"
                  fill="rgb(99, 152, 191)"
                ></circle>
              </pattern>
            </defs>
            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#pattern-circles)"
            ></rect>
          </svg>
        )}
        <svg
          id="diagram"
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          className="absolute w-full h-full touch-none"
          viewBox={`${viewBox.left} ${viewBox.top} ${viewBox.width} ${viewBox.height}`}
        >
          {areas.map((a) => (
            <Area
              key={a.id}
              data={a}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, a.id, ObjectType.AREA)
              }
              setResize={readOnly ? null : setAreaResize}
              setInitCoords={readOnly ? null : setInitCoords}
              readOnly={readOnly}
            />
          ))}
          {relationships.map((e, i) => (
            <Relationship key={i} data={e} />
          ))}
          {tables.map((table) => (
            <Table
              key={table.id}
              tableData={table}
              setHoveredTable={readOnly ? null : setHoveredTable}
              handleGripField={readOnly ? null : handleGripField}
              setLinkingLine={readOnly ? null : setLinkingLine}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, table.id, ObjectType.TABLE)
              }
              readOnly={readOnly}
            />
          ))}
          {linking && !readOnly && (
            <path
              d={`M ${linkingLine.startX} ${linkingLine.startY} L ${linkingLine.endX} ${linkingLine.endY}`}
              stroke="red"
              strokeDasharray="8,8"
              className="pointer-events-none touch-none"
            />
          )}
          {notes.map((n) => (
            <Note
              key={n.id}
              data={n}
              onPointerDown={(e) =>
                handlePointerDownOnElement(e, n.id, ObjectType.NOTE)
              }
              readOnly={readOnly}
            />
          ))}
        </svg>
      </div>
      {settings.showDebugCoordinates && (
        <div className="fixed flex flex-col flex-wrap gap-6 bg-[rgba(var(--semi-grey-1),var(--tw-bg-opacity))]/40 border border-color bottom-4 right-4 p-4 rounded-xl backdrop-blur-xs pointer-events-none select-none">
          <table className="table-auto grow">
            <thead>
              <tr>
                <th className="text-left" colSpan={3}>
                  {t("transform")}
                </th>
              </tr>
              <tr className="italic [&_th]:font-normal [&_th]:text-right">
                <th>pan x</th>
                <th>pan y</th>
                <th>scale</th>
              </tr>
            </thead>
            <tbody className="[&_td]:text-right [&_td]:min-w-[8ch]">
              <tr>
                <td>{transform.pan.x.toFixed(2)}</td>
                <td>{transform.pan.y.toFixed(2)}</td>
                <td>{transform.zoom.toFixed(4)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={4}>{t("viewbox")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>left</th>
                <th>top</th>
                <th>width</th>
                <th>height</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{viewBox.left.toFixed(2)}</td>
                <td>{viewBox.top.toFixed(2)}</td>
                <td>{viewBox.width.toFixed(2)}</td>
                <td>{viewBox.height.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
          <table className="table-auto grow [&_th]:text-left [&_th:not(:first-of-type)]:text-right [&_td:not(:first-of-type)]:text-right [&_td]:min-w-[8ch]">
            <thead>
              <tr>
                <th colSpan={3}>{t("cursor_coordinates")}</th>
              </tr>
              <tr className="italic [&_th]:font-normal">
                <th>{t("coordinate_space")}</th>
                <th>x</th>
                <th>y</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{t("coordinate_space_screen")}</td>
                <td>{pointer.spaces.screen.x.toFixed(2)}</td>
                <td>{pointer.spaces.screen.y.toFixed(2)}</td>
              </tr>
              <tr>
                <td>{t("coordinate_space_diagram")}</td>
                <td>{pointer.spaces.diagram.x.toFixed(2)}</td>
                <td>{pointer.spaces.diagram.y.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}