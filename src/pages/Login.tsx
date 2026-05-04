import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import GoogleIcon from "../assets/graphics/google-icon.png";

const API_URL = import.meta.env.PROD
  ? "https://timeline-production-600c.up.railway.app/api"
  : "http://localhost:3001/api";

export default function Login() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && !isLoading) {
      navigate("/timeline");
    }
  }, [user, isLoading, navigate]);

  const handleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-white">
      <div className="px-10 pt-6" onClick={() => navigate("/")}>
        <h1 className="scale-y-[1.1] cursor-pointer font-editorial text-6xl tracking-[-2px]">
          Timeline.
        </h1>
      </div>

      <div className="font-helvetica-med flex flex-1 flex-col items-center justify-center px-6">
        <h2 className="mb-2 text-4xl font-bold">Your story starts here.</h2>
        <p className="mb-8 text-3xl text-gray-400">
          Access your Timeline account
        </p>

        <button
          onClick={handleLogin}
          className="mb-3 flex w-[280px] items-center justify-center gap-3 rounded-full border border-black bg-white px-5 py-2.5 text-base shadow-lg transition hover:bg-gray-50"
        >
          <img src={GoogleIcon} className="h-6"></img>
          Continue with Google
        </button>

        <p className="mt-2 text-xs italic text-gray-400">
          *login and sign up are the same process!
        </p>
      </div>
    </div>
  );
}
