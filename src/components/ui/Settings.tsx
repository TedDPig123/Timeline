import { useState, useRef, useEffect } from "react";
import { themes } from "@/context/theme";
import { useThemeContext } from "@/context/context";
import { useAuth } from "@/context/AuthContext";
import ExitIcon from "../../assets/graphics/cancel.svg?react";

type SettingsButtonProps = {
  isSettingsOpen: boolean;
  onClose: () => void;
};

const Settings = ({ isSettingsOpen, onClose }: SettingsButtonProps) => {
  const { theme, setTheme } = useThemeContext();
  const { changePassphrase } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // change-passphrase form state
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [ppBusy, setPpBusy] = useState(false);
  const [ppError, setPpError] = useState<string | null>(null);
  const [ppDone, setPpDone] = useState(false);

  const handleChangePassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (ppBusy) return;
    setPpError(null);
    setPpDone(false);
    if (newPass.length < 8) {
      setPpError("New passphrase must be at least 8 characters.");
      return;
    }
    if (newPass !== confirmPass) {
      setPpError("New passphrases don't match.");
      return;
    }
    setPpBusy(true);
    try {
      await changePassphrase(oldPass, newPass);
      setPpDone(true);
      setOldPass("");
      setNewPass("");
      setConfirmPass("");
    } catch {
      setPpError("Couldn't change passphrase. Is the current one correct?");
    } finally {
      setPpBusy(false);
    }
  };

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  if (!isSettingsOpen) return null;

  const themeNames = Object.keys(themes) as (keyof typeof themes)[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-500 bg-opacity-10 backdrop-blur-[2px]"
        onClick={onClose}
      ></div>
      <div
        className="mb-15 relative z-10 flex w-[400px] flex-col items-center rounded-lg border border-gray-300 bg-white p-8 shadow-lg"
        style={{
          backgroundColor: theme.primaryColor,
          border: `2px solid ${theme.secondaryColor}`,
        }}
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded px-1 py-1 text-xs"
          style={{ color: theme.secondaryColor }}
        >
          <ExitIcon
            className="h-5 w-5"
            style={{ color: theme.secondaryColor }}
          />
        </button>
        <div className="flex w-full flex-col items-start">
          <h2 className="mb-2 font-editorial text-3xl">Settings</h2>
          <div
            className="mb-2 h-[3px] w-full"
            style={{ backgroundColor: theme.secondaryColor }}
          ></div>
          <p className="mb-2">Themes</p>

          {/*  dropdown1 */}
          <div className="relative w-full" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsOpen((o) => !o)}
              className="flex w-full items-center justify-between rounded border px-3 py-2 text-sm transition-colors"
              style={{
                borderColor: theme.secondaryColor,
                color: theme.secondaryColor,
                backgroundColor: theme.primaryColor,
              }}
            >
              <span>{theme.name ?? "Select theme"}</span>
              <span
                className={`ml-2 transition-transform ${isOpen ? "rotate-180" : ""}`}
              >
                ▾
              </span>
            </button>

            {isOpen && (
              <ul
                className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded border shadow-lg"
                style={{
                  borderColor: theme.secondaryColor,
                  backgroundColor: theme.primaryColor,
                }}
              >
                {themeNames.map((name) => (
                  <li key={name}>
                    <button
                      type="button"
                      onClick={() => {
                        setTheme(themes[name]);
                        setIsOpen(false);
                      }}
                      className="block w-full px-3 py-2 text-left text-sm hover:opacity-80"
                      style={{
                        color: theme.secondaryColor,
                        backgroundColor: theme.primaryColor,
                      }}
                    >
                      {name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Security: change passphrase */}
          <p className="mb-2 mt-6">Security</p>
          <form
            onSubmit={handleChangePassphrase}
            className="flex w-full flex-col gap-2"
          >
            <input
              type="password"
              value={oldPass}
              onChange={(e) => setOldPass(e.target.value)}
              placeholder="Current passphrase"
              className="rounded border bg-transparent px-3 py-2 text-sm outline-none"
              style={{
                borderColor: theme.secondaryColor,
                color: theme.secondaryColor,
              }}
            />
            <input
              type="password"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
              placeholder="New passphrase"
              className="rounded border bg-transparent px-3 py-2 text-sm outline-none"
              style={{
                borderColor: theme.secondaryColor,
                color: theme.secondaryColor,
              }}
            />
            <input
              type="password"
              value={confirmPass}
              onChange={(e) => setConfirmPass(e.target.value)}
              placeholder="Confirm new passphrase"
              className="rounded border bg-transparent px-3 py-2 text-sm outline-none"
              style={{
                borderColor: theme.secondaryColor,
                color: theme.secondaryColor,
              }}
            />
            {ppError && <p className="text-xs text-red-500">{ppError}</p>}
            {ppDone && (
              <p className="text-xs text-green-600">Passphrase changed.</p>
            )}
            <button
              type="submit"
              disabled={ppBusy || !oldPass || !newPass}
              className="rounded px-3 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: theme.secondaryColor,
                color: theme.primaryColor,
              }}
            >
              {ppBusy ? "Changing…" : "Change passphrase"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export { Settings };
