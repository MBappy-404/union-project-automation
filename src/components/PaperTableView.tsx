"use client";

import React from "react";
import { ProjectData, WardCommitteeMember, DEFAULT_WARD_MEMBERS, DEFAULT_PIC_COMMITTEE_MEMBERS, TenderEvaluationEntry, DEFAULT_TENDER_EVALUATION_LIST, TenderOpeningEntry, DEFAULT_TENDER_OPENING_LIST, isProjectCopyActive } from "@/types/project";
import {
  Printer,
  Check,
  Copy,
  Plus,
  Trash2,
  ArrowRight,
  Calculator,
  CheckCircle2,
  UserPlus,
  Users,
} from "lucide-react";
import {
  toBanglaDigits,
  formatBanglaCurrency,
  numberToBanglaWords,
  calculateBanglaPercentage,
} from "@/lib/banglaUtils";
import { ImplementationMode } from "@/components/InitialOptionModal";
import { BanglaDatePicker } from "@/components/BanglaDatePicker";

interface PaperTableViewProps {
  data: ProjectData;
  onChange: (field: keyof ProjectData, value: any) => void;
  activeSection?: number;
  onAutoCalculateFinancials?: () => void;
  onSubmitAndGoToTemplates?: () => void;
  isSubmitting?: boolean;
  implementationMode?: ImplementationMode;
}

const MONEY_FIELDS = new Set<keyof ProjectData>([
  "contractValue",
  "estimatedValue",
  "allocationAmount",
  "quotedPrice",
  "lowestPrice",
  "tenderContractPrice",
  "executedWorkValue",
  "billAmount",
  "vat",
  "tax",
  "securityDeposit",
  "totalDeduction",
  "moneyAmount",
  "netPayment",
]);

