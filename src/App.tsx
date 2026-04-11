import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useState } from "react";
import { MemModalContext, EditingContext } from "@/context/context";
import { MemoryCard } from "./types";
import { AuthProvider } from "./context/AuthContext";

// Pages
import AuthCallback from "./pages/AuthCallback";
import Login from "./pages/Login";
import EditMemoryPage from "./pages/EditMemoryPage";
import TimelineMainPage from "./pages/TimelineMainPage";

function App() {
  const [isEditMode, changeMode] = useState<boolean>(false);
  const [memModals, setMemModals] = useState<MemoryCard[]>([]);

  const updateMemModalPosition = (
    id: string,
    newPosition: { x: number; y: number }
  ) => {
    setMemModals((prevModals) => {
      const updatedModals = prevModals.map((modal) =>
        modal.id === id
          ? { ...modal, position_x: newPosition.x, position_y: newPosition.y }
          : modal
      );
      return updatedModals;
    });
  };

  return (
    <AuthProvider>
      <MemModalContext.Provider
        value={{ memModals, setMemModals, updateMemModalPosition }}
      >
        <EditingContext.Provider value={{ isEditMode, changeMode }}>
          <Router>
            <Routes>
              <Route path="/" element={<Login />} />
              <Route path="/auth-callback" element={<AuthCallback />} />
              <Route path="/edit/:date" element={<EditMemoryPage />} />
              <Route path="/timeline" element={<TimelineMainPage />} />
            </Routes>
          </Router>
        </EditingContext.Provider>
      </MemModalContext.Provider>
    </AuthProvider>
  );
}

export default App;
