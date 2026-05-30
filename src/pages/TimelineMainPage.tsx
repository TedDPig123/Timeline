import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { NavBar } from "../components/ui/NavBar";
import { useThemeContext } from "@/context/context";
import Timeline from "../components/timeline/Timeline";
import LeftArrow from "../assets/graphics/left-arrow.svg?react";
import DateToggler from "@/components/ui/DateToggler";

export default function TimelineMainPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const { theme } = useThemeContext();

  useEffect(() => {
    if (!user && !isLoading) {
      navigate("/");
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div
      className={`timeline-main-page flex h-screen w-screen flex-col justify-between overflow-hidden`}
      style={{ backgroundColor: theme.primaryColor }}
    >
      <NavBar />

      <div className="relative flex min-h-0 flex-1 items-center overflow-hidden">
        <Timeline />

        {/* Timeline bar*/}
        <div
          className="pointer-events-none absolute z-30 h-[6px]"
          style={{
            left: "90px",
            right: "90px",
            backgroundColor: theme.secondaryColor,
          }}
        />

        {/* Left fade overlay + arrow */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-full w-[200px] items-center justify-start">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to right, ${theme.primaryColor} 0%, ${theme.primaryColor} 55%, transparent 100%)`,
            }}
          />
          <LeftArrow
            id="left-arrow"
            style={{ color: theme.secondaryColor }}
            className="pointer-events-auto relative z-40  ml-[30px] h-[32px] w-[50px] cursor-pointer"
          />
        </div>

        {/* Right fade overlay + arrow */}
        <div className="pointer-events-none absolute right-0 top-0 z-20 flex h-full w-[200px] items-center justify-end">
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to left, ${theme.primaryColor} 0%, ${theme.primaryColor} 55%, transparent 100%)`,
            }}
          />
          <LeftArrow
            id="right-arrow"
            style={{ color: theme.secondaryColor }}
            className="pointer-events-auto relative z-40 mr-[30px] h-[32px] w-[50px] scale-x-[-1] cursor-pointer"
          />
        </div>
      </div>
      <div className="flex shrink-0 justify-center pb-5">
        {/* Date toggler */}
        <DateToggler />
      </div>
    </div>
  );
}
