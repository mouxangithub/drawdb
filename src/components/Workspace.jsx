import { useState, useEffect, useCallback, createContext, useRef } from "react";
import ControlPanel from "./EditorHeader/ControlPanel";
import Canvas from "./EditorCanvas/Canvas";
import { CanvasContextProvider } from "../context/CanvasContext";
import SidePanel from "./EditorSidePanel/SidePanel";
import { DB, State, Action, ObjectType } from "../data/constants";
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
  useWebSocket,
} from "../hooks";
import FloatingControls from "./common/ZoomControl";
import { Modal, Toast } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import { databases } from "../data/databases";
import { isRtl } from "../i18n/utils/rtl";
import { useNavigate } from "react-router-dom";
import { diagramApi } from "../services/api";
import { diagramWebSocketApi } from "../services/diagramWebSocketService";
import { useCollaboration } from "../context/CollaborationContext";

/**
 * 将视图状态保存到本地存储
 * @param {string|number} diagramId - 图表ID
 * @param {Object} viewState - 视图状态，包含pan和zoom
 */
const saveViewStateToLocalStorage = (diagramId, viewState) => {
  try {
    if (!diagramId) return;

    const key = `drawdb_viewstate_${diagramId}`;
    const data = {
      pan: viewState.pan,
      zoom: viewState.zoom,
      timestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.warn("保存视图状态到本地存储失败:", error);
  }
};

/**
 * 从本地存储获取视图状态
 * @param {string|number} diagramId - 图表ID
 * @returns {Object|null} 视图状态对象或null
 */
const getViewStateFromLocalStorage = (diagramId) => {
  try {
    if (!diagramId) return null;

    const key = `drawdb_viewstate_${diagramId}`;
    const data = localStorage.getItem(key);

    if (!data) return null;

    return JSON.parse(data);
  } catch (error) {
    console.warn("从本地存储获取视图状态失败:", error);
    return null;
  }
};

// 仍然保留IdContext以避免其他组件依赖问题，但不再使用gistId
export const IdContext = createContext({ gistId: "" });

// 添加调试模式标志，默认关闭
const DEBUG_MODE = false;

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
  // 添加连接状态跟踪
  const [hasInitiatedConnection, setHasInitiatedConnection] = useState(false);

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
  const { connect, disconnect, connected } = useWebSocket();
  const { sendCollaborationOperation, isCollaborating } = useCollaboration();

  // 是否正在处理远程操作（防止循环）
  const [processedOperation, setProcessedOperation] = useState(false);
  // 是否正在加载图表数据
  const [isLoadingData, setIsLoadingData] = useState(false);
  // 加载是否已完成
  const [loadingComplete, setLoadingComplete] = useState(false);

  // 添加记忆化的加载标志，防止对同一ID重复加载
  const loadedDiagramRef = useRef(null);

  // 添加操作ID跟踪集合
  const sentOperationIds = useRef(new Set());

  // 存储本地用户ID
  const localUserId = useRef(localStorage.getItem("drawdb_user_id") || null);

  // 在组件挂载时生成并存储本地用户ID（如果不存在）
  useEffect(() => {
    if (!localUserId.current) {
      const newUserId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem("drawdb_user_id", newUserId);
      localUserId.current = newUserId;
    }
  }, []);

  // 使用节流函数减少频繁操作的处理
  const throttle = (func, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        return func(...args);
      }
    };
  };

  const handleResize = (e) => {
    if (!resize) return;
    const w = isRtl(i18n.language) ? window.innerWidth - e.clientX : e.clientX;
    if (w > 340) setWidth(w);
  };

  // 获取操作图标（可视化增强）
  const getOperationIcon = (type) => {
    if (type.includes("table")) return "icon-table";
    if (type.includes("relationship")) return "icon-relationship";
    if (type.includes("note")) return "icon-note";
    if (type.includes("area")) return "icon-area";
    if (type.includes("title")) return "icon-title";
    return "icon-data";
  };

  // 获取操作类型的中文名称
  const getOperationActionName = (type) => {
    if (type.includes("add")) return "添加了";
    if (type.includes("update")) return "更新了";
    if (type.includes("delete")) return "删除了";
    return "修改了";
  };

  // 获取操作类别的名称
  const getOperationCategoryName = (type) => {
    if (type.includes("table")) return "表格";
    if (type.includes("relationship")) return "关系";
    if (type.includes("note")) return "注释";
    if (type.includes("area")) return "区域";
    if (type.includes("title")) return "标题";
    return "数据";
  };

  // 增强版检测是否是频繁操作函数
  const isFrequentOperation = (operationType) => {
    try {
      // 初始化或获取全局跟踪对象
      if (!window.sentOperationsTracker) {
        window.sentOperationsTracker = {
          operations: {},
          cleanupTime: Date.now(),
          globalActivity: 0, // 全局活动指标
        };
      }

      const tracker = window.sentOperationsTracker;
      const now = Date.now();

      // 更新全局活动指标
      tracker.globalActivity++;

      // 每30秒重置全局活动指标
      if (!tracker.lastGlobalReset || now - tracker.lastGlobalReset > 30000) {
        tracker.globalActivity = 0;
        tracker.lastGlobalReset = now;
      }

      // 系统活动频率高时，更积极地静默处理
      const isSystemBusy = tracker.globalActivity > 20;

      // 定期清理旧记录（超过10秒的记录）
      if (now - tracker.cleanupTime > 10000) {
        for (const key in tracker.operations) {
          if (now - tracker.operations[key].lastTime > 10000) {
            delete tracker.operations[key];
          }
        }
        tracker.cleanupTime = now;
      }

      // 获取操作类型的基本类别
      const baseType = operationType.split("_")[0]; // 如table_add -> table

      // 查找该类型的最近操作记录
      if (!tracker.operations[baseType]) {
        tracker.operations[baseType] = {
          count: 1,
          lastTime: now,
          silent: false,
        };
        return false; // 第一次操作，不静默
      }

      const record = tracker.operations[baseType];

      // 判断是否在短时间内（系统忙时缩短时间窗口）
      const timeWindow = isSystemBusy ? 1500 : 2000;

      if (now - record.lastTime < timeWindow) {
        record.count++;
        record.lastTime = now;

        // 系统忙时，更快进入静默模式
        const silentThreshold = isSystemBusy ? 2 : 3;

        // 如果在短时间内连续进行了多次操作，静默处理
        if (record.count >= silentThreshold) {
          record.silent = true;
          return true;
        }
      } else {
        // 超过时间窗口，重置计数
        record.count = 1;
        record.lastTime = now;
        record.silent = false;
      }

      return record.silent;
    } catch (error) {
      console.warn("检测频繁操作出错:", error);
      return false; // 发生错误时不静默
    }
  };

  // WebSocket数据变更监听
  useEffect(() => {
    // 防止短时间内重复请求图表数据
    let lastDiagramRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 500; // 减少最小请求间隔为500毫秒

    // 操作批处理队列
    const operationQueue = {
      operations: [],
      lastFlush: Date.now(),
      isProcessing: false,

      // 添加操作到队列
      addOperation(operation) {
        // 高优先级操作（如forceUpdate=true）直接处理，不进入队列
        if (operation.forceUpdate) {
          this.processOperation(operation);
          return;
        }

        // 对于同类型的拖拽操作，只保留最新的
        if (operation.isDrag && operation.type === "diagram_updated") {
          // 移除队列中同类型的拖拽操作
          this.operations = this.operations.filter(
            (op) => !(op.isDrag && op.type === "diagram_updated"),
          );
        }

        // 添加到队列
        this.operations.push(operation);

        // 如果队列长度超过阈值或已经过了足够时间，立即处理
        const now = Date.now();
        const shouldFlushImmediately =
          this.operations.length > 3 || // 队列长度超过3
          now - this.lastFlush > 1000; // 上次处理已超过1秒

        if (shouldFlushImmediately && !this.isProcessing) {
          this.flush();
        }
      },

      // 批量处理队列中的操作
      async flush() {
        if (this.isProcessing || this.operations.length === 0) return;

        this.isProcessing = true;
        this.lastFlush = Date.now();

        // 首先处理影响较大的操作（如删除、更新等）
        const priorityOps = this.operations.filter(
          (op) =>
            op.type.includes("delete") ||
            (op.type === "diagram_updated" && !op.isDrag),
        );

        if (priorityOps.length > 0) {
          // 处理优先级高的操作
          for (const op of priorityOps) {
            await this.processOperation(op);
            // 从队列中移除
            this.operations = this.operations.filter((item) => item !== op);
          }
        }

        // 如果还有操作，继续处理
        if (this.operations.length > 0) {
          // 拖拽操作只保留最新的一个
          const dragOps = this.operations.filter(
            (op) => op.isDrag && op.type === "diagram_updated",
          );

          if (dragOps.length > 0) {
            // 只处理最新的拖拽操作
            const latestDragOp = dragOps[dragOps.length - 1];
            await this.processOperation(latestDragOp);

            // 移除所有拖拽操作
            this.operations = this.operations.filter(
              (op) => !(op.isDrag && op.type === "diagram_updated"),
            );
          }

          // 处理剩余的操作
          for (const op of [...this.operations]) {
            await this.processOperation(op);
            // 从队列中移除
            this.operations = this.operations.filter((item) => item !== op);

            // 每处理一个操作暂停一下，避免浏览器卡顿
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        this.isProcessing = false;
      },

      // 处理单个操作
      async processOperation(operation) {
        try {
          // 标记正在处理远程操作
          setProcessedOperation(true);

          // 根据操作类型处理
          if (operation.type === "diagram_updated") {
            // 处理图表更新
            if (operation.hasCompleteData && operation.data) {
              const diagram = operation.data;

              // 更新图表数据
              setTables(diagram.tables || []);
              setRelationships(diagram.references || []);
              setNotes(diagram.notes || []);
              setAreas(diagram.areas || []);
              setTitle(diagram.name || "Untitled Diagram");

              // 如果有类型和枚举数据，也更新
              if (databases[diagram.database]?.hasTypes && diagram.types) {
                setTypes(diagram.types);
              }
              if (databases[diagram.database]?.hasEnums && diagram.enums) {
                setEnums(diagram.enums);
              }

              // 更新"上次保存"时间
              if (operation.lastModified) {
                const lastModifiedDate = new Date(operation.lastModified);
                setLastSaved(lastModifiedDate.toLocaleString());
              } else {
                setLastSaved(new Date().toLocaleString());
              }
            }
            return;
          }

          // 处理其他类型的操作
          switch (operation.type) {
            case "table_add":
              setTables((prev) => [...prev, operation.data]);
              break;
            case "table_update":
              setTables((prev) =>
                prev.map((t) =>
                  t.id === operation.data.id ? operation.data : t,
                ),
              );
              break;
            case "table_delete":
              setTables((prev) => prev.filter((t) => t.id !== operation.data.id));
              break;
            case "relationship_add":
              setRelationships((prev) => [...prev, operation.data]);
              break;
            case "relationship_update":
              setRelationships((prev) =>
                prev.map((r) =>
                  r.id === operation.data.id ? operation.data : r,
                ),
              );
              break;
            case "relationship_delete":
              setRelationships((prev) =>
                prev.filter((r) => r.id !== operation.data.id),
              );
              break;
            case "note_add":
              setNotes((prev) => [...prev, operation.data]);
              break;
            case "note_update":
              setNotes((prev) =>
                prev.map((n) =>
                  n.id === operation.data.id ? operation.data : n,
                ),
              );
              break;
            case "note_delete":
              setNotes((prev) => prev.filter((n) => n.id !== operation.data.id));
              break;
            case "area_add":
              setAreas((prev) => [...prev, operation.data]);
              break;
            case "area_update":
              setAreas((prev) =>
                prev.map((a) =>
                  a.id === operation.data.id ? operation.data : a,
                ),
              );
              break;
            case "area_delete":
              setAreas((prev) => prev.filter((a) => a.id !== operation.data.id));
              break;
            case "title_update":
              setTitle(operation.data);
              break;
            case "full_update":
              // 整个图表的更新
              if (operation.data) {
                setTables(operation.data.tables || []);
                setRelationships(operation.data.references || []);
                setNotes(operation.data.notes || []);
                setAreas(operation.data.areas || []);
                setTitle(operation.data.name || "Untitled Diagram");
              }
              break;
            default:
              console.warn("未知的协作操作类型:", operation.type);
          }
        } catch (error) {
          console.error("处理批量操作出错:", error);
        } finally {
          // 重置处理标记
          setTimeout(() => setProcessedOperation(false), 100);
        }
      },
    };

    // 获取图表数据的函数
    const fetchDiagramData = async () => {
      if (!diagramId) return null;

      const now = Date.now();
      // 如果距离上次请求时间太短，则跳过
      if (now - lastDiagramRequestTime < MIN_REQUEST_INTERVAL) {
        return null;
      }

      lastDiagramRequestTime = now;

      try {
        // 直接使用API获取数据，绕过WebSocket获取最新图表数据
        if (DEBUG_MODE) console.log("直接从API获取图表数据:", diagramId);
        const response = await diagramWebSocketApi.getById(diagramId);
        return response;
      } catch (error) {
        console.error("获取图表数据失败:", error);
        return null;
      }
    };

    // 处理协作操作事件
    const handleCollaborationEvent = async (event) => {
      if (!event.detail) return;

      const operation = event.detail;

      // 保存相关操作特殊处理
      if (
        operation.type === "save_diagram" ||
        operation.type === "save_success"
      ) {
        // 获取本地客户端ID
        const localClientId = localStorage.getItem("drawdb_client_id");

        // 如果有保存操作ID，检查是否已处理过
        if (operation.saveOperationId) {
          const savedOperationIds = window.savedOperationIds || new Set();
          if (savedOperationIds.has(operation.saveOperationId)) {
            console.log(`跳过已处理的保存操作: ${operation.saveOperationId}`);
            return;
          }
        }

        // 如果不是本客户端发起的保存操作，不处理
        if (
          operation.sourceClientId &&
          operation.sourceClientId !== localClientId
        ) {
          console.log(`跳过其他客户端(${operation.sourceClientId})的保存操作`);
          return;
        }
      }

      // 添加自发事件过滤
      if (operation.sourceUserId === localUserId.current) {
        // 检查是否是我们自己发出的操作
        if (
          operation.operationId &&
          sentOperationIds.current.has(operation.operationId)
        ) {
          console.log(
            "忽略自己发送的广播事件:",
            operation.type,
            operation.operationId,
          );
          return; // 跳过处理
        }
      }

      // 将操作添加到批处理队列
      operationQueue.addOperation(operation);
    };

    // 处理保存成功事件
    const handleSaveSuccess = (event) => {
      // 检查消息来源
      if (event.detail && event.detail.sourceClientId) {
        // 获取本地客户端ID
        const localClientId = localStorage.getItem("drawdb_client_id");

        // 如果不是本客户端发起的保存操作，不处理
        if (localClientId && event.detail.sourceClientId !== localClientId) {
          console.log(
            `[Workspace] 跳过其他客户端(${event.detail.sourceClientId})的保存成功事件`,
          );
          return;
        }
      }

      // 只有确认是自己的保存请求才处理
      if (event.detail) {
        // 更新最后保存时间
        setLastSaved(new Date());

        // 清除未保存标记
        setSaveState(State.SAVED);

        // 显示保存成功消息
        Toast.info({
          content: "保存成功",
          duration: 3000,
        });

        // 如果是初次保存，更新URL（不刷新页面）
        if (event.detail.isNew && event.detail.id && !diagramId) {
          window.history.pushState(
            {},
            `编辑器 - ${event.detail.name || "未命名图表"}`,
            `/editor/${event.detail.id}`,
          );
        }
      }
    };

    // 每500毫秒自动flush操作队列
    const queueInterval = setInterval(() => {
      operationQueue.flush();
    }, 500);

    // 辅助函数：使用数据更新图表
    const updateDiagramWithData = (diagram) => {
      if (!diagram) return;

      // 更新整个图表数据
      setTables(diagram.tables || []);
      setRelationships(diagram.references || []);
      setNotes(diagram.notes || []);
      setAreas(diagram.areas || []);
      setTitle(diagram.name || "Untitled Diagram");

      // 不再同步画布位置和缩放比例，每个用户保持自己的视图状态
      // if (diagram.pan && diagram.zoom) {
      //   setTransform({
      //     pan: diagram.pan,
      //     zoom: diagram.zoom
      //   });
      // }

      // 如果有类型和枚举数据，也更新它们
      if (databases[diagram.database]?.hasTypes && diagram.types) {
        setTypes(diagram.types);
      }
      if (databases[diagram.database]?.hasEnums && diagram.enums) {
        setEnums(diagram.enums);
      }

      // 更新"上次保存"时间
      if (diagram.lastModified) {
        // 如果图表数据中包含lastModified字段，使用该时间
        const lastModifiedDate = new Date(diagram.lastModified);
        setLastSaved(lastModifiedDate.toLocaleString());
      } else {
        // 否则使用当前时间
        setLastSaved(new Date().toLocaleString());
      }

      // 显示通知，但减少频率
      if (!diagram.silent) {
        // 只在有重要更新时才显示通知
        if (diagram.isImportant) {
          Toast.info(`${diagram.sender || "协作者"}更新了图表`);
        }
      }
    };

    // 添加事件监听器
    document.addEventListener(
      "collaboration_operation",
      handleCollaborationEvent,
    );
    document.addEventListener("save_success", handleSaveSuccess);

    // 清理函数
    return () => {
      document.removeEventListener(
        "collaboration_operation",
        handleCollaborationEvent,
      );
      document.removeEventListener("save_success", handleSaveSuccess);
      clearInterval(queueInterval);
    };
  }, [
    setTables,
    setRelationships,
    setNotes,
    setAreas,
    setTitle,
    setTransform,
    setLastSaved,
    setTypes,
    setEnums,
    setSaveState,
  ]);

  // 监听并拦截模型更改，向协作者发送操作
  useEffect(() => {
    // 如果是正在处理远程操作，或者没有启用协作，则不发送操作
    if (processedOperation || !isCollaborating) return;

    // 检测到状态变化，确定是否有需要发送的操作
    const latestUndoStackOp = undoStack[undoStack.length - 1];
    if (!latestUndoStackOp) return;

    // 从撤销栈中提取最新操作并转换为标准协作操作格式
    let operationType, operationData;
    let isDragOperation = false;

    // 检查是否是拖动操作
    if (
      latestUndoStackOp.action === Action.EDIT &&
      latestUndoStackOp.detail &&
      latestUndoStackOp.detail.includes("move")
    ) {
      isDragOperation = true;
    }

    // 只处理添加/删除/编辑操作
    if (
      ![Action.ADD, Action.DELETE, Action.EDIT].includes(
        latestUndoStackOp.action,
      )
    ) {
      return;
    }

    switch (latestUndoStackOp.action) {
      case Action.ADD:
        // 处理添加操作
        switch (latestUndoStackOp.element) {
          case ObjectType.TABLE: {
            // 查找最新添加的表
            const addedTable = tables[tables.length - 1];
            if (addedTable) {
              operationType = "table_add";
              operationData = addedTable;
            }
            break;
          }
          case ObjectType.RELATIONSHIP:
            operationType = "relationship_add";
            operationData = latestUndoStackOp.data;
            break;
          case ObjectType.NOTE: {
            const addedNote = notes[notes.length - 1];
            if (addedNote) {
              operationType = "note_add";
              operationData = addedNote;
            }
            break;
          }
          case ObjectType.AREA: {
            const addedArea = areas[areas.length - 1];
            if (addedArea) {
              operationType = "area_add";
              operationData = addedArea;
            }
            break;
          }
        }
        break;

      case Action.DELETE:
        // 处理删除操作
        switch (latestUndoStackOp.element) {
          case ObjectType.TABLE:
            operationType = "table_delete";
            operationData = { id: latestUndoStackOp.data.table.id };
            break;
          case ObjectType.RELATIONSHIP:
            operationType = "relationship_delete";
            operationData = { id: latestUndoStackOp.data.id };
            break;
          case ObjectType.NOTE:
            operationType = "note_delete";
            operationData = { id: latestUndoStackOp.data.id };
            break;
          case ObjectType.AREA:
            operationType = "area_delete";
            operationData = { id: latestUndoStackOp.data.id };
            break;
        }
        break;

      case Action.EDIT:
        // 处理编辑操作
        switch (latestUndoStackOp.element) {
          case ObjectType.TABLE: {
            // 查找被编辑的表
            const editedTable = tables.find(
              (t) => t.id === latestUndoStackOp.tid,
            );
            if (editedTable) {
              operationType = "table_update";
              operationData = editedTable;
            }
            break;
          }
          case ObjectType.RELATIONSHIP: {
            const editedRelationship = relationships.find(
              (r) => r.id === latestUndoStackOp.rid,
            );
            if (editedRelationship) {
              operationType = "relationship_update";
              operationData = editedRelationship;
            }
            break;
          }
          case ObjectType.NOTE: {
            const editedNote = notes.find(
              (n) => n.id === latestUndoStackOp.nid,
            );
            if (editedNote) {
              operationType = "note_update";
              operationData = editedNote;
            }
            break;
          }
          case ObjectType.AREA: {
            const editedArea = areas.find(
              (a) => a.id === latestUndoStackOp.aid,
            );
            if (editedArea) {
              operationType = "area_update";
              operationData = editedArea;
            }
            break;
          }
        }
        break;
    }

    // 如果成功构建了操作，发送到协作上下文
    if (operationType && operationData) {
      // 判断是否应该静默发送（无通知）
      const shouldBeSilent =
        // 拖动操作始终静默
        isDragOperation ||
        // 在短时间内发送的多个相同类型操作静默处理
        isFrequentOperation(operationType);

      // 生成唯一操作ID
      const operationId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 将操作ID添加到跟踪集合
      sentOperationIds.current.add(operationId);

      // 自动清理过期的操作ID（5秒后）
      setTimeout(() => {
        sentOperationIds.current.delete(operationId);
      }, 5000);

      // 发送协作操作，添加更多控制选项
      sendCollaborationOperation({
        type: operationType,
        data: operationData,
        isDrag: isDragOperation, // 标识是否为拖动操作
        silent: shouldBeSilent, // 是否静默更新（不显示通知）
        operationId: operationId, // 操作唯一ID，用于去重
        sourceUserId: localUserId.current, // 发送者ID
        timestamp: Date.now(), // 操作时间戳
        importance: isDragOperation ? "low" : "normal", // 操作重要性
      });

      // 对于拖动操作，额外发送diagram_updated事件，确保同步
      if (isDragOperation) {
        // 使用Promise处理广播操作，避免直接使用await
        const broadcastDiagramUpdate = () => {
          if (diagramId && diagramWebSocketApi.isConnected()) {
            // 准备完整图表数据
            const diagramData = {
              tables: tables,
              references: relationships,
              notes: notes,
              areas: areas,
              name: title,
              // 不再广播画布位置和缩放比例信息
              id: diagramId,
              database: database,
            };

            // 如果有类型和枚举数据，也一并发送
            if (databases[database]?.hasTypes) {
              diagramData.types = types;
            }
            if (databases[database]?.hasEnums) {
              diagramData.enums = enums;
            }

            // 生成操作ID用于去重
            const broadcastOperationId = `broadcast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            sentOperationIds.current.add(broadcastOperationId);

            // 自动清理过期的操作ID（5秒后）
            setTimeout(() => {
              sentOperationIds.current.delete(broadcastOperationId);
            }, 5000);

            console.log(
              "广播拖动操作更新，数据大小:",
              JSON.stringify(diagramData).length,
              "字节",
            );

            // 直接广播更新，包含完整图表数据和操作ID
            return diagramWebSocketApi
              .broadcastUpdate(diagramId, diagramData, {
                isDrag: true,
                silent: true,
                returnCompleteData: true, // 请求服务器返回完整数据
                priority: "low", // 拖动操作优先级较低
                batchable: true, // 可以和其他拖动操作合并
                operationId: broadcastOperationId, // 操作唯一ID
                sourceUserId: localUserId.current, // 发送者ID
                timestamp: Date.now(), // 操作时间戳
              })
              .then(() => {
                // 成功广播后完成
                console.log("成功广播拖动操作更新");
                return true;
              })
              .catch((error) => {
                console.warn("图表广播更新失败，回退到常规协作操作:", error);
                return false;
              });
          }
          return Promise.resolve(false);
        };

        // 先尝试广播更新，如果失败则使用常规协作操作
        broadcastDiagramUpdate().then((success) => {
          if (!success) {
            // 再次准备完整图表数据
            const diagramData = {
              tables: tables,
              references: relationships,
              notes: notes,
              areas: areas,
              name: title,
              id: diagramId,
              database: database,
            };
            
            // 如果有类型和枚举数据，也一并发送
            if (databases[database]?.hasTypes) {
              diagramData.types = types;
            }
            if (databases[database]?.hasEnums) {
              diagramData.enums = enums;
            }
            
            // 发送整个图表的更新操作
            sendCollaborationOperation({
              type: "full_update",
              data: diagramData,
              isDrag: true, // 标识这是拖动引起的更新
              silent: true, // 静默更新，不显示通知
            });
          }
        });
      }
    }
  }, [
    undoStack,
    isCollaborating,
    processedOperation,
    sendCollaborationOperation,
    tables,
    relationships,
    notes,
    areas,
    title,
    transform,
    types,
    enums,
    database,
  ]);

  const load = useCallback(async () => {
    // 检查是否是同一个图表ID并且已经加载过
    if (loadedDiagramRef.current === diagramId) {
      console.log(`图表 ${diagramId} 已加载过，无需重复加载`);
      return;
    }

    // 避免重复加载
    if (isLoadingData || loadingComplete) {
      return;
    }

    setIsLoadingData(true);

    try {
      // 加载指定ID的图表
      if (diagramId) {
        // 尝试通过WebSocket获取图表数据
        try {
          const diagram = await diagramWebSocketApi.getById(diagramId);
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

            // 优先使用本地存储的视图状态
            const savedViewState = getViewStateFromLocalStorage(diagramId);
            if (savedViewState && savedViewState.pan && savedViewState.zoom) {
              if (DEBUG_MODE) console.log("使用本地存储的视图状态");
              setTransform({
                pan: savedViewState.pan,
                zoom: savedViewState.zoom,
              });
            } else if (diagram.pan && diagram.zoom) {
              // 如果本地没有缓存，使用服务器数据（仅在初次加载时）
              if (DEBUG_MODE) console.log("使用服务器返回的视图状态（未来版本将不再支持）");
              setTransform({
                pan: diagram.pan,
                zoom: diagram.zoom,
              });
              // 保存到本地存储以便未来使用
              saveViewStateToLocalStorage(diagramId, {
                pan: diagram.pan,
                zoom: diagram.zoom,
              });
            }

            setUndoStack([]);
            setRedoStack([]);
            if (databases[diagram.database]?.hasTypes) {
              setTypes(diagram.types ?? []);
            }
            if (databases[diagram.database]?.hasEnums) {
              setEnums(diagram.enums ?? []);
            }

            // 连接到WebSocket进行协作
            if (!hasInitiatedConnection && !connected) {
              connect(diagramId);
              setHasInitiatedConnection(true);
            }

            // 标记加载完成
            setLoadingComplete(true);
            setIsLoadingData(false);
            return; // 已加载指定图表，无需继续
          }
        } catch (wsError) {
          console.warn("通过WebSocket获取图表失败，尝试HTTP方式:", wsError);

          // 如果WebSocket获取失败，回退到HTTP API
          try {
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

              // 连接到WebSocket进行协作
              if (!hasInitiatedConnection && !connected) {
                connect(diagramId);
                setHasInitiatedConnection(true);
              }

              // 标记加载完成
              setLoadingComplete(true);
              setIsLoadingData(false);
              return; // 已加载指定图表，无需继续
            }
          } catch (httpError) {
            console.error("通过HTTP API获取图表也失败:", httpError);
            // 继续下面的逻辑，可能显示选择数据库对话框
          }
        }
      }

      // 如果是直接进入/editor路径（无ID），则显示选择数据库对话框，不做自动重定向
      if (!diagramId) {
        if (selectedDb === "") setShowSelectDbModal(true);
        setIsLoadingData(false);
        return;
      }

      // 尝试加载最新的图表或显示选择数据库对话框
      try {
        // 尝试通过WebSocket获取最新图表（需要服务端支持）
        // 这里可能需要自行实现，或者回退到HTTP API
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

          // 优先使用本地存储的视图状态
          const savedViewState = getViewStateFromLocalStorage(latestDiagram.id);
          if (savedViewState && savedViewState.pan && savedViewState.zoom) {
            if (DEBUG_MODE) console.log("使用本地存储的视图状态");
            setTransform({
              pan: savedViewState.pan,
              zoom: savedViewState.zoom,
            });
          } else if (latestDiagram.pan && latestDiagram.zoom) {
            // 如果本地没有缓存，使用服务器数据（仅在初次加载时）
            if (DEBUG_MODE) console.log("使用服务器返回的视图状态（未来版本将不再支持）");
            setTransform({
              pan: latestDiagram.pan,
              zoom: latestDiagram.zoom,
            });
            // 保存到本地存储以便未来使用
            saveViewStateToLocalStorage(latestDiagram.id, {
              pan: latestDiagram.pan,
              zoom: latestDiagram.zoom,
            });
          }

          if (databases[latestDiagram.database]?.hasTypes) {
            setTypes(latestDiagram.types ?? []);
          }
          if (databases[latestDiagram.database]?.hasEnums) {
            setEnums(latestDiagram.enums ?? []);
          }

          // 连接到WebSocket进行协作
          if (!hasInitiatedConnection && !connected) {
            connect(latestDiagram.id);
            setHasInitiatedConnection(true);
          }

          navigate(`/editor/${latestDiagram.id}`, { replace: true });
        } else {
          if (selectedDb === "") setShowSelectDbModal(true);
        }
      } catch (error) {
        console.error("获取最新图表失败:", error);
        if (selectedDb === "") setShowSelectDbModal(true);
      }
    } catch (error) {
      console.error("加载图表失败:", error);
      if (selectedDb === "") setShowSelectDbModal(true);
      setIsLoadingData(false);
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
    navigate,
    connect,
    hasInitiatedConnection,
    isLoadingData,
    loadingComplete,
  ]);

  const save = useCallback(async () => {
    if (saveState !== State.SAVING) return;

    try {
      // 从本地存储获取客户端ID
      const clientId = localStorage.getItem("drawdb_client_id");

      // 生成唯一的保存请求ID
      const saveRequestId = `save_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // 生成保存操作ID，用于标识本次保存操作
      const saveOperationId = `save_op_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

      // 记录本次保存操作ID，防止重复处理
      if (typeof window !== "undefined") {
        // 获取或初始化保存操作ID集合
        const savedOperationIds = window.savedOperationIds || new Set();
        savedOperationIds.add(saveOperationId);
        window.savedOperationIds = savedOperationIds;

        // 设置自动过期，5秒后删除ID
        setTimeout(() => {
          if (window.savedOperationIds) {
            window.savedOperationIds.delete(saveOperationId);
          }
        }, 5000);
      }

      // 从保存到服务器的数据中移除pan和zoom
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
        // 不再将视图状态发送到后端
        // pan: transform.pan,
        // zoom: transform.zoom,
        loadedFromGistId: gistId,
        ...(databases[database].hasEnums && { enums: enums }),
        ...(databases[database].hasTypes && { types: types }),
        // 添加客户端标识符，用于服务端区分数据来源
        sourceClientId: clientId,
        saveRequestId: saveRequestId,
        saveOperationId: saveOperationId,
        // 添加标记表明这是保存操作
        saveOperation: true,
        // 明确指示这是非广播操作
        nonBroadcast: true,
        doNotBroadcast: true,
        privateOperation: true,
        processBySenderOnly: true,
      };

      // 将视图状态保存到本地存储
      if (id !== 0) {
        saveViewStateToLocalStorage(id, transform);
      }

      if (id === 0) {
        // 新建图表
        try {
          // 尝试通过WebSocket创建图表
          if (diagramWebSocketApi.isConnected()) {
            const newDiagram = await diagramWebSocketApi.create(diagramData);
            setId(newDiagram.id);
            navigate(`/editor/${newDiagram.id}`, { replace: true });
            setSaveState(State.SAVED);
            setLastSaved(new Date().toLocaleString());

            // 连接到WebSocket进行协作，让WebSocketContext处理连接
            if (!hasInitiatedConnection && !connected) {
              connect(newDiagram.id);
              setHasInitiatedConnection(true);
            }

            return;
          }
        } catch (wsError) {
          console.warn("通过WebSocket创建图表失败，尝试HTTP方式:", wsError);
        }

        // 如果WebSocket失败或未连接，回退到HTTP API
        const newDiagram = await diagramApi.create(diagramData);
        setId(newDiagram.id);
        navigate(`/editor/${newDiagram.id}`, { replace: true });
        setSaveState(State.SAVED);
        setLastSaved(new Date().toLocaleString());

        // 连接到WebSocket进行协作，让WebSocketContext处理连接
        if (!hasInitiatedConnection && !connected) {
          connect(newDiagram.id);
          setHasInitiatedConnection(true);
        }
      } else {
        // 更新图表
        try {
          // 尝试通过WebSocket保存图表
          if (diagramWebSocketApi.isConnected()) {
            const result = await diagramWebSocketApi.save(id, diagramData);
            setSaveState(State.SAVED);
            setLastSaved(new Date().toLocaleString());
            return;
          }
        } catch (wsError) {
          console.warn("通过WebSocket保存图表失败，尝试HTTP方式:", wsError);
        }

        // 如果WebSocket失败或未连接，回退到HTTP API
        await diagramApi.update(id, diagramData);
        setSaveState(State.SAVED);
        setLastSaved(new Date().toLocaleString());
      }
    } catch (error) {
      console.error("保存图表失败:", error);
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
    setSaveState,
    database,
    enums,
    gistId,
    saveState,
    navigate,
    connected,
    connect,
    hasInitiatedConnection,
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

    if (settings.autosave && !loadingComplete) {
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

  // 当图表加载完成时，记录已加载的图表ID
  useEffect(() => {
    if (loadingComplete && diagramId) {
      loadedDiagramRef.current = diagramId;
    }
  }, [loadingComplete, diagramId]);

  // 监听视图状态变化，保存到本地存储
  useEffect(() => {
    if (!id || id === 0) return;

    // 使用防抖处理，避免频繁保存
    const debounceTimer = setTimeout(() => {
      saveViewStateToLocalStorage(id, transform);
    }, 1000);

    return () => clearTimeout(debounceTimer);
  }, [id, transform.pan.x, transform.pan.y, transform.zoom]);

  useEffect(() => {
    document.title = "Editor | drawDB";

    // 只在组件首次渲染或diagramId变化时加载
    // 加入额外检查避免重复加载
    if (!loadingComplete && loadedDiagramRef.current !== diagramId) {
      load();
    }

    // 只在组件卸载且不是重新渲染同一个图表时断开WebSocket连接
    return () => {
      // 记录当前正在卸载的图表ID，用于判断是否需要断开连接
      const unmountingDiagramId = diagramId;

      // 延迟执行断开连接操作，避免在路由快速切换时频繁断开重连
      setTimeout(() => {
        // 获取当前URL中的图表ID
        const currentPath = window.location.pathname;
        const currentDiagramIdMatch = currentPath.match(/\/editor\/([^/]+)/);
        const currentDiagramId = currentDiagramIdMatch
          ? currentDiagramIdMatch[1]
          : null;

        // 只有当前URL不包含相同的图表ID时才断开连接
        if (currentDiagramId !== unmountingDiagramId) {
          disconnect();
        }
      }, 100); // 短暂延迟，确保在路由更新后检查

      // 无论如何都重置组件状态
      setHasInitiatedConnection(false);
      setLoadingComplete(false);
    };
  }, [load, disconnect, loadingComplete, diagramId]);

  // 处理画布变换事件，保存视图状态
  const handleTransformChange = useCallback(
    (newTransform) => {
      setTransform(newTransform);

      // 如果有有效的图表ID，保存视图状态到本地
      if (id && id !== 0) {
        // 这里不需要立即保存，因为我们已经有一个基于transform变化的useEffect
        // 它会使用防抖逻辑保存状态
      }
    },
    [id, setTransform],
  );

  // 处理WebSocket消息事件
  const handleWebSocketMessage = useCallback((event) => {
    // 确保event存在且有数据
    if (!event) return;
    
    // 处理不同格式的事件
    const message = event.data ? 
      (typeof event.data === 'string' ? JSON.parse(event.data) : event.data) : 
      (event.detail ? event.detail : null);
    
    if (!message) {
      console.warn('收到无效的WebSocket消息:', event);
      return;
    }
    
    const { type } = message;

    if (type === "diagram_data") {
      // 更新图表数据
      const diagramData = message.diagram;
      if (diagramData) {
        // 完成加载
        setIsLoadingData(false);
        setLoadingComplete(true);
        // 更新上次保存时间
        if (diagramData.lastModified) {
          const lastModifiedDate = new Date(diagramData.lastModified);
          setLastSaved(lastModifiedDate.toLocaleString());
        } else {
          setLastSaved(new Date().toLocaleString());
        }
        // 更新保存状态为已保存
        setSaveState(State.SAVED);
      }
    }

    // 其他WebSocket消息处理...
  }, [setIsLoadingData, setLoadingComplete, setLastSaved, setSaveState]);

  // 使用useEffect正确添加和清理WebSocket消息事件监听器
  useEffect(() => {
    // 定义处理函数
    const handleWSMessage = (event) => {
      try {
        handleWebSocketMessage(event.detail);
      } catch (error) {
        console.error("处理WebSocket消息时出错:", error);
      }
    };

    // 添加事件监听器
    document.addEventListener("websocket_message", handleWSMessage);

    // 清理函数，移除事件监听器
    return () => {
      document.removeEventListener("websocket_message", handleWSMessage);
    };
  }, [handleWebSocketMessage]);

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
            <Canvas
              saveState={saveState}
              setSaveState={setSaveState}
              onTransformChange={handleTransformChange}
            />
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
