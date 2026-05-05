import { useState, useEffect, useRef } from "react";
import { useThemeContext } from "@/context/context";

export default function Thumbnail({
  text,
  image = null,
  date,
  dayLabel = null,
}: {
  text: string | null;
  image: string | null;
  date: string | null;
  dayLabel?: string | null;
}) {
  const { theme } = useThemeContext();
  const [lineClamp, setLineClamp] = useState(2);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // const thumbnailRef = useRef<HTMLDivElement | null>(null);
  // const [currThumbnailDim, setCurrThumbnailDim] = useState([1, 1]);

  useEffect(() => {
    if (!containerRef.current) return;

    const updateLineClamp = () => {
      if (containerRef.current) {
        const height = containerRef.current.clientHeight;
        const computedStyle = window.getComputedStyle(containerRef.current);
        const lineHeight = parseFloat(computedStyle.lineHeight) || 17;
        const maxLines = Math.floor(height / lineHeight);
        setLineClamp(maxLines);
      }
    };

    // const updateDim = () => {
    //   if (thumbnailRef.current) {
    //     const width = thumbnailRef.current.clientWidth;
    //     const height = thumbnailRef.current.clientHeight;
    //     setCurrThumbnailDim([width, height]);
    //   }
    // };

    const resizeObserverClamp = new ResizeObserver(updateLineClamp);
    resizeObserverClamp.observe(containerRef.current);
    updateLineClamp();

    // const resizeObserverDim = new ResizeObserver(updateDim);
    // resizeObserverDim.observe(thumbnailRef.current);
    // updateDim();

    return () => {
      resizeObserverClamp.disconnect();
      // resizeObserverDim.disconnect();
    };
  }, []);

  return (
    <span
      className="thumbnail relative z-10 flex flex-col items-center justify-start rounded-[28px] border-[3px] border-black shadow-md hover:scale-[1.01] hover:shadow-md"
      style={{
        backgroundColor: theme.primaryColor,
        borderColor: theme.secondaryColor,
        color: theme.secondaryColor,
      }}
      data-date={date}
    >
      <span
        className="absolute top-[-15px] z-20 bg-white px-2 font-bold"
        style={{
          color: theme.secondaryColor,
          backgroundColor: theme.primaryColor,
        }}
      >
        {dayLabel && <span className="mr-2">{dayLabel}</span>}
        {date}
      </span>
      <div className="flex h-full w-full flex-col items-center overflow-hidden p-2">
        <>
          {image && (
            <div
              className="w-full overflow-hidden rounded-[16px] border-[3px] "
              style={{ borderColor: theme.primaryColor }}
            >
              <img
                className="h-auto w-full rounded-[12px] object-cover"
                src={image}
                alt="thumbnail"
              />
            </div>
          )}
          {text && (
            <div ref={containerRef} className="mt-1 h-full w-full flex-1">
              <p
                className="w-full overflow-hidden text-ellipsis text-[14px]"
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: lineClamp,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {text}
              </p>
            </div>
          )}
          {!image && !text && (
            <div className="flex h-full w-full items-center justify-center">
              <span className="text-2xl text-gray-300">• • •</span>
            </div>
          )}
        </>
      </div>
    </span>
  );
}
