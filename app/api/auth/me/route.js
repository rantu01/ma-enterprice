import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let session;
    try {
      session = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    if (!session?.id || !session?.token) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    let userId;
    try {
      userId = new ObjectId(session.id);
    } catch {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    const { db } = await connectDB();
    const user = await db.collection("users").findOne(
      { _id: userId, token: session.token },
      { projection: { password: 0, token: 0 } }
    );

    if (!user) {
      return NextResponse.json({ user: null }, { status: 200 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("AUTH ME ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
