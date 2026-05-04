import React, { useRef, useState, useEffect } from "react";
import { useMemModalContext, useEditingContext } from "@/context/context";
import { MemoryModule } from "./MemoryModule";
import { MemoryCard } from "../../types";
import DeleteIcon from "../../assets/graphics/cancel.svg?react";
import ResizeIcon from "../../assets/graphics/resize.svg?react";

const MemModal = ({
  memModal,
  id,
  updatePosition,
  queueDelete,
  memPageRef,
}: {
  memModal: MemoryCard;
  id: string;
  updatePosition: (id: string, newPosition: { x: number; y: number }) => void;
  queueDelete: (id: string) => void;
  memPageRef: React.RefObject<HTMLDivElement>;
}) => {
  const [position, setPosition] = useState({
    x: memModal.position_x,
    y: memModal.position_y,
  });
  const [size, setSize] = useState({
    width: memModal.width,
    height: memModal.height,
  });

  const { memModals, setMemModals } = useMemModalContext();
  const { isEditMode } = useEditingContext();
  const [resizeMode, setResizeMode] = useState(false);

  // Keep local state in sync if memModals is reset (e.g. cancel)
  useEffect(() => {
    setPosition({ x: memModal.position_x, y: memModal.position_y });
    setSize({ width: memModal.width, height: memModal.height });
  }, [
    memModal.position_x,
    memModal.position_y,
    memModal.width,
    memModal.height,
  ]);

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

  const memModalRef = useRef<HTMLDivElement>(null);
  const isClicked = useRef<boolean>(false);

  const coords = useRef({ startX: 0, startY: 0, lastX: 0, lastY: 0 });
  const dimensions = useRef({
    lastWidth: memModal.width,
    lastHeight: memModal.height,
  });

  useEffect(() => {
    if (!isEditMode) return;
    if (!memModalRef.current || !memPageRef.current) return;

    const memPage = memPageRef.current;
    const cardEl = memModalRef.current;

    const handleMouseDown = (e: MouseEvent) => {
      coords.current.lastX = cardEl.offsetLeft;
      coords.current.lastY = cardEl.offsetTop;
      dimensions.current.lastWidth = cardEl.clientWidth;
      dimensions.current.lastHeight = cardEl.clientHeight;

      isClicked.current = true;
      coords.current.startX = e.clientX;
      coords.current.startY = e.clientY;
      bringToTop(cardEl);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isClicked.current) return;

      const diffX = e.clientX - coords.current.startX;
      const diffY = e.clientY - coords.current.startY;

      if (resizeMode) {
        const nextWidth = diffX + dimensions.current.lastWidth;
        const nextHeight = diffY + dimensions.current.lastHeight;
        cardEl.style.width = `${nextWidth}px`;
        cardEl.style.height = `${nextHeight}px`;
      } else {
        const nextX = diffX + coords.current.lastX;
        const nextY = diffY + coords.current.lastY;
        cardEl.style.left = `${nextX}px`;
        cardEl.style.top = `${nextY}px`;
        setPosition({ x: nextX, y: nextY });
      }
    };

    const handleMouseUp = () => {
      if (!isClicked.current) return;
      isClicked.current = false;

      const finalX = cardEl.offsetLeft;
      const finalY = cardEl.offsetTop;
      const finalWidth = cardEl.clientWidth;
      const finalHeight = cardEl.clientHeight;

      coords.current.lastX = finalX;
      coords.current.lastY = finalY;
      dimensions.current.lastWidth = finalWidth;
      dimensions.current.lastHeight = finalHeight;

      // Update position in shared context (parent reads this on save)
      updatePosition(id, { x: finalX, y: finalY });

      // Update size in shared context too — extend updateMemModalPosition or add a setter,
      // but the simplest approach: write directly back into memModals
      setMemModals(
        memModals.map((m) =>
          m.id === id
            ? {
                ...m,
                position_x: finalX,
                position_y: finalY,
                width: finalWidth,
                height: finalHeight,
                z_index: parseInt(cardEl.style.zIndex) || 1,
              }
            : m,
        ),
      );

      setSize({ width: finalWidth, height: finalHeight });
    };

    cardEl.addEventListener("mousedown", handleMouseDown);
    cardEl.addEventListener("mouseup", handleMouseUp);
    memPage.addEventListener("mousemove", handleMouseMove);
    memPage.addEventListener("mouseleave", handleMouseUp);

    return () => {
      cardEl.removeEventListener("mousedown", handleMouseDown);
      cardEl.removeEventListener("mouseup", handleMouseUp);
      memPage.removeEventListener("mousemove", handleMouseMove);
      memPage.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [
    isEditMode,
    resizeMode,
    id,
    memModals,
    setMemModals,
    updatePosition,
    memPageRef,
  ]);

  return (
    <div
      className="memory-modal absolute rounded-lg border border-black bg-white p-2"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${size.width}px`,
        height: `${size.height}px`,
      }}
      ref={memModalRef}
    >
      <MemoryModule type={memModal.type} content={memModal.content} />
      {isEditMode && (
        <>
          <button
            className="absolute right-[-6px] top-[-6px] rounded-full bg-black px-1 py-1 text-xs text-white shadow-[0px_0px_4px_3px_rgba(0,_0,_0,_0.1)] hover:scale-105 hover:bg-gray-600"
            onClick={() => queueDelete(id)}
          >
            <DeleteIcon className="h-4 w-4 text-white" />
          </button>
          <button
            className="absolute bottom-[-6px] right-[-6px] rounded-full bg-black px-1 py-1 text-xs text-white shadow-[0px_0px_4px_3px_rgba(0,_0,_0,_0.1)] hover:scale-105 hover:bg-gray-600"
            onMouseDown={() => setResizeMode(true)}
            onMouseUp={() => setResizeMode(false)}
          >
            <ResizeIcon className="h-4 w-4 text-white" />
          </button>
        </>
      )}
    </div>
  );
};

export { MemModal };
