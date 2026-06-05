import { useRef, useState, useEffect } from "react";
import { MemModal } from "./MemoryCard";
import { MemoryCard, ContentType } from "../../types";
import {
  useMemModalContext,
  useEditingContext,
  useThemeContext,
} from "../../context/context";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AddCardModal from "./AddCardModal";
import {
  createCardWithFile,
  deleteCard,
  updateCardStyle,
} from "../../services/api";

interface MemoryPageProps {
  date: string;
  memoryId?: string;
}

const MemoryPage = ({ date, memoryId }: MemoryPageProps) => {
  const memPageRef = useRef<HTMLDivElement>(null);
  const { memModals, setMemModals, updateMemModalPosition } =
    useMemModalContext();
  const { isEditMode, changeMode } = useEditingContext();
  const { dek } = useAuth();
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);
  const { theme } = useThemeContext();
  const [isHoveredEdit, setIsHoveredEdit] = useState(false);
  const [isHoveredLeave, setIsHoveredLeave] = useState(false);
  const [isHoveredAddCard, setIsHoveredAddCard] = useState(false);
  const [isHoveredCancel, setIsHoveredCancel] = useState(false);

  // snapshot of cards as they were when edit mode started (needed for cancel)
  const snapshotRef = useRef<MemoryCard[] | null>(null);

  // pending delete ids
  const pendingDeletes = useRef<Set<string>>(new Set());

  // ids of cards added during new session
  const newCardIds = useRef<Set<string>>(new Set());

  // ensure we start in view mode
  useEffect(() => {
    changeMode(false);
  }, []);

  const curModals = memModals.filter((modal) => {
    const modalDate = modal.date.split("T")[0];
    return modalDate === date;
  });

  // edit, save, and cancel logic

  const enterEditMode = () => {
    // snapshot current state of THIS date's cards so cancel can restore them
    snapshotRef.current = curModals.map((m) => ({ ...m }));
    pendingDeletes.current.clear();
    newCardIds.current.clear();
    changeMode(true);
  };

  const handleSave = async () => {
    const snapshot = snapshotRef.current ?? [];

    // delete the removed cards
    const deletePromises = Array.from(pendingDeletes.current).map((id) =>
      deleteCard(id).catch((err) =>
        console.error(`Failed to delete card ${id}:`, err),
      ),
    );

    // persist style (position/size/zIndex) changes for surviving cards
    const updatePromises = curModals.flatMap((current) => {
      //this is the original card
      const original = snapshot.find((s) => s.id === current.id);

      // new cards have no snapshot; otherwise only save if the style changed
      const styleChanged =
        !original ||
        JSON.stringify(original.style) !== JSON.stringify(current.style);

      if (!styleChanged) return [];

      return [
        updateCardStyle(current.id, current.style).catch((err) =>
          console.error("Error saving style:", err),
        ),
      ];
    });

    await Promise.all([...deletePromises, ...updatePromises]);

    // clean up the staging
    pendingDeletes.current.clear();
    newCardIds.current.clear();
    snapshotRef.current = null;
    changeMode(false);
  };

  const handleCancel = () => {
    const snapshot = snapshotRef.current;
    if (snapshot) {
      // drop everything for this date in memModals, replace with snapshot
      const otherDates = memModals.filter((m) => m.date.split("T")[0] !== date);
      setMemModals([...otherDates, ...snapshot]);
    }
    pendingDeletes.current.clear();
    newCardIds.current.clear();
    snapshotRef.current = null;
    changeMode(false);
  };

  // IN-MEMORY CARD CHANGES

  const queueDelete = (id: string) => {
    // if the card was newly added in this session, just drop it
    if (newCardIds.current.has(id)) {
      newCardIds.current.delete(id);
    } else {
      pendingDeletes.current.add(id);
    }
    setMemModals(memModals.filter((m) => m.id !== id));
  };

  const handleAddCard = async (data: {
    type: ContentType;
    content?: string;
    file?: File;
  }) => {
    if (!memoryId) {
      console.error("No memory ID available");
      return;
    }

    if (!dek) {
      console.error("Vault is locked; cannot add card");
      return;
    }

    try {
      const newCard = await createCardWithFile(
        {
          type: data.type,
          content: data.content,
          file: data.file,
          date: date,
          style: {
            position: {
              x: 50 + Math.random() * 100,
              y: 50 + Math.random() * 100,
            },
            size: { width: 200, height: 200 },
            zIndex: curModals.length + 1,
          },
          memory_id: memoryId,
        },
        dek,
      );

      newCardIds.current.add(newCard.id);
      setMemModals([...memModals, newCard]);
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  return (
    <>
      <div
        className="relative mx-auto h-[85vh] w-[85vh] overflow-hidden rounded-xl border-4 border-black bg-white shadow-lg"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(229, 229, 229, 0.3) 1px, transparent 1px)",
          backgroundSize: "16px 16px",
          borderColor: theme.secondaryColor,
          backgroundColor: theme.primaryColor,
        }}
        ref={memPageRef}
      >
        {isEditMode && (
          <button
            className="absolute left-2 top-2 z-[1000] rounded bg-black px-2 py-1 text-xs text-white hover:bg-gray-400"
            onClick={() => setShowAddModal(true)}
            onMouseEnter={() => setIsHoveredAddCard(true)}
            onMouseLeave={() => setIsHoveredAddCard(false)}
            style={{
              border: theme.isDark
                ? `2px solid ${theme.secondaryColor}`
                : `none`,
              color: theme.isDark ? theme.secondaryColor : theme.primaryColor,
              backgroundColor: isHoveredAddCard
                ? theme.highlightColor
                : theme.isDark
                  ? theme.primaryColor
                  : theme.secondaryColor,
            }}
          >
            + Add Card
          </button>
        )}

        {curModals.length === 0 && (
          <div className="z-[1000] flex h-full items-center justify-center text-gray-400">
            No cards yet. Add some content!
          </div>
        )}

        {curModals.map((memModal: MemoryCard) => (
          <MemModal
            key={memModal.id}
            memModal={memModal}
            id={memModal.id}
            updatePosition={updateMemModalPosition}
            queueDelete={queueDelete}
            memPageRef={memPageRef}
          />
        ))}
      </div>

      <div className="flex w-full items-center justify-between py-2">
        <button
          onClick={() => navigate("/timeline")}
          onMouseEnter={() => setIsHoveredLeave(true)}
          onMouseLeave={() => setIsHoveredLeave(false)}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-400"
          style={{
            border: theme.isDark ? `2px solid ${theme.secondaryColor}` : `none`,
            color: theme.isDark ? theme.secondaryColor : theme.primaryColor,
            backgroundColor: isHoveredLeave
              ? theme.highlightColor
              : theme.isDark
                ? theme.primaryColor
                : theme.secondaryColor,
          }}
        >
          ← Back to Timeline
        </button>

        {isEditMode ? (
          <div className="flex gap-2">
            <button
              className="rounded bg-gray-300 px-4 py-2 text-sm text-black hover:bg-gray-400"
              onMouseEnter={() => setIsHoveredCancel(true)}
              onMouseLeave={() => setIsHoveredCancel(false)}
              style={{
                color: theme.primaryColor,
                backgroundColor: isHoveredCancel
                  ? theme.highlightColor
                  : theme.secondaryColor,
              }}
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="rounded bg-black px-[14px] py-[6px] text-sm hover:bg-gray-700"
              onClick={handleSave}
              onMouseEnter={() => setIsHoveredEdit(true)}
              onMouseLeave={() => setIsHoveredEdit(false)}
              style={{
                border: `2px solid ${theme.secondaryColor}`,

                color: theme.isDark
                  ? theme.secondaryColor
                  : isHoveredEdit
                    ? theme.primaryColor
                    : theme.secondaryColor,
                backgroundColor: isHoveredEdit
                  ? theme.highlightColor
                  : theme.primaryColor,
              }}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-700"
            onClick={enterEditMode}
            onMouseEnter={() => setIsHoveredEdit(true)}
            onMouseLeave={() => setIsHoveredEdit(false)}
            style={{
              border: theme.isDark
                ? `2px solid ${theme.secondaryColor}`
                : `none`,
              color: theme.isDark ? theme.secondaryColor : theme.primaryColor,
              backgroundColor: isHoveredEdit
                ? theme.highlightColor
                : theme.isDark
                  ? theme.primaryColor
                  : theme.secondaryColor,
            }}
          >
            Edit
          </button>
        )}
      </div>

      <div className="z-[1000]">
        <AddCardModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddCard}
        />
      </div>
    </>
  );
};

export { MemoryPage };
