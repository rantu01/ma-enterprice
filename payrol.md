# Payroll + Payroll Reports Flow (Clear Explanation)

Ei file-tay dui page er full flow kothay kaj kore, kibhabe data load hoy, kibhabe calculation hoy, kibhabe payment/status update hoy, ar report generation kemon hocche—eta clear kore explain kora ache.

## 1) Page gula ki kore?

Project-e dui page ache:

- `/employee-management/payroll`
- `/employee-management/payroll-reports`

Ei dui page-er moddhe ekta common data model ache:

- `employees` collection
- `payrolls` collection
- `payroll_adjustments` collection
- `salaryPayments` collection

Aro simple kothay bole:

- employee er salary, department, status, etc. `employees`-e thake
- monthly payroll row `payrolls`-e thake
- bonus/allowance/deduction `payroll_adjustments`-e thake
- actual payment (cash/bank/bkash) `salaryPayments`-e thake

---

## 2) Payroll page er full flow

File: `app/employee-management/payroll/page.js`

### Step 1: Page load hoy
`useEffect()`-e page open hotei ei 4 collection fetch hoy:

- `/api/data?collection=employees`
- `/api/data?collection=payrolls`
- `/api/data?collection=payroll_adjustments`
- `/api/data?collection=salaryPayments`

`fetchData()` function er vitore Promise.all() diye ek sathe load hoy. So page initial load e data ready hoy.

### Step 2: Month + Year select korar system
Page e duita dropdown ache:

- Month
- Year

Default value:

- current month via `getCurrentMonthCode()`
- current year via `new Date().getFullYear()`

`monthOptions` and `yearOptions` are built from `payrolls` data. So previous generated payroll months/year gulo dropdown e show hoy.

### Step 3: Filtration logic
`filteredPayrolls = payrolls.filter((p) => p.month === month && String(p.year) === year)`

Meaning: only selected month/year er payroll rows dekhano hoy.

### Step 4: Employee map + adjustment map
UI er row gulo calculate korar jonno code `activeEmployeeMap` banay:

- `employees` er id -> employee object

Then each payroll row er jonno:

- employee info find kora hoy
- related adjustments filter kora hoy: `a.payrollId === p.id`
- bonus total, allowance total, deduction total compute hoy
- net salary compute hoy

Formula:

```
net = basicSalary + bonus + allowance - deduction
```

Actually code-e:

```js
const net = Math.round(((p.basicSalary || 0) + bonusTotal + allowanceTotal - deductionTotal) * 100) / 100;
```

### Step 5: Actual payment calculation (`Paid (Pay Staff)`)
Ekta important part ache: payroll page e "Paid (Pay Staff)" column dekhay.

Ei value calculation hoy `salaryPayments` collection theke:

```js
const paidStaff = (distributions || [])
  .filter(
    (d) =>
      String(d.employeeId) === String(p.employeeId) &&
      monthCodeFromDate(d.date) === p.month
  )
  .reduce((s, d) => s + (Number(d.amount) || 0), 0);
```

Meaning:

- employeeId match hobe
- payment date er month same hobe payroll month e
- then total amount sum hobe

Abar due compute hoy:

```js
due = Math.max(0, net - paidStaff)
```

So payment actual over status update kora hoy, but database e `payrolls.status` change na kore UI e only display status change hoy:

```js
let displayStatus = p.status;
if (displayStatus !== "Cancelled") {
  if (net > 0 && paidStaff >= net) displayStatus = "Paid";
  else if (paidStaff > 0) displayStatus = "Partially Paid";
}
```

Eta important: UI e actual payment condition diye status show hoy; DB te `payrolls.status` not always reflect kore, because salary payment maybe employee page theke separate collection e record hote thake.

### Step 6: Summary cards
Page er top e 4 summary card ache:

- Total Basic Salary
- Paid (Pay Staff)
- Total Deduction
- Total Net Salary

These `summary` object compute hoy from `payrollRows`.

Example:

```js
const totalBasic = payrollRows.reduce((s, r) => s + (r.basicSalary || 0), 0);
const totalPaidStaff = payrollRows.reduce((s, r) => s + (r.paidStaff || 0), 0);
const totalDeduction = payrollRows.reduce((s, r) => s + (r.deductionTotal || 0), 0);
const totalNet = payrollRows.reduce((s, r) => s + (r.net || 0), 0);
```

### Step 7: Generate Payroll button
`handleGenerate()` function:

- month/year required
- POST to `/api/payroll` with body:

```json
{
  "action": "generate",
  "month": "2026-10",
  "year": "2026"
}
```

