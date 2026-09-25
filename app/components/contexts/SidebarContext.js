"use client";

import { createContext, useContext, useReducer, useCallback, useState } from "react";

const SidebarContext = createContext(null);

function sidebarReducer(state, action) {
  switch (action.type) {
    case "TOGGLE":
      return { ...state, isCollapsed: !state.isCollapsed };
    case "EXPAND":
      return { ...state, isCollapsed: false };
    case "COLLAPSE":
      return { ...state, isCollapsed: true };
    default:
      return state;
  }
}

export function SidebarProvider({ children }) {
  const [state, dispatch] = useReducer(sidebarReducer, { isCollapsed: false });
  // Mobile drawer state — sidebar acts as an overlay below lg breakpoint
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => dispatch({ type: "TOGGLE" }), []);
  const expand = useCallback(() => dispatch({ type: "EXPAND" }), []);
  const collapse = useCallback(() => dispatch({ type: "COLLAPSE" }), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);
  const toggleMobile = useCallback(() => setMobileOpen((v) => !v), []);

  return (
    <SidebarContext.Provider
      value={{ isCollapsed: state.isCollapsed, toggle, expand, collapse, mobileOpen, openMobile, closeMobile, toggleMobile }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
