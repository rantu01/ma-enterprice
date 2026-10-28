import { connectDB } from "@/lib/mongodb";

export const ROLE_KEYS = ["admin", "manager", "viewer"];

export const PERMISSION_GROUPS = [
  {
    key: "dashboard",
    label: "Dashboard",
    permissions: [
      { key: "view_dashboard", label: "View dashboard" },
      { key: "view_reports", label: "View reports" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    permissions: [
      { key: "manage_loans", label: "Manage loans" },
      { key: "manage_employees", label: "Manage employees" },
      { key: "manage_accounts", label: "Manage accounts" },
      { key: "manage_expenses", label: "Manage office expenses" },
      { key: "manage_routes", label: "Manage route calculations" },
    ],
  },
  {
    key: "administration",
    label: "Administration",
    permissions: [
      { key: "manage_roles", label: "Manage roles and permissions" },
      { key: "manage_settings", label: "Manage settings" },
    ],
  },
];

export const SYSTEM_ROLE_DEFAULTS = [
  {
    key: "admin",
    name: "Administrator",
    description: "Full access to the enterprise workspace.",
    permissions: PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.key)),
    isSystem: true,
  },
  {
    key: "manager",
    name: "Manager",
    description: "Access to day-to-day operations and reporting.",
    permissions: ["view_dashboard", "view_reports", "manage_loans", "manage_employees", "manage_accounts", "manage_expenses", "manage_routes"],
    isSystem: true,
  },
  {
    key: "viewer",
    name: "Viewer",
    description: "Read-only access to the dashboard and reports.",
    permissions: ["view_dashboard", "view_reports"],
    isSystem: true,
  },
];

const collectionName = "roles";

export async function getRolesCollection() {
  const { db } = await connectDB();
  return db.collection(collectionName);
}

export async function ensureSystemRoles() {
  const collection = await getRolesCollection();
  const now = new Date();
  await collection.bulkWrite(
    SYSTEM_ROLE_DEFAULTS.map((role) => ({
      updateOne: {
        filter: { key: role.key },
        update: {
          $setOnInsert: {
            ...role,
            createdAt: now,
            updatedAt: now,
          },
        },
        upsert: true,
      },
    }))
  );
  await collection.createIndex({ key: 1 }, { unique: true });
  return collection;
}

export async function listRoles() {
  const collection = await ensureSystemRoles();
  const { db } = await connectDB();
  const [roles, users] = await Promise.all([
    collection.find({}).sort({ isSystem: -1, name: 1 }).toArray(),
    db.collection("users").aggregate([
      { $group: { _id: { $ifNull: ["$role", "viewer"] }, userCount: { $sum: 1 } } },
    ]).toArray(),
  ]);
  const counts = new Map(users.map((item) => [item._id, item.userCount]));
  return roles.map((role) => ({
    ...role,
    userCount: counts.get(role.key) || 0,
    permissionCount: Array.isArray(role.permissions) ? role.permissions.length : 0,
  }));
}

export async function getRole(key) {
  const collection = await ensureSystemRoles();
  return collection.findOne({ key });
}

export async function getRolePermissions(key) {
  const role = await getRole(key);
  return Array.isArray(role?.permissions) ? role.permissions : [];
}

export async function createRole(role) {
  const collection = await ensureSystemRoles();
  const now = new Date();
  const document = {
    key: role.key,
    name: role.name,
    description: role.description || "",
    permissions: role.permissions || [],
    isSystem: false,
    createdAt: now,
    updatedAt: now,
  };
  await collection.insertOne(document);
  return document;
}

export async function updateRole(key, updates) {
  const collection = await ensureSystemRoles();
  const allowed = {
    updatedAt: new Date(),
  };
  if (typeof updates.name === "string") allowed.name = updates.name.trim();
  if (typeof updates.description === "string") allowed.description = updates.description.trim();
  if (Array.isArray(updates.permissions)) allowed.permissions = updates.permissions;
  const result = await collection.updateOne({ key }, { $set: allowed });
  return result.matchedCount > 0;
}

export async function deleteRole(key) {
  const collection = await ensureSystemRoles();
  const role = await collection.findOne({ key });
  if (!role) return { ok: false, reason: "not_found" };
  if (role.isSystem) return { ok: false, reason: "system" };
  const { db } = await connectDB();
  const assigned = await db.collection("users").countDocuments({ role: key });
  if (assigned) return { ok: false, reason: "assigned", count: assigned };
  await collection.deleteOne({ key });
  return { ok: true };
}

export function validPermissions(value) {
  const allowed = new Set(PERMISSION_GROUPS.flatMap((group) => group.permissions.map((permission) => permission.key)));
  return Array.isArray(value)
    ? [...new Set(value.filter((permission) => typeof permission === "string" && allowed.has(permission)))]
    : null;
}
