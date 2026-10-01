import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function toClient(item) {
  if (!item) return item;
  const { _id, ...rest } = item;
  return { ...rest, id: _id ? _id.toString() : rest.id };
}

function parseId(id) {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

function calcNet(basic, bonus, allowance, deduction) {
  return Math.round(((Number(basic) || 0) + (Number(bonus) || 0) + (Number(allowance) || 0) - (Number(deduction) || 0)) * 100) / 100;
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const { db } = await connectDB();
    const items = await db.collection(collection).find({}).sort({ createdAt: -1 }).toArray();

    return Response.json({ data: items.map(toClient) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body || {};

    if (action === "generate") {
      return await generatePayroll(body, request);
    }

    if (action === "distribute") {
      return await distributeSalary(body, request);
    }

    return Response.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function generatePayroll(body, request) {
  const { month, year, employeeIds } = body || {};

  if (!month || !year) {
    return Response.json({ error: "Month and year are required" }, { status: 400 });
  }

  const { db } = await connectDB();

  let employees;
  if (employeeIds && employeeIds.length > 0) {
    const objectIds = employeeIds.map(id => parseId(id)).filter(Boolean);
    employees = await db.collection("employees").find({ _id: { $in: objectIds } }).toArray();
  } else {
    employees = await db.collection("employees").find({ status: "Active" }).toArray();
  }

  const existingPayrolls = await db.collection("payrolls")
    .find({ month, year: String(year) })
    .toArray();

  const existingMap = {};
  existingPayrolls.forEach(p => {
    existingMap[p.employeeId] = true;
  });

  const generated = [];
  const skipped = [];
  const errors = [];

  for (const emp of employees) {
    const empId = emp._id.toString();
    if (existingMap[empId]) {
      skipped.push(empId);
      continue;
    }

    const basicSalary = Number(emp.salary) || 0;
    const payload = {
      employeeId: empId,
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
      updatedAt: new Date(),
    };

    try {
      const result = await db.collection("payrolls").insertOne(payload);
      generated.push({ ...payload, id: result.insertedId.toString() });
    } catch (err) {
      errors.push({ employeeId: empId, employeeName: emp.name, error: err.message });
    }
  }

  return Response.json({
    data: { generated, skipped, errors, total: generated.length },
  });
}

async function distributeSalary(body, request) {
  const { payrollId, employeeId, employeeName, date, amount, method, purpose, transactionId, note } = body || {};

  if (!payrollId || !employeeId || !amount || amount <= 0) {
    return Response.json({ error: "Payroll ID, employee ID, and amount are required" }, { status: 400 });
  }

  const { db } = await connectDB();

  const payroll = await db.collection("payrolls").findOne({ _id: parseId(payrollId) });
  if (!payroll) {
    return Response.json({ error: "Payroll record not found" }, { status: 404 });
  }

  if (String(payroll.employeeId) !== String(employeeId)) {
    return Response.json({ error: "Employee does not match this payroll record" }, { status: 400 });
  }

  const paymentPayload = {
    employeeId,
    employeeName: employeeName || payroll.employeeName,
    date: date || new Date().toISOString().slice(0, 10),
    amount: Number(amount),
    method: method || "Cash",
    purpose: purpose || `Salary payment - ${payroll.month}`,
    transactionId: transactionId || "",
    status: "Paid",
    payrollId,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const paymentResult = await db.collection("salaryPayments").insertOne(paymentPayload);

  await db.collection("payrolls").updateOne(
    { _id: parseId(payrollId) },
    { $set: { status: "Paid", updatedAt: new Date() } }
  );

  return Response.json({
    data: { ...paymentPayload, id: paymentResult.insertedId.toString() },
  });
}
