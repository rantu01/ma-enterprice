function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function formatDateValue(value) {
  if (value === null || value === undefined || value === "") return "—";
  const raw = String(value).trim();
  if (!raw) return "—";

  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s].*)?$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${day}-${month}-${year}`;
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = String(date.getFullYear());
  return `${day}-${month}-${year}`;
}

export function sortByNewest(records = [], dateKey = "createdAt") {
  return [...records].sort((a, b) => {
    const aDate = a?.[dateKey] || a?.updatedAt || a?.createdAt || a?.date || 0;
    const bDate = b?.[dateKey] || b?.updatedAt || b?.createdAt || b?.date || 0;
    const aTime = aDate ? new Date(aDate).getTime() : 0;
    const bTime = bDate ? new Date(bDate).getTime() : 0;
    return bTime - aTime;
  });
}

export { cn };
