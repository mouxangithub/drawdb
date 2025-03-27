import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useLayoutEffect } from "react";
import Editor from "./pages/Editor";
import DiagramList from "./pages/DiagramList";
import SettingsContextProvider from "./context/SettingsContext";
import { useSettings } from "./hooks";
import NotFound from "./pages/NotFound";
import { useFixAutofocusIssue } from "./utils/fixAutofocusIssue";

export default function App() {
  return (
    <SettingsContextProvider>
      <BrowserRouter>
        <RestoreScroll />
        <Routes>
          <Route
            path="/"
            element={
              <ThemedPage>
                <DiagramList />
              </ThemedPage>
            }
          />
          <Route
            path="/editor"
            element={
              <ThemedPage>
                <Editor />
              </ThemedPage>
            }
          />
          <Route
            path="/editor/:id"
            element={
              <ThemedPage>
                <Editor />
              </ThemedPage>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </SettingsContextProvider>
  );
}

function ThemedPage({ children }) {
  const { setSettings } = useSettings();
  useFixAutofocusIssue();

  useLayoutEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      setSettings((prev) => ({ ...prev, mode: "dark" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "dark");
      }
    } else {
      setSettings((prev) => ({ ...prev, mode: "light" }));
      const body = document.body;
      if (body.hasAttribute("theme-mode")) {
        body.setAttribute("theme-mode", "light");
      }
    }
  }, [setSettings]);

  return children;
}

function RestoreScroll() {
  const location = useLocation();
  useLayoutEffect(() => {
    window.scroll(0, 0);
  }, [location.pathname]);
  return null;
}
