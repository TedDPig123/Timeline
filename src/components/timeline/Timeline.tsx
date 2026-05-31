import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import Thumbnail from "./Thumbnail";
import { useNavigate } from "react-router-dom";
import { getAllMemories } from "@/services/api";
import { MemoryCard, Memory } from "@/types";

import PreviewModal from "../memory/PreviewModal";
import { getMemory } from "@/services/api";
import {
  useViewMode,
  useThemeContext,
  useCurrentDate,
  useBaseDate,
} from "../../context/context"; // adjust path if needed
interface TimelineSlot {
  date: string;
  label: string;
  dayLabel: string | null;
  hasMemory: boolean;
  text: string | null;
  image: string | null;
  isFuture: boolean;
}

export default function Timeline() {
  const scrollContainer1 = useRef<HTMLDivElement | null>(null);
  const scrollContainer2 = useRef<HTMLDivElement | null>(null);
  const timelineRef = useRef<HTMLDivElement | null>(null);

  // const [currentDate, setCurrentDate] = useState(new Date());

  const { baseDate, setBaseDate } = useBaseDate();
  const [allCards, setAllCards] = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { viewMode, setViewMode } = useViewMode();
  const { theme } = useThemeContext();
  const { setCurrentDate } = useCurrentDate();

  // states just for previews
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDate, setPreviewDate] = useState<string | null>(null);
  const [previewCards, setPreviewCards] = useState<MemoryCard[]>([]);

  const isSyncing = useRef(false);

  const navigate = useNavigate();

  const handleThumbnailClick = async (date: string, hasMemory: boolean) => {
    if (viewMode === "year") {
      const [y, m] = date.split("-").map(Number);
      const monthStart = new Date(y, m - 1, 1);
      setCurrentDate(monthStart);
      setBaseDate(monthStart);
      setViewMode("month");
      return;
    }

    if (!hasMemory) {
      navigate(`/edit/${date}`);
      return;
    }

    try {
      const memory = await getMemory(date);
      setPreviewDate(date);
      setPreviewCards(memory?.memory_cards || []);
      setPreviewOpen(true);
    } catch (error) {
      console.error("Error fetching memory:", error);
      navigate(`/edit/${date}`);
    }
  };

  // Fetch all memories on mount
  useEffect(() => {
    async function fetchMemories() {
      try {
        const memories: Memory[] = await getAllMemories();
        const cards = memories?.flatMap((m) => m.memory_cards || []) || [];
        console.log(
          "RAW CARDS:",
          cards.map((c) => ({
            id: c.id,
            date: c.date,
            dateType: typeof c.date,
          })),
        );
        setAllCards(cards);
      } catch (error) {
        console.error("Error fetching memories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMemories();
  }, []);

  // Generate ALL slots for the view
  const slots = useMemo(() => {
    return generateAllSlots(viewMode, baseDate, allCards);
  }, [viewMode, baseDate, allCards]);

  // Split into top (even indices) and bottom (odd indices)
  const topSlots = slots.filter((_, i) => i % 2 === 0);
  const bottomSlots = slots.filter((_, i) => i % 2 === 1);

  // window dimensions
  const [vwidth, setVwidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setVwidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adjust thumbnail sizes based on scroll position
  const adjustSizes = () => {
    const containers = [scrollContainer1.current, scrollContainer2.current];

    containers.forEach((container) => {
      if (!container) return;

      const items = container.querySelectorAll(".timeline-item");
      const containerRect = container.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;

      items.forEach((item) => {
        const el = item as HTMLElement;
        const rect = el.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const distance = Math.abs(containerCenterX - itemCenterX);
        const maxDistance = containerRect.width / 2;

        const scale = Math.max(
          0.2,
          gaussian(0.7 * (1 - distance / maxDistance), 1, 0.7),
        );

        // Scale the thumbnail inside this item
        const thumbnail = el.querySelector(".thumbnail") as HTMLElement;
        if (thumbnail && timelineRef.current) {
          const timelineHeight = timelineRef.current.clientHeight;

          const maxHeight = timelineHeight * 0.8;
          const aspectRatio = 450 / 540;
          const targetHeight = maxHeight * scale;
          const targetWidth = targetHeight * aspectRatio;
          thumbnail.style.width = `${targetWidth}px`;
          thumbnail.style.height = `${targetHeight}px`;
        }

        // Update current date when item is near center
        if (distance < 200) {
          const dateAttr = el.getAttribute("data-date");
          if (dateAttr) {
            const [y, m, d] = dateAttr.split("-").map(Number);
            setCurrentDate(new Date(y, m - 1, d));
          }
        }
      });
    });
  };

  // Sync scroll between containers
  const syncScroll = (source: HTMLDivElement, target: HTMLDivElement) => {
    if (isSyncing.current) return;
    isSyncing.current = true;
    target.scrollLeft = source.scrollLeft;
    requestAnimationFrame(() => {
      isSyncing.current = false;
    });
  };

  //adjust size when windo resize
  useEffect(() => {
    window.addEventListener("resize", adjustSizes);
    return () => window.removeEventListener("resize", adjustSizes);
  }, []);

  // Drag handling
  useEffect(() => {
    const container1 = scrollContainer1.current;
    const container2 = scrollContainer2.current;
    if (!container1 || !container2) return;

    let isDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let hasMoved = false;
    const DRAG_THRESHOLD = 10; // px before we consider it a drag

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // left-click only
      isDragging = true;
      hasMoved = false;
      startX = e.clientX;
      startScrollLeft = container1.scrollLeft;
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;

      if (!hasMoved && Math.abs(dx) > DRAG_THRESHOLD) {
        hasMoved = true;
      }

      if (hasMoved) {
        // Negative because dragging right should move the content right
        // (i.e. scroll left), which feels natural.
        const target = startScrollLeft - dx;

        // Clamp to the more restrictive of the two containers' limits,
        // so both rows stop together at either edge.
        const maxScroll = Math.min(
          container1.scrollWidth - container1.clientWidth,
          container2.scrollWidth - container2.clientWidth,
        );
        const clamped = Math.max(0, Math.min(target, maxScroll));

        isSyncing.current = true;
        container1.scrollLeft = clamped;
        container2.scrollLeft = clamped;
        requestAnimationFrame(() => {
          isSyncing.current = false;
          adjustSizes();
        });
      }
    };

    const handleMouseUp = () => {
      if (!isDragging) return;
      const wasDrag = hasMoved;
      isDragging = false;
      hasMoved = false;

      if (wasDrag) {
        const suppressClick = (clickEvent: MouseEvent) => {
          clickEvent.stopPropagation();
          clickEvent.preventDefault();
          window.removeEventListener("click", suppressClick, true);
        };
        window.addEventListener("click", suppressClick, true);
      }
    };

    container1.addEventListener("mousedown", handleMouseDown);
    container2.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container1.removeEventListener("mousedown", handleMouseDown);
      container2.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Scroll handling
  useEffect(() => {
    const container1 = scrollContainer1.current;
    const container2 = scrollContainer2.current;
    if (!container1 || !container2) return;

    const handleWheel = (event: WheelEvent) => {
      const absX = Math.abs(event.deltaX);
      const absY = Math.abs(event.deltaY);

      const isHorizontalGesture = absX > absY;

      event.preventDefault();
      const sourceDelta = isHorizontalGesture ? event.deltaX : event.deltaY;
      const delta = sourceDelta * 1.5;

      const maxScroll = Math.min(
        container1.scrollWidth - container1.clientWidth,
        container2.scrollWidth - container2.clientWidth,
      );

      const currentScroll = Math.min(
        container1.scrollLeft,
        container2.scrollLeft,
      );
      const nextScroll = Math.max(
        0,
        Math.min(currentScroll + delta, maxScroll),
      );

      isSyncing.current = true;
      container1.scrollLeft = nextScroll;
      container2.scrollLeft = nextScroll;
      requestAnimationFrame(() => {
        isSyncing.current = false;
        adjustSizes();
      });
    };

    const handleScroll1 = () => {
      syncScroll(container1, container2);
      adjustSizes();
    };

    const handleScroll2 = () => {
      syncScroll(container2, container1);
      adjustSizes();
    };

    document.addEventListener("wheel", handleWheel, { passive: false });
    container1.addEventListener("scroll", handleScroll1);
    container2.addEventListener("scroll", handleScroll2);

    adjustSizes();

    return () => {
      document.removeEventListener("wheel", handleWheel);
      container1.removeEventListener("scroll", handleScroll1);
      container2.removeEventListener("scroll", handleScroll2);
    };
  }, [slots]);

  useEffect(() => {
    setTimeout(adjustSizes, 50);
  }, [viewMode, baseDate, allCards]);

  // Arrow button handlers
  useEffect(() => {
    const leftArrow = document.getElementById("left-arrow");
    const rightArrow = document.getElementById("right-arrow");
    const container1 = scrollContainer1.current;
    const container2 = scrollContainer2.current;

    const scrollAmount = vwidth * 0.4;

    const handleLeft = () => {
      if (container1 && container2) {
        const maxScroll = Math.min(
          container1.scrollWidth - container1.clientWidth,
          container2.scrollWidth - container2.clientWidth,
        );
        const target = Math.max(0, container1.scrollLeft - scrollAmount);
        gsap.to([container1, container2], {
          scrollLeft: Math.min(target, maxScroll),
          duration: 0.5,
        });
      }
    };
    const handleRight = () => {
      if (container1 && container2) {
        const maxScroll = Math.min(
          container1.scrollWidth - container1.clientWidth,
          container2.scrollWidth - container2.clientWidth,
        );
        const target = Math.min(
          maxScroll,
          container1.scrollLeft + scrollAmount,
        );
        gsap.to([container1, container2], {
          scrollLeft: target,
          duration: 0.5,
        });
      }
    };

    leftArrow?.addEventListener("click", handleLeft);
    rightArrow?.addEventListener("click", handleRight);

    return () => {
      leftArrow?.removeEventListener("click", handleLeft);
      rightArrow?.removeEventListener("click", handleRight);
    };
  }, [vwidth]);

  if (isLoading) {
    return (
      <div
        className="flex h-full w-full items-center justify-center"
        style={{ color: theme.secondaryColor }}
      >
        <p>Loading memories...</p>
      </div>
    );
  }

  return (
    <div
      ref={timelineRef}
      className="relative flex h-[80vh] w-[100vw] flex-col items-center justify-center"
      style={{ backgroundColor: theme.primaryColor }}
    >
      {/* Top row - thumbnails above the line */}
      <div
        ref={scrollContainer1}
        className="flex h-full w-full items-end overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div
          className="flex items-end gap-[30px]"
          style={{
            paddingLeft: `${vwidth / 2}px`,
            paddingRight: `${vwidth / 2}px`,
          }}
        >
          {topSlots.map((slot) => (
            <div
              key={slot.date}
              className="timeline-item flex flex-col items-center"
              data-date={slot.date}
            >
              {slot.isFuture ? (
                <div
                  className="thumbnail relative flex items-center justify-center rounded-[28px] border-[3px] border-dashed border-gray-400"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <span
                    className="absolute top-[-15px] z-20 px-2 font-bold text-gray-400"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {slot.dayLabel && (
                      <span className="mr-2">{slot.dayLabel}</span>
                    )}
                    {slot.label}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleThumbnailClick(slot.date, slot.hasMemory)
                  }
                >
                  <Thumbnail
                    text={slot.hasMemory ? slot.text : null}
                    image={slot.hasMemory ? slot.image : null}
                    date={slot.label}
                    dayLabel={slot.dayLabel}
                  />
                </button>
              )}
              <div
                className={`h-[20px] w-[4px]`}
                style={{
                  backgroundColor: slot.isFuture
                    ? "#9ca3af"
                    : theme.secondaryColor,
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom row - thumbnails below the line */}
      <div
        ref={scrollContainer2}
        className="flex h-full w-full items-start overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        <div
          className="flex items-start gap-[30px]"
          style={{
            paddingLeft: `${vwidth / 2 + 60}px`,
            paddingRight: `${vwidth / 2}px`,
          }}
        >
          {bottomSlots.map((slot) => (
            <div
              key={slot.date}
              className="timeline-item flex flex-col items-center"
              data-date={slot.date}
            >
              <div
                className="h-[30px] w-[4px]"
                style={{
                  backgroundColor: slot.isFuture
                    ? "#9ca3af"
                    : theme.secondaryColor,
                }}
              />
              {slot.isFuture ? (
                <div
                  className="thumbnail relative flex items-center justify-center rounded-[28px] border-[3px] border-dashed border-gray-400"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <span
                    className="absolute top-[-15px] z-20 px-2 font-bold text-gray-400"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    {slot.dayLabel && (
                      <span className="mr-2">{slot.dayLabel}</span>
                    )}
                    {slot.label}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() =>
                    handleThumbnailClick(slot.date, slot.hasMemory)
                  }
                >
                  <Thumbnail
                    text={slot.hasMemory ? slot.text : null}
                    image={slot.hasMemory ? slot.image : null}
                    date={slot.label}
                    dayLabel={slot.dayLabel}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* New memory button
      <div className="pointer-events-auto fixed bottom-[20px] right-[20px] z-[100]">
        <button
          onClick={() =>
            navigate(`/edit/${new Date().toISOString().split("T")[0]}`)
          }
          className="flex cursor-pointer select-none items-center justify-center rounded-[25px] bg-black p-3 font-editorial text-2xl text-white hover:bg-gray-800"
        >
          + new memory
        </button>
      </div> */}
      {/* Preview Modal */}
      <PreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        date={previewDate || ""}
        cards={previewCards}
      />
    </div>
  );
}

function toLocalDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// generate all slots for the view (empty or not)
function generateAllSlots(
  viewMode: "week" | "month" | "year",
  baseDate: Date,
  cards: MemoryCard[],
): TimelineSlot[] {
  const slots: TimelineSlot[] = [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  function getOrdinal(n: number): string {
    const s = ["TH", "ST", "ND", "RD"];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  if (viewMode === "week") {
    const date = new Date(baseDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = toLocalDateString(d);

      const slotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const isFuture = slotDate > today;

      const dayCards = cards.filter((c) => {
        const cardDateStr = String(c.date).slice(0, 10); // grab "YYYY-MM-DD"
        return cardDateStr === dateStr;
      });
      const hasMemory = dayCards.length > 0;

      slots.push({
        isFuture: isFuture,
        date: dateStr,
        label: getOrdinal(d.getDate()),
        dayLabel: dayNames[d.getDay()],
        hasMemory,
        text: hasMemory
          ? dayCards.find((c) => c.type === "TEXT")?.content || null
          : null,
        image: hasMemory
          ? dayCards.find((c) => c.type === "IMAGE")?.content || null
          : null,
      });
    }
  } else if (viewMode === "month") {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = toLocalDateString(d);

      const slotDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const isFuture = slotDate > today;

      const dayCards = cards.filter((c) => {
        const cardDateStr = String(c.date).slice(0, 10); // grab "YYYY-MM-DD"
        return cardDateStr === dateStr;
      });
      const hasMemory = dayCards.length > 0;

      slots.push({
        isFuture: isFuture,
        date: dateStr,
        label: getOrdinal(d.getDate()),
        dayLabel: dayNames[d.getDay()],
        hasMemory,
        text: hasMemory
          ? dayCards.find((c) => c.type === "TEXT")?.content || null
          : null,
        image: hasMemory
          ? dayCards.find((c) => c.type === "IMAGE")?.content || null
          : null,
      });
    }
  } else if (viewMode === "year") {
    const year = baseDate.getFullYear();
    const monthNames = [
      "JAN",
      "FEB",
      "MAR",
      "APR",
      "MAY",
      "JUN",
      "JUL",
      "AUG",
      "SEP",
      "OCT",
      "NOV",
      "DEC",
    ];

    for (let month = 0; month < 12; month++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;

      const slotDate = new Date(year, month, 1);
      const isFuture = slotDate > today;

      const monthCards = cards.filter((c) => {
        const cardDateStr = String(c.date).slice(0, 10);
        const [cy, cm] = cardDateStr.split("-").map(Number);
        return cy === year && cm - 1 === month;
      });
      const hasMemory = monthCards.length > 0;

      slots.push({
        isFuture: isFuture,
        date: dateStr,
        label: monthNames[month],
        dayLabel: null,
        hasMemory,
        text: hasMemory
          ? monthCards.find((c) => c.type === "TEXT")?.content || null
          : null,
        image: hasMemory
          ? monthCards.find((c) => c.type === "IMAGE")?.content || null
          : null,
      });
    }
  }

  return slots;
}

function gaussian(x: number, mean: number, stdDev: number): number {
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  return coefficient * Math.exp(exponent);
}
