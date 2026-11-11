"use client";

import React from "react";
import {
  ProjectData,
  SECTIONS,
  PIC_SECTIONS,
  WardCommitteeMember,
  DEFAULT_WARD_MEMBERS,
  DEFAULT_PIC_COMMITTEE_MEMBERS,
  TenderEvaluationEntry,
  DEFAULT_TENDER_EVALUATION_LIST,
  TenderOpeningEntry,
  DEFAULT_TENDER_OPENING_LIST,
  isProjectCopyActive,
  getCopyRemainingMinutes,
} from "@/types/project";
import {
  Calculator,
  ArrowRight,
  ArrowLeft,
  Trash2,
  UserPlus,
  CheckCircle,
  Users,
  Plus,
  Check,
} from "lucide-react";
import { formatBanglaCurrency, numberToBanglaWords, toBanglaDigits, calculateBanglaPercentage } from "@/lib/banglaUtils";
import { ImplementationMode } from "@/components/InitialOptionModal";
import { BanglaDatePicker } from "@/components/BanglaDatePicker";

interface StructuredFormViewProps {
  data: ProjectData;
  onChange: (field: keyof ProjectData, value: any) => void;
  activeSection: number;
  setActiveSection: (sec: number) => void;
  onSubmitAndGoToTemplates: () => void;
  isSubmitting?: boolean;
  implementationMode?: ImplementationMode;
}

