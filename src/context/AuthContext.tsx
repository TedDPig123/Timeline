import {
  createContext,
  useContext,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  ReactNode,
} from "react";
import { User, CryptoBundle } from "../types";
import {
  deriveKEK,
  unwrapDEK,
  generateDEK,
  generateSalt,
  generateRecoveryCode,
  normalizeRecoveryCode,
  wrapDEK,
  bufToB64,
  b64ToBuf,
} from "../services/crypto";
import { saveCryptoBundle, getCryptoBundle } from "../services/api";
import { migrateLegacyCards } from "../services/migrate";

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
  // First-time setup: generates the DEK, wraps it under the passphrase and a
  // recovery code, stores the bundle, and unlocks. Returns the recovery code
  // to show the user once.
  setupEncryption: (passphrase: string) => Promise<string>;
  completeSetup: () => void;
  unlock: (passphrase: string, bundle: CryptoBundle) => Promise<void>;
  // Recover access with the recovery code and set a new passphrase, then unlock.
  recoverWithCode: (
    recoveryCode: string,
    newPassphrase: string,
    bundle: CryptoBundle,
  ) => Promise<void>;
  // Change the passphrase (re-wraps the same DEK). Requires the old passphrase.
  changePassphrase: (
    oldPassphrase: string,
    newPassphrase: string,
  ) => Promise<void>;
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
  // DEK generated during setup, held until the user acknowledges the recovery
  // code (so the app doesn't unlock out from under the recovery screen).
  const pendingDekRef = useRef<CryptoKey | null>(null);

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
    // Drop the session key (and any pending one) so it can't be used post-logout.
    setDek(null);
    pendingDekRef.current = null;
  };

  // Generate a fresh DEK, wrap it twice (passphrase + recovery code), persist
  // the bundle, and unlock for this session. Returns the recovery code.
  const setupEncryption = async (passphrase: string): Promise<string> => {
    const newDek = await generateDEK();
    const recoveryCode = generateRecoveryCode();

    const passphraseSalt = generateSalt();
    const recoverySalt = generateSalt();
    const passphraseKek = await deriveKEK(passphrase, passphraseSalt);
    const recoveryKek = await deriveKEK(
      normalizeRecoveryCode(recoveryCode),
      recoverySalt,
    );

    const wrappedByPassphrase = await wrapDEK(newDek, passphraseKek);
    const wrappedByRecovery = await wrapDEK(newDek, recoveryKek);

    await saveCryptoBundle({
      passphrase_salt: bufToB64(passphraseSalt),
      recovery_salt: bufToB64(recoverySalt),
      wrapped_dek_passphrase: wrappedByPassphrase.wrapped,
      wrapped_dek_passphrase_iv: wrappedByPassphrase.iv,
      wrapped_dek_recovery: wrappedByRecovery.wrapped,
      wrapped_dek_recovery_iv: wrappedByRecovery.iv,
    });

    // Don't unlock yet — hold the DEK until completeSetup() so the recovery
    // code screen stays up.
    pendingDekRef.current = newDek;
    return recoveryCode;
  };

  // Called once the user confirms they've saved their recovery code.
  const completeSetup = () => {
    if (pendingDekRef.current) {
      const newDek = pendingDekRef.current;
      setDek(newDek);
      pendingDekRef.current = null;
      // Encrypt any pre-existing plaintext cards in the background.
      void migrateLegacyCards(newDek);
    }
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
    // Encrypt any remaining legacy plaintext cards in the background.
    void migrateLegacyCards(unwrapped);
  };

  // Re-wrap the DEK under a new passphrase and persist the bundle, leaving the
  // recovery wrapper untouched. Shared by recovery and change-passphrase.
  const rewrapPassphrase = async (
    dek: CryptoKey,
    newPassphrase: string,
    bundle: CryptoBundle,
  ) => {
    const newSalt = generateSalt();
    const newKek = await deriveKEK(newPassphrase, newSalt);
    const wrapped = await wrapDEK(dek, newKek);
    await saveCryptoBundle({
      passphrase_salt: bufToB64(newSalt),
      wrapped_dek_passphrase: wrapped.wrapped,
      wrapped_dek_passphrase_iv: wrapped.iv,
      // recovery wrapper unchanged
      recovery_salt: bundle.recovery_salt,
      wrapped_dek_recovery: bundle.wrapped_dek_recovery,
      wrapped_dek_recovery_iv: bundle.wrapped_dek_recovery_iv,
    });
  };

  // Forgot passphrase: unwrap the DEK with the recovery code, set a new
  // passphrase, and unlock. The recovery code itself is unchanged.
  const recoverWithCode = async (
    recoveryCode: string,
    newPassphrase: string,
    bundle: CryptoBundle,
  ) => {
    const recoveryKek = await deriveKEK(
      normalizeRecoveryCode(recoveryCode),
      b64ToBuf(bundle.recovery_salt),
    );
    const recoveredDek = await unwrapDEK(
      bundle.wrapped_dek_recovery,
      bundle.wrapped_dek_recovery_iv,
      recoveryKek,
    );
    await rewrapPassphrase(recoveredDek, newPassphrase, bundle);
    setDek(recoveredDek);
    void migrateLegacyCards(recoveredDek);
  };

  // Change passphrase: verify the old one by unwrapping, then re-wrap the same
  // DEK under the new passphrase.
  const changePassphrase = async (
    oldPassphrase: string,
    newPassphrase: string,
  ) => {
    const bundle = await getCryptoBundle();
    if (!bundle) throw new Error("Encryption is not set up");
    const oldKek = await deriveKEK(
      oldPassphrase,
      b64ToBuf(bundle.passphrase_salt),
    );
    // Throws on a wrong old passphrase (AES-GCM auth failure).
    const currentDek = await unwrapDEK(
      bundle.wrapped_dek_passphrase,
      bundle.wrapped_dek_passphrase_iv,
      oldKek,
    );
    await rewrapPassphrase(currentDek, newPassphrase, bundle);
    setDek(currentDek);
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
        setupEncryption,
        completeSetup,
        unlock,
        recoverWithCode,
        changePassphrase,
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
