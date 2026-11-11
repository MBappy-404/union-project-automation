"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Search, ChevronDown, Check, FolderOpen, Loader2, X } from "lucide-react";
import { ProjectData, isProjectCopyActive } from "@/types/project";
import { fetchProjectsFromServer } from "@/lib/api";

interface SearchableProjectSelectProps {
  currentProject: ProjectData;
  allProjects: ProjectData[];
  onSelectProject: (id: string, project?: ProjectData) => void;
  className?: string;
  maxWidthClass?: string;
}

export const SearchableProjectSelect: React.FC<SearchableProjectSelectProps> = ({
  currentProject,
  allProjects,
  onSelectProject,
  className = "",
  maxWidthClass = "max-w-[540px]",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [serverResults, setServerResults] = useState<ProjectData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchInputId = useId();
  const [nowMs, setNowMs] = useState<number | undefined>(undefined);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Auto-focus search input when opened
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Server-side search with debounce when search term is typed
  useEffect(() => {
    if (!searchTerm.trim()) {
      setServerResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const handler = setTimeout(async () => {
      try {
        const res = await fetchProjectsFromServer({
          search: searchTerm.trim(),
          trash: false,
          limit: 25,
        });
        if (res.projects) {
          setServerResults(res.projects);
        }
      } catch (err) {
        console.warn("SearchableProjectSelect server search notice:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Combine and deduplicate local allProjects and server search results
  const displayedProjects = React.useMemo(() => {
    if (!searchTerm.trim()) {
      return allProjects;
    }

    const term = searchTerm.toLowerCase();
    const localFiltered = allProjects.filter((p) => {
      return (
        p.projectName?.toLowerCase().includes(term) ||
        p.projectCode?.toLowerCase().includes(term) ||
        p.contractorName?.toLowerCase().includes(term) ||
        p.wardNo?.includes(term) ||
        p.fiscalYear?.includes(term)
      );
    });

    // Merge with server results, deduplicating by id
    const map = new Map<string, ProjectData>();
    localFiltered.forEach((p) => map.set(p.id, p));
    serverResults.forEach((p) => map.set(p.id, p));

    return Array.from(map.values());
  }, [allProjects, serverResults, searchTerm]);

  const handleSelect = (project: ProjectData) => {
    onSelectProject(project.id, project);
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div ref={containerRef} className={`relative w-full ${maxWidthClass} ${className}`}>
      {/* Trigger Button: Shows ONLY current project title */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full h-10 px-3.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-blue-400 focus:border-blue-500 rounded-xl text-left flex items-center justify-between gap-2 shadow-2xs transition-colors cursor-pointer"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate">
          {isProjectCopyActive(currentProject, nowMs) && (
            <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-normal bg-amber-100 text-amber-900 border border-amber-300">
              কপি
            </span>
          )}
          <span className="truncate text-sm sm:text-base font-normal text-slate-800">
            {currentProject?.projectName || "সক্রিয় প্রকল্প নির্বাচন করুন"}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          {/* Search Box Header */}
          <div className="p-2.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                id={searchInputId}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="প্রকল্পের নাম লিখে খুঁজুন..."
                className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm font-normal bg-white border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {isSearching && (
              <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-normal mt-1.5 px-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span>প্রকল্প খোঁজা হচ্ছে...</span>
              </div>
            )}
          </div>

          {/* Project List Scrollable Area - ONLY Title */}
          <div className="max-h-[300px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {displayedProjects.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1.5">
                <FolderOpen className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs sm:text-sm font-normal">কোনো প্রকল্প পাওয়া যায়নি</p>
              </div>
            ) : (
              displayedProjects.map((p) => {
                const isSelected = p.id === currentProject?.id;
                const isCopy = isProjectCopyActive(p, nowMs);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleSelect(p)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-center justify-between gap-3 transition-colors cursor-pointer ${
                      isSelected ? "bg-blue-50/70" : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {isCopy && (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-xs font-normal bg-amber-100 text-amber-900 border border-amber-300">
                          কপি
                        </span>
                      )}
                      <span
                        className={`text-xs sm:text-sm font-normal truncate ${
                          isSelected ? "text-blue-700" : "text-slate-800"
                        }`}
                      >
                        {p.projectName || "শিরোনামহীন প্রকল্প"}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
