"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { ProjectData, isProjectCopyActive, getCopyRemainingMinutes } from "@/types/project";
import { InitialProjectsData } from "@/lib/serverProjects";
import {
  fetchProjectsFromServer,
  deleteProjectFromServer,
  restoreProjectOnServer,
} from "@/lib/api";
import { toBanglaDigits, formatBanglaCurrency } from "@/lib/banglaUtils";
import { toast } from "sonner";
import {
  Search,
  Trash2,
  RotateCcw,
  Pencil,
  RefreshCw,
  FolderOpen,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  X,
  FileCheck2,
  Camera,
  Copy,
} from "lucide-react";

interface ProjectsListPageProps {
  currentProjectId: string;
  onSelectProjectForEdit: (project: ProjectData) => void;
  onSelectProjectForTemplates?: (project: ProjectData) => void;
  onSelectProjectForPhotos?: (project: ProjectData) => void;
  onCopyProject?: (project: ProjectData) => Promise<ProjectData | void> | void;
  onNewProject: () => void;
  onProjectListUpdated?: () => void;
  initialData?: InitialProjectsData;
  cachedProjects?: ProjectData[];
  implementationMode?: "quotation" | "pic";
}

interface DeleteModalState {
  project: ProjectData;
  mode: "soft" | "permanent";
}

interface SlidingBanglaTextProps {
  text: string;
  className?: string;
  maxWidthClass?: string;
}

/**
 * Truncates long single-line Bangla text without clipping top/bottom Bangla matras (িকার/ুকার/ূকার),
 * and smoothly slides horizontally on hover to reveal the full text when overflowing.
 */
