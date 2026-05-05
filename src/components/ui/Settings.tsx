import { useState, useRef, useEffect } from "react";
import { themes } from "@/context/theme";
import { useThemeContext, useSettingsContext } from "@/context/context";
import ExitIcon from "../../assets/graphics/cancel.svg?react";

type SettingsButtonProps = {
  isSettingsOpen: boolean;
  onClose: () => void;
};

const Settings = ({ isSettingsOpen, onClose }: SettingsButtonProps) => {
  const { theme, setTheme } = useThemeContext();
  const { settings, setSettings } = useSettingsContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
        style={{ backgroundColor: theme.primaryColor }}
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
          <div
            className="mb-2 mt-4 h-[1px] w-full opacity-60"
            style={{ backgroundColor: theme.secondaryColor }}
          ></div>
          <p className="mb-2">Scroll Mode</p>
          <div className="flex w-full justify-evenly">
            <button
              className="mr-1 w-full rounded py-2"
              onClick={() => setSettings({ useVerticalScroll: true })}
              style={{
                border: `1px solid ${theme.secondaryColor}`,
                color: theme.isDark
                  ? settings.useVerticalScroll
                    ? theme.primaryColor
                    : theme.secondaryColor
                  : settings.useVerticalScroll
                    ? theme.primaryColor
                    : theme.secondaryColor,
                backgroundColor: theme.isDark
                  ? settings.useVerticalScroll
                    ? theme.secondaryColor
                    : theme.primaryColor
                  : settings.useVerticalScroll
                    ? theme.secondaryColor
                    : theme.primaryColor,
                textDecoration: settings.useVerticalScroll
                  ? "underline"
                  : " none",
                textUnderlineOffset: "3px",
              }}
            >
              Vertical Scroll
            </button>
            <button
              className="ml-1 w-full rounded py-2"
              onClick={() => setSettings({ useVerticalScroll: false })}
              style={{
                border: `1px solid ${theme.secondaryColor}`,
                color: theme.isDark
                  ? !settings.useVerticalScroll
                    ? theme.primaryColor
                    : theme.secondaryColor
                  : !settings.useVerticalScroll
                    ? theme.primaryColor
                    : theme.secondaryColor,
                backgroundColor: theme.isDark
                  ? !settings.useVerticalScroll
                    ? theme.secondaryColor
                    : theme.primaryColor
                  : !settings.useVerticalScroll
                    ? theme.secondaryColor
                    : theme.primaryColor,
                textDecoration: !settings.useVerticalScroll
                  ? "underline"
                  : " none",
                textUnderlineOffset: "3px",
              }}
            >
              Horizontal Scroll
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export { Settings };
