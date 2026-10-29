// Database seeding is disabled.
// This route previously inserted hardcoded demo data into MongoDB collections.
// All data-insertion logic has been removed to prevent demo data from entering
// the real database. No database connection or insert operations are performed.

export async function POST() {
  // Disabled: does not connect to the database or insert any data.
  return Response.json(
    { success: false, message: "Seeding is disabled. Demo data will not be inserted." },
    { status: 403 }
  );
}
