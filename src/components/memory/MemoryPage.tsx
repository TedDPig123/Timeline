import { useRef, useState } from "react";
import { MemModal } from "./MemoryCard";
import { MemoryCard, ContentType } from "../../types";
import { useMemModalContext, useEditingContext } from "../../context/context";
import { useNavigate } from "react-router-dom";
import AddCardModal from "./AddCardModal";
import { createCardWithFile } from "../../services/api";

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
        className="relative mx-auto h-[700px] w-[700px] overflow-auto rounded-lg border border-black bg-white p-4 shadow-lg"
        ref={memPageRef}
      >
        {!isEditMode && (
          <button
            className="absolute right-2 top-2 rounded bg-gray-200 px-2 py-1 text-xs text-black hover:bg-gray-400"
            onClick={() => {
              navigate(`/edit/${date}`);
              changeMode(true);
            }}
          >
            Edit
          </button>
        )}

        {isEditMode && (
          <button
            className="absolute left-2 top-2 rounded bg-black px-3 py-1 text-sm text-white hover:bg-gray-800"
            onClick={() => setShowAddModal(true)}
          >
            + Add Card
          </button>
        )}

        {curModals.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-400">
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
