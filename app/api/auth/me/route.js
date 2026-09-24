import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request) {
  try {
    const { db } = await connectDB();

    const cookieHeader = request.headers.get("cookie") || "";
    const match = cookieHeader.match(/session=([^;]+)/);

    if (!match) {
      return Response.json({ user: null }, { status: 200 });
    }

    let session;
    try {
      session = JSON.parse(decodeURIComponent(match[1]));
    } catch {
      return Response.json({ user: null }, { status: 200 });
    }

    let userId;
    try {
      userId = new ObjectId(session.id);
    } catch {
      return Response.json({ user: null }, { status: 200 });
    }

    const user = await db.collection("users").findOne(
      { _id: userId, token: session.token },
      { projection: { password: 0, token: 0 } }
    );

    if (!user) {
      return Response.json({ user: null }, { status: 200 });
    }

    return Response.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}