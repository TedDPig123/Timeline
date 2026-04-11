import { useState, useEffect, useRef } from "react";

export default function Thumbnail({
  text,
  image = null,
  date,
  isEmpty = false,
}: {
  text: string | null;
  image: string | null;
  date: string | null;
  isEmpty?: boolean;
}) {
  const [lineClamp, setLineClamp] = useState(2);
  const containerRef = useRef<HTMLDivElement | null>(null);

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

    const resizeObserver = new ResizeObserver(updateLineClamp);
    resizeObserver.observe(containerRef.current);

    updateLineClamp();

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <span
      className="thumbnail relative z-10 flex flex-col items-center justify-start rounded-[28px] border-[3px] border-black bg-white"
      data-date={date}
    >
      <span className="absolute top-[-15px] z-20 bg-white px-2 font-bold">
        {date}
      </span>
      <div className="flex h-full w-full flex-col items-center overflow-hidden p-2">
        {isEmpty ? (
          // Empty state - show dots
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-2xl text-gray-300">• • •</span>
          </div>
        ) : (
          <>
            {image && (
              <div className="w-full overflow-hidden rounded-[16px] border-[3px] border-white bg-white">
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
        )}
      </div>
    </span>
  );
}