Backend route: `app/api/payroll/route.js`

`generatePayroll()` function:

- active employees fetch kore (`status: "Active"`)
- existing payrolls for same month/year check kore
- already existing employee gulake skip kore
- new payroll row create kore

Payload example:

```js
{
  employeeId: emp._id.toString(),
  employeeName: emp.name,
  employeeEmail: emp.email || "",
  department: emp.department || "",
  month,
  year: String(year),
  basicSalary,
  bonus: 0,
  allowance: 0,
  deduction: 0,
  netSalary: basicSalary,
  status: "Pending",
  createdAt: new Date(),
  updatedAt: new Date()
}
```

Then UI e `setPayrolls((prev) => [...result.generated, ...prev])` diye local state update hoy.

### Step 8: Add bonus / adjustment
`Add Bonus / Payroll` button click e modal open hoy.

User employee select kore, adjustment type select kore (`Bonus`, `Allowance`, `Deduction`), category, amount, reason fill kore.

Then `handleAddAdjustment()` run hoy:

- `payrollRows.find((r) => r.id === selectedPayroll)`
- payload prepare hoy `payroll_adjustments` collection e

```js
{
  payrollId: selectedPayroll,
  employeeId: payroll.employeeId,
  employeeName: payroll.employeeName,
  month: payroll.month,
  year: payroll.year,
  type: adjustForm.type,
  category: adjustForm.category,
  amount: Number(adjustForm.amount),
  reason: adjustForm.reason.trim()
}
```

Then `POST /api/data?collection=payroll_adjustments` call hoy.

UI e `setAdjustments((prev) => [data.data, ...prev])` diye state update.

### Step 9: Salary payment / Pay Staff
`Pay` action button click e modal open hoy. `openPayModal` function:

- selected payroll row find hoy
- due amount compute hoy

```js
const due = payroll ? Math.max(0, (payroll.net || 0) - (payroll.paidStaff || 0)) : 0;
```

Then `handlePaySubmit()` call hoy (not fully visible in snippet but logic like this):

- method, amount, date, transactionId, note collect hoy
- insert into `salaryPayments` collection
- maybe payroll status update hoy

This is the actual cash/bank transfer entry.

For this project, salary payment er data is not only payroll row er sathe attached; it is also treated as a separate list in `salaryPayments`, then used to recompute due and display status in payroll page.

### Step 10: Detail and history modal
Action buttons:

- View (`Eye`) -> open detail modal
- History (`History`) -> show employee er previous months payroll
- Adjust (`Pencil`) -> bonus/allowance/deduction add
- Pay (`Wallet`) -> salary pay modal

History compute hoy:

```js
const employeePayrollHistory = useMemo(() => {
  return payrolls
    .filter((p) => String(p.employeeId) === String(selectedPayroll))
    .sort(...);
}, [payrolls, selectedPayroll]);
```

So employee-wise previous payroll history dekhano hoy.

### Step 11: DataTable rendering
Table columns are:

- Employee
- Basic Salary
- Bonus
- Allowance
- Deduction
- Net Salary
- Paid (Pay Staff)
- Status
- Action

Pagination `ITEMS_PER_PAGE = 10` diye hay.

Search also available:

```js
const q = search.trim().toLowerCase();
return payrollRows.filter((r) =>
  [r.employeeName, r.employeeId, r.status, r.displayStatus].filter(Boolean).some((f) => String(f).toLowerCase().includes(q))
);
```

---

## 3) Payroll Reports page er full flow

File: `app/employee-management/payroll-reports/page.js`

Ei page ta mainly reporting dashboard. Payroll page er data use kore summary + filter + monthly/department report banae.

### Step 1: Same data load
Payroll reports page-o same four collections fetch hoy:

- employees
- payrolls
- payroll_adjustments
- salaryPayments

### Step 2: Filter options
Page e filters ache:

- Month
- Year
- Employee
- Department
- Payment Status

`departmentOptions` employee list theke derive hoy.

`employeeOptions` employee list theke derive hoy.

### Step 3: `filteredPayrolls` derive hoy selected month/year er jonno

```js
const filteredPayrolls = useMemo(() => {
  return payrolls.filter((p) => p.month === month && String(p.year) === year);
}, [payrolls, month, year]);
```

### Step 4: Salary detail add kora hoy
Each row e:

- employee info
- bonus total
- allowance total
- deduction total
- net
- paid amount