export const StructuredFormView: React.FC<StructuredFormViewProps> = ({
  data,
  onChange,
  activeSection,
  setActiveSection,
  onSubmitAndGoToTemplates,
  isSubmitting,
  implementationMode = "quotation",
}) => {
  const isPic = implementationMode === "pic";
  const activeSectionsList = isPic ? PIC_SECTIONS : SECTIONS;
  const maxSection = activeSectionsList.length;

  // Helper for auto-calculating financials
  const handleAutoCalculateFinancials = () => {
    // Extract numerical digits from billAmount or contractValue
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
    const taxVal = Math.round(billVal * 0.075); // 7.5% আয়কর
    const vatVal = Math.round(billVal * 0.10);  // 10% ভ্যাট
    const sdVal = isPic ? 0 : Math.round(billVal * 0.05);   // PIC পদ্ধতিতে জামানত নেই
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

  const handleEvaluationChange = (index: number, field: keyof TenderEvaluationEntry, val: string) => {
    const updated = [...evaluationList];
    updated[index] = {
      ...updated[index],
      [field]: val,
    };
    onChange("tenderEvaluationList", updated);
  };

  const handleAddEvaluationEntry = () => {
    const nextRankBn = toBanglaDigits(String(evaluationList.length + 1)) + "য়";
    const newEntry: TenderEvaluationEntry = {
      name: "",
      tradeLicense: "হ্যাঁ",
      tinCertificate: "হ্যাঁ",
      experience: "হ্যাঁ",
      quotedRate: "",
      isResponsive: "হ্যাঁ",
      position: nextRankBn,
      remarks: "",
    };
    onChange("tenderEvaluationList", [...evaluationList, newEntry]);
  };

  const handleRemoveEvaluationEntry = (index: number) => {
    if (evaluationList.length <= 1) {
      alert("কমপক্ষে একজন দরপ্রদাতার তথ্য থাকতে হবে।");
      return;
    }
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

  const handleOpeningChange = (index: number, field: keyof TenderOpeningEntry, val: string) => {
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
    if (openingList.length <= 1) {
      alert("কমপক্ষে একজন দরপত্রদাতার তথ্য থাকতে হবে।");
      return;
    }
    const updated = openingList.filter((_, i) => i !== index);
    onChange("tenderOpeningList", updated);
  };


  const renderInputField = (
    label: string,
    field: keyof ProjectData,
    placeholder: string,
    type: "text" | "date" | "number" | "textarea" = "text",
    helperText?: string,
    colSpan: string = "col-span-1"
  ) => {
    const val = (data[field] as string) || "";

    return (
      <div className={`${colSpan} group flex flex-col space-y-1.5`}>
        <div className="flex items-center justify-between gap-1.5">
          <label className="text-[15px] sm:text-base font-normal leading-relaxed text-slate-800 group-focus-within:text-blue-600 transition-colors">
            {label}
          </label>
        </div>
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
            placeholder={placeholder}
            className="w-full text-base sm:text-[17px] font-normal leading-relaxed px-3.5 py-3 bg-slate-50/70 border border-slate-300 hover:border-blue-400 focus:border-blue-600 focus:bg-white focus:outline-none rounded-xl text-slate-900 placeholder:text-slate-400 transition-colors resize-y min-h-[86px]"
          />
        ) : (
          <input
            type={type}
            value={val}
            onChange={(e) => onChange(field, e.target.value)}
            placeholder={placeholder}
            className="w-full h-11.5 sm:h-12 text-base sm:text-[17px] font-normal leading-relaxed px-3.5 bg-slate-50/70 border border-slate-300 hover:border-blue-400 focus:border-blue-600 focus:bg-white focus:outline-none rounded-xl text-slate-900 placeholder:text-slate-400 transition-colors"
          />
        )}
      </div>
    );
  };

  const currentSectionMeta = activeSectionsList.find((s) => s.id === activeSection) || activeSectionsList[0];

  const renderWardCommitteeTable = () => (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-normal">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-normal text-slate-900 flex flex-wrap items-center gap-2 leading-relaxed">
              <span>ওয়ার্ড ও পিআইসি কমিটির সদস্যগণের তালিকা ছক</span>
              <span className="text-xs sm:text-sm font-normal px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {toBanglaDigits(String(membersList.length))} জন সদস্য
              </span>
            </h3>
            <p className="text-sm font-normal text-slate-500 leading-relaxed">
              এই ছকে এন্ট্রি করা সদস্যগণ সভার কার্যবিবরণী ছকে সরাসরি বসে যাবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddMember}
            className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-base font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ নতুন সদস্য যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm sm:text-base font-normal">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="py-3 px-2 text-center w-14 font-normal">ক্রমিক</th>
              <th className="py-3 px-2.5 font-normal min-w-[175px]">সদস্যের নাম</th>
              <th className="py-3 px-2.5 font-normal min-w-[175px]">পিতা/স্বামীর নাম</th>
              <th className="py-3 px-2.5 font-normal min-w-[130px]">গ্রাম</th>
              <th className="py-3 px-2.5 font-normal min-w-[140px]">পদবী</th>
              <th className="py-3 px-2.5 font-normal min-w-[125px]">কমিটির পদবী</th>
              <th className="py-3 px-2 text-center w-14 font-normal">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {membersList.map((member, index) => (
              <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                <td className="py-2 px-2 text-center font-normal text-slate-600">
                  {toBanglaDigits(String(index + 1).padStart(2, "0"))}
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => handleMemberChange(index, "name", e.target.value)}
                    placeholder={index === 0 ? "সভাপতির নাম লিখুন" : "সদস্যের নাম লিখুন"}
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={member.fatherName}
                    onChange={(e) => handleMemberChange(index, "fatherName", e.target.value)}
                    placeholder="পিতা/স্বামীর নাম"
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={member.village}
                    onChange={(e) => handleMemberChange(index, "village", e.target.value)}
                    placeholder="গ্রাম"
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={member.designation}
                    onChange={(e) => handleMemberChange(index, "designation", e.target.value)}
                    placeholder={index === 0 ? "যেমন: ইউপি সদস্য" : "যেমন: সদস্য / শিক্ষক"}
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={member.committeeRole}
                    onChange={(e) => handleMemberChange(index, "committeeRole", e.target.value)}
                    placeholder={index === 0 ? "সভাপতি" : "সদস্য"}
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveMember(index)}
                    title="সদস্য ডিলিট করুন"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Quick Add Button */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAddMember}
          className="flex items-center gap-1.5 text-sm sm:text-base font-normal text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>আরও একজন সদস্য যোগ করুন</span>
        </button>
        <span className="text-xs sm:text-sm font-normal text-slate-400">
          সর্বশেষ সম্পাদিত তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত ও সভার টেমপ্লেটে সরাসরি যুক্ত হবে
        </span>
      </div>
    </div>
  );

  const renderTenderEvaluationTable = () => (
    <div className="bg-white border border-blue-200 rounded-2xl p-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-normal">
            <Plus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-normal text-slate-900 flex flex-wrap items-center gap-2 leading-relaxed">
              <span>দরপত্র মূল্যায়ন সিট (টেমপ্লেট ০৪) দরদাতা ছক</span>
              <span className="text-xs sm:text-sm font-normal px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {toBanglaDigits(String(evaluationList.length))} জন দরদাতা
              </span>
            </h3>
            <p className="text-sm font-normal text-slate-500 leading-relaxed">
              এখানে যুক্ত করা সকল দরপ্রদাতাগণ টেমপ্লেট ০৪ (দরপত্র মূল্যায়ন সিট)-এর মূল ছকে স্বয়ংক্রিয়ভাবে বসে যাবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddEvaluationEntry}
            className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-base font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন দরদাতা যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm sm:text-base font-normal">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="py-3 px-2 text-center w-14 font-normal">ক্রমিক</th>
              <th className="py-3 px-2.5 font-normal min-w-[210px]">দরপ্রদাতার নাম</th>
              <th className="py-3 px-2 text-center w-24 font-normal">ট্রেড লাইসেন্স</th>
              <th className="py-3 px-2 text-center w-20 font-normal">টিন</th>
              <th className="py-3 px-2 text-center w-22 font-normal">অভিজ্ঞতা</th>
              <th className="py-3 px-2.5 font-normal min-w-[240px]">দর (টাকা ও কথায়)</th>
              <th className="py-3 px-2 text-center w-28 font-normal">গ্রহণযোগ্য কিনা</th>
              <th className="py-3 px-2 text-center w-20 font-normal">অবস্থান</th>
              <th className="py-3 px-2.5 font-normal min-w-[120px]">মন্তব্য</th>
              <th className="py-3 px-2 text-center w-14 font-normal">অ্যাকশন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {evaluationList.map((entry, index) => (
              <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                <td className="py-2 px-2 text-center font-normal text-slate-600">
                  {toBanglaDigits(String(index + 1).padStart(2, "0"))}
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => handleEvaluationChange(index, "name", e.target.value)}
                    placeholder="দরপ্রদাতার নাম ও ঠিকানা"
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-1.5 text-center">
                  <select
                    value={entry.tradeLicense}
                    onChange={(e) => handleEvaluationChange(index, "tradeLicense", e.target.value)}
                    className="w-full h-10.5 px-1 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:outline-none text-center cursor-pointer"
                  >
                    <option value="হ্যাঁ">হ্যাঁ</option>
                    <option value="না">না</option>
                  </select>
                </td>
                <td className="py-1.5 px-1.5 text-center">
                  <select
                    value={entry.tinCertificate}
                    onChange={(e) => handleEvaluationChange(index, "tinCertificate", e.target.value)}
                    className="w-full h-10.5 px-1 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:outline-none text-center cursor-pointer"
                  >
                    <option value="হ্যাঁ">হ্যাঁ</option>
                    <option value="না">না</option>
                  </select>
                </td>
                <td className="py-1.5 px-1.5 text-center">
                  <select
                    value={entry.experience}
                    onChange={(e) => handleEvaluationChange(index, "experience", e.target.value)}
                    className="w-full h-10.5 px-1 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:outline-none text-center cursor-pointer"
                  >
                    <option value="হ্যাঁ">হ্যাঁ</option>
                    <option value="না">না</option>
                  </select>
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={entry.quotedRate}
                    onChange={(e) => handleEvaluationChange(index, "quotedRate", e.target.value)}
                    placeholder="যেমন: ১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)"
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-1.5 text-center">
                  <select
                    value={entry.isResponsive}
                    onChange={(e) => handleEvaluationChange(index, "isResponsive", e.target.value)}
                    className="w-full h-10.5 px-1 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:outline-none text-center cursor-pointer"
                  >
                    <option value="হ্যাঁ">হ্যাঁ</option>
                    <option value="না">না</option>
                  </select>
                </td>
                <td className="py-1.5 px-1.5 text-center">
                  <input
                    type="text"
                    value={entry.position}
                    onChange={(e) => handleEvaluationChange(index, "position", e.target.value)}
                    placeholder="১ম / ২য় / ৩য়"
                    className="w-full h-10.5 px-1 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 focus:border-blue-600 focus:outline-none text-center"
                  />
                </td>
                <td className="py-1.5 px-2">
                  <input
                    type="text"
                    value={entry.remarks || ""}
                    onChange={(e) => handleEvaluationChange(index, "remarks", e.target.value)}
                    placeholder="মন্তব্য (ঐচ্ছিক)"
                    className="w-full h-10.5 px-2 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveEvaluationEntry(index)}
                    title="এই দরদাতা মুছুন"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Quick Add Button */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAddEvaluationEntry}
          className="flex items-center gap-1.5 text-sm sm:text-base font-normal text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>আরও একজন দরদাতা যোগ করুন</span>
        </button>
        <span className="text-xs sm:text-sm font-normal text-slate-400">
          সর্বশেষ সম্পাদিত তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত ও টেমপ্লেট ০৪-এ সরাসরি বসে যাবে
        </span>
      </div>
    </div>
  );

  const renderTenderOpeningTable = () => (
    <div className="bg-white border border-blue-200 rounded-2xl p-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-normal">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-normal text-slate-900 flex flex-wrap items-center gap-2 leading-relaxed">
              <span>দরপত্র উন্মুক্তকরণ সীটের জন্য দরপত্রদাতাদের বিবরণ ছক (টেমপ্লেট ০৩ / দরপত্র খোলা সীট)</span>
              <span className="text-xs sm:text-sm font-normal px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {toBanglaDigits(String(openingList.length))} জন দরপত্রদাতা
              </span>
            </h3>
            <p className="text-sm font-normal text-slate-500 leading-relaxed">
              এখানে যুক্ত করা দরপত্রদাতাগণ টেমপ্লেট ০৩ (দরপত্র খোলা সীট)-এর মূল ছকে ও স্বাক্ষরে স্বয়ংক্রিয়ভাবে বসে যাবে।
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAddOpeningEntry}
            className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-base font-normal rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ নতুন দরদাতা যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm sm:text-base font-normal">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <th className="py-3 px-3 text-center w-16 font-normal">ক্রমিক</th>
              <th className="py-3 px-3.5 font-normal">দরপত্রদাতার নাম ও ঠিকানা</th>
              <th className="py-3 px-3.5 font-normal w-[42%]">উদ্ধৃত দর (টাকা ও কথায়)</th>
              <th className="py-3 px-2 text-center w-16 font-normal">মুছুন</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {openingList.map((entry, index) => (
              <tr key={index} className="hover:bg-blue-50/20 transition-colors">
                <td className="py-2.5 px-3 text-center font-normal text-slate-600">
                  {toBanglaDigits(String(index + 1).padStart(2, "0"))}
                </td>
                <td className="py-1.5 px-2.5">
                  <input
                    type="text"
                    value={entry.name}
                    onChange={(e) => handleOpeningChange(index, "name", e.target.value)}
                    placeholder="যেমন: মোঃ মাহফুজুর রহমান, সপুরা, বোয়ালিয়া, রাজশাহী।"
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2.5">
                  <input
                    type="text"
                    value={entry.quotedPrice}
                    onChange={(e) => handleOpeningChange(index, "quotedPrice", e.target.value)}
                    placeholder="যেমন: ১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)"
                    className="w-full h-10.5 px-3 text-sm sm:text-base font-normal rounded-lg border border-slate-200 bg-white text-slate-900 hover:border-blue-400 focus:border-blue-600 focus:outline-none transition-colors"
                  />
                </td>
                <td className="py-1.5 px-2 text-center">
                  <button
                    type="button"
                    onClick={() => handleRemoveOpeningEntry(index)}
                    title="এই দরদাতা মুছুন"
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Quick Add Button */}
      <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <button
          type="button"
          onClick={handleAddOpeningEntry}
          className="flex items-center gap-1.5 text-sm sm:text-base font-normal text-blue-600 hover:text-blue-700 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>আরও একজন দরদাতা যোগ করুন</span>
        </button>
        <span className="text-xs sm:text-sm font-normal text-slate-400">
          সর্বশেষ সম্পাদিত তথ্য স্বয়ংক্রিয়ভাবে সংরক্ষিত ও টেমপ্লেট ০৩-এ সরাসরি বসে যাবে
        </span>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Active Section Card */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-slate-200 gap-4 mb-6">
          <div className="flex items-center gap-3.5">
            <div
              className={`w-12 h-12 rounded-2xl text-white flex items-center justify-center font-normal text-xl shadow-sm shrink-0 ${
                isPic
                  ? "bg-gradient-to-tr from-emerald-700 via-emerald-600 to-teal-600"
                  : "bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600"
              }`}
            >
              {currentSectionMeta.numberBn}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg sm:text-xl font-normal text-slate-900 leading-relaxed">
                  {currentSectionMeta.titleBn}
                </h3>
              </div>
              <p className="text-sm sm:text-[15px] font-normal text-slate-500 mt-0.5 leading-relaxed">
                {currentSectionMeta.description}
              </p>
            </div>
          </div>

          {/* Section specific quick tools & Quick Update button */}
          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            {activeSection === 5 && (
              <button
                type="button"
                onClick={handleAutoCalculateFinancials}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-normal rounded-xl border transition-colors cursor-pointer ${
                  isPic
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"
                    : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                }`}
              >
                <Calculator className={`w-3.5 h-3.5 ${isPic ? "text-emerald-600" : "text-blue-600"}`} />
                <span>ভ্যাট ও ট্যাক্স হিসাব</span>
              </button>
            )}

            <button
              type="button"
              onClick={onSubmitAndGoToTemplates}
              disabled={isSubmitting}
              title="তথ্য ডাটাবেজে আপডেট করুন ও টেমপ্লেট দেখুন"
              className="flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-normal rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent animate-spin rounded-full" />
                  <span>আপডেট হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>আপডেট করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* =============================================================== */}
        {/* PIC MODE: 5 SECTIONS (পিআইসি পদ্ধতি ফাইল সিডিউল)                   */}
        {/* =============================================================== */}
        {isPic ? (
          <>
            {activeSection === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {isProjectCopyActive(data) && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-900 text-xs sm:text-sm font-normal flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-normal text-xs shrink-0">কপি প্রকল্প</span>
                      <span>
                        এটি একটি কপি করা প্রকল্প (বাকি আর {toBanglaDigits(String(getCopyRemainingMinutes(data)))} মিনিট — নাম পরিবর্তন করলেও এই কপি ট্যাগটি পুরো ১ ঘণ্টা প্রদর্শিত থাকবে এবং ১ ঘণ্টা পূর্ণ হলে স্বয়ংক্রিয়ভাবে মুছে যাবে)।
                      </span>
                    </div>
                  </div>
                )}
                {renderInputField("প্রকল্প নাম", "projectName", "যেমন: হাতনাবাদ সাইফুলের বাড়ি হতে আব্দুর রশিদ মাস্টারের বাড়ী পর্যন্ত রাস্তা এইচ বিবিকরন", "textarea", "প্রকল্পের পূর্ণ বিবরণ লিখুন", "col-span-1 sm:col-span-2 lg:col-span-3")}
                {renderInputField("অর্থবছর", "fiscalYear", "যেমন: ২০২৬-২০২৭")}
                {renderInputField("কিস্তি নং", "installmentNo", "যেমন: ১ম ও চূড়ান্ত")}
                {renderInputField("প্রকল্প কোড", "projectCode", "যেমন: ২০২৬০৯০০৩")}
                {renderInputField("প্রকল্প নং", "projectNo", "যেমন: ১০")}
                {renderInputField("ফাইল নং", "fileNo", "যেমন: ইউপি/উন্নয়ন/২০২৬/১০")}
                {renderInputField("খাতের নাম", "sectorName", "যেমন: ইউনিয়ন পরিষদ ভূমি হস্তান্তর ১% তহবিল")}
                {renderInputField("ওয়ার্ড নং", "wardNo", "যেমন: ৯")}
                {renderInputField("বরাদ্দ পরিমাণ", "allocationAmount", "যেমন: ১,৭৫,০০০/-")}
                {renderInputField("ইউনিয়নের নাম ও ঠিকানা", "unionName", "যেমন: ০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ, গোদাগাড়ী, রাজশাহী", "text", undefined, "col-span-1 sm:col-span-2 lg:col-span-3")}
              </div>
            )}

            {activeSection === 2 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                  {renderInputField("সভা নং", "meetingNo", "যেমন: ০১, ০২ বা ০৩")}
                  {renderInputField("সভার সময়", "meetingTime", "যেমন: সকাল ১০.০০ ঘটিকা", "text", "কমিটি সভা অনুষ্ঠানের সময়")}
                  {renderInputField("সভার স্থান", "meetingPlace", "যেমন: ইউনিয়ন পরিষদ কার্যালয়")}
                  {renderInputField("সভা ০১ তারিখ (কমিটি গঠন ও কাজ আরম্ভ)", "meetingDate1", "", "date", "প্রথম সভার তারিখ (সভা নং: ০১)")}
                  {renderInputField("সভা ০২ তারিখ (বিল ও টাকা উত্তোলন)", "meetingDate2", "", "date", "দ্বিতীয় সভার তারিখ (সভা নং: ০২)")}
                  {renderInputField("সভা ০৩ তারিখ (কাজ সমাপ্তি ও চূড়ান্ত বিল)", "meetingDate3", "", "date", "তৃতীয় সভার তারিখ (সভা নং: ০৩)")}
                </div>
                {renderWardCommitteeTable()}
              </div>
            )}

            {activeSection === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {renderInputField("প্রাক্কলন তারিখ", "estimationDate", "", "date")}
                {renderInputField("প্রাক্কলিত মূল্য", "estimatedValue", "যেমন: ১৭৫০০০/-")}
                {renderInputField("কার্যদেশ নং", "tenderWorkOrderNo", "যেমন: ৫")}
                {renderInputField("কার্যদেশ তারিখ", "workOrderDate", "", "date")}
                {renderInputField("চুক্তির তারিখ", "contractDate", "", "date")}
                {renderInputField("চুক্তি মূল্য", "contractValue", "যেমন: ১৭৫০০০/-")}
                {renderInputField("চুক্তির মেয়াদ উত্তীর্ণের তারিখ", "contractExpiryDate", "", "date")}
                {renderInputField("কাজ সম্পাদিত মূল্য", "executedWorkValue", "যেমন: ১৭৫০০০/-")}
                {renderInputField("সময় সীমা", "timeLimit", "যেমন: ৩০ দিন")}
              </div>
            )}

            {activeSection === 4 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {renderInputField("কাজের পরিমাপ", "workMeasurement", "যেমন: দৈর্ঘ্য ৩০মি.   প্রস্থ ৩মি.", "textarea", "কাজের দৈর্ঘ্য, প্রস্থ ও পরিমাপ", "col-span-1 sm:col-span-2 lg:col-span-3")}
                {renderInputField("চেয়ারম্যান প্রত্যয়ন তারিখ", "chairmanDate", "", "date")}
                {renderInputField("প্রকৌশলীর প্রত্যয়ন তারিখ", "supervisionDate", "", "date")}
                {renderInputField("আবেদনের তারিখ", "applicationDate", "", "date")}
              </div>
            )}

            {activeSection === 5 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                {renderInputField(
                  `ভ্যাট${data.vat && (data.contractValue || data.billAmount) ? ` (${calculateBanglaPercentage(data.vat, data.contractValue || data.billAmount)})` : ""}`,
                  "vat",
                  "যেমন: ১০০০/-"
                )}
                {renderInputField(
                  `আয়কর${data.tax && (data.contractValue || data.billAmount) ? ` (${calculateBanglaPercentage(data.tax, data.contractValue || data.billAmount)})` : ""}`,
                  "tax",
                  "যেমন: ৫০০/-"
                )}
                {renderInputField("সর্বমোট কর্তন", "totalDeduction", "যেমন: ১৫০০/-")}
                {renderInputField("নিট প্রদান", "netPayment", "যেমন: ৫০০০০/-")}
                {renderInputField("বিলের পরিমান", "billAmount", "যেমন: ১,৫০,১৪০/-")}
                {renderInputField("বিলের তারিখ", "billDate", "", "date")}
                {renderInputField("ব্যাংক শাখার নাম", "bankBranchName", "যেমন: জনতা ব্যাংক লিমিটেড")}
                {renderInputField("ব্যাংক হিসাব নং", "bankAccountNo", "যেমন: ০১০০০৩৭২৪৯১৫১")}
                {renderInputField("চেক নং", "chequeNo", "যেমন: ১৬৬৭৬৬০")}
                {renderInputField("চেকে টাকার পরিমাণ", "moneyAmount", "যেমন: ১,২৪,৩৬০.৫০/-")}
                {renderInputField("চেক প্রাপ্তির তারিখ", "receiptDate", "", "date")}
              </div>
            )}
          </>
        ) : (
          /* =============================================================== */
          /* GENERAL QUOTATION MODE: 6 SECTIONS                              */
          /* =============================================================== */
          <>
            {activeSection === 1 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                {isProjectCopyActive(data) && (
                  <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 p-3 bg-amber-50 border border-amber-200/90 rounded-xl text-amber-900 text-xs sm:text-sm font-normal flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-normal text-xs shrink-0">কপি প্রকল্প</span>
                      <span>
                        এটি একটি কপি করা প্রকল্প (বাকি আর {toBanglaDigits(String(getCopyRemainingMinutes(data)))} মিনিট — নাম পরিবর্তন করলেও এই কপি ট্যাগটি পুরো ১ ঘণ্টা প্রদর্শিত থাকবে এবং ১ ঘণ্টা পূর্ণ হলে স্বয়ংক্রিয়ভাবে মুছে যাবে)।
                      </span>
                    </div>
                  </div>
                )}
                {renderInputField("প্রকল্প নাম", "projectName", "যেমন: ৪ নং ওয়ার্ডে আরসিসি রাস্তা নির্মাণ", "textarea", "প্রকল্পের পূর্ণ বিবরণ লিখুন", "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4")}
                {renderInputField("প্রকল্প কোড", "projectCode", "যেমন: PRJ-2024-042", "text", "অফিসিয়াল ইউনিক কোড")}
                {renderInputField("প্রকল্প নং", "projectNo", "যেমন: ০৫/২০২৪-২৫", "text", "ক্রমিক নম্বর")}
                {renderInputField("ফাইল নং", "fileNo", "যেমন: ইউপি/উন্নয়ন/২০২৪/১৮", "text", "নথি নম্বর")}
                {renderInputField("চুক্তি মূল্য", "contractValue", "যেমন: ৩,৫০,০০০/-", "text", "টাকার অংক")}
                {renderInputField("চুক্তির তারিখ", "contractDate", "", "date")}
                {renderInputField("কার্যাদেশ তারিখ", "workOrderDate", "", "date")}
                {renderInputField("ফাইল খোলার তারিখ", "fileOpeningDate", "", "date")}
                {renderInputField("ঠিকাদারের নাম", "contractorName", "ঠিকাদার বা প্রতিষ্ঠানের নাম")}
                {renderInputField("অর্থবছর", "fiscalYear", "যেমন: ২০২৪-২০২৫")}
                {renderInputField("ওয়ার্ড নং", "wardNo", "যেমন: ০৩")}
                {renderInputField("সভাপতির নাম", "presidentName", "ইউপি সদস্য / সভাপতি")}
                {renderInputField("ইউনিয়নের নাম", "unionName", "যেমন: ০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ")}
                {renderInputField("উপজেলা", "upazila", "যেমন: গোদাগাড়ী")}
                {renderInputField("জেলা", "district", "যেমন: রাজশাহী")}
                {renderInputField("ঠিকাদারের ঠিকানা", "contractorAddress", "যেমন: ঘোড়ামারা, বোয়ালিয়া, রাজশাহী", "text", undefined, "col-span-1 sm:col-span-2")}
              </div>
            )}

            {activeSection === 2 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4.5">
                {renderInputField("প্রাক্কলনের তারিখ", "estimationDate", "", "date", "প্রাক্কলন তৈরির তারিখ")}
                {renderInputField("প্রাক্কলিত মূল্য", "estimatedValue", "যেমন: ১,৭৪,০০০/-", "text", "প্রাক্কলন অনুযায়ী প্রাক্কলিত মোট ব্যয়")}
                {renderInputField("খাতের নাম", "sectorName", "যেমন: ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল", "text", "বরাদ্দ প্রদানকারী প্রকল্পের খাতের নাম")}
                {renderInputField("বরাদ্দ পরিমাণ", "allocationAmount", "যেমন: ১,৭৪,০০০/-", "text", "প্রকল্পে অনুমোদিত বরাদ্দের পরিমাণ")}
              </div>
            )}

            {activeSection === 3 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                {renderInputField("দাতা প্রতিষ্ঠানের নাম সমূহ", "donorAgency", "যেমন: স্থানীয় সরকার বিভাগ (LGD) - উন্নয়ন সহায়তা তহবিল", "text", undefined, "col-span-1 sm:col-span-2")}
                {renderInputField("সময় সীমা", "timeLimit", "যেমন: ৩০ দিন বা ৬০ দিন")}
                {renderInputField("ঠিকাদার ও তার প্রতিষ্ঠান", "contractorAndFirm", "বারাকাত ডেভেলপমেন্ট (প্রোপ্রাইটর: মোসাঃ জেসমিন আরা)", "text", undefined, "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4")}
                {renderInputField("দরপত্র বিজ্ঞপ্তি নং", "tenderNoticeNo", "০১")}
                {renderInputField("দরপত্র বিজ্ঞপ্তি তারিখ", "tenderNoticeDate", "", "date")}
                {renderInputField("দরপত্র বিক্রয়ের শেষ তারিখ", "tenderSellingLastDate", "", "date")}
                {renderInputField("দরপত্র দাখিলের শেষ তারিখ", "tenderSubmissionLastDate", "", "date")}
                {renderInputField("দরপত্র খোলার তারিখ ও সময়", "tenderOpeningDateTime", "যেমন: ১৫/১০/২০২৬ সময়: ২.৩০ ঘটিকা")}
                {renderInputField("দরপত্র মূল্যায়নের তারিখ", "tenderEvaluationDate", "", "date")}
                {renderInputField("উদ্ধৃত দর", "quotedPrice", "যেমন: ১,৭৪,০০০/-")}
                {renderInputField("সর্বনিম্ন দর", "lowestPrice", "যেমন: ১,৭৪,০০০/-")}
                {renderInputField("কার্যাদেশ নং", "tenderWorkOrderNo", "০১")}
                {renderInputField("কার্যাদেশ তারিখ", "tenderWorkOrderDate", "", "date")}
                {renderInputField("চুক্তির তারিখ", "agreementDate", "", "date")}
                {renderInputField("চুক্তি মূল্য", "tenderContractPrice", "যেমন: ১,৭৪,০০০/-")}
                {renderInputField("চুক্তির মেয়াদ উত্তীর্ণের তারিখ", "contractExpiryDate", "", "date")}
                {renderInputField("কাজ সম্পাদিত মূল্য", "executedWorkValue", "যেমন: ১,৭৪,০০০/-")}

                {/* Dynamic Competitor Bidders for Tender Opening Sheet (Template 3) */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 pt-5 border-t border-slate-200">
                  {renderTenderOpeningTable()}
                </div>

                {/* Dynamic Tender Comparative Evaluation Table for Template 4 */}
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4 pt-5 border-t border-slate-200">
                  {renderTenderEvaluationTable()}
                </div>
              </div>
            )}

            {activeSection === 4 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4.5">
                  {renderInputField("সভা নং", "meetingNo", "যেমন: ০১, ০২ বা ০৩")}
                  {renderInputField("সভার সময়", "meetingTime", "যেমন: সকাল ১০.০০ ঘটিকা", "text", "কমিটি সভা অনুষ্ঠানের সময়")}
                  {renderInputField("সভার স্থান", "meetingPlace", "যেমন: ইউপি কার্যালয়")}
                  {renderInputField("সভা ০১ তারিখ (দরপত্র মূল্যায়ন ও কার্যাদেশ)", "meetingDate1", "", "date", "প্রথম সভার তারিখ (দরপত্র মূল্যায়ন ও কার্যাদেশ অনুমোদন)")}
                  {renderInputField("সভা ০২ তারিখ (কাজ আরম্ভ ও প্রস্তুতি)", "meetingDate2", "", "date", "দ্বিতীয় সভার তারিখ (কাজ আরম্ভ ও সাইট পরিদর্শন)")}
                  {renderInputField("সভা ০৩ তারিখ (কাজ সমাপ্তি ও চূড়ান্ত বিল)", "meetingDate3", "", "date", "তৃতীয় সভার তারিখ (কাজ সমাপ্তি ও চূড়ান্ত বিল অনুমোদন)")}
                </div>
                {renderWardCommitteeTable()}
              </div>
            )}

            {activeSection === 5 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                  {renderInputField("ব্যাংকের নাম", "bankName", "যেমন: সোনালী ব্যাংক পিএলসি")}
                  {renderInputField("ব্যাংক শাখার নাম", "bankBranchName", "যেমন: সদর শাখা")}
                  {renderInputField("চেক নং", "chequeNo", "যেমন: CD-7821903")}
                  {renderInputField("চেকের তারিখ", "chequeDate", "", "date")}
                  {renderInputField("চেক স্বাক্ষরকারীগণ/সদস্যদের নাম", "chequeSignatories", "চেয়ারম্যান ও ইউপি সচিব", "text", undefined, "col-span-1 sm:col-span-2")}
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/60 via-slate-50/60 to-indigo-50/40 border border-blue-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-base sm:text-lg font-normal text-blue-900">
                      বিল ও কর্তনের আর্থিক বিবরণী (স্বয়ংক্রিয় গণনাসহ)
                    </h4>
                    <button
                      type="button"
                      onClick={handleAutoCalculateFinancials}
                      className="text-sm sm:text-base font-normal text-blue-600 hover:text-blue-800 underline underline-offset-2 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calculator className="w-4 h-4" />
                      <span>ক্যালকুলেট করুন</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {renderInputField("বিলের পরিমাণ", "billAmount", "যেমন: ৩,৪৮,৫০০")}
                    {renderInputField(
                      `ভ্যাট কর্তন${data.vat && (data.contractValue || data.billAmount) ? ` (${calculateBanglaPercentage(data.vat, data.contractValue || data.billAmount)})` : ""}`,
                      "vat",
                      "যেমন: ২৫,৭৬৩"
                    )}
                    {renderInputField(
                      `আয়কর কর্তন${data.tax && (data.contractValue || data.billAmount) ? ` (${calculateBanglaPercentage(data.tax, data.contractValue || data.billAmount)})` : ""}`,
                      "tax",
                      "যেমন: ১৭,৪২৫"
                    )}
                    {renderInputField(
                      `জামানতের পরিমাণ${data.securityDeposit && (data.contractValue || data.billAmount) ? ` (${calculateBanglaPercentage(data.securityDeposit, data.contractValue || data.billAmount)})` : ""}`,
                      "securityDeposit",
                      "যেমন: ৩৪,৮৫০"
                    )}
                    {renderInputField("সর্বমোট কর্তন", "totalDeduction", "যেমন: ৭৮,০৩৮", "text", "ভ্যাট + ট্যাক্স + জামানত")}
                    {renderInputField("টাকার পরিমাণ", "moneyAmount", "যেমন: ৩,৪৮,৫০০")}
                    {renderInputField("নিট প্রদান", "netPayment", "যেমন: ২,৭০,৪৬২", "text", "বিল - মোট কর্তন")}
                    {renderInputField("কিস্তি নং", "installmentNo", "যেমন: ১ম ও চূড়ান্ত বিল")}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                  {renderInputField("বিলের তারিখ", "billDate", "", "date")}
                  {renderInputField("প্রাপ্তির তারিখ", "receiptDate", "", "date")}
                  {renderInputField("তারিখ", "financialDate", "", "date")}
                </div>
              </div>
            )}

            {activeSection === 6 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4.5">
                {renderInputField("মালামালের বিবরণ", "materialsDescription", "রড, সিমেন্ট, সিলেট বালু, লোকাল বালু, পাথরের কুচি ইত্যাদি", "textarea", "ব্যবহৃত বা প্রাক্কলিত মালামালের বর্ণনা", "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4")}
                {renderInputField("কাজের পরিমাপ", "workMeasurement", "দৈর্ঘ্য: ১২০ মিটার, প্রস্থ: ৩.০৫ মিটার, গভীরতা: ০.১৫ মিটার (মোট ৫৪.৯ ঘনমিটার)", "textarea", "প্রকৌশল পরিমাপ ও মাত্রা", "col-span-1 sm:col-span-2 lg:col-span-3 xl:col-span-4")}
                {renderInputField("শ্রমিকের নাম", "laborName", "হেড মিস্ত্রি ও শ্রমিক দলের প্রতিনিধি")}
                {renderInputField("পদবী", "finalDesignation", "উপ-সহকারী প্রকৌশলী / তদারককারী")}
                {renderInputField("সুপারভিশন তারিখ", "supervisionDate", "", "date")}
                {renderInputField("চেয়ারম্যান তারিখ", "chairmanDate", "", "date")}
                {renderInputField("আবেদনের তারিখ", "applicationDate", "", "date")}
                {renderInputField("আবেদন সুপারিশ তারিখ", "applicationRecommendDate", "", "date")}
              </div>
            )}
          </>
        )}

        {/* Navigation buttons at bottom */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between pt-6 mt-6 border-t border-slate-200 gap-3">
          <button
            type="button"
            disabled={activeSection === 1}
            onClick={() => setActiveSection(Math.max(1, activeSection - 1))}
            className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm sm:text-base font-normal rounded-xl border border-slate-300 hover:border-blue-400 hover:bg-blue-50/50 text-slate-700 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer order-2 sm:order-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>পূর্ববর্তী পাতা</span>
          </button>

          <div className="flex items-center gap-2.5 order-1 sm:order-2 justify-end flex-wrap">
            {activeSection < maxSection ? (
              <>
                <button
                  type="button"
                  onClick={onSubmitAndGoToTemplates}
                  disabled={isSubmitting}
                  title="বর্তমান তথ্য ডাটাবেজে আপডেট করুন ও টেমপ্লেট দেখুন"
                  className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm sm:text-base font-normal rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                      <span>আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>আপডেট করুন</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveSection(Math.min(maxSection, activeSection + 1))}
                  className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm sm:text-base font-normal rounded-xl text-white transition-colors cursor-pointer ${
                    isPic
                      ? "bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-700 hover:to-emerald-800"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  }`}
                >
                  <span>পরবর্তী পাতা</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={onSubmitAndGoToTemplates}
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 px-6 py-2.5 text-sm sm:text-base font-normal rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full" />
                    <span>ডাটাবেজে সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>আপডেট ও টেমপ্লেট দেখুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
