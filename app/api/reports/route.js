import { connectDB } from "@/lib/mongodb";

function toClient(item) {
  if (!item) return item;
  const { _id, ...rest } = item;
  return { ...rest, id: _id ? _id.toString() : rest.id };
}

function inRange(dateStr, start, end) {
  if (!dateStr) return false;
  const d = String(dateStr).slice(0, 10);
  if (start && d < start) return false;
  if (end && d > end) return false;
  return true;
}

export async function POST(request) {
  try {
    const { db } = await connectDB();
    const body = await request.json();
    const { reportId, start = "", end = "" } = body || {};

    let rows = [];

    const applyDate = (arr, dateKey = "date") =>
      (arr || []).filter((r) => !start && !end ? true : inRange(r[dateKey], start, end));

    switch (reportId) {
      case "loan": {
        rows = applyDate(await db.collection("loans").find({}).toArray());
        break;
      }
      case "employee": {
        rows = applyDate(await db.collection("employees").find({}).toArray(), "hireDate");
        break;
      }
      case "salary": {
        rows = applyDate(await db.collection("salaries").find({}).toArray());
        break;
      }
      case "investment": {
        rows = applyDate(await db.collection("investments").find({}).toArray());
        break;
      }
      case "expense": {
        rows = applyDate(await db.collection("expenses").find({}).toArray());
        break;
      }
      case "route-cost": {
        rows = applyDate(await db.collection("routes").find({}).toArray());
        break;
      }
      case "employee-expense-item": {
        const payments = applyDate(await db.collection("salaryPayments").find({}).toArray());
        const expenseRows = (await db.collection("expenses").find({}).toArray()).map((e) => ({
          employeeName: "—",
          item: e.notes || e.category || "Office Expense",
          category: e.category || "—",
          date: e.date || "",
          amount: e.amount,
        }));
        rows = [...payments, ...expenseRows];
        break;
      }
      case "payroll": {
        const payrolls = applyDate(await db.collection("payrolls").find({}).toArray());
        const adjustments = await db.collection("payroll_adjustments").find({}).toArray();
        rows = payrolls.map((p) => {
          const empAdjustments = adjustments.filter((a) => a.payrollId === p.id);
          const bonusTotal = empAdjustments.filter((a) => a.type === "Bonus").reduce((s, a) => s + (Number(a.amount) || 0), 0);
          const allowanceTotal = empAdjustments.filter((a) => a.type === "Allowance").reduce((s, a) => s + (Number(a.amount) || 0), 0);
          const deductionTotal = empAdjustments.filter((a) => a.type === "Deduction").reduce((s, a) => s + (Number(a.amount) || 0), 0);
          const net = (p.basicSalary || 0) + bonusTotal + allowanceTotal - deductionTotal;
          return {
            employeeName: p.employeeName || "—",
            basicSalary: p.basicSalary || 0,
            bonusTotal,
            allowanceTotal,
            deductionTotal,
            net,
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