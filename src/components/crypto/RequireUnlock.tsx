import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/context";
import { getCryptoBundle } from "../../services/api";
import { CryptoBundle } from "../../types";
import CryptoSetup from "../../pages/CryptoSetup";
import UnlockModal from "./UnlockModal";

// Gate for authenticated pages. Until the session DEK is in memory, blocks the
// wrapped page and shows either first-time setup (no bundle yet) or the unlock
// modal (bundle exists). No memory data loads until unlocked.
export default function RequireUnlock({ children }: { children: ReactNode }) {
  const { user, isLoading, isUnlocked } = useAuth();
  const { theme } = useThemeContext();
  // undefined = not fetched yet, null = no bundle (needs setup)
  const [bundle, setBundle] = useState<CryptoBundle | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    if (user && !isUnlocked) {
      getCryptoBundle()
        .then((b) => active && setBundle(b))
        .catch(() => active && setBundle(null));
    }
    return () => {
      active = false;
    };
  }, [user, isUnlocked]);

  const loading = (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: theme.primaryColor, color: theme.secondaryColor }}
    >
      <p>Loading…</p>
    </div>
  );

  if (isLoading) return loading;
  if (!user) return <Navigate to="/" replace />;
  if (isUnlocked) return <>{children}</>;
  if (bundle === undefined) return loading;
  if (bundle === null) return <CryptoSetup />;
  return <UnlockModal bundle={bundle} />;
}
