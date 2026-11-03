import fs from "node:fs/promises";
import path from "node:path";
import * as fontkit from "fontkit";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const colors = {
  navy: rgb(0.08, 0.16, 0.27),
  ink: rgb(0.16, 0.20, 0.25),
  muted: rgb(0.38, 0.44, 0.51),
  line: rgb(0.86, 0.89, 0.92),
  soft: rgb(0.95, 0.97, 0.98),
  header: rgb(0.90, 0.94, 0.97),
  blue: rgb(0.10, 0.39, 0.65),
  green: rgb(0.08, 0.48, 0.28),
  amber: rgb(0.65, 0.39, 0.06),
  red: rgb(0.68, 0.18, 0.18),
  white: rgb(1, 1, 1),
};

function text(value) {
  return value === null || value === undefined || value === "" ? "—" : String(value);
}

function money(value) {
  return `৳${(Number(value) || 0).toLocaleString("en-BD", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fit(value, font, size, maxWidth) {
  const input = text(value);
  if (font.widthOfTextAtSize(input, size) <= maxWidth) return input;
  let result = input;
  while (result.length > 1 && font.widthOfTextAtSize(`${result}…`, size) > maxWidth) {
    result = result.slice(0, -1);
  }
  return `${result}…`;
}

function formatMonth(month) {
  if (!month || !/^\d{4}-\d{2}$/.test(month)) return text(month);
  const [year, monthNumber] = month.split("-");
  return new Date(Number(year), Number(monthNumber) - 1, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function drawMoney(page, value, x, y, size, font, takaFont, color, align = "left", maxWidth = CONTENT_WIDTH) {
  const amount = money(value);
  const amountWidth = font.widthOfTextAtSize(amount.slice(1), size);
  const symbolWidth = takaFont.widthOfTextAtSize("৳", size);
  const totalWidth = amountWidth + symbolWidth;
  const startX = align === "right" ? x - totalWidth : x;
  page.drawText("৳", { x: startX, y, size, font: takaFont, color });
  page.drawText(fit(amount.slice(1), font, size, Math.max(10, maxWidth - symbolWidth)), {
    x: startX + symbolWidth,
    y,
    size,
    font,
    color,
  });
}

export async function renderFinancialReport({
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
}) {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);
  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const takaFont = await pdfDoc.embedFont(
    await fs.readFile(path.join(process.cwd(), "node_modules", "@fontsource", "noto-sans-bengali", "files", "noto-sans-bengali-bengali-400-normal.woff"))
  );
  const generated = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const pages = [];

  const addPage = () => {
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    pages.push(page);
    return page;
  };

  const drawChrome = (page, pageNumber) => {
    page.drawRectangle({ x: 0, y: PAGE_HEIGHT - 7, width: PAGE_WIDTH, height: 7, color: colors.blue });
    page.drawText("MAA ENTERPRISE", { x: MARGIN, y: PAGE_HEIGHT - 35, size: 9, font: bold, color: colors.navy });
    page.drawText("Financial Report", { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize("Financial Report", 8), y: PAGE_HEIGHT - 34, size: 8, font: regular, color: colors.muted });
    page.drawLine({ start: { x: MARGIN, y: 33 }, end: { x: PAGE_WIDTH - MARGIN, y: 33 }, thickness: 0.7, color: colors.line });
    page.drawText(`Confidential • ${formatMonth(month)}`, { x: MARGIN, y: 20, size: 7.5, font: regular, color: colors.muted });
    const pageLabel = `Page ${pageNumber}`;
    page.drawText(pageLabel, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(pageLabel, 7.5), y: 20, size: 7.5, font: regular, color: colors.muted });
  };

  const pageState = { page: addPage(), y: PAGE_HEIGHT - 66 };
  const ensureSpace = (height) => {
    if (pageState.y - height < 52) {
      pageState.page = addPage();
      pageState.y = PAGE_HEIGHT - 57;
    }
  };

  const drawHeader = () => {
    pageState.page.drawText("MAA ENTERPRISE", { x: MARGIN, y: pageState.y, size: 22, font: bold, color: colors.navy });
    pageState.page.drawText("MANAGEMENT FINANCIAL REPORT", { x: MARGIN, y: pageState.y - 27, size: 11, font: bold, color: colors.blue });
    pageState.page.drawText(`Reporting period: ${formatMonth(month)}`, { x: MARGIN, y: pageState.y - 46, size: 9, font: regular, color: colors.muted });
    pageState.page.drawText(`Generated ${generated}`, { x: PAGE_WIDTH - MARGIN - regular.widthOfTextAtSize(`Generated ${generated}`, 8), y: pageState.y - 45, size: 8, font: regular, color: colors.muted });
    pageState.page.drawLine({ start: { x: MARGIN, y: pageState.y - 61 }, end: { x: PAGE_WIDTH - MARGIN, y: pageState.y - 61 }, thickness: 1, color: colors.line });
    pageState.y -= 82;
  };

  const drawSummary = () => {
    ensureSpace(91);
    const cardGap = 9;
    const cardWidth = (CONTENT_WIDTH - cardGap * 3) / 4;
    const cards = [
      ["TOTAL INCOME", totalIncome, colors.green],
      ["TOTAL COSTING", costing, colors.amber],
      [isProfit ? "NET PROFIT" : "NET LOSS", profit, isProfit ? colors.green : colors.red],
      ["COMMISSION", commissionTotal, colors.blue],
    ];
    cards.forEach(([label, amount, color], index) => {
      const x = MARGIN + index * (cardWidth + cardGap);
      pageState.page.drawRectangle({ x, y: pageState.y - 55, width: cardWidth, height: 55, color: colors.soft, borderColor: colors.line, borderWidth: 0.7 });
      pageState.page.drawRectangle({ x, y: pageState.y - 55, width: 3, height: 55, color });
      pageState.page.drawText(label, { x: x + 10, y: pageState.y - 19, size: 6.5, font: bold, color: colors.muted });
      drawMoney(pageState.page, amount, x + 10, pageState.y - 40, 10.5, bold, takaFont, color, "left", cardWidth - 18);
    });
    pageState.y -= 76;
  };

  const drawSectionTitle = (title, total, color = colors.blue) => {
    ensureSpace(42);
    pageState.page.drawRectangle({ x: MARGIN, y: pageState.y - 23, width: CONTENT_WIDTH, height: 23, color: colors.soft });
    pageState.page.drawRectangle({ x: MARGIN, y: pageState.y - 23, width: 4, height: 23, color });
    pageState.page.drawText(title, { x: MARGIN + 12, y: pageState.y - 15, size: 9.5, font: bold, color: colors.navy });
    if (total !== undefined) drawMoney(pageState.page, total, PAGE_WIDTH - MARGIN - 10, pageState.y - 15, 8.5, bold, takaFont, color, "right");
    pageState.y -= 31;
  };

  const drawTable = (columns, rows) => {
    const rowHeight = 19;
    const headerHeight = 24;
    const drawTableHeader = () => {
      pageState.page.drawRectangle({ x: MARGIN, y: pageState.y - headerHeight, width: CONTENT_WIDTH, height: headerHeight, color: colors.header });
      let x = MARGIN;
      columns.forEach((column) => {
        pageState.page.drawText(column.label, { x: x + 7, y: pageState.y - 15, size: 7, font: bold, color: colors.navy });
        x += column.width;
      });
      pageState.y -= headerHeight;
    };
    const drawRow = (row, index) => {
      if (pageState.y - rowHeight < 52) {
        pageState.page = addPage();
        pageState.y = PAGE_HEIGHT - 57;
        drawTableHeader();
      }
      if (index % 2 === 1) pageState.page.drawRectangle({ x: MARGIN, y: pageState.y - rowHeight, width: CONTENT_WIDTH, height: rowHeight, color: colors.soft });
      let x = MARGIN;
      columns.forEach((column) => {
        const value = column.value(row);
        const size = column.numeric ? 7.5 : 7.2;
        if (column.numeric) {
          drawMoney(pageState.page, value, x + column.width - 7, pageState.y - 13, size, regular, takaFont, colors.ink, "right", column.width - 10);
        } else {
          pageState.page.drawText(fit(value, regular, size, column.width - 14), { x: x + 7, y: pageState.y - 13, size, font: regular, color: colors.ink });
        }
        x += column.width;
      });
      pageState.page.drawLine({ start: { x: MARGIN, y: pageState.y - rowHeight }, end: { x: PAGE_WIDTH - MARGIN, y: pageState.y - rowHeight }, thickness: 0.4, color: colors.line });
      pageState.y -= rowHeight;
    };
    drawTableHeader();
    rows.forEach(drawRow);
    pageState.y -= 13;
  };

  const section = (title, total, columns, rows, color) => {
    ensureSpace(80);
    drawSectionTitle(title, total, color);
    drawTable(columns, rows);
  };

  drawHeader();
  drawSummary();
  section("Income • Commission", commissionTotal, [
    { label: "Date", width: 100, value: (r) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—" },
    { label: "Description", width: 260, value: (r) => r.description || r.notes || "Commission received" },
    { label: "Amount", width: 151, numeric: true, value: (r) => r.amount },
  ], monthCommissionsFiltered, colors.blue);
  section("Income • Investments", investmentTotal, [
    { label: "Date", width: 90, value: (r) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—" },
    { label: "Investor", width: 255, value: (r) => investors.find((item) => String(item?.investorId) === String(r?.investorId))?.name || r.investor || "—" },
    { label: "Amount", width: 166, numeric: true, value: (r) => r.amount },
  ], monthInvestmentsFiltered, colors.blue);
  section("Income • Company Deposits", depositTotal, [
    { label: "Date", width: 100, value: (r) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—" },
    { label: "Type", width: 245, value: (r) => r.type || "Deposit" },
    { label: "Amount", width: 166, numeric: true, value: (r) => r.amount },
  ], monthDepositsFiltered, colors.blue);
  section("Costs • Office Expenses", officeTotal, [
    { label: "Date", width: 90, value: (r) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—" },
    { label: "Category / detail", width: 255, value: (r) => [r.category, r.subCategory].filter(Boolean).join(" / ") || "—" },
    { label: "Amount", width: 166, numeric: true, value: (r) => r.amount },
  ], monthOfficeFiltered, colors.amber);
  section("Costs • Route Summary", routeTotal, [
    { label: "Parent category", width: 344, value: (r) => r.category },
    { label: "Subtotal", width: 167, numeric: true, value: (r) => r.total },
  ], routeParentArray, colors.amber);
  section("Income • Loan Payments", income, [
    { label: "Date", width: 90, value: (r) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—" },
    { label: "Organization", width: 255, value: (r) => r.organizationName || r.loanId || "—" },
    { label: "Amount", width: 166, numeric: true, value: (r) => r.amount },
  ], monthPaymentsFiltered, colors.blue);
  section("Costs • Payroll", salaryTotal, [
    { label: "Employee", width: 250, value: (r) => r.employeeName },
    { label: "Basic salary", width: 145, numeric: true, value: (r) => r.basicSalary },
    { label: "Net salary", width: 116, numeric: true, value: (r) => r.net },
  ], monthPayrolls, colors.amber);
  section("Costs • Staff Payments", payStaffTotal, [
    { label: "Date", width: 82, value: (r) => r.date ? new Date(r.date).toLocaleDateString("en-GB") : "—" },
    { label: "Employee", width: 150, value: (r) => r.employeeName || r.employee },
    { label: "Purpose", width: 198, value: (r) => r.purpose || "Staff payment" },
    { label: "Amount", width: 81, numeric: true, value: (r) => r.amount },
  ], monthPayStaffFiltered, colors.amber);

  ensureSpace(68);
  pageState.page.drawRectangle({ x: MARGIN, y: pageState.y - 53, width: CONTENT_WIDTH, height: 53, color: colors.navy });
  pageState.page.drawText("REPORT TOTALS", { x: MARGIN + 14, y: pageState.y - 19, size: 7, font: bold, color: colors.white });
  drawMoney(pageState.page, totalIncome, MARGIN + 148, pageState.y - 19, 8.5, bold, takaFont, colors.white);
  drawMoney(pageState.page, costing, MARGIN + 292, pageState.y - 19, 8.5, bold, takaFont, colors.white);
  drawMoney(pageState.page, profit, PAGE_WIDTH - MARGIN - 14, pageState.y - 19, 8.5, bold, takaFont, colors.white, "right");
  pageState.page.drawText("Income", { x: MARGIN + 148, y: pageState.y - 38, size: 6.5, font: regular, color: colors.header });
  pageState.page.drawText("Costing", { x: MARGIN + 292, y: pageState.y - 38, size: 6.5, font: regular, color: colors.header });
  pageState.page.drawText(isProfit ? "Net profit" : "Net loss", { x: PAGE_WIDTH - MARGIN - 14 - regular.widthOfTextAtSize(isProfit ? "Net profit" : "Net loss", 6.5), y: pageState.y - 38, size: 6.5, font: regular, color: colors.header });

  pages.forEach(drawChrome);
  return pdfDoc.save();
}
