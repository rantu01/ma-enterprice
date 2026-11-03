import { NextResponse } from "next/server";
import pdfkit from "pdfkit";
import fs from "fs";
import path from "path";
import os from "os";

// Helper: reduce for arrays
function reduce(arr, fn, init) {
  let acc = init;
  for (const item of arr) {
    acc = fn(acc, item);
  }
  return acc;
}

// Helper: format month label like the reports page
function formatMonthLabel(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return month || "";
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Helper: format money like the app
function formatMoney(n) {
  return (Number(n) || 0).toLocaleString(undefined, { maximumFractionDigits: 2 });
}

// Helper: format date value like the app
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

// Helper: month of date
function monthOfDate(value) {
  const m = /^(\d{4})-(\d{2})/.exec(String(value || "").trim());
  return m ? `${m[1]}-${m[2]}` : "";
}

// Helper: is income payment
function isIncomePayment(p) {
  const s = String(p?.status || "").toLowerCase();
  if (!s) return true;
  return s === "completed" || s === "paid" || s === "approved";
}

// Helper: is approved cost
function isApprovedCost(e) {
  const s = e?.approvalStatus || e?.status;
  return !s || s === "Approved";
}

// Helper: entry month
function entryMonth(e) {
  return monthOfDate(e?.date) || e?.month || "";
}

// Resolve route category name (simplified)
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

    // Get valid employee IDs
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

    // --- Generate PDF ---
    const filename = `Financial-Report-${formatMonthLabel(month)}.pdf`;
    const tempPath = path.join(os.tmpdir(), filename);
    const doc = new pdfkit({ size: "A4", layout: "landscape", margin: 24 });
    const output = fs.createWriteStream(tempPath);
    doc.pipe(output);

    const colors = {
      page: "#151619",
      card: "#1d1f24",
      cardAlt: "#202329",
      header: "#090a0d",
      line: "#343840",
      text: "#f4f6f8",
      muted: "#a6adb8",
      blue: "#60a5fa",
      green: "#22c55e",
      amber: "#f59e0b",
      red: "#f87171",
      blueDark: "#17345d",
      greenDark: "#123d29",
      amberDark: "#4a3210",
    };
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 24;
    const gap = 12;
    const contentWidth = pageWidth - margin * 2;
    const columnWidth = (contentWidth - gap) / 2;

    const safeText = (value, fallback = "-") => {
      const text = String(value ?? "").replace(/[—–·৳]/g, (char) => (
        char === "·" ? " / " : char === "৳" ? "BDT " : "-"
      ));
      const ascii = text.replace(/[^\x20-\x7E]/g, "");
      return ascii.trim() || fallback;
    };
    const money = (value) => `BDT ${formatMoney(value)}`;
    const setFont = (bold = false) => doc.font(bold ? "Helvetica-Bold" : "Helvetica");
    const fillPage = () => {
      doc.save().rect(0, 0, pageWidth, pageHeight).fill(colors.page).restore();
    };
    const addPage = () => {
      doc.addPage({ size: "A4", layout: "landscape", margin });
      fillPage();
    };
    const truncate = (value, width) => {
      const text = safeText(value);
      if (doc.widthOfString(text) <= width) return text;
      let output = text;
      while (output.length > 1 && doc.widthOfString(`${output}...`) > width) output = output.slice(0, -1);
      return `${output}...`;
    };
    const drawStat = (x, y, width, title, value, accent, icon) => {
      doc.save().roundedRect(x, y, width, 54, 4).fill(colors.card).restore();
      doc.save().roundedRect(x + width - 27, y + 10, 17, 17, 3).fill(accent).restore();
      setFont(true).fontSize(7).fillColor(colors.muted).text(title.toUpperCase(), x + 10, y + 9);
      setFont(true).fontSize(12).fillColor(colors.text).text(safeText(value), x + 10, y + 25);
      setFont(true).fontSize(9).fillColor(colors.page).text(icon, x + width - 22, y + 13, { width: 7, align: "center" });
    };
    const drawCard = ({ x, y, width, title, badge, accent = colors.blue, columns, rows, emptyMessage }) => {
      const maxRows = 10;
      const visibleRows = rows.slice(0, maxRows);
      const rowHeight = 16;
      const tableHeight = visibleRows.length ? 23 + visibleRows.length * rowHeight : 48;
      const height = 37 + tableHeight;
      doc.save().roundedRect(x, y, width, height, 4).fill(colors.card).restore();
      doc.save().roundedRect(x, y, width, 22, 4).fill(colors.cardAlt).restore();
      setFont(true).fontSize(9).fillColor(colors.text).text(title, x + 10, y + 7);
      if (badge) {
        const badgeText = safeText(badge);
        const badgeWidth = Math.max(34, doc.widthOfString(badgeText) + 12);
        doc.save().roundedRect(x + width - badgeWidth - 8, y + 5, badgeWidth, 13, 3).fill(accent).restore();
        setFont(true).fontSize(7).fillColor(colors.page).text(badgeText, x + width - badgeWidth - 2, y + 8, { width: badgeWidth - 12, align: "center" });
      }
      if (!columns || !columns.length) return { height };
      const tableX = x + 8;
      const tableY = y + 28;
      const tableWidth = width - 16;
      doc.save().rect(tableX, tableY, tableWidth, 18).fill(colors.header).restore();
      const columnWidths = columns.map((column) => tableWidth * column.width);
      let columnX = tableX + 6;
      setFont(true).fontSize(6.5).fillColor(colors.muted);
      columns.forEach((column, index) => {
        doc.text(column.label.toUpperCase(), columnX, tableY + 6, { width: columnWidths[index] - 8 });
        columnX += columnWidths[index];
      });
      if (!visibleRows.length) {
        setFont(false).fontSize(8).fillColor(colors.muted).text(emptyMessage, tableX + 6, tableY + 29, {
          width: tableWidth - 12,
          align: "center",
        });
        return { height };
      }
      visibleRows.forEach((row, rowIndex) => {
        const rowY = tableY + 18 + rowIndex * rowHeight;
        if (rowIndex % 2 === 0) doc.save().rect(tableX, rowY, tableWidth, rowHeight).fill(colors.header).restore();
        let cellX = tableX + 6;
        setFont(false).fontSize(7).fillColor(colors.text);
        columns.forEach((column, columnIndex) => {
          const value = typeof column.value === "function" ? column.value(row) : row[column.value];
          doc.text(truncate(value, columnWidths[columnIndex] - 10), cellX, rowY + 5, { width: columnWidths[columnIndex] - 8 });
          cellX += columnWidths[columnIndex];
        });
      });
      return { height };
    };

    fillPage();
    setFont(true).fontSize(18).fillColor(colors.text).text("Financial Report", margin, 18);
    setFont(false).fontSize(9).fillColor(colors.muted).text(`Period: ${safeText(formatMonthLabel(month))}`, margin, 41);
    doc.text(`Generated: ${safeText(new Date().toLocaleDateString())}`, pageWidth - margin - 120, 25, { width: 120, align: "right" });

    const statY = 70;
    const statGap = 10;
    const statWidth = (contentWidth - statGap * 3) / 4;
    drawStat(margin, statY, statWidth, "Total Income", money(totalIncome), colors.green, "+");
    drawStat(margin + statWidth + statGap, statY, statWidth, "Total Costing", money(costing), colors.amber, "-");
    drawStat(margin + (statWidth + statGap) * 2, statY, statWidth, profit >= 0 ? "Profit" : "Loss", money(profit), profit >= 0 ? colors.green : colors.red, profit >= 0 ? "+" : "!");
    drawStat(margin + (statWidth + statGap) * 3, statY, statWidth, "Commission Earned", money(commissionTotal), colors.blue, "$");

    let y = 138;
    let result = drawCard({
      x: margin,
      y,
      width: columnWidth,
      title: "2. Commission",
      badge: money(commissionTotal),
      columns: [
        { label: "Date", width: 0.42, value: (row) => formatDateValue(row.date) },
        { label: "Commission Amount", width: 0.58, value: (row) => money(row.amount) },
      ],
      rows: monthCommissionsFiltered,
      emptyMessage: `No commissions for ${formatMonthLabel(month)}.`,
    });
    drawCard({
      x: margin + columnWidth + gap,
      y,
      width: columnWidth,
      title: "3. Investment",
      badge: money(investmentTotal),
      columns: [
        { label: "Date", width: 0.28, value: (row) => formatDateValue(row.date) },
        { label: "Investor", width: 0.32, value: (row) => investors.find((item) => String(item?.investorId) === String(row?.investorId))?.name || row.investor || "-" },
        { label: "Amount", width: 0.20, value: (row) => money(row.amount) },
        { label: "Note", width: 0.20, value: (row) => row.notes || row.description || "-" },
      ],
      rows: monthInvestmentsFiltered,
      emptyMessage: `No investments for ${formatMonthLabel(month)}.`,
    });
    y += result.height + gap;

    result = drawCard({
      x: margin,
      y,
      width: columnWidth,
      title: "4. Company Deposit",
      badge: money(depositTotal),
      columns: [
        { label: "Date", width: 0.28, value: (row) => formatDateValue(row.date) },
        { label: "Type", width: 0.22, value: (row) => row.type || "-" },
        { label: "Amount", width: 0.24, value: (row) => money(row.amount) },
        { label: "Description", width: 0.26, value: (row) => row.description || "-" },
      ],
      rows: monthDepositsFiltered,
      emptyMessage: `No deposits for ${formatMonthLabel(month)}.`,
    });
    drawCard({
      x: margin + columnWidth + gap,
      y,
      width: columnWidth,
      title: "5. Office Expense",
      badge: money(officeTotal),
      accent: colors.amber,
      columns: [
        { label: "Date", width: 0.22, value: (row) => formatDateValue(row.date) },
        { label: "Category / Sub", width: 0.38, value: (row) => `${row.category || "-"}${row.subCategory ? ` / ${row.subCategory}` : ""}` },
        { label: "Voucher", width: 0.25, value: (row) => row.voucherNo || "-" },
        { label: "Amount", width: 0.15, value: (row) => money(row.amount) },
      ],
      rows: monthOfficeFiltered,
      emptyMessage: `No office expenses for ${formatMonthLabel(month)}.`,
    });

    addPage();
    y = 24;
    result = drawCard({
      x: margin,
      y,
      width: columnWidth,
      title: "6. Route Cost",
      badge: money(routeTotal),
      accent: colors.blue,
      columns: [
        { label: "Route / Category", width: 0.66, value: (row) => row.category },
        { label: "Amount", width: 0.34, value: (row) => money(row.total) },
      ],
      rows: routeParentArray,
      emptyMessage: `No route costs for ${formatMonthLabel(month)}.`,
    });
    drawCard({
      x: margin + columnWidth + gap,
      y,
      width: columnWidth,
      title: "7. Loan Payments",
      badge: money(income),
      columns: [
        { label: "Date", width: 0.28, value: (row) => formatDateValue(row.date) },
        { label: "Organization", width: 0.42, value: (row) => row.organizationName || row.loanId || "-" },
        { label: "Amount", width: 0.30, value: (row) => money(row.amount) },
      ],
      rows: monthPaymentsFiltered,
      emptyMessage: `No loan payments for ${formatMonthLabel(month)}.`,
    });
    y += result.height + gap;
    const salaryCard = drawCard({
      x: margin,
      y,
      width: contentWidth,
      title: "8. Salary",
      badge: money(salaryTotal),
      accent: colors.green,
      columns: [
        { label: "Employee", width: 0.22, value: (row) => row.employeeName },
        { label: "Basic", width: 0.13, value: (row) => money(row.basicSalary) },
        { label: "Bonus", width: 0.12, value: (row) => money(row.bonusTotal) },
        { label: "Allowance", width: 0.14, value: (row) => money(row.allowanceTotal) },
        { label: "Deduction", width: 0.14, value: (row) => money(row.deductionTotal) },
        { label: "Net", width: 0.13, value: (row) => money(row.net) },
        { label: "Status", width: 0.12, value: (row) => row.status },
      ],
      rows: monthPayrolls,
      emptyMessage: `No payroll records for ${formatMonthLabel(month)}.`,
    });
    y += salaryCard.height + gap;
    const payStaffRows = monthPayStaffFiltered.slice(0, 10);
    const payStaffHeight = 37 + (payStaffRows.length ? 23 + payStaffRows.length * 16 : 48);
    if (y + payStaffHeight > pageHeight - 34) {
      addPage();
      y = 24;
    }
    drawCard({
      x: margin,
      y,
      width: contentWidth,
      title: "9. Pay Staff Payments",
      badge: money(payStaffTotal),
      accent: colors.blue,
      columns: [
        { label: "Date", width: 0.20, value: (row) => formatDateValue(row.date) },
        { label: "Employee", width: 0.28, value: (row) => row.employeeName || row.employee },
        { label: "Purpose", width: 0.32, value: (row) => row.purpose },
        { label: "Amount", width: 0.20, value: (row) => money(row.amount) },
      ],
      rows: payStaffRows,
      emptyMessage: `No staff payments for ${formatMonthLabel(month)}.`,
    });
    setFont(true).fontSize(9).fillColor(colors.muted).text(
      `Grand Total Income: ${money(totalIncome)}    Total Costing: ${money(costing)}    ${profit >= 0 ? "Profit" : "Loss"}: ${money(profit)}`,
      margin,
      pageHeight - 22
    );

    doc.end();

    await new Promise((resolve, reject) => {
      output.on("finish", resolve);
      output.on("error", reject);
    });

    const pdf = await fs.promises.readFile(tempPath);
    await fs.promises.unlink(tempPath);

    return new NextResponse(pdf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "no-store",
      },
    });

  } catch (error) {
    console.error("PDF GENERATION ERROR:", error);
    return NextResponse.json({ error: error.message || "Failed to generate PDF" }, { status: 500 });
  }
}