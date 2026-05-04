import { useRef, useState, useEffect } from "react";
import { MemModal } from "./MemoryCard";
import { MemoryCard, ContentType } from "../../types";
import { useMemModalContext, useEditingContext } from "../../context/context";
import { useNavigate } from "react-router-dom";
import AddCardModal from "./AddCardModal";
import {
  createCardWithFile,
  deleteCard,
  updateCardPosition,
  updateCardSize,
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
  const navigate = useNavigate();
  const [showAddModal, setShowAddModal] = useState(false);

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

    // persist position/size changes for cards surviving the culling
    const updatePromises = curModals.flatMap((current) => {
      const original = snapshot.find((s) => s.id === current.id);
      const isNew = newCardIds.current.has(current.id);
      // skipping new cards
      if (!original || isNew) return [];

      const promises: Promise<unknown>[] = [];

      if (
        original.position_x !== current.position_x ||
        original.position_y !== current.position_y ||
        original.z_index !== current.z_index
      ) {
        promises.push(
          updateCardPosition(current.id, {
            position_x: current.position_x,
            position_y: current.position_y,
            z_index: current.z_index,
          }).catch((err) => console.error("Error saving position:", err)),
        );
      }

      if (
        original.width !== current.width ||
        original.height !== current.height
      ) {
        promises.push(
          updateCardSize(current.id, {
            width: current.width,
            height: current.height,
          }).catch((err) => console.error("Error saving size:", err)),
        );
      }

      return promises;
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

    try {
      const newCard = await createCardWithFile({
        type: data.type,
        content: data.content,
        file: data.file,
        date: date,
        position_x: 50 + Math.random() * 100,
        position_y: 50 + Math.random() * 100,
        z_index: curModals.length + 1,
        width: 200,
        height: 200,
        memory_id: memoryId,
      });

      newCardIds.current.add(newCard.id);
      setMemModals([...memModals, newCard]);
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  return (
    <>
      <div
        className="relative mx-auto h-[700px] w-[700px] overflow-hidden rounded-xl border-4 border-black bg-white p-4 shadow-lg"
        ref={memPageRef}
      >
        {isEditMode && (
          <button
            className="absolute left-2 top-2 z-[1000] rounded bg-black px-2 py-1 text-xs text-white hover:bg-gray-400"
            onClick={() => setShowAddModal(true)}
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
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-400"
        >
          ← Back to Timeline
        </button>

        {isEditMode ? (
          <div className="flex gap-2">
            <button
              className="rounded bg-gray-300 px-4 py-2 text-sm text-black hover:bg-gray-400"
              onClick={handleCancel}
            >
              Cancel
            </button>
            <button
              className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-700"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        ) : (
          <button
            className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-700"
            onClick={enterEditMode}
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
