"use client";

import { createContext, useContext, useReducer, useCallback } from "react";
import { toastReducer, createAutoDismissDispatch } from "./toastReducer";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [state, dispatch] = useReducer(toastReducer, { toasts: [] });
  const addToast = useCallback(
    (toast) => {
      const dispatchToast = createAutoDismissDispatch(dispatch);
      dispatchToast(toast);
    },
    [dispatch]
  );
  const removeToast = useCallback(
    (id) => dispatch({ type: "REMOVE_TOAST", payload: id }),
    []
  );

  return (
    <ToastContext.Provider value={{ toasts: state.toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
