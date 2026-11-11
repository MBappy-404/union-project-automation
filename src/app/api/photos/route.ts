import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ProjectPhoto } from "@/types/project";
import { deleteFromCloudinary, getPublicIdFromUrl } from "@/lib/cloudinary";
import { sanitizeMongoInput } from "@/lib/sanitize";

// GET /api/photos?projectId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId")?.trim();

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: "projectId is required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const photosCol = db.collection("project_photos");
    const projectsCol = db.collection("projects");

    // First try project_photos collection
    const photos = await photosCol
      .find({ projectId })
      .sort({ uploadedAt: 1, _id: 1 })
      .toArray();

    if (photos && photos.length > 0) {
      const sanitized = photos.map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, projectId: _pid, ...rest } = p as any;
        return rest as ProjectPhoto;
      });
      return NextResponse.json({ success: true, photos: sanitized });
    }

    // Fallback: check inside projects collection
    const project = await projectsCol.findOne({ id: projectId });
    const projectPhotos: ProjectPhoto[] = project?.photos || [];

    return NextResponse.json({ success: true, photos: projectPhotos });
  } catch (error: any) {
    console.error("GET /api/photos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch photos" },
      { status: 500 }
    );
  }
}

// POST /api/photos
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeMongoInput(rawBody);
    const { projectId, photo } = body as {
      projectId: string;
      photo: ProjectPhoto;
    };

    if (!projectId || !photo || !photo.url) {
      return NextResponse.json(
        { success: false, error: "projectId and photo with url are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const photosCol = db.collection("project_photos");
    const projectsCol = db.collection("projects");

    const derivedPublicId = photo.publicId || getPublicIdFromUrl(photo.url) || undefined;

    const photoToSave: ProjectPhoto = {
      id: photo.id || `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      url: photo.url,
      publicId: derivedPublicId,
      caption: photo.caption || "",
      stage: photo.stage || "other",
      uploadedAt: photo.uploadedAt || new Date().toISOString(),
      size: photo.size,
      originalSize: photo.originalSize,
      fileName: photo.fileName,
    };

    // Save in project_photos collection
    await photosCol.updateOne(
      { id: photoToSave.id, projectId },
      { $set: { ...photoToSave, projectId } },
      { upsert: true }
    );

    // Also push / update in projects collection
    await projectsCol.updateOne(
      { id: projectId },
      {
        $pull: { photos: { id: photoToSave.id } } as any,
      }
    );
    await projectsCol.updateOne(
      { id: projectId },
      {
        $push: { photos: photoToSave } as any,
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    return NextResponse.json({ success: true, photo: photoToSave });
  } catch (error: any) {
    console.error("POST /api/photos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save photo" },
      { status: 500 }
    );
  }
}

// DELETE /api/photos?projectId=...&photoId=...&publicId=...
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId")?.trim();
    const photoId = searchParams.get("photoId")?.trim();
    let publicId = searchParams.get("publicId")?.trim();

    if (!projectId || !photoId) {
      return NextResponse.json(
        { success: false, error: "projectId and photoId are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const photosCol = db.collection("project_photos");
    const projectsCol = db.collection("projects");

    // 1. Look up the verified photo record in database (prevents IDOR attacks)
    const existingInCol = (await photosCol.findOne({ id: photoId, projectId })) as any;
    let verifiedPublicId: string | null = null;
    if (existingInCol) {
      verifiedPublicId =
        existingInCol.publicId ||
        (existingInCol.url ? getPublicIdFromUrl(existingInCol.url) : null);
    } else {
      const project = await projectsCol.findOne({ id: projectId });
      const match = project?.photos?.find((p: ProjectPhoto) => p.id === photoId);
      if (match) {
        verifiedPublicId =
          match.publicId || (match.url ? getPublicIdFromUrl(match.url) : null);
      }
    }

    // 2. Delete from Cloudinary ONLY using verifiedPublicId
    let cloudinaryDeleted = false;
    if (verifiedPublicId) {
      const cRes = await deleteFromCloudinary(verifiedPublicId);
      cloudinaryDeleted = cRes.success;
    }

    // 3. Remove from project_photos collection
    await photosCol.deleteOne({ id: photoId, projectId });

    // 4. Pull from project document photos array
    await projectsCol.updateOne(
      { id: projectId },
      {
        $pull: { photos: { id: photoId } } as any,
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    return NextResponse.json({
      success: true,
      deletedId: photoId,
      publicId,
      deletedFromCloudinary: cloudinaryDeleted,
    });
  } catch (error: any) {
    console.error("DELETE /api/photos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to delete photo" },
      { status: 500 }
    );
  }
}

// PATCH /api/photos (update caption or stage)
export async function PATCH(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeMongoInput(rawBody);
    const { projectId, photoId, caption, stage } = body;

    if (!projectId || !photoId) {
      return NextResponse.json(
        { success: false, error: "projectId and photoId are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const photosCol = db.collection("project_photos");
    const projectsCol = db.collection("projects");

    const updateFields: any = {};
    if (caption !== undefined) updateFields.caption = caption;
    if (stage !== undefined) updateFields.stage = stage;

    await photosCol.updateOne(
      { id: photoId, projectId },
      { $set: updateFields }
    );

    // Update inside projects collection
    const updateDoc: any = {};
    if (caption !== undefined) updateDoc["photos.$.caption"] = caption;
    if (stage !== undefined) updateDoc["photos.$.stage"] = stage;
    updateDoc["updatedAt"] = new Date().toISOString();

    await projectsCol.updateOne(
      { id: projectId, "photos.id": photoId },
      { $set: updateDoc }
    );

    return NextResponse.json({ success: true, photoId, updated: updateFields });
  } catch (error: any) {
    console.error("PATCH /api/photos error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update photo" },
      { status: 500 }
    );
  }
}
