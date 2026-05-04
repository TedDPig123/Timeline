import { useNavigate } from "react-router-dom";
import ImageOne from "../assets/illustrations/SVG/Valentine's-Day.svg";
import ImageTwo from "../assets/illustrations/SVG/Chill-Time.svg";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="flex items-center justify-between px-10 pt-6">
        <h1 className="scale-y-[1.1] font-editorial text-6xl tracking-[-2px]">
          Timeline.
        </h1>
        <button
          onClick={() => navigate("/login")}
          className="rounded-full bg-black px-6 pb-3 pt-2 font-editorial text-2xl text-white hover:bg-gray-800"
        >
          login
        </button>
      </div>

      <div className=" mb-8 flex flex-1 items-center justify-center px-10">
        <div className="flex w-full flex-col px-40">
          <div className="flex h-[35vh] w-full flex-row items-end">
            <h2 className="font-helvetica-med mb-10 w-[2000px] text-7xl font-bold leading-tight tracking-tight">
              All your memories.
              <br />
              Just one line.
            </h2>
            <div className="slider-container h-full w-full items-start">
              <div className="landing-thumbnail ml-20 flex h-full w-[400px] flex-col items-center justify-end">
                <div className="flex h-[90%] w-full items-center justify-center overflow-hidden rounded-[28px] border-[4px] border-black">
                  <img src={ImageOne} alt="" className="h-[110%] w-[110%]" />
                </div>
                <div className="mt-1 h-[8%] w-[6px] bg-black"></div>
              </div>
            </div>
          </div>
          <div className="h-[6px] w-full bg-black"></div>
          <div className="flex h-[35vh] w-full flex-row items-start">
            <div></div>
            <div className="font-helvetica-lite mb-10 mt-9 w-[1200px] flex-col text-5xl leading-tight tracking-tight text-gray-500">
              <div>Keep track of your story</div>
              <div>one memory at a time.</div>
              <button
                onClick={() => navigate("/login")}
                className="mt-5 w-fit rounded-full bg-black px-6 pb-3 pt-2 font-editorial text-2xl text-white hover:bg-gray-800"
              >
                get started
              </button>
            </div>

            <div className="slider-container h-full w-full items-start">
              <div className="landing-thumbnail flex h-full w-[400px] flex-col items-center justify-start">
                <div className="mb-1 h-[8%] w-[6px] bg-black"></div>
                <div className="h-[90%] w-full items-center justify-center overflow-hidden rounded-[28px] border-[4px] border-black">
                  <img src={ImageTwo} alt="" className="h-[110%] w-[110%]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
