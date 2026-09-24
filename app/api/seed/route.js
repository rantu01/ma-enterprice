import { connectDB } from "@/lib/mongodb";
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 10;

const users = [
  { name: "Admin User", email: "admin@maaenterprise.com", password: "admin123", role: "admin", status: "active" },
  { name: "Manager User", email: "manager@maaenterprise.com", password: "manager123", role: "manager", status: "active" },
  { name: "Viewer User", email: "viewer@maaenterprise.com", password: "viewer123", role: "viewer", status: "active" },
];

const organizations = [
  { name: "Meridian Holdings", type: "Corporation", contactPerson: "James Wilson", email: "james@meridian.com", phone: "+1-555-0101", address: "123 Business Ave, New York, NY", description: "Global investment firm", status: "active" },
  { name: "Summit Logistics", type: "LLC", contactPerson: "Maria Garcia", email: "maria@summitlogistics.com", phone: "+1-555-0102", address: "456 Commerce St, Chicago, IL", description: "Supply chain and logistics", status: "active" },
  { name: "Greenfield Manufacturing", type: "Corporation", contactPerson: "Robert Taylor", email: "robert@greenfield.com", phone: "+1-555-0103", address: "789 Industrial Blvd, Detroit, MI", description: "Manufacturing and production", status: "active" },
  { name: "Apex Industries", type: "LLC", contactPerson: "Lisa Anderson", email: "lisa@apexindustries.com", phone: "+1-555-0104", address: "321 Tech Park, San Jose, CA", description: "Technology and innovation", status: "active" },
  { name: "NovaTech Solutions", type: "Startup", contactPerson: "David Chen", email: "david@novatech.com", phone: "+1-555-0105", address: "654 Innovation Dr, Austin, TX", description: "Software solutions provider", status: "pending" },
  { name: "Pacific Retail Corp", type: "Corporation", contactPerson: "Sarah Johnson", email: "sarah@pacificretail.com", phone: "+1-555-0106", address: "987 Market St, Seattle, WA", description: "Retail chain operations", status: "active" },
  { name: "Crystal Ventures", type: "Partnership", contactPerson: "Michael Brown", email: "michael@crystalventures.com", phone: "+1-555-0107", address: "147 Venture Way, Denver, CO", description: "Investment and venture capital", status: "active" },
  { name: "Horizon Enterprises", type: "LLC", contactPerson: "Emily Davis", email: "emily@horizonent.com", phone: "+1-555-0108", address: "258 Enterprise Rd, Boston, MA", description: "Diversified business conglomerate", status: "active" },
];

const employees = [
  { name: "John Smith", email: "john.smith@maaenterprise.com", department: "Engineering", status: "Active", hireDate: "2022-03-15", salary: 8500 },
  { name: "Sarah Johnson", email: "sarah.j@maaenterprise.com", department: "Marketing", status: "Active", hireDate: "2021-07-22", salary: 7200 },
  { name: "Michael Chen", email: "m.chen@maaenterprise.com", department: "Finance", status: "On Leave", hireDate: "2023-01-10", salary: 9100 },
  { name: "Emily Davis", email: "e.davis@maaenterprise.com", department: "HR", status: "Active", hireDate: "2024-02-01", salary: 6800 },
  { name: "David Wilson", email: "d.wilson@maaenterprise.com", department: "Engineering", status: "Probation", hireDate: "2024-06-15", salary: 7500 },
  { name: "Lisa Anderson", email: "l.anderson@maaenterprise.com", department: "Design", status: "Active", hireDate: "2020-11-03", salary: 7800 },
  { name: "Robert Taylor", email: "r.taylor@maaenterprise.com", department: "Operations", status: "Inactive", hireDate: "2019-05-20", salary: 7000 },
  { name: "Anna Martinez", email: "a.martinez@maaenterprise.com", department: "Legal", status: "Active", hireDate: "2023-09-12", salary: 8200 },
  { name: "James Brown", email: "j.brown@maaenterprise.com", department: "Engineering", status: "Active", hireDate: "2023-03-01", salary: 8800 },
  { name: "Maria Garcia", email: "m.garcia@maaenterprise.com", department: "Marketing", status: "Active", hireDate: "2022-08-15", salary: 6900 },
];

const investments = [
  { name: "Tech Growth Fund", amount: 50000, category: "stocks", date: "2025-01-15", status: "Completed", notes: "Technology sector ETF" },
  { name: "Corporate Savings Account", amount: 25000, category: "bonds", date: "2025-01-12", status: "Completed", notes: "High-yield savings" },
  { name: "Q4 Dividend Payout", amount: 12500, category: "mutual-funds", date: "2025-01-10", status: "Completed", notes: "Quarterly dividend" },
  { name: "Office Expansion Fund", amount: 30000, category: "real-estate", date: "2025-01-08", status: "Pending", notes: "New office space" },
  { name: "Bond Portfolio A", amount: 75000, category: "bonds", date: "2025-01-05", status: "Completed", notes: "Government bonds" },
];

const deposits = [
  { type: "Savings Account", amount: 25000, date: "2025-01-15", status: "Completed", description: "Quarterly savings deposit" },
  { type: "Fixed Deposit", amount: 50000, date: "2025-01-10", status: "Completed", description: "12-month fixed deposit" },
  { type: "Checking Account", amount: 10000, date: "2025-01-05", status: "Pending", description: "Operating fund deposit" },
  { type: "Recurring Deposit", amount: 5000, date: "2024-12-28", status: "Processing", description: "Monthly recurring deposit" },
];

