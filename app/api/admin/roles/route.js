import { NextResponse } from "next/server";
import { deleteRole, createRole, getRole, listRoles, PERMISSION_GROUPS, updateRole, validPermissions } from "@/lib/roles";
import { requireAdmin } from "@/lib/auth";

const KEY_RE = /^[a-z0-9_]{2,40}$/;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    return NextResponse.json({ success: true, roles: await listRoles(), permissionGroups: PERMISSION_GROUPS });
  } catch (error) {
    console.error("ROLES GET ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to load roles." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const body = await request.json();
    const key = String(body.key || "").trim().toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const name = String(body.name || "").trim();
    const permissions = validPermissions(body.permissions) || [];
    if (!KEY_RE.test(key) || !name) return NextResponse.json({ success: false, message: "Enter a valid role key and name." }, { status: 400 });
    if (await getRole(key)) return NextResponse.json({ success: false, message: "A role with this key already exists." }, { status: 409 });
    const role = await createRole({ key, name, description: String(body.description || ""), permissions });
    return NextResponse.json({ success: true, role });
  } catch (error) {
    console.error("ROLE CREATE ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to create role." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const body = await request.json();
    const key = String(body.key || "").trim();
    const role = await getRole(key);
    if (!role) return NextResponse.json({ success: false, message: "Role not found." }, { status: 404 });
    const permissions = validPermissions(body.permissions);
    if (permissions === null) return NextResponse.json({ success: false, message: "Permissions must be an array." }, { status: 400 });
    if (key === "admin" && !permissions.includes("manage_roles")) {
      return NextResponse.json({ success: false, message: "The Administrator role must keep role management access." }, { status: 400 });
    }
    await updateRole(key, { name: body.name, description: body.description, permissions });
    return NextResponse.json({ success: true, role: await getRole(key) });
  } catch (error) {
    console.error("ROLE UPDATE ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to update role." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { key } = await request.json();
    const result = await deleteRole(String(key || "").trim());
    if (!result.ok && result.reason === "system") return NextResponse.json({ success: false, message: "System roles cannot be deleted." }, { status: 400 });
    if (!result.ok && result.reason === "assigned") return NextResponse.json({ success: false, message: `Reassign ${result.count} user(s) before deleting this role.` }, { status: 400 });
    if (!result.ok) return NextResponse.json({ success: false, message: "Role not found." }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("ROLE DELETE ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to delete role." }, { status: 500 });
  }
}
