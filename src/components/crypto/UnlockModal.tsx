import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useThemeContext } from "../../context/context";
import { CryptoBundle } from "../../types";

// Inline modal shown after login when the user's vault is locked. Overlays the
// timeline; no memory data loads until unlock succeeds. Also offers recovery
// via the recovery code when the passphrase is forgotten.
export default function UnlockModal({ bundle }: { bundle: CryptoBundle }) {
  const { unlock, recoverWithCode, logout } = useAuth();
  const { theme } = useThemeContext();
  const [mode, setMode] = useState<"unlock" | "recover">("unlock");

  const [passphrase, setPassphrase] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassphrase, setNewPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passphrase || busy) return;
    setBusy(true);
    setError(null);
    try {
      await unlock(passphrase, bundle);
    } catch {
      setError("Incorrect passphrase. Try again.");
      setPassphrase("");
    } finally {
      setBusy(false);
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (newPassphrase.length < 8) {
      setError("New passphrase must be at least 8 characters.");
      return;
    }
    if (newPassphrase !== confirm) {
      setError("New passphrases don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await recoverWithCode(recoveryCode, newPassphrase, bundle);
    } catch {
      setError("That recovery code didn't work. Check it and try again.");
    } finally {
      setBusy(false);
    }
  };

  const inputStyle = {
    borderColor: theme.secondaryColor,
  };
  const buttonStyle = {
    backgroundColor: theme.secondaryColor,
    color: theme.primaryColor,
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{ color: theme.secondaryColor }}
    >
      {mode === "unlock" ? (
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
            style={inputStyle}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={busy || !passphrase}
            className="rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            style={buttonStyle}
          >
            {busy ? "Unlocking…" : "Unlock"}
          </button>

          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("recover");
                setError(null);
              }}
              className="underline opacity-60 hover:opacity-100"
            >
              Forgot passphrase?
            </button>
            <button
              type="button"
              onClick={logout}
              className="underline opacity-60 hover:opacity-100"
            >
              Sign out
            </button>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handleRecover}
          className="flex w-[400px] flex-col gap-4 rounded-[20px] p-8 shadow-2xl"
          style={{
            backgroundColor: theme.primaryColor,
            border: `2px solid ${theme.secondaryColor}`,
          }}
        >
          <h2 className="font-editorial text-2xl">Recover access</h2>
          <p className="text-sm opacity-70">
            Enter your recovery code and choose a new passphrase.
          </p>

          <input
            type="text"
            autoFocus
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            placeholder="Recovery code"
            className="rounded-lg border bg-transparent px-3 py-2 font-mono text-sm outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            value={newPassphrase}
            onChange={(e) => setNewPassphrase(e.target.value)}
            placeholder="New passphrase"
            className="rounded-lg border bg-transparent px-3 py-2 outline-none"
            style={inputStyle}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new passphrase"
            className="rounded-lg border bg-transparent px-3 py-2 outline-none"
            style={inputStyle}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={busy || !recoveryCode || !newPassphrase}
            className="rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            style={buttonStyle}
          >
            {busy ? "Recovering…" : "Reset passphrase & unlock"}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode("unlock");
              setError(null);
            }}
            className="text-xs underline opacity-60 hover:opacity-100"
          >
            Back to unlock
          </button>
        </form>
      )}
    </div>
  );
}
