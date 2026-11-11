"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ProjectData, DEMO_PROJECT_DATA } from "@/types/project";
import { getSavedProjects, saveProject } from "@/lib/storage";
import { Navbar } from "@/components/Navbar";
import { ProjectsListPage } from "@/components/ProjectsListPage";
import { fetchProjectsFromServer, saveProjectToServer } from "@/lib/api";
import { InitialProjectsData } from "@/lib/serverProjects";
import { toast } from "sonner";

interface ProjectsPageClientProps {
  initialData?: InitialProjectsData;
}

export const ProjectsPageClient: React.FC<ProjectsPageClientProps> = ({ initialData }) => {
  const router = useRouter();
  const [allProjects, setAllProjects] = useState<ProjectData[]>(
    initialData?.projects && initialData.projects.length > 0
      ? initialData.projects
      : [DEMO_PROJECT_DATA]
  );
  const [currentProject, setCurrentProject] = useState<ProjectData>(
    initialData?.projects && initialData.projects.length > 0
      ? initialData.projects[0]
      : DEMO_PROJECT_DATA
  );
  const [mounted, setMounted] = useState<boolean>(false);
  const [year, setYear] = useState<string>("২০২৬");

  useEffect(() => {
    setMounted(true);
    setYear(String(new Date().getFullYear()));
    const local = getSavedProjects();
    if (local.length > 0) {
      setAllProjects(local);
      setCurrentProject(local[0]);
    }

    fetchProjectsFromServer({ trash: false, limit: 100 })
      .then((res) => {
        if (res.projects && res.projects.length > 0) {
          setAllProjects(res.projects);
          setCurrentProject(res.projects[0]);
        }
      })
      .catch((err) => console.warn("Projects page fetch notice:", err));
  }, []);

  const handleSelectForEdit = (project: ProjectData) => {
    localStorage.setItem("union_parishad_active_project_id_v2", project.id);
    saveProject(project);
    toast.info(`প্রকল্প "${project.projectName || "বেনামী"}" এডিট মোডে খোলা হয়েছে`);
    router.push("/");
  };

  const handleNewProject = async () => {
    router.push("/");
  };

  const handleCopyProject = async (sourceProject: ProjectData): Promise<ProjectData> => {
    const now = new Date().toISOString();
    const newId = `prj-${Date.now()}`;
    const copiedProject: ProjectData = {
      ...sourceProject,
      id: newId,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
      deletedAt: null,
      copiedFrom: sourceProject.id,
      copiedAt: now,
      originalProjectName: sourceProject.projectName,
      photos: [],
    };
    const updated = saveProject(copiedProject);
    setAllProjects(updated);
    setCurrentProject(copiedProject);
    localStorage.setItem("union_parishad_active_project_id_v2", copiedProject.id);
    try {
      await saveProjectToServer(copiedProject);
      const res = await fetchProjectsFromServer({ trash: false, limit: 100 });
      if (res.projects) setAllProjects(res.projects);
      toast.success(`প্রকল্প "${sourceProject.projectName || "বেনামী"}" সফলভাবে কপি করা হয়েছে!`);
    } catch (e) {
      console.warn("Failed to save copy:", e);
      toast.error("কপি সংরক্ষণে সমস্যা হয়েছে");
    }
    return copiedProject;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100/60 text-slate-900 transition-colors">
      <Navbar
        currentProject={currentProject}
        allProjects={allProjects}
        activeTab="projects"
        setActiveTab={(tab) => {
          if (tab === "photos") {
            router.push("/?tab=photos");
          } else if (tab === "form" || tab === "cover-signboard" || tab === "templates") {
            router.push("/");
          }
        }}
        formViewMode="structured"
        setFormViewMode={() => {}}
        onNewProject={handleNewProject}
        onSelectProject={(id) => {
          const found = allProjects.find((p) => p.id === id);
          if (found) handleSelectForEdit(found);
        }}
        onExportJSON={() => {}}
        onImportJSON={() => {}}
        onPrint={() => window.print()}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 space-y-6">
        <ProjectsListPage
          currentProjectId={currentProject.id}
          onSelectProjectForEdit={handleSelectForEdit}
          onSelectProjectForPhotos={(project) => {
            localStorage.setItem("union_parishad_active_project_id_v2", project.id);
            saveProject(project);
            router.push("/?tab=photos");
          }}
          onNewProject={handleNewProject}
          onCopyProject={handleCopyProject}
          onProjectListUpdated={async () => {
            const res = await fetchProjectsFromServer({ trash: false, limit: 100 });
            if (res.projects) setAllProjects(res.projects);
          }}
          initialData={initialData}
        />
      </main>

      <footer className="w-full border-t border-slate-200/80 bg-white/70 backdrop-blur-md py-4 text-center text-xs text-slate-500 no-print transition-colors mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© {year} ইউনিয়ন পরিষদ উন্নয়ন প্রকল্প ম্যানেজমেন্ট ও অটোমেশন সিস্টেম</p>
          <p className="flex items-center gap-1 text-slate-600 font-normal">
            <span>Developed by</span>
            <a
              href="https://dev-bappy.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors"
            >
              Bappy
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};