export const PaperTableView: React.FC<PaperTableViewProps> = ({
  data,
  onChange,
  activeSection,
  onSubmitAndGoToTemplates,
  isSubmitting,
  implementationMode = "quotation",
}) => {
  const isPic = implementationMode === "pic";
  const [copied, setCopied] = React.useState(false);
  const isFirstRender = React.useRef(true);

  // Smoothly scroll to section in Chok View when user clicks top SectionProgress tabs
  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (!activeSection) return;
    const el = document.getElementById(`paper-section-${activeSection}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeSection]);

  // Auto-calculate VAT, Tax, Security Deposit & Net Bill (same logic as Card View)
  const handleAutoCalculateFinancials = () => {
    const parseNum = (str: string) => {
      if (!str) return 0;
      const bnToEn = str
        .replace(/[০-৯]/g, (d) => "০১২৩৪৫৬৭৮৯".indexOf(d).toString())
        .replace(/[^0-9.]/g, "");
      return parseFloat(bnToEn) || 0;
    };

    const billVal =
      parseNum(data.billAmount) ||
      parseNum(data.estimatedValue) ||
      parseNum(data.contractValue) ||
      parseNum(data.allocationAmount) ||
      (isPic ? 150140 : 174000);
    const taxVal = Math.round(billVal * 0.075);
    const vatVal = Math.round(billVal * 0.1);
    const sdVal = isPic ? 0 : Math.round(billVal * 0.05);
    const totalDed = taxVal + vatVal + sdVal;
    const netVal = billVal - totalDed;

    const toBn = (num: number) => {
      const formatted = num.toLocaleString("en-IN");
      return formatted.replace(/[0-9]/g, (d) => "০১২৩৪৫৬৭৮৯"[parseInt(d, 10)]) + "/-";
    };

    const billBn = toBn(billVal);
    const netBn = toBn(netVal);
    onChange("billAmount", billBn);
    onChange("moneyAmount", isPic ? netBn : billBn);
    onChange("tax", toBn(taxVal));
    onChange("vat", toBn(vatVal));
    if (!isPic) {
      onChange("securityDeposit", toBn(sdVal));
    }
    onChange("totalDeduction", toBn(totalDed));
    onChange("netPayment", netBn);
  };

  // Dedicated President Info
  const presidentName = data.president || data.presidentName || "";
  const presidentVillage = data.village || "";
  const presidentDesignation = data.designation || "";
  const presidentRole = data.committeeDesignation || "সভাপতি";

  // Raw members list from project data
  const rawList =
    data.wardCommitteeMembers && data.wardCommitteeMembers.length > 0
      ? data.wardCommitteeMembers
      : isPic
      ? DEFAULT_PIC_COMMITTEE_MEMBERS
      : DEFAULT_WARD_MEMBERS;

  // Other members strictly starting from index 1 (isolated from president slot)
  const otherMembers: WardCommitteeMember[] = React.useMemo(() => {
    return rawList.slice(1);
  }, [rawList]);

  // First member is STRICTLY the President slot (Row 0 / ০১).
  // If presidentName is empty, name is STRICTLY empty "" (never falls back to other members).
  const presidentMember: WardCommitteeMember = React.useMemo(() => {
    return {
      name: presidentName,
      fatherName: rawList[0]?.fatherName || "",
      village: presidentVillage,
      designation: presidentDesignation,
      committeeRole: presidentRole,
    };
  }, [presidentName, presidentVillage, presidentDesignation, presidentRole, rawList]);

  const membersList: WardCommitteeMember[] = [presidentMember, ...otherMembers];

  const handleMemberChange = (index: number, field: keyof WardCommitteeMember, val: string) => {
    if (index === 0) {
      // Editing the President Slot
      const updatedPres = { ...presidentMember, [field]: val };
      if (field === "name") {
        onChange("president", val);
        onChange("presidentName", val);
      } else if (field === "village") {
        onChange("village", val);
      } else if (field === "designation") {
        onChange("designation", val);
      } else if (field === "committeeRole") {
        onChange("committeeDesignation", val);
      }
      onChange("wardCommitteeMembers", [updatedPres, ...otherMembers]);
    } else {
      // Editing Other Members (Row 02, 03...)
      const updatedOthers = [...otherMembers];
      updatedOthers[index - 1] = {
        ...updatedOthers[index - 1],
        [field]: val,
      };
      onChange("wardCommitteeMembers", [presidentMember, ...updatedOthers]);
    }
  };

  const handleAddMember = () => {
    const newMember: WardCommitteeMember = {
      name: "",
      fatherName: "",
      village: presidentVillage || "",
      designation: "",
      committeeRole: "সদস্য",
    };
    onChange("wardCommitteeMembers", [presidentMember, ...otherMembers, newMember]);
  };

  const handleRemoveMember = (index: number) => {
    if (index === 0) {
      // User clicked delete on the President row:
      // DO NOT shift other members! Clear the president info so the slot remains blank.
      onChange("president", "");
      onChange("presidentName", "");
      onChange("village", "");
      onChange("designation", "");
      const clearedPres: WardCommitteeMember = {
        name: "",
        fatherName: "",
        village: "",
        designation: "",
        committeeRole: "সভাপতি",
      };
      onChange("wardCommitteeMembers", [clearedPres, ...otherMembers]);
    } else {
      // User clicked delete on a regular member:
      // Remove only this member from otherMembers; President row is completely untouched!
      const updatedOthers = otherMembers.filter((_, i) => i !== index - 1);
      onChange("wardCommitteeMembers", [presidentMember, ...updatedOthers]);
    }
  };

  const evaluationList: TenderEvaluationEntry[] =
    data.tenderEvaluationList && data.tenderEvaluationList.length > 0
      ? data.tenderEvaluationList
      : DEFAULT_TENDER_EVALUATION_LIST;

  const handleEvaluationChange = (
    index: number,
    field: keyof TenderEvaluationEntry,
    val: string
  ) => {
    const updated = [...evaluationList];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange("tenderEvaluationList", updated);
  };

  const handleAddEvaluationEntry = () => {
    const newEntry: TenderEvaluationEntry = {
      name: "",
      tradeLicense: "হ্যাঁ",
      tinCertificate: "হ্যাঁ",
      experience: "হ্যাঁ",
      quotedRate: "",
      isResponsive: "হ্যাঁ",
      position: toBanglaDigits(String(evaluationList.length + 1)),
      remarks: "",
    };
    onChange("tenderEvaluationList", [...evaluationList, newEntry]);
  };

  const handleRemoveEvaluationEntry = (index: number) => {
    if (evaluationList.length <= 1) return;
    const updated = evaluationList.filter((_, i) => i !== index);
    onChange("tenderEvaluationList", updated);
  };

  const openingList: TenderOpeningEntry[] =
    data.tenderOpeningList && data.tenderOpeningList.length > 0
      ? data.tenderOpeningList
      : data.tenderer1 || data.tenderer2 || data.tenderer3
      ? [
          { name: data.tenderer1 || "", quotedPrice: data.tenderer1Price || "" },
          { name: data.tenderer2 || "", quotedPrice: data.tenderer2Price || "" },
          { name: data.tenderer3 || "", quotedPrice: data.tenderer3Price || "" },
        ]
      : DEFAULT_TENDER_OPENING_LIST;

  const handleOpeningChange = (
    index: number,
    field: keyof TenderOpeningEntry,
    val: string
  ) => {
    const updated = [...openingList];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange("tenderOpeningList", updated);
  };

  const handleAddOpeningEntry = () => {
    const newEntry: TenderOpeningEntry = {
      name: "",
      quotedPrice: "",
    };
    onChange("tenderOpeningList", [...openingList, newEntry]);
  };

  const handleRemoveOpeningEntry = (index: number) => {
    if (openingList.length <= 1) return;
    const updated = openingList.filter((_, i) => i !== index);
    onChange("tenderOpeningList", updated);
  };

  const handleCopySummary = () => {
    const text = `প্রকল্প: ${data.projectName}\nকোড: ${data.projectCode}\nচুক্তি মূল্য: ${data.contractValue}\nঠিকাদার: ${data.contractorName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const baseAmountForPct = data.contractValue || data.billAmount;

  const renderRow = (
    label: string,
    field: keyof ProjectData,
    placeholder?: string,
    type: "text" | "date" | "textarea" = "text",
    isBullet: boolean = true,
    badgeText?: string
  ) => {
    const val = (data[field] as string) || "";

    return (
      <tr className="group border-b border-slate-200/90 hover:bg-blue-50/35 transition-colors">
        <td className="w-[36%] sm:w-[31%] lg:w-[27%] py-3 px-4 sm:px-5 text-[15.5px] sm:text-base font-normal leading-relaxed text-slate-800 border-r border-slate-200/90 align-middle bg-slate-50/70 group-hover:bg-blue-50/40 transition-colors">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              {isBullet ? (
                <span className="text-blue-500 select-none">•</span>
              ) : (
                <span className="w-2 shrink-0" />
              )}
              <span className="leading-[1.7]">{label}</span>
              {badgeText && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100/80 text-blue-700 border border-blue-200/80 font-normal shrink-0">
                  {badgeText}
                </span>
              )}
            </div>
          </div>
        </td>
        <td className="py-2.5 px-3.5 sm:px-4 align-middle bg-white">
          {type === "date" ? (
            <BanglaDatePicker
              value={val}
              onChange={(iso) => onChange(field, iso)}
              accent={isPic ? "emerald" : "blue"}
              ariaLabel={label}
            />
          ) : type === "textarea" ? (
            <textarea
              rows={2}
              value={val}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder || "তথ্য লিখুন..."}
              className="w-full text-base sm:text-[17px] font-normal leading-relaxed bg-slate-50/60 border border-slate-200/95 hover:border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 focus:bg-white rounded-xl px-3.5 py-2.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-y min-h-[78px]"
            />
          ) : (
            <input
              type={type}
              value={val}
              onChange={(e) => onChange(field, e.target.value)}
              placeholder={placeholder || "তথ্য লিখুন..."}
              className="w-full h-11.5 text-base sm:text-[17px] font-normal leading-relaxed bg-slate-50/60 border border-slate-200/95 hover:border-blue-400 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/15 focus:bg-white rounded-xl px-3.5 text-slate-900 placeholder:text-slate-400 outline-none transition-all"
            />
          )}
        </td>
      </tr>
    );
  };

  const renderSectionHeader = (
    secId: number,
    numberBn: string,
    title: string,
    sub?: string,
    rightAction?: React.ReactNode
  ) => (
    <tr
      id={`paper-section-${secId}`}
      className="scroll-mt-24 bg-gradient-to-r from-blue-50/95 via-indigo-50/60 to-slate-50 border-y border-blue-200/90 font-normal text-blue-950"
    >
      <td colSpan={2} className="py-3.5 px-4 sm:px-5 text-base sm:text-lg leading-relaxed">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-600 text-white text-base font-normal flex items-center justify-center shadow-2xs shrink-0">
              {numberBn}
            </span>
            <span>{title}</span>
          </div>
          <div className="flex items-center gap-3">
            {rightAction}
            {sub && (
              <span className="text-xs sm:text-sm font-normal px-2.5 py-1 rounded-lg bg-white/80 border border-blue-200/70 text-blue-700">
                {sub}
              </span>
            )}
          </div>
        </div>
      </td>
    </tr>
  );

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl shadow-sm overflow-hidden">
      {/* Paper Top Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 sm:px-6 py-4 border-b border-slate-200 bg-slate-50/80 no-print">
        <div className="flex items-center gap-2.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-600 shadow-sm shrink-0" />
          <p className="text-sm sm:text-base font-normal text-slate-700 leading-relaxed">
            অফিসিয়াল মাস্টার ছক ভিউ — সকল শাখার সম্পূর্ণ তথ্য এক ছকে সহজ ও প্রশস্ত বিন্যাসে পূরণ করুন
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 text-sm sm:text-[15px] px-3.5 py-2 rounded-xl border border-slate-300 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors text-slate-700 font-normal cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>সারসংক্ষেপ কপি</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-sm sm:text-[15px] px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-normal shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ছকটি প্রিন্ট করুন</span>
          </button>
        </div>
      </div>

      {/* Main Wide Table Container */}
      <div className="overflow-x-auto p-3 sm:p-6 lg:p-7 bg-slate-50/50 print:p-0 print:bg-white">
        <div className="w-full max-w-[1400px] mx-auto border border-slate-300 rounded-2xl overflow-hidden shadow-xs bg-white print:border-2 print:border-neutral-800 print:rounded-none print:shadow-none">
          {/* Official Form Header */}
          <div className="text-center py-5 px-4 border-b border-slate-300 bg-gradient-to-b from-slate-50 to-white print:border-neutral-800">
            <h2 className="text-xl sm:text-2xl font-normal text-slate-900 leading-relaxed">
              {isPic ? "পিআইসি পদ্ধতি ফাইল সিডিউল" : data.unionName || "ইউনিয়ন পরিষদ কার্যালয়"}
            </h2>
            {!isPic && (data.upazila || data.district) && (
              <p className="text-sm sm:text-base font-normal text-slate-600">
                {[data.upazila, data.district].filter(Boolean).join(", ")}
              </p>
            )}
            <p className="text-sm sm:text-base font-normal text-slate-600 mt-0.5 leading-relaxed">
              {isPic
                ? data.unionName || "ইউনিয়ন পরিষদ উন্নয়ন প্রকল্প বাস্তবায়ন ছক"
                : "প্রকল্প সংক্রান্ত সামগ্রিক তথ্যাদি ও ডাটাবেজ মাস্টার ছক ফরম"}
            </p>
            {data.projectName && (
              <div className="mt-2.5 pt-2.5 border-t border-slate-200/80 max-w-3xl mx-auto flex items-center justify-center gap-2">
                {isProjectCopyActive(data) && (
                  <span className="shrink-0 px-2 py-0.5 rounded-md text-xs font-normal bg-amber-100 text-amber-900 border border-amber-300">
                    কপি
                  </span>
                )}
                <p className={`text-base sm:text-[17px] font-normal leading-relaxed ${isPic ? "text-emerald-700" : "text-blue-700"}`}>
                  প্রকল্প: {data.projectName}
                </p>
              </div>
            )}
          </div>

          <table className="w-full text-left border-collapse">
            <tbody>
              {isPic ? (
                <>
                  {/* ================================================================= */}
                  {/* PIC 1. সাধারণ তথ্য                                                 */}
                  {/* ================================================================= */}
                  {renderSectionHeader(1, "১", "১. সাধারণ তথ্য", "পিআইসি ফাইল সিডিউল")}
                  {renderRow("প্রকল্প নাম", "projectName", "যেমন: হাতনাবাদ সাইফুলের বাড়ি হতে আব্দুর রশিদ মাস্টারের বাড়ী পর্যন্ত রাস্তা এইচ বিবিকরন", "textarea", true)}
                  {renderRow("অর্থবছর", "fiscalYear", "যেমন: ২০২৬-২০২৭", "text", false)}
                  {renderRow("কিস্তি নং", "installmentNo", "যেমন: ১ম ও চূড়ান্ত", "text", false)}
                  {renderRow("প্রকল্প কোড", "projectCode", "যেমন: ২০২৬০৯০০৩", "text", true)}
                  {renderRow("প্রকল্প নং", "projectNo", "যেমন: ১০", "text", true)}
                  {renderRow("ফাইল নং", "fileNo", "যেমন: ইউপি/উন্নয়ন/২০২৬-২৭/১০", "text", true)}
                  {renderRow("খাতের নাম", "sectorName", "যেমন: ইউনিয়ন পরিষদ ভূমি হস্তান্তর ১% তহবিল", "text", true)}
                  {renderRow("ওয়ার্ড নং", "wardNo", "যেমন: ৯", "text", true)}
                  {renderRow("বরাদ্দ পরিমাণ", "allocationAmount", "যেমন: ১৭৫০০০/-", "text", true)}
                  {renderRow("ইউনিয়নের নাম ও ঠিকানা", "unionName", "যেমন: ০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ, গোদাগাড়ী, রাজশাহী", "text", false)}

                  {/* ================================================================= */}
                  {/* PIC 2. সভা ও কমিটি সংক্রান্ত তথ্য                                 */}
                  {/* ================================================================= */}
                  {renderSectionHeader(2, "২", "২. সভা ও কমিটি সংক্রান্ত তথ্য", "পিআইসি ফাইল সিডিউল")}
                  {renderRow("সভা নং", "meetingNo", "যেমন: ০১, ০২ বা ০৩", "text", true)}
                  {renderRow("সভার সময়", "meetingTime", "যেমন: সকাল ১০.০০ ঘটিকা", "text", true)}
                  {renderRow("সভার স্থান", "meetingPlace", "যেমন: ইউনিয়ন পরিষদ কার্যালয়", "text", true)}
                  {renderRow("সভা ০১ তারিখ (কমিটি গঠন ও কাজ আরম্ভ)", "meetingDate1", "", "date", true)}
                  {renderRow("সভা ০২ তারিখ (বিল ও টাকা উত্তোলন)", "meetingDate2", "", "date", true)}
                  {renderRow("সভা ০৩ তারিখ (কাজ সমাপ্তি ও চূড়ান্ত বিল)", "meetingDate3", "", "date", true)}

                  {/* Dynamic Ward/PIC Committee Table */}
                  <tr className="border-b border-slate-200 bg-emerald-50/25">
                    <td colSpan={2} className="p-4 sm:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100/80 text-emerald-600 flex items-center justify-center shrink-0">
                            <Users className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-normal text-[15.5px] sm:text-base text-slate-900 leading-relaxed">
                                পিআইসি ও ওয়ার্ড কমিটির সদস্যগণের তালিকা ছক
                              </span>
                              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-normal">
                                {toBanglaDigits(String(membersList.length))} জন সদস্য
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleAddMember}
                          className="flex items-center gap-1.5 px-3.5 py-2 text-sm sm:text-[15px] font-normal rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-xs transition-colors cursor-pointer shrink-0 no-print"
                        >
                          <UserPlus className="w-4 h-4" />
                          <span>+ নতুন সদস্য যোগ করুন</span>
                        </button>
                      </div>

                      <div className="overflow-x-auto border border-slate-200/95 rounded-xl bg-white shadow-2xs">
                        <table className="w-full text-left text-sm sm:text-base font-normal border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                              <th className="py-2.5 px-2.5 text-center w-14 font-normal border-r border-slate-200">ক্রমিক</th>
                              <th className="py-2.5 px-3 font-normal min-w-[170px] border-r border-slate-200">সদস্যের নাম</th>
                              <th className="py-2.5 px-3 font-normal min-w-[170px] border-r border-slate-200">পিতা/স্বামীর নাম</th>
                              <th className="py-2.5 px-3 font-normal min-w-[130px] border-r border-slate-200">গ্রাম</th>
                              <th className="py-2.5 px-3 font-normal min-w-[145px] border-r border-slate-200">পদবী</th>
                              <th className="py-2.5 px-3 font-normal min-w-[135px] border-r border-slate-200">কমিটির পদবী</th>
                              <th className="py-2.5 px-2.5 text-center w-14 font-normal no-print">মুছুন</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200/80">
                            {membersList.map((m, idx) => (
                              <tr key={idx} className="hover:bg-emerald-50/20 transition-colors">
                                <td className="py-2 px-2 text-center font-normal text-slate-600 border-r border-slate-200">
                                  {toBanglaDigits(String(idx + 1).padStart(2, "0"))}
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={m.name}
                                    onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                                    placeholder={idx === 0 ? "সভাপতির নাম লিখুন" : "সদস্যের নাম লিখুন"}
                                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-emerald-400 focus:border-emerald-600 outline-none transition-colors"
                                  />
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={m.fatherName}
                                    onChange={(e) => handleMemberChange(idx, "fatherName", e.target.value)}
                                    placeholder="পিতা/স্বামীর নাম"
                                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-emerald-400 focus:border-emerald-600 outline-none transition-colors"
                                  />
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={m.village}
                                    onChange={(e) => handleMemberChange(idx, "village", e.target.value)}
                                    placeholder="গ্রাম"
                                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-emerald-400 focus:border-emerald-600 outline-none transition-colors"
                                  />
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={m.designation}
                                    onChange={(e) => handleMemberChange(idx, "designation", e.target.value)}
                                    placeholder={idx === 0 ? "যেমন: ইউপি সদস্য" : "যেমন: সদস্য / শিক্ষক"}
                                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-emerald-400 focus:border-emerald-600 outline-none transition-colors"
                                  />
                                </td>
                                <td className="py-1.5 px-2 border-r border-slate-200">
                                  <input
                                    type="text"
                                    value={m.committeeRole}
                                    onChange={(e) => handleMemberChange(idx, "committeeRole", e.target.value)}
                                    placeholder={idx === 0 ? "সভাপতি" : "সদস্য"}
                                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-emerald-400 focus:border-emerald-600 outline-none transition-colors"
                                  />
                                </td>
                                <td className="py-1.5 px-2 text-center no-print">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveMember(idx)}
                                    title="সদস্য মুছুন"
                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="mt-3 flex items-center justify-between no-print">
                        <button
                          type="button"
                          onClick={handleAddMember}
                          className="flex items-center gap-1.5 text-sm sm:text-[15px] font-normal text-emerald-600 hover:text-emerald-700 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>আরও একজন সদস্য যোগ করুন</span>
                        </button>
                      </div>
                    </td>
                  </tr>

                  {/* ================================================================= */}
                  {/* PIC 3. প্রাক্কলন ও প্রশাসনিক তথ্য                                   */}
                  {/* ================================================================= */}
                  {renderSectionHeader(3, "৩", "৩. প্রাক্কলন ও প্রশাসনিক তথ্য", "পিআইসি ফাইল সিডিউল")}
                  {renderRow("প্রাক্কলন তারিখ", "estimationDate", "", "date", true)}
                  {renderRow("প্রাক্কলিত মূল্য", "estimatedValue", "যেমন: ১৭৫০০০/-", "text", true)}
                  {renderRow("কার্যদেশ নং", "tenderWorkOrderNo", "যেমন: ৫", "text", true)}
                  {renderRow("কার্যদেশ তারিখ", "workOrderDate", "", "date", true)}
                  {renderRow("চুক্তির তারিখ", "contractDate", "", "date", true)}
                  {renderRow("চুক্তি মূল্য", "contractValue", "যেমন: ১৭৫০০০/-", "text", true)}
                  {renderRow("চুক্তির মেয়াদ উত্তীর্ণের তারিখ", "contractExpiryDate", "", "date", true)}
                  {renderRow("কাজ সম্পাদিত মূল্য", "executedWorkValue", "যেমন: ১৭৫০০০/-", "text", true)}
                  {renderRow("সময় সীমা", "timeLimit", "যেমন: ৩০ দিন", "text", true)}

                  {/* ================================================================= */}
                  {/* PIC 4. বাস্তবায়ন ও অন্যান্য বিবরণ                                   */}
                  {/* ================================================================= */}
                  {renderSectionHeader(4, "৪", "৪. বাস্তবায়ন ও অন্যান্য বিবরণ", "পিআইসি ফাইল সিডিউল")}
                  {renderRow("কাজের পরিমাপ", "workMeasurement", "যেমন: দৈর্ঘ্য ৩০মি.   প্রস্থ ৩মি.", "textarea", true)}
                  {renderRow("চেয়ারম্যা প্রত্যয়ন তারিখ", "chairmanDate", "", "date", false)}
                  {renderRow("প্রকৌশলীর প্রত্যয়ন তারিখ", "supervisionDate", "", "date", false)}
                  {renderRow("আবেদনের তারিখ", "applicationDate", "", "date", true)}

                  {/* ================================================================= */}
                  {/* PIC ৫. ব্যাংক, চেক, বিল ও আর্থিক লেনদেন                            */}
                  {/* ================================================================= */}
                  {renderSectionHeader(
                    5,
                    "৫",
                    "৫. ব্যাংক, চেক, বিল ও আর্থিক লেনদেন",
                    "পিআইসি ফাইল সিডিউল",
                    <button
                      type="button"
                      onClick={handleAutoCalculateFinancials}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-normal rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs transition-colors cursor-pointer no-print"
                    >
                      <Calculator className="w-3.5 h-3.5" />
                      <span>ভ্যাট, ট্যাক্স ও নিট বিল অটো-হিসাব</span>
                    </button>
                  )}
                  {renderRow(
                    "ভ্যাট",
                    "vat",
                    "যেমন: ১০০০/-",
                    "text",
                    true,
                    data.vat && baseAmountForPct ? calculateBanglaPercentage(data.vat, baseAmountForPct) : undefined
                  )}
                  {renderRow(
                    "আয়কর",
                    "tax",
                    "যেমন: ৫০০/-",
                    "text",
                    true,
                    data.tax && baseAmountForPct ? calculateBanglaPercentage(data.tax, baseAmountForPct) : undefined
                  )}
                  {renderRow("সর্বমোট কর্তন", "totalDeduction", "যেমন: ১৫০০/-", "text", true)}
                  {renderRow("নিট প্রদান", "netPayment", "যেমন: ৫০০০০/-", "text", true)}
                  {renderRow("বিলের পরিমান", "billAmount", "যেমন: ১,৫০,১৪০/-", "text", true)}
                  {renderRow("বিলের তারিখ", "billDate", "", "date", true)}
                  {renderRow("ব্যাংক শাখার নাম", "bankBranchName", "যেমন: জনতা ব্যাংক লিমিটেড", "text", true)}
                  {renderRow("ব্যাংক হিসাব নং", "bankAccountNo", "যেমন: ০১০০০৩৭২৪৯১৫১", "text", true)}
                  {renderRow("চেক নং", "chequeNo", "যেমন: ১৬৬৭৬৬০", "text", true)}
                  {renderRow("চেকে টাকার পরিমাণ", "moneyAmount", "যেমন: ১,২৪,৩৬০.৫০/-", "text", false)}
                  {renderRow("চেক প্রাপ্তির তারিখ", "receiptDate", "", "date", true)}
                </>
              ) : (
                <>
              {/* ================================================================= */}
              {/* ১. প্রকল্পের সাধারণ তথ্য                                           */}
              {/* ================================================================= */}
              {renderSectionHeader(1, "১", "প্রকল্পের সাধারণ তথ্য", "ফরম পৃষ্ঠা - ১")}
              {renderRow("প্রকল্প নাম", "projectName", "যেমন: ৪ নং ওয়ার্ডে আরসিসি রাস্তা নির্মাণ", "textarea")}
              {renderRow("প্রকল্প কোড", "projectCode", "যেমন: PRJ-2026-001")}
              {renderRow("প্রকল্প নং", "projectNo", "যেমন: ০১ বা ০৫/২০২৬-২৭")}
              {renderRow("ফাইল নং", "fileNo", "যেমন: ইউপি/উন্নয়ন/২০২৬-২৭/০১")}
              {renderRow("চুক্তি মূল্য", "contractValue", "যেমন: ৩,৫০,০০০/-")}
              {renderRow("চুক্তির তারিখ", "contractDate", "", "date", false)}
              {renderRow("কার্যাদেশ তারিখ", "workOrderDate", "", "date", false)}
              {renderRow("ফাইল খোলার তারিখ", "fileOpeningDate", "", "date")}
              {renderRow("ঠিকাদারের নাম", "contractorName", "ঠিকাদার বা প্রতিষ্ঠানের নাম", "text", false)}
              {renderRow("ঠিকাদারের ঠিকানা", "contractorAddress", "যেমন: ঘোড়ামারা, বোয়ালিয়া, রাজশাহী", "text", false)}
              {renderRow("অর্থবছর", "fiscalYear", "যেমন: ২০২৬-২০২৭")}
              {renderRow("সভাপতির নাম", "presidentName", "ইউপি সদস্য / সভাপতি", "text", false)}
              {renderRow("ওয়ার্ড নং", "wardNo", "যেমন: ০৩")}
              {renderRow("ইউনিয়নের নাম", "unionName", "যেমন: ০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ", "text", false)}
              {renderRow("উপজেলা", "upazila", "যেমন: গোদাগাড়ী", "text", false)}
              {renderRow("জেলা", "district", "যেমন: রাজশাহী", "text", false)}

              {/* ================================================================= */}
              {/* ২. প্রাক্কলন ও প্রশাসনিক তথ্য                                       */}
              {/* ================================================================= */}
              {renderSectionHeader(2, "২", "প্রাক্কলন ও প্রশাসনিক তথ্য", "ফরম পৃষ্ঠা - ১")}
              {renderRow("প্রাক্কলনের তারিখ", "estimationDate", "", "date")}
              {renderRow("প্রাক্কলিত মূল্য", "estimatedValue", "যেমন: ১,৭৪,০০০/-")}
              {renderRow("খাতের নাম", "sectorName", "যেমন: ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল")}
              {renderRow("বরাদ্দ পরিমাণ", "allocationAmount", "যেমন: ১,৭৪,০০০/-")}

              {/* ================================================================= */}
              {/* ৩. দরপত্র ও চুক্তি সংক্রান্ত তথ্য                                   */}
              {/* ================================================================= */}
              {renderSectionHeader(3, "৩", "দরপত্র ও চুক্তি সংক্রান্ত তথ্য", "ফরম পৃষ্ঠা - ১ ও ২")}
              {renderRow("দাতা প্রতিষ্ঠানের নাম সমূহ", "donorAgency", "যেমন: স্থানীয় সরকার বিভাগ (LGD) - উন্নয়ন সহায়তা তহবিল")}
              {renderRow("ঠিকাদার ও তার প্রতিষ্ঠান", "contractorAndFirm", "যেমন: বারাকাত ডেভেলপমেন্ট (প্রোপ্রাইটর: মোসাঃ জেসমিন আরা)")}
              {renderRow("সময় সীমা", "timeLimit", "যেমন: ৩০ দিন বা ৬০ দিন")}
              {renderRow("দরপত্র বিজ্ঞপ্তি নং", "tenderNoticeNo", "যেমন: ০১")}
              {renderRow("দরপত্র বিজ্ঞপ্তি তারিখ", "tenderNoticeDate", "", "date")}
              {renderRow("দরপত্র বিক্রয়ের শেষ তারিখ", "tenderSellingLastDate", "", "date")}
              {renderRow("দরপত্র দাখিলের শেষ তারিখ", "tenderSubmissionLastDate", "", "date")}
              {renderRow("দরপত্র খোলার তারিখ ও সময়", "tenderOpeningDateTime", "যেমন: ১৫/১০/২০২৬ সময়: ২.৩০ ঘটিকা")}
              {renderRow("দরপত্র মূল্যায়নের তারিখ", "tenderEvaluationDate", "", "date")}
              {renderRow("উদ্ধৃত দর", "quotedPrice", "যেমন: ১,৭৪,০০০/-")}
              {renderRow("সর্বনিম্ন দর", "lowestPrice", "যেমন: ১,৭৪,০০০/-")}
              {renderRow("কার্যাদেশ নং", "tenderWorkOrderNo", "যেমন: ০১")}
              {renderRow("কার্যাদেশ তারিখ", "tenderWorkOrderDate", "", "date")}
              {renderRow("চুক্তির তারিখ", "agreementDate", "", "date")}
              {renderRow("চুক্তি মূল্য", "tenderContractPrice", "যেমন: ১,৭৪,০০০/-")}
              {renderRow("চুক্তির মেয়াদ উত্তীর্ণের তারিখ", "contractExpiryDate", "", "date")}
              {renderRow("কাজ সম্পাদিত মূল্য", "executedWorkValue", "যেমন: ১,৭৪,০০০/-")}

              {/* Dynamic Sub-Table for Competitor Bidders (Tender Opening Sheet - Template 3) */}
              <tr className="border-b border-slate-200 bg-blue-50/25">
                <td colSpan={2} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-normal text-[15.5px] sm:text-base text-slate-900 leading-relaxed">
                            দরপত্র উন্মুক্তকরণ সীটের জন্য দরপত্রদাতাদের বিবরণ ছক (টেমপ্লেট ০৩)
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-normal">
                            {toBanglaDigits(String(openingList.length))} জন দরপত্রদাতা
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddOpeningEntry}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm sm:text-[15px] font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-colors cursor-pointer shrink-0 no-print"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ নতুন দরদাতা যোগ করুন</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/95 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left text-sm sm:text-base font-normal border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                          <th className="py-2.5 px-3 text-center w-16 font-normal border-r border-slate-200">
                            ক্রমিক
                          </th>
                          <th className="py-2.5 px-3.5 font-normal border-r border-slate-200">
                            দরপত্রদাতার নাম ও ঠিকানা
                          </th>
                          <th className="py-2.5 px-3.5 font-normal w-[42%] border-r border-slate-200">
                            উদ্ধৃত দর (টাকা ও কথায়)
                          </th>
                          <th className="py-2.5 px-2 text-center w-14 font-normal no-print">
                            মুছুন
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80">
                        {openingList.map((entry, index) => (
                          <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-600 border-r border-slate-200">
                              {toBanglaDigits(String(index + 1).padStart(2, "0"))}
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <input
                                type="text"
                                value={entry.name}
                                onChange={(e) => handleOpeningChange(index, "name", e.target.value)}
                                placeholder="যেমন: মোঃ মাহফুজুর রহমান, সপুরা, বোয়ালিয়া, রাজশাহী।"
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-2 px-2.5 border-r border-slate-200">
                              <input
                                type="text"
                                value={entry.quotedPrice}
                                onChange={(e) => handleOpeningChange(index, "quotedPrice", e.target.value)}
                                placeholder="যেমন: ১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)"
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-2 px-2 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleRemoveOpeningEntry(index)}
                                title="এই দরদাতা মুছুন"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between no-print">
                    <button
                      type="button"
                      onClick={handleAddOpeningEntry}
                      className="inline-flex items-center gap-1.5 text-sm font-normal text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>আরও একজন দরদাতা যোগ করুন</span>
                    </button>
                    <span className="text-xs text-slate-400 font-normal">
                      সর্বশেষ সম্পাদিত তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত ও টেমপ্লেট ০৩-এ সরাসরি বসে যাবে
                    </span>
                  </div>
                </td>
              </tr>

              {/* Dynamic Tender Evaluation Table for Template 4 */}
              <tr className="border-b border-slate-200 bg-blue-50/25">
                <td colSpan={2} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-normal text-[15.5px] sm:text-base text-slate-900 leading-relaxed">
                            দরপত্র মূল্যায়ন সিট (টেমপ্লেট ০৪) দরদাতা ছক
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-normal">
                            {toBanglaDigits(String(evaluationList.length))} জন দরদাতা
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                          এখানে যুক্ত করা সকল দরপ্রদাতাগণ টেমপ্লেট ০৪ (দরপত্র মূল্যায়ন সিট)-এর মূল ছকে স্বয়ংক্রিয়ভাবে বসে যাবে।
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleAddEvaluationEntry}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all cursor-pointer self-start sm:self-auto shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ নতুন দরদাতা যোগ করুন</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                    <table className="w-full text-left border-collapse text-sm sm:text-base font-normal">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                          <th className="py-2.5 px-2 text-center w-14 font-normal border-r border-slate-200">ক্রমিক</th>
                          <th className="py-2.5 px-3 font-normal border-r border-slate-200 min-w-[200px]">দরপ্রদাতার নাম</th>
                          <th className="py-2.5 px-2 text-center w-24 font-normal border-r border-slate-200">ট্রেড লাইসেন্স</th>
                          <th className="py-2.5 px-2 text-center w-20 font-normal border-r border-slate-200">টিন</th>
                          <th className="py-2.5 px-2 text-center w-20 font-normal border-r border-slate-200">অভিজ্ঞতা</th>
                          <th className="py-2.5 px-3 font-normal border-r border-slate-200 min-w-[220px]">দর (টাকা ও কথায়)</th>
                          <th className="py-2.5 px-2 text-center w-24 font-normal border-r border-slate-200">গ্রহণযোগ্য</th>
                          <th className="py-2.5 px-2 text-center w-20 font-normal border-r border-slate-200">অবস্থান</th>
                          <th className="py-2.5 px-2.5 font-normal border-r border-slate-200 min-w-[120px]">মন্তব্য</th>
                          <th className="py-2.5 px-2 text-center w-14 font-normal">অ্যাকশন</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80">
                        {evaluationList.map((entry, index) => (
                          <tr key={index} className="hover:bg-blue-50/20">
                            <td className="py-2 px-2 text-center text-slate-600 border-r border-slate-200">
                              {toBanglaDigits(String(index + 1).padStart(2, "0"))}
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={entry.name}
                                onChange={(e) => handleEvaluationChange(index, "name", e.target.value)}
                                placeholder="দরপ্রদাতার নাম ও প্রতিষ্ঠান"
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-200">
                              <select
                                value={entry.tradeLicense}
                                onChange={(e) => handleEvaluationChange(index, "tradeLicense", e.target.value)}
                                className="w-full h-10.5 px-1 text-sm font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none text-center cursor-pointer"
                              >
                                <option value="হ্যাঁ">হ্যাঁ</option>
                                <option value="না">না</option>
                              </select>
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-200">
                              <select
                                value={entry.tinCertificate}
                                onChange={(e) => handleEvaluationChange(index, "tinCertificate", e.target.value)}
                                className="w-full h-10.5 px-1 text-sm font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none text-center cursor-pointer"
                              >
                                <option value="হ্যাঁ">হ্যাঁ</option>
                                <option value="না">না</option>
                              </select>
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-200">
                              <select
                                value={entry.experience}
                                onChange={(e) => handleEvaluationChange(index, "experience", e.target.value)}
                                className="w-full h-10.5 px-1 text-sm font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none text-center cursor-pointer"
                              >
                                <option value="হ্যাঁ">হ্যাঁ</option>
                                <option value="না">না</option>
                              </select>
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={entry.quotedRate}
                                onChange={(e) => handleEvaluationChange(index, "quotedRate", e.target.value)}
                                placeholder="যেমন: ১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)"
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-200">
                              <select
                                value={entry.isResponsive}
                                onChange={(e) => handleEvaluationChange(index, "isResponsive", e.target.value)}
                                className="w-full h-10.5 px-1 text-sm font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none text-center cursor-pointer"
                              >
                                <option value="হ্যাঁ">হ্যাঁ</option>
                                <option value="না">না</option>
                              </select>
                            </td>
                            <td className="py-2 px-1 text-center border-r border-slate-200">
                              <input
                                type="text"
                                value={entry.position}
                                onChange={(e) => handleEvaluationChange(index, "position", e.target.value)}
                                placeholder="১ম"
                                className="w-full h-10.5 px-1 text-sm font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 outline-none text-center"
                              />
                            </td>
                            <td className="py-2 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={entry.remarks || ""}
                                onChange={(e) => handleEvaluationChange(index, "remarks", e.target.value)}
                                placeholder="ঐচ্ছিক"
                                className="w-full h-10.5 px-2 text-sm font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-2 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveEvaluationEntry(index)}
                                title="এই দরদাতা মুছুন"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAddEvaluationEntry}
                      className="inline-flex items-center gap-1.5 text-sm font-normal text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>আরও একজন দরদাতা যোগ করুন</span>
                    </button>
                    <span className="text-xs text-slate-400 font-normal">
                      সর্বশেষ সম্পাদিত তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত ও টেমপ্লেট ০৪-এ সরাসরি বসে যাবে
                    </span>
                  </div>
                </td>
              </tr>

              {/* ================================================================= */}
              {/* ৪. সভা ও কমিটি সংক্রান্ত তথ্য                                      */}
              {/* ================================================================= */}
              {renderSectionHeader(4, "৪", "সভা ও কমিটি সংক্রান্ত তথ্য", "ফরম পৃষ্ঠা - ২")}
              {renderRow("সভা নং", "meetingNo", "যেমন: ০১, ০২ বা ০৩")}
              {renderRow("সভার সময়", "meetingTime", "যেমন: সকাল ১০.০০ ঘটিকা")}
              {renderRow("সভার স্থান", "meetingPlace", "যেমন: ইউপি কার্যালয়")}
              {renderRow("সভা ০১ তারিখ (মূল্যায়ন ও কার্যাদেশ)", "meetingDate1", "", "date")}
              {renderRow("সভা ০২ তারিখ (কাজ আরম্ভ ও অনুমোদন)", "meetingDate2", "", "date")}
              {renderRow("সভা ০৩ তারিখ (কাজ সমাপ্তি ও চূড়ান্ত বিল)", "meetingDate3", "", "date")}

              {/* Dynamic Ward Committee Table */}
              <tr className="border-b border-slate-200 bg-blue-50/25">
                <td colSpan={2} className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-100/80 text-blue-600 flex items-center justify-center shrink-0">
                        <Users className="w-4.5 h-4.5" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-normal text-[15.5px] sm:text-base text-slate-900 leading-relaxed">
                            ওয়ার্ড কমিটির সদস্যগণের তালিকা ছক (টেমপ্লেট ৫, ১৩ ও ১৬-এর জন্য)
                          </span>
                          <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-normal">
                            {toBanglaDigits(String(membersList.length))} জন সদস্য
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="flex items-center gap-1.5 px-3.5 py-2 text-sm sm:text-[15px] font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-colors cursor-pointer shrink-0 no-print"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>+ নতুন সদস্য যোগ করুন</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-slate-200/95 rounded-xl bg-white shadow-2xs">
                    <table className="w-full text-left text-sm sm:text-base font-normal border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                          <th className="py-2.5 px-2.5 text-center w-14 font-normal border-r border-slate-200">
                            ক্রমিক
                          </th>
                          <th className="py-2.5 px-3 font-normal min-w-[170px] border-r border-slate-200">
                            সদস্যের নাম
                          </th>
                          <th className="py-2.5 px-3 font-normal min-w-[170px] border-r border-slate-200">
                            পিতার নাম
                          </th>
                          <th className="py-2.5 px-3 font-normal min-w-[130px] border-r border-slate-200">
                            গ্রাম
                          </th>
                          <th className="py-2.5 px-3 font-normal min-w-[145px] border-r border-slate-200">
                            পদবী (পেশা)
                          </th>
                          <th className="py-2.5 px-3 font-normal min-w-[135px] border-r border-slate-200">
                            কমিটির পদবী
                          </th>
                          <th className="py-2.5 px-2.5 text-center w-14 font-normal no-print">
                            মুছুন
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/80">
                        {membersList.map((m, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/20 transition-colors">
                            <td className="py-2 px-2 text-center font-normal text-slate-600 border-r border-slate-200">
                              {toBanglaDigits(String(idx + 1).padStart(2, "0"))}
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={m.name}
                                onChange={(e) => handleMemberChange(idx, "name", e.target.value)}
                                placeholder={idx === 0 ? "সভাপতির নাম লিখুন" : "সদস্যের নাম লিখুন"}
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={m.fatherName}
                                onChange={(e) => handleMemberChange(idx, "fatherName", e.target.value)}
                                placeholder="পিতা/স্বামীর নাম"
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={m.village}
                                onChange={(e) => handleMemberChange(idx, "village", e.target.value)}
                                placeholder="গ্রাম"
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={m.designation}
                                onChange={(e) => handleMemberChange(idx, "designation", e.target.value)}
                                placeholder={idx === 0 ? "যেমন: ইউপি সদস্য" : "যেমন: সদস্য / শিক্ষক"}
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-1.5 px-2 border-r border-slate-200">
                              <input
                                type="text"
                                value={m.committeeRole}
                                onChange={(e) => handleMemberChange(idx, "committeeRole", e.target.value)}
                                placeholder={idx === 0 ? "সভাপতি" : "সদস্য"}
                                className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 outline-none transition-colors"
                              />
                            </td>
                            <td className="py-1.5 px-2 text-center no-print">
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(idx)}
                                title="সদস্য মুছুন"
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-3 flex items-center justify-between no-print">
                    <button
                      type="button"
                      onClick={handleAddMember}
                      className="flex items-center gap-1.5 text-sm sm:text-[15px] font-normal text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>আরও একজন সদস্য যোগ করুন</span>
                    </button>
                  </div>
                </td>
              </tr>

              {/* ================================================================= */}
              {/* ৫. ব্যাংক, চেক, বিল ও আর্থিক লেনদেন                                */}
              {/* ================================================================= */}
              {renderSectionHeader(
                5,
                "৫",
                "ব্যাংক, চেক, বিল ও আর্থিক লেনদেন",
                "ফরম পৃষ্ঠা - ২ ও ৩",
                <button
                  type="button"
                  onClick={handleAutoCalculateFinancials}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-normal rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-colors cursor-pointer no-print"
                >
                  <Calculator className="w-3.5 h-3.5" />
                  <span>ভ্যাট, ট্যাক্স ও নিট বিল অটো-হিসাব</span>
                </button>
              )}
              {renderRow("ব্যাংকের নাম", "bankName", "যেমন: সোনালী ব্যাংক পিএলসি")}
              {renderRow("ব্যাংক শাখার নাম", "bankBranchName", "যেমন: গোদাগাড়ী শাখা")}
              {renderRow("চেক নং", "chequeNo", "যেমন: CD-7821903")}
              {renderRow("চেকের তারিখ", "chequeDate", "", "date")}
              {renderRow("চেক স্বাক্ষরকারীগণ/সদস্যদের নাম", "chequeSignatories", "যেমন: চেয়ারম্যান ও ইউপি সচিব")}
              {renderRow("বিলের পরিমাণ", "billAmount", "যেমন: ৩,৪৮,৫০০/-")}
              {renderRow(
                "ভ্যাট কর্তন",
                "vat",
                "ভ্যাট কর্তন (টাকা)",
                "text",
                true,
                data.vat && baseAmountForPct ? calculateBanglaPercentage(data.vat, baseAmountForPct) : undefined
              )}
              {renderRow(
                "আয়কর কর্তন",
                "tax",
                "আয়কর কর্তন (টাকা)",
                "text",
                true,
                data.tax && baseAmountForPct ? calculateBanglaPercentage(data.tax, baseAmountForPct) : undefined
              )}
              {renderRow(
                "জামানতের পরিমাণ",
                "securityDeposit",
                "সিকিউরিটি জামানত (টাকা)",
                "text",
                true,
                data.securityDeposit && baseAmountForPct
                  ? calculateBanglaPercentage(data.securityDeposit, baseAmountForPct)
                  : undefined
              )}
              {renderRow("সর্বমোট কর্তন", "totalDeduction", "ভ্যাট + আয়কর + জামানত")}
              {renderRow("টাকার পরিমাণ", "moneyAmount", "মোট প্রদেয় টাকা")}
              {renderRow("নিট প্রদান", "netPayment", "কর্তন বাদে নিট প্রদেয় টাকা")}
              {renderRow("কিস্তি নং", "installmentNo", "যেমন: ১ম ও চূড়ান্ত বিল")}
              {renderRow("বিলের তারিখ", "billDate", "", "date")}
              {renderRow("প্রাপ্তির তারিখ", "receiptDate", "", "date")}
              {renderRow("লেনদেনের তারিখ", "financialDate", "", "date")}

              {/* ================================================================= */}
              {/* ৬. বাস্তবায়ন ও অন্যান্য বিবরণ                                       */}
              {/* ================================================================= */}
              {renderSectionHeader(6, "৬", "বাস্তবায়ন ও অন্যান্য বিবরণ", "ফরম পৃষ্ঠা - ৩")}
              {renderRow("মালামালের বিবরণ", "materialsDescription", "সিমেন্ট, রড, বালু, ইট ইত্যাদি", "textarea")}
              {renderRow("কাজের পরিমাপ", "workMeasurement", "দৈর্ঘ্য x প্রস্থ x উচ্চতা ও কাজের বিবরণ", "textarea")}
              {renderRow("শ্রমিকের নাম", "laborName", "হেড মিস্ত্রি / শ্রমিক প্রতিনিধি")}
              {renderRow("পদবী", "finalDesignation", "যেমন: উপ-সহকারী প্রকৌশলী, এলজিইডি")}
              {renderRow("সুপারভিশন তারিখ", "supervisionDate", "", "date")}
              {renderRow("চেয়ারম্যান তারিখ", "chairmanDate", "", "date")}
              {renderRow("আবেদনের তারিখ", "applicationDate", "", "date")}
              {renderRow("আবেদন সুপারিশ তারিখ", "applicationRecommendDate", "", "date")}
                </>
              )}
            </tbody>
          </table>

          {/* Submission Footer */}
          {onSubmitAndGoToTemplates && (
            <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-t border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-4 no-print">
              <div>
                <span className="text-base sm:text-lg font-normal text-emerald-950 leading-relaxed">
                  ছক পূরণ সম্পন্ন হয়েছে?
                </span>
                <p className="text-sm sm:text-[15px] font-normal text-emerald-800/80 mt-0.5 leading-relaxed">
                  তথ্য ডাটাবেজে সংরক্ষণ করে সরাসরি প্রিন্ট টেমপ্লেট পেজে যেতে নিচের বাটনে ক্লিক করুন।
                </p>
              </div>

              <button
                type="button"
                onClick={onSubmitAndGoToTemplates}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-3 text-sm sm:text-base font-normal rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-md hover:shadow-lg cursor-pointer transition-all disabled:opacity-50 shrink-0"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    <span>ডাটাবেজে সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>সাবমিট করে টেমপ্লেট দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
