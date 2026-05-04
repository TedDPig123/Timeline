import { useNavigate } from "react-router-dom";
import { MemoryCard } from "../../types";
import ExitIcon from "../../assets/graphics/cancel.svg?react";
import FullScreen from "../../assets/graphics/fullscreen.svg?react";

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  cards: MemoryCard[];
}

export default function PreviewModal({
  isOpen,
  onClose,
  date,
  cards,
}: PreviewModalProps) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  // Format date with ordinal
  const day = new Date(date).getDate();
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const displayDate = `${ordinal(day)} ${new Date(date).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase()}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between bg-black px-4 py-3">
          <button
            onClick={() => {
              onClose();
              navigate(`/edit/${date}`);
            }}
            className="text-white hover:text-gray-300"
            title="Edit"
          >
            <FullScreen className="h-5 w-5 text-white" />
          </button>
          <h2 className="font-editorial text-xl text-white">{displayDate}</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-300"
            title="Close"
          >
            <ExitIcon className="h-5 w-5 text-white" />
          </button>
        </div>

        {/* Canvas - same size as MemoryPage */}
        <div
          className="relative h-[700px] w-[700px] overflow-hidden"
          style={{
            backgroundImage:
              "radial-gradient(circle, #e5e5e5 1px, transparent 1px)",
            backgroundSize: "16px 16px",
          }}
        >
          {cards.length === 0 ? (
            <div className="flex h-full items-center justify-center text-gray-400">
              No memories for this day
            </div>
          ) : (
            cards.map((card) => (
              <div
                key={card.id}
                className="absolute overflow-hidden rounded-lg border border-gray-200 bg-white p-2 shadow-sm"
                style={{
                  left: `${card.position_x}px`,
                  top: `${card.position_y}px`,
                  width: `${card.width}px`,
                  height: `${card.height}px`,
                  zIndex: card.z_index,
                }}
              >
                {card.type === "IMAGE" && (
                  <img
                    src={card.content}
                    alt="memory"
                    className="h-full w-full rounded object-cover"
                  />
                )}
                {card.type === "TEXT" && (
                  <div className="h-full w-full overflow-hidden text-sm">
                    {card.content}
                  </div>
                )}
                {card.type === "VIDEO" && (
                  <video
                    src={card.content}
                    className="h-full w-full rounded object-cover"
                    controls
                  />
                )}
                {card.type === "AUDIO" && (
                  <div className="flex h-full w-full items-center">
                    <audio src={card.content} className="w-full" controls />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
