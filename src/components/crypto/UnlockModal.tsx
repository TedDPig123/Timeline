import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/context";
import { CryptoBundle } from "../../types";

// Inline modal shown after login when the user's vault is locked. Overlays the
// timeline; no memory data loads until unlock succeeds.
export default function UnlockModal({ bundle }: { bundle: CryptoBundle }) {
  const { unlock, logout } = useAuth();
  const { theme } = useThemeContext();
  const [passphrase, setPassphrase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || busy) return;
    setBusy(true);
    setError(null);
    try {
      // A wrong passphrase makes AES-GCM auth fail inside unlock() and throws.
      await unlock(passphrase, bundle);
    } catch {
      setError("Incorrect passphrase. Try again.");
      setPassphrase("");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ color: theme.secondaryColor }}
    >
      <form
        onSubmit={handleUnlock}
        className="flex w-[360px] flex-col gap-4 rounded-[20px] p-8 shadow-2xl"
        style={{
          backgroundColor: theme.primaryColor,
          border: `2px solid ${theme.secondaryColor}`,
        }}
      >
        <h2 className="font-editorial text-2xl">Unlock your timeline</h2>
        <p className="text-sm opacity-70">
          Enter your passphrase to decrypt your memories for this session.
        </p>

        <input
          type="password"
          autoFocus
          value={passphrase}
          onChange={(e) => setPassphrase(e.target.value)}
          placeholder="Passphrase"
          className="rounded-lg border bg-transparent px-3 py-2 outline-none"
          style={{ borderColor: theme.secondaryColor }}
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={busy || !passphrase}
          className="rounded-lg px-4 py-2 font-medium disabled:opacity-50"
          style={{
            backgroundColor: theme.secondaryColor,
            color: theme.primaryColor,
          }}
        >
          {busy ? "Unlocking…" : "Unlock"}
        </button>

        <button
          type="button"
          onClick={logout}
          className="text-xs underline opacity-60 hover:opacity-100"
        >
          Sign out
        </button>
      </form>
    </div>
  );
}
