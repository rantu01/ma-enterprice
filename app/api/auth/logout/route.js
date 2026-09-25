import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST() {
  try {
    try {
      const cookieStore = await cookies();
      const sessionCookie = cookieStore.get("session");

      if (sessionCookie?.value) {
        const session = JSON.parse(sessionCookie.value);
        if (session?.id && session?.token) {
          const { db } = await connectDB();
          await db.collection("users").updateOne(
            { _id: new ObjectId(session.id), token: session.token },
            { $set: { token: null } }
          );
        }
      }
    } catch {
      // Ignore invalid session — still clear the cookie below
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("LOGOUT ERROR:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
