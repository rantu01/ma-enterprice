export const TOAST_TYPES = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
};

export const TOAST_DURATION = 4000;

export function isValidToastType(type) {
  return Object.values(TOAST_TYPES).includes(type);
}

export function createToast({ type = TOAST_TYPES.INFO, title, message }) {
  return {
    id: crypto.randomUUID(),
    type,
    title,
    message,
  };
}
