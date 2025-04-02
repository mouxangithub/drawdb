import { useContext } from "react";
import { JsonEditorContext } from "../context/JsonEditorContext";

export default function useJsonEditor() {
  return useContext(JsonEditorContext);
} 