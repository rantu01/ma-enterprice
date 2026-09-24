import { connectDB } from "@/lib/mongodb";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const { db } = await connectDB();
    const items = await db.collection(collection).find({}).sort({ createdAt: -1 }).toArray();

    return Response.json({
      data: items.map((item) => ({
        ...item,
        id: item._id.toString(),
        _id: undefined,
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const body = await request.json();
    const { db } = await connectDB();

    const result = await db.collection(collection).insertOne({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return Response.json({
      data: { ...body, id: result.insertedId.toString(), createdAt: new Date() },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}