import { connectDB } from "@/lib/mongodb";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { db } = await connectDB();

    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/session=([^;]+)/);

    if (match) {
      try {
        const session = JSON.parse(decodeURIComponent(match[1]));
        await db.collection("users").updateOne(
          { _id: new ObjectId(session.id), token: session.token },
          { $set: { token: null } }
        );
      } catch {
        // Ignore invalid session
      }
    }

    const cookieStore = await cookies();
    cookieStore.set("session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 0,
      path: "/",
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}