import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { NavBar } from "../components/ui/NavBar";
import Timeline from "../components/timeline/Timeline";
import LeftArrow from "../assets/graphics/arrow-left.png";
import RightArrow from "../assets/graphics/arrow-right.png";

export default function TimelineMainPage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

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
    <div className="relative h-screen w-screen overflow-hidden bg-white">
      <NavBar />

      <div className="relative flex h-[calc(100vh-80px)] items-center">
        <Timeline />

        {/* Timeline bar*/}
        <div
          className="pointer-events-none absolute z-30 h-[6px] bg-black"
          style={{
            top: "49.6%",
            left: "90px",
            right: "90px",
          }}
        />

        {/* Left fade overlay + arrow */}
        <div className="pointer-events-none absolute left-0 top-0 z-20 flex h-full w-[200px] items-center justify-start">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, white 0%, white 30%, transparent 100%)",
            }}
          />
          <img
            id="left-arrow"
            src={LeftArrow}
            alt="move-left"
            className="pointer-events-auto relative z-40 ml-[30px] w-[50px] cursor-pointer"
          />
        </div>

        {/* Right fade overlay + arrow */}
        <div className="pointer-events-none absolute right-0 top-0 z-20 flex h-full w-[200px] items-center justify-end">
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to left, white 0%, white 30%, transparent 100%)",
            }}
          />
          <img
            id="right-arrow"
            src={RightArrow}
            alt="move-right"
            className="pointer-events-auto relative z-40 mr-[30px] w-[50px] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
