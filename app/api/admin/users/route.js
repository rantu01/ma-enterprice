import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { connectDB } from "@/lib/mongodb";
import { getRole } from "@/lib/roles";
import { requireAdmin } from "@/lib/auth";

const SALT_ROUNDS = 10;

function toClientUser(user) {
  if (!user) return null;
  return {
    id: user._id ? user._id.toString() : user.id,
    name: user.name,
    email: user.email,
    role: user.role || "viewer",
    status: user.status || "active",
    createdAt: user.createdAt,
  };
}

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const { db } = await connectDB();
    const users = await db.collection("users").find({}).sort({ name: 1, email: 1 }).toArray();

    const usersWithRoles = await Promise.all(
      users.map(async (u) => {
        const clientUser = toClientUser(u);
        const role = await getRole(clientUser.role);
        return {
          ...clientUser,
          roleName: role ? role.name : "Viewer",
        };
      })
    );

    return NextResponse.json({ success: true, users: usersWithRoles });
  } catch (error) {
    console.error("USERS GET ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to load users." }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const body = await request.json();
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const role = String(body.role || "viewer").trim();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, message: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    const roleDoc = await getRole(role);
    if (!roleDoc) {
      return NextResponse.json({ success: false, message: "Invalid role selected." }, { status: 400 });
    }

    const { db } = await connectDB();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "A user with this email already exists." },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.collection("users").insertOne({
      name,
      email,
      password: hashedPassword,
      role,
      status: "active",
      createdAt: new Date(),
    });

    const newUser = {
      id: result.insertedId.toString(),
      name,
      email,
      role,
      roleName: roleDoc.name,
      status: "active",
    };

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("USER CREATE ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to create user." }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;

    const body = await request.json();
    const id = String(body.id || "").trim();
    const password = String(body.password || "").trim();

    if (!id) {
      return NextResponse.json({ success: false, message: "User id is required." }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ success: false, message: "Password is required." }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return NextResponse.json({ success: false, message: "Invalid user id." }, { status: 400 });
    }

    const { db } = await connectDB();
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.collection("users").updateOne(
      { _id: objectId },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("USER PASSWORD RESET ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to reset password." }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const auth = await requireAdmin();
    if (auth.response) return auth.response;
    const { id } = await request.json();
    const { db } = await connectDB();
    const result = await db.collection("users").deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, message: "User not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("USER DELETE ERROR:", error);
    return NextResponse.json({ success: false, message: "Unable to delete user." }, { status: 500 });
  }
}