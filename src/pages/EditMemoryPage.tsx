import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useEditingContext, useMemModalContext } from "../context/context";
import { MemoryPage } from "../components/memory/MemoryPage";
import { getMemory, createMemory } from "../services/api";
import { Memory } from "../types";

export default function EditMemoryPage() {
  const { date } = useParams<{ date: string }>();
  const { user, isLoading } = useAuth();
  const { changeMode } = useEditingContext();
  const { setMemModals } = useMemModalContext();
  const navigate = useNavigate();
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memory, setMemory] = useState<Memory | null>(null);

  // Set edit mode on mount
  useEffect(() => {
    changeMode(true);
    return () => changeMode(false);
  }, [changeMode]);

  // Fetch memory for this date
  useEffect(() => {
    async function fetchMemory() {
      if (!date) return;

      try {
        let mem = await getMemory(date);

        // If no memory exists for this date, create one
        if (!mem) {
          mem = await createMemory(date);
          mem.memory_cards = [];
        }

        setMemory(mem);
        setMemModals(mem.memory_cards || []);
      } catch (error) {
        console.error("Error fetching memory:", error);
      } finally {
        setMemoryLoading(false);
      }
    }

    fetchMemory();
  }, [date, setMemModals]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || memoryLoading) {
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
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex flex-col items-center">
        <div className="mb-2 flex w-full items-center justify-between gap-4">
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
        <MemoryPage date={date} memoryId={memory?.id} />
      </div>
    </div>
  );
}
