import {
  useViewMode,
  useThemeContext,
  useCurrentDate,
  useBaseDate,
} from "../../context/context";
import LeftArrow from "../../assets/graphics/left-arrow-noline.svg?react";

function getMonday(d: Date) {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = copy.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(copy.setDate(diff));
}

export default function DateToggler() {
  const { viewMode } = useViewMode();
  const { theme } = useThemeContext();
  const { currentDate, setCurrentDate } = useCurrentDate();
  const { baseDate, setBaseDate } = useBaseDate();

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
    <div
      className="flex w-[100vw] items-center justify-center p-4"
      style={{
        backgroundColor: theme.primaryColor,
        color: theme.secondaryColor,
      }}
    >
      <div
        className="mb-4 flex w-[18vw] min-w-[300px] items-center justify-between rounded-full p-3 font-editorial text-2xl text-white"
        style={{
          border: theme.isDark ? `2px solid ${theme.secondaryColor}` : `none`,
          color: theme.isDark ? theme.secondaryColor : theme.primaryColor,
          backgroundColor: theme.isDark
            ? theme.primaryColor
            : theme.secondaryColor,
        }}
      >
        <LeftArrow
          onClick={() => shiftDate("prev")}
          className="ml-[-10px] h-[30px] w-[50px] cursor-pointer"
        />
        <div className="scale-y-[1.1] justify-center text-center">
          {viewMode === "year"
            ? currentDate.getFullYear()
            : viewMode === "month"
              ? currentDate.toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })
              : `Week of ${getMonday(currentDate).toLocaleDateString()}`}
        </div>
        <LeftArrow
          onClick={() => shiftDate("next")}
          className="mr-[-10px] h-[30px] w-[50px] scale-x-[-1] cursor-pointer"
        />
      </div>
    </div>
  );
}
