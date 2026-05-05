import { theme } from "./context";

export const themes: { light: theme; dark: theme } = {
  light: {
    name: "light",
    primaryColor: "#ffffff", //background
    secondaryColor: "#000000", //text and borders
    tertiaryColor: "#374151", //settings and signout buttons
    highlightColor: "#6b7280",
    isDark: false,
  },
  dark: {
    name: "dark",
    primaryColor: "#191919", //background
    secondaryColor: "#D4D4D4", //text and borders
    tertiaryColor: "#374151", //settings and signout buttons
    highlightColor: "#6b7280",
    isDark: true,
  },
};
