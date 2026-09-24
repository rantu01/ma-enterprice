import { TOAST_DURATION } from "./toastTypes";

const MAX_TOASTS = 10;

export function toastReducer(state, action) {
  switch (action.type) {
    case "ADD_TOAST": {
      const toast = { ...action.payload, id: crypto.randomUUID() };
      const newToasts = [toast, ...state.toasts].slice(0, MAX_TOASTS);
      return { ...state, toasts: newToasts };
    }
    case "REMOVE_TOAST":
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.payload),
      };
    default:
      return state;
  }
}

export function createAutoDismissDispatch(dispatch, duration = TOAST_DURATION) {
  return (toast) => {
    dispatch({ type: "ADD_TOAST", payload: toast });
    setTimeout(() => {
      dispatch({ type: "REMOVE_TOAST", payload: toast.id });
    }, duration);
  };
}
