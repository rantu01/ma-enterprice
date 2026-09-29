"use client";

// Shared helpers for the Route Calculation module.
// Same structure and workflow as the Office Expense module
// (see app/lib/office-expense-utils.js), backed by route-scoped collections:
//   - routeCategories: { mainCategory, subCategories[], order }
//   - routeEntries: { month YYYY-MM, date YYYY-MM-DD, voucherNo, category,
//                     subCategory, description, amount, approvalStatus }
//   - routeMonths: { month YYYY-MM }

export const VOUCHER_PREFIX = "MAART2";
export const VOUCHER_SEQ_WIDTH = 8;

export const ENTRY_STATUSES = [
  { value: "Approved", label: "Approved" },
  { value: "Pending", label: "Pending" },
  { value: "Rejected", label: "Rejected" },
];

export function formatMoney(n) {
  return `৳${(Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
}

export function getCurrentMonthCode(now = new Date()) {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getCurrentYear() {
  return String(new Date().getFullYear());
}

/** Last day of the current month (YYYY-MM-DD) — max selectable entry date. */
export function getMaxEntryDateStr(now = new Date()) {
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const y = end.getFullYear();
  const m = String(end.getMonth() + 1).padStart(2, "0");
  const d = String(end.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** True when a YYYY-MM-DD value falls in a month that has not started yet. */
export function isFutureMonthDateStr(value, now = new Date()) {
  const m = /^(\d{4})-(\d{2})/.exec(String(value || "").trim());
  if (!m) return false;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || mo < 1 || mo > 12) return false;
  const ny = now.getFullYear();
  const nmo = now.getMonth() + 1;
  return y > ny || (y === ny && mo > nmo);
}

/** Derive the YYYY-MM month code from a YYYY-MM-DD date string. */
export function monthCodeFromDate(dateStr) {
  const m = /^(\d{4})-(\d{2})-\d{2}/.exec(String(dateStr || "").trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

export function formatMonthLabel(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || "";
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function parseVoucherSeq(voucherNo) {
  const m = new RegExp(`^${VOUCHER_PREFIX}(\\d+)$`).exec(String(voucherNo || "").trim());
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  return Number.isFinite(n) ? n : 0;
}

/** Next voucher preview from locally loaded entries (server assigns on save). */
export function getNextVoucherNo(entries) {
  let max = 0;
  (entries || []).forEach((e) => {
    const s = parseVoucherSeq(e.voucherNo);
    if (s > max) max = s;
  });
  return `${VOUCHER_PREFIX}${String(max + 1 || 1).padStart(VOUCHER_SEQ_WIDTH, "0")}`;
}

/** Normalize a category doc's sub-categories to a string array. */
export function parseSubCategories(input) {
  if (Array.isArray(input)) return input.map((s) => String(s || "").trim()).filter(Boolean);
  if (typeof input === "string") return input.split(/[\n,]/).map((s) => s.trim()).filter(Boolean);
  return [];
}

/** "Approved" entries (and legacy docs without a status) count toward totals. */
export function isApprovedEntry(entry) {
  const s = entry?.approvalStatus || entry?.status;
  return !s || s === "Approved";
}

export function approvalBucket(entry) {
  const s = String(entry?.approvalStatus || entry?.status || "Approved");
  if (s === "Approved") return "approved";
  if (s === "Rejected") return "rejected";
  return "pending";
}

function round2(n) {
  return Math.round((Number(n) || 0) * 100) / 100;
}

function withPct(list, total) {
  return list.map((c) => ({
    ...c,
    total: round2(c.total),
    pct: total > 0 ? Math.round((c.total / total) * 1000) / 10 : 0,
  }));
}

/**
 * Client-side aggregation powering the Overview page:
 * lifetime totals, per-year and per-month breakdowns with category shares,
 * and approval counts. Computed from fetched route entry records.
 */
export function computeRouteOverview(entries = []) {
  const approved = (entries || []).filter(isApprovedEntry);

  const lifetimeTotal = round2(approved.reduce((s, e) => s + (Number(e.amount) || 0), 0));
  const lifetime = { total: lifetimeTotal, vouchers: approved.length };

  const monthsSet = new Set(approved.map((e) => e.month).filter(Boolean));
  const totalMonthsRecorded = monthsSet.size;

  const counts = { pending: 0, approved: 0, rejected: 0, total: (entries || []).length };
  (entries || []).forEach((e) => {
    counts[approvalBucket(e)] += 1;
  });

  const years = [...new Set(approved.map((e) => String(e.month || "").slice(0, 4)).filter(Boolean))].sort();

  const byYear = {};
  const byMonth = {};

  approved.forEach((e) => {
    const m = e.month;
    if (!m || !/^\d{4}-\d{2}$/.test(m)) return;
    const y = m.slice(0, 4);
    const amt = Number(e.amount) || 0;
    const cat = e.category || "Uncategorized";

    byYear[y] = byYear[y] || { total: 0, vouchers: 0, months: new Set(), cats: {} };
    byYear[y].total += amt;
    byYear[y].vouchers += 1;
    byYear[y].months.add(m);
    byYear[y].cats[cat] = byYear[y].cats[cat] || { total: 0, entries: 0 };
    byYear[y].cats[cat].total += amt;
    byYear[y].cats[cat].entries += 1;

    byMonth[m] = byMonth[m] || { total: 0, entries: 0, cats: {} };
    byMonth[m].total += amt;
    byMonth[m].entries += 1;
    byMonth[m].cats[cat] = byMonth[m].cats[cat] || { total: 0, entries: 0 };
    byMonth[m].cats[cat].total += amt;
    byMonth[m].cats[cat].entries += 1;
  });

  Object.keys(byYear).forEach((y) => {
    const g = byYear[y];
    const total = round2(g.total);
    const months = [...g.months].sort();
    const categories = withPct(
      Object.entries(g.cats)
        .map(([category, v]) => ({ category, ...v }))
        .sort((a, b) => b.total - a.total),
      total
    );
    byYear[y] = { total, vouchers: g.vouchers, months, monthsRecorded: months.length, avgMonthly: months.length ? round2(total / months.length) : 0, categories };
  });

  Object.keys(byMonth).forEach((m) => {
    const g = byMonth[m];
    const total = round2(g.total);
    byMonth[m] = {
      total,
      entries: g.entries,
      categories: withPct(
        Object.entries(g.cats)
          .map(([category, v]) => ({ category, ...v }))
          .sort((a, b) => b.total - a.total),
        total
      ),
    };
  });

  return { lifetime, totalMonthsRecorded, approvalCounts: counts, years, byYear, byMonth };
}
