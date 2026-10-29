import { connectDB } from "@/lib/mongodb";

function toISO(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function getDate(item, fields) {
  for (const field of fields) {
    const val = toISO(item[field]);
    if (val) return val;
  }
  return null;
}

function money(n) {
  return (Number(n) || 0).toLocaleString();
}

export async function GET() {
  try {
    const { db } = await connectDB();

    const [
      loans,
      payments,
      investments,
      deposits,
      expenseEntries,
      routeEntries,
      salaryPayments,
      employees,
    ] = await Promise.all([
      db.collection("loans").find({}).sort({ createdAt: -1, _id: -1 }).limit(20).toArray(),
      db.collection("payments").find({}).sort({ createdAt: -1, date: -1, _id: -1 }).limit(20).toArray(),
      db.collection("investments").find({}).sort({ createdAt: -1, date: -1, _id: -1 }).limit(20).toArray(),
      db.collection("deposits").find({}).sort({ createdAt: -1, date: -1, _id: -1 }).limit(20).toArray(),
      db.collection("expenseEntries").find({}).sort({ createdAt: -1, date: -1, _id: -1 }).limit(20).toArray(),
      db.collection("routeEntries").find({}).sort({ createdAt: -1, date: -1, _id: -1 }).limit(20).toArray(),
      db.collection("salaryPayments").find({}).sort({ createdAt: -1, date: -1, _id: -1 }).limit(20).toArray(),
      db.collection("employees").find({}).sort({ createdAt: -1, hireDate: -1, _id: -1 }).limit(20).toArray(),
    ]);

    const activities = [];

    loans.forEach((l) => {
      const date = getDate(l, ["createdAt", "startDate", "dueDate"]);
      activities.push({
        id: `loan-${l._id}`,
        type: "loan",
        title: "New loan",
        description: `${l.organizationName || "Unknown organization"} — ৳${money(l.amount)}`,
        timestamp: date || "",
        date,
        iconName: "landmark",
      });
    });

    payments.forEach((p) => {
      const date = getDate(p, ["createdAt", "date", "paymentDate"]);
      const status = String(p.status || "").charAt(0).toUpperCase() + String(p.status || "").slice(1);
      activities.push({
        id: `payment-${p._id}`,
        type: "payment",
        title: "Loan payment",
        description: `${p.loanOrganization || "Unknown"} — ৳${money(p.amount)} (${status || "—"})`,
        timestamp: date || "",
        date,
        iconName: "credit-card",
      });
    });

    investments.forEach((inv) => {
      const date = getDate(inv, ["createdAt", "date"]);
      activities.push({
        id: `investment-${inv._id}`,
        type: "investment",
        title: "New investment",
        description: `${inv.name || "Unknown investment"} — ৳${money(inv.amount)}`,
        timestamp: date || "",
        date,
        iconName: "trending-up",
      });
    });

    deposits.forEach((dep) => {
      const date = getDate(dep, ["createdAt", "date"]);
      activities.push({
        id: `deposit-${dep._id}`,
        type: "deposit",
        title: "New deposit",
        description: `${dep.type || "Deposit"} — ৳${money(dep.amount)}`,
        timestamp: date || "",
        date,
        iconName: "building-2",
      });
    });

    expenseEntries.forEach((e) => {
      const date = getDate(e, ["createdAt", "date"]);
      const sub = e.subCategory ? ` — ${e.subCategory}` : "";
      const desc = e.description ? ` · ${e.description}` : "";
      activities.push({
        id: `expense-${e._id}`,
        type: "expense-entry",
        title: "Office expense",
        description: `${e.category || "Expense"}${sub}${desc} — ৳${money(e.amount)}`,
        timestamp: date || "",
        date,
        iconName: "file-text",
      });
    });

    routeEntries.forEach((r) => {
      const date = getDate(r, ["createdAt", "date"]);
      const sub = r.subCategory ? ` — ${r.subCategory}` : "";
      const desc = r.description ? ` · ${r.description}` : "";
      activities.push({
        id: `route-${r._id}`,
        type: "route-entry",
        title: "Route cost",
        description: `${r.category || "Route"}${sub}${desc} — ৳${money(r.amount)}`,
        timestamp: date || "",
        date,
        iconName: "map-pin",
      });
    });

    salaryPayments.forEach((s) => {
      const date = getDate(s, ["createdAt", "date"]);
      activities.push({
        id: `salary-${s._id}`,
        type: "salary-payment",
        title: "Salary paid",
        description: `${s.employeeName || "Employee"} — ৳${money(s.amount)} (${s.method || "—"})`,
        timestamp: date || "",
        date,
        iconName: "dollar-sign",
      });
    });

    employees.forEach((emp) => {
      const date = getDate(emp, ["createdAt", "hireDate"]);
      activities.push({
        id: `employee-${emp._id}`,
        type: "employee",
        title: "New employee",
        description: `${emp.name || "Unknown"} — ${emp.department || "—"}`,
        timestamp: date || "",
        date,
        iconName: "user-plus",
      });
    });

    activities.sort((a, b) => {
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db_ = b.date ? new Date(b.date).getTime() : 0;
      return db_ - da;
    });

    const recent = activities.slice(0, 10).map((a) => ({
      id: a.id,
      title: a.title,
      description: a.description,
      timestamp: a.timestamp,
      iconName: a.iconName,
    }));

    return Response.json({ data: recent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
