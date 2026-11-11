import { ProjectData, ProjectPhoto, PhotoStage } from "@/types/project";
import {
  saveProject as saveToLocalStorage,
  getSavedProjects as getLocalProjects,
  getSavedPicProjects,
} from "./storage";

export interface FetchProjectsParams {
  search?: string;
  trash?: boolean;
  fiscalYear?: string;
  page?: number;
  limit?: number;
  mode?: "quotation" | "pic";
}

export interface FetchProjectsResponse {
  success: boolean;
  projects: ProjectData[];
  isTrash: boolean;
  count: number;
  page?: number;
  limit?: number;
  totalCount?: number;
  totalPages?: number;
  activeCount?: number;
  trashCount?: number;
  fromFallback?: boolean;
}

export async function fetchProjectsFromServer(params: FetchProjectsParams = {}): Promise<FetchProjectsResponse> {
  try {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set("search", params.search);
    if (params.trash) searchParams.set("trash", "true");
    if (params.fiscalYear && params.fiscalYear !== "সকল") {
      searchParams.set("fiscalYear", params.fiscalYear);
    }
    if (params.page) searchParams.set("page", String(params.page));
    if (params.limit) searchParams.set("limit", String(params.limit));
    if (params.mode) searchParams.set("mode", params.mode);

    const res = await fetch(`/api/projects?${searchParams.toString()}`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    console.warn("Failed to fetch from server, falling back to local storage:", err);
    const local = params.mode === "pic" ? getSavedPicProjects() : getLocalProjects();
    const isTrash = Boolean(params.trash);
    let filtered = local.filter((p) => (isTrash ? p.isDeleted : !p.isDeleted));

    if (params.search) {
      const q = params.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.projectName?.toLowerCase().includes(q) ||
          p.projectCode?.toLowerCase().includes(q) ||
          p.contractorName?.toLowerCase().includes(q) ||
          p.wardNo?.toLowerCase().includes(q)
      );
    }

    const totalCount = filtered.length;
    const page = params.page || 1;
    const limit = params.limit || 10;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));
    const start = (page - 1) * limit;
    const paged = filtered.slice(start, start + limit);

    const activeCount = local.filter((p) => !p.isDeleted).length;
    const trashCount = local.filter((p) => p.isDeleted).length;

    return {
      success: true,
      projects: paged,
      isTrash,
      count: paged.length,
      page,
      limit,
      totalCount,
      totalPages,
      activeCount,
      trashCount,
      fromFallback: true,
    };
  }
}

export async function saveProjectToServer(project: ProjectData): Promise<{
  success: boolean;
  project: ProjectData;
  fromFallback?: boolean;
}> {
  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(project),
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    const data = await res.json();
    // Also backup in local storage
    saveToLocalStorage(data.project);
    return data;
  } catch (err) {
    console.warn("Failed to save to server, saving locally:", err);
    saveToLocalStorage(project);
    return {
      success: true,
      project,
      fromFallback: true,
    };
  }
}

export async function deleteProjectFromServer(
  id: string,
  permanent: boolean = false
): Promise<{ success: boolean; permanent: boolean; message: string }> {
  try {
    const res = await fetch(`/api/projects/${id}?permanent=${permanent ? "true" : "false"}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error("Delete failed:", err);
    return {
      success: false,
      permanent,
      message: err.message || "ডিলিট করতে সমস্যা হয়েছে",
    };
  }
}

export async function restoreProjectOnServer(id: string): Promise<{
  success: boolean;
  project?: ProjectData;
  message: string;
}> {
  try {
    const res = await fetch(`/api/projects/${id}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      throw new Error(`Server returned ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    console.error("Restore failed:", err);
    return {
      success: false,
      message: err.message || "রিস্টোর করতে সমস্যা হয়েছে",
    };
  }
}

// ─────────────────────────────────────────────
// Project Photos API Handlers
// ─────────────────────────────────────────────

export async function fetchPhotosFromServer(projectId: string): Promise<ProjectPhoto[]> {
  try {
    const res = await fetch(`/api/photos?projectId=${encodeURIComponent(projectId)}`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.success && Array.isArray(data.photos) ? data.photos : [];
  } catch (err) {
    console.warn("fetchPhotosFromServer error, returning empty list:", err);
    return [];
  }
}

export async function savePhotoToServer(
  projectId: string,
  photo: ProjectPhoto
): Promise<{ success: boolean; photo?: ProjectPhoto }> {
  try {
    const res = await fetch("/api/photos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, photo }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err: any) {
    console.error("savePhotoToServer error:", err);
    return { success: false };
  }
}

export async function deletePhotoFromServer(
  projectId: string,
  photoId: string,
  publicId?: string
): Promise<{ success: boolean; deletedFromCloudinary?: boolean }> {
  try {
    let url = `/api/photos?projectId=${encodeURIComponent(projectId)}&photoId=${encodeURIComponent(photoId)}`;
    if (publicId) {
      url += `&publicId=${encodeURIComponent(publicId)}`;
    }
    const res = await fetch(url, { method: "DELETE" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("deletePhotoFromServer error:", err);
    return { success: false };
  }
}

export async function updatePhotoOnServer(
  projectId: string,
  photoId: string,
  updates: { caption?: string; stage?: PhotoStage }
): Promise<{ success: boolean }> {
  try {
    const res = await fetch("/api/photos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId, photoId, ...updates }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    console.error("updatePhotoOnServer error:", err);
    return { success: false };
  }
}

