import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const { db } = await connectDB();
    const item = await db.collection(collection).findOne({ _id: new ObjectId(id) });

    if (!item) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({
      data: { ...item, id: item._id.toString(), _id: undefined },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const body = await request.json();
    const { db } = await connectDB();

    const { id: _, ...updateData } = body;
    updateData.updatedAt = new Date();

    await db.collection(collection).updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return Response.json({ data: { ...body, id } });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const collection = searchParams.get("collection");

    if (!collection) {
      return Response.json({ error: "Collection parameter is required" }, { status: 400 });
    }

    const { db } = await connectDB();
    const result = await db.collection(collection).deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}