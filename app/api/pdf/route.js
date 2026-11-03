import { NextResponse } from "next/server";
import { PDFDocument, rgb } from "pdf-lib";
import { renderFinancialReport } from "./render";

function reduce(arr, fn, init) {
  let acc = init;
  for (const item of arr) {
    acc = fn(acc, item);
  }
  return acc;
}

function formatMonthLabel(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || "";
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function formatMoney(n) {
  return (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatDateValue(value) {
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

function monthOfDate(value) {
  const m = /^(\d{4})-(\d{2})/.exec(String(value || "").trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

function isIncomePayment(p) {
  const s = String(p?.status || "").toLowerCase();
  if (!s) return true;
  return s === "completed" || s === "paid" || s === "approved";
}

function isApprovedCost(e) {
  const s = e?.approvalStatus || e?.status;
  return !s || s === "Approved";
}

function entryMonth(e) {
  return monthOfDate(e?.date) || e?.month || "";
}

function resolveRouteCategoryName(categoryString, categoryId) {
  if (!categoryString) return "—";
  return categoryString;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const month = body.month || new Date().toISOString().split("T")[0].slice(0, 7);

    // Connect to MongoDB
    const { MongoClient } = await import("mongodb");
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const client = await MongoClient.connect(uri);
    const db = client.db("maa-enterprise");

    // Fetch all needed collections
    const collections = [
      "loans", "payments", "investments", "investors",
      "deposits", "commissions", "expenseEntries", "routeEntries",
      "payrolls", "payroll_adjustments", "salaryPayments", "employees",
    ];

    const results = {};
    for (const c of collections) {
      const items = await db.collection(c).find({}).sort({ createdAt: -1 }).toArray();
      results[c] = items.map((i) => ({ ...i, id: i._id?.toString() || i.id }));
    }

    const loans = results.loans;
    const payments = results.payments;
    const investments = results.investments;
    const investors = results.investors;
    const deposits = results.deposits;
    const commissions = results.commissions;
    const expenseEntries = results.expenseEntries;
    const routeEntries = results.routeEntries;
    const payrolls = results.payrolls;
    const payrollAdjustments = results["payroll_adjustments"];
    const salaryPayments = results.salaryPayments;
    const employees = results.employees;

    // --- Compute monthly figures (mirroring reports page logic) ---

    const validEmployeeIds = new Set(employees.map((e) => String(e.id)));

    // Dedupe payrolls
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
    const uniquePayrolls = [...byKey.values()].map((entry) => entry.payroll);

    // Filter by month
    const monthPaymentsFiltered = payments.filter((p) => isIncomePayment(p) && monthOfDate(p.date || p.paymentDate) === month);
    const income = monthPaymentsFiltered.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const monthCommissionsFiltered = commissions.filter((c) => monthOfDate(c.date) === month);
    const commissionTotal = monthCommissionsFiltered.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    const monthInvestmentsFiltered = investments.filter((i) => monthOfDate(i.date) === month);
    const investmentTotal = monthInvestmentsFiltered.reduce((s, i) => s + (Number(i.amount) || 0), 0);

    const totalIncome = Math.round((commissionTotal + investmentTotal) * 100) / 100;

    const monthDepositsFiltered = deposits.filter((d) => monthOfDate(d.date) === month);
    const depositTotal = monthDepositsFiltered.reduce((s, d) => s + (Number(d.amount) || 0), 0);

    const monthOfficeFiltered = expenseEntries.filter((e) => isApprovedCost(e) && entryMonth(e) === month);
    const officeTotal = monthOfficeFiltered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    const monthRouteFiltered = routeEntries
      .filter((e) => isApprovedCost(e) && entryMonth(e) === month)
      .map((e) => ({ ...e, category: resolveRouteCategoryName(e.category, e.categoryId) }));
    const routeTotal = monthRouteFiltered.reduce((s, e) => s + (Number(e.amount) || 0), 0);

    // Group route by parent category
    const routeByParent = monthRouteFiltered.reduce((acc, e) => {
      const cat = e.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = 0;
      acc[cat] = Math.round((acc[cat] + Number(e.amount)) * 100) / 100;
      return acc;
    }, {});
    const routeParentArray = Object.entries(routeByParent)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);

    // Payroll
    const monthPayrolls = uniquePayrolls
      .filter((p) => p.month === month)
      .map((p) => {
        const adj = payrollAdjustments.filter((a) => String(a.payrollId) === String(p.id));
        const bonus = adj.filter((a) => a.type === "Bonus").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const allowance = adj.filter((a) => a.type === "Allowance").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        const deduction = adj.filter((a) => a.type === "Deduction").reduce((s, a) => s + (Number(a.amount) || 0), 0);
        return { ...p, bonusTotal: bonus, allowanceTotal: allowance, deductionTotal: deduction, net: Math.round(((Number(p.basicSalary) || 0) + bonus + allowance - deduction) * 100) / 100 };
      });
    const payrollTotal = monthPayrolls.reduce((s, p) => s + (Number(p.net) || 0), 0);

    const monthPayStaffFiltered = salaryPayments.filter((p) => monthOfDate(p.date) === month);
    const payStaffTotal = monthPayStaffFiltered.reduce((s, p) => s + (Number(p.amount) || 0), 0);

    // Pay Staff unmatched
    const payrollIds = new Set(payrolls.map((p) => String(p.id)));
    const salaryIdKeys = new Set(
      monthPayrolls.map((p) => `${p.employeeId || ""}|${p.month || month}`)
    );
    const salaryNameKeys = new Set(
      monthPayrolls.map((p) => `${String(p.employeeName || "").trim().toLowerCase()}|${p.month || month}`)
    );
    const unmatchedPayStaffTotal = monthPayStaffFiltered
      .filter((p) => {
        if (p.payrollId && payrollIds.has(String(p.payrollId))) return false;
        const paymentMonth = monthOfDate(p.date);
        const idKey = `${p.employeeId || ""}|${paymentMonth}`;
        const nameKey = `${String(p.employeeName || "").trim().toLowerCase()}|${paymentMonth}`;
        return !(salaryIdKeys.has(idKey) || salaryNameKeys.has(nameKey));
      })
      .reduce((s, p) => s + (Number(p.amount) || 0), 0);

    const salaryTotal = Math.round((payrollTotal + unmatchedPayStaffTotal) * 100) / 100;
    const costing = Math.round((officeTotal + routeTotal + salaryTotal) * 100) / 100;
    const profit = Math.round((totalIncome - costing) * 100) / 100;
    const isProfit = profit >= 0;

    const filename = `Financial-Report-${formatMonthLabel(month)}.pdf`;
    const pdfBytes = await renderFinancialReport({
      month,
      income,
      commissionTotal,
      investmentTotal,
      depositTotal,
      officeTotal,
      routeTotal,
      salaryTotal,
      payStaffTotal,
      totalIncome,
      costing,
      profit,
      isProfit,
      monthCommissionsFiltered,
      monthInvestmentsFiltered,
      investors,
      monthDepositsFiltered,
      monthOfficeFiltered,
      routeParentArray,
      monthPaymentsFiltered,
      monthPayrolls,
      monthPayStaffFiltered,
    });

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
        "Cache-Control": "no-store",
      },
    });

    {
    // --- Legacy renderer retained below for reference; the renderer above is used. ---
    // pdf-lib uses built-in Helvetica/standard fonts automatically.
    // No #standard-fonts/Helvetica ESM import map resolution needed.

    const filename = `Financial-Report-${formatMonthLabel(month)}.pdf`;

    // Create PDF document - pdf-lib auto-embeds standard fonts (Helvetica, etc.)
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([841.89, 595.28]); // A4 landscape

    // Helper: draw text on the page
    const drawText = (text, x, y, size, color) => {
      page.drawText(text, { x, y, size, color });
    };

    // Helper: draw formatted money
    const money = (value) => `BDT ${formatMoney(value)}`;

    // --- Header section ---
    drawText("Financial Report", 24, 18, 18, rgb(0.961, 0.984, 0.961));  // text color
    drawText(`Period: ${formatMonthLabel(month)}`, 24, 41, 9, rgb(0.659, 0.686, 0.718));  // muted
    drawText(`Generated: ${new Date().toLocaleDateString()}`, 24, 54, 9, rgb(0.659, 0.686, 0.718));

    // --- Stat cards row ---
    const statY = 70;
    const statGap = 10;
    const statWidth = (841.89 - 24 * 2 - statGap * 3) / 4; // contentWidth

    // Stat 1: Total Income
    drawText("Total Income", 24, statY, 7, rgb(0.659, 0.686, 0.718)); // muted
    drawText(money(totalIncome), 24, statY + 25, 12, rgb(0.133, 0.784, 0.373)); // green

    // Stat 2: Total Costing
    drawText("Total Costing", 24 + statWidth + statGap, statY, 7, rgb(0.659, 0.686, 0.718));
    drawText(money(costing), 24 + statWidth + statGap, statY + 25, 12, rgb(0.961, 0.616, 0.031)); // amber

    // Stat 3: Profit/Loss
    const profitLabel = isProfit ? "Profit" : "Loss";
    const profitColor = isProfit ? rgb(0.133, 0.784, 0.373) : rgb(0.973, 0.435, 0.435);
    const profitIcon = isProfit ? "+" : "!";
    drawText(profitLabel, 24 + (statWidth + statGap) * 2, statY, 7, rgb(0.659, 0.686, 0.718));
    drawText(money(profit), 24 + (statWidth + statGap) * 2, statY + 25, 12, profitColor);
    drawText(profitIcon, 24 + (statWidth + statGap) * 2 + 100, statY + 20, 12, profitColor);

    // Stat 4: Commission Earned
    drawText("Commission Earned", 24 + (statWidth + statGap) * 3, statY, 7, rgb(0.659, 0.686, 0.718));
    drawText(money(commissionTotal), 24 + (statWidth + statGap) * 3, statY + 25, 12, rgb(0.376, 0.651, 0.976)); // blue

    // --- Detail sections ---
    let y = 138;

    // 1. Commission
    drawText("2. Commission", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Commission Total: ${money(commissionTotal)}`, 24, y, 9, rgb(0.376, 0.651, 0.976));
    y += 22;
    // Commission entries table header
    drawText("Date", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Commission Amount", 24 + 200, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    // Show a few commission entries
    monthCommissionsFiltered.slice(0, 5).forEach((row, i) => {
      const date = formatDateValue(row.date);
      const amount = money(row.amount);
      drawText(date, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(amount, 24 + 200, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    y += 20;

    // 2. Investment
    drawText("3. Investment", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Investment Total: ${money(investmentTotal)}`, 24, y, 9, rgb(0.376, 0.651, 0.976));
    y += 22;
    drawText("Date", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Investor", 24 + 100, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Amount", 24 + 300, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    monthInvestmentsFiltered.slice(0, 5).forEach((row, i) => {
      const date = formatDateValue(row.date);
      const investor = investors.find((item) => String(item?.investorId) === String(row?.investorId))?.name || row.investor || "-";
      const amount = money(row.amount);
      drawText(date, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(investor, 24 + 100, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(amount, 24 + 300, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    y += 20;

    // 3. Company Deposit
    drawText("4. Company Deposit", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Deposit Total: ${money(depositTotal)}`, 24, y, 9, rgb(0.961, 0.616, 0.031));
    y += 22;
    drawText("Date", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Type", 24 + 100, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Amount", 24 + 200, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    monthDepositsFiltered.slice(0, 5).forEach((row, i) => {
      const date = formatDateValue(row.date);
      const type = row.type || "-";
      const amount = money(row.amount);
      drawText(date, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(type, 24 + 100, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(amount, 24 + 200, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    y += 20;

    // 4. Office Expense
    drawText("5. Office Expense", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Office Total: ${money(officeTotal)}`, 24, y, 9, rgb(0.961, 0.616, 0.031));
    y += 22;
    drawText("Date", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Category/Sub", 24 + 100, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Amount", 24 + 300, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    monthOfficeFiltered.slice(0, 5).forEach((row, i) => {
      const date = formatDateValue(row.date);
      const cat = row.category || "-";
      const sub = row.subCategory ? ` / ${row.subCategory}` : "";
      const amt = money(row.amount);
      drawText(date, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(cat + sub, 24 + 100, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(amt, 24 + 300, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    // Add another page for remaining sections
    const page2 = pdfDoc.addPage([841.89, 595.28]);

    y = 24;

    // 5. Route Cost
    drawText("6. Route Cost", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Route Total: ${money(routeTotal)}`, 24, y, 9, rgb(0.376, 0.651, 0.976));
    y += 22;
    drawText("Category", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Amount", 24 + 300, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    routeParentArray.slice(0, 5).forEach((row, i) => {
      drawText(row.category, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(money(row.total), 24 + 300, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    y += 20;

    // 6. Loan Payments
    drawText("7. Loan Payments", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Received: ${money(income)}`, 24, y, 9, rgb(0.376, 0.651, 0.976));
    y += 22;
    drawText("Date", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Organization", 24 + 150, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Amount", 24 + 400, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    monthPaymentsFiltered.slice(0, 5).forEach((row, i) => {
      const date = formatDateValue(row.date);
      const org = row.organizationName || row.loanId || "-";
      const amt = money(row.amount);
      drawText(date, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(org, 24 + 150, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(amt, 24 + 400, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    y += 20;

    // 7. Salary
    drawText("8. Salary", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Salary Total: ${money(salaryTotal)}`, 24, y, 9, rgb(0.133, 0.784, 0.373));
    y += 22;
    drawText("Employee", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Basic", 24 + 120, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Net", 24 + 280, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    monthPayrolls.slice(0, 5).forEach((row, i) => {
      const emp = row.employeeName || "—";
      const basic = money(row.basicSalary);
      const net = money(row.net);
      drawText(emp, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(basic, 24 + 120, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(net, 24 + 280, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    y += 20;

    // 8. Pay Staff Payments
    drawText("9. Pay Staff Payments", 24, y, 9, rgb(0.961, 0.984, 0.961));
    y += 22;
    drawText(`Pay Staff Total: ${money(payStaffTotal)}`, 24, y, 9, rgb(0.376, 0.651, 0.976));
    y += 22;
    drawText("Date", 24, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Employee", 24 + 80, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Purpose", 24 + 200, y, 7, rgb(0.659, 0.686, 0.718));
    drawText("Amount", 24 + 400, y, 7, rgb(0.659, 0.686, 0.718));
    y += 16;
    monthPayStaffFiltered.slice(0, 5).forEach((row, i) => {
      const date = formatDateValue(row.date);
      const emp = row.employeeName || row.employee || "—";
      const purpose = row.purpose || "-";
      const amt = money(row.amount);
      drawText(date, 24, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(emp, 24 + 80, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(purpose, 24 + 200, y, 7, rgb(0.961, 0.984, 0.961));
      drawText(amt, 24 + 400, y, 7, rgb(0.961, 0.984, 0.961));
      y += 14;
    });

    // Grand total at bottom (on last page)
    const grandY = 595.28 - 40;
    drawText(`Grand Total Income: ${money(totalIncome)}    Total Costing: ${money(costing)}    ${isProfit ? "Profit" : "Loss"}: ${money(profit)}`, 24, grandY, 9, rgb(0.659, 0.686, 0.718));

    // --- Serialize PDF and return ---
    const pdfBytes = await pdfDoc.save();

    return new NextResponse(pdfBytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdfBytes.length),
        "Cache-Control": "no-store",
      },
    });
    }

  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}