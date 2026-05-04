import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthCallback() {
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      localStorage.setItem("token", token);
      setToken(token);
      navigate("/timeline", { replace: true });
    } else {
      navigate("/timeline", { replace: true });
    }
  }, [navigate, setToken]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Logging you in...</p>
    </div>
  );
}
