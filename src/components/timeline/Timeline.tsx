import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import Thumbnail from "./Thumbnail";
import { useNavigate } from "react-router-dom";
import RightArrow from "../../assets/graphics/right-white.png";
import { getAllMemories } from "@/services/api";
import { MemoryCard, Memory } from "@/types";
import ThumbnailSpacer from "./ThumbnailSpacer";

interface TimelineSlot {
  date: string;
  label: string;
  hasMemory: boolean;
  text: string | null;
  image: string | null;
}

export default function Timeline() {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [baseDate, setBaseDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month" | "year">("month");
  const [allCards, setAllCards] = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const navigate = useNavigate();

  // Fetch all memories on mount
  useEffect(() => {
    async function fetchMemories() {
      try {
        const memories: Memory[] = await getAllMemories();
        const cards = memories?.flatMap((m) => m.memory_cards || []) || [];
        setAllCards(cards);
      } catch (error) {
        console.error("Error fetching memories:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMemories();
  }, []);

  // Handle view mode button clicks
  useEffect(() => {
    const monthButton = document.getElementById("month-button");
    const weekButton = document.getElementById("week-button");
    const yearButton = document.getElementById("year-button");

    const handleMonth = () => setViewMode("month");
    const handleWeek = () => setViewMode("week");
    const handleYear = () => setViewMode("year");

    monthButton?.addEventListener("click", handleMonth);
    weekButton?.addEventListener("click", handleWeek);
    yearButton?.addEventListener("click", handleYear);

    return () => {
      monthButton?.removeEventListener("click", handleMonth);
      weekButton?.removeEventListener("click", handleWeek);
      yearButton?.removeEventListener("click", handleYear);
    };
  }, []);

  // Generate ALL slots for the view
  const slots = useMemo(() => {
    return generateAllSlots(viewMode, baseDate, allCards);
  }, [viewMode, baseDate, allCards]);

  function DateToggler({ ddate }: { ddate: Date }) {
    const shiftDate = (direction: "prev" | "next") => {
      const date = new Date(baseDate);
      if (viewMode === "year") {
        date.setFullYear(date.getFullYear() + (direction === "next" ? 1 : -1));
      } else if (viewMode === "month") {
        date.setMonth(date.getMonth() + (direction === "next" ? 1 : -1));
      } else {
        date.setDate(date.getDate() + (direction === "next" ? 7 : -7));
      }
      setCurrentDate(date);
      setBaseDate(date);
    };

    return (
      <div className="flex w-[100%] items-center justify-center rounded-[25px] bg-black p-3 font-editorial text-2xl text-white">
        <img
          onClick={() => shiftDate("prev")}
          className="mr-[10px] h-[20px] scale-x-[-1] cursor-pointer"
          src={RightArrow}
          alt=""
        />
        <div className="scale-y-[1.1] justify-center text-center">
          {viewMode === "year"
            ? ddate.getFullYear()
            : viewMode === "month"
              ? ddate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })
              : `Week of ${ddate.toLocaleDateString()}`}
        </div>
        <img
          onClick={() => shiftDate("next")}
          className="ml-[10px] h-[20px] cursor-pointer"
          src={RightArrow}
          alt=""
        />
      </div>
    );
  }

  // Window dimensions
  const [vwidth, setVwidth] = useState(window.innerWidth);
  useEffect(() => {
    const handleResize = () => setVwidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Adjust thumbnail sizes based on scroll position (labels don't scale)
  const adjustSizes = () => {
    const container = scrollContainerRef.current;
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

      //TODO: set the scaling as a tunable parameter in settings
      const scale = Math.max(
        0.3,
        gaussian(0.7 * (1 - distance / maxDistance), 1, 0.7),
      );
      //note to self: the 0.7 here just kinda determines the range we consider the center

      // Scale the thumbnail (only if it exists)
      const thumbnail = el.querySelector(".thumbnail") as HTMLElement;
      if (thumbnail) {
        thumbnail.style.width = `${420 * scale}px`;
        thumbnail.style.height = `${540 * scale}px`;
      }

      // Scale the thumbnail spacer too
      const thumbnailSpacer = el.querySelector(
        ".thumbnail-spacer",
      ) as HTMLElement;
      if (thumbnailSpacer) {
        thumbnailSpacer.style.width = `${420 * scale}px`;
        thumbnailSpacer.style.height = `${540 * scale}px`;
      }

      // Scale the connecting line
      const line = el.querySelector(".connect-line") as HTMLElement;
      if (line) {
        const hasThumb = el.querySelector(".thumbnail");
        line.style.height = hasThumb ? `${120 * scale}px` : "40px";
      }

      // Update current date when item is near center
      if (distance < 50) {
        const dateAttr = el.getAttribute("data-date");
        if (dateAttr) {
          setCurrentDate(new Date(dateAttr));
        }
      }
    });
  };

  // Scroll handling
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      container.scrollLeft += event.deltaY * 1.5;
    };

    const handleScroll = () => adjustSizes();

    container.addEventListener("wheel", handleWheel, { passive: false });
    container.addEventListener("scroll", handleScroll);

    adjustSizes();

    return () => {
      container.removeEventListener("wheel", handleWheel);
      container.removeEventListener("scroll", handleScroll);
    };
  }, [slots]);

  useEffect(() => {
    setTimeout(adjustSizes, 50);
  }, [viewMode, baseDate, allCards]);

  // Arrow button handlers
  useEffect(() => {
    const leftArrow = document.getElementById("left-arrow");
    const rightArrow = document.getElementById("right-arrow");
    const container = scrollContainerRef.current;

    const scrollAmount = vwidth * 0.4;

    const handleLeft = () => {
      if (container) {
        gsap.to(container, {
          scrollLeft: container.scrollLeft - scrollAmount,
          duration: 0.5,
        });
      }
    };
    const handleRight = () => {
      if (container) {
        gsap.to(container, {
          scrollLeft: container.scrollLeft + scrollAmount,
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
      <div className="flex h-full w-full items-center justify-center">
        <p>Loading memories...</p>
      </div>
    );
  }

  return (
    <div className="relative flex h-full w-[100vw] flex-col items-center justify-center">
      {/* Timeline container */}

      <div
        ref={scrollContainerRef}
        className="relative flex h-[85vh] w-full items-center overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Items */}
        <div
          className="relative flex items-center"
          style={{
            paddingLeft: `${vwidth / 2}px`,
            paddingRight: `${vwidth / 2}px`,
            gap: "60px",
          }}
        >
          {slots.map((slot, index) => {
            const isTop = index % 2 === 0;

            return (
              <div
                key={slot.date}
                className="timeline-item flex items-center"
                data-date={slot.date}
                style={{
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                {/* Top content */}
                {isTop && (
                  <div className="flex flex-col items-center">
                    {slot.hasMemory ? (
                      <>
                        <button onClick={() => navigate(`/edit/${slot.date}`)}>
                          <Thumbnail
                            text={slot.text}
                            image={slot.image}
                            date={slot.label}
                          />
                        </button>
                        <div className="connect-line w-[4px] bg-black" />
                        <ThumbnailSpacer></ThumbnailSpacer>
                      </>
                    ) : (
                      <>
                        <span className="font-editorial text-lg text-gray-400">
                          {slot.label}
                        </span>
                        <div className="connect-line w-[4px] bg-black" />
                      </>
                    )}
                  </div>
                )}

                {/* Bottom content */}
                {!isTop && (
                  <div className="flex flex-col items-center">
                    {slot.hasMemory ? (
                      <>
                        <ThumbnailSpacer></ThumbnailSpacer>
                        <div className="connect-line w-[4px] bg-black" />
                        <button onClick={() => navigate(`/edit/${slot.date}`)}>
                          <Thumbnail
                            text={slot.text}
                            image={slot.image}
                            date={slot.label}
                          />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="connect-line w-[4px] bg-black" />

                        <span className="font-editorial text-lg text-gray-400">
                          {slot.label}
                        </span>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date toggler */}
      <div className="pointer-events-auto fixed bottom-[20px] left-[20px] z-[100] select-none">
        <DateToggler ddate={currentDate} />
      </div>

      {/* New memory button */}
      <div className="pointer-events-auto fixed bottom-[20px] right-[20px] z-[100]">
        <button
          onClick={() =>
            navigate(`/edit/${new Date().toISOString().split("T")[0]}`)
          }
          className="flex cursor-pointer select-none items-center justify-center rounded-[25px] bg-black p-3 font-editorial text-2xl text-white hover:bg-gray-800"
        >
          + new memory
        </button>
      </div>
    </div>
  );
}

// Generate ALL slots for the view (empty or not)
function generateAllSlots(
  viewMode: "week" | "month" | "year",
  baseDate: Date,
  cards: MemoryCard[],
): TimelineSlot[] {
  const slots: TimelineSlot[] = [];

  function getOrdinal(n: number): string {
    const s = ["TH", "ST", "ND", "RD"];
    const v = n % 100;
    //lowk had to search this up
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  if (viewMode === "week") {
    // Get Monday of the week
    const date = new Date(baseDate);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(date);
    monday.setDate(diff);

    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      const dayCards = cards.filter((c) => c.date.split("T")[0] === dateStr);
      const hasMemory = dayCards.length > 0;

      slots.push({
        date: dateStr,
        label: getOrdinal(d.getDate()),
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
      const dateStr = d.toISOString().split("T")[0];

      const dayCards = cards.filter((c) => c.date.split("T")[0] === dateStr);
      const hasMemory = dayCards.length > 0;

      slots.push({
        date: dateStr,
        label: getOrdinal(day),
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

      const monthCards = cards.filter((c) => {
        const cardDate = new Date(c.date);
        return cardDate.getFullYear() === year && cardDate.getMonth() === month;
      });
      const hasMemory = monthCards.length > 0;

      slots.push({
        date: dateStr,
        label: monthNames[month],
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
