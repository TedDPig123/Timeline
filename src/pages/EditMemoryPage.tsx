import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useEditingContext } from "../context/context";
import { MemoryPage } from "../components/memory/MemoryPage";
import { NavBar } from "../components/ui/NavBar";

export default function EditMemoryPage() {
  const { date } = useParams<{ date: string }>();
  const { user, isLoading } = useAuth();
  const { changeMode } = useEditingContext();
  const navigate = useNavigate();

  // Set edit mode on mount
  useEffect(() => {
    changeMode(true);
    return () => changeMode(false); // Reset on unmount
  }, [changeMode]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !date) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white">
      <NavBar />
      <div className="flex flex-col items-center p-8">
        <div className="mb-4 flex items-center gap-4">
          <button
            onClick={() => navigate("/timeline")}
            className="rounded-full bg-gray-200 px-4 py-2 text-sm hover:bg-gray-300"
          >
            ← Back to Timeline
          </button>
          <h1 className="font-editorial text-2xl">
            {new Date(date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h1>
        </div>
        <MemoryPage date={date} />
      </div>
    </div>
  );
}
