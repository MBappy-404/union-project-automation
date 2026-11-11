"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ProjectData, INITIAL_PROJECT_DATA, DEMO_PROJECT_DATA, DEMO_PIC_PROJECT_DATA, DEFAULT_PIC_COMMITTEE_MEMBERS } from "@/types/project";
import {
  getSavedProjects,
  getActiveProjectId,
  saveProject,
  deleteProject,
  getSavedPicProjects,
  getActivePicProjectId,
  savePicProject,
} from "@/lib/storage";
import { Navbar } from "@/components/Navbar";
import { SectionProgress } from "@/components/SectionProgress";
import { StructuredFormView } from "@/components/StructuredFormView";
import { PaperTableView } from "@/components/PaperTableView";
import { CoverAndSignboardView } from "@/components/CoverAndSignboardView";
import { TemplatesHub } from "@/components/TemplatesHub";
import { ProjectsListPage } from "@/components/ProjectsListPage";
import { ProjectPhotosView } from "@/components/ProjectPhotosView";
import { ProjectPhoto } from "@/types/project";
import { InitialProjectsData } from "@/lib/serverProjects";
import { fetchProjectsFromServer, saveProjectToServer, deleteProjectFromServer } from "@/lib/api";
import { numberToBanglaWords, calculateBanglaPercentage } from "@/lib/banglaUtils";
import { InitialOptionModal, ImplementationMode } from "@/components/InitialOptionModal";
import { SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";

interface HomeClientProps {
  initialProjectsData?: InitialProjectsData;
  routeMode?: ImplementationMode;
}

export function HomeClient({ initialProjectsData, routeMode }: HomeClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [allProjects, setAllProjects] = useState<ProjectData[]>(
    routeMode !== "pic" && initialProjectsData?.projects && initialProjectsData.projects.length > 0
      ? initialProjectsData.projects
      : [DEMO_PROJECT_DATA]
  );
  const [currentProject, setCurrentProject] = useState<ProjectData>(
    routeMode !== "pic" && initialProjectsData?.projects && initialProjectsData.projects.length > 0
      ? initialProjectsData.projects[0]
      : DEMO_PROJECT_DATA
  );
  // Separate State for PIC System (100% isolated from General Quotation)
  const [allPicProjects, setAllPicProjects] = useState<ProjectData[]>(
    routeMode === "pic" && initialProjectsData?.projects && initialProjectsData.projects.length > 0
      ? initialProjectsData.projects
      : [DEMO_PIC_PROJECT_DATA]
  );
  const [currentPicProject, setCurrentPicProject] = useState<ProjectData>(
    routeMode === "pic" && initialProjectsData?.projects && initialProjectsData.projects.length > 0
      ? initialProjectsData.projects[0]
      : DEMO_PIC_PROJECT_DATA
  );

  const [activeTab, setActiveTab] = useState<"form" | "projects" | "cover-signboard" | "photos" | "templates">("projects");
  const [formViewMode, setFormViewMode] = useState<"structured" | "paper-table">("structured");
  const [activeSection, setActiveSection] = useState<number>(1);
  const [saveStatus, setSaveStatus] = useState<string>("সকল তথ্য সংরক্ষিত");
  const [mounted, setMounted] = useState<boolean>(false);
  const [year, setYear] = useState<string>("২০২৬");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [implementationMode, setImplementationMode] = useState<ImplementationMode>(routeMode || "quotation");
  const [showModeModal, setShowModeModal] = useState<boolean>(false);

  // Active project & list dynamically resolved based on implementationMode
  const activeProject = implementationMode === "pic" ? currentPicProject : currentProject;
  const activeProjectsList = implementationMode === "pic" ? allPicProjects : allProjects;

  // Initialize from localStorage and sync with MongoDB Atlas
  useEffect(() => {
    setMounted(true);
    setYear(String(new Date().getFullYear()));
    const localProjects = getSavedProjects();
    const activeId = getActiveProjectId();
    const localActive = localProjects.find((p) => p.id === activeId) || localProjects[0] || DEMO_PROJECT_DATA;
    setAllProjects(localProjects);
    setCurrentProject(localActive);

    // Load separate PIC projects from localStorage
    const localPicProjects = getSavedPicProjects();
    const activePicId = getActivePicProjectId();
    const localPicActive =
      localPicProjects.find((p) => p.id === activePicId) ||
      localPicProjects[0] ||
      DEMO_PIC_PROJECT_DATA;
    setAllPicProjects(localPicProjects);
    setCurrentPicProject(localPicActive);

    if (routeMode) {
      setImplementationMode(routeMode);
      localStorage.setItem("union_parishad_implementation_mode", routeMode);
      localStorage.setItem("union_parishad_implementation_mode_chosen", "true");
      setShowModeModal(false);
    } else {
      const savedMode = (localStorage.getItem("union_parishad_implementation_mode") as ImplementationMode) || "quotation";
      setImplementationMode(savedMode);
      setShowModeModal(true);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get("tab");
    if (
      tabParam === "photos" ||
      tabParam === "form" ||
      tabParam === "templates" ||
      tabParam === "cover-signboard" ||
      tabParam === "projects"
    ) {
      setActiveTab(tabParam as any);
    }

    // Connect and sync with MongoDB Atlas Server (Quotation Projects)
    fetchProjectsFromServer({ trash: false, limit: 100, mode: "quotation" })
      .then(async (res) => {
        if (res.projects && res.projects.length > 0) {
          const cleanedProjects = res.projects.map((p) => {
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
          setAllProjects(cleanedProjects);
          const found = cleanedProjects.find((p) => p.id === activeId) || cleanedProjects[0];
          if (found) setCurrentProject(found);
          setSaveStatus("সিস্টেম প্রস্তুত ✓");
        } else {
          // Empty DB: do not automatically seed anything
          setSaveStatus("সিস্টেম প্রস্তুত ✓");
        }
      })
      .catch((err) => {
        console.warn("MongoDB Atlas sync notice:", err);
      });

    // Connect and sync with MongoDB Atlas Server (PIC Projects)
    fetchProjectsFromServer({ trash: false, limit: 100, mode: "pic" })
      .then(async (res) => {
        if (res.projects && res.projects.length > 0) {
          setAllPicProjects(res.projects);
          const foundPic = res.projects.find((p) => p.id === activePicId) || res.projects[0];
          if (foundPic) setCurrentPicProject(foundPic);
        }
      })
      .catch((err) => {
        console.warn("MongoDB Atlas PIC sync notice:", err);
      });

    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === "/pic") {
        setImplementationMode("pic");
      } else if (path === "/quotation") {
        setImplementationMode("quotation");
      }
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Implementation mode switcher handler (smoothly updates URL between /quotation and /pic without page remount)
  const handleSelectImplementationMode = (mode: ImplementationMode) => {
    if (mode === implementationMode && !showModeModal) return;
    setImplementationMode(mode);
    if (mode === "pic" && activeSection > 5) {
      setActiveSection(1);
    }
    localStorage.setItem("union_parishad_implementation_mode", mode);
    localStorage.setItem("union_parishad_implementation_mode_chosen", "true");
    setShowModeModal(false);
    setSaveStatus(
      mode === "quotation"
        ? 'পদ্ধতি "সাধারণ কোটেশন (দরপত্র)" সক্রিয় করা হয়েছে'
        : 'পদ্ধতি "পিআইসি (কমিটি বাস্তবায়ন)" সক্রিয় করা হয়েছে'
    );
    const targetRoute = mode === "pic" ? "/pic" : "/quotation";
    if (typeof window !== "undefined" && window.location.pathname !== targetRoute) {
      window.history.pushState(null, "", targetRoute);
    }
  };

  // Helper to apply field updates to a ProjectData object
  const applyFieldUpdate = (prev: ProjectData, field: keyof ProjectData, value: any): ProjectData => {
    const updated: ProjectData = {
      ...prev,
      [field]: value,
    };

    if (field === "presidentName") {
      updated.president = value;
    } else if (field === "president") {
      updated.presidentName = value;
    }

    // Auto-sync President info strictly to the first row (সভাপতি) of Ward & PIC Committee table
    if (
      field === "president" ||
      field === "presidentName" ||
      field === "designation" ||
      field === "committeeDesignation" ||
      field === "village"
    ) {
      const existingMembers =
        updated.wardCommitteeMembers && updated.wardCommitteeMembers.length > 0
          ? [...updated.wardCommitteeMembers]
          : [
              {
                name: "",
                fatherName: "",
                village: "",
                designation: "",
                committeeRole: "সভাপতি",
              },
            ];

      // Row 0 is strictly the president slot. If president is cleared, name is strictly empty "".
      existingMembers[0] = {
        name: updated.president || updated.presidentName || "",
        fatherName: existingMembers[0]?.fatherName || "",
        village: updated.village || "",
        designation: updated.designation || "",
        committeeRole: updated.committeeDesignation || "সভাপতি",
      };

      updated.wardCommitteeMembers = existingMembers;
    } else if (
      field === "wardCommitteeMembers" &&
      Array.isArray(value) &&
      value.length > 0
    ) {
      // Sync back from first row if edited directly in the table
      if (value[0]) {
        updated.president = value[0].name || "";
        updated.presidentName = value[0].name || "";
        if (value[0].designation !== undefined) updated.designation = value[0].designation;
        if (value[0].committeeRole !== undefined) updated.committeeDesignation = value[0].committeeRole;
        if (value[0].village !== undefined) updated.village = value[0].village;
      }
    } else if (field === "workOrderDate") {
      updated.tenderWorkOrderDate = value;
    } else if (field === "tenderWorkOrderDate") {
      updated.workOrderDate = value;
    } else if (field === "contractDate") {
      updated.agreementDate = value;
    } else if (field === "agreementDate") {
      updated.contractDate = value;
    } else if (field === "contractValue") {
      updated.tenderContractPrice = value;
    } else if (field === "tenderContractPrice") {
      updated.contractValue = value;
      updated.contractValueInWords = numberToBanglaWords(value);
    } else if (field === "receiptDate") {
      updated.chequeDate = value;
    } else if (field === "chequeDate") {
      updated.receiptDate = value;
    } else if (field === "bankBranchName") {
      updated.bankName = value;
    } else if (field === "bankName") {
      updated.bankBranchName = value;
    } else if (field === "moneyAmount") {
      updated.netPayment = value;
      updated.netPaymentInWords = numberToBanglaWords(value);
    } else if (field === "meetingDate1") {
      updated.meetingDate = value;
    } else if (field === "meetingDate" && !updated.meetingDate1) {
      updated.meetingDate1 = value;
    } else if (field === "tenderOpeningList" && Array.isArray(value)) {
      if (value[0]) {
        updated.tenderer1 = value[0].name || "";
        updated.tenderer1Price = value[0].quotedPrice || "";
      }
      if (value[1]) {
        updated.tenderer2 = value[1].name || "";
        updated.tenderer2Price = value[1].quotedPrice || "";
      }
      if (value[2]) {
        updated.tenderer3 = value[2].name || "";
        updated.tenderer3Price = value[2].quotedPrice || "";
      }
    }

    // Automatically sync in-words representations
    if (field === "contractValue") {
      updated.contractValueInWords = numberToBanglaWords(value);
    } else if (field === "estimatedValue") {
      updated.estimatedValueInWords = numberToBanglaWords(value);
    } else if (field === "allocationAmount" && !updated.estimatedValue) {
      updated.estimatedValue = value;
      updated.estimatedValueInWords = numberToBanglaWords(value);
    } else if (field === "netPayment") {
      updated.netPaymentInWords = numberToBanglaWords(value);
      updated.moneyAmount = value;
    } else if (field === "billAmount") {
      updated.billAmountInWords = numberToBanglaWords(value);
    }

    // Dynamically sync deduction percentages relative to contractValue
    if (
      field === "contractValue" ||
      field === "tax" ||
      field === "vat" ||
      field === "securityDeposit"
    ) {
      const baseContract = updated.contractValue;
      updated.taxRate = updated.tax && baseContract ? calculateBanglaPercentage(updated.tax, baseContract) : "";
      updated.vatRate = updated.vat && baseContract ? calculateBanglaPercentage(updated.vat, baseContract) : "";
      updated.securityDepositRate =
        updated.securityDeposit && baseContract
          ? calculateBanglaPercentage(updated.securityDeposit, baseContract)
          : "";
    }

    return updated;
  };

  // Field change handler (updates ONLY the active mode's project state)
  const handleFieldChange = (field: keyof ProjectData, value: any) => {
    if (implementationMode === "pic") {
      setCurrentPicProject((prev) => {
        const updated = applyFieldUpdate(prev, field, value);
        const list = savePicProject(updated);
        setAllPicProjects(list);
        setSaveStatus("পিআইসি তথ্য সংরক্ষিত ✓");
        return updated;
      });
    } else {
      setCurrentProject((prev) => {
        const updated = applyFieldUpdate(prev, field, value);
        saveProject(updated);
        setSaveStatus("খসড়া সংরক্ষিত (ডাটাবেজে সেভ করতে আপডেট করুন)");
        return updated;
      });
    }
  };

  // Switch project (supports both Quotation & PIC modes independently)
  const handleSelectProject = async (id: string, projectObj?: ProjectData) => {
    if (implementationMode === "pic") {
      let target = projectObj || allPicProjects.find((p) => p.id === id);
      if (!target) {
        try {
          const res = await fetch(`/api/projects/${id}`);
          const data = await res.json();
          if (data.project) target = data.project;
        } catch (err) {
          console.warn("Failed to fetch PIC project details:", err);
        }
      }
      if (target) {
        setCurrentPicProject(target);
        const list = savePicProject(target);
        setAllPicProjects(list);
        setSaveStatus(`পিআইসি প্রকল্প "${target.projectName || "বেনামী"}" সক্রিয় করা হয়েছে`);
      }
      return;
    }

    let target = projectObj || allProjects.find((p) => p.id === id);
    if (!target) {
      try {
        const res = await fetch(`/api/projects/${id}`);
        const data = await res.json();
        if (data.project) {
          target = data.project;
        }
      } catch (err) {
        console.warn("Failed to fetch project details:", err);
      }
    }

    if (target) {
      setCurrentProject(target);
      setAllProjects((prev) => {
        if (!prev.some((p) => p.id === target!.id)) {
          return [target!, ...prev];
        }
        return prev;
      });
      localStorage.setItem("union_parishad_active_project_id_v2", target.id);
      saveProject(target);
      setSaveStatus(`প্রকল্প "${target.projectName || "বেনামী"}" সক্রিয় করা হয়েছে`);
    }
  };

  // Create new project (draft in state, isolated per mode)
  const handleNewProject = () => {
    const now = new Date().toISOString();
    if (implementationMode === "pic") {
      const newPicProj: ProjectData = {
        ...INITIAL_PROJECT_DATA,
        id: `pic-prj-${Date.now()}`,
        createdAt: now,
        updatedAt: now,
        implementationMode: "pic",
        projectName: "",
        wardCommitteeMembers: DEFAULT_PIC_COMMITTEE_MEMBERS.map((m) => ({ ...m, name: "", village: "", designation: "" })),
      };
      setCurrentPicProject(newPicProj);
      setActiveSection(1);
      setActiveTab("form");
      setSaveStatus("নতুন পিআইসি প্রকল্পের তথ্য পূরণ করুন");
      return;
    }

    const newId = `prj-${Date.now()}`;
    const newProj: ProjectData = {
      ...INITIAL_PROJECT_DATA,
      id: newId,
      createdAt: now,
      updatedAt: now,
      implementationMode: "quotation",
      projectName: "",
      wardCommitteeMembers: [
        {
          name: "",
          fatherName: "",
          village: "",
          designation: "",
          committeeRole: "সভাপতি",
        },
      ],
    };
    setCurrentProject(newProj);
    setActiveSection(1);
    setActiveTab("form");
    setSaveStatus("নতুন প্রকল্পের তথ্য পূরণ করুন");
  };

  // Copy existing project (creates isolated duplicate with auto-expiring 1h "কপি" badge)
  const handleCopyProject = async (sourceProject: ProjectData): Promise<ProjectData> => {
    const now = new Date().toISOString();
    const isPic = implementationMode === "pic";
    const newId = isPic ? `pic-prj-${Date.now()}` : `prj-${Date.now()}`;

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
      photos: [], // Fresh photos array for duplicated project
    };

    if (isPic) {
      const updatedList = savePicProject(copiedProject);
      setAllPicProjects(updatedList);
      setCurrentPicProject(copiedProject);
    } else {
      const updatedList = saveProject(copiedProject);
      setAllProjects(updatedList);
      setCurrentProject(copiedProject);
      localStorage.setItem("union_parishad_active_project_id_v2", copiedProject.id);
    }

    setSaveStatus(`প্রকল্প "${sourceProject.projectName || "বেনামী"}" সফলভাবে কপি করা হয়েছে`);

    try {
      await saveProjectToServer(copiedProject);
      const res = await fetchProjectsFromServer({ trash: false, limit: 100, mode: implementationMode });
      if (res.projects && res.projects.length > 0) {
        if (isPic) {
          setAllPicProjects(res.projects);
        } else {
          setAllProjects(res.projects);
        }
      }
    } catch (err) {
      console.warn("Failed to sync copied project to cloud:", err);
    }

    return copiedProject;
  };

  // Explicit submit project and navigate directly to templates
  const handleSubmitAndGoToTemplates = async () => {
    const rawTarget = implementationMode === "pic" ? currentPicProject : currentProject;
    const targetProj: ProjectData = {
      ...rawTarget,
      implementationMode,
    };
    if (!targetProj.projectName || targetProj.projectName.trim() === "") {
      toast.error("অনুগ্রহ করে প্রকল্পের নাম পূরণ করুন।");
      return;
    }

    setIsSubmitting(true);
    setSaveStatus("সংরক্ষণ করা হচ্ছে...");

    try {
      const res = await saveProjectToServer(targetProj);
      const savedProject: ProjectData = { ...(res.project || targetProj), implementationMode };

      if (implementationMode === "pic") {
        const updatedPicList = savePicProject(savedProject);
        setAllPicProjects(updatedPicList);
        setCurrentPicProject(savedProject);

        const freshPic = await fetchProjectsFromServer({ trash: false, limit: 100, mode: "pic" });
        if (freshPic.projects && freshPic.projects.length > 0) {
          setAllPicProjects(freshPic.projects);
        }
      } else {
        const updatedList = saveProject(savedProject);
        setAllProjects(updatedList);
        setCurrentProject(savedProject);

        const fresh = await fetchProjectsFromServer({ trash: false, limit: 100, mode: "quotation" });
        if (fresh.projects) {
          setAllProjects(fresh.projects);
        }
      }

      setSaveStatus("প্রকল্প ডাটাবেজে সফলভাবে আপডেট ও সংরক্ষিত হয়েছে ✓");
      toast.success("প্রকল্পের তথ্য সফলভাবে ডাটাবেজে আপডেট ও সংরক্ষিত হয়েছে ✓");
      setActiveTab("templates");
    } catch (err: any) {
      console.error("Submit error:", err);
      setSaveStatus("সংরক্ষণে সমস্যা হয়েছে!");
      toast.error(`সংরক্ষণে সমস্যা হয়েছে: ${err?.message || "সার্ভারে সমস্যা"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Load demo data
  const handleLoadDemo = async () => {
    const clonedDemo: ProjectData = {
      ...DEMO_PROJECT_DATA,
      id: currentProject.id || `prj-${Date.now()}`,
      updatedAt: new Date().toISOString(),
    };
    const updatedList = saveProject(clonedDemo);
    setAllProjects(updatedList);
    setCurrentProject(clonedDemo);
    setSaveStatus("নমুনা প্রকল্পের সকল তথ্য লোড করা হয়েছে");

    try {
      await saveProjectToServer(clonedDemo);
      const res = await fetchProjectsFromServer({ trash: false });
      if (res.projects) setAllProjects(res.projects);
    } catch (e) {
      console.warn("Demo project cloud save notice:", e);
    }
  };

  // Export JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeProject, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `project_${activeProject.projectCode || "master"}_${Date.now()}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success("প্রকল্পের ব্যাকআপ ফাইল ডাউনলোড হয়েছে ✓");
  };

  // Import JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (typeof imported === "object" && imported !== null) {
          const newProject: ProjectData = {
            ...INITIAL_PROJECT_DATA,
            ...imported,
            id: implementationMode === "pic" ? `pic-prj-${Date.now()}` : `prj-${Date.now()}`,
            updatedAt: new Date().toISOString(),
          };
          if (implementationMode === "pic") {
            const updatedPicList = savePicProject(newProject);
            setAllPicProjects(updatedPicList);
            setCurrentPicProject(newProject);
            setSaveStatus("ফাইল থেকে পিআইসি প্রকল্প সফলভাবে ইমপোর্ট হয়েছে");
            toast.success("ফাইল থেকে পিআইসি প্রকল্প সফলভাবে ইমপোর্ট হয়েছে ✓");
            return;
          }
          const updatedList = saveProject(newProject);
          setAllProjects(updatedList);
          setCurrentProject(newProject);
          setSaveStatus("ফাইল থেকে প্রকল্প সফলভাবে ইমপোর্ট হয়েছে");
          toast.success("ফাইল থেকে প্রকল্প সফলভাবে ইমপোর্ট হয়েছে ✓");

          try {
            await saveProjectToServer(newProject);
            const res = await fetchProjectsFromServer({ trash: false });
            if (res.projects) setAllProjects(res.projects);
          } catch (err) {
            console.warn("Import project cloud save notice:", err);
          }
        }
      } catch {
        toast.error("ভুল JSON ফাইল! অনুগ্রহ করে সঠিক ফরম্যাটের ফাইল নির্বাচন করুন।");
      }
    };
    reader.readAsText(file);
  };

  // Delete current project
  const handleDeleteCurrentProject = async () => {
    if (!activeProject?.id) return;
    const confirmDelete = window.confirm(
      `আপনি কি নিশ্চিত যে "${activeProject.projectName || "প্রকল্পটি"}" ট্র্যাশে পাঠাতে চান?`
    );
    if (!confirmDelete) return;

    try {
      const { remaining, newActiveId } = deleteProject(activeProject.id);
      setAllProjects(remaining);
      const nextActive =
        remaining.find((p) => p.id === newActiveId) || remaining[0] || DEMO_PROJECT_DATA;
      setCurrentProject(nextActive);
      setSaveStatus("প্রকল্প ট্র্যাশে পাঠানো হয়েছে");
      await deleteProjectFromServer(activeProject.id, false);
      const res = await fetchProjectsFromServer({ trash: false });
      if (res.projects) setAllProjects(res.projects);
    } catch (e) {
      console.warn("Delete project notice:", e);
    }
  };

  // Save supplementary Cover & Signboard fields to MongoDB Atlas while staying on the tab
  const handleSaveCoverFieldsToDb = async () => {
    const targetProj: ProjectData = { ...activeProject, implementationMode };
    if (!targetProj.projectName || targetProj.projectName.trim() === "") {
      toast.error("সংরক্ষণ করার আগে প্রকল্পের নাম পূরণ করুন।");
      return;
    }

    setIsSubmitting(true);
    setSaveStatus("সংরক্ষণ করা হচ্ছে...");

    try {
      const res = await saveProjectToServer(targetProj);
      const savedProject: ProjectData = { ...(res.project || targetProj), implementationMode };

      if (implementationMode === "pic") {
        const updatedPicList = savePicProject(savedProject);
        setAllPicProjects(updatedPicList);
        setCurrentPicProject(savedProject);

        const freshPic = await fetchProjectsFromServer({ trash: false, limit: 100, mode: "pic" });
        if (freshPic.projects && freshPic.projects.length > 0) {
          setAllPicProjects(freshPic.projects);
        }
      } else {
        const updatedList = saveProject(savedProject);
        setAllProjects(updatedList);
        setCurrentProject(savedProject);

        const fresh = await fetchProjectsFromServer({ trash: false, limit: 100, mode: "quotation" });
        if (fresh.projects) {
          setAllProjects(fresh.projects);
        }
      }

      setSaveStatus("কভার ও সাইনবোর্ডের তথ্য সফলভাবে সংরক্ষিত হয়েছে ✓");
      toast.success("কভার ও সাইনবোর্ডের তথ্য সফলভাবে সংরক্ষিত হয়েছে ✓");
    } catch (err: any) {
      console.error("Save cover fields error:", err);
      setSaveStatus("সংরক্ষণে সমস্যা হয়েছে!");
      toast.error(`সংরক্ষণে সমস্যা হয়েছে: ${err?.message || "সার্ভারে সমস্যা"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePhotosUpdated = (photos: ProjectPhoto[]) => {
    if (implementationMode === "pic") {
      setCurrentPicProject((prev) => {
        const updated: ProjectData = { ...prev, photos };
        const list = savePicProject(updated);
        setAllPicProjects(list);
        return updated;
      });
    } else {
      setCurrentProject((prev) => {
        const updated: ProjectData = { ...prev, photos };
        saveProject(updated);
        return updated;
      });
    }
  };

  const handlePrint = () => {
    if (activeTab !== "templates" && activeTab !== "cover-signboard" && activeTab !== "photos") {
      setActiveTab("templates");
      setTimeout(() => {
        window.print();
      }, 200);
    } else {
      window.print();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 via-blue-50/20 to-slate-100/60 text-slate-900 print:bg-white print:p-0 print:m-0 print:min-h-0 print:block">
      {/* Two-tier Navbar: Top Header + Sub-Menu Navigation Bar */}
      <Navbar
        currentProject={activeProject}
        allProjects={activeProjectsList}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        formViewMode={formViewMode}
        setFormViewMode={setFormViewMode}
        onNewProject={handleNewProject}
        onSelectProject={handleSelectProject}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onPrint={handlePrint}
        saveStatus={saveStatus}
      />

      {/* Main Container - Spacious layout */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-5 space-y-5 print:p-0 print:m-0 print:max-w-none print:w-full print:space-y-0 print:block">
        {/* Implementation Mode Switcher Bar (Pure Light Mode, Button Tabs) */}
        <div className="no-print bg-white border border-slate-200/90 rounded-2xl px-4 py-2.5 sm:px-5 sm:py-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm font-normal">
            <span
              className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                implementationMode === "quotation" ? "bg-blue-600" : "bg-emerald-600"
              }`}
            />
            <span className="text-slate-500">বাস্তবায়ন পদ্ধতি:</span>
            {implementationMode === "quotation" ? (
              <span className="text-blue-700 font-normal">
                সাধারণ কোটেশন <span className="text-slate-400 text-xs font-normal">(উন্মুক্ত দরপত্র ও চুক্তিপত্র)</span>
              </span>
            ) : (
              <span className="text-emerald-700 font-normal">
                পিআইসি (PIC) <span className="text-slate-400 text-xs font-normal">(কমিটি সরাসরি বাস্তবায়ন)</span>
              </span>
            )}
          </div>

          {/* Segmented Button Tabs */}
          <div className="flex items-center gap-2">
            <div
              role="tablist"
              aria-label="বাস্তবায়ন পদ্ধতি নির্বাচন ট্যাব"
              className="inline-flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200/90"
            >
              <button
                type="button"
                role="tab"
                aria-selected={implementationMode === "quotation"}
                onClick={() => handleSelectImplementationMode("quotation")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal cursor-pointer transition-colors ${
                  implementationMode === "quotation"
                    ? "bg-blue-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                }`}
              >
                সাধারণ কোটেশন
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={implementationMode === "pic"}
                onClick={() => handleSelectImplementationMode("pic")}
                className={`px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-normal cursor-pointer transition-colors ${
                  implementationMode === "pic"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/70"
                }`}
              >
                পিআইসি (PIC)
              </button>
            </div>

            {/* Quick Details Opener */}
            <button
              type="button"
              onClick={() => setShowModeModal(true)}
              title="পদ্ধতি বিস্তারিত দেখতে ক্লিক করুন"
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl border border-slate-200/80 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab 1: MASTER FORM FILLING */}
        {activeTab === "form" && (
          <div className="space-y-6 animate-fade-in-slide">
            {/* Progress Bar & Section Switcher */}
            <SectionProgress
              data={activeProject}
              activeSection={activeSection}
              setActiveSection={setActiveSection}
              implementationMode={implementationMode}
            />

            {/* View Mode: Structured Cards vs. Exact Paper Replica Table */}
            {formViewMode === "structured" ? (
              <StructuredFormView
                data={activeProject}
                onChange={handleFieldChange}
                activeSection={activeSection}
                setActiveSection={setActiveSection}
                onSubmitAndGoToTemplates={handleSubmitAndGoToTemplates}
                isSubmitting={isSubmitting}
                implementationMode={implementationMode}
              />
            ) : (
              <PaperTableView
                data={activeProject}
                onChange={handleFieldChange}
                activeSection={activeSection}
                onSubmitAndGoToTemplates={handleSubmitAndGoToTemplates}
                isSubmitting={isSubmitting}
                implementationMode={implementationMode}
              />
            )}
          </div>
        )}

        {/* Tab 2: PROJECTS DATABASE & REGISTER PAGE (Dedicated Page, 10 items, pagination, simple & readable) */}
        {activeTab === "projects" && (
          <ProjectsListPage
            currentProjectId={activeProject.id}
            initialData={initialProjectsData}
            cachedProjects={activeProjectsList}
            implementationMode={implementationMode}
            onSelectProjectForEdit={(selected) => {
              if (implementationMode === "pic") {
                setCurrentPicProject(selected);
                const list = savePicProject(selected);
                setAllPicProjects(list);
              } else {
                setCurrentProject(selected);
                localStorage.setItem("union_parishad_active_project_id_v2", selected.id);
              }
              setActiveTab("form");
              setSaveStatus(`প্রকল্প "${selected.projectName}" সফলভাবে এডিট করার জন্য খোলা হয়েছে`);
              toast.info(`প্রকল্প "${selected.projectName || "বেনামী"}" এডিট মোডে খোলা হয়েছে`);
            }}
            onSelectProjectForPhotos={(selected) => {
              if (implementationMode === "pic") {
                setCurrentPicProject(selected);
                const list = savePicProject(selected);
                setAllPicProjects(list);
              } else {
                setCurrentProject(selected);
                localStorage.setItem("union_parishad_active_project_id_v2", selected.id);
              }
              setActiveTab("photos");
              setSaveStatus(`প্রকল্প "${selected.projectName}"-এর ছবি খোলা হয়েছে`);
              toast.info(`প্রকল্পের স্থিরচিত্র খোলা হয়েছে`);
            }}
            onSelectProjectForTemplates={(selected) => {
              if (implementationMode === "pic") {
                setCurrentPicProject(selected);
                const list = savePicProject(selected);
                setAllPicProjects(list);
              } else {
                setCurrentProject(selected);
                localStorage.setItem("union_parishad_active_project_id_v2", selected.id);
              }
              setActiveTab("templates");
              setSaveStatus(`প্রকল্প "${selected.projectName}" প্রিন্ট টেমপ্লেটে খোলা হয়েছে`);
              toast.info(`প্রকল্পের প্রিন্ট টেমপ্লেট খোলা হয়েছে`);
            }}
            onCopyProject={handleCopyProject}
            onNewProject={() => {
              handleNewProject();
              setActiveTab("form");
            }}
            onProjectListUpdated={async () => {
              if (implementationMode === "pic") {
                const resPic = await fetchProjectsFromServer({ trash: false, limit: 100, mode: "pic" });
                if (resPic.projects) {
                  setAllPicProjects(resPic.projects);
                  if (!resPic.projects.some((p) => p.id === currentPicProject.id) && resPic.projects.length > 0) {
                    setCurrentPicProject(resPic.projects[0]);
                  }
                }
                return;
              }
              const res = await fetchProjectsFromServer({ trash: false, limit: 100, mode: "quotation" });
              if (res.projects) {
                setAllProjects(res.projects);
                if (!res.projects.some((p) => p.id === currentProject.id) && res.projects.length > 0) {
                  setCurrentProject(res.projects[0]);
                  localStorage.setItem("union_parishad_active_project_id_v2", res.projects[0].id);
                }
              }
            }}
          />
        )}

        {/* Tab 3: COVER & SIGNBOARD (Auto-filled + Quick Fill Missing Fields + Print) */}
        {activeTab === "cover-signboard" && (
          <div className="animate-fade-in-slide">
            <CoverAndSignboardView
              data={activeProject}
              allProjects={activeProjectsList}
              onChange={handleFieldChange}
              onSelectProject={handleSelectProject}
              onSaveToDatabase={handleSaveCoverFieldsToDb}
              isSaving={isSubmitting}
              implementationMode={implementationMode}
            />
          </div>
        )}

                {/* Tab: PROJECT PHOTOS (Upload, Optimization & Preview) */}
        {activeTab === "photos" && (
          <div className="animate-fade-in-slide">
            <ProjectPhotosView
              data={activeProject}
              allProjects={activeProjectsList}
              onSelectProject={handleSelectProject}
              onPhotosUpdated={handlePhotosUpdated}
            />
          </div>
        )}

{/* Tab 4: TEMPLATES HUB & INSTANT PRINT */}
        {activeTab === "templates" && (
          <div>
            <TemplatesHub
              data={activeProject}
              allProjects={activeProjectsList}
              onSelectProject={handleSelectProject}
              onPrint={handlePrint}
              implementationMode={implementationMode}
            />
          </div>
        )}
      </main>

      {/* Initial Option Modal: General Quotation vs PIC */}
      <InitialOptionModal
        isOpen={showModeModal}
        activeMode={implementationMode}
        onSelectMode={handleSelectImplementationMode}
        onClose={() => setShowModeModal(false)}
        canDismiss={true}
      />

      {/* Clean Minimal Footer */}
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
}
