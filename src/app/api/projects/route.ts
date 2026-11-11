import { NextRequest, NextResponse } from "next/server";
import { Sort } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { ProjectData } from "@/types/project";
import { sanitizeMongoInput } from "@/lib/sanitize";



// GET /api/projects - Fast search, filter, and pagination
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get("search")?.trim() || "";
    const isTrash = searchParams.get("trash") === "true";
    const fiscalYear = searchParams.get("fiscalYear")?.trim();
    const mode = searchParams.get("mode")?.trim() || "quotation";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(parseInt(searchParams.get("limit") || "10", 10), 100));
    const skip = (page - 1) * limit;

    const db = await getDb();
    const collection = db.collection<ProjectData>("projects");

    // Mode filter: separate PIC projects from General Quotation projects
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const modeCondition: any =
      mode === "pic"
        ? {
            $or: [
              { implementationMode: "pic" },
              { id: { $regex: "^(pic-|demo-pic)" } },
            ],
          }
        : {
            implementationMode: { $ne: "pic" },
            id: { $not: { $regex: "^(pic-|demo-pic)" } },
          };

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const andConditions: any[] = [
      modeCondition,
      { isDeleted: isTrash ? true : { $ne: true } },
    ];

    if (fiscalYear && fiscalYear !== "সকল") {
      andConditions.push({ fiscalYear });
    }

    if (search) {
      // Regex for partial, case-insensitive fast matching on name, code, contractor, or ward
      const escaped = search.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
      const searchRegex = new RegExp(escaped, "i");
      andConditions.push({
        $or: [
          { projectName: searchRegex },
          { projectCode: searchRegex },
          { contractorName: searchRegex },
          { unionName: searchRegex },
          { wardNo: searchRegex },
          { fiscalYear: searchRegex },
        ],
      });
    }

    const filter = { $and: andConditions };

    // Parallel fetch for data and counts for maximum speed
    // Active list: strictly newest added first (_id: -1); Trash list: newest deleted first
    const sortQuery: Sort = isTrash ? { deletedAt: -1, _id: -1 } : { _id: -1 };

    const [projects, totalCount, activeCount, trashCount] = await Promise.all([
      collection
        .find(filter, { projection: { photos: 0 } })
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .toArray(),
      collection.countDocuments(filter),
      collection.countDocuments({ $and: [modeCondition, { isDeleted: { $ne: true } }] }),
      collection.countDocuments({ $and: [modeCondition, { isDeleted: true }] }),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    // Remove MongoDB _id from response or format as id
    const sanitized = projects.map((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _id, ...rest } = p as any;
      return rest as ProjectData;
    });

    return NextResponse.json({
      success: true,
      page,
      limit,
      totalCount,
      totalPages,
      activeCount,
      trashCount,
      count: sanitized.length,
      isTrash,
      projects: sanitized,
    });
  } catch (error: any) {
    console.error("GET /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create or Upsert project
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const body = sanitizeMongoInput(rawBody);
    const now = new Date().toISOString();
    const projectId = body.id || `prj-${Date.now()}`;

    const db = await getDb();
    const collection = db.collection<ProjectData>("projects");

    const existing = await collection.findOne({ id: projectId });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _id, ...cleanBody } = body;

    const project: ProjectData = {
      ...cleanBody,
      id: projectId,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      isDeleted: false,
      deletedAt: null,
    };

    await collection.updateOne(
      { id: project.id },
      { $set: project },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      project,
    });
  } catch (error: any) {
    console.error("POST /api/projects error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to save project" },
      { status: 500 }
    );
  }
}
