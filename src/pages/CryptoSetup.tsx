import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useThemeContext } from "../context/context";

// First-time encryption setup, shown after login when the user has no crypto
// bundle yet. Two stages: choose a passphrase, then save the recovery code.
export default function CryptoSetup() {
  const { setupEncryption, completeSetup, logout } = useAuth();
  const { theme } = useThemeContext();

  const [passphrase, setPassphrase] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [recoveryCode, setRecoveryCode] = useState<string | null>(null);
  const [savedAcknowledged, setSavedAcknowledged] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (passphrase.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (passphrase !== confirm) {
      setError("Passphrases don't match.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const code = await setupEncryption(passphrase);
      setRecoveryCode(code);
    } catch {
      setError("Something went wrong setting up encryption. Try again.");
    } finally {
      setBusy(false);
    }
  };

  const panelStyle = {
    backgroundColor: theme.primaryColor,
    border: `2px solid ${theme.secondaryColor}`,
  };

  return (
    <div
      className="flex h-screen items-center justify-center"
      style={{ backgroundColor: theme.primaryColor, color: theme.secondaryColor }}
    >
      {recoveryCode === null ? (
        <form
          onSubmit={handleCreate}
          className="flex w-[420px] flex-col gap-4 rounded-[20px] p-8 shadow-2xl"
          style={panelStyle}
        >
          <h2 className="font-editorial text-3xl">Protect your memories</h2>
          <p className="text-sm opacity-80">
            Choose a passphrase. Your memories are encrypted in your browser
            with it, so the server can never read them.
          </p>

          <div
            className="rounded-lg p-3 text-xs"
            style={{ border: `1px solid ${theme.highlightColor}` }}
          >
            <strong>Important:</strong> there is no password reset. If you forget
            your passphrase, only your recovery code can get your memories back.
            If you lose both, they're gone for good.
          </div>

          <input
            type="password"
            autoFocus
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="Passphrase"
            className="rounded-lg border bg-transparent px-3 py-2 outline-none"
            style={{ borderColor: theme.secondaryColor }}
          />
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm passphrase"
            className="rounded-lg border bg-transparent px-3 py-2 outline-none"
            style={{ borderColor: theme.secondaryColor }}
          />

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={busy || !passphrase || !confirm}
            className="rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            style={{
              backgroundColor: theme.secondaryColor,
              color: theme.primaryColor,
            }}
          >
            {busy ? "Setting up…" : "Create passphrase"}
          </button>

          <button
            type="button"
            onClick={logout}
            className="text-xs underline opacity-60 hover:opacity-100"
          >
            Sign out
          </button>
        </form>
      ) : (
        <div
          className="flex w-[460px] flex-col gap-4 rounded-[20px] p-8 shadow-2xl"
          style={panelStyle}
        >
          <h2 className="font-editorial text-3xl">Save your recovery code</h2>
          <p className="text-sm opacity-80">
            This is the only way to recover your memories if you forget your
            passphrase. We will never show it again. Store it somewhere safe.
          </p>

          <code
            className="select-all break-all rounded-lg p-4 text-center text-sm tracking-wider"
            style={{
              backgroundColor: theme.isDark ? "#000" : "#f3f3f3",
              border: `1px solid ${theme.secondaryColor}`,
            }}
          >
            {recoveryCode}
          </code>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              checked={savedAcknowledged}
              onChange={(e) => setSavedAcknowledged(e.target.checked)}
              className="mt-1"
            />
            I have saved my recovery code somewhere safe.
          </label>

          <button
            type="button"
            disabled={!savedAcknowledged}
            onClick={completeSetup}
            className="rounded-lg px-4 py-2 font-medium disabled:opacity-50"
            style={{
              backgroundColor: theme.secondaryColor,
              color: theme.primaryColor,
            }}
          >
            Continue to my timeline
          </button>
        </div>
      )}
    </div>
  );
}
