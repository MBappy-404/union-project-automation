"use client";

import React, { useState, useRef, useEffect } from "react";
import { ProjectData } from "@/types/project";
import {
  toBanglaDigits,
  formatBanglaCurrency,
  formatBanglaDate,
} from "@/lib/banglaUtils";
import {
  Printer,
  FolderOpen,
  ChevronDown,
  Search,
  Check,
  X,
  Save,
  SlidersHorizontal,
} from "lucide-react";
import { ImplementationMode } from "@/components/InitialOptionModal";
import { BanglaDatePicker } from "@/components/BanglaDatePicker";

type PrintTargetMode = "both" | "cover" | "signboard";

interface CoverAndSignboardViewProps {
  data: ProjectData;
  allProjects?: ProjectData[];
  onChange: (field: keyof ProjectData, value: string) => void;
  onSelectProject?: (id: string) => void;
  onSaveToDatabase?: () => Promise<void>;
  isSaving?: boolean;
  implementationMode?: ImplementationMode;
}

export const CoverAndSignboardView: React.FC<CoverAndSignboardViewProps> = ({
  data,
  allProjects = [],
  onChange,
  onSelectProject,
  onSaveToDatabase,
  isSaving = false,
  implementationMode = "quotation",
}) => {
  const isPic = implementationMode === "pic";
  const [viewMode, setViewMode] = useState<PrintTargetMode>("both");
  const [showExtraForm, setShowExtraForm] = useState<boolean>(true);
  const [savedNotice, setSavedNotice] = useState<boolean>(false);

  // Searchable Project Dropdown state
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const [projectSearchQuery, setProjectSearchQuery] = useState<string>("");
  const projectDropdownRef = useRef<HTMLDivElement>(null);
  const projectSearchInputRef = useRef<HTMLInputElement>(null);

  const projectsList = allProjects.length > 0 ? allProjects : [data];

  const filteredProjects = projectsList.filter((p) => {
    const q = projectSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (p.projectName && p.projectName.toLowerCase().includes(q)) ||
      (p.wardNo && p.wardNo.toLowerCase().includes(q)) ||
      (p.projectCode && p.projectCode.toLowerCase().includes(q))
    );
  });

  // Set normal A4 portrait margin for Cover & Signboard (plain A4 sheet, matching uploaded document)
  useEffect(() => {
    let styleTag = document.getElementById("print-page-orientation") as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "print-page-orientation";
      document.head.appendChild(styleTag);
    }
    styleTag.innerHTML = `
      @page {
        size: A4 portrait;
        margin: 12mm 14mm 12mm 14mm;
      }
    `;
    return () => {
      if (styleTag && document.head.contains(styleTag)) {
        styleTag.innerHTML = "";
      }
    };
  }, []);

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

  useEffect(() => {
    if (isProjectDropdownOpen) {
      setTimeout(() => {
        projectSearchInputRef.current?.focus();
      }, 50);
    }
  }, [isProjectDropdownOpen]);

  const handleSelectProjectItem = (projectId: string) => {
    if (onSelectProject) {
      onSelectProject(projectId);
    }
    setIsProjectDropdownOpen(false);
    setProjectSearchQuery("");
  };

  const triggerPrintMode = (target: PrintTargetMode) => {
    if (viewMode !== target) {
      setViewMode(target);
      setTimeout(() => {
        window.print();
      }, 120);
    } else {
      window.print();
    }
  };

  const handleSaveExtraFields = async () => {
    if (!onSaveToDatabase) return;
    await onSaveToDatabase();
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  // =========================================================================
  // Clean Formatters & Auto-fill Derived Values from Main Project
  // =========================================================================
  const cleanText = (val?: string) => {
    if (!val || val.trim() === "") return "";
    return toBanglaDigits(val.trim());
  };

  const cleanMoney = (val?: string) => {
    if (!val || val.trim() === "") return "";
    return formatBanglaCurrency(val, { fallbackPlaceholder: "" });
  };

  const cleanDate = (val?: string) => {
    if (!val || val.trim() === "") return "";
    return formatBanglaDate(val, "");
  };

  // Smart extraction for Contractor Person Name vs Contractor Firm Name
  const rawContractor = (data.contractorName || "").trim();
  const parenMatch = rawContractor.match(/^(.+?)\s*\((.+?)\)\s*$/);
  const inferredFirmFromParen = parenMatch ? parenMatch[1].trim() : "";
  const inferredPersonFromParen = parenMatch
    ? parenMatch[2].replace(/^প্রোপ্রাইটর\s*[:：-]?\s*/, "").trim()
    : "";

  const inferredFirmFallback =
    inferredFirmFromParen ||
    (data.contractorAndFirm ? data.contractorAndFirm.split("(")[0].trim() : "");

  const effectiveFirmOnly = (data.contractorFirm && data.contractorFirm.trim()) || inferredFirmFallback;
  const effectivePersonName = parenMatch ? inferredPersonFromParen : rawContractor;

  const addrTrimmed = data.contractorAddress ? data.contractorAddress.trim() : "";
  const effectiveFirmWithAddress =
    effectiveFirmOnly && addrTrimmed && !effectiveFirmOnly.includes(addrTrimmed)
      ? `${effectiveFirmOnly}, ${addrTrimmed}`
      : effectiveFirmOnly || addrTrimmed;

  // Auto-derived Implementing Agency from Union, Upazila, District
  const autoImplementingAgency = [data.unionName, data.upazila, data.district]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(", ");

  const effectiveImplementingAgency =
    (data.implementingAgency && data.implementingAgency.trim()) || autoImplementingAgency;

  // Derived Display Values for Both Tables
  const fileRegVal = cleanText(data.fileRegNo || data.fileNo);
  const coverDateVal = cleanDate(data.fileOpeningDate);
  const projectNameVal = cleanText(data.projectName);
  const measurementVal = cleanText(data.workMeasurement);
  const projectNoVal = cleanText(data.projectNo);
  const projectCodeVal = cleanText(data.projectCode);
  const sectorVal = cleanText(data.sectorName);
  const fiscalYearVal = cleanText(data.fiscalYear);
  const wardNoVal = cleanText(data.wardNo);
  const estimatedVal = cleanMoney(data.estimatedValue);
  const estimationDateVal = cleanDate(data.estimationDate);
  const tenderNoticeNoVal = cleanText(data.tenderNoticeNo);
  const tenderNoticeDateVal = cleanDate(data.tenderNoticeDate);
  const contractVal = cleanMoney(data.contractValue || data.tenderContractPrice);
  const contractDateVal = cleanDate(data.contractDate || data.agreementDate);
  const workOrderNoVal = cleanText(data.tenderWorkOrderNo);
  const workOrderDateVal = cleanDate(data.tenderWorkOrderDate || data.workOrderDate);
  const vatVal = cleanMoney(data.vat);
  const taxVal = cleanMoney(data.tax);
  const securityDepositVal = cleanMoney(data.securityDeposit);
  const netPaymentVal = cleanMoney(data.netPayment);
  const bankNameVal = cleanText(data.bankName || data.bankBranchName);
  const bankAccountNoVal = cleanText(data.bankAccountNo);
  const chequeNoVal = cleanText(data.chequeNo);
  const chequeDateVal = cleanDate(data.chequeDate || data.receiptDate);
  const presidentVal = cleanText(data.presidentName || data.president);
  const contractorPersonVal = cleanText(effectivePersonName);
  const contractorFirmOnlyVal = cleanText(effectiveFirmOnly);
  const contractorFirmWithAddressVal = cleanText(effectiveFirmWithAddress);
  const implementingAgencyVal = cleanText(effectiveImplementingAgency);

  // Cell padding scales slightly when printing a single table vs both tables on 1 A4 page
  const cellPy = viewMode === "both" ? "py-[4.5px] print:py-[3.5px]" : "py-1.5 print:py-1.5";

  return (
    <div className="space-y-5 print:space-y-0 print:m-0 print:p-0">
      {/* ===================================================================== */}
      {/* 1. TOP CONTROL BAR & PROJECT SELECTOR (Hidden during Print)           */}
      {/* ===================================================================== */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm no-print space-y-4">
        <div className="flex items-center">
          {/* Searchable Project Selector Dropdown */}
          <div ref={projectDropdownRef} className="relative w-full lg:w-[480px] shrink-0">
            <button
              type="button"
              onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
              className="w-full h-11 px-3.5 rounded-xl bg-slate-50/80 border border-slate-300 hover:border-blue-400 focus:border-blue-600 focus:outline-none flex items-center justify-between text-sm sm:text-[15px] font-normal text-slate-800 transition-colors shadow-2xs cursor-pointer"
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <FolderOpen className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-normal truncate leading-[1.7] py-0.5">
                  {data.projectName || "প্রকল্প নির্বাচন করুন"}
                  {data.wardNo ? ` (ওয়ার্ড: ${toBanglaDigits(data.wardNo)})` : ""}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                  isProjectDropdownOpen ? "rotate-180 text-blue-600" : ""
                }`}
              />
            </button>

            {isProjectDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      ref={projectSearchInputRef}
                      type="text"
                      placeholder="প্রকল্পের নাম বা ওয়ার্ড খুঁজুন..."
                      value={projectSearchQuery}
                      onChange={(e) => setProjectSearchQuery(e.target.value)}
                      className="w-full h-9 text-sm font-normal pl-8 pr-7 rounded-lg bg-white border border-slate-200 focus:border-blue-600 focus:outline-none text-slate-900 placeholder:text-slate-400"
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

                <div className="max-h-60 overflow-y-auto p-1 space-y-0.5">
                  {filteredProjects.length > 0 ? (
                    filteredProjects.map((p) => {
                      const isCurrent = p.id === data.id;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectProjectItem(p.id)}
                          className={`w-full text-left px-3 py-2 text-sm font-normal rounded-lg transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                            isCurrent
                              ? "bg-blue-50 text-blue-700"
                              : "hover:bg-slate-100 text-slate-700"
                          }`}
                        >
                          <span className="truncate leading-[1.7] py-0.5">
                            {p.projectName || "নতুন প্রকল্প"}
                            {p.wardNo ? ` (ওয়ার্ড: ${toBanglaDigits(p.wardNo)})` : ""}
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

        {/* Mode Switcher + Direct Print Buttons */}
        <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* View Tabs: উভয় একসাথে | ফাইল কভার | প্রকল্প সাইন বোর্ড */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            <button
              type="button"
              onClick={() => setViewMode("both")}
              className={`px-4 py-2 rounded-xl text-sm sm:text-[15px] font-normal whitespace-nowrap cursor-pointer transition-all ${
                viewMode === "both"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              উভয় একসাথে (কভার ও সাইন বোর্ড)
            </button>
            <button
              type="button"
              onClick={() => setViewMode("cover")}
              className={`px-4 py-2 rounded-xl text-sm sm:text-[15px] font-normal whitespace-nowrap cursor-pointer transition-all ${
                viewMode === "cover"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              শুধু ফাইল কভার
            </button>
            <button
              type="button"
              onClick={() => setViewMode("signboard")}
              className={`px-4 py-2 rounded-xl text-sm sm:text-[15px] font-normal whitespace-nowrap cursor-pointer transition-all ${
                viewMode === "signboard"
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-600"
              }`}
            >
              শুধু প্রকল্প সাইন বোর্ড
            </button>
          </div>

          {/* One-Click Print Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowExtraForm(!showExtraForm)}
              className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-normal rounded-xl border border-slate-300 bg-white hover:border-blue-400 hover:text-blue-600 text-slate-700 transition-colors cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>{showExtraForm ? "ফর্ম লুকান" : "বাকি তথ্য বসান"}</span>
            </button>

            <button
              type="button"
              onClick={() => triggerPrintMode("cover")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-[15px] font-normal rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>ফাইল কভার প্রিন্ট</span>
            </button>

            <button
              type="button"
              onClick={() => triggerPrintMode("signboard")}
              className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-[15px] font-normal rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>সাইন বোর্ড প্রিন্ট</span>
            </button>

            {viewMode === "both" && (
              <button
                type="button"
                onClick={() => triggerPrintMode("both")}
                className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-[15px] font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>একসাথে উভয় প্রিন্ট</span>
              </button>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* 2. SUPPLEMENTARY / MISSING FIELDS QUICK-FILL FORM                   */}
        {/* =================================================================== */}
        {showExtraForm && (
          <div className="pt-4 border-t border-slate-200/90">
            <div className="bg-slate-50/80 border border-blue-200/80 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div>
                  <h3 className="text-[15.5px] sm:text-base font-normal text-slate-900 leading-relaxed">
                    কভার ও সাইন বোর্ডের অতিরিক্ত তথ্য (যেগুলো মূল ফর্মে আলাদাভাবে নেই বা খালি আছে)
                  </h3>
                  <p className="text-xs sm:text-sm font-normal text-slate-500 leading-relaxed">
                    বাকি সকল ঘর মূল প্রকল্প থেকে অটো-ফিল হয়েছে। নিচের ঘরগুলো বসালেই নিচের ছকে সাথে সাথে বসে যাবে।
                  </p>
                </div>

                {onSaveToDatabase && (
                  <button
                    type="button"
                    onClick={handleSaveExtraFields}
                    disabled={isSaving}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm font-normal rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {savedNotice ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>সফলভাবে সংরক্ষিত হয়েছে</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>{isSaving ? "সংরক্ষণ হচ্ছে..." : "প্রকল্পে সংরক্ষণ করুন"}</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {isPic ? (
                  <>
                    {/* PIC 1. ব্যাংকের নাম */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                        ব্যাংকের নাম (ফাইল কভারের জন্য)
                      </label>
                      <input
                        type="text"
                        value={data.bankName || ""}
                        onChange={(e) => onChange("bankName", e.target.value)}
                        placeholder={data.bankBranchName ? `খালি থাকলে ব্যাংক শাখা (${data.bankBranchName}) বসবে` : "যেমন: সোনালী ব্যাংক"}
                        className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-emerald-400 focus:border-emerald-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* PIC 2. ব্যাংক হিসাব নং */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                        হিসাব নং (ফাইল কভারের জন্য)
                      </label>
                      <input
                        type="text"
                        value={data.bankAccountNo || ""}
                        onChange={(e) => onChange("bankAccountNo", e.target.value)}
                        placeholder="যেমন: ২৩৩২৫৬৫৪২১"
                        className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-emerald-400 focus:border-emerald-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* PIC 3. কাজের পরিমাপ */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                        কাজের পরিমাপ (দৈর্ঘ্য ও প্রস্থ)
                      </label>
                      <input
                        type="text"
                        value={data.workMeasurement || ""}
                        onChange={(e) => onChange("workMeasurement", e.target.value)}
                        placeholder="যেমন: দৈর্ঘ্য ৩০মি.   প্রস্থ ৩মি."
                        className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-emerald-400 focus:border-emerald-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                      />
                    </div>

                    {/* PIC 4. বাস্তবায়নকারি প্রতিষ্ঠানের নাম */}
                    <div className="flex flex-col space-y-1">
                      <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                        বাস্তবায়নকারি প্রতিষ্ঠানের নাম
                      </label>
                      <input
                        type="text"
                        value={data.implementingAgency || ""}
                        onChange={(e) => onChange("implementingAgency", e.target.value)}
                        placeholder={
                          autoImplementingAgency
                            ? `অটো: ${autoImplementingAgency}`
                            : "যেমন: ০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ, গোদাগাড়ী, রাজশাহী"
                        }
                        className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-emerald-400 focus:border-emerald-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                      />
                    </div>
                  </>
                ) : (
                  <>
                {/* 1. ফাইল রেজি নং (Missing in Master Form) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                    ফাইল রেজি নং (ফাইল কভারের জন্য)
                  </label>
                  <input
                    type="text"
                    value={data.fileRegNo || ""}
                    onChange={(e) => onChange("fileRegNo", e.target.value)}
                    placeholder={data.fileNo ? `খালি থাকলে ফাইল নং (${data.fileNo}) বসবে` : "যেমন: ১০১"}
                    className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* 2. ফাইল কভারের তারিখ (Synced with fileOpeningDate) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                    ফাইল কভারের তারিখ
                  </label>
                  <BanglaDatePicker
                    value={data.fileOpeningDate || ""}
                    onChange={(iso) => onChange("fileOpeningDate", iso)}
                    accent="blue"
                    ariaLabel="ফাইল কভারের তারিখ"
                  />
                </div>

                {/* 3. ব্যাংক হিসাব নং (Missing in Master Form!) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                    ব্যাংক হিসাব নং (ফাইল কভারের জন্য)
                  </label>
                  <input
                    type="text"
                    value={data.bankAccountNo || ""}
                    onChange={(e) => onChange("bankAccountNo", e.target.value)}
                    placeholder="যেমন: ২৩৩২৫৬৫৪২১"
                    className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* 4. কাজের পরিমাপ (Synced with workMeasurement) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                    কাজের পরিমাপ (দৈর্ঘ্য ও প্রস্থ)
                  </label>
                  <input
                    type="text"
                    value={data.workMeasurement || ""}
                    onChange={(e) => onChange("workMeasurement", e.target.value)}
                    placeholder="যেমন: দৈর্ঘ্য ৩০মি.   প্রস্থ ৩মি."
                    className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* 5. ঠিকাদারী প্রতিষ্ঠানের নাম (Separate from individual contractor name) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                    ঠিকাদারী প্রতিষ্ঠানের নাম
                  </label>
                  <input
                    type="text"
                    value={data.contractorFirm || ""}
                    onChange={(e) => onChange("contractorFirm", e.target.value)}
                    placeholder={inferredFirmFallback ? `অটো: ${inferredFirmFallback}` : "যেমন: বারাকাত ডেভেলপমেন্ট"}
                    className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* 6. বাস্তবায়নকারি প্রতিষ্ঠানের নাম (Auto-filled from Union + Upazila + District) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-sm sm:text-[15px] font-normal text-slate-800 leading-relaxed">
                    বাস্তবায়নকারি প্রতিষ্ঠানের নাম
                  </label>
                  <input
                    type="text"
                    value={data.implementingAgency || ""}
                    onChange={(e) => onChange("implementingAgency", e.target.value)}
                    placeholder={
                      autoImplementingAgency
                        ? `অটো: ${autoImplementingAgency}`
                        : "যেমন: ০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ, গোদাগাড়ী, রাজশাহী"
                    }
                    className="w-full h-11 px-3.5 text-base font-normal bg-white border border-slate-300 hover:border-blue-400 focus:border-blue-600 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
                  />
                </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 3. PRINTABLE A4 SHEET — EXACT REPLICA OF UPLOADED IMAGE               */}
      {/* ===================================================================== */}
      <div className="bg-white border border-neutral-300 rounded-xl shadow-xs overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:bg-white print:overflow-visible">
        <div className="p-4 sm:p-8 bg-neutral-100 overflow-x-auto flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @page {
                size: A4 portrait;
                margin: 12mm 14mm 12mm 14mm;
              }

              /* Uniform borders: 1px solid #000 on table & all cells with collapsed borders.
                 Safe horizontal padding in print guarantees the far-right border is never clipped by page margin. */
              table.cover-sign-table {
                border-collapse: collapse !important;
                border-spacing: 0 !important;
                width: 100% !important;
                border: 1px solid #000 !important;
                box-sizing: border-box !important;
              }
              table.cover-sign-table td,
              table.cover-sign-table th {
                border: 1px solid #000 !important;
                box-sizing: border-box !important;
              }

              @media print {
                #printable-template-document {
                  padding-left: 1.5px !important;
                  padding-right: 1.5px !important;
                  box-sizing: border-box !important;
                }
                table.cover-sign-table {
                  border-collapse: collapse !important;
                  border-spacing: 0 !important;
                  width: 100% !important;
                  border: 1px solid #000 !important;
                }
                table.cover-sign-table td,
                table.cover-sign-table th {
                  border: 1px solid #000 !important;
                  -webkit-print-color-adjust: exact;
                  print-color-adjust: exact;
                }
              }
            `,
            }}
          />

          <div
            id="printable-template-document"
            className="w-full max-w-[210mm] min-h-[297mm] p-7 sm:p-11 bg-white text-black shadow-sm border border-neutral-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none print:min-h-0 text-[14.5px] sm:text-[15px] print:text-[11.5pt] font-normal leading-[1.45]"
          >
            {/* =============================================================== */}
            {/* TABLE 1: ফাইল কভার (File Cover) — Exact Image Format             */}
            {/* =============================================================== */}
            {(viewMode === "both" || viewMode === "cover") && (
              <div className="print-break-inside-avoid">
                <table className="cover-sign-table w-full text-black font-normal table-fixed">
                  <colgroup>
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "23%" }} />
                    <col style={{ width: "24%" }} />
                    <col style={{ width: "27%" }} />
                  </colgroup>
                  <tbody>
                    {isPic ? (
                      <>
                        {/* PIC Row 1: প্রকল্পের নাম */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-top`}>
                            প্রকল্পের নাম
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-left align-top leading-snug`}
                          >
                            {projectNameVal}
                          </td>
                        </tr>

                        {/* PIC Row 2: কাজের পরিমাপ */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            কাজের পরিমাপ
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-center align-middle`}
                          >
                            {measurementVal}
                          </td>
                        </tr>

                        {/* PIC Row 3: প্রকল্প নং | প্রকল্প কোড */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            প্রকল্প নং
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {projectNoVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            প্রকল্প কোড
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {projectCodeVal}
                          </td>
                        </tr>

                        {/* PIC Row 4: খাতের নাম */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            খাতের নাম
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                          >
                            {sectorVal}
                          </td>
                        </tr>

                        {/* PIC Row 5: অর্থবছর | ওয়ার্ড নং */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            অর্থবছর
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-center align-middle`}>
                            {fiscalYearVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            ওয়ার্ড নং
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {wardNoVal}
                          </td>
                        </tr>

                        {/* PIC Row 6: প্রাক্কলন মূল্য | প্রাক্কলনের তারিখ */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            প্রাক্কলন মূল্য
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {estimatedVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            প্রাক্কলনের তারিখ
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {estimationDateVal}
                          </td>
                        </tr>

                        {/* PIC Row 7: চুক্তি মূল্য | চুক্তির তারিখ */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            চুক্তি মূল্য
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {contractVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            চুক্তির তারিখ
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {contractDateVal}
                          </td>
                        </tr>

                        {/* PIC Row 8: কার্যাদেশ নং | কার্যাদেশ তারিখ */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            কার্যাদেশ নং
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {workOrderNoVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            কার্যাদেশ তারিখ
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {workOrderDateVal}
                          </td>
                        </tr>

                        {/* PIC Row 9: ভ্যাট কর্তন | আয়কর কর্তন */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            ভ্যাট কর্তন
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {vatVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            আয়কর কর্তন
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {taxVal}
                          </td>
                        </tr>

                        {/* PIC Row 10: নীট প্রদান | (empty) | (empty) */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            নীট প্রদান
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {netPaymentVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`} />
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`} />
                        </tr>

                        {/* PIC Row 11: ব্যাংকের নাম | হিসাব নং */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            ব্যাংকের নাম
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            {bankNameVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            হিসাব নং
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {bankAccountNoVal}
                          </td>
                        </tr>

                        {/* PIC Row 12: চেক নং | চেক প্রদানের তারিখ */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            চেক নং
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                            {chequeNoVal}
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            চেক প্রদানের তারিখ
                          </td>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            {chequeDateVal}
                          </td>
                        </tr>

                        {/* PIC Row 13: সভাপতির নাম */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            সভাপতির নাম
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                          >
                            {presidentVal}
                          </td>
                        </tr>

                        {/* PIC Row 14: বাস্তবায়নকারি প্রতিষ্ঠানের নাম */}
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            বাস্তবায়নকারি প্রতিষ্ঠানের নাম
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                          >
                            {implementingAgencyVal}
                          </td>
                        </tr>
                      </>
                    ) : (
                      <>
                    {/* Header Row */}
                    <tr>
                      <td
                        colSpan={4}
                        className={`border border-black ${cellPy} px-2.5 text-center font-normal`}
                      >
                        ফাইল কভার
                      </td>
                    </tr>

                    {/* Row 1: ফাইল রেজি নং | তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ফাইল রেজি নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {fileRegVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {coverDateVal}
                      </td>
                    </tr>

                    {/* Row 2: প্রকল্পের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-top`}>
                        প্রকল্পের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-top leading-snug`}
                      >
                        {projectNameVal}
                      </td>
                    </tr>

                    {/* Row 3: কাজের পরিমাপ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        কাজের পরিমাপ
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-center align-middle`}
                      >
                        {measurementVal}
                      </td>
                    </tr>

                    {/* Row 4: প্রকল্প নং | প্রকল্প কোড */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        প্রকল্প নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {projectNoVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        প্রকল্প কোড
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {projectCodeVal}
                      </td>
                    </tr>

                    {/* Row 5: খাতের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        খাতের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {sectorVal}
                      </td>
                    </tr>

                    {/* Row 6: অর্থবছর | ওয়ার্ড নং */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        অর্থবছর
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {fiscalYearVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ওয়ার্ড নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {wardNoVal}
                      </td>
                    </tr>

                    {/* Row 7: প্রাক্কলন মূল্য | প্রাক্কলনের তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        প্রাক্কলন মূল্য
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {estimatedVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        প্রাক্কলনের তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {estimationDateVal}
                      </td>
                    </tr>

                    {/* Row 8: দরপত্র বিজ্ঞপ্তি নং | দরপত্র বিজ্ঞপ্তির তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        দরপত্র বিজ্ঞপ্তি নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {tenderNoticeNoVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        দরপত্র বিজ্ঞপ্তির তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {tenderNoticeDateVal}
                      </td>
                    </tr>

                    {/* Row 9: চুক্তি মূল্য | চুক্তির তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        চুক্তি মূল্য
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {contractVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        চুক্তির তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {contractDateVal}
                      </td>
                    </tr>

                    {/* Row 10: কার্যাদেশ নং | কার্যাদেশ তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        কার্যাদেশ নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {workOrderNoVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        কার্যাদেশ তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {workOrderDateVal}
                      </td>
                    </tr>

                    {/* Row 11: ভ্যাট কর্তন | আয়কর কর্তন */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ভ্যাট কর্তন
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {vatVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        আয়কর কর্তন
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {taxVal}
                      </td>
                    </tr>

                    {/* Row 12: জামানত কর্তন | নীট প্রদান */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        জামানত কর্তন
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {securityDepositVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        নীট প্রদান
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {netPaymentVal}
                      </td>
                    </tr>

                    {/* Row 13: ব্যাংকের নাম | হিসাব নং */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ব্যাংকের নাম
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {bankNameVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        হিসাব নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {bankAccountNoVal}
                      </td>
                    </tr>

                    {/* Row 14: চেক নং | চেক প্রদানের তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        চেক নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-right align-middle`}>
                        {chequeNoVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        চেক প্রদানের তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {chequeDateVal}
                      </td>
                    </tr>

                    {/* Row 15: সভাপতির নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        সভাপতির নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {presidentVal}
                      </td>
                    </tr>

                    {/* Row 16: ঠিকাদারের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ঠিকাদারের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {contractorPersonVal}
                      </td>
                    </tr>

                    {/* Row 17: ঠিকাদারী প্রতিষ্ঠানের নাম ও ঠিকানা */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ঠিকাদারী প্রতিষ্ঠানের নাম ও ঠিকানা
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {contractorFirmWithAddressVal}
                      </td>
                    </tr>

                    {/* Row 18: বাস্তবায়নকারি প্রতিষ্ঠানের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        বাস্তবায়নকারি প্রতিষ্ঠানের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {implementingAgencyVal}
                      </td>
                    </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Spacer when showing Both on 1 A4 Sheet */}
            {viewMode === "both" && <div className="h-7 print:h-5" />}

            {/* =============================================================== */}
            {/* TABLE 2: প্রকল্প সাইন বোর্ড (Project Signboard) — Exact Format   */}
            {/* =============================================================== */}
            {(viewMode === "both" || viewMode === "signboard") && (
              <div className="print-break-inside-avoid">
                <table className="cover-sign-table w-full text-black font-normal table-fixed">
                  <colgroup>
                    <col style={{ width: "26%" }} />
                    <col style={{ width: "23%" }} />
                    <col style={{ width: "24%" }} />
                    <col style={{ width: "27%" }} />
                  </colgroup>
                  <tbody>
                    {/* Header Row */}
                    <tr>
                      <td
                        colSpan={4}
                        className={`border border-black ${cellPy} px-2.5 text-center font-normal`}
                      >
                        প্রকল্প সাইন বোর্ড
                      </td>
                    </tr>

                    {/* Row 1: প্রকল্পের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-top`}>
                        প্রকল্পের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-top leading-snug`}
                      >
                        {projectNameVal}
                      </td>
                    </tr>

                    {/* Row 2: কাজের পরিমাপ (Only in Quotation mode; PIC Plate-2 goes straight to প্রকল্প নং) */}
                    {!isPic && (
                      <tr>
                        <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                          কাজের পরিমাপ
                        </td>
                        <td
                          colSpan={3}
                          className={`border border-black ${cellPy} px-2.5 text-center align-middle`}
                        >
                          {measurementVal}
                        </td>
                      </tr>
                    )}

                    {/* Row 3: প্রকল্প নং | প্রকল্প কোড */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        প্রকল্প নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {projectNoVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        প্রকল্প কোড
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {projectCodeVal}
                      </td>
                    </tr>

                    {/* Row 4: খাতের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        খাতের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {sectorVal}
                      </td>
                    </tr>

                    {/* Row 5: অর্থবছর | ওয়ার্ড নং */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        অর্থবছর
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {fiscalYearVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ওয়ার্ড নং
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {wardNoVal}
                      </td>
                    </tr>

                    {/* Row 6: চুক্তি মূল্য | চুক্তির তারিখ */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        চুক্তি মূল্য
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {contractVal}
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        চুক্তির তারিখ
                      </td>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        {contractDateVal}
                      </td>
                    </tr>

                    {/* Row 7: ভ্যাট কর্তন */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        ভ্যাট কর্তন
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {vatVal}
                      </td>
                    </tr>

                    {/* Row 8: আয়কর কর্তন */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        আয়কর কর্তন
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {taxVal}
                      </td>
                    </tr>

                    {/* Row 9: নীট প্রদান */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        নীট প্রদান
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {netPaymentVal}
                      </td>
                    </tr>

                    {/* Row 10: সভাপতির নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        সভাপতির নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {presidentVal}
                      </td>
                    </tr>

                    {/* Row 11 & 12: ঠিকাদারের নাম ও ঠিকাদারী প্রতিষ্ঠানের নাম (Only in Quotation mode) */}
                    {!isPic && (
                      <>
                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            ঠিকাদারের নাম
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                          >
                            {contractorPersonVal}
                          </td>
                        </tr>

                        <tr>
                          <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                            ঠিকাদারী প্রতিষ্ঠানের নাম
                          </td>
                          <td
                            colSpan={3}
                            className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                          >
                            {contractorFirmOnlyVal}
                          </td>
                        </tr>
                      </>
                    )}

                    {/* Row 13: বাস্তবায়নকারি প্রতিষ্ঠানের নাম */}
                    <tr>
                      <td className={`border border-black ${cellPy} px-2.5 text-left align-middle`}>
                        বাস্তবায়নকারি প্রতিষ্ঠানের নাম
                      </td>
                      <td
                        colSpan={3}
                        className={`border border-black ${cellPy} px-2.5 text-left align-middle`}
                      >
                        {implementingAgencyVal}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
