import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ProjectData } from "@/types/project";



// POST /api/projects/[id]/restore - Restore a project from Recycle Bin
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const now = new Date().toISOString();

    const db = await getDb();
    const collection = db.collection<ProjectData>("projects");

    const result = await collection.updateOne(
      { id },
      {
        $set: {
          isDeleted: false,
          deletedAt: null,
          updatedAt: now,
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: "Project not found in recycle bin" },
        { status: 404 }
      );
    }

    const restoredProject = await collection.findOne({ id });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...rest } = (restoredProject || {}) as any;

    return NextResponse.json({
      success: true,
      restored: true,
      message: "প্রকল্পটি সফলভাবে রিসাইকেল বিন থেকে পুনরুদ্ধার করা হয়েছে।",
      project: rest as ProjectData,
    });
  } catch (error: any) {
    console.error("POST /api/projects/[id]/restore error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to restore project" },
      { status: 500 }
    );
  }
}
