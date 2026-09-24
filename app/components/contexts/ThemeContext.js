"use client";

import { createContext, useContext, useCallback, useSyncExternalStore } from "react";

const ThemeContext = createContext(null);

const STORAGE_KEY = "theme";
const DEFAULT_THEME = "light";

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // localStorage unavailable
  }
}

function subscribe(callback) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => observer.disconnect();
}

function getSnapshot() {
  const t = document.documentElement.getAttribute("data-theme");
  return t === "dark" || t === "light" ? t : DEFAULT_THEME;
}

function getServerSnapshot() {
  return DEFAULT_THEME;
}

export function ThemeProvider({ children }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const toggleTheme = useCallback(() => {
    const current = getSnapshot();
    const next = current === "dark" ? "light" : "dark";
    applyTheme(next);
  }, []);

  const setTheme = useCallback((next) => {
    if (next === "dark" || next === "light") applyTheme(next);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
