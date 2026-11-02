import { connectDB } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

const CATEGORY_CONFIG = {
  route: { categories: "routeCategories", entries: "routeEntries" },
  expense: { categories: "expenseCategories", entries: "expenseEntries" },
};

export async function PUT(request) {
  try {
    const body = await request.json();
    const { type, categoryId, newMainCategory } = body;
    const config = CATEGORY_CONFIG[type];
    const trimmedName = String(newMainCategory || "").trim();

    if (!config || !categoryId || !trimmedName) {
      return Response.json({ error: "Category type, category ID, and main category name are required." }, { status: 400 });
    }

    let objectId;
    try {
      objectId = new ObjectId(categoryId);
    } catch {
      return Response.json({ error: "Invalid category ID." }, { status: 400 });
    }

    const { db } = await connectDB();
    const category = await db.collection(config.categories).findOne({ _id: objectId });
    if (!category) {
      return Response.json({ error: "Category not found." }, { status: 404 });
    }

    const oldMainCategory = String(category.mainCategory || "");
    const categoryUpdate = await db.collection(config.categories).updateOne(
      { _id: objectId },
      { $set: { mainCategory: trimmedName } }
    );

    if (categoryUpdate.matchedCount === 0) {
      return Response.json({ error: "Category not found." }, { status: 404 });
    }

    const entryUpdate = await db.collection(config.entries).updateMany(
      {
        $or: [
          { categoryId },
          { categoryId: objectId },
          { category: oldMainCategory, categoryId: { $exists: false } },
          { category: oldMainCategory, categoryId: null },
        ],
      },
      { $set: { category: trimmedName } }
    );

    return Response.json({
      data: {
        id: categoryId,
        mainCategory: trimmedName,
        updatedEntries: entryUpdate.modifiedCount,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message || "Failed to rename category." }, { status: 500 });
  }
}
