import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  ReactNode,
} from "react";
import { User, CryptoBundle } from "../types";
import { deriveKEK, unwrapDEK, b64ToBuf } from "../services/crypto";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  setToken: (token: string) => void;
  // Client-side encryption: the unwrapped DEK lives here for the session only.
  // Never persisted; lost on tab close; re-derived at next login.
  dek: CryptoKey | null;
  isUnlocked: boolean;
  unlock: (passphrase: string, bundle: CryptoBundle) => Promise<void>;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function decodeUser(token: string): User | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.userId,
      email: payload.email,
      username: "",
      createdAt: "",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dek, setDek] = useState<CryptoKey | null>(null);

  useLayoutEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      const decoded = decodeUser(savedToken);
      if (decoded) {
        setTokenState(savedToken);
        setUser(decoded);
      } else {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      const decoded = decodeUser(savedToken);
      if (decoded) {
        setTokenState(savedToken);
        setUser(decoded);
      } else {
        localStorage.removeItem("token");
      }
    }
    setIsLoading(false);
  }, []);

  const setToken = (newToken: string) => {
    const decoded = decodeUser(newToken);
    if (decoded) {
      localStorage.setItem("token", newToken);
      setTokenState(newToken);
      setUser(decoded);
    }
  };

  const login = () => {
    window.location.href = "http://localhost:3001/api/auth/google";
  };

  const logout = () => {
    localStorage.removeItem("token");
    setTokenState(null);
    setUser(null);
    setDek(null);
  };

  // Derive the KEK from the passphrase + stored salt, then unwrap the DEK.
  // A wrong passphrase makes AES-GCM auth fail and unwrapDEK throws.
  const unlock = async (passphrase: string, bundle: CryptoBundle) => {
    const kek = await deriveKEK(passphrase, b64ToBuf(bundle.passphrase_salt));
    const unwrapped = await unwrapDEK(
      bundle.wrapped_dek_passphrase,
      bundle.wrapped_dek_passphrase_iv,
      kek,
    );
    setDek(unwrapped);
  };

  const lock = () => setDek(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        logout,
        setToken,
        dek,
        isUnlocked: dek !== null,
        unlock,
        lock,
      }}
    >
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
