import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get token from URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (token) {
      // Save token to localStorage
      localStorage.setItem("token", token);
      // Redirect to main app
      navigate("/home");
    } else {
      // No token, redirect to login
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="flex h-screen items-center justify-center">
      <p>Logging you in...</p>
    </div>
  );
}
