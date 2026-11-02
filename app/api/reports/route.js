import { connectDB } from "@/lib/mongodb";

function toClient(item) {
  if (!item) return item;
  const { _id, ...rest } = item;
  return { ...rest, id: _id ? _id.toString() : rest.id };
}

function datePart(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).trim().slice(0, 10);
}

function monthPart(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 7);
  const m = /^(\d{4})-(\d{2})/.exec(String(value).trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

function inRange(dateStr, start, end) {
  const d = datePart(dateStr);
  if (!d) return false;
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

/** Monthly records (payrolls) match when their month overlaps the selected range. */
function monthInRange(month, start, end) {
  const m = monthPart(month);
  if (!m) return !start && !end;
  const startMonth = monthPart(start);
  const endMonth = monthPart(end);
  if (startMonth && m < startMonth) return false;
  if (endMonth && m > endMonth) return false;
  return true;
}

/**
 * A payroll row belongs to one employee and one month. The live data contains a
 * stale duplicate for Shamim AL Mamun (old employee id) alongside the current
 * row, so collapse by employee name + month, preferring the row whose
 * employeeId still exists and then the newest record.
 */
function dedupePayrolls(payrolls, validEmployeeIds) {
  const byKey = new Map();
  for (const p of payrolls) {
    const name = String(p.employeeName || "").trim().toLowerCase();
    const key = `${p.month || ""}|${name || p.employeeId}`;
    const candidate = {
      payroll: p,
      valid: validEmployeeIds.has(String(p.employeeId)),
      created: new Date(p.createdAt || 0).getTime(),
    };
    const existing = byKey.get(key);
    if (
      !existing ||
      (candidate.valid && !existing.valid) ||
      (candidate.valid === existing.valid && candidate.created > existing.created)
    ) {
      byKey.set(key, candidate);
    }
  }
  return [...byKey.values()].map((entry) => entry.payroll);
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const body = await request.json();
    const { reportId, start = "", end = "" } = body || {};
    const hasRange = Boolean(start || end);

    let rows = [];

    const applyDate = (arr, dateKey = "date") =>
      (arr || []).filter((r) => {
        if (!hasRange) return true;
        return inRange(r[dateKey], start, end);
      });

    switch (reportId) {
      case "loan": {
        rows = applyDate(await db.collection("loans").find({}).toArray(), "startDate");
        break;
      }
      case "employee": {
        rows = applyDate(await db.collection("employees").find({}).toArray(), "hireDate");
        break;
      }
      case "salary": {
        // Salary Distribution records: actual money disbursed to staff.
        const payments = applyDate(await db.collection("salaryPayments").find({}).toArray(), "date");
        rows = payments.map((p) => ({
          employee: p.employeeName || p.employee || "—",
          period: monthPart(p.date) || "—",
          amount: p.amount,
          status: p.status || "—",
          date: p.date || "",
          method: p.method || "—",
          purpose: p.purpose || "—",
        }));
        break;
      }
      case "investment": {
        const investments = applyDate(await db.collection("investments").find({}).toArray(), "date");
        rows = investments.map((i) => ({
          name: i.name || i.investor || "—",
          amount: i.amount,
          category: i.category || "—",
          status: i.status || "—",
          date: i.date || "",
        }));
        break;
      }
      case "expense": {
        // Real office-expense entries rather than legacy demo data.
        const entries = applyDate(await db.collection("expenseEntries").find({}).toArray(), "date");
        rows = entries.map((e) => ({
          category: e.category || e.subCategory || "—",
          amount: e.amount,
          month: e.month || monthPart(e.date) || "—",
          status: e.approvalStatus || e.status || "—",
          notes: e.description || e.subCategory || "",
          date: e.date || "",
          voucherNo: e.voucherNo || "",
        }));
        break;
      }
      case "route-cost": {
        // Real route-cost entries. The legacy `routes` demo collection has no
        // relationship to the route-calculation module.
        const entries = applyDate(await db.collection("routeEntries").find({}).toArray(), "date");
        rows = entries.map((e) => ({
          route: e.category || "—",
          vehicle: e.subCategory || "—",
          cost: e.amount,
          status: e.approvalStatus || e.status || "—",
          date: e.date || "",
          voucherNo: e.voucherNo || "",
          notes: e.description || "",
        }));
        break;
      }
      case "employee-expense-item": {
        // Employee-linked disbursements (salary/pay-staff) plus every real
        // office-expense entry. Office entries do not store an employee, so the
        // employee column is intentionally "—".
        const payments = applyDate(await db.collection("salaryPayments").find({}).toArray(), "date").map((p) => ({
          employeeName: p.employeeName || p.employee || "—",
          item: p.purpose || "Salary payment",
          category: "Salary",
          date: p.date || "",
          amount: p.amount,
        }));
        const expenseRows = applyDate(await db.collection("expenseEntries").find({}).toArray(), "date").map((e) => ({
          employeeName: "—",
          item: e.description || e.subCategory || e.category || "Office Expense",
          category: e.category || e.subCategory || "—",
          date: e.date || "",
          amount: e.amount,
        }));
        rows = [...payments, ...expenseRows];
        break;
      }
      case "payroll": {
        const [rawPayrolls, employees, adjustments] = await Promise.all([
          db.collection("payrolls").find({}).toArray(),
          db.collection("employees").find({}).toArray(),
          db.collection("payroll_adjustments").find({}).toArray(),
        ]);
        const validEmployeeIds = new Set(employees.map((e) => String(e._id)));
        const payrolls = dedupePayrolls(rawPayrolls, validEmployeeIds).filter((p) =>
          monthInRange(p.month, start, end)
        );
        rows = payrolls.map((p) => {
          const payrollId = p._id ? p._id.toString() : String(p.id || "");
          const empAdjustments = adjustments.filter((a) => String(a.payrollId) === payrollId);
          const bonusTotal = empAdjustments.filter((a) => a.type === "Bonus").reduce((s, a) => s + (Number(a.amount) || 0), 0);
          const allowanceTotal = empAdjustments.filter((a) => a.type === "Allowance").reduce((s, a) => s + (Number(a.amount) || 0), 0);
          const deductionTotal = empAdjustments.filter((a) => a.type === "Deduction").reduce((s, a) => s + (Number(a.amount) || 0), 0);
          const net = (Number(p.basicSalary) || 0) + bonusTotal + allowanceTotal - deductionTotal;
          return {
            employeeName: p.employeeName || "—",
            period: p.month || "—",
            basicSalary: p.basicSalary || 0,
            bonusTotal,
            allowanceTotal,
            deductionTotal,
            net: Math.round(net * 100) / 100,
            status: p.status || "Pending",
          };
        });
        break;
      }
      default: {
        return Response.json({ error: "Unknown report id" }, { status: 400 });
      }
    }

    return Response.json({ data: rows.map(toClient) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
