import { useRef, useState } from "react";
import { MemModal } from "./MemoryCard";
import { MemoryCard, ContentType } from "../../types";
import { useMemModalContext, useEditingContext } from "../../context/context";
import { useNavigate } from "react-router-dom";
import AddCardModal from "./AddCardModal";
import { createCardWithFile } from "../../services/api";
import { useEffect } from "react";

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

  useEffect(() => {
    changeMode(false);
  }, []);

  const curModals = memModals.filter((modal) => {
    const modalDate = modal.date.split("T")[0];
    return modalDate === date;
  });

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

      setMemModals([...memModals, newCard]);
    } catch (error) {
      console.error("Error creating card:", error);
    }
  };

  return (
    <>
      <div
        className="relative mx-auto h-[700px] w-[700px] overflow-auto rounded-xl border-4 border-black bg-white p-4 shadow-lg"
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
            memPageRef={memPageRef}
          />
        ))}
      </div>
      <div className="flex w-full justify-between py-2">
        <button
          onClick={() => navigate("/timeline")}
          className="rounded bg-black px-4 py-2 text-sm text-white hover:bg-gray-300"
        >
          ← Back to Timeline
        </button>
        {!isEditMode && (
          <button
            className="w-10 rounded bg-black px-2 py-1 text-xs text-white hover:bg-gray-400"
            onClick={() => {
              navigate(`/edit/${date}`);
              changeMode(!isEditMode);
            }}
          >
            Edit
          </button>
        )}
        {isEditMode && (
          <button
            className=" z-[1000] w-10 rounded bg-black px-2 py-1 text-xs text-white hover:bg-gray-400"
            onClick={() => {
              navigate(`/edit/${date}`);
              changeMode(!isEditMode);
            }}
          >
            Save
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
