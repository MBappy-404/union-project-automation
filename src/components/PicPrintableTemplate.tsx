"use client";

import React from "react";
import {
  ProjectData,
  WardCommitteeMember,
  DEFAULT_PIC_COMMITTEE_MEMBERS,
} from "@/types/project";
import { TemplateMeta } from "@/types/templates";
import {
  numberToBanglaWords,
  toBanglaDigits,
  formatBanglaCurrency,
  formatBanglaDate,
} from "@/lib/banglaUtils";

interface PicPrintableTemplateProps {
  template: TemplateMeta;
  data: ProjectData;
  onPrint: () => void;
}

export const PicPrintableTemplate: React.FC<PicPrintableTemplateProps> = ({
  template,
  data,
}) => {
  // Dynamic PIC committee members list (fallback to 5 default PIC members if empty, with president auto-synced)
  const rawMembers = data.wardCommitteeMembers || [];
  const hasFilledMembers = rawMembers.some(
    (m) => m.name && m.name.trim() !== ""
  );
  const baseCommitteeList: WardCommitteeMember[] = hasFilledMembers
    ? rawMembers
    : DEFAULT_PIC_COMMITTEE_MEMBERS;

  const presidentName = data.president || data.presidentName || "";

  const committeeList: WardCommitteeMember[] = [
    {
      name: presidentName,
      fatherName: baseCommitteeList[0]?.fatherName || "",
      designation: data.designation || baseCommitteeList[0]?.designation || "",
      committeeRole: data.committeeDesignation || "সভাপতি",
      village: data.village || baseCommitteeList[0]?.village || "",
    },
    ...baseCommitteeList.slice(1),
  ];

  // Helper: Bengali digits with fallback
  const fallback = (val?: string, placeholder: string = "................................") => {
    if (!val || val.trim() === "") return placeholder;
    return toBanglaDigits(val);
  };

  // Helper: Bengali date DD/MM/YYYY
  const formatDate = (val?: string, placeholder: string = "১১/০৩/২০২৬") => {
    return formatBanglaDate(val, placeholder);
  };

  // Helper: Bengali currency (e.g., ১,৫০,১৪০/-)
  const formatMoney = (val?: string, placeholder: string = "১,৫০,১৪০/-") => {
    if (!val || val.trim() === "") return placeholder;
    return formatBanglaCurrency(val, { fallbackPlaceholder: placeholder });
  };

  // Helper: Bengali words without trailing "টাকা মাত্র" duplication
  const getWordsClean = (amount?: string, customWords?: string, defaultAmount: string = "১,৫০,১৪০/-") => {
    const effective = amount && amount.trim() !== "" ? amount : defaultAmount;
    const computed =
      customWords && customWords.trim() !== ""
        ? customWords
        : numberToBanglaWords(effective) || "এক লক্ষ পঞ্চাশ হাজার একশত চল্লিশ টাকা মাত্র";
    return computed.replace(/\s*টাকা\s*মাত্র\s*$/g, "").replace(/\s*টাকা\s*$/g, "").trim();
  };

  // Common PIC Dynamic Values
  const rawUnion = fallback(data.unionName, "০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ");
  const unionVal = rawUnion.replace(/,\s*গোদাগাড়ী.*$/g, "").trim() || "০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ";
  const unionShortVal = unionVal.replace(/^[০-৯0-9]+\s*নং\s*/, "");
  const upazilaVal = fallback(data.upazila, "গোদাগাড়ী");
  const districtVal = fallback(data.district, "রাজশাহী");
  const projectVal = fallback(
    data.projectName,
    "দক্ষিণ বালিয়াঘাট্টা আমিনুলের বাড়ি হতে শাহিনের বাড়ি পর্যন্ত রাস্তা বালি ভরাট, ছলিং ও সিঁড়ি নির্মাণ"
  );
  const fiscalYearVal = fallback(data.fiscalYear, "২০২৬-২০২৭");
  const sectorVal = fallback(data.sectorName, "স্থাবর সম্পত্তি হস্তান্তর কর ১%");
  const wardVal = fallback(data.wardNo, "০২");
  const villageVal = fallback(data.village, "দক্ষিণ বালিয়াঘাট্টা");
  const currentPresident = committeeList[0]?.name || data.presidentName || data.president || "";
  const presidentVal = fallback(currentPresident, "................................");
  const designationVal = fallback(data.designation, "ইউপি সদস্য");
  const meetingTimeVal = fallback(data.meetingTime, "সকাল ১০.০০ ঘটিকা");
  const meetingPlaceVal = fallback(data.meetingPlace, "ইউনিয়ন পরিষদ কার্যালয়");
  const meetingDate1Val = formatDate(data.meetingDate1 || data.meetingDate, "১১/০৩/২০২৬");
  const meetingDate2Val = formatDate(
    data.meetingDate2 ||
      (data.workOrderDate && data.workOrderDate !== (data.meetingDate1 || data.meetingDate)
        ? data.workOrderDate
        : ""),
    "৩০/০৬/২০২৬"
  );
  const meetingDate3Val = formatDate(
    data.meetingDate3 ||
      (data.billDate &&
      data.billDate !== (data.meetingDate1 || data.meetingDate) &&
      data.billDate !== (data.meetingDate2 || "")
        ? data.billDate
        : ""),
    "০৫/১১/২০২৬"
  );
  const contractDateVal = formatDate(data.contractDate || data.agreementDate, "১১/০৩/২০২৬");
  const estimationDateVal = formatDate(data.estimationDate, "১৮/০৪/২০২৬");
  const memoVal = fallback(data.fileNo, "৪৬.৮৩.৮১.৩৪.০২২.০১.০০০.২৪-");

  const rawEstimated =
    data.estimatedValue && data.estimatedValue.trim() !== ""
      ? data.estimatedValue
      : data.allocationAmount && data.allocationAmount.trim() !== ""
      ? data.allocationAmount
      : data.contractValue && data.contractValue.trim() !== ""
      ? data.contractValue
      : data.billAmount && data.billAmount.trim() !== ""
      ? data.billAmount
      : "১,৫০,১৪০/-";

  const estimatedVal = formatMoney(rawEstimated, "১,৫০,১৪০/-");
  const estimatedWordsOnly = getWordsClean(
    rawEstimated,
    data.estimatedValueInWords || data.contractValueInWords,
    "১,৫০,১৪০/-"
  );

  const rawBillAmount =
    data.billAmount && data.billAmount.trim() !== ""
      ? data.billAmount
      : rawEstimated;
  const billVal = formatMoney(rawBillAmount, "১,৫০,১৪০/-");
  const billWordsOnly = getWordsClean(
    rawBillAmount,
    data.billAmountInWords || data.estimatedValueInWords,
    "১,৫০,১৪০/-"
  );

  // Net Payment Value & Words for PIC Certificates (Templates 9, 10, 12, 13, 14, 16)
  const rawNetPay =
    data.netPayment && data.netPayment.trim() !== ""
      ? data.netPayment
      : data.moneyAmount && data.moneyAmount.trim() !== ""
      ? data.moneyAmount
      : "১,২৪,৩৬০.৫/-";
  const netPayVal = rawNetPay.includes(".")
    ? toBanglaDigits(rawNetPay.endsWith("/-") ? rawNetPay : `${rawNetPay}/-`)
    : formatMoney(rawNetPay, "১,২৪,৩৬০.৫/-");
  const netPayWords =
    data.netPaymentInWords && data.netPaymentInWords.trim() !== ""
      ? data.netPaymentInWords.replace(/\s*মাত্র\s*$/g, "").trim()
      : rawNetPay.includes("১২৪৩৬০.৫") || rawNetPay.includes("১,২৪,৩৬০.৫") || rawNetPay.includes("124360.5")
      ? "এক লক্ষ চব্বিশ হাজার তিনশত ষাট টাকা পঞ্চাশ পয়সা"
      : (numberToBanglaWords(rawNetPay) || "এক লক্ষ চব্বিশ হাজার তিনশত ষাট টাকা পঞ্চাশ পয়সা")
          .replace(/\s*মাত্র\s*$/g, "")
          .trim();

  const isLandscape = template.orientation === "landscape";

  // Inject @page rule for A4 printing with 20% top blank space (59.4mm of 297mm portrait, 42mm of 210mm landscape)
  React.useEffect(() => {
    let styleTag = document.getElementById("print-page-orientation") as HTMLStyleElement | null;
    if (!styleTag) {
      styleTag = document.createElement("style");
      styleTag.id = "print-page-orientation";
      document.head.appendChild(styleTag);
    }
    if (isLandscape) {
      styleTag.innerHTML = `
        @page {
          size: A4 landscape;
          margin: 42mm 14mm 12mm 14mm;
        }
      `;
    } else {
      styleTag.innerHTML = `
        @page {
          size: A4 portrait;
          margin: 59.4mm 16mm 14mm 16mm;
        }
      `;
    }
    return () => {
      if (styleTag && document.head.contains(styleTag)) {
        styleTag.innerHTML = "";
      }
    };
  }, [isLandscape]);

  return (
    <div className="bg-white border border-neutral-300 rounded-xl shadow-xs overflow-hidden transition-colors print:border-none print:shadow-none print:rounded-none print:p-0 print:m-0 print:bg-white print:overflow-visible">
      {/* Top Action Toolbar (Hidden in Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-emerald-50/50 no-print gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-emerald-700 text-white font-normal">
            {template.code}
          </span>
          <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 font-normal">
            পিআইসি (PIC) টেমপ্লেট
          </span>
          <h3 className="text-[15.5px] sm:text-base font-normal text-neutral-900 leading-relaxed">
            {template.titleBn}
          </h3>
        </div>
      </div>

      {/* The Printable A4 Document Sheet */}
      <div className="p-4 sm:p-8 bg-neutral-100 overflow-x-auto flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
        {isLandscape ? (
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @page {
                size: A4 landscape;
                margin: 42mm 14mm 12mm 14mm;
              }
            `,
            }}
          />
        ) : (
          <style
            dangerouslySetInnerHTML={{
              __html: `
              @page {
                size: A4 portrait;
                margin: 59.4mm 16mm 14mm 16mm;
              }
            `,
            }}
          />
        )}
        <div
          id="printable-template-document"
          className={`w-full ${
            isLandscape
              ? "max-w-[297mm] min-h-[210mm] p-6 sm:p-12"
              : "max-w-[210mm] min-h-[297mm] p-8 sm:p-14"
          } bg-white text-black shadow-sm border border-neutral-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-[15.5px] font-sans font-normal leading-relaxed`}
        >
          {/* ========================================================================= */}
          {/* PIC-01: ১. প্রাক্কলন প্রস্তুত প্রসঙ্গে উপ-প্রকৌশলী বরাবর পত্র (ইউপি প্যাড)    */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-01" && (
            <div className="space-y-5 pt-2">
              {/* Subject */}
              <div className="text-[16px] leading-relaxed">
                বিষয়: {fiscalYearVal} অর্থ বছরের গৃহীত প্রকল্পের প্রাক্কলন প্রস্তুত প্রসঙ্গে।
              </div>

              {/* Body Paragraph 1 */}
              <div className="text-justify leading-[1.9] pt-2">
                উপযুক্ত বিষয়ের পরিপ্রেক্ষিতে জানানো যাচ্ছে যে, {unionVal}ের {fiscalYearVal} অর্থ বছরের {sectorVal} খাতের আওতায় “{projectVal}” প্রকল্প গ্রহণ করা হয়েছে।
              </div>

              {/* Body Paragraph 2 */}
              <div className="text-justify leading-[1.9] pt-1">
                উক্ত প্রকল্পের প্রাক্কলন প্রস্তুতের লক্ষ্যে অনুষ্ঠিত সভার কার্যবিবরণী আপনার কার্যালয়ে প্রেরণ করা হলো। বর্ণিত প্রকল্পের প্রাক্কলন ও সিডিউল দ্রুত প্রস্তুত করে প্রয়োজনীয় ব্যবস্থা গ্রহণের জন্য আপনাকে অনুরোধ করা হলো।
              </div>

              {/* Recipient Block */}
              <div className="pt-8 space-y-3 leading-relaxed">
                <div>প্রাপক:</div>
                <div>উপ-প্রকৌশলী</div>
                <div>
                  {upazilaVal}, {districtVal}।
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-02: ২. প্রকল্প বাস্তবায়ন কমিটি সভার কার্যবিবরণী (সভা নং: ০১ — কাজ আরম্ভ) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-02" && (
            <div className="space-y-3 pt-1 text-[15px]">
              {/* Title */}
              <div className="text-center pb-2">
                <h1 className="text-[20px] sm:text-[21px] font-normal">
                  প্রকল্প বাস্তবায়ন কমিটি সভার কার্যবিবরণী
                </h1>
              </div>

              {/* Meeting Meta Info */}
              <div className="space-y-1.5 leading-relaxed">
                <div>সভা নং: ০১</div>
                <div>স্থান: {meetingPlaceVal}</div>
                <div>সভার তারিখ: {meetingDate1Val} ও সময়: {meetingTimeVal}</div>
                <div>
                  সভাপতির নাম: {presidentVal} , {designationVal}, {unionVal}, {upazilaVal}, {districtVal} ।
                </div>
              </div>

              {/* Committee Attendance Table */}
              <div className="pt-1">
                <table className="w-full border-collapse border border-black text-[14.5px]">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-1 text-left font-normal w-[65px]">
                        ক্র. নং
                      </th>
                      <th className="border border-black px-2.5 py-1 text-left font-normal">
                        নাম
                      </th>
                      <th className="border border-black px-2.5 py-1 text-left font-normal">
                        পদবি
                      </th>
                      <th className="border border-black px-2.5 py-1 text-left font-normal">
                        গ্রাম
                      </th>
                      <th className="border border-black px-2.5 py-1 text-left font-normal">
                        কমিটি পদবি
                      </th>
                      <th className="border border-black px-2.5 py-1 text-left font-normal w-[130px]">
                        স্বাক্ষর
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((member, idx) => {
                      const serialBn = toBanglaDigits(
                        String(idx + 1).padStart(2, "0")
                      );
                      return (
                        <tr key={idx} className="h-9">
                          <td className="border border-black px-2 py-1 align-middle">
                            {serialBn}।
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.name, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.designation, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.village || data.village, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.committeeRole, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Agenda Section */}
              <div className="space-y-2 pt-1 leading-[1.8] text-justify">
                <div>আলোচ্য বিষয়ঃ</div>
                <div>১। পূর্ববর্তী সভার সিদ্ধান্ত পঠন ও অনুমোদন।</div>
                <div>
                  ২। {fiscalYearVal} অর্থ বছরের {sectorVal} হতে গৃহীত {unionShortVal}ের {projectVal} করা ও সভাপতির একক স্বাক্ষরে বিল উত্তোলন প্রসঙ্গে।
                </div>
                <div>৩। বিবিধ</div>
              </div>

              {/* Discussion & Resolution */}
              <div className="space-y-3 pt-2 leading-[1.85] text-justify">
                <div>
                  অদ্যকার সভার ইউপি সদস্য ও প্রকল্প সভাপতি {presidentVal} এর সভাপতিত্বে সভার কাজ শুরু করা হয়। ১নং বিষয়ের আলোচনায় পূর্ববর্তী সভার সিদ্ধান্ত পঠন ও অন্তে অনুমোদন করা হল।
                </div>

                <div>
                  ২নং বিষয়ে আলোচনার সভাপতি সাহেব জানান যে, {fiscalYearVal} অর্থ বছরের {sectorVal} হতে গৃহীত {projectVal} প্রকল্পের জন্য {estimatedVal} টাকা বরাদ্দ পাওয়া গিয়াছে। উক্ত বরাদ্দকৃত অর্থ দ্বারা গৃহিত প্রকল্পের কাজ আরাম্ভ করা ও বাস্তবায়ন করতে হবে। সভাপতি সাহেবের প্রস্তাবের উপর বিস্তারিত আলোচনা ও পর্যালোচনা অন্তে নিম্নলিখিত সিদ্ধান্ত গৃহিত হল।
                </div>

                <div>
                  সিদ্ধান্তঃ সভাপতি সাহেবের প্রস্তাবের উপর সকল সদস্যদের ঐক্যমত্যের ভিত্তিতে সভাপতিকে প্রকল্পের কাজ আরম্ভ করা, বাস্তবায়ন ও একক স্বাক্ষরে বিল উত্তোলনের জন্য সর্ব সম্মতিক্রমে সিদ্ধান্ত গ্রহিত হল।
                </div>

                <div>
                  বিবিধ বিষয়ে আর কোন আলোচনা না থাকায় সভাপতি মহোদয় সকল সদস্যকে ধন্যবাদ দিয়া সভার সমাপ্তি ঘোষনা করেন।
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-03: ৩. প্রকল্প বাস্তবায়ন কমিটি সভার কার্যবিবরণী (সভা নং: ০২ — বিল ও টাকা উত্তোলন) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-03" && (
            <div className="space-y-2.5 pt-1 text-[15px]">
              {/* Title */}
              <div className="text-center pb-2">
                <h1 className="text-[19px] sm:text-[20px] font-normal">
                  প্রকল্প বাস্তবায়ন কমিটি সভার কার্যবিবরণী
                </h1>
              </div>

              {/* Meeting Meta Info */}
              <div className="space-y-1 leading-relaxed">
                <div>সভা নং: ০২</div>
                <div>স্থান: {meetingPlaceVal}</div>
                <div>সভার তারিখ: {meetingDate2Val} খ্রি. ও সময়: {meetingTimeVal}</div>
                <div>
                  সভাপতির নাম: {presidentVal}, {designationVal}, {unionVal}, {upazilaVal}, {districtVal}।
                </div>
                <div>সভায় উপস্থিত সদস্যগণের উপস্থিতি তালিকা:</div>
              </div>

              {/* Double-framed Committee Attendance Table (matching Image 5) */}
              <div className="pt-0.5">
                <table className="w-full border-separate border-spacing-[2px] border border-black p-[2px] text-[14px]">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-1 text-center font-normal w-[60px]">
                        ক্র. নং
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        নাম
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        পদবি
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        গ্রাম
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        কমিটি পদবি
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal w-[125px]">
                        স্বাক্ষর
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((member, idx) => {
                      const serialBn = toBanglaDigits(
                        String(idx + 1).padStart(2, "0")
                      );
                      return (
                        <tr key={idx} className="h-9">
                          <td className="border border-black px-2 py-1 align-middle">
                            {serialBn}।
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.name, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.designation, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.village || data.village, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.committeeRole, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Agenda Section */}
              <div className="space-y-1 pt-1 leading-[1.75] text-justify">
                <div>আলোচ্য বিষয়:</div>
                <div>১. পূর্ববর্তী সভার সিদ্ধান্ত পঠন ও অনুমোদন।</div>
                <div>
                  ২. {fiscalYearVal} অর্থ বছরের {sectorVal} হতে গৃহীত {unionShortVal}ের {projectVal} প্রকল্পের টাকা উত্তোলন প্রসঙ্গে।
                </div>
                <div>৩. বিবিধ।</div>
              </div>

              {/* Discussion & Resolution */}
              <div className="space-y-2 pt-1 leading-[1.8] text-justify">
                <div className="pl-2">আলোচনা ও সিদ্ধান্ত:</div>
                <div>
                  অদ্যকার সভায় ইউপি সদস্য ও প্রকল্প সভাপতি {presidentVal} এর সভাপতিত্বে সভার কাজ শুরু করা হয়।
                </div>

                <ul className="list-disc pl-9 space-y-1.5">
                  <li>
                    ১নং বিষয়ের আলোচনা: পূর্ববর্তী সভার সিদ্ধান্ত পঠন ও অদ্যে অনুমোদন করা হলো।
                  </li>
                  <li>
                    ২নং বিষয়ের আলোচনা: সভাপতি সাহেব জানান যে, {fiscalYearVal} অর্থ বছরের {sectorVal} হতে গৃহীত {projectVal} প্রকল্পের জন্য {estimatedVal} টাকা বরাদ্দ পাওয়া গিয়েছে। উক্ত বরাদ্দকৃত অর্থ দ্বারা গৃহিত প্রকল্পের কাজ প্রাক্কলন মোতাবেক শতভাগ সমাপ্ত করা হয়েছে। উক্ত প্রকল্পের বিল ভাউচার পরীক্ষা নিরীক্ষা অদ্যে অনুমোদনের জন্য উপস্থাপন করা হলো।
                  </li>
                </ul>

                <div className="pt-1">
                  সিদ্ধান্ত: অদ্যকার সভায় সকল ভাউচার পরীক্ষা নিরীক্ষা অদ্যে সঠিক আছে এবং কাজ শতভাগ সম্পূর্ণ হয়েছে বিধায় বিল ভাউচার অনুমোদন পূর্বক সভাপতির অনুকূলে বাস্তবায়িত প্রকল্পের {estimatedVal} টাকা সভাপতির অনুকূলে প্রদান ও উত্তোলন করার জন্য সভায় সিদ্ধান্ত গৃহিত হলো।
                </div>

                <div>
                  বিবিধ বিষয়ে আর কোনো আলোচনা না থাকায় সভাপতি মহোদয় সকল সদস্যকে ধন্যবাদ দিয়ে সভার সমাপ্তি ঘোষণা করেন।
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-04: ৪. প্রকল্প বাস্তবায়ন চুক্তিপত্র (১ম পাতা — প্রকল্পের বিবরণ ও পরিচিতি) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-04" && (
            <div className="space-y-6 pt-4">
              {/* Main Title */}
              <div className="text-center">
                <h1 className="text-[22px] sm:text-[24px] font-normal tracking-wide">
                  প্রকল্প বাস্তবায়ন চুক্তিপত্র
                </h1>
              </div>

              {/* 1st Party & 2nd Party Columns */}
              <div className="grid grid-cols-2 gap-6 text-center pt-3 pb-4 leading-relaxed">
                <div className="space-y-1">
                  <div>১ম পক্ষ</div>
                  <div>চেয়ারম্যান</div>
                  <div>{unionVal}</div>
                  <div>
                    ডাকঘর: বাসুদেবপুর, উপজেলা: {upazilaVal}, জেলা: {districtVal}।
                  </div>
                </div>
                <div className="space-y-1">
                  <div>২য় পক্ষ</div>
                  <div>সভাপতি</div>
                  <div>প্রকল্প বাস্তবায়ন কমিটি</div>
                </div>
              </div>

              {/* Opening Agreement Statement */}
              <div className="text-justify leading-[1.85] pt-2">
                অদ্য {contractDateVal} খ্রি. তারিখে {unionVal} কার্যালয়ে ১ম পক্ষ (চেয়ারম্যান) এবং ২য় পক্ষ (প্রকল্প সভাপতি)-এর মধ্যে সর্বসম্মতিক্রমে নিম্নবর্ণিত শর্ত সাপেক্ষে এই প্রকল্প বাস্তবায়ন চুক্তিপত্র সম্পাদিত হলো:
              </div>

              {/* Section 1: Project Details */}
              <div className="space-y-3 pt-2">
                <div className="text-[16.5px] font-normal">
                  ১. প্রকল্পের বিবরণ ও পরিচিতি:
                </div>

                <ul className="list-disc pl-9 space-y-2.5 leading-[1.85]">
                  <li>
                    <span>প্রকল্পের নাম: </span>
                    <span>{projectVal}।</span>
                  </li>
                  <li>
                    <span>অর্থায়নের খাত: </span>
                    <span>
                      অর্থ বছরের {sectorVal}
                      {sectorVal.includes("১%") && !sectorVal.includes("শতাংশ")
                        ? " (এক শতাংশ)"
                        : ""}{" "}
                      অর্থায়নে।
                    </span>
                  </li>
                  <li>
                    <span>মোট অনুমোদিত প্রাক্কলিত ব্যয়: </span>
                    <span>
                      {estimatedVal} ({estimatedWordsOnly}) টাকা মাত্র।
                    </span>
                  </li>
                  <li>
                    <span>প্রকল্পের স্থান: </span>
                    <span>
                      {villageVal} ({wardVal} নং ওয়ার্ড), {unionVal}, {upazilaVal}, {districtVal}।
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-05: ৫. প্রকল্প বাস্তবায়ন চুক্তিপত্র (২য় পাতা — চুক্তির শর্তাবলী)        */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-05" && (
            <div className="space-y-5 pt-4">
              <div className="text-[17px] font-normal">
                ২. চুক্তির শর্তাবলী (নীতিমালা ও সচিবালয় নির্দেশমালা অনুযায়ী):
              </div>

              <div className="space-y-4 text-justify leading-[1.85] pt-1">
                <div>
                  ১. প্রাক্কলন ও সিডিউল অনুসরণ: ২য় পক্ষ (প্রকল্প সভাপতি) অনুমোদিত প্রাক্কলন (Estimate), নকশা ও কারিগরি সিডিউল শতভাগ অনুসরণ করে প্রকল্পের কাজ সম্পন্ন করতে বাধ্য থাকবেন।
                </div>

                <div>
                  ২. গুণগত মান নিশ্চিতকরণ: কাজের মান কোনো অবস্থাতেই নিম্নমানের হওয়া চলবে না। ব্যবহৃত সামগ্রীর গুণগত মান পরিদর্শনের সময় সন্তোষজনক হতে হবে।
                </div>

                <div>
                  ৩. সময়সীমা: কার্যাদেশ প্রাপ্তির তারিখ হতে শুরু করে নির্ধারিত সময়ের মধ্যে ২য় পক্ষ কাজ শেষ করতে বাধ্য থাকিবেন।
                </div>

                <div>
                  ৪. তদারকি ও পরিদর্শন: ১ম পক্ষ বা ইউপি কর্তৃক গঠিত তদারকি দল/উপজেলা উপ-প্রকৌশলী সরজমিনে নির্মাণ কাজ পরিদর্শন করবেন এবং কোনো ত্রুটি পরিলক্ষিত হলে ২য় পক্ষ নিজ খরচে তা সংশোধন করতে বাধ্য থাকিবেন।
                </div>

                <div>
                  ৫. বিল পরিশোধ ও সরকারি কর: কাজ শতভাগ সন্তোষজনকভাবে সম্পন্ন হওয়ার পর ২য় পক্ষ বিলের জন্য আবেদন করবেন। প্রস্তুতকৃত বিল হতে সরকারি বিধি অনুযায়ী ভ্যাট (VAT) ও আয়কর (Tax) কর্তনপূর্বক অবশিষ্ট নিট টাকা চেকের মাধ্যমে (একাউন্ট পে) পরিশোধ করা হবে।
                </div>

                <div>
                  ৬. অতিরিক্ত ব্যয় ও আর্থিক দায়: চুক্তিভিত্তিক মোট অনুমোদিত প্রাক্কলনের ({estimatedVal} টাকা) অতিরিক্ত কোনো আর্থিক দাবি ১ম পক্ষ গ্রহণ করবে না। অতিরিক্ত ব্যয়ের দায় ২য় পক্ষকেই বহন করতে হবে।
                </div>

                <div>
                  ৭. চুক্তি বাতিল ও জরিমানা: ২য় পক্ষ চুক্তির কোনো শর্ত লঙ্ঘন করলে বা নির্ধারিত সময়ে যৌক্তিক কারণ ছাড়া কাজ সম্পন্ন করতে ব্যর্থ হলে ১ম পক্ষ কারণ দর্শানো ব্যতিরেকে চুক্তি বাতিল ও প্রয়োজনীয় আইনি ব্যবস্থা গ্রহণ করার অধিকার সংরক্ষণ করেন।
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-06: ৬. প্রকল্প বাস্তবায়ন চুক্তিপত্র (৩য় পাতা — অঙ্গীকারনামা ও স্বাক্ষরসমূহ) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-06" && (
            <div className="space-y-6 pt-2 text-[15.5px]">
              <div className="text-[16.5px] font-normal">
                ৩. অঙ্গীকারনামা:
              </div>

              <div className="text-justify leading-[1.9]">
                আমরা উভয় পক্ষ চুক্তিপত্রের যাবতীয় শর্তাবলী পাঠ করে ও ভালোভাবে বুঝে স্বেচ্ছায়, স্বজ্ঞানে এবং অন্যের প্ররোচনা ব্যতিরেকে অদ্য চুক্তিপত্রে নিজ নিজ স্বাক্ষর প্রদান করলাম।
              </div>

              <div className="pt-2">স্বাক্ষরসমূহ:</div>

              {/* Two-column Party Signatures */}
              <div className="grid grid-cols-2 gap-6 text-center pt-6 pb-8 leading-relaxed">
                <div className="space-y-1">
                  <div>১ম পক্ষ (নিয়োগকারী/অনুমোদনকারী):</div>
                  <div>চেয়ারম্যান</div>
                  <div>{unionVal}</div>
                  <div>
                    ডাকঘর: বাসুদেবপুর, উপজেলা: {upazilaVal}, জেলা: {districtVal}।
                  </div>
                </div>
                <div className="space-y-1">
                  <div>২য় পক্ষ (বাস্তবায়নকারী/সংস্থা):</div>
                  <div>সভাপতি</div>
                  <div>প্রকল্প বাস্তবায়ন কমিটি</div>
                </div>
              </div>

              {/* Witnesses Signatures */}
              <div className="space-y-5 pt-4 leading-relaxed">
                <div className="text-[16px]">সাক্ষীগণের স্বাক্ষর:</div>

                {/* Witness 1 */}
                <div className="space-y-3 pt-1">
                  <div>
                    ১. স্বাক্ষর: ..........................................................
                  </div>
                  <div className="flex items-center">
                    <span className="w-[160px] inline-block">নাম:</span>
                    <span>(ইউপি সদস্য)</span>
                  </div>
                  <div>ঠিকানা:</div>
                </div>

                {/* Witness 2 */}
                <div className="space-y-3 pt-3">
                  <div>
                    ২. স্বাক্ষর: ..........................................................
                  </div>
                  <div className="flex items-center">
                    <span className="w-[140px] inline-block">নাম:</span>
                    <span>(শিক্ষক)</span>
                  </div>
                  <div>ঠিকানা:</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-07: ৭. কার্যাদেশ প্রদান পত্র — প্রকল্প বাস্তবায়ন কমিটি (ইউপি প্যাড)     */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-07" && (
            <div className="space-y-3 pt-1 text-[15px]">
              {/* Centered Title */}
              <div className="text-center pb-1">
                <h2 className="text-[20px] font-normal">কার্যাদেশ</h2>
              </div>

              {/* Subject */}
              <div className="text-justify leading-[1.8]">
                বিষয়: &quot;{projectVal}&quot; প্রকল্পের চুক্তি সম্পাদন ও কার্যাদেশ প্রদান প্রসঙ্গে।
              </div>

              {/* Intro Paragraph */}
              <div className="text-justify leading-[1.8] indent-4">
                পরিষদের {fiscalYearVal} অর্থবছরের {sectorVal} খাতের আওতায় গৃহীত “{projectVal}” প্রকল্পের জন্য চুক্তিপত্র সম্পাদিত হয়েছে। উক্ত প্রকল্পের কাজ অনুমোদিত প্রাক্কলন ও সিডিউল অনুযায়ী নির্ধারিত সময়ের মধ্যে সম্পন্ন করার লক্ষ্যে নিম্নবর্ণিত শর্ত সাপেক্ষে আপনাকে কার্যাদেশ প্রদান করা হলো:
              </div>

              {/* Conditions Header */}
              <div className="text-center text-[16px] pt-1">শর্তাবলী:</div>

              {/* 5 Conditions */}
              <div className="space-y-2.5 text-justify leading-[1.8]">
                <div>
                  ১. কাজের মান ও সিডিউল অনুসরণ: প্রকল্পটি অনুমোদিত প্রাক্কলন (Estimate), নকশা ও কারিগরি সিডিউল অনুযায়ী শতভাগ সূক্ষ্মভাবে সম্পাদন করতে হবে। কাজের মান কোনো অবস্থাতেই নিম্নমানের হওয়া চলবে না।
                </div>

                <div>
                  ২. সময়সীমা: কার্যাদেশ প্রাপ্তির তারিখ হতে আগামী{" "}
                  {data.contractExpiryDate && data.contractExpiryDate.trim() !== ""
                    ? formatDate(data.contractExpiryDate)
                    : "..................................."}{" "}
                  খ্রি. তারিখের মধ্যে প্রকল্পের সম্পূর্ণ কাজ সন্তোষজনকভাবে সমাপ্ত করতে হবে।
                </div>

                <div>
                  ৩. তদারকি ও পরিদর্শন: কাজ চলাকালীন ইউপি চেয়ারম্যান/উপজেলা প্রকৌশলী বা নির্ধারিত তদারকি কর্মকর্তার পরিদর্শন সাপেক্ষে প্রয়োজনীয় দিকনির্দেশনা মেনে চলতে হবে।
                </div>

                <div>
                  ৪. বিল ও কর কর্তন: কাজ শেষে পরিদর্শনের পর কাজের গুণগত মান সন্তোষজনক বিবেচিত হলে চূড়ান্ত বিল প্রদান করা হবে। বিলের অর্থ হতে সরকারি বিধি মোতাবেক নির্ধারিত ভ্যাট (VAT) ও আয়কর (Tax) কর্তন করা হবে।
                </div>

                <div>
                  ৫. অতিরিক্ত ব্যয় ও সময় বৃদ্ধি: নির্ধারিত বরাদ্দের ({estimatedVal} টাকা) অতিরিক্ত কোনো বিল দাবি করা যাবে না। কোনো যুক্তিসঙ্গত কারণে সময় বৃদ্ধির প্রয়োজন হলে তা কাজ সমাপ্তির নির্ধারিত তারিখের আগেই লিখিতভাবে অনুমোদন নিতে হবে।
                </div>
              </div>

              {/* Recipient Block */}
              <div className="pt-5 space-y-1.5 leading-relaxed">
                <div>প্রাপক:</div>
                <div>সভাপতি</div>
                <div>প্রকল্প বাস্তবায়ন কমিটি</div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-08: ৮. প্রকল্প বাস্তবায়ন কমিটি সভার কার্যবিবরণী (সভা নং: ০৩ — প্রকল্পের বিল প্রসঙ্গে) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-08" && (
            <div className="space-y-3 pt-1 text-[15px]">
              {/* Left-aligned Header & Meta Info (matching Image 5 / প্লেট-৮) */}
              <div className="space-y-2.5 leading-relaxed">
                <div className="text-[16.5px] font-normal">
                  প্রকল্প বাস্তবায়ন কমিটি সভার কার্যবিবরণী
                </div>
                <div>সভা নং: ০৩</div>
                <div>স্থান: {meetingPlaceVal}</div>
                <div>
                  সভার তারিখ: {meetingDate3Val} খ্রি. ও সময়: {meetingTimeVal}
                </div>
                <div>
                  সভাপতির নাম: {presidentVal}, {designationVal}, {unionVal}, {upazilaVal}, {districtVal}।
                </div>
                <div>সভায় উপস্থিত সদস্যগণের উপস্থিতি তালিকা:</div>
              </div>

              {/* Double-framed Committee Attendance Table */}
              <div className="pt-1">
                <table className="w-full border-separate border-spacing-[2px] border border-black p-[2px] text-[14px]">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-1 text-center font-normal w-[60px]">
                        ক্র. নং
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        নাম
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        পদবি
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        গ্রাম
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal">
                        কমিটি পদবি
                      </th>
                      <th className="border border-black px-2.5 py-1 text-center font-normal w-[125px]">
                        স্বাক্ষর
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((member, idx) => {
                      const serialBn = toBanglaDigits(
                        String(idx + 1).padStart(2, "0")
                      );
                      return (
                        <tr key={idx} className="h-9">
                          <td className="border border-black px-2 py-1 align-middle">
                            {serialBn}।
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.name, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.designation, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.village || data.village, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle">
                            {fallback(member.committeeRole, "")}
                          </td>
                          <td className="border border-black px-2.5 py-1 align-middle"></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Discussion & Resolution Paragraphs */}
              <div className="space-y-4 pt-3 leading-[1.85] text-justify">
                <div>
                  সভাপতি সাহেব উপস্থিত সদস্যদের শুভেচ্ছা জানিয়ে সভার কাজ শুরু করেন। সভার কার্যবিবরণী নিম্নরূপ:
                </div>

                <div>
                  সভার আলোচ্য বিষয়: {projectVal} প্রকল্পের বিল প্রসঙ্গে।
                </div>

                <div>
                  সভাপতি সাহেব জানান যে, {projectVal} প্রকল্পটি ইউনিয়ন পরিষদের সভায় অনুমোদিত হয়েছে। প্রকল্পটির প্রাক্কলন ব্যয় {estimatedVal} টাকা। প্রকল্পটি বাস্তবায়নকারী প্রকল্প সভাপতি প্রকল্পের কাজ সম্পন্ন করে বিলের জন্য আবেদন করেছেন। কাজ সরজমিনে পরিদর্শন করা হয়েছে, কাজের গুণগত মান সন্তোষজনক।
                </div>

                <div>
                  সিদ্ধান্ত: এ বিষয়ে চেয়ারম্যান, {unionVal}, {upazilaVal}, {districtVal}-কে বিল প্রদানের জন্য অনুরোধ করা হলো।
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-09: ৯. উপ-প্রকৌশলী কর্তৃক প্রত্যয়নপত্র (প্লেট-৯)                        */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-09" && (
            <div className="space-y-5 pt-4 text-[15.5px]">
              {/* Centered Title */}
              <div className="text-center pb-1">
                <h1 className="text-[20px] sm:text-[21px] font-normal">
                  উপ-প্রকৌশলী কর্তৃক প্রত্যয়নপত্র
                </h1>
              </div>

              {/* Certificate Body */}
              <div className="text-justify leading-[1.95]">
                এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, {fiscalYearVal} অর্থবছরের {sectorVal}
                {sectorVal.includes("১%") && !sectorVal.includes("শতাংশ")
                  ? " (এক শতাংশ)"
                  : ""}{" "}
                এর অর্থায়নে বাস্তবায়িত &quot;{projectVal}&quot; শীর্ষক প্রকল্পের কাজ সরজমিনে পরিদর্শন করা হয়েছে। পরিদর্শনকালে প্রকল্পের কাজের পরিমাপ ও গুনগতমান সন্তোষজনক কাঠামোগত সঠিকতা নিবিড়ভাবে যাচাই করা হয় । সরজমিনে তদন্ত ও পরিদর্শনের ভিত্তিতে দেখা যায় যে, বর্ণিত প্রকল্পটি সরকারি বিধিমালা, অনুমোদিত প্রাক্কলন (Estimate) ও সিডিউল অনুযায়ী সম্পূর্ণ এবং নিখুঁতভাবে সম্পন্ন হয়েছে। কাজের মান সন্তোষজনক হওয়ায় উক্ত প্রকল্পের দাখিলকৃত চূড়ান্ত বিলের বিপরীতে ভ্যাট ও আয়কর বাদে নিট {netPayVal} ({netPayWords}) পরিশোধের জন্য জোর সুপারিশ করা হলো।
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-10: ১০. চেয়ারম্যান কর্তৃক প্রত্যয়নপত্র (ইউপি প্যাড — প্লেট-১০)          */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-10" && (
            <div className="space-y-5 pt-2 text-[15.5px]">
              {/* Centered Title */}
              <div className="text-center pb-1">
                <h2 className="text-[20px] sm:text-[21px] font-normal">
                  চেয়ারম্যান কর্তৃক প্রত্যয়নপত্র
                </h2>
              </div>

              {/* Certificate Body */}
              <div className="text-justify leading-[1.95]">
                এতদ্বারা প্রত্যয়ন করা যাইতেছে যে, {fiscalYearVal} অর্থবছরের {sectorVal}
                {sectorVal.includes("১%") && !sectorVal.includes("শতাংশ")
                  ? " (এক শতাংশ)"
                  : ""}{" "}
                এর অর্থায়নে বাস্তবায়িত &quot;{projectVal}&quot; শীর্ষক প্রকল্পের কাজ সরজমিনে পরিদর্শন করা হয়েছে। পরিদর্শনকালে প্রকল্পের কাজের পরিমাপ, বালি ভরাটের পুরুত্ব, ইটের ছলিংয়ের গুণগত মান এবং সিঁড়ি নির্মাণের কাঠামোগত সঠিকতা নিবিড়ভাবে যাচাই করা হয়। সরজমিনে তদন্ত ও পরিদর্শনের ভিত্তিতে দেখা যায় যে, বর্ণিত প্রকল্পটি সরকারি বিধিমালা, অনুমোদিত প্রাক্কলন (Estimate) ও সিডিউল অনুযায়ী সম্পূর্ণ এবং নিখুঁতভাবে সম্পন্ন হয়েছে। কাজের মান সন্তোষজনক হওয়ায় উক্ত প্রকল্পের দাখিলকৃত চূড়ান্ত বিলের বিপরীতে ভ্যাট ও আয়কর বাদে নিট {netPayVal} ({netPayWords}) পরিশোধের জন্য জোর সুপারিশ করা হলো।
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-11: ১১. প্রকল্পের চূড়ান্ত বিলের জন্য আবেদন (প্রকল্প সভাপতি — প্লেট-১১) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-11" && (
            <div className="space-y-4 pt-2 text-[15.5px]">
              {/* Top Date Line */}
              <div>
                তারিখ:{" "}
                {data.applicationDate && data.applicationDate.trim() !== ""
                  ? formatDate(data.applicationDate)
                  : "..........................."}{" "}
                খ্রি.
              </div>

              {/* Recipient Block */}
              <div className="space-y-3 pt-1 leading-relaxed">
                <div>বরাবর,</div>
                <div>চেয়ারম্যান</div>
                <div>{unionVal}</div>
                <div>
                  {upazilaVal}, {districtVal}।
                </div>
              </div>

              {/* Subject */}
              <div className="pt-2 leading-[1.85] text-justify">
                বিষয়: {projectVal} প্রকল্পের চূড়ান্ত বিলের জন্য আবেদন।
              </div>

              {/* Salutation */}
              <div className="pt-1">জনাব,</div>

              {/* Body Paragraph 1 */}
              <div className="text-justify leading-[1.9]">
                যথাবিহীত সম্মান প্রদর্শনপূর্বক বিনীত নিবেদন এই যে, {fiscalYearVal} অর্থবছরে {sectorVal}
                {sectorVal.includes("১%") && !sectorVal.includes("শতাংশ")
                  ? " (এক শতাংশ)"
                  : ""}{" "}
                খাত হতে গৃহীত {unionShortVal}ের &quot;{projectVal}&quot; প্রকল্পের অনুকূলে {estimatedVal} ({estimatedWordsOnly}) টাকা বরাদ্দ প্রদান করা হয়েছিল। প্রাক্কলন ও অনুমোদিত সিডিউল মোতাবেক আমি প্রকল্পের নির্ধারিত কাজ সন্তোষজনকভাবে সম্পন্ন করেছি।
              </div>

              {/* Body Paragraph 2 */}
              <div className="text-justify leading-[1.9] pt-1">
                এমতাবস্থায়, উক্ত প্রকল্পের সম্পূর্ণ কাজ শেষ হওয়ায় বিধি মোতাবেক ভ্যাট ও আয়কর কর্তন পূর্বক চূড়ান্ত বিলের নিট পাওনা টাকা পরিশোধে আপনার মর্জি হয়।
              </div>

              {/* Body Paragraph 3 */}
              <div className="text-justify leading-[1.9] pt-1">
                অতএব, জনাবের নিকট আকুল আবেদন এই যে, প্রকল্পের কাজ সন্তোষজনকভাবে সমাপ্ত হওয়ায় বিলের চেক ইস্যু করে বাধিত করিবেন।
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-12: ১২. কাজের চূড়ান্ত বিল ফরম — Final Bill Voucher (১ম পাতা — প্লেট-১২) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-12" && (
            <div className="space-y-2.5 pt-1 text-[14px]">
              {/* Voucher Title & Bill No */}
              <div className="pt-1 space-y-1.5">
                <div className="text-[15.5px] font-normal">
                  কাজের চূড়ান্ত বিল ফরম (Final Bill Voucher)
                </div>
                <div className="flex items-center justify-between text-[14px]">
                  <div>
                    বিল নং:{" "}
                    {fallback(data.installmentNo, "০৩/২০২৫-২৬")}
                  </div>
                  <div>
                    তারিখ:{" "}
                    {formatDate(data.billDate || data.chequeDate, "১৮/০৫/২০২৬")} খ্রি.
                  </div>
                </div>
              </div>

              {/* Section 1: Project Info */}
              <div className="space-y-1 pt-0.5">
                <div className="text-[14.5px]">১. প্রকল্প সংক্রান্ত তথ্য:</div>
                <ul className="list-disc pl-8 space-y-0.5 text-[13.5px] leading-[1.6]">
                  <li>প্রকল্পের নাম: {projectVal}।</li>
                  <li>
                    অর্থায়ন খাত: {fiscalYearVal} অর্থবছরের {sectorVal}
                    {sectorVal.includes("১%") && !sectorVal.includes("শতাংশ")
                      ? " (এক শতাংশ)"
                      : ""}
                    ।
                  </li>
                  <li>
                    প্রাক্কলিত মোট ব্যয়: {estimatedVal} ({estimatedWordsOnly}) টাকা মাত্র।
                  </li>
                  <li>
                    কার্যাদেশ ও স্মারক নং: {memoVal} (তারিখ: {formatDate(data.workOrderDate || data.contractDate, "১১/০৩/২০২৬")} খ্রি.)।
                  </li>
                  <li>
                    প্রকল্প সভাপতি/বাস্তবায়নকারী: {presidentVal}, {designationVal}, {unionVal}।
                  </li>
                </ul>
              </div>

              {/* Section 2: Measurement & Calculation Table */}
              <div className="space-y-1 pt-1">
                <div className="text-[14.5px]">২. কাজের পরিমাপ ও হিসাব বিবরণী:</div>
                <table className="w-full border-collapse border border-black text-[13.5px] leading-snug">
                  <thead>
                    <tr>
                      <th className="border border-black px-2 py-1 text-left font-normal w-[42px] align-top">
                        ক্র. নং
                      </th>
                      <th className="border border-black px-2.5 py-1 text-left font-normal align-top">
                        কাজের বিবরণ
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-normal w-[95px] align-top">
                        অনুমোদিত প্রাক্কলিত পরিমাণ
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-normal w-[105px] align-top">
                        সম্পন্নকৃত কাজের পরিমাণ
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-normal w-[75px] align-top">
                        হার (টাকা)
                      </th>
                      <th className="border border-black px-2 py-1 text-left font-normal w-[115px] align-top">
                        মোট দাবি করা টাকার পরিমাণ
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-black px-2 py-1.5 align-top">
                        ১
                      </td>
                      <td className="border border-black px-2.5 py-1.5 align-top">
                        {fallback(
                          data.workMeasurement || data.materialsDescription,
                          "বালি ভরাট, ইটের ছলিং ও সিঁড়ি নির্মাণ"
                        )}{" "}
                        (অনুমোদিত সিডিউল অনুযায়ী শতভাগ সম্পন্ন)
                      </td>
                      <td className="border border-black px-2 py-1.5 align-top">
                        চুক্তি মোতাবেক
                      </td>
                      <td className="border border-black px-2 py-1.5 align-top">
                        ১০০.০০%
                      </td>
                      <td className="border border-black px-2 py-1.5 align-top">
                        এককালীন
                      </td>
                      <td className="border border-black px-2 py-1.5 align-top">
                        {billVal.replace(/\/-$/g, ".০০")}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2 py-1.5 align-top">
                        মোট:
                      </td>
                      <td className="border border-black px-2.5 py-1.5 align-top">
                        {billWordsOnly} টাকা মাত্র
                      </td>
                      <td className="border border-black px-2 py-1.5"></td>
                      <td className="border border-black px-2 py-1.5"></td>
                      <td className="border border-black px-2 py-1.5"></td>
                      <td className="border border-black px-2 py-1.5 align-top">
                        {billVal.replace(/\/-$/g, ".০০")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Section 3: Government Deductions & Net Payable Bill Table */}
              <div className="pt-2">
                <table className="w-full border-collapse border border-black text-[13.5px] leading-snug">
                  <tbody>
                    <tr>
                      <td className="border border-black px-2.5 py-1.5 w-[38%] align-top">
                        ৩. সরকারি কর্তন ও নিট প্রদেয় বিলের হিসাব:
                      </td>
                      <td className="border border-black px-2.5 py-1.5 w-[31%]"></td>
                      <td className="border border-black px-2.5 py-1.5 w-[31%]"></td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1 align-top">
                        বিবরণ
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        শতাংশ (%) / পরিমাণ
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        টাকার পরিমাণ (টাকা)
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1 align-top">
                        ক. মোট দাবিকৃত বিলের পরিমাণ
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        —
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        {billVal.replace(/\/-$/g, ".০০")}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1 align-top">
                        খ. সরকারি উৎস কর (আয়কর - Tax) কর্তন
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        ৭.৫% (আনুমানিক/প্রযোজ্য হার)
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        {data.tax && data.tax.trim() !== ""
                          ? toBanglaDigits(data.tax.replace(/\/-$/g, ""))
                          : "১১,২৬০.৫০"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1 align-top">
                        গ. ভ্যাট (VAT) কর্তন
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        ৯.৫% (প্রযোজ্য বিধিবদ্ধ হার)
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        {data.vat && data.vat.trim() !== ""
                          ? toBanglaDigits(data.vat.replace(/\/-$/g, ""))
                          : "১৪,৫১৯.৫০"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1 align-top">
                        ঘ. মোট কর্তন (আয়কর + ভ্যাট)
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        ১৭.২% (মোট কর্তন)
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        {data.totalDeduction && data.totalDeduction.trim() !== ""
                          ? toBanglaDigits(data.totalDeduction.replace(/\/-$/g, ""))
                          : "২৫,৭৮০.০০"}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1 align-top">
                        ঙ. নিট প্রদেয় বিলের পরিমাণ (ক - ঘ)
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        অবশিষ্ট প্রদেয়
                      </td>
                      <td className="border border-black px-2.5 py-1 align-top">
                        {netPayVal.includes(".৫/")
                          ? netPayVal.replace(".৫/-", ".৫০/-")
                          : netPayVal}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-black px-2.5 py-1.5 align-top">
                        (কথায়: {netPayWords} মাত্র)
                      </td>
                      <td className="border border-black px-2.5 py-1.5"></td>
                      <td className="border border-black px-2.5 py-1.5"></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-13: ১৩. কাজের চূড়ান্ত বিল ফরম — Final Bill Voucher (২য় পাতা — প্লেট-১২) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-13" && (
            <div className="space-y-6 pt-3 text-[15.5px]">
              {/* Section 4: Payment Details */}
              <div className="space-y-2">
                <div className="text-[16px]">
                  ৪. ব্যাংক পরিশোধ সংক্রান্ত তথ্য (Payment Details):
                </div>
                <ul className="list-disc pl-9 space-y-1.5 leading-[1.8]">
                  <li>
                    ইউনিয়ন পরিষদের ব্যাংক হিসাব নং:{" "}
                    {fallback(data.bankAccountNo, "০১০০০৩৭২৪৯১৫১")} (
                    {fallback(data.bankBranchName || data.bankName, "জনতা ব্যাংক লিমিটেড")}
                    )।
                  </li>
                  <li>
                    ইস্যুকৃত চেক নম্বর: {fallback(data.chequeNo, "১৬৬৭৬৬০")}{" "}
                    (একাউন্ট পে চেক)।
                  </li>
                  <li>
                    চেকের তারিখ:{" "}
                    {formatDate(
                      data.chequeDate || data.receiptDate,
                      "১৮/০৫/২০২৬"
                    )}{" "}
                    খ্রি.।
                  </li>
                  <li>
                    পেমেন্ট মোড: একাউন্ট পে চেকে ভ্যাট ও আয়কর কাটার পর নিট হস্তান্তর।
                  </li>
                </ul>
              </div>

              {/* Section 5: Verification & President Signature */}
              <div className="space-y-2 pt-2">
                <div className="text-[16px]">
                  ৫. দায়িত্বপ্রাপ্তদের যাচাই, অনুমোদন ও স্বাক্ষর
                </div>
                <div className="text-justify leading-[1.85]">
                  প্রকল্প সভাপতির স্বাক্ষর:আমি প্রত্যয়ন করছি যে, প্রকল্পের কাজ সিডিউল অনুযায়ী শতভাগ সম্পন্ন হয়েছে এবং বিল জমা দেওয়া হলো।
                </div>
              </div>

              <div className="pt-6 pr-16 text-right">প্রকল্প সভাপতি</div>

              {/* Chairman Final Approval */}
              <div className="space-y-2 pt-4">
                <div className="text-[16px]">
                  চেয়ারম্যানের চূড়ান্ত অনুমোদন ও হুকুমনামা:
                </div>
                <div className="text-justify leading-[1.85]">
                  কাজের মান সন্তোষজনক হওয়ায় প্রাক্কলন ও বিধি অনুযায়ী কর্তনপূর্বক নিট {netPayVal} ({netPayWords}) চেকের মাধ্যমে প্রদানের মঞ্জুরি প্রদান করা হলো।
                </div>
              </div>

              {/* Chairman Signature & Seal Block */}
              <div className="pt-8 pr-8 flex justify-end">
                <div className="text-center space-y-1 leading-relaxed">
                  <div className="italic">(স্বাক্ষর ও সীলমোহর)</div>
                  <div>মোঃ নজরুল ইসলাম</div>
                  <div>চেয়ারম্যান</div>
                  <div>{unionVal}</div>
                  <div>
                    {upazilaVal}, {districtVal}।
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-14: ১৪. চেক প্রাপ্তি স্বীকার পত্র (প্লেট-১৩)                             */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-14" && (
            <div className="space-y-5 pt-3 text-[15.5px]">
              {/* Centered Title */}
              <div className="text-center pb-1">
                <h1 className="text-[18px] sm:text-[19px] font-normal">
                  চেক প্রাপ্তি স্বীকার
                </h1>
              </div>

              {/* Main Body Paragraph */}
              <div className="text-justify leading-[1.95]">
                আমি নিম্নস্বাক্ষরকারী, {fiscalYearVal} অর্থবছরের {sectorVal}
                {sectorVal.includes("১%") && !sectorVal.includes("শতাংশ")
                  ? " (এক শতাংশ)"
                  : ""}{" "}
                অর্থ দ্বারা পরিচালিত &quot;{projectVal}&quot; শীর্ষক প্রকল্পের কাজ প্রাক্কলন ও সিডিউল অনুযায়ী সুচারুভাবে সম্পন্ন করেছি। উক্ত কাজের চূড়ান্ত বিল পরিশোধের নিমিত্ত চেয়ারম্যান, {unionVal} বরাবর আবেদন করায় অদ্য{" "}
                {formatDate(data.receiptDate || data.chequeDate, "১৮/০৫/২০২৬")} খ্রি. তারিখে ইউপির হিসাব নং-{" "}
                {fallback(data.bankAccountNo, "০১০০০৩৭২৪৯১৫১")}
                , চেক নং- {fallback(data.chequeNo, "১৬৬৭৬৬০")}{" "}
                এর মাধ্যমে একাউন্ট পে চেকে ভ্যাট ও আয়কর কাটার পর অবশিষ্টাংশ নিট {netPayVal} ({netPayWords}) বুঝে পেলাম।
              </div>

              {/* Centered Sub-Heading */}
              <div className="text-center pt-2">
                <h2 className="text-[16.5px] font-normal">
                  প্রাপ্তি স্বীকারের বিস্তারিত:
                </h2>
              </div>

              {/* Details Bullet List */}
              <ul className="list-disc pl-9 space-y-2.5 leading-[1.85]">
                <li>প্রকল্পের নাম: {projectVal}।</li>
                <li>
                  অর্থায়ন খাত: {fiscalYearVal} অর্থ বছরের {sectorVal} অর্থ।
                </li>
                <li>
                  ইউনিয়ন পরিষদের হিসাব নং:{" "}
                  {fallback(data.bankAccountNo, "০১০০০৩৭২৪৯১৫১")}{" "}
                  চেক নম্বর: {fallback(data.chequeNo, "১৬৬৭৬৬০")}{" "}
                  (একাউন্ট পে)। গ্রহণের তারিখ:{" "}
                  {formatDate(data.receiptDate || data.chequeDate, "১৮/০৫/২০২৬")}{" "}
                  খ্রি.।
                </li>
                <li>
                  প্রাপ্ত টাকার পরিমাণ (ভ্যাট ও আয়কর বাদে): {netPayVal} ({netPayWords}) টাকা মাত্র।
                </li>
              </ul>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-15: ১৫. নোট সিট (Note Sheet — অনুচ্ছেদ ১ থেকে ৪ — প্লেট-১৪)           */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-15" && (
            <div className="pt-1 text-[14px]">
              <table className="w-full border-collapse border border-black leading-[1.75]">
                <tbody>
                  {/* Row 1: Title */}
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-black py-1.5 px-3 text-center text-[21px] font-normal"
                    >
                      নোট সিট (Note Sheet)
                    </td>
                  </tr>

                  {/* Row 2: Office Name */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1 px-2.5">
                      অফিসের নাম: {unionVal}
                    </td>
                  </tr>

                  {/* Row 3: Upazila & District */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1 px-2.5">
                      উপজেলা: {upazilaVal}, জেলা: {districtVal}
                    </td>
                  </tr>

                  {/* Row 4: Subject */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1 px-2.5">
                      বিষয়: &quot;{projectVal}&quot; প্রকল্পের কাজ সমাপ্তি ও চূড়ান্ত বিল প্রদান প্রসঙ্গে।
                    </td>
                  </tr>

                  {/* Row 5: Column Headers */}
                  <tr>
                    <td className="border border-black py-1 px-1.5 w-[55px] align-top">
                      অনুচ্ছেদ নং
                    </td>
                    <td className="border border-black py-1 px-2.5 w-[43%] align-top">
                      বিষয় ও প্রস্তাবনা
                    </td>
                    <td
                      colSpan={2}
                      className="border border-black py-1 px-2.5 text-center align-top"
                    >
                      কর্তৃপক্ষের আদেশ ও সিদ্ধান্ত
                    </td>
                  </tr>

                  {/* Paragraph 1 */}
                  <tr>
                    <td className="border border-black py-2 px-2 align-top">
                      ১
                    </td>
                    <td className="border border-black py-2.5 px-2.5 text-center align-top">
                      প্রকল্প গ্রহণ ও প্রাক্কলন: {unionVal}ের {fiscalYearVal} অর্থবছরের ভূমি হস্তান্তর খাতের ১% অর্থায়নে বাস্তবায়নের জন্য {projectVal} প্রকল্পটি গৃহীত হয়। উক্ত প্রকল্পের প্রাক্কলন ও সিডিউল তৈরির জন্য উপ-প্রকৌশলী বরাবর পত্র প্রেরণ করা হয়েছিল।
                    </td>
                    <td className="border border-black w-[26%]"></td>
                    <td className="border border-black w-[26%]"></td>
                  </tr>

                  {/* Paragraph 2 */}
                  <tr>
                    <td className="border border-black py-2 px-2 align-top">
                      ২
                    </td>
                    <td className="border border-black py-2.5 px-2.5 align-top">
                      কমিটির সভা ও প্রাক্কলন অনুমোদন: উপ-প্রকৌশলী কর্তৃক প্রণীত {estimatedVal} টাকার প্রাক্কলন পর্যালোচনার জন্য প্রকল্প বাস্তবায়ন কমিটির ১ম সভা (সভা নং: ০১) অনুষ্ঠিত হয়। সভায় সর্বসম্মতিক্রমে প্রাক্কলনটি অনুমোদিত হয় এবং প্রকল্পটি বাস্তবায়নের সিদ্ধান্ত গৃহীত হয়।
                    </td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>

                  {/* Paragraph 3 */}
                  <tr>
                    <td className="border border-black py-2 px-2 align-top">
                      ৩
                    </td>
                    <td className="border border-black py-2.5 px-2.5 align-top">
                      কার্যাদেশ প্রদান: প্রকল্প বাস্তবায়নের লক্ষ্যে প্রকল্প সভাপতির সাথে চুক্তিপত্র সম্পাদিত হয় এবং বিধি মোতাবেক কার্যাদেশ ইস্যু করা হয়। কার্যাদেশে নির্দিষ্ট সময়ের মধ্যে প্রাক্কলন ও সিডিউল অনুযায়ী শতভাগ কাজ সম্পন্ন করার নির্দেশনা প্রদান করা হয়।
                    </td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>

                  {/* Paragraph 4 */}
                  <tr>
                    <td className="border border-black py-2 px-2 align-top">
                      ৪
                    </td>
                    <td className="border border-black py-2.5 px-2.5 align-top">
                      কাজ সমাপ্তি ও কমিটির সভা: প্রকল্প সভাপতি কর্তৃক নির্ধারিত সময়ের মধ্যে রাস্তা বালি ভরাট, ছলিং ও সিঁড়ি নির্মাণের কাজ শতভাগ সম্পন্ন করা হয়েছে। অতঃপর কাজ সরজমিনে পরিদর্শন করা হলে কাজের গুণগত মান সন্তোষজনক পাওয়ায় বিল প্রস্তুত ও অনুমোদনের জন্য প্রকল্প বাস্তবায়ন কমিটির ৩য় সভায় (সভা নং: ০৩) সিদ্ধান্ত গৃহীত হয়।
                    </td>
                    <td className="border border-black"></td>
                    <td className="border border-black"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* PIC-16: ১৬. নোট সিট (Note Sheet — ২য় পাতা: চূড়ান্ত বিল অনুমোদন ও সংযুক্তিসমূহ) */}
          {/* ========================================================================= */}
          {template.id === "pic-tmpl-16" && (
            <div className="pt-1 text-[14px]">
              <table className="w-full border-collapse border border-black leading-[1.75]">
                <tbody>
                  {/* Row 1: Final Bill Application & Certification */}
                  <tr>
                    <td className="border border-black py-2.5 px-2 w-[55px] align-top"></td>
                    <td className="border border-black py-2.5 px-2.5 w-[43%] align-top">
                      চূড়ান্ত বিলের আবেদন ও প্রত্যয়ন: প্রকল্প সভাপতি মোট {estimatedVal} টাকার বিল পরিশোধের জন্য আবেদন করেছেন। ইউনিয়ন পরিষদ কর্তৃক সরজমিনে প্রকল্পটি পুনরায় পরিদর্শন করা হয়েছে। পরিদর্শন প্রতিবেদন ও কাজের মান সন্তোষজনক হওয়ায় সরকারি বিধি অনুযায়ী ভ্যাট ও আয়কর কর্তন পূর্বক নিট {netPayVal} টাকা পরিশোধের জন্য সুনির্দিষ্ট সুপারিশ প্রদান করা হয়েছে।
                    </td>
                    <td className="border border-black w-[26%]"></td>
                    <td className="border border-black w-[26%]"></td>
                  </tr>

                  {/* Row 2: Accounts Verification & Payment Approval */}
                  <tr>
                    <td className="border border-black py-2.5 px-2 align-top"></td>
                    <td className="border border-black py-2.5 px-2.5 align-top">
                      হিসাব পরীক্ষা ও অর্থ পরিশোধ: হিসাব শাখা কর্তৃক বিল ভাউচার, পরিমাপ বই (MB) এবং সরকারি কর্তন (ভ্যাট ও আয়কর) যাচাই-বাছাই করা হয়েছে। যাচাইঅন্তে ইউপির হিসাব নং-{" "}
                      {fallback(data.bankAccountNo, "০১০০০৩৭২৪৯১৫১")}{" "}
                      হতে চেক নং- {fallback(data.chequeNo, "১৬৬৭৬৬০")}{" "}
                      (একাউন্ট পে চেক)-এর মাধ্যমে ভ্যাট ও আয়কর বাদে নিট {netPayVal} ({netPayWords}) প্রকল্প সভাপতির অনুকূলে পরিশোধের জন্য নথি চূড়ান্ত অনুমোদনের জন্য উপস্থাপন করা হলো।
                    </td>
                    <td className="border border-black"></td>
                    <td className="border border-black py-2.5 px-2.5 align-top">
                      প্রস্তাব ও হিসাব যাচাইঅন্তে সন্তোষজনক বিবেচিত হওয়ায় ইউপির হিসাব হতে চেকের মাধ্যমে নিট বিল পরিশোধের অনুমোদন দেওয়া হলো।
                    </td>
                  </tr>

                  {/* Attachments Header */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1.5 px-2.5">
                      সংযুক্তিসমূহ:
                    </td>
                  </tr>

                  {/* Attachment 1 */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1.5 px-2.5">
                      ক. প্রাক্কলন ও সিডিউল কপি
                    </td>
                  </tr>

                  {/* Attachment 2 */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1.5 px-2.5">
                      খ. প্রকল্প বাস্তবায়ন কমিটির সভার কার্যবিবরণী (সভা নং: ০১,২ ও ৩)
                    </td>
                  </tr>

                  {/* Attachment 3 */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1.5 px-2.5">
                      গ. কার্যাদেশ
                    </td>
                  </tr>

                  {/* Attachment 4 */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1.5 px-2.5">
                      ঘ. বিলের আবেদন
                    </td>
                  </tr>

                  {/* Attachment 5 */}
                  <tr>
                    <td colSpan={4} className="border border-black py-1.5 px-2.5">
                      ঙ. প্রত্যয়ন ও চেক প্রদান সংক্রান্ত প্রাপ্তি স্বীকার পত্র
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

