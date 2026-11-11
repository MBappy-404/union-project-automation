"use client";

import React from "react";
import { SECTIONS, PIC_SECTIONS, ProjectData } from "@/types/project";
import { toBanglaDigits } from "@/lib/banglaUtils";
import { CheckCircle2, Circle } from "lucide-react";
import { ImplementationMode } from "@/components/InitialOptionModal";

interface SectionProgressProps {
  data: ProjectData;
  activeSection: number;
  setActiveSection: (sec: number) => void;
  implementationMode?: ImplementationMode;
}

export const SectionProgress: React.FC<SectionProgressProps> = ({
  data,
  activeSection,
  setActiveSection,
  implementationMode = "quotation",
}) => {
  const isPic = implementationMode === "pic";
  const activeSectionsList = isPic ? PIC_SECTIONS : SECTIONS;

  // Compute filled count for each section dynamically based on mode
  const sectionCounts = React.useMemo(() => {
    const countFilled = (keys: (keyof ProjectData)[]) =>
      keys.filter((k) => typeof data[k] === "string" && (data[k] as string).trim() !== "").length;

    if (isPic) {
      const picS1Keys: (keyof ProjectData)[] = [
        "projectName", "fiscalYear", "installmentNo", "projectCode", "projectNo",
        "fileNo", "sectorName", "wardNo", "allocationAmount", "unionName"
      ];
      const picS2Keys: (keyof ProjectData)[] = [
        "meetingNo", "meetingDate1", "meetingDate2", "presidentName", "committeeMembers",
        "memberFatherOrHusband", "village", "designation", "committeeDesignation", "signature"
      ];
      const picS3Keys: (keyof ProjectData)[] = [
        "estimationDate", "estimatedValue", "tenderWorkOrderNo", "workOrderDate",
        "contractDate", "contractValue", "contractExpiryDate", "executedWorkValue", "timeLimit"
      ];
      const picS4Keys: (keyof ProjectData)[] = [
        "workMeasurement", "chairmanDate", "supervisionDate", "applicationDate"
      ];
      const picS5Keys: (keyof ProjectData)[] = [
        "vat", "tax", "totalDeduction", "netPayment", "billAmount",
        "billDate", "bankBranchName", "bankAccountNo", "chequeNo", "moneyAmount", "receiptDate"
      ];

      return {
        1: { filled: countFilled(picS1Keys), total: picS1Keys.length },
        2: { filled: countFilled(picS2Keys), total: picS2Keys.length },
        3: { filled: countFilled(picS3Keys), total: picS3Keys.length },
        4: { filled: countFilled(picS4Keys), total: picS4Keys.length },
        5: { filled: countFilled(picS5Keys), total: picS5Keys.length },
      } as Record<number, { filled: number; total: number }>;
    }

    const s1Keys: (keyof ProjectData)[] = [
      "projectName", "projectCode", "projectNo", "fileNo", "contractValue",
      "contractDate", "workOrderDate", "fileOpeningDate", "contractorName",
      "fiscalYear", "presidentName", "wardNo", "unionName"
    ];
    const s2Keys: (keyof ProjectData)[] = [
      "estimationDate", "estimatedValue", "sectorName", "allocationAmount"
    ];
    const s3Keys: (keyof ProjectData)[] = [
      "donorAgency", "contractorAndFirm", "tenderNoticeNo", "tenderNoticeDate",
      "tenderSellingLastDate", "tenderSubmissionLastDate", "tenderOpeningDateTime",
      "tenderEvaluationDate", "quotedPrice", "lowestPrice", "tenderWorkOrderNo",
      "tenderWorkOrderDate", "agreementDate", "tenderContractPrice",
      "contractExpiryDate", "executedWorkValue", "timeLimit"
    ];
    const s4Keys: (keyof ProjectData)[] = [
      "meetingNo", "meetingDate1", "meetingDate2", "meetingDate3", "president", "designation", "committeeDesignation",
      "committeeMembers", "village", "signature", "memberFatherOrHusband"
    ];
    const s5Keys: (keyof ProjectData)[] = [
      "bankName", "bankBranchName", "chequeNo", "chequeDate", "chequeSignatories",
      "vat", "tax", "securityDeposit", "totalDeduction", "moneyAmount",
      "netPayment", "billAmount", "billDate", "installmentNo", "receiptDate", "financialDate"
    ];
    const s6Keys: (keyof ProjectData)[] = [
      "materialsDescription", "workMeasurement", "laborName", "supervisionDate",
      "chairmanDate", "applicationDate", "applicationRecommendDate", "finalDesignation"
    ];

    return {
      1: { filled: countFilled(s1Keys), total: s1Keys.length },
      2: { filled: countFilled(s2Keys), total: s2Keys.length },
      3: { filled: countFilled(s3Keys), total: s3Keys.length },
      4: { filled: countFilled(s4Keys), total: s4Keys.length },
      5: { filled: countFilled(s5Keys), total: s5Keys.length },
      6: { filled: countFilled(s6Keys), total: s6Keys.length },
    } as Record<number, { filled: number; total: number }>;
  }, [data, isPic]);

  const totalFields = Object.values(sectionCounts).reduce((acc, curr) => acc + curr.total, 0);
  const totalFilled = Object.values(sectionCounts).reduce((acc, curr) => acc + curr.filled, 0);
  const percent = Math.round((totalFilled / totalFields) * 100);

  return (
    <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className={`text-sm font-normal ${isPic ? "text-emerald-600" : "text-blue-600"}`}>
            {isPic ? "পিআইসি পদ্ধতি ফাইল সিডিউল — ফরম পূরণ অগ্রগতি" : "মাস্টার ফরম পূরণ অগ্রগতি (সাধারণ কোটেশন)"}
          </span>
          <h2 className="text-base sm:text-lg font-normal text-slate-900 flex flex-wrap items-center gap-2.5 mt-0.5 leading-relaxed">
            <span>{isPic ? "৫টি মূল শাখা ও ৪৩টি তথ্য ক্ষেত্র" : "৬টি মূল শাখা ও ৬৭টি তথ্য ক্ষেত্র"}</span>
            <span className={`text-sm font-normal px-3 py-0.5 rounded-full border ${
              isPic ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
            }`}>
              {toBanglaDigits(totalFilled)}/{toBanglaDigits(totalFields)} ({toBanglaDigits(percent)}%)
            </span>
          </h2>
        </div>
        <div className="w-full sm:w-64 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full ${
              isPic
                ? "bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-700"
                : "bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Sections selector tabs */}
      <div className={`grid grid-cols-2 md:grid-cols-3 ${isPic ? "lg:grid-cols-5" : "lg:grid-cols-6"} gap-2.5`}>
        {activeSectionsList.map((sec) => {
          const stats = sectionCounts[sec.id] || { filled: 0, total: 1 };
          const isComplete = stats.filled === stats.total;
          const isActive = activeSection === sec.id;

          return (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`p-3.5 rounded-xl text-left border cursor-pointer transition-colors ${
                isActive
                  ? isPic
                    ? "bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white border-emerald-500 shadow-sm"
                    : "bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 text-white border-blue-500 shadow-sm"
                  : isPic
                  ? "bg-slate-50/70 text-slate-700 border-slate-200/90 hover:border-emerald-400 hover:bg-emerald-50/30"
                  : "bg-slate-50/70 text-slate-700 border-slate-200/90 hover:border-blue-400 hover:bg-blue-50/30"
              }`}
            >
              <div className="flex items-center justify-between text-sm mb-1">
                <span className={`font-normal ${isActive ? "text-white" : "text-slate-900"}`}>
                  শাখা {sec.numberBn}
                </span>
                {isComplete ? (
                  <CheckCircle2 className={`w-4 h-4 ${isActive ? "text-sky-200" : isPic ? "text-emerald-600" : "text-blue-600"}`} />
                ) : (
                  <Circle className={`w-3.5 h-3.5 ${isActive ? "text-white/60" : "text-slate-400"}`} />
                )}
              </div>
              <p className={`text-[15px] sm:text-base font-normal truncate leading-[1.7] py-0.5 mb-1 ${isActive ? "text-white" : "text-slate-800"}`}>
                {sec.titleBn}
              </p>
              <div className={`flex items-center justify-between text-xs sm:text-sm font-normal ${isActive ? "text-white/90" : "text-slate-500"}`}>
                <span>{toBanglaDigits(stats.filled)}/{toBanglaDigits(stats.total)} তথ্য</span>
                <span>{toBanglaDigits(Math.round((stats.filled / stats.total) * 100))}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
