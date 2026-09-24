import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/mongodb";
import { randomBytes } from "crypto";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return Response.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { db } = await connectDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status !== "active") {
      return Response.json({ error: "Account is not active" }, { status: 403 });
    }

    const token = randomBytes(32).toString("hex");

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { token, lastLogin: new Date() } }
    );

    const cookieStore = await cookies();
    cookieStore.set("session", JSON.stringify({ id: user._id.toString(), token }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return Response.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}