const expenses = [
  { category: "Office Supplies", amount: 3200, month: "January 2024", status: "Approved", notes: "Stationery order" },
  { category: "Utilities", amount: 4800, month: "January 2024", status: "Pending", notes: "Electricity bill" },
  { category: "Maintenance", amount: 2100, month: "December 2023", status: "Approved", notes: "Building repair" },
  { category: "Software", amount: 6500, month: "January 2024", status: "Processing", notes: "License renewal" },
  { category: "Furniture", amount: 7980, month: "January 2024", status: "Pending", notes: "New desks and chairs" },
];

const routes = [
  { route: "Warehouse A → Store 1", distance: 120, vehicle: "Truck", cost: 450, status: "Active" },
  { route: "Warehouse B → Store 5", distance: 85, vehicle: "Van", cost: 320, status: "Completed" },
  { route: "Warehouse A → Store 3", distance: 200, vehicle: "Truck", cost: 780, status: "Pending" },
  { route: "Warehouse C → Store 2", distance: 60, vehicle: "Bike", cost: 45, status: "Active" },
  { route: "Warehouse A → Store 7", distance: 310, vehicle: "Truck", cost: 1200, status: "Completed" },
];

const salaries = [
  { employee: "John Smith", email: "john.smith@maaenterprise.com", period: "January 2025", amount: 8500, status: "Paid", date: "2025-01-31" },
  { employee: "Sarah Johnson", email: "sarah.j@maaenterprise.com", period: "January 2025", amount: 7200, status: "Paid", date: "2025-01-31" },
  { employee: "Michael Chen", email: "m.chen@maaenterprise.com", period: "January 2025", amount: 9100, status: "Pending", date: "2025-01-31" },
  { employee: "Emily Davis", email: "e.davis@maaenterprise.com", period: "December 2024", amount: 6800, status: "Paid", date: "2024-12-31" },
  { employee: "David Wilson", email: "d.wilson@maaenterprise.com", period: "December 2024", amount: 7500, status: "Unpaid", date: "2024-12-31" },
];

const payments = [
  { loanId: "LN-2847", loanOrganization: "Apex Industries", amount: 45000, method: "wire_transfer", date: "2025-12-01", status: "completed" },
  { loanId: "LN-2846", loanOrganization: "NovaTech Solutions", amount: 5000, method: "bank_transfer", date: "2025-11-28", status: "completed" },
  { loanId: "LN-2845", loanOrganization: "Pacific Retail Corp", amount: 25000, method: "check", date: "2025-11-15", status: "pending" },
  { loanId: "LN-2843", loanOrganization: "Crystal Ventures", amount: 10000, method: "bank_transfer", date: "2025-11-01", status: "completed" },
];

const loans = [
  { organizationId: "org_1", organizationName: "Meridian Holdings", amount: 200000, interestRate: 8.5, term: 24, status: "active", startDate: "2025-12-15", dueDate: "2025-12-15" },
  { organizationId: "org_2", organizationName: "Summit Logistics", amount: 75000, interestRate: 7.0, term: 12, status: "pending", startDate: "2025-12-18", dueDate: "2025-12-18" },
  { organizationId: "org_3", organizationName: "Greenfield Manufacturing", amount: 125000, interestRate: 9.0, term: 36, status: "active", startDate: "2025-12-10", dueDate: "2025-12-10" },
  { organizationId: "org_4", organizationName: "Apex Industries", amount: 45000, interestRate: 6.5, term: 12, status: "paid", startDate: "2025-11-28", dueDate: "2025-11-28" },
  { organizationId: "org_5", organizationName: "NovaTech Solutions", amount: 12500, interestRate: 10.0, term: 6, status: "overdue", startDate: "2025-11-15", dueDate: "2025-11-15" },
  { organizationId: "org_6", organizationName: "Pacific Retail Corp", amount: 320000, interestRate: 7.5, term: 48, status: "processing", startDate: "2025-12-20", dueDate: "2025-12-20" },
  { organizationId: "org_7", organizationName: "Horizon Enterprises", amount: 88000, interestRate: 8.0, term: 24, status: "active", startDate: "2025-12-05", dueDate: "2025-12-05" },
  { organizationId: "org_8", organizationName: "Crystal Ventures", amount: 55000, interestRate: 6.0, term: 12, status: "pending", startDate: "2025-12-22", dueDate: "2025-12-22" },
];

export async function POST() {
  try {
    const { db } = await connectDB();

    const collections = await db.listCollections().toArray();
    const existingCollections = collections.map((c) => c.name);

    if (!existingCollections.includes("users")) {
      for (const user of users) {
        const hashedPassword = await bcrypt.hash(user.password, SALT_ROUNDS);
        await db.collection("users").insertOne({
          ...user,
          password: hashedPassword,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("organizations")) {
      for (const org of organizations) {
        await db.collection("organizations").insertOne({
          ...org,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("employees")) {
      for (const emp of employees) {
        await db.collection("employees").insertOne({
          ...emp,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("investments")) {
      for (const inv of investments) {
        await db.collection("investments").insertOne({
          ...inv,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("deposits")) {
      for (const dep of deposits) {
        await db.collection("deposits").insertOne({
          ...dep,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("expenses")) {
      for (const exp of expenses) {
        await db.collection("expenses").insertOne({
          ...exp,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("routes")) {
      for (const route of routes) {
        await db.collection("routes").insertOne({
          ...route,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("salaries")) {
      for (const sal of salaries) {
        await db.collection("salaries").insertOne({
          ...sal,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("payments")) {
      for (const pay of payments) {
        await db.collection("payments").insertOne({
          ...pay,
          createdAt: new Date(),
        });
      }
    }

    if (!existingCollections.includes("loans")) {
      for (const loan of loans) {
        await db.collection("loans").insertOne({
          ...loan,
          createdAt: new Date(),
        });
      }
    }

    return Response.json({ success: true, message: "Database seeded successfully" });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}