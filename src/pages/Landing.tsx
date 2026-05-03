import { useNavigate } from "react-router-dom";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-10 py-6">
        <h1 className="scale-y-[1.1] font-editorial text-4xl tracking-[-2px]">
          Timeline.
        </h1>
        <button
          onClick={() => navigate("/login")}
          className="rounded-full bg-black px-5 py-1.5 font-editorial text-lg text-white hover:bg-gray-800"
        >
          login
        </button>
      </div>

      {/* Hero Section */}
      <div className="flex flex-1 items-center justify-center px-10">
        <div className="flex w-full max-w-5xl items-center justify-between gap-12">
          <div className="flex max-w-xl flex-col">
            <h2 className="mb-6 font-editorial text-6xl font-bold leading-tight tracking-tight">
              All your memories.
              <br />
              Just one line.
            </h2>
            <p className="mb-8 text-xl text-gray-700">
              Keep track of your story
              <br />
              one memory at a time.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="w-fit rounded-full bg-black px-6 py-2 font-editorial text-xl text-white hover:bg-gray-800"
            >
              get started
            </button>
          </div>

          <div className="relative flex flex-col items-center gap-6">
            <div className="absolute left-1/2 top-1/2 h-[3px] w-[140%] -translate-x-1/2 -translate-y-1/2 bg-black" />

            <div className="relative z-10 flex h-[160px] w-[220px] items-center justify-center rounded-2xl border-[3px] border-black bg-white">
              <span className="text-sm text-gray-400">illustration</span>
            </div>

            <div className="relative z-10 ml-12 flex h-[160px] w-[220px] items-center justify-center rounded-2xl border-[3px] border-black bg-white">
              <span className="text-sm text-gray-400">illustration</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
