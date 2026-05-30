import { useNavigate } from "react-router-dom";
import ImageOne from "../assets/illustrations/SVG/Valentine's-Day.svg";
import ImageTwo from "../assets/illustrations/SVG/Chill-Time.svg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-[6vw] pt-6">
        <h1
          className="scale-y-[1.1] cursor-default font-editorial tracking-[-2px]"
          style={{ fontSize: "clamp(3rem, 5vw, 4rem)" }}
        >
          Timeline.
        </h1>
        <button
          onClick={() => navigate("/login")}
          className="rounded-full bg-black px-6 pb-3 pt-2 font-editorial text-white hover:bg-gray-800"
          style={{ fontSize: "clamp(1.4rem, 1.5vw, 2rem)" }}
        >
          login
        </button>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col justify-center px-[6vw] py-8">
        <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-0">
          {/* Top row: heading + first illustration */}
          <div className="flex items-end gap-[4vw]">
            <h2
              className="font-helvetica-med mb-8 flex-1 cursor-default font-bold leading-[1.05] tracking-tight"
              style={{ fontSize: "clamp(2rem, 5.5vw, 5.5rem)" }}
            >
              All your memories.
              <br />
              Just one line.
            </h2>
            <div className="flex w-[28%] min-w-[180px] max-w-[400px] flex-col items-center">
              <div className="aspect-square w-full overflow-hidden rounded-[28px] border-[4px] border-black">
                <img
                  src={ImageOne}
                  alt=""
                  className="h-full w-full object-cover"
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
              <div className="h-[24px] w-[6px] bg-black" />
            </div>
          </div>

          {/* The line */}
          <div className="h-[6px] w-full bg-black" />

          {/* Bottom row: subtitle + CTA + second illustration */}
          <div className="flex items-start gap-[4vw]">
            <div
              className="font-helvetica-lite mt-10 flex-1 cursor-default leading-tight tracking-tight text-gray-500"
              style={{ fontSize: "clamp(1.25rem, 3vw, 3rem)" }}
            >
              <div>Keep track of your story</div>
              <div>one memory at a time.</div>
              <button
                onClick={() => navigate("/login")}
                className="mt-5 w-fit rounded-full bg-black px-6 pb-3 pt-2 font-editorial text-white hover:bg-gray-800"
                style={{ fontSize: "clamp(1.4rem, 1.5vw, 2rem)" }}
              >
                get started
              </button>
            </div>

            <div className="mr-[20vw] flex w-[28%] min-w-[180px] max-w-[400px] flex-col items-center">
              <div className="h-[24px] w-[6px] bg-black" />
              <div className="aspect-square w-full overflow-hidden rounded-[28px] border-[4px] border-black">
                <img
                  src={ImageTwo}
                  alt=""
                  className="h-full w-full object-cover"
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
