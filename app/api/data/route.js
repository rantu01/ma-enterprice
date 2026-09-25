import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

function toClient(item) {
  if (!item) return item;
  const { _id, ...rest } = item;
  return { ...rest, id: _id ? _id.toString() : rest.id };
}

function parseId(id) {
  if (!id) return null;
  try {
    return new ObjectId(id);
  } catch {
    return null;
  }
}

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
      data: items.map(toClient),
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

// Support legacy query-style calls: /api/data?id=<id>&collection=<name>
// (The canonical REST form /api/data/[id]?collection=<name> is handled in [id]/route.js)
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const id = searchParams.get("id");

    if (!collection || !id) {
      return Response.json({ error: "Collection and id parameters are required" }, { status: 400 });
    }

    const objectId = parseId(id);
    if (!objectId) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await request.json();
    const { db } = await connectDB();

    const { id: _ignored, _id: _ignored2, ...updateData } = body;
    updateData.updatedAt = new Date();

    const result = await db
      .collection(collection)
      .updateOne({ _id: objectId }, { $set: updateData });

    if (result.matchedCount === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ data: { ...body, id } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");
    const id = searchParams.get("id");

    if (!collection || !id) {
      return Response.json({ error: "Collection and id parameters are required" }, { status: 400 });
    }

    const objectId = parseId(id);
    if (!objectId) {
      return Response.json({ error: "Invalid id" }, { status: 400 });
    }

    const { db } = await connectDB();
    const result = await db.collection(collection).deleteOne({ _id: objectId });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
