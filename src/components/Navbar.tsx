"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  FileText,
  FileCheck2,
  FileSpreadsheet,
  FolderOpen,
  PlusCircle,
  Download,
  Upload,
  Printer,
  LayoutGrid,
  TableProperties,
  Camera,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { ProjectData, isProjectCopyActive } from "@/types/project";
import { toBanglaDigits } from "@/lib/banglaUtils";

interface NavbarProps {
  currentProject: ProjectData;
  allProjects: ProjectData[];
  activeTab: "projects" | "form" | "cover-signboard" | "photos" | "templates";
  setActiveTab: (tab: "projects" | "form" | "cover-signboard" | "photos" | "templates") => void;
  formViewMode: "structured" | "paper-table";
  setFormViewMode: (mode: "structured" | "paper-table") => void;
  onNewProject: () => void;
  onSelectProject: (id: string) => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onPrint: () => void;
  saveStatus?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  allProjects,
  activeTab,
  setActiveTab,
  formViewMode,
  setFormViewMode,
  onNewProject,
  onSelectProject,
  onExportJSON,
  onImportJSON,
  onPrint,
  saveStatus,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("লগআউট সম্পন্ন হয়েছে।");
        window.location.href = "/login";
      } else {
        toast.error("লগআউট করতে ব্যর্থ হয়েছে।");
        setIsLoggingOut(false);
      }
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("সার্ভার ত্রুটি। পুনরায় চেষ্টা করুন।");
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full no-print bg-white/95 backdrop-blur-md transition-colors">
        {/* ========================================================= */}
        {/* 1. TOP MAIN NAVBAR: Clean, streamlined, professional header */}
        {/* ========================================================= */}
        <div className="border-b border-slate-200/80">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
            <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
              {/* Left: Brand Logo & Title (UP Automation) */}
              <div className="flex items-center space-x-3 shrink-0">
                <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-sm sm:text-base">
                  UP
                </div>
                <div>
                  <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 leading-none">
                    UP Automation
                  </h1>
                </div>
              </div>

              {/* Right: Project Switcher, Meaningful Icons & Quick Utility Buttons */}
              <div className="flex items-center space-x-2 shrink-0">
                {/* Project Select Dropdown (Hidden when on templates or cover-signboard tab) */}
                {activeTab !== "templates" && activeTab !== "cover-signboard" && activeTab !== "photos" && (
                  <div className="relative">
                    <select
                      aria-label="সক্রিয় প্রকল্প নির্বাচন করুন"
                      value={currentProject.id}
                      onChange={(e) => onSelectProject(e.target.value)}
                      className="text-xs bg-slate-50 border border-slate-300 hover:border-blue-400 focus:border-blue-600 text-slate-800 rounded-xl h-9 px-3 pr-7 focus:outline-none max-w-[130px] sm:max-w-[200px] truncate cursor-pointer font-medium"
                    >
                      {allProjects.map((p) => {
                        const isCopy = isProjectCopyActive(p, nowMs);
                        return (
                          <option key={p.id} value={p.id}>
                            {isCopy ? "[কপি] " : ""}
                            {p.projectName ? p.projectName.slice(0, 22) + "..." : "বেনামী প্রকল্প"} ({p.fiscalYear || "চলতি"})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}

                {/* New Project Button */}
                <button
                  type="button"
                  onClick={onNewProject}
                  title="নতুন খালি প্রকল্প শুরু করুন"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-normal text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl cursor-pointer transition-colors"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">নতুন প্রকল্প</span>
                </button>

                {/* Utility Icon Group: Print, Backup, Upload */}
                <div className="flex items-center space-x-1 pl-1 border-l border-slate-200">
                  <button
                    type="button"
                    onClick={onPrint}
                    title="সরাসরি প্রিন্ট বা PDF হিসেবে সংরক্ষণ"
                    className="p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-slate-100 border border-slate-200/80 cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={onExportJSON}
                    title="JSON ব্যাকআপ ডাউনলোড"
                    className="hidden md:inline-flex p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-slate-100 border border-slate-200/80 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onImportJSON}
                    accept=".json"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="JSON ফাইল আপলোড"
                    className="hidden md:inline-flex p-2 text-slate-600 hover:text-blue-600 rounded-xl hover:bg-slate-100 border border-slate-200/80 cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                </div>

                {/* User Info Badge & Logout */}
                <div className="flex items-center space-x-1.5 pl-1.5 border-l border-slate-200">
                  <div
                    title="লগইনকৃত অ্যাডমিন: taiburunion@gmail.com"
                    className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-normal"
                  >
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-semibold">
                      তৈ
                    </div>
                    <span className="truncate max-w-[85px]">তৈবুর রহমান</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    title="লগআউট করুন (taiburunion@gmail.com)"
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-normal text-rose-600 hover:text-rose-700 bg-rose-50/80 hover:bg-rose-100 rounded-xl border border-rose-200/80 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">লগআউট</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. DEDICATED NAVIGATION BAR: Placed below navbar with clear visibility    */}
      {/* ========================================================================= */}
      <div className="no-print w-full pt-3 sm:pt-4 pb-1">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-1.5 sm:p-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Left: Navigation Tabs in Requested Order (তালিকা -> প্রকল্প ফর্ম -> টেমপ্লেট) */}
            <nav className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto no-scrollbar">
              {/* Tab 1: প্রকল্প তালিকা (Project List & Database) */}
              <button
                type="button"
                onClick={() => setActiveTab("projects")}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[16px] sm:text-[18px] font-normal leading-[2] whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === "projects"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-900 hover:text-blue-600 hover:bg-slate-100"
                }`}
              >
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>প্রকল্প তালিকা</span>
              </button>

              {/* Tab 2: মাস্টার ফর্ম (Master Form) */}
              <button
                type="button"
                onClick={() => setActiveTab("form")}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[16px] sm:text-[18px] font-normal leading-[2] whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === "form"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-900 hover:text-blue-600 hover:bg-slate-100"
                }`}
              >
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>মাস্টার ফর্ম</span>
              </button>

              {/* Tab 3: কভার ও সাইনবোর্ড (File Cover & Project Signboard) */}
              <button
                type="button"
                onClick={() => setActiveTab("cover-signboard")}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[16px] sm:text-[18px] font-normal leading-[2] whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === "cover-signboard"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-900 hover:text-blue-600 hover:bg-slate-100"
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>কভার ও সাইনবোর্ড</span>
              </button>

                            {/* Tab: প্রকল্পের ছবি (Project Photos) */}
              <button
                type="button"
                onClick={() => setActiveTab("photos")}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[16px] sm:text-[18px] font-normal leading-[2] whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === "photos"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-900 hover:text-blue-600 hover:bg-slate-100"
                }`}
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>প্রকল্পের ছবি</span>
              </button>

{/* Tab 4: প্রিন্ট টেমপ্লেট (Templates Hub) */}
              <button
                type="button"
                onClick={() => setActiveTab("templates")}
                className={`flex items-center gap-2.5 px-4 sm:px-5 py-1.5 sm:py-2 rounded-xl text-[16px] sm:text-[18px] font-normal leading-[2] whitespace-nowrap cursor-pointer transition-all ${
                  activeTab === "templates"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md"
                    : "text-slate-900 hover:text-blue-600 hover:bg-slate-100"
                }`}
              >
                <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>প্রিন্ট টেমপ্লেট</span>
              </button>
            </nav>

            {/* Right: Form View Switcher: Card View vs. Paper Table View (Only shown when activeTab === "form") */}
            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 px-2 sm:px-0">
              {activeTab === "form" && (
                <div className="flex items-center bg-slate-100/90 p-1 sm:p-1.5 rounded-xl border border-slate-200 gap-1">
                  <button
                    type="button"
                    title="সেকশন কার্ড ভিউ"
                    onClick={() => setFormViewMode("structured")}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-normal cursor-pointer transition-colors ${
                      formViewMode === "structured"
                        ? "bg-white text-blue-700 border border-slate-200/90"
                        : "text-slate-600 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    <span>কার্ড ভিউ</span>
                  </button>
                  <button
                    type="button"
                    title="অফিসিয়াল ফর্ম ছক ভিউ (ছবির অনুরূপ)"
                    onClick={() => setFormViewMode("paper-table")}
                    className={`flex items-center gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-normal cursor-pointer transition-colors ${
                      formViewMode === "paper-table"
                        ? "bg-white text-blue-700 border border-slate-200/90"
                        : "text-slate-600 hover:text-slate-900 border border-transparent"
                    }`}
                  >
                    <TableProperties className="w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0" />
                    <span>ছক ভিউ</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
