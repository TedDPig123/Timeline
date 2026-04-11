import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { NavBar } from "../components/ui/NavBar";
import Timeline from "../components/timeline/Timeline";
import TimelineBar from "../components/timeline/TimelineBar";

export default function TimelineMainPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-white">
      <NavBar />
      <div className="relative flex h-[calc(100vh-80px)] items-center">
        <TimelineBar />
        <div className="absolute inset-0 flex items-center">
          <Timeline />
        </div>
      </div>
    </div>
  );
}
