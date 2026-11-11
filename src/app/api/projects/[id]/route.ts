import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ProjectData } from "@/types/project";
import { sanitizeMongoInput } from "@/lib/sanitize";



// GET /api/projects/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDb();
    const collection = db.collection<ProjectData>("projects");

    const project = await collection.findOne({ id });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = project as any;
    return NextResponse.json({
      success: true,
      project: rest as ProjectData,
    });
  } catch (error: any) {
    console.error("GET /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch project" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const rawBody = await request.json();
    const body = sanitizeMongoInput(rawBody);
    const now = new Date().toISOString();

    const db = await getDb();
    const collection = db.collection<ProjectData>("projects");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id: _ignoreId, createdAt: _ignoreCreatedAt, ...cleanBody } = body;

    const updateData: Partial<ProjectData> = {
      ...cleanBody,
      id,
      updatedAt: now,
    };

    await collection.updateOne(
      { id },
      {
        $set: updateData,
        $setOnInsert: { createdAt: body.createdAt || now },
      },
      { upsert: true }
    );

    const updated = await collection.findOne({ id });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = (updated || {}) as any;

    return NextResponse.json({
      success: true,
      project: rest as ProjectData,
    });
  } catch (error: any) {
    console.error("PUT /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update project" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id]?permanent=true|false
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = request.nextUrl;
    const isPermanent = searchParams.get("permanent") === "true";

    const db = await getDb();
    const collection = db.collection<ProjectData>("projects");

    if (isPermanent) {
      // Permanently remove from database
      const result = await collection.deleteOne({ id });
      return NextResponse.json({
        success: true,
        permanent: true,
        deletedCount: result.deletedCount,
        message: "প্রকল্পটি স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলা হয়েছে।",
      });
    } else {
      // Soft delete: move to Recycle Bin
      const now = new Date().toISOString();
      const result = await collection.updateOne(
        { id },
        {
          $set: {
            isDeleted: true,
            deletedAt: now,
            updatedAt: now,
          },
        }
      );
      return NextResponse.json({
        success: true,
        permanent: false,
        trashed: true,
        modifiedCount: result.modifiedCount,
        message: "প্রকল্পটি রিসাইকেল বিনে পাঠানো হয়েছে।",
      });
    }
  } catch (error: any) {
    console.error("DELETE /api/projects/[id] error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete project" },
      { status: 500 }
    );
  }
}
