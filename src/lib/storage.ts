import { ProjectData, INITIAL_PROJECT_DATA, DEMO_PROJECT_DATA, DEMO_PIC_PROJECT_DATA, DEFAULT_PIC_COMMITTEE_MEMBERS } from "@/types/project";

const STORAGE_KEY_PROJECTS = "union_parishad_projects_v2";
const STORAGE_KEY_ACTIVE_ID = "union_parishad_active_project_id_v2";

const STORAGE_KEY_PIC_PROJECTS = "union_parishad_pic_projects_v1";
const STORAGE_KEY_ACTIVE_PIC_ID = "union_parishad_active_pic_project_id_v1";

export function getSavedProjects(): ProjectData[] {
  if (typeof window === "undefined") return [DEMO_PROJECT_DATA];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROJECTS);
    if (!raw) {
      // Seed with demo project
      const initial = [DEMO_PROJECT_DATA];
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const list: ProjectData[] = Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEMO_PROJECT_DATA];
    return list.map((p) => {
      if (
        p.wardCommitteeMembers &&
        p.wardCommitteeMembers.length === 7 &&
        p.wardCommitteeMembers[0]?.name === "মোঃ কামরুজ্জামান"
      ) {
        return {
          ...p,
          wardCommitteeMembers: [
            {
              name: "",
              fatherName: "",
              village: "",
              designation: "",
              committeeRole: "",
            },
          ],
        };
      }
      return p;
    });
  } catch (e) {
    console.error("Failed to load projects from localStorage", e);
    return [DEMO_PROJECT_DATA];
  }
}

export function getActiveProjectId(): string {
  if (typeof window === "undefined") return DEMO_PROJECT_DATA.id;
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_ID);
    if (activeId) return activeId;
    const projects = getSavedProjects();
    const fallbackId = projects[0]?.id || DEMO_PROJECT_DATA.id;
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, fallbackId);
    return fallbackId;
  } catch {
    return DEMO_PROJECT_DATA.id;
  }
}

export function saveProject(project: ProjectData): ProjectData[] {
  if (typeof window === "undefined") return [];
  try {
    const projects = getSavedProjects();
    const now = new Date().toISOString();
    const updatedProject = {
      ...project,
      updatedAt: now,
      id: project.id || `prj-${Date.now()}`,
    };

    const existingIndex = projects.findIndex((p) => p.id === updatedProject.id);
    let newProjectsList: ProjectData[];
    if (existingIndex >= 0) {
      newProjectsList = [...projects];
      newProjectsList[existingIndex] = {
        ...updatedProject,
        createdAt: projects[existingIndex].createdAt || updatedProject.createdAt || now,
      };
    } else {
      newProjectsList = [
        {
          ...updatedProject,
          createdAt: updatedProject.createdAt || now,
        },
        ...projects,
      ];
    }

    try {
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(newProjectsList));
    } catch (quotaError) {
      console.warn("LocalStorage quota exceeded, saving projects without heavy photos cache:", quotaError);
      const lightweightList = newProjectsList.map((p) => ({
        ...p,
        photos: (p.photos || []).map((ph) => ({
          ...ph,
          url: ph.url.length > 200 ? "" : ph.url, // omit long base64 from localStorage
        })),
      }));
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(lightweightList));
    }
    localStorage.setItem(STORAGE_KEY_ACTIVE_ID, updatedProject.id);
    return newProjectsList;
  } catch (e) {
    console.error("Failed to save project", e);
    return [];
  }
}

export function createNewProject(baseData?: Partial<ProjectData>): ProjectData {
  const newId = `prj-${Date.now()}`;
  const now = new Date().toISOString();
  const newProj: ProjectData = {
    ...INITIAL_PROJECT_DATA,
    ...baseData,
    id: newId,
    createdAt: now,
    updatedAt: now,
    projectName: baseData?.projectName || "নতুন ইউনিয়ন পরিষদ প্রকল্প",
  };
  saveProject(newProj);
  return newProj;
}

