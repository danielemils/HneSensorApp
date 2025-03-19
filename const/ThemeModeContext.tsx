import { createContext } from "react";

export type ColorScheme = "light" | "dark";

export const ThemeModeContext = createContext<ColorScheme | undefined>(
  undefined
);
export const ThemeModeToggleContext = createContext<(() => void) | undefined>(
  undefined
);
