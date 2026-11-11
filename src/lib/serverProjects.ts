import { getDb } from "./mongodb";
import { ProjectData } from "@/types/project";

export interface InitialProjectsData {
  projects: ProjectData[];
  totalCount: number;
  activeCount: number;
  trashCount: number;
  totalPages: number;
}

/**
 * Server-side data fetcher for SSR.
 * Fetches initial 10 active projects directly from MongoDB Atlas
 * with a safe timeout so it never blocks page rendering.
 */
export async function getInitialProjectsData(
  limit = 10,
  mode: "quotation" | "pic" = "quotation"
): Promise<InitialProjectsData> {
  const fallback: InitialProjectsData = {
    projects: [],
    totalCount: 0,
    activeCount: 0,
    trashCount: 0,
    totalPages: 1,
  };

  try {
    const fetchPromise = (async () => {
      const db = await getDb();
      const collection = db.collection<ProjectData>("projects");
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

      const filter = { $and: [modeCondition, { isDeleted: { $ne: true } }] };

      const [projects, totalCount, activeCount, trashCount] = await Promise.all([
        collection
          .find(filter, { projection: { photos: 0 } })
          .sort({ _id: -1 })
          .limit(limit)
          .toArray(),
        collection.countDocuments(filter),
        collection.countDocuments({ $and: [modeCondition, { isDeleted: { $ne: true } }] }),
        collection.countDocuments({ $and: [modeCondition, { isDeleted: true }] }),
      ]);

      const sanitized = projects.map((p) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { _id, ...rest } = p as any;
        return rest as ProjectData;
      });

      return {
        projects: sanitized,
        totalCount,
        activeCount,
        trashCount,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
      };
    })();

    // 2-second timeout guard to ensure zero hang time
    const timeoutPromise = new Promise<InitialProjectsData>((resolve) =>
      setTimeout(() => resolve(fallback), 2000)
    );

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (err) {
    console.warn("getInitialProjectsData SSR fallback:", err);
    return fallback;
  }
}