export function deleteProject(id: string): { remaining: ProjectData[]; newActiveId: string } {
  const projects = getSavedProjects().filter((p) => p.id !== id);
  const finalProjects = projects.length > 0 ? projects : [createNewProject()];
  localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(finalProjects));
  const newActiveId = finalProjects[0].id;
  localStorage.setItem(STORAGE_KEY_ACTIVE_ID, newActiveId);
  return { remaining: finalProjects, newActiveId };
}

// =========================================================================
// PIC (Project Implementation Committee) Separate Storage Helpers
// =========================================================================

export function getSavedPicProjects(): ProjectData[] {
  if (typeof window === "undefined") return [DEMO_PIC_PROJECT_DATA];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PIC_PROJECTS);
    if (!raw) {
      const initial = [DEMO_PIC_PROJECT_DATA];
      localStorage.setItem(STORAGE_KEY_PIC_PROJECTS, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    const list: ProjectData[] =
      Array.isArray(parsed) && parsed.length > 0 ? parsed : [DEMO_PIC_PROJECT_DATA];
    return list.map((p) => ({
      ...p,
      wardCommitteeMembers:
        p.wardCommitteeMembers && p.wardCommitteeMembers.length > 0
          ? p.wardCommitteeMembers
          : DEFAULT_PIC_COMMITTEE_MEMBERS,
    }));
  } catch (e) {
    console.error("Failed to load PIC projects from localStorage", e);
    return [DEMO_PIC_PROJECT_DATA];
  }
}

export function getActivePicProjectId(): string {
  if (typeof window === "undefined") return DEMO_PIC_PROJECT_DATA.id;
  try {
    const activeId = localStorage.getItem(STORAGE_KEY_ACTIVE_PIC_ID);
    if (activeId) return activeId;
    const projects = getSavedPicProjects();
    const fallbackId = projects[0]?.id || DEMO_PIC_PROJECT_DATA.id;
    localStorage.setItem(STORAGE_KEY_ACTIVE_PIC_ID, fallbackId);
    return fallbackId;
  } catch {
    return DEMO_PIC_PROJECT_DATA.id;
  }
}

export function savePicProject(project: ProjectData): ProjectData[] {
  if (typeof window === "undefined") return [];
  try {
    const projects = getSavedPicProjects();
    const now = new Date().toISOString();
    const updatedProject = {
      ...project,
      updatedAt: now,
      id: project.id || `pic-prj-${Date.now()}`,
    };

    const existingIndex = projects.findIndex((p) => p.id === updatedProject.id);
    let newProjectsList: ProjectData[];
    if (existingIndex >= 0) {
      newProjectsList = [...projects];
      newProjectsList[existingIndex] = {
        ...updatedProject,
        createdAt: projects[existingIndex].createdAt || updatedProject.createdAt || now,
      };
    } else {
      newProjectsList = [
        {
          ...updatedProject,
          createdAt: updatedProject.createdAt || now,
        },
        ...projects,
      ];
    }

    try {
      localStorage.setItem(STORAGE_KEY_PIC_PROJECTS, JSON.stringify(newProjectsList));
    } catch (quotaError) {
      console.warn("LocalStorage quota exceeded for PIC projects:", quotaError);
      const lightweightList = newProjectsList.map((p) => ({
        ...p,
        photos: (p.photos || []).map((ph) => ({
          ...ph,
          url: ph.url.length > 200 ? "" : ph.url,
        })),
      }));
      localStorage.setItem(STORAGE_KEY_PIC_PROJECTS, JSON.stringify(lightweightList));
    }
    localStorage.setItem(STORAGE_KEY_ACTIVE_PIC_ID, updatedProject.id);
    return newProjectsList;
  } catch (e) {
    console.error("Failed to save PIC project", e);
    return [];
  }
}

export function deletePicProject(id: string): { remaining: ProjectData[]; newActiveId: string } {
  const projects = getSavedPicProjects().filter((p) => p.id !== id);
  const finalProjects = projects.length > 0 ? projects : [DEMO_PIC_PROJECT_DATA];
  localStorage.setItem(STORAGE_KEY_PIC_PROJECTS, JSON.stringify(finalProjects));
  const newActiveId = finalProjects[0].id;
  localStorage.setItem(STORAGE_KEY_ACTIVE_PIC_ID, newActiveId);
  return { remaining: finalProjects, newActiveId };
}
