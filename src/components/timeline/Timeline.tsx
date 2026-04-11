import { useEffect, useRef, useState, useMemo } from "react";
import gsap from "gsap";
import Thumbnail from "./Thumbnail";
import {
  filterMemoryByWeek,
  filterMemoryByMonth,
  filterMemoryByYear,
  thumbnailInfo,
} from "@/utils/FilterMemoryByDateRange";
import { useNavigate } from "react-router-dom";
import RightArrow from "../../assets/graphics/right-white.png";
import { getAllMemories } from "@/services/api";
import { MemoryCard, Memory } from "@/types";

export default function Timeline() {
  const scrollContainer1 = useRef<HTMLDivElement | null>(null);
  const scrollContainer2 = useRef<HTMLDivElement | null>(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [baseDate, setBaseDate] = useState(new Date());
  const [viewMode, setViewMode] = useState("month");
  const [allCards, setAllCards] = useState<MemoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all memories on mount
  useEffect(() => {
    async function fetchMemories() {
      try {
        const memories: Memory[] = await getAllMemories();
        // Flatten all memory_cards from all memories
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

    const handleMonth = () => {
      setViewMode("month");
      adjustThumbnailSize();
    };
    const handleWeek = () => {
      setViewMode("week");
      adjustThumbnailSize();
    };
    const handleYear = () => {
      setViewMode("year");
      adjustThumbnailSize();
    };

    monthButton?.addEventListener("click", handleMonth);
    weekButton?.addEventListener("click", handleWeek);
    yearButton?.addEventListener("click", handleYear);

    return () => {
      monthButton?.removeEventListener("click", handleMonth);
      weekButton?.removeEventListener("click", handleWeek);
      yearButton?.removeEventListener("click", handleYear);
    };
  }, []);

  const thumbnails = useMemo(
    () => splitArray(viewShift(viewMode, currentDate, allCards)),
    [viewMode, currentDate, allCards],
  );

  function DateToggler({ ddate }: { ddate: Date }) {
    const shiftDate = (direction: "prev" | "next") => {
      const date = new Date(currentDate);
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
              : ddate.toLocaleDateString()}
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

  function viewShift(
    view: string,
    baseDate: Date,
    cards: MemoryCard[],
  ): thumbnailInfo[] {
    const dateString = baseDate.toISOString().split("T")[0];
    if (view === "week") {
      return filterMemoryByWeek(dateString, cards);
    } else if (view === "month") {
      return filterMemoryByMonth(dateString, cards);
    } else {
      return filterMemoryByYear(dateString, cards);
    }
  }

  function getWindowDimensions() {
    const { innerWidth: vwidth, innerHeight: vheight } = window;
    return { vwidth, vheight };
  }

  function useWindowDimensions() {
    const [windowDimensions, setWindowDimensions] = useState(
      getWindowDimensions(),
    );

    useEffect(() => {
      function handleResize() {
        setWindowDimensions(getWindowDimensions());
      }
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    return windowDimensions;
  }

  const { vwidth } = useWindowDimensions();

  useEffect(() => {
    const leftArrow = document.getElementById("left-arrow");
    const handleLeftClick = () => {
      gsap.to([scrollContainer1.current, scrollContainer2.current], {
        scrollLeft: (index: number) =>
          index === 0
            ? (scrollContainer1.current?.scrollLeft ?? 0) -
              0.5 * (vwidth - 2 * (0.048 * vwidth + 70))
            : (scrollContainer2.current?.scrollLeft ?? 0) -
              0.5 * (vwidth - 2 * (0.048 * vwidth + 70)),
        duration: 2,
        ease: "power2.out",
      });
    };

    if (leftArrow) {
      leftArrow.addEventListener("click", handleLeftClick);
    }

    return () => {
      if (leftArrow) {
        leftArrow.removeEventListener("click", handleLeftClick);
      }
    };
  }, [vwidth]);

  useEffect(() => {
    const rightArrow = document.getElementById("right-arrow");
    const handleRightClick = () => {
      gsap.to([scrollContainer1.current, scrollContainer2.current], {
        scrollLeft: (index: number) =>
          index === 0
            ? (scrollContainer1.current?.scrollLeft ?? 0) +
              0.5 * (vwidth - 2 * (0.048 * vwidth + 70))
            : (scrollContainer2.current?.scrollLeft ?? 0) +
              0.5 * (vwidth - 2 * (0.048 * vwidth + 70)),
        duration: 2,
        ease: "power2.out",
      });
    };

    if (rightArrow) {
      rightArrow.addEventListener("click", handleRightClick);
    }

    return () => {
      if (rightArrow) {
        rightArrow.removeEventListener("click", handleRightClick);
      }
    };
  }, [vwidth]);

  const adjustThumbnailSize = () => {
    const scrollContainers = [
      scrollContainer1.current,
      scrollContainer2.current,
    ];

    scrollContainers.forEach((container) => {
      if (!container) return;

      const thumbnails = container.querySelectorAll(".thumbnail");
      const containerRect = container.getBoundingClientRect();
      const containerCenterX = containerRect.left + containerRect.width / 2;

      thumbnails.forEach((thumbnail) => {
        const el = thumbnail as HTMLElement;
        const thumbnailRect = el.getBoundingClientRect();
        const thumbnailCenterX = thumbnailRect.left + thumbnailRect.width / 2;
        const distance = Math.abs(containerCenterX - thumbnailCenterX);
        const maxDistance = containerRect.width / 2;

        const scale = Math.max(
          0.2,
          gaussian(0.7 * (1 - distance / maxDistance), 1, 0.7),
        );
        const height = 600 * scale;
        const width = 460 * scale;

        el.style.width = `${width}px`;
        el.style.height = `${height}px`;

        if (distance < 0.1 * vwidth) {
          const dateAttr = el.getAttribute("data-date");
          if (dateAttr) {
            setCurrentDate(new Date(dateAttr));
          }
        }
      });
    });
  };

  useEffect(() => {
    adjustThumbnailSize();
  }, [allCards]);

  useEffect(() => {
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      const scrollSpeed = vwidth * 0.0014;
      const delta = event.deltaY * scrollSpeed;

      gsap.to([scrollContainer1.current, scrollContainer2.current], {
        scrollLeft: (index: number) =>
          index === 0
            ? (scrollContainer1.current?.scrollLeft ?? 0) + delta
            : (scrollContainer2.current?.scrollLeft ?? 0) + delta,
        duration: 0.2,
        ease: "power3.out",
      });
    };

    const container1 = scrollContainer1.current;
    const container2 = scrollContainer2.current;

    if (container1 && container2) {
      container1.addEventListener("wheel", handleWheel, { passive: false });
      container2.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      if (container1 && container2) {
        container1.removeEventListener("wheel", handleWheel);
        container2.removeEventListener("wheel", handleWheel);
      }
    };
  }, [vwidth]);

  useEffect(() => {
    const handleScroll = () => {
      adjustThumbnailSize();
    };

    const c1 = scrollContainer1.current;
    const c2 = scrollContainer2.current;

    c1?.addEventListener("scroll", handleScroll);
    c2?.addEventListener("scroll", handleScroll);

    return () => {
      c1?.removeEventListener("scroll", handleScroll);
      c2?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    adjustThumbnailSize();
  }, [vwidth, baseDate]);

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <p>Loading memories...</p>
      </div>
    );
  }

  return (
    <div className="align-center z-50 flex w-[100vw] flex-col justify-center">
      {/* top scroll */}
      <div
        className="gallery-wrap align-center flex items-center justify-center"
        style={{
          marginLeft: `${0.048 * vwidth + 70}px`,
          marginRight: `${0.048 * vwidth + 70}px`,
        }}
      >
        <div
          ref={scrollContainer1}
          className="thumbnail-gallery flex h-[45vh] w-[100vw] items-end overflow-x-scroll pb-4"
        >
          <div
            className="grid grid-flow-col items-end gap-[40px] p-[10px]"
            style={{
              marginLeft: `${0.3 * vwidth}px`,
              marginRight: `${0.3 * vwidth}px`,
            }}
          >
            {thumbnails[0].length > 0 &&
              thumbnails[0].map((e) => (
                <div
                  className="align-end relative flex justify-center"
                  key={e.date ?? Math.random()}
                >
                  <div className="absolute z-0 h-[500px] w-[0.4rem] bg-black"></div>
                  <button onClick={() => navigate(`/edit/${e.date!}`)}>
                    <Thumbnail text={e.text} image={e.image} date={e.date} />
                  </button>
                </div>
              ))}
            {thumbnails[0].length === 0 && (
              <div className="w-full text-center text-xl text-gray-400">
                No entries for this time range.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* bottom scroll */}
      <div
        className="gallery-wrap align-end flex items-end justify-end"
        style={{
          marginLeft: `${0.048 * vwidth + 70}px`,
          marginRight: `${0.048 * vwidth + 70}px`,
        }}
      >
        <div
          ref={scrollContainer2}
          className="thumbnail-gallery flex h-[45vh] w-[100vw] overflow-x-scroll pt-4"
        >
          <div
            className="grid h-[100%] grid-flow-col gap-[40px] p-[10px]"
            style={{
              marginLeft: `${0.3 * vwidth + 70}px`,
              marginRight: `${0.3 * vwidth + 70}px`,
            }}
          >
            {thumbnails[1].length > 0 &&
              thumbnails[1].map((e) => (
                <div
                  className="relative flex justify-center"
                  key={e.date ?? Math.random()}
                >
                  <div className="absolute top-1/2 z-0 mt-[-200px] h-[200px] w-[0.4rem] -translate-y-1/2 bg-black"></div>
                  <Thumbnail text={e.text} image={e.image} date={e.date} />
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-auto fixed bottom-[20px] left-[20px] z-[100] select-none">
        <DateToggler ddate={currentDate} />
      </div>
      <div className="pointer-events-auto fixed bottom-[20px] right-[20px] z-[100]">
        <button
          onClick={() =>
            navigate(`/edit/${new Date().toISOString().split("T")[0]}`)
          }
          className="flex w-[100%] cursor-pointer select-none items-center justify-center rounded-[25px] bg-black p-3 font-editorial text-2xl text-white hover:bg-gray-800"
        >
          + new memory
        </button>
      </div>
    </div>
  );
}

function gaussian(x: number, mean: number, stdDev: number): number {
  const exponent = -0.5 * Math.pow((x - mean) / stdDev, 2);
  const coefficient = 1 / (stdDev * Math.sqrt(2 * Math.PI));
  return coefficient * Math.exp(exponent);
}

function splitArray(arr: thumbnailInfo[]): [thumbnailInfo[], thumbnailInfo[]] {
  const evenIndexed: thumbnailInfo[] = [];
  const oddIndexed: thumbnailInfo[] = [];

  arr.forEach((item, index) => {
    if (index % 2 === 0) {
      evenIndexed.push(item);
    } else {
      oddIndexed.push(item);
    }
  });

  if (evenIndexed.length === 0) {
    return [[], []];
  }

  if (evenIndexed.length <= oddIndexed.length) {
    evenIndexed.push(oddIndexed[oddIndexed.length - 1]);
    oddIndexed.pop();
  }

  return [evenIndexed, oddIndexed];
}
