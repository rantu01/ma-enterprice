import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { getRole } from "@/lib/roles";

export async function getSessionUser() {
  const cookieStore = await cookies();
  const value = cookieStore.get("session")?.value;
  if (!value) return null;

  let session;
  try {
    session = JSON.parse(value);
  } catch {
    return null;
  }
  if (!session?.id || !session?.token) return null;

  let userId;
  try {
    userId = new ObjectId(session.id);
  } catch {
    return null;
  }

  const { db } = await connectDB();
  const user = await db.collection("users").findOne({ _id: userId, token: session.token });
  if (!user || user.status !== "active") return null;

  const role = await getRole(user.role || "viewer");
  return { ...user, role: role?.key || "viewer", roleName: role?.name || "Viewer", rolePermissions: role?.permissions || [] };
}

export async function requireAdmin() {
  const user = await getSessionUser();
  if (!user) return { user: null, response: Response.json({ error: "Authentication required" }, { status: 401 }) };
  if (user.role !== "admin") return { user: null, response: Response.json({ error: "Administrator access required" }, { status: 403 }) };
  return { user, response: null };
}
