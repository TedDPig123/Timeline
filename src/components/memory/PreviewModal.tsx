import { useNavigate } from "react-router-dom";
import { MemoryCard } from "../../types";
import MediaContent from "./MediaContent";
import ExitIcon from "../../assets/graphics/cancel.svg?react";
import FullScreen from "../../assets/graphics/fullscreen.svg?react";
import { Tooltip } from "react-tooltip";
import { useThemeContext } from "@/context/context";

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
  const { theme } = useThemeContext();

  if (!isOpen) return null;

  // Format date with ordinal
  const [y, m, d] = date.split("-").map(Number);
  const localDate = new Date(y, m - 1, d);
  const day = localDate.getDate();
  const ordinal = (n: number) => {
    const s = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };
  const displayDate = `${ordinal(day)} ${localDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toLowerCase()}`;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col overflow-hidden rounded-[28px] shadow-2xl"
        style={{
          border: `2px solid ${theme.secondaryColor}`,
          backgroundColor: theme.primaryColor,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between  px-4 py-3"
          style={{ backgroundColor: theme.secondaryColor }}
        >
          <button
            onClick={() => {
              console.log("PREVIEW navigate date:", date);

              onClose();
              navigate(`/edit/${date}`);
            }}
            className="view-full text-white hover:text-gray-300"
          >
            <FullScreen
              className="h-5 w-5"
              style={{ color: theme.primaryColor }}
            />
          </button>
          <h2
            className="font-editorial text-xl"
            style={{ color: theme.primaryColor }}
          >
            {displayDate}
          </h2>
          <button
            onClick={onClose}
            className="exit-preview text-white hover:text-gray-300"
            title="Close"
          >
            <ExitIcon
              className="h-5 w-5"
              style={{ color: theme.primaryColor }}
            />
          </button>
        </div>

        {/* canvas */}
        <div
          className="relative h-[60vh] w-[60vh] overflow-hidden"
          style={{
            backgroundImage: theme.isDark
              ? "radial-gradient(circle, rgba(229, 229, 229, 0.3) 1px, transparent 1px)"
              : "radial-gradient(circle, rgba(160, 160, 160, 0.5) 1px, transparent 1px)",
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
                className="absolute overflow-hidden rounded-lg border bg-white p-1 shadow-sm"
                style={{
                  left: `${100 * (card.style.position.x / 700)}%`,
                  top: `${100 * (card.style.position.y / 700)}%`,
                  width: `${100 * (card.style.size.width / 700)}%`,
                  height: `${100 * (card.style.size.height / 700)}%`,
                  zIndex: card.style.zIndex,
                  borderColor: theme.secondaryColor,
                  color: theme.secondaryColor,
                  backgroundColor: theme.primaryColor,
                }}
              >
                {card.type === "TEXT" ? (
                  <div className="h-full w-full overflow-hidden text-xs">
                    {card.content}
                  </div>
                ) : (
                  <MediaContent card={card} />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <Tooltip anchorSelect=".view-full" place="top">
        View/Edit Memory
      </Tooltip>

      <Tooltip anchorSelect=".exit-preview" place="top">
        Exit Preview
      </Tooltip>
    </div>
  );
}
