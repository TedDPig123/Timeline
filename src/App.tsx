import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState } from "react";
import {
  MemModalContext,
  EditingContext,
  ViewModeContext,
  ViewMode,
  ThemeContext,
  theme,
  SettingsContext,
  settings,
  CurrentDateContext,
  BaseDateContext,
} from "@/context/context";
import { themes } from "./context/theme";
import { MemoryCard } from "./types";
import { AuthProvider } from "./context/AuthContext";

// Pages
import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";
import EditMemoryPage from "./pages/EditMemoryPage";
import TimelineMainPage from "./pages/TimelineMainPage";
import Landing from "./pages/Landing";

function App() {
  const [baseDate, setBaseDate] = useState(new Date());

  const [currentDate, setCurrentDate] = useState(new Date());
  const [isEditMode, changeMode] = useState<boolean>(false);
  const [memModals, setMemModals] = useState<MemoryCard[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [theme, setTheme] = useState<theme>(themes.dark);
  const [settings, setSettings] = useState<settings>({
    useVerticalScroll: true,
  });
  const updateMemModalPosition = (
    id: string,
    newPosition: { x: number; y: number },
  ) => {
    setMemModals((prevModals) => {
      const updatedModals = prevModals.map((modal) =>
        modal.id === id
          ? { ...modal, position_x: newPosition.x, position_y: newPosition.y }
          : modal,
      );
      return updatedModals;
    });
  };

  return (
    <AuthProvider>
      <BaseDateContext.Provider value={{ baseDate, setBaseDate }}>
        <CurrentDateContext.Provider value={{ currentDate, setCurrentDate }}>
          <ThemeContext.Provider value={{ theme, setTheme }}>
            <SettingsContext.Provider value={{ settings, setSettings }}>
              <ViewModeContext.Provider value={{ viewMode, setViewMode }}>
                <MemModalContext.Provider
                  value={{ memModals, setMemModals, updateMemModalPosition }}
                >
                  <EditingContext.Provider value={{ isEditMode, changeMode }}>
                    <Router>
                      <Routes>
                        <Route path="/" element={<Landing />} />
                        <Route path="/login" element={<Login />} />
                        <Route
                          path="/auth-callback"
                          element={<AuthCallback />}
                        />
                        <Route
                          path="/edit/:date"
                          element={<EditMemoryPage />}
                        />
                        <Route
                          path="/timeline"
                          element={<TimelineMainPage />}
                        />
                      </Routes>
                    </Router>
                  </EditingContext.Provider>
                </MemModalContext.Provider>
              </ViewModeContext.Provider>
            </SettingsContext.Provider>
          </ThemeContext.Provider>
        </CurrentDateContext.Provider>
      </BaseDateContext.Provider>
    </AuthProvider>
  );
}

export default App;