```js
const payrollWithDetails = useMemo(() => {
  return filteredPayrolls.map((p) => {
    const emp = activeEmployeeMap[p.employeeId];
    const empAdjustments = adjustments.filter((a) => a.payrollId === p.id);
    const bonusTotal = ...;
    const allowanceTotal = ...;
    const deductionTotal = ...;
    const net = ...;
    const paidAmount = distributions
      .filter((d) => d.employeeId === p.employeeId && monthCodeFromDate(d.date) === p.month)
      .reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return { ...p, emp, bonusTotal, allowanceTotal, deductionTotal, net, paidAmount, adjustments: empAdjustments };
  });
}, [filteredPayrolls, adjustments, distributions, activeEmployeeMap]);
```

### Step 5: `Generate Report` button
`handleGenerateReport()` run hoy.

- `setReportLoading(true)`
- `applyFilters(payrollWithDetails)` data filter hoy
- setReportData(data)
- pagination reset

`applyFilters()` logic:

```js
if (employeeFilter) result = result.filter((r) => r.employeeId === employeeFilter);
if (departmentFilter) result = result.filter((r) => r.emp?.department === departmentFilter);
if (statusFilter) result = result.filter((r) => r.status === statusFilter);
```

### Step 6: Report summary cards
`reportSummary` e data compute hoy:

- total basic
- total bonus
- total allowance
- total deduction
- total net
- total paid
- pending amount

### Step 7: Yearly report
`yearlyReport` compute hoy:

- reportData theke month-wise groups
- each month-er totalBasic, totalBonus, totalDeduction, totalNet, totalPaid, paidCount, pendingCount

Meaning: selected year er month by month summary.

### Step 8: Department report
`departmentReport` compute hoy department-wise total salary.

It groups by `r.emp?.department || "Unassigned"` and computes totals for each department.

### Step 9: Report table
Report data table shows:

- Employee
- Basic
- Bonus
- Allowance
- Deduction
- Net
- Paid
- Status

This is the final report of selected payroll month/year.

---

## 4) Backend API er role

### `app/api/data/route.js`
This is generic collection API.

Responsibilities:

- `GET /api/data?collection=employees` -> fetch all documents
- `POST /api/data?collection=payroll_adjustments` -> insert adjustment row
- `DELETE /api/data?id=...&collection=payroll_adjustments` -> delete adjustment

This is the generic write/read layer for all collections.

### `app/api/payroll/route.js`
This is special payroll API.

Two actions exist:

1. `action === "generate"`
   - generate payroll records for active employees for a selected month/year
2. `action === "distribute"`
   - salary payment distribution insert and payroll status update

`generatePayroll()` function creates only those employees who do not already have a payroll record for that month/year.

### `app/api/reports/route.js`
This route handles report export/aggregation for general reports; for payroll reports it specifically builds rows for:

- payrolls
- adjustment amounts
- net salary per employee

It supports `reportId === "payroll"` and returns aggregated row data.

---

## 5) Real formula / business logic (most important)

Project-e salary calculation er core formula:

```text
net salary = basic salary + bonus + allowance - deduction
```

And paid status is computed like:

```text
if total payment for that employee in that month >= net salary => Paid
else if payment > 0 => Partially Paid
else => Pending
```

`salaryPayments` collection e actual payment entries thake, ar UI totals those records to compute displayed status.

This means:

- `payrolls` row = payroll template / monthly salary record
- `payroll_adjustments` row = extra adjustments
- `salaryPayments` row = actual money disbursed

All three together build final payroll view.

---

## 6) Overall flow in one sentence

Employee list theke active employee guli month/year-specific payroll row e create hoy; then bonus/allowance/deduction add hoy; actual cash/bank/bKash payment `salaryPayments` collection-e insert hoy; UI total and status compute kore display hoy; same dataset report page filter + aggregate + summarise kore yearly/department-wise payroll report banay.

---

## 7) Short practical understanding

Ato simple vabe bola jay:

- Payroll page = monthly salary management page
- Payroll Reports page = summary/report page
- Database logic = payroll rows + adjustments + payments
- Main goal = employee-wise month wise salary calculation, payment tracking, and reporting

Ei dui page e actual logic majorly client-side in React state; backend mostly CRUD + generate payroll records + aggregate report data.

---

## 8) Relevant files

- `app/employee-management/payroll/page.js`
- `app/employee-management/payroll-reports/page.js`
- `app/api/payroll/route.js`
- `app/api/reports/route.js`
- `app/api/data/route.js`
- `app/lib/employee-utils.js`

If you want, next step e ami eta ar ekta diagram-style flowchart format-e o likhte pari (ASCII flowchart / Mermaid style), jate developer ba client er jonno easy to understand hoy.
