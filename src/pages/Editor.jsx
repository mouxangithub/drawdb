import { useParams } from "react-router-dom";
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
  const { id } = useParams(); // 获取URL参数中的图表ID
  
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
