import { useState, useEffect, useCallback, createContext } from "react";
import ControlPanel from "./EditorHeader/ControlPanel";
import Canvas from "./EditorCanvas/Canvas";
import { CanvasContextProvider } from "../context/CanvasContext";
import SidePanel from "./EditorSidePanel/SidePanel";
import { DB, State } from "../data/constants";
import { db } from "../data/db";
import {
  useLayout,
  useSettings,
  useTransform,
  useDiagram,
  useUndoRedo,
  useAreas,
  useNotes,
  useTypes,
  useTasks,
  useSaveState,
  useEnums,
} from "../hooks";
import FloatingControls from "./FloatingControls";
import { Modal } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { databases } from "../data/databases";
import { isRtl } from "../i18n/utils/rtl";
import { useNavigate } from "react-router-dom";
import { diagramApi } from "../services/api";

// 仍然保留IdContext以避免其他组件依赖问题，但不再使用gistId
export const IdContext = createContext({ gistId: "" });

export default function WorkSpace({ diagramId }) {
  const [id, setId] = useState(diagramId ? parseInt(diagramId) : 0);
  // 保留setGistId以备其他组件调用，但实际不再使用
  const [gistId, setGistId] = useState("");
  const [title, setTitle] = useState("Untitled Diagram");
  const [resize, setResize] = useState(false);
  const [width, setWidth] = useState(340);
  const [lastSaved, setLastSaved] = useState("");
  const [showSelectDbModal, setShowSelectDbModal] = useState(false);
  const [selectedDb, setSelectedDb] = useState("");
  const { layout } = useLayout();
  const { settings } = useSettings();
  const { types, setTypes } = useTypes();
  const { areas, setAreas } = useAreas();
  const { tasks, setTasks } = useTasks();
  const { notes, setNotes } = useNotes();
  const { saveState, setSaveState } = useSaveState();
  const { transform, setTransform } = useTransform();
  const { enums, setEnums } = useEnums();
  const navigate = useNavigate();
  const {
    tables,
    relationships,
    setTables,
    setRelationships,
    database,
    setDatabase,
  } = useDiagram();
  const { undoStack, redoStack, setUndoStack, setRedoStack } = useUndoRedo();
  const { t, i18n } = useTranslation();
  
  const handleResize = (e) => {
    if (!resize) return;
    const w = isRtl(i18n.language) ? window.innerWidth - e.clientX : e.clientX;
    if (w > 340) setWidth(w);
  };

  const load = useCallback(async () => {
    try {
      // 加载指定ID的图表
      if (diagramId) {
        const diagram = await diagramApi.getById(diagramId);
        if (diagram) {
          if (diagram.database) {
            setDatabase(diagram.database);
          } else {
            setDatabase(DB.GENERIC);
          }
          setId(diagram.id);
          setTitle(diagram.name);
          setTables(diagram.tables);
          setRelationships(diagram.references);
          setAreas(diagram.areas);
          setNotes(diagram.notes);
          setTasks(diagram.todos ?? []);
          setTransform({
            pan: diagram.pan,
            zoom: diagram.zoom,
          });
          setUndoStack([]);
          setRedoStack([]);
          if (databases[diagram.database]?.hasTypes) {
            setTypes(diagram.types ?? []);
          }
          if (databases[diagram.database]?.hasEnums) {
            setEnums(diagram.enums ?? []);
          }
          return; // 已加载指定图表，无需继续
        }
      }

      // 如果是直接进入/editor路径（无ID），则显示选择数据库对话框，不做自动重定向
      if (!diagramId) {
        if (selectedDb === "") setShowSelectDbModal(true);
        return;
      }

      // 尝试加载最新的图表或显示选择数据库对话框
      const latestDiagram = await diagramApi.getLatest();
      if (latestDiagram) {
        if (latestDiagram.database) {
          setDatabase(latestDiagram.database);
        } else {
          setDatabase(DB.GENERIC);
        }
        setId(latestDiagram.id);
        setTitle(latestDiagram.name);
        setTables(latestDiagram.tables);
        setRelationships(latestDiagram.references);
        setNotes(latestDiagram.notes);
        setAreas(latestDiagram.areas);
        setTasks(latestDiagram.todos ?? []);
        setTransform({
          pan: latestDiagram.pan,
          zoom: latestDiagram.zoom,
        });
        if (databases[latestDiagram.database]?.hasTypes) {
          setTypes(latestDiagram.types ?? []);
        }
        if (databases[latestDiagram.database]?.hasEnums) {
          setEnums(latestDiagram.enums ?? []);
        }
        navigate(`/editor/${latestDiagram.id}`, { replace: true });
      } else {
        if (selectedDb === "") setShowSelectDbModal(true);
      }
    } catch (error) {
      console.error('加载图表失败:', error);
      if (selectedDb === "") setShowSelectDbModal(true);
    }
  }, [
    diagramId,
    selectedDb,
    setDatabase,
    setTables,
    setRelationships,
    setNotes,
    setAreas,
    setTasks,
    setTransform,
    setUndoStack,
    setRedoStack,
    setTypes,
    setEnums,
    navigate
  ]);

  const save = useCallback(async () => {
    if (saveState !== State.SAVING) return;

    try {
      const diagramData = {
        database: database,
        name: title,
        gistId: gistId ?? "",
        lastModified: new Date(),
        tables: tables,
        references: relationships,
        notes: notes,
        areas: areas,
        todos: tasks,
        pan: transform.pan,
        zoom: transform.zoom,
        loadedFromGistId: gistId,
        ...(databases[database].hasEnums && { enums: enums }),
        ...(databases[database].hasTypes && { types: types }),
      };

      if (id === 0) {
        // 新建图表
        const newDiagram = await diagramApi.create(diagramData);
        setId(newDiagram.id);
        navigate(`/editor/${newDiagram.id}`, { replace: true });
        setSaveState(State.SAVED);
        setLastSaved(new Date().toLocaleString());
      } else {
        // 更新图表
        await diagramApi.update(id, diagramData);
        setSaveState(State.SAVED);
        setLastSaved(new Date().toLocaleString());
      }
    } catch (error) {
      console.error('保存图表失败:', error);
      setSaveState(State.ERROR);
    }
  }, [
    tables,
    relationships,
    notes,
    areas,
    types,
    title,
    id,
    tasks,
    transform,
    setSaveState,
    database,
    enums,
    gistId,
    saveState,
    navigate
  ]);

  useEffect(() => {
    if (
      tables?.length === 0 &&
      areas?.length === 0 &&
      notes?.length === 0 &&
      types?.length === 0 &&
      tasks?.length === 0
    )
      return;

    if (settings.autosave) {
      setSaveState(State.SAVING);
    }
  }, [
    undoStack,
    redoStack,
    settings.autosave,
    tables?.length,
    areas?.length,
    notes?.length,
    types?.length,
    relationships?.length,
    tasks?.length,
    transform.zoom,
    title,
    gistId,
    setSaveState,
  ]);

  useEffect(() => {
    save();
  }, [saveState, save]);

  useEffect(() => {
    document.title = "Editor | drawDB";

    load();
  }, [load]);

  return (
    <div className="h-full flex flex-col overflow-hidden theme">
      <IdContext.Provider value={{ gistId, setGistId }}>
        <ControlPanel
          diagramId={id}
          setDiagramId={setId}
          title={title}
          setTitle={setTitle}
          lastSaved={lastSaved}
          setLastSaved={setLastSaved}
        />
      </IdContext.Provider>
      <div
        className="flex h-full overflow-y-auto"
        onPointerUp={(e) => e.isPrimary && setResize(false)}
        onPointerLeave={(e) => e.isPrimary && setResize(false)}
        onPointerMove={(e) => e.isPrimary && handleResize(e)}
        onPointerDown={(e) => {
          // Required for onPointerLeave to trigger when a touch pointer leaves
          // https://stackoverflow.com/a/70976017/1137077
          e.target.releasePointerCapture(e.pointerId);
        }}
        style={isRtl(i18n.language) ? { direction: "rtl" } : {}}
      >
        {layout.sidebar && (
          <SidePanel resize={resize} setResize={setResize} width={width} />
        )}
        <div className="relative w-full h-full overflow-hidden">
          <CanvasContextProvider className="h-full w-full">
            <Canvas saveState={saveState} setSaveState={setSaveState} />
          </CanvasContextProvider>
          {!(layout.sidebar || layout.toolbar || layout.header) && (
            <div className="fixed right-5 bottom-4">
              <FloatingControls />
            </div>
          )}
        </div>
      </div>
      <Modal
        centered
        size="medium"
        closable={false}
        hasCancel={false}
        title={t("pick_db")}
        okText={t("confirm")}
        visible={showSelectDbModal}
        onOk={() => {
          if (selectedDb === "") return;
          setDatabase(selectedDb);
          setShowSelectDbModal(false);
        }}
        okButtonProps={{ disabled: selectedDb === "" }}
      >
        <div className="grid grid-cols-3 gap-4 place-content-center">
          {Object.values(databases).map((x) => (
            <div
              key={x.name}
              onClick={() => setSelectedDb(x.label)}
              className={`space-y-3 py-3 px-4 rounded-md border-2 select-none ${
                settings.mode === "dark"
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-zinc-100 hover:bg-zinc-200"
              } ${selectedDb === x.label ? "border-zinc-400" : "border-transparent"}`}
            >
              <div className="font-semibold">{x.name}</div>
              {x.image && (
                <img
                  src={x.image}
                  className="h-10"
                  style={{
                    filter:
                      "opacity(0.4) drop-shadow(0 0 0 white) drop-shadow(0 0 0 white)",
                  }}
                />
              )}
              <div className="text-xs">{x.description}</div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
