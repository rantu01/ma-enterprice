import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { randomBytes } from "crypto";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const { db } = await connectDB();
    const user = await db.collection("users").findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    if (user.status !== "active") {
      return NextResponse.json({ error: "Account is not active" }, { status: 403 });
    }

    const token = randomBytes(32).toString("hex");

    await db.collection("users").updateOne(
      { _id: user._id },
      { $set: { token, lastLogin: new Date() } }
    );

    const userPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const response = NextResponse.json({ user: userPayload });

    // Set the session cookie directly on the response so the
    // Set-Cookie header is guaranteed to reach the browser.
    response.cookies.set("session", JSON.stringify({ id: user._id.toString(), token }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
