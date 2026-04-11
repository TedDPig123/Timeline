import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on load
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      // Decode user info from token
      try {
        const payload = JSON.parse(atob(savedToken.split(".")[1]));
        setUser({
          id: payload.userId,
          email: payload.email,
          username: "",
          createdAt: "",
        });
      } catch (e) {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    window.location.href = "http://localhost:3001/api/auth/google";
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
