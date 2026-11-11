"use client";

import React, { useState, useRef, useEffect } from "react";
import { ProjectData } from "@/types/project";
import { TEMPLATES_LIST, PIC_TEMPLATES_LIST } from "@/types/templates";
import { PrintableTemplate } from "@/components/PrintableTemplate";
import { PicPrintableTemplate } from "@/components/PicPrintableTemplate";
import {
  Search,
  Printer,
  ChevronDown,
  Check,
  X,
  FolderOpen,
} from "lucide-react";
import { ImplementationMode } from "@/components/InitialOptionModal";

interface TemplatesHubProps {
  data: ProjectData;
  allProjects?: ProjectData[];
  onSelectProject?: (id: string) => void;
  onPrint: () => void;
  implementationMode?: ImplementationMode;
}

export const TemplatesHub: React.FC<TemplatesHubProps> = ({
  data,
  allProjects = [],
  onSelectProject,
  onPrint,
  implementationMode = "quotation",
}) => {
  // 1. Searchable Project Selector State
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);

  // 2. Template Selection & Filter State
  const currentTemplatesList = implementationMode === "pic" ? PIC_TEMPLATES_LIST : TEMPLATES_LIST;
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(currentTemplatesList[0].id);
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("সকল");

  // Reset selected template and category when switching implementation mode
  useEffect(() => {
    const list = implementationMode === "pic" ? PIC_TEMPLATES_LIST : TEMPLATES_LIST;
    setSelectedCategory("সকল");
    setSelectedTemplateId(list[0].id);
  }, [implementationMode]);

  const categories =
    implementationMode === "pic"
      ? ["সকল", "সাধারণ ও প্রশাসনিক", "কমিটি ও সভা", "দরপত্র ও চুক্তি", "বাস্তবায়ন ও কারিগরি", "বিল ও হিসাব"]
      : [
        "সকল",
        "সাধারণ ও প্রশাসনিক",
        "দরপত্র ও চুক্তি",
        "কমিটি ও সভা",
        "বিল ও হিসাব",
        "বাস্তবায়ন ও কারিগরি",
      ];

  // List of all created projects (fallback to current project if empty)
  const projectsList = allProjects.length > 0 ? allProjects : [data];

  // Filter created projects based on search query (by name or ward)
  const filteredProjects = projectsList.filter((p) => {
    const q = projectSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.projectName && p.projectName.toLowerCase().includes(q)) ||
      (p.wardNo && p.wardNo.toLowerCase().includes(q))
    );
  });

  // Filter templates based on category
  const filteredTemplates = currentTemplatesList.filter((tmpl) => {
    return selectedCategory === "সকল" || tmpl.category === selectedCategory;
  });

  const activeTemplate =
    currentTemplatesList.find((t) => t.id === selectedTemplateId) || currentTemplatesList[0];

  // Close project dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (projectDropdownRef.current && !projectDropdownRef.current.contains(e.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus project search input on open
  useEffect(() => {
    if (isProjectDropdownOpen) {
      setTimeout(() => {
        projectSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isProjectDropdownOpen]);

  // Handle project selection
  const handleSelectProjectItem = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    }
    setIsProjectDropdownOpen(false);
    setProjectSearchQuery("");
  };

  return (
    <div className="space-y-6 print:space-y-0 print:m-0 print:p-0">
      {/* Filter Bar (Hidden during print): Category Tabs on left + Searchable Project Select Dropdown on right */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-sm no-print">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 sm:px-4.5 sm:py-2 rounded-xl text-sm sm:text-[15px] font-normal whitespace-nowrap cursor-pointer transition-all ${selectedCategory === cat
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Searchable Project Dropdown (Clean, shows project name and ward) */}
          <div ref={projectDropdownRef} className="relative w-full sm:w-80 md:w-96">
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50/80 border border-slate-300 hover:border-blue-400 focus:border-blue-600 focus:outline-none flex items-center justify-between text-sm sm:text-[15px] font-normal text-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-normal truncate leading-[1.7] py-0.5">
                  {data.projectName || "প্রকল্প নির্বাচন করুন"}
                  {data.wardNo ? ` (ওয়ার্ড: ${data.wardNo})` : ""}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isProjectDropdownOpen ? "rotate-180 text-blue-600" : ""}`} />
            </button>

            {/* Dropdown with search and clean project list */}
            {isProjectDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
                {/* Search input inside dropdown */}
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={projectSearchInputRef}
                      type="text"
                      placeholder="প্রকল্পের নাম বা ওয়ার্ড খুঁজুন..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full h-9 text-sm font-normal pl-8 pr-7 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:outline-none text-slate-900 placeholder:text-slate-400 shadow-2xs"
                    />
                    {projectSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setProjectSearchQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Project items (only name and ward, clean like select options) */}
                <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => {
                      const isCurrent = p.id === data.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProjectItem(p.id)}
                          className={`w-full text-left px-3 py-2 text-sm font-normal rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${isCurrent
                            ? "bg-blue-50 text-blue-700"
                            : "hover:bg-slate-100 text-slate-700"
                            }`}
                        >
                          <span className="truncate leading-[1.7] py-0.5">
                            {p.projectName || "নতুন প্রকল্প"}
                            {p.wardNo ? ` (ওয়ার্ড: ${p.wardNo})` : ""}
                          </span>
                          {isCurrent && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        </button>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-sm font-normal text-slate-400">
                      কোন প্রকল্প পাওয়া যায়নি
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Template Selector + Right Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start print:block print:w-full print:m-0 print:p-0">
        {/* Left List of Templates */}
        <div className={`${activeTemplate.orientation === "landscape" ? "lg:col-span-3 xl:col-span-3" : "lg:col-span-4 xl:col-span-4"} space-y-2.5 max-h-[850px] overflow-y-auto pr-1.5 no-print`}>
          <div className="text-sm sm:text-[15px] font-normal tracking-wide text-blue-600 px-1 mb-2 flex items-center justify-between">
            <span>টেমপ্লেটের তালিকা ({filteredTemplates.length})</span>
          </div>

          {filteredTemplates.map((tmpl) => {
            const isSelected = tmpl.id === selectedTemplateId;
            return (
              <button
                key={tmpl.id}
                id={`tmpl-card-${tmpl.id}`}
                onClick={() => setSelectedTemplateId(tmpl.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer ${isSelected
                  ? "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white border-blue-500 shadow-sm"
                  : "bg-gray-50/80 text-gray-700 border-gray-200/90 hover:border-gray-300 hover:bg-gray-100/90"
                  }`}
              >
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-mono font-normal text-xs ${isSelected ? "text-white/90" : "text-gray-500"}`}>
                      {tmpl.code}
                    </span>
                    {tmpl.orientation === "landscape" && (
                      <span className={`text-[11px] px-1.5 py-0.5 rounded font-normal ${isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800 border border-blue-200"}`}>
                        Landscape
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full font-normal ${isSelected
                      ? "bg-white/20 text-white"
                      : "bg-gray-200/70 text-gray-600"
                      }`}
                  >
                    {tmpl.category}
                  </span>
                </div>
                <h4 className={`text-[15.5px] sm:text-[16.5px] font-normal leading-relaxed ${isSelected ? "text-white" : "text-gray-800"}`}>
                  {tmpl.titleBn}
                </h4>
              </button>
            );
          })}
        </div>

        {/* Right Printable Document View */}
        <div className={`${activeTemplate.orientation === "landscape" ? "lg:col-span-9 xl:col-span-9" : "lg:col-span-8 xl:col-span-8"} print:w-full print:m-0 print:p-0`}>
          {implementationMode === "pic" ? (
            <PicPrintableTemplate
              template={activeTemplate}
              data={data}
              onPrint={onPrint}
            />
          ) : (
            <PrintableTemplate
              template={activeTemplate}
              data={data}
              onPrint={onPrint}
            />
          )}
        </div>
      </div>

      {/* Bottom-Right Floating Print Button (Slim, Fixed to Screen, Subtle Color Transition) */}
      <div className="no-print fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
        <button
          type="button"
          onClick={onPrint}
          className="flex items-center gap-1.5 px-5 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors duration-150 cursor-pointer text-xs sm:text-sm font-normal"
          title="নির্বাচিত টেমপ্লেট প্রিন্ট বা PDF সংরক্ষণ করুন"
        >
          <Printer className="w-3.5 h-3.5 shrink-0" />
          <span>প্রিন্ট / PDF সংরক্ষণ</span>
        </button>
      </div>
    </div>
  );
};