const SlidingBanglaText: React.FC<SlidingBanglaTextProps> = ({
  text,
  className = "",
  maxWidthClass = "max-w-[260px] sm:max-w-[340px] lg:max-w-[400px] xl:max-w-[480px]",
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowPx, setOverflowPx] = useState(0);
  const [hovered, setHovered] = useState(false);

  const measure = useCallback(() => {
    if (!containerRef.current || !textRef.current) return;
    const el = containerRef.current;
    const styles = window.getComputedStyle(el);
    const padX = (parseFloat(styles.paddingLeft) || 0) + (parseFloat(styles.paddingRight) || 0);
    const diff = textRef.current.scrollWidth - (el.clientWidth - padX);
    setOverflowPx(diff > 3 ? diff : 0);
  }, []);

  useEffect(() => {
    measure();
    if (typeof document !== "undefined" && document.fonts?.ready) {
      document.fonts.ready.then(() => measure());
    }
    if (typeof ResizeObserver === "undefined" || !containerRef.current) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [text, measure]);

  // Smooth readable sliding speed (~65px/sec, minimum 1.8s)
  const slideDuration = Math.max(1.8, Number((overflowPx / 65).toFixed(2)));

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={overflowPx > 0 ? text : undefined}
      className={`relative w-full ${maxWidthClass}`}
    >
      <div
        ref={containerRef}
        // Bangla Nikosh glyphs (ি/ী/ু/ূ/ৃ/রেফ/চন্দ্রবিন্দু) extend far beyond the normal line box.
        // Generous padding + equal negative margin keeps the visual layout unchanged while making
        // the clip/mask box tall & wide enough that NO part of any glyph is ever cut.
        // clip-path clips only left/right so the sliding text never overlaps neighbouring columns.
        style={{ clipPath: "inset(-20px 0px -20px 0px)" }}
        className={`py-3 -my-3 px-1.5 -mx-1.5 ${overflowPx > 0 && !hovered
          ? "[mask-image:linear-gradient(to_right,black_calc(100%-40px),transparent_calc(100%-16px))]"
          : ""
          }`}
      >
        <span
          ref={textRef}
          style={{
            transform:
              hovered && overflowPx > 0
                ? `translateX(-${overflowPx + 12}px)`
                : "translateX(0px)",
            transition:
              hovered && overflowPx > 0
                ? `transform ${slideDuration}s ease-in-out`
                : "transform 0.3s ease-out",
          }}
          className={`inline-block whitespace-nowrap leading-[2] py-0.5 ${className}`}
        >
          {text}
        </span>
      </div>
      {overflowPx > 0 && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 transition-opacity duration-200 ${hovered ? "opacity-0" : "opacity-100"
            }`}
        >
          ...
        </span>
      )}
    </div>
  );
};

export const ProjectsListPage: React.FC<ProjectsListPageProps> = ({
  currentProjectId,
  onSelectProjectForEdit,
  onSelectProjectForTemplates,
  onSelectProjectForPhotos,
  onCopyProject,
  onNewProject,
  onProjectListUpdated,
  initialData,
  cachedProjects,
  implementationMode = "quotation",
}) => {
  const [activeTab, setActiveTab] = useState<"active" | "trash">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [fiscalYear, setFiscalYear] = useState("সকল");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Track live timestamp to auto-expire copy badges dynamically without reload
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);

  useEffect(() => {
    setNowMs(Date.now());
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const [projects, setProjects] = useState<ProjectData[]>(() => {
    if (cachedProjects && cachedProjects.length > 0) {
      return cachedProjects.slice(0, itemsPerPage);
    }
    return (initialData?.projects || []).filter((p) =>
      implementationMode === "pic"
        ? p.implementationMode === "pic" || p.id.startsWith("pic-") || p.id.startsWith("demo-pic")
        : p.implementationMode !== "pic" && !p.id.startsWith("pic-") && !p.id.startsWith("demo-pic")
    );
  });
  const [totalCount, setTotalCount] = useState(
    cachedProjects?.length || initialData?.totalCount || 0
  );
  const [totalPages, setTotalPages] = useState(
    initialData?.totalPages || 1
  );
  const [activeCount, setActiveCount] = useState(
    cachedProjects?.length || initialData?.activeCount || 0
  );
  const [trashCount, setTrashCount] = useState(initialData?.trashCount || 0);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [portalMounted, setPortalMounted] = useState(false);

  useEffect(() => {
    setPortalMounted(true);
  }, []);

  // Instantly swap displayed projects from cachedProjects when switching mode to prevent screen jump/flicker
  useEffect(() => {
    setCurrentPage(1);
    if (
      activeTab === "active" &&
      !debouncedSearch &&
      fiscalYear === "সকল" &&
      cachedProjects
    ) {
      const nonDemo = cachedProjects.filter(
        (p) => !p.id.startsWith("demo-")
      );
      setProjects(nonDemo.slice(0, itemsPerPage));
      setTotalCount(nonDemo.length);
      setActiveCount(nonDemo.length);
      setTotalPages(Math.max(1, Math.ceil(nonDemo.length / itemsPerPage)));
    }
  }, [implementationMode, cachedProjects, activeTab, debouncedSearch, fiscalYear]);

  // Format currency cleanly
  const displayMoney = (val?: string) => {
    if (!val || !val.trim()) return "—";
    return formatBanglaCurrency(val);
  };

  // Search debounce
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Lock body scroll & close modal on Escape key
  useEffect(() => {
    if (!deleteModal) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !actionLoading) {
        setDeleteModal(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [deleteModal, actionLoading]);

  // Load projects from server filtered by implementationMode (without collapsing table height)
  const loadProjects = useCallback(async (showSpinner?: boolean | React.MouseEvent) => {
    if (showSpinner === true) setLoading(true);
    try {
      const res = await fetchProjectsFromServer({
        search: debouncedSearch,
        trash: activeTab === "trash",
        fiscalYear: fiscalYear !== "সকল" ? fiscalYear : undefined,
        page: currentPage,
        limit: itemsPerPage,
        mode: implementationMode,
      });

      setProjects(res.projects || []);
      setTotalCount(res.totalCount || res.count || 0);
      setTotalPages(
        res.totalPages ||
        Math.max(1, Math.ceil((res.totalCount || res.count || 0) / itemsPerPage))
      );

      if (typeof res.activeCount === "number") setActiveCount(res.activeCount);
      if (typeof res.trashCount === "number") setTrashCount(res.trashCount);
    } catch (err) {
      console.error("Failed to load projects:", err);
      toast.error("প্রকল্প তালিকা লোড করতে সমস্যা হয়েছে।");
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch, fiscalYear, currentPage, itemsPerPage, implementationMode]);

  useEffect(() => {
    loadProjects(false);
  }, [loadProjects]);

  const showToast = (type: "success" | "error" | "info", text: string) => {
    if (type === "success") {
      toast.success(text);
    } else if (type === "error") {
      toast.error(text);
    } else {
      toast.info(text);
    }
  };

  // Confirm handler for Delete Modal: Shows loading indicator inside modal, closes only on server success
  const handleConfirmDelete = async () => {
    if (!deleteModal || actionLoading) return;
    const { project, mode } = deleteModal;
    const isPermanent = mode === "permanent";

    // 1. Keep modal open and show loading inside modal button
    setActionLoading(project.id);

    try {
      // 2. Perform delete on server
      const res = await deleteProjectFromServer(project.id, isPermanent);

      if (res.success) {
        // 3. Update table list on success
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        if (!isPermanent) {
          setActiveCount((prev) => Math.max(0, prev - 1));
          setTrashCount((prev) => prev + 1);
          setTotalCount((prev) => Math.max(0, prev - 1));
        } else {
          setTrashCount((prev) => Math.max(0, prev - 1));
          setTotalCount((prev) => Math.max(0, prev - 1));
        }

        // 4. Close modal after successful completion
        setDeleteModal(null);
        showToast(
          "success",
          isPermanent
            ? "প্রকল্পটি স্থায়ীভাবে মুছে ফেলা হয়েছে।"
            : "প্রকল্পটি রিসাইকেল বিনে পাঠানো হয়েছে।"
        );
        onProjectListUpdated?.();
      } else {
        showToast("error", res.message || "ডিলিট সম্পন্ন করা যায়নি।");
      }
    } catch {
      showToast("error", "ডিলিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।");
    } finally {
      setActionLoading(null);
    }
  };

  // Restore project from trash with loading indicator
  const handleRestore = async (project: ProjectData) => {
    if (actionLoading) return;
    setActionLoading(project.id);
    try {
      const res = await restoreProjectOnServer(project.id);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== project.id));
        setTrashCount((prev) => Math.max(0, prev - 1));
        setActiveCount((prev) => prev + 1);
        setTotalCount((prev) => Math.max(0, prev - 1));
        showToast("success", "প্রকল্পটি সক্রিয় তালিকায় পুনরুদ্ধার করা হয়েছে।");
        onProjectListUpdated?.();
      } else {
        showToast("error", res.message || "পুনরুদ্ধার করা যায়নি।");
        await loadProjects();
      }
    } catch {
      showToast("error", "পুনরুদ্ধার করতে সমস্যা হয়েছে।");
      await loadProjects();
    } finally {
      setActionLoading(null);
    }
  };

  // Handle project copy click with instant optimistic UI update
  const handleCopyClick = async (project: ProjectData) => {
    if (!onCopyProject) return;
    const copyKey = `copy-${project.id}`;
    setActionLoading(copyKey);
    try {
      const result = await onCopyProject(project);
      if (result && typeof result === "object" && "id" in result) {
        setProjects((prev) => [result as ProjectData, ...prev.filter((p) => p.id !== (result as ProjectData).id)]);
        setActiveCount((prev) => prev + 1);
        setTotalCount((prev) => prev + 1);
      }
      showToast(
        "success",
        `"${project.projectName || "প্রকল্পটি"}" সফলভাবে কপি করা হয়েছে! (নাম পরিবর্তন করলেও কপি ট্যাগ পুরো ১ ঘণ্টা থাকবে)`
      );
      onProjectListUpdated?.();
    } catch (err) {
      console.error("Failed to copy project:", err);
      showToast("error", "প্রকল্পটি কপি করতে সমস্যা হয়েছে।");
    } finally {
      setActionLoading(null);
    }
  };

  const hasActiveFilters = Boolean(searchQuery.trim() || fiscalYear !== "সকল");
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalCount);

  return (
    <div className="space-y-4 animate-fade-in-slide pb-10">
      {/* Main Clean Table Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs overflow-hidden">
        {/* Top Header + Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-normal text-slate-900">
                প্রকল্প তালিকা
              </h2>
              <p className="text-sm sm:text-[15px] text-slate-500 mt-0.5">
                সকল নিবন্ধিত প্রকল্পের তালিকা ও দ্রুত ব্যবস্থাপনা
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={loadProjects}
                disabled={loading}
                title="রিফ্রেশ করুন"
                className="p-2.5 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin text-blue-600" : ""}`}
                />
              </button>
              <button
                type="button"
                onClick={onNewProject}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-sm sm:text-base font-normal rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>নতুন প্রকল্প</span>
              </button>
            </div>
          </div>

          {/* Tabs + Search + Fiscal Year Filter */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Active vs Trash Tabs */}
            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-xl self-start">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("active");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm sm:text-base font-normal cursor-pointer transition-all ${activeTab === "active"
                  ? "bg-white text-blue-700 shadow-2xs"
                  : "text-slate-600 hover:text-slate-900"
                  }`}
              >
                <span>সক্রিয় প্রকল্প</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-xs sm:text-sm font-normal ${activeTab === "active"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-slate-200 text-slate-700"
                    }`}
                >
                  {toBanglaDigits(String(activeCount))}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("trash");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm sm:text-base font-normal cursor-pointer transition-all ${activeTab === "trash"
                  ? "bg-white text-red-600 shadow-2xs"
                  : "text-slate-600 hover:text-red-600"
                  }`}
              >
                <Trash2 className="w-4 h-4" />
                <span>রিসাইকেল বিন</span>
                {trashCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs sm:text-sm font-normal bg-red-100 text-red-600">
                    {toBanglaDigits(String(trashCount))}
                  </span>
                )}
              </button>
            </div>

            {/* Search & Fiscal Year */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1 lg:max-w-xl lg:justify-end">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="প্রকল্পের নাম, ঠিকাদার বা ওয়ার্ড দিয়ে খুঁজুন..."
                  className="w-full pl-9 pr-8 h-10 text-sm sm:text-base font-normal bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <select
                aria-label="অর্থবছর ফিল্টার"
                value={fiscalYear}
                onChange={(e) => {
                  setFiscalYear(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-10 px-3 text-sm sm:text-base font-normal bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer shrink-0"
              >
                <option value="সকল">সকল অর্থবছর</option>
                <option value="২০২৬-২০২৭">২০২৬-২০২৭</option>
                <option value="২০২৫-২০২৬">২০২৫-২০২৬</option>
                <option value="২০২৪-২০২৫">২০২৪-২০২৫</option>
                <option value="২০২৩-২০২৪">২০২৩-২০২৪</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clean, Minimal Data Table */}
        <div className="overflow-x-auto min-h-[340px]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-2.5">
              <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
              <p className="text-sm sm:text-base font-normal">তালিকা লোড হচ্ছে...</p>
            </div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 px-4">
              <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                {activeTab === "trash" ? (
                  <Trash2 className="w-6 h-6" />
                ) : (
                  <FolderOpen className="w-6 h-6" />
                )}
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-normal text-slate-800">
                  {activeTab === "trash"
                    ? "রিসাইকেল বিন খালি"
                    : hasActiveFilters
                      ? "কোনো প্রকল্প পাওয়া যায়নি"
                      : "এখনো কোনো প্রকল্প তৈরি করা হয়নি"}
                </h4>
                <p className="text-sm sm:text-[15px] text-slate-500 mt-1">
                  {hasActiveFilters
                    ? "অন্য কোনো শব্দ বা অর্থবছর দিয়ে খুঁজুন।"
                    : activeTab === "trash"
                      ? "মুছে ফেলা প্রকল্পসমূহ এখানে জমা থাকবে।"
                      : "নতুন প্রকল্প বাটনে ক্লিক করে শুরু করুন।"}
                </p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[15px] sm:text-base font-normal text-slate-700">
                  <th className="py-3.5 pl-5 pr-3 w-16 text-center font-normal">ক্রমিক</th>
                  <th className="py-3.5 px-3 min-w-[260px] font-normal">প্রকল্পের নাম</th>
                  <th className="py-3.5 px-3 w-24 text-center whitespace-nowrap font-normal">ওয়ার্ড</th>
                  <th className="py-3.5 px-3 w-32 text-center whitespace-nowrap font-normal">অর্থবছর</th>
                  <th className="py-3.5 px-3 w-52 font-normal">ঠিকাদার</th>
                  <th className="py-3.5 px-3 w-36 text-right whitespace-nowrap font-normal">চুক্তিমূল্য</th>
                  <th className="py-3.5 pl-3 pr-5 min-w-[270px] text-right whitespace-nowrap font-normal">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-[15px] sm:text-[17px] font-normal">
                {projects.map((project, idx) => {
                  const isCurrent =
                    project.id === currentProjectId && activeTab === "active";
                  const isOperating = actionLoading === project.id;
                  const serialNo = (currentPage - 1) * itemsPerPage + idx + 1;

                  return (
                    <tr
                      key={project.id}
                      className={`transition-colors ${isCurrent
                        ? "bg-blue-50/40"
                        : "hover:bg-slate-50/80"
                        }`}
                    >
                      {/* ১. ক্রমিক */}
                      <td className="py-4 pl-5 pr-3 text-center align-middle">
                        <span
                          className={`inline-flex w-8 h-8 rounded-lg text-[15px] sm:text-base font-normal items-center justify-center ${isCurrent
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-800"
                            }`}
                        >
                          {toBanglaDigits(
                            serialNo < 10 ? `0${serialNo}` : `${serialNo}`
                          )}
                        </span>
                      </td>

                      {/* ২. প্রকল্পের নাম */}
                      <td className="py-3 px-2 align-middle">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeTab === "active") {
                              onSelectProjectForEdit(project);
                            }
                          }}
                          className={`block w-full text-left text-[16px] sm:text-[18px] font-normal text-slate-900 ${activeTab === "active"
                            ? "hover:text-blue-600 cursor-pointer"
                            : ""
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            {isProjectCopyActive(project, nowMs) && (
                              <span
                                title={`কপি করা প্রকল্প (বাকি আর ${toBanglaDigits(String(getCopyRemainingMinutes(project, nowMs)))} মিনিট — নাম পরিবর্তন করলেও পুরো ১ ঘণ্টা থাকবে এবং ১ ঘণ্টা পূর্ণ হলে স্বয়ংক্রিয়ভাবে মুছে যাবে)`}
                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-normal bg-amber-100 text-amber-900 border border-amber-300 shadow-2xs"
                              >
                                <Copy className="w-3 h-3 text-amber-600" />
                                <span>কপি</span>
                              </span>
                            )}
                            <SlidingBanglaText
                              text={project.projectName || "শিরোনামহীন প্রকল্প"}
                              maxWidthClass="max-w-[240px] sm:max-w-[320px] lg:max-w-[380px] xl:max-w-[460px]"
                            />
                          </div>
                        </button>
                      </td>

                      {/* ৩. ওয়ার্ড */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap">
                        {project.wardNo ? (
                          <span className="inline-block px-3 py-1 rounded-md text-[15px] sm:text-base font-normal leading-[1.6] bg-slate-100 text-slate-800">
                            {toBanglaDigits(project.wardNo)}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>

                      {/* ৪. অর্থবছর */}
                      <td className="py-3 px-3 text-center align-middle whitespace-nowrap text-slate-700 font-normal leading-[1.7]">
                        {project.fiscalYear
                          ? toBanglaDigits(project.fiscalYear)
                          : "—"}
                      </td>

                      {/* ৫. ঠিকাদার */}
                      <td className="py-3 px-3 align-middle">
                        <SlidingBanglaText
                          text={project.contractorName || "—"}
                          maxWidthClass="max-w-[160px] xl:max-w-[220px]"
                          className="text-slate-800 font-normal"
                        />
                      </td>

                      {/* ৬. চুক্তিমূল্য */}
                      <td className="py-4 px-3 text-right align-middle whitespace-nowrap font-normal text-emerald-700 text-[16px] sm:text-[17px]">
                        {displayMoney(project.contractValue)}
                      </td>

                      {/* ৭. অ্যাকশন */}
                      <td className="py-4 pl-3 pr-5 text-right align-middle whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          {activeTab === "active" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => onSelectProjectForEdit(project)}
                                title="ফর্মে এডিট করুন"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm sm:text-[15px] font-normal rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>এডিট</span>
                              </button>

                              {onCopyProject && (
                                <button
                                  type="button"
                                  disabled={isOperating}
                                  onClick={() => handleCopyClick(project)}
                                  title="প্রকল্পটি হুবহু কপি করে নতুন প্রকল্প তৈরি করুন"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm sm:text-[15px] font-normal rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200/90 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  {actionLoading === `copy-${project.id}` ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-700" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5 text-amber-700" />
                                  )}
                                  <span>কপি</span>
                                </button>
                              )}

                                                            {onSelectProjectForPhotos && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelectProjectForPhotos(project)
                                  }
                                  title="প্রকল্পের স্থিরচিত্র দেখুন ও আপলোড করুন"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm sm:text-[15px] font-normal rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 transition-colors cursor-pointer"
                                >
                                  <Camera className="w-3.5 h-3.5" />
                                  <span>ছবি</span>
                                </button>
                              )}
                              {onSelectProjectForTemplates && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSelectProjectForTemplates(project)
                                  }
                                  title="প্রিন্ট টেমপ্লেট দেখুন"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm sm:text-[15px] font-normal rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200/80 transition-colors cursor-pointer"
                                >
                                  <FileCheck2 className="w-3.5 h-3.5" />
                                  <span>টেমপ্লেট</span>
                                </button>
                              )}

                              <button
                                type="button"
                                disabled={isOperating}
                                onClick={() =>
                                  setDeleteModal({ project, mode: "soft" })
                                }
                                title="ডিলিট করুন"
                                className="inline-flex items-center justify-center w-8.5 h-8.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200/80 hover:border-red-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                disabled={isOperating}
                                onClick={() => handleRestore(project)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm sm:text-[15px] font-normal rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-60"
                              >
                                {isOperating ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3.5 h-3.5" />
                                )}
                                <span>{isOperating ? "রিস্টোর হচ্ছে..." : "রিস্টোর"}</span>
                              </button>

                              <button
                                type="button"
                                disabled={isOperating}
                                onClick={() =>
                                  setDeleteModal({ project, mode: "permanent" })
                                }
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm sm:text-[15px] font-normal rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white border border-red-200 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>স্থায়ী ডিলিট</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        <div className="px-5 py-3.5 bg-slate-50/70 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm sm:text-[15px] font-normal">
          <div className="text-slate-600">
            দেখাচ্ছে{" "}
            <span className="text-slate-900">
              {toBanglaDigits(String(startItem))} – {toBanglaDigits(String(endItem))}
            </span>{" "}
            (মোট{" "}
            <span className="text-blue-600">
              {toBanglaDigits(String(totalCount))}
            </span>
            টি)
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={currentPage <= 1 || loading}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400 font-normal cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>পূর্ববর্তী</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                if (
                  pg === 1 ||
                  pg === totalPages ||
                  (pg >= currentPage - 1 && pg <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={pg}
                      type="button"
                      disabled={loading}
                      onClick={() => setCurrentPage(pg)}
                      className={`min-w-8 h-8 px-2.5 rounded-lg text-sm sm:text-[15px] font-normal transition-all cursor-pointer ${currentPage === pg
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-blue-400"
                        }`}
                    >
                      {toBanglaDigits(String(pg))}
                    </button>
                  );
                } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                  return (
                    <span key={pg} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              type="button"
              disabled={currentPage >= totalPages || loading}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-blue-400 font-normal cursor-pointer"
            >
              <span>পরবর্তী</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* FULL-SCREEN PORTAL DELETE CONFIRMATION MODAL                          */}
      {/* Rendered directly into document.body so it overlays the entire site   */}
      {/* ===================================================================== */}
      {portalMounted &&
        deleteModal &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-modal-title"
            onClick={() => {
              if (!actionLoading) setDeleteModal(null);
            }}
            className="fixed inset-0 z-[9999] w-screen h-screen flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm animate-modal-backdrop"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden animate-modal-card"
            >
              {/* Top Section with Centered Animated Danger Icon */}
              <div className="p-6 text-center space-y-3 relative">
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => setDeleteModal(null)}
                  aria-label="বন্ধ করুন"
                  className="absolute right-4 top-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="mx-auto h-14 w-14 rounded-full bg-red-50 border-4 border-red-100 text-red-600 flex items-center justify-center">
                  {deleteModal.mode === "permanent" ? (
                    <AlertTriangle className="w-6 h-6" />
                  ) : (
                    <Trash2 className="w-6 h-6" />
                  )}
                </div>

                <div className="space-y-1">
                  <h3
                    id="delete-modal-title"
                    className="text-lg sm:text-xl font-normal text-slate-900"
                  >
                    {deleteModal.mode === "permanent"
                      ? "প্রকল্পটি চিরতরে মুছে ফেলবেন?"
                      : "প্রকল্পটি ডিলিট করতে চান?"}
                  </h3>
                  <p className="text-sm sm:text-[15px] font-normal text-slate-500 leading-relaxed">
                    {deleteModal.mode === "permanent"
                      ? "সতর্কতা: স্থায়ীভাবে মুছে ফেললে এই প্রকল্পটি আর কখনো ফিরিয়ে আনা যাবে না।"
                      : "প্রকল্পটি সক্রিয় তালিকা থেকে রিসাইকেল বিনে পাঠানো হবে। প্রয়োজনে পরে রিস্টোর করতে পারবেন।"}
                  </p>
                </div>

                {/* Clean Selected Project Preview */}
                <div className="mt-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-left space-y-1">
                  <div className="text-[15px] sm:text-base font-normal text-slate-900">
                    <SlidingBanglaText
                      text={deleteModal.project.projectName || "শিরোনামহীন প্রকল্প"}
                      maxWidthClass="max-w-full"
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-slate-500 leading-[1.7]">
                    <span>
                      ওয়ার্ড: {toBanglaDigits(deleteModal.project.wardNo || "—")}
                    </span>
                    <span className="font-normal text-emerald-700">
                      {displayMoney(deleteModal.project.contractValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={() => setDeleteModal(null)}
                  className="w-full py-2.5 px-4 text-sm sm:text-base font-normal rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
                >
                  বাতিল করুন
                </button>

                <button
                  type="button"
                  disabled={Boolean(actionLoading)}
                  onClick={handleConfirmDelete}
                  className="w-full py-2.5 px-4 inline-flex items-center justify-center gap-2 text-sm sm:text-base font-normal rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-60"
                >
                  {actionLoading === deleteModal.project.id ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>
                        {deleteModal.mode === "permanent"
                          ? "স্থায়ীভাবে মোছা হচ্ছে..."
                          : "রিসাইকেল বিনে পাঠানো হচ্ছে..."}
                      </span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {deleteModal.mode === "permanent"
                          ? "চিরতরে মুছুন"
                          : "হ্যাঁ, ডিলিট করুন"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
