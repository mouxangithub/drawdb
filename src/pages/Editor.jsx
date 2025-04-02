import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { diagramApi } from "../services/api";
import { Notification } from "@douyinfe/semi-ui";
import { useTranslation } from "react-i18next";
import LayoutContextProvider from "../context/LayoutContext";
import TransformContextProvider from "../context/TransformContext";
import TablesContextProvider from "../context/DiagramContext";
import UndoRedoContextProvider from "../context/UndoRedoContext";
import SelectContextProvider from "../context/SelectContext";
import AreasContextProvider from "../context/AreasContext";
import NotesContextProvider from "../context/NotesContext";
import TypesContextProvider from "../context/TypesContext";
import TasksContextProvider from "../context/TasksContext";
import SaveStateContextProvider from "../context/SaveStateContext";
import EnumsContextProvider from "../context/EnumsContext";
import WebSocketContextProvider from "../context/WebSocketContext";
import { CollaborationProvider } from "../context/CollaborationContext";
import WorkSpace from "../components/Workspace";

export default function Editor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [diagramValid, setDiagramValid] = useState(false);
  
  useEffect(() => {
    // 获取当前会话中是否已经重定向过
    const redirectKey = `diagram_redirect_${id}`;
    const hasRedirected = sessionStorage.getItem(redirectKey);
    
    // 如果此ID已经重定向过，阻止重复处理
    if (hasRedirected === 'true') {
      return;
    }
    
    const validateDiagram = async () => {
      if (!id) {
        Notification.error({
          title: t('error'),
          content: t('diagram_id_empty'),
          duration: 3,
        });
        
        // 标记已重定向
        sessionStorage.setItem(redirectKey, 'true');
        navigate("/");
        return;
      }

      try {
        const diagram = await diagramApi.getById(id);
        if (!diagram) {
          Notification.error({
            title: t('error'),
            content: t('diagram_not_found'),
            duration: 3,
          });
          
          // 标记已重定向
          sessionStorage.setItem(redirectKey, 'true');
          navigate("/");
          return;
        }
        
        // 图表有效
        setDiagramValid(true);
        // 清除重定向标记（有效图表）
        sessionStorage.removeItem(redirectKey);
      } catch (error) {
        console.error("获取图表失败:", error);
        
        // 根据错误类型显示不同的错误信息
        let errorMessage = t('get_diagram_failed');
        if (error.response) {
          switch (error.response.status) {
            case 404:
              errorMessage = t('diagram_not_found');
              break;
            case 403:
              errorMessage = t('no_permission_to_access');
              break;
            case 500:
              errorMessage = t('server_error');
              break;
            default:
              errorMessage = t('get_diagram_failed');
          }
        } else if (error.request) {
          errorMessage = t('network_error');
        }

        Notification.error({
          title: t('error'),
          content: errorMessage,
          duration: 3,
        });
        
        // 标记已重定向
        sessionStorage.setItem(redirectKey, 'true');
        navigate("/");
        return;
      }
    };

    validateDiagram();
  }, [id, navigate, t]);

  // 如果ID为空或图表未验证通过，不渲染工作区
  if (!id || !diagramValid) {
    return null;
  }
  
  return (
    <WebSocketContextProvider>
      <CollaborationProvider>
        <LayoutContextProvider>
          <TransformContextProvider>
            <UndoRedoContextProvider>
              <SelectContextProvider>
                <TasksContextProvider>
                  <AreasContextProvider>
                    <NotesContextProvider>
                      <TypesContextProvider>
                        <EnumsContextProvider>
                          <TablesContextProvider>
                            <SaveStateContextProvider>
                              <WorkSpace diagramId={id} />
                            </SaveStateContextProvider>
                          </TablesContextProvider>
                        </EnumsContextProvider>
                      </TypesContextProvider>
                    </NotesContextProvider>
                  </AreasContextProvider>
                </TasksContextProvider>
              </SelectContextProvider>
            </UndoRedoContextProvider>
          </TransformContextProvider>
        </LayoutContextProvider>
      </CollaborationProvider>
    </WebSocketContextProvider>
  );
}
