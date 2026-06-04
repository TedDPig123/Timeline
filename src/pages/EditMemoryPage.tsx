import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  useEditingContext,
  useMemModalContext,
  useThemeContext,
} from "../context/context";
import { MemoryPage } from "../components/memory/MemoryPage";
import { getMemory, createMemory } from "../services/api";
import { Memory } from "../types";

export default function EditMemoryPage() {
  const { date } = useParams<{ date: string }>();
  const { user, isLoading, dek } = useAuth();
  const { changeMode } = useEditingContext();
  const { setMemModals } = useMemModalContext();
  const navigate = useNavigate();
  const [memoryLoading, setMemoryLoading] = useState(true);
  const [memory, setMemory] = useState<Memory | null>(null);
  const { theme } = useThemeContext();

  // Set edit mode on mount
  useEffect(() => {
    changeMode(true);
    return () => changeMode(false);
  }, [changeMode]);

  // Fetch memory for this date
  useEffect(() => {
    async function fetchMemory() {
      if (!date || !dek) return;

      try {
        let mem = await getMemory(date, dek);

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
  }, [date, setMemModals, dek]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading || memoryLoading) {
    return (
      <div
        className="flex h-screen items-center justify-center"
        style={{ color: theme.secondaryColor, background: theme.primaryColor }}
      >
        <p>Loading...</p>
      </div>
    );
  }

  if (!user || !date) {
    return null;
  }

  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{
        backgroundColor: theme.primaryColor,
        color: theme.secondaryColor,
      }}
    >
      <div className="flex flex-col items-center">
        <div className="mb-2 flex w-full items-center justify-center gap-4">
          <h1 className="font-editorial text-2xl">
            {(() => {
              const [y, m, d] = date.split("-").map(Number);
              return new Date(y, m - 1, d).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              });
            })()}
          </h1>
        </div>
        <MemoryPage date={date} memoryId={memory?.id} />
      </div>
    </div>
  );
}
