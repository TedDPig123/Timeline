import React, { useRef, useState, useEffect } from "react";
import { useMemModalContext } from "@/context/context";
import { useEditingContext } from "@/context/context";
import { MemoryModule } from "./MemoryModule";
import { MemoryCard } from "../../types";
import { updateCardPosition, deleteCard } from "../../services/api";

const MemModal = ({
  //the memory card was called the memmodal, TODO: should change it to memcard or smth more fitting
  memModal, //the memorycard object, TODO: Rename
  id,
  updatePosition, //updates position of card in database
  memPageRef, //a reference to the memory page itself
}: {
  memModal: MemoryCard;
  id: string;
  updatePosition: (id: string, newPosition: { x: number; y: number }) => void;
  memPageRef: React.RefObject<HTMLDivElement>;
}) => {
  //sets the current x and y position of the card given by the memModal memory object
  const [position, setPosition] = useState({
    x: memModal.position_x,
    y: memModal.position_y,
  });

  //unpack memModals and setMemModals from useMemModalContext()
  // - memModals is the array of memoryCards loaded
  //unpack isEditMode from useEditingContext()
  const { memModals, setMemModals } = useMemModalContext();
  const { isEditMode } = useEditingContext();

  //this function brings the input card to the top
  // - gets all memory-modals (still should be memory-cards)
  // - if the card isn't already at the top:
  //   - set the card to have the highest index
  //   - decrement the z-value of all other cards, capping to z=0
  const bringToTop = (card: HTMLDivElement) => {
    const otherCards = document.getElementsByClassName(
      "memory-modal",
    ) as HTMLCollectionOf<HTMLDivElement>;

    if (card.style.zIndex === "999") return;

    card.style.zIndex = "999";

    Array.from(otherCards).forEach((otherCard: HTMLDivElement) => {
      if (otherCard !== card) {
        otherCard.style.zIndex = String(
          Math.max(Number(otherCard.style.zIndex) - 1, 0),
        );
      }
    });
  };

  //calls the delete card function to delete from database
  //then uses filter method to remove the deleted modal from the memModals array
  //updates the memModals context
  const handleDelete = async (id: string) => {
    try {
      await deleteCard(id);
      const updatedModules = memModals.filter((modal) => modal.id !== id);
      setMemModals(updatedModules);
    } catch (error) {
      console.error("Error deleting card:", error);
    }
  };

  //reference for the memModal div container (AKA the container being returned)
  const memModalRef = useRef<HTMLDivElement>(null);
  //ref to keep track of click status
  const isClicked = useRef<boolean>(false);

  //ref for coordinates
  const coords = useRef<{
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  }>({
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
  });

  //this section triggers a rerender when isEditMode changes? and id changes? look into this.
  useEffect(() => {
    if (!isEditMode) return;
    if (!memModalRef.current || !memPageRef.current) return;

    const memPage = memPageRef.current;
    const memModal = memModalRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      if (!isEditMode) return;

      coords.current.lastX = memModal.offsetLeft;
      coords.current.lastY = memModal.offsetTop;

      isClicked.current = true;
      coords.current.startX = e.clientX;
      coords.current.startY = e.clientY;
      bringToTop(memModal);
    };

    const handleMouseUp = async () => {
      if (!isClicked.current) return;

      isClicked.current = false;
      coords.current.lastX = memModal.offsetLeft;
      coords.current.lastY = memModal.offsetTop;

      updatePosition(id, { x: coords.current.lastX, y: coords.current.lastY });

      // Save to backend
      try {
        await updateCardPosition(id, {
          position_x: coords.current.lastX,
          position_y: coords.current.lastY,
          z_index: parseInt(memModal.style.zIndex) || 1,
        });
      } catch (error) {
        console.error("Error saving position:", error);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isClicked.current) return;

      const nextX = e.clientX - coords.current.startX + coords.current.lastX;
      const nextY = e.clientY - coords.current.startY + coords.current.lastY;

      memModal.style.top = `${nextY}px`;
      memModal.style.left = `${nextX}px`;

      setPosition({ x: nextX, y: nextY });
    };

    memModal.addEventListener("mousedown", handleMouseDown);
    memModal.addEventListener("mouseup", handleMouseUp);
    memPage.addEventListener("mousemove", handleMouseMove);
    memPage.addEventListener("mouseleave", handleMouseUp);

    const cleanUp = () => {
      memModal.removeEventListener("mousedown", handleMouseDown);
      memModal.removeEventListener("mouseup", handleMouseUp);
      memPage.removeEventListener("mousemove", handleMouseMove);
      memPage.removeEventListener("mouseleave", handleMouseUp);
    };

    return cleanUp;
  }, [isEditMode, id]);

  return (
    <div
      className="memory-modal absolute rounded-lg border border-black bg-white p-4"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${memModal.width}px`,
        height: `${memModal.height}px`,
      }}
      ref={memModalRef}
    >
      <MemoryModule type={memModal.type} content={memModal.content} />
      {isEditMode && (
        <button
          className="delete-button absolute right-2 top-2 rounded bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
          onClick={() => handleDelete(id)}
        >
          X
        </button>
      )}
    </div>
  );
};

export { MemModal };
