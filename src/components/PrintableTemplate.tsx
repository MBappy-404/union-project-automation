"use client";

import React, { useState } from "react";
import { ProjectData, WardCommitteeMember, DEFAULT_WARD_MEMBERS, TenderEvaluationEntry, DEFAULT_TENDER_EVALUATION_LIST, TenderOpeningEntry, DEFAULT_TENDER_OPENING_LIST } from "@/types/project";
import { TemplateMeta } from "@/types/templates";
import { numberToBanglaWords, toBanglaDigits, formatBanglaCurrency, calculateBanglaPercentage, formatBanglaDate } from "@/lib/banglaUtils";


interface PrintableTemplateProps {
  template: TemplateMeta;
  data: ProjectData;
  onPrint: () => void;
}

export const PrintableTemplate: React.FC<PrintableTemplateProps> = ({
  template,
  data,
  onPrint,
}) => {
  const [contractPage, setContractPage] = useState<number | "all">(1);

  // Dynamic ward committee members list with president auto-synced to first row
  const rawCommitteeList: WardCommitteeMember[] =
    data.wardCommitteeMembers && data.wardCommitteeMembers.length > 0
      ? data.wardCommitteeMembers
      : DEFAULT_WARD_MEMBERS;

  const presidentName = data.president || data.presidentName || "";

  const committeeList: WardCommitteeMember[] = [
    {
      name: presidentName,
      fatherName: rawCommitteeList[0]?.fatherName || "",
      designation: data.designation || rawCommitteeList[0]?.designation || "",
      committeeRole: data.committeeDesignation || "সভাপতি",
      village: data.village || rawCommitteeList[0]?.village || "",
    },
    ...rawCommitteeList.slice(1),
  ];

  // Ensures any value displays in Bengali digits (no English digits)
  const fallback = (val?: string, placeholder: string = "................................") => {
    if (!val || val.trim() === "") return placeholder;
    return toBanglaDigits(val);
  };

  // Formats any date into Day/Month/Year (DD/MM/YYYY) in Bengali digits
  const formatDate = (val?: string, placeholder: string = "................................") => {
    return formatBanglaDate(val, placeholder);
  };

  // Formats any currency value into standard Bangladeshi Bengali numerals (e.g. ১২,০০,০০০/-)
  const formatMoney = (val?: string, placeholder: string = "১,৭৪,০০০/-") => {
    if (!val || val.trim() === "") return placeholder;
    return formatBanglaCurrency(val, { fallbackPlaceholder: placeholder });
  };

  // Dynamically converts any amount into Bengali words
  const getInWords = (amount?: string, customWords?: string, defaultAmount: string = "১,৭৪,০০০/-") => {
    const effective = amount && amount.trim() !== "" ? amount : defaultAmount;
    if (customWords && customWords.trim() !== "" && customWords !== "এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র") {
      return customWords;
    }
    const computed = numberToBanglaWords(effective);
    return computed || customWords || "এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র";
  };

  // Formats any amount with its dynamic Bengali words in parentheses
  const formatAmountWithWords = (val?: string, defaultWithWords: string = "") => {
    if (!val || val.trim() === "") return defaultWithWords;
    if (val.includes("(") && val.includes(")")) {
      return toBanglaDigits(val);
    }
    const money = formatBanglaCurrency(val);
    const words = numberToBanglaWords(val);
    return words ? `${money} (${words})` : money;
  };

  // Helper dynamic values matching the user's documents
  const unionVal = fallback(data.unionName, "০৮নং বাসুদেবপুর ইউনিয়ন পরিষদ");
  const upazilaVal = fallback(data.upazila, "গোদাগাড়ী");
  const districtVal = fallback(data.district, "রাজশাহী");
  const projectVal = fallback(data.projectName, "হাতনাবাদ হাবিবুর রহমানের বাড়ী হতে শহিদুল মাস্টারের বাড়ী পর্যন্ত রাস্তা এইচবিবি করণ");
  const contractVal = formatMoney(data.contractValue, "১,৭৪,০০০/-");
  const contractWords = getInWords(data.contractValue, data.contractValueInWords, "১,৭৪,০০০/-");
  const estimatedVal = formatMoney(data.estimatedValue, "১,৭৪,০০০/-");
  const estimatedWords = getInWords(data.estimatedValue, data.estimatedValueInWords, "১,৭৪,০০০/-");
  const workOrderNo = fallback(data.tenderWorkOrderNo, "০১");
  const workOrderDate = formatDate(data.tenderWorkOrderDate || data.workOrderDate, "১৫/১০/২০২৬");
  const meetingTimeVal = fallback(data.meetingTime, "সকাল ১০.০০ ঘটিকা");
  const currentPresident = committeeList[0]?.name || data.presidentName || data.president || "";
  const presidentVal = fallback(currentPresident, "................................");
  const netPayVal = formatMoney(data.netPayment, "১,৩৪,৮৫০/-");
  const netPayWords = getInWords(data.netPayment, data.netPaymentInWords, "১,৩৪,৮৫০/-");

  // Dynamically calculate percentage of চুক্তিমূল্য (contractValue) for আয়কর, ভ্যাট, and জামানত
  const baseContractAmount = data.contractValue && data.contractValue.trim() !== "" ? data.contractValue : "174000";
  const dynamicTaxRate = calculateBanglaPercentage(
    data.tax && data.tax.trim() !== "" ? data.tax : "13050",
    baseContractAmount
  );
  const dynamicVatRate = calculateBanglaPercentage(
    data.vat && data.vat.trim() !== "" ? data.vat : "17400",
    baseContractAmount
  );
  const dynamicSdRate = calculateBanglaPercentage(
    data.securityDeposit && data.securityDeposit.trim() !== "" ? data.securityDeposit : "8700",
    baseContractAmount
  );

  const isLandscape = template.orientation === "landscape" || template.id === "tender-evaluation";

  // Dynamically inject @page rule into document.head so browser print preview automatically rotates
  // and leaves 30% blank space at the top of every A4 sheet (89.1mm of 297mm portrait, 63mm of 210mm landscape)
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
          margin: 63mm 12mm 8mm 12mm;
        }
      `;
    } else {
      styleTag.innerHTML = `
        @page {
          size: A4 portrait;
          margin: 89.1mm 12mm 10mm 12mm;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-3.5 border-b border-neutral-200 bg-neutral-50 no-print gap-3">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-black text-white font-normal">
              {template.code}
            </span>
            {isLandscape && (
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 font-normal">
                ল্যান্ডস্কেপ (A4 Landscape)
              </span>
            )}
            <h3 className="text-[15.5px] sm:text-base font-normal text-neutral-900 leading-relaxed">
              {template.titleBn}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Multi-page controller for 3-page contract */}
          {template.id === "contract-deed" && (
            <div className="flex items-center gap-1 bg-white border border-neutral-300 rounded-lg p-1 mr-2 text-xs">
              <span className="text-xs font-normal text-neutral-500 px-1.5 hidden sm:inline">চুক্তিপত্রের পাতা:</span>
              <button
                onClick={() => setContractPage(1)}
                className={`px-2.5 py-1 rounded text-xs sm:text-sm font-normal transition-all cursor-pointer ${contractPage === 1
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
                  }`}
              >
                পাতা ১
              </button>
              <button
                onClick={() => setContractPage(2)}
                className={`px-2.5 py-1 rounded text-xs sm:text-sm font-normal transition-all cursor-pointer ${contractPage === 2
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
                  }`}
              >
                পাতা ২
              </button>
              <button
                onClick={() => setContractPage(3)}
                className={`px-2.5 py-1 rounded text-xs sm:text-sm font-normal transition-all cursor-pointer ${contractPage === 3
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
                  }`}
              >
                পাতা ৩
              </button>
              <button
                onClick={() => setContractPage("all")}
                className={`px-2.5 py-1 rounded text-xs sm:text-sm font-normal transition-all cursor-pointer ${contractPage === "all"
                  ? "bg-black text-white shadow-xs"
                  : "text-neutral-700 hover:bg-neutral-100"
                  }`}
              >
                সব পাতা (১-৩)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* The Printable A4 Document Sheet */}
      <div className="p-4 sm:p-8 bg-neutral-100 overflow-x-auto flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
        {/* Print page size, orientation, and 30% top margin injection */}
        {isLandscape ? (
          <style dangerouslySetInnerHTML={{
            __html: `
            @page {
              size: A4 landscape;
              margin: 63mm 12mm 8mm 12mm;
            }
          ` }} />
        ) : (
          <style dangerouslySetInnerHTML={{
            __html: `
            @page {
              size: A4 portrait;
              margin: 89.1mm 12mm 10mm 12mm;
            }
          ` }} />
        )}
        <div id="printable-template-document" className={`w-full ${isLandscape ? "max-w-[297mm] min-h-[210mm] p-6 sm:p-12" : "max-w-[210mm] min-h-[297mm] p-8 sm:p-14"} bg-white text-black shadow-sm border border-neutral-300 print:border-none print:shadow-none print:p-0 print:m-0 print:w-full print:max-w-none text-[15px] font-sans leading-relaxed`}>

          {/* ========================================================================= */}
          {/* ৩. ঠিকাদারের চূড়ান্ত বিল পরিশোধের আবেদন ও চেয়ারম্যানের সুপারিশ (TMPL-03)   */}
          {/* ========================================================================= */}
          {template.id === "contractor-bill-app" && (
            <div className="space-y-2">
              <div className="space-y-1">
                <div>প্রাপক:</div>
                <div>চেয়ারম্যান</div>
                <div>{unionVal}</div>
                <div>{upazilaVal}, {districtVal}।</div>
              </div>

              <div>
                <span>বিষয়: প্রকল্পের কাজ সফলভাবে সমাপ্তি অন্তে চুড়ান্ত বিল পরিশোধের আবেদন।</span>
              </div>

              <div>
                <span>জনাব,</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>যথাবিহিত সম্মান প্রদর্শন পূর্বক বিনীত নিবেদন এই যে, আমি নিম্নস্বাক্ষরকারী আপনার কার্যালয়ের কর্তৃক {fallback(data.sectorName, "ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল")} এর আওতায় নিম্নবর্ণিত প্রকল্পের কার্যাদেশ প্রাপ্ত হয়ে নির্ধারিত সময়ের মধ্যে কাজ সম্পন্ন করেছি।</span>
              </div>

              <div className="py-1 pl-1">
                <table className="border-collapse border-none text-inherit">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">১. প্রকল্পের নাম</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{projectVal}।</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">২. চুক্তিমূল্য</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{contractVal} ({contractWords})</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">৩. কার্যাদেশ নং</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{workOrderNo}</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">৪. তারিখ</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{workOrderDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-justify leading-relaxed">
                <span>উল্লেখ্য যে, প্রকল্পের কাজটি অনুমোদিত প্রাক্কলন ও নকশা মোতাবেক সংশ্লিষ্ট উপ-সহকারি প্রকৌশলীর তত্ত্বাবধানে এবং ওয়ার্ড কমিটির উপস্থিতিতে যথাযথ ভাবে সম্পন্ন হয়েছে। বর্তমানে প্রকল্পটির চুড়ান্ত বিল গ্রহণের জন্য আমি যাবতীয় দাপ্তরিক কাজ সম্পন্ন করেছি।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>অতএব, মহোদায় নিকট বিনীত প্রার্থনা, উক্ত প্রকল্পের সম্পাদিত কাজের বিপরীতে আমার অনুকূলে প্রদেয় চুড়ান্ত বিলটি (ভ্যাট, আয়কর ও জামানত কর্তন পূর্বক) পরিশোধ করার প্রয়োজনীয় ব্যবস্থা গ্রহণ করতে আপনার সদয় মর্জি হয়।</span>
              </div>

              <div className="pt-6">
                <div>বিনীত নিবেদক</div>
                <div className="mt-3">ঠিকাদার</div>
              </div>

              <div className="pt-4">
                <div className="font-normal mb-1">চেয়ারম্যানের সুপারিশ:</div>
                <div className="text-justify leading-relaxed">
                  উপসহকারি প্রকৌশলী এবং তদারকি কমিটির প্রত্যয়ন সাপেক্ষে বিলটি গ্রহণ করা হলো। বিধি মোতাবেক প্রয়োজনীয় ব্যবস্থা গ্রহণ করুন।
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ১. প্রকল্পের বিল বাবদ চেক প্রাপ্তি স্বীকার পত্র (TMPL-01)                  */}
          {/* ========================================================================= */}
          {template.id === "cheque-receipt" && (
            <div className="space-y-2">
              <div className="">
                <div>বরাবর,</div>
                <div>চেয়ারম্যান</div>
                <div>{unionVal}</div>
                <div>{upazilaVal}, {districtVal}।</div>
              </div>

              <div>
                <span>বিষয়: প্রকল্পের বিল বাবদ চেক প্রাপ্তি স্বীকার।</span>
              </div>

              <div >
                <span>মহোদয়,</span>
              </div>

              <div className="text-justify leading-relaxed indent-5">
                <span>বিনীত নিবেদন এই যে, আপনার কার্যালয়ের অধীনে সম্পাদিত {projectVal} শীর্ষক প্রকল্পের কাজের বিল বাবদ নিম্নবর্ণিত চেকটি অদ্য আমি সশরীরে উপস্থিত হয়ে বুঝে পেলাম।</span>
              </div>

              <div className="py-2 pl-1">
                <table className="border-collapse border-none text-inherit">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">১. ব্যাংকের নাম</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{fallback(data.bankName, "সোনালি ব্যাংক লিমিটেড")}</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">২. শাখার নাম</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{fallback(data.bankBranchName, "গোদাগাড়ী")}</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">৩. চেক নম্বর</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{fallback(data.chequeNo, "CD-৮৯২৩৪১")}</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">৪. চেকের তারিখ</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{formatDate(data.chequeDate, "১০/১১/২০২৬")}</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">৫. টাকার পরিমাণ</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{netPayVal} ({netPayWords})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-justify leading-relaxed pt-2 ">
                <span>অতএব, উক্ত চেকের প্রাপ্তি স্বীকারপূর্বক অত্র পত্রটি আপনার নিকট দাখিল করা হলো।</span>
              </div>

              <div className="pt-16 text-right">
                <div className="inline-block text-center mr-8">
                  <span>বিনীত নিবেদক</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ১০. দরপত্র খোলা সীট (TMPL-10)                                              */}
          {/* ========================================================================= */}
          {template.id === "tender-opening" && (() => {
            const openingList: TenderOpeningEntry[] =
              data.tenderOpeningList && data.tenderOpeningList.length > 0
                ? data.tenderOpeningList
                : data.tenderer1 || data.tenderer2 || data.tenderer3
                ? [
                    { name: data.tenderer1 || "", quotedPrice: data.tenderer1Price || "" },
                    { name: data.tenderer2 || data.contractorName || "", quotedPrice: data.tenderer2Price || "" },
                    { name: data.tenderer3 || "", quotedPrice: data.tenderer3Price || "" },
                  ]
                : DEFAULT_TENDER_OPENING_LIST;

            return (
              <div className="space-y-2">
                <div className="text-center">
                  {/* <div>সাধারণ</div> */}
                  <div className="text-lg sm:text-xl mt-0.5 font-normal">দরপত্র খোলা সীট</div>
                </div>

                <div className="py-1 pl-1">
                  <table className="border-collapse border-none text-inherit w-full">
                    <tbody>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রাক্কলনমূল্য</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{estimatedVal} ({estimatedWords})</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">দরপত্র খোলার তারিখ</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{formatDate(data.tenderOpeningDateTime, "১৫/১০/২০২৬ সময়: ২.৩০ ঘটিকা")}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="w-full border-collapse border border-black text-sm sm:text-[15px] my-2">
                  <thead>
                    <tr className="border-b border-black text-center">
                      <th className="border-r border-black p-2 w-14 font-normal">ক্রমিক</th>
                      <th className="border-r border-black p-2 text-left font-normal">দরপত্রদাতার নাম ও ঠিকানা</th>
                      <th className="p-2 text-left w-64 sm:w-80 font-normal">উদ্ধৃত দর (টাকা)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openingList.map((tenderer, idx) => (
                      <tr key={idx} className="border-b border-black">
                        <td className="border-r border-black p-2.5 text-center">
                          {toBanglaDigits(String(idx + 1).padStart(2, "0"))}
                        </td>
                        <td className="border-r border-black p-2.5">
                          {tenderer.name || "—"}
                        </td>
                        <td className="p-2.5">
                          {formatAmountWithWords(tenderer.quotedPrice)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-justify leading-relaxed py-1">
                  <span>বিবরণ: অদ্য {formatDate(data.tenderSubmissionLastDate, "১৫/১০/২০২৬")} তারিখে নির্ধারিত সময়ে উপস্থিত সকলের সম্মুখে দরপত্র বাক্স খোলা হলো এবং মোট {toBanglaDigits(String(openingList.length))}টি দরপত্র পাওয়া গেল।</span>
                </div>

                <div className="pt-4">
                  <div className="mb-6">দরপত্র খোলা কমিটির সদস্যবৃন্দের স্বাক্ষর:</div>
                  <table className="w-full border-collapse border-none text-center text-sm sm:text-[15px]">
                    <tbody>
                      <tr>
                        <td style={{ width: "33.33%" }} className="w-1/3 text-center align-top">
                          <div>সদস্য</div>
                          <div>দরপত্র খোলা কমিটি</div>
                        </td>
                        <td style={{ width: "33.33%" }} className="w-1/3 text-center align-top">
                          <div>সদস্য-সচিব</div>
                          <div>দরপত্র খোলা কমিটি</div>
                        </td>
                        <td style={{ width: "33.33%" }} className="w-1/3 text-center align-top">
                          <div>আহ্বায়ক</div>
                          <div>দরপত্র খোলা কমিটি</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="pt-4">
                  <div className="mb-2">উপস্থিত দরপত্র দাতাদের স্বাক্ষর:</div>
                  <div className="space-y-2 font-mono">
                    {openingList.map((_, idx) => (
                      <div key={idx}>
                        {toBanglaDigits(String(idx + 1))}.................................
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* ১৫. দরপত্র মূল্যায়ন সিট (TMPL-15 - হুবহু ইউজারের ডকুমেন্টের অনুরূপ)         */}
          {/* ========================================================================= */}

          {template.id === "tender-evaluation" && (() => {
            const evaluationList: TenderEvaluationEntry[] =
              data.tenderEvaluationList && data.tenderEvaluationList.length > 0
                ? data.tenderEvaluationList
                : DEFAULT_TENDER_EVALUATION_LIST;

            const t15Date = formatDate(data.tenderEvaluationDate, "১০/১০/২০২৩");

            // Winning / lowest responsive bidder
            const winningEntry =
              evaluationList.find(
                (e) =>
                  e.position?.trim() === "১ম" ||
                  e.position?.trim() === "১" ||
                  e.position?.trim() === "1" ||
                  e.position?.trim() === "1st"
              ) || evaluationList[0];

            const winningName =
              winningEntry?.name ||
              data.contractorFirm ||
              (data.contractorName
                ? data.contractorName.split("(")[0].trim()
                : data.contractorAndFirm
                  ? data.contractorAndFirm.split("(")[0].trim()
                  : "বারাকাত ডেভেলপমেন্ট");

            return (
              <div className="space-y-3">
                <div className="text-center">
                  {/* <div className="text-sm">সাধারণ</div> */}
                  <div className="text-lg sm:text-xl mt-0.5 font-normal">
                    দরপত্র মূল্যায়ন সিট
                  </div>
                </div>

                <div className="py-1 pl-1">
                  <table className="border-collapse border-none text-inherit w-full">
                    <tbody>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">
                          প্রকল্পের নাম
                        </td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">
                          {projectVal}। <span className="ml-8">তারিখ: {t15Date}</span>
                        </td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">
                          চুক্তিমূল্য
                        </td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{contractVal}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Dynamic Evaluation Table */}
                <table className="w-full border-collapse border border-black text-sm sm:text-[15px] my-2">
                  <thead>
                    <tr className="border-b border-black text-center">
                      <th rowSpan={2} className="border-r border-black p-2 w-12 font-normal">
                        ক্রমিক
                      </th>
                      <th rowSpan={2} className="border-r border-black p-2 font-normal">
                        দরপ্রদাতার নাম
                      </th>
                      <th colSpan={3} className="border-r border-black p-2 font-normal">
                        প্রয়োজনীয় কাগজপত্র দাখিল (হ্যাঁ/না)
                      </th>
                      <th rowSpan={2} className="border-r border-black p-2 font-normal">
                        দর (টাকা)
                      </th>
                      <th rowSpan={2} className="border-r border-black p-2 font-normal">
                        কারিগরিভাবে গ্রহণযোগ্য কিনা
                      </th>
                      <th rowSpan={2} className="border-r border-black p-2 w-16 font-normal">
                        অবস্থান
                      </th>
                      <th rowSpan={2} className="p-2 w-20 font-normal">
                        মন্তব্য
                      </th>
                    </tr>
                    <tr className="border-b border-black text-center">
                      <th className="border-r border-black p-1.5 font-normal w-24">
                        ট্রেড লাইসেন্স
                      </th>
                      <th className="border-r border-black p-1.5 font-normal w-16">
                        টিন
                      </th>
                      <th className="border-r border-black p-1.5 font-normal w-20">
                        অভিজ্ঞতা
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluationList.map((entry, idx) => (
                      <tr key={idx} className="border-b border-black text-center align-middle">
                        <td className="border-r border-black p-2.5">
                          {toBanglaDigits(String(idx + 1).padStart(2, "0"))}
                        </td>
                        <td className="border-r border-black p-2.5 text-left font-normal">
                          {entry.name || "—"}
                        </td>
                        <td className="border-r border-black p-2.5 font-normal">
                          {entry.tradeLicense || "হ্যাঁ"}
                        </td>
                        <td className="border-r border-black p-2.5 font-normal">
                          {entry.tinCertificate || "হ্যাঁ"}
                        </td>
                        <td className="border-r border-black p-2.5 font-normal">
                          {entry.experience || "হ্যাঁ"}
                        </td>
                        <td className="border-r border-black p-2.5 text-left leading-relaxed font-normal">
                          {entry.quotedRate ? formatAmountWithWords(entry.quotedRate) : "—"}
                        </td>
                        <td className="border-r border-black p-2.5 font-normal">
                          {entry.isResponsive || "হ্যাঁ"}
                        </td>
                        <td className="border-r border-black p-2.5 font-normal">
                          {entry.position || toBanglaDigits(String(idx + 1))}
                        </td>
                        <td className="p-2.5 font-normal">
                          {entry.remarks || ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-justify leading-relaxed pt-2">
                  <span>
                    মূল্যায়ন ফলাফল: অদ্য {t15Date} তারিখে দরপত্র মূল্যায়ন কমিটির সভায় দাখিলকৃত দরপত্রসমূহ যাচাই-বাছাই করা হয়। সকল কাগজপত্র ও উদ্ধৃত দর বিবেচনা করে সর্বনিম্ন দরদাতা হিসেবে {winningName} কে নির্বাচন করার সুপারিশ করা হলো।
                  </span>
                </div>

                <div className="pt-12">
                  <table className="w-full border-collapse border-none text-center text-sm sm:text-[15px]">
                    <tbody>
                      <tr>
                        <td style={{ width: "33.33%" }} className="w-1/3 text-center align-top">
                          <div>সদস্য</div>
                          <div>দরপত্র মূল্যায়ন কমিটি</div>
                        </td>
                        <td style={{ width: "33.33%" }} className="w-1/3 text-center align-top">
                          <div>সদস্য-সচিব</div>
                          <div>দরপত্র মূল্যায়ন কমিটি</div>
                        </td>
                        <td style={{ width: "33.33%" }} className="w-1/3 text-center align-top">
                          <div>আহ্বায়ক</div>
                          <div>দরপত্র মূল্যায়ন</div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* ১৬. ওয়ার্ড কমিটি সভা ০১ - দরপত্র ও কার্যাদেশ (TMPL-16)                     */}
          {/* ========================================================================= */}

          {template.id === "ward-meeting-01" && (() => {
            const meetingDate1 = formatDate(data.meetingDate1 || data.meetingDate, "২৩/০৪/২০২৬");

            return (
              <div className="space-y-2">
                <div className="text-center">
                  {/* <div>সাধারণ</div> */}
                  <div className="text-lg sm:text-xl mt-0.5 font-normal">ওয়ার্ড কমিটি সভার কার্যবিবরণী</div>
                </div>

                <div className="py-1 pl-1">
                  <table className="border-collapse border-none text-inherit w-full">
                    <tbody>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভার নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">ওয়ার্ড কমিটি সভার কার্যবিবরণী</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রাক্কলন মূল্য</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{estimatedVal} ({estimatedWords})</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভা নং</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">০১</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভার তারিখ</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{meetingDate1} {meetingTimeVal}। স্থান: {fallback(data.meetingPlace, "ইউপি কার্যালয়")}</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভাপতির নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{presidentVal}, ইউপি সদস্য {unionVal}, {upazilaVal}, {districtVal}।</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 7 Member Table */}
                <table className="w-full border-collapse border border-black text-sm sm:text-[14.5px] my-1.5 table-fixed">
                  <thead>
                    <tr className="border-b border-black text-center bg-neutral-50/40">
                      <th className="border-r border-black py-1 px-1 w-[7%] font-normal">ক্রমিক</th>
                      <th className="border-r border-black py-1 px-1.5 w-[20%] font-normal text-left">নাম</th>
                      <th className="border-r border-black py-1 px-1.5 w-[18%] font-normal text-left">পিতার নাম</th>
                      <th className="border-r border-black py-1 px-1 w-[12%] font-normal">গ্রাম</th>
                      <th className="border-r border-black py-1 px-1 w-[12%] font-normal">পদবী</th>
                      <th className="border-r border-black py-1 px-1 w-[13%] font-normal">কমিটির পদবী</th>
                      <th className="py-1 px-1.5 w-[18%] min-w-[120px] font-normal">স্বাক্ষর</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((m, idx) => (
                      <tr key={idx} className="border-b border-black h-9">
                        <td className="border-r border-black py-1 px-1 text-center align-middle">{toBanglaDigits(String(idx + 1).padStart(2, "0"))}</td>
                        <td className="border-r border-black py-1 px-1.5 align-middle truncate">{m.name || "—"}</td>
                        <td className="border-r border-black py-1 px-1.5 align-middle truncate">{m.fatherName || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.village || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.designation || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.committeeRole || "—"}</td>
                        <td className="py-1 px-1.5 align-middle"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="pt-1 text-justify leading-relaxed">
                  <div>আলোচ্য বিষয় ও সিদ্ধান্তসমূহ:</div>
                  <div className="pt-0.5">ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল নির্দেশিকা অনুযায়ী দরপত্র উন্মুক্তকরণ, মূল্যায়ন, এনওএ প্রদান ও কার্যাদেশ সংক্রান্ত।</div>
                  <div className="pt-0.5">অদ্য সভার সভাপতি মহোদয় উপস্থিত সকল সদস্যকে স্বাগত জানিয়ে সভার কাজ শুরু করেন। সভায় নিম্নোক্ত বিষয়সমূহ বিস্তারিত আলোচনা ও সিদ্ধান্ত গৃহীত হয়:</div>

                  <div className="space-y-1 pt-1.5">
                    <div>১. দরপত্র উন্মুক্তকরণ: নির্ধারিত সময়সীমার মধ্যে দাখিলকৃত সকল দরপত্রসমূহ উপস্থিত সদস্যদের সামনে উন্মুক্ত করা হলো। উপস্থিত দরদাতাদের দাখিলকৃত দর ও প্রয়োজনীয় জামানত পরীক্ষা করা হলো।</div>
                    <div>২. দরপত্র মূল্যায়ন: উন্মুক্তকৃত দরপত্রসমূহ বিস্তারিত যাচাই-বাছাই ও মূল্যায়ন করা হলো। তুলনামূলক বিবরণী অনুযায়ী দেখা যায় যে, সর্বনিম্ন দরদাতা পিপিআর এর সকল শর্ত পূরণ করেছে এবং কারিগরিভাবে যোগ্য বিবেচিত হয়েছে।</div>
                    <div>৩. এনওএ ও কার্যাদেশ: সর্বনিম্ন দরদাতাকে চূড়ান্তভাবে নির্বাচিত করে নোটিফিকেশন অব অ্যাওয়ার্ড প্রদানের সিদ্ধান্ত নেওয়া হলো। চুক্তিপত্র সম্পাদন সাপেক্ষে প্রকল্পের কাজ দ্রুত শুরু করার জন্য কার্যাদেশ প্রদানের অনুমতি প্রদান হলো।</div>
                  </div>

                  <div className="pt-2">
                    <div>গৃহীত সিদ্ধান্তসমূহ:</div>
                    <div className="pl-4 space-y-0.5 pt-0.5">
                      <div>• সর্বনিম্ন ও যোগ্য দরদাতাকে কাজটির জন্য নির্বাচন করা হলো।</div>
                      <div>• দ্রুততম সময়ের মধ্যে চুক্তিপত্র সম্পাদন ও কার্যাদেশ প্রদান করা হবে।</div>
                      <div>• সরকারি বিধি মোতাবেক আয়কর ও ভ্যাট কর্তন করা হবে।</div>
                    </div>
                  </div>
                </div>

                <div className="pt-6 text-right">
                  <div className="inline-block text-center mr-8">
                    <span>সভাপতি</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* ১৩. ওয়ার্ড কমিটি সভা ০২ - কাজ আরম্ভ ও অনুমোদন (TMPL-13)                   */}
          {/* ========================================================================= */}
          {template.id === "ward-meeting-start" && (() => {
            const meetingDate2 = formatDate(
              data.meetingDate2 ||
                (data.workOrderDate && data.workOrderDate !== (data.meetingDate1 || data.meetingDate)
                  ? data.workOrderDate
                  : ""),
              "১৫/১০/২০২৬"
            );

            return (
              <div className="space-y-2">
                <div className="text-center">
                  {/* <div>সাধারণ</div> */}
                  <div className="text-lg sm:text-xl mt-0.5 font-normal">ওয়ার্ড কমিটি সভার কার্যবিবরণী</div>
                </div>

                <div className="py-1 pl-1">
                  <table className="border-collapse border-none text-inherit w-full">
                    <tbody>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভার নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">ওয়ার্ড কমিটি সভার কার্যবিবরণী</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রাক্কলন মূল্য</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{estimatedVal} ({estimatedWords})</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভা নং</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">০২</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভার তারিখ</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{meetingDate2} {meetingTimeVal}। স্থান: {fallback(data.meetingPlace, "ইউপি কার্যালয়")}</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভাপতির নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{presidentVal}, ইউপি সদস্য {unionVal}, {upazilaVal}, {districtVal}।</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="w-full border-collapse border border-black text-sm sm:text-[14.5px] my-2 table-fixed">
                  <thead>
                    <tr className="border-b border-black text-center bg-neutral-50/40">
                      <th className="border-r border-black py-1 px-1 w-[7%] font-normal">ক্রমিক</th>
                      <th className="border-r border-black py-1 px-1.5 w-[20%] font-normal text-left">নাম</th>
                      <th className="border-r border-black py-1 px-1.5 w-[18%] font-normal text-left">পিতার নাম</th>
                      <th className="border-r border-black py-1 px-1 w-[12%] font-normal">গ্রাম</th>
                      <th className="border-r border-black py-1 px-1 w-[12%] font-normal">পদবী</th>
                      <th className="border-r border-black py-1 px-1 w-[13%] font-normal">কমিটির পদবী</th>
                      <th className="py-1 px-1.5 w-[18%] min-w-[120px] font-normal">স্বাক্ষর</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((m, idx) => (
                      <tr key={idx} className="border-b border-black h-9">
                        <td className="border-r border-black py-1 px-1 text-center align-middle">{toBanglaDigits(String(idx + 1).padStart(2, "0"))}</td>
                        <td className="border-r border-black py-1 px-1.5 align-middle truncate">{m.name || "—"}</td>
                        <td className="border-r border-black py-1 px-1.5 align-middle truncate">{m.fatherName || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.village || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.designation || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.committeeRole || "—"}</td>
                        <td className="py-1 px-1.5 align-middle"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-justify leading-relaxed">
                  <span>অদ্য সংশ্লিষ্ট ওয়ার্ডের ইউপি সদস্য ও ওয়ার্ড কমিটির সভাপতি সভাপতিত্বে এক সভা অনুষ্ঠিত হয়। সভায় ওয়ার্ড কমিটির সদস্য-সচিবসহ সংখ্যাগরিষ্ঠ সদস্যগণ উপস্থিত ছিলেন। সভার শুরুতে সভাপতি সকলকে স্বাগত জানান এবং আলোচ্যসূচি আলোচনা শুরু করেন।</span>
                </div>

                <div className="pt-1">
                  <div>আলোচ্য বিষয় ও সিদ্ধান্তসমূহ:</div>
                  <div className="pl-4 space-y-1 pt-1 text-justify leading-relaxed">
                    <div>• প্রকল্প পরিচিত: সভাপতি উপস্থিত সকলকে এলজিএসপি-৩/উন্নয়ন সহায়তা তহবিলের আওতায় গৃহীত রাস্তার উন্নয়ন প্রকল্পের বিস্তারিত প্রাক্কলন ও নকশা বুঝিয়ে বলেন।</div>
                    <div>• কাজ আরম্ভের তারিখ: সভায় সর্বসম্মতিক্রমে সিদ্ধান্ত হয় যে, আগামী ৭ দিনের মধ্যে প্রকল্পের বাস্তব কাজ শুরু করা হবে। ঠিকাদারকে দ্রুত প্রয়োজনীয় মালামাল সাইটে আনার জন্য অনুরোধ করা হয়।</div>
                    <div>• তদারকি ও মান নিয়ন্ত্রণ: কাজ চলাকালীন ওয়ার্ড কমিটির পক্ষ থেকে নিয়মিত তদারকি করার জন্য একটি উপ-কমিটি গঠন করা হয়। প্রাক্কলন বহির্ভূত কোনো কাজ বা নিম্নমানের সামগ্রী ব্যবহার করলে সাথে সাথে কর্তৃপক্ষকে অবহিত করার সিদ্ধান্ত গৃহীত হয়।</div>
                    <div>• জনসচেতনতা ও সহযোগিতা: রাস্তার কাজ চলাকালীন স্থানীয় জনগণের যাতায়াতে সাময়িক অসুবিধার জন্য ক্ষমা প্রার্থনা করা হয় এবং সকলকে সহযোগিতার করার আহ্বান জানানো হয়।</div>
                  </div>
                </div>

                <div className="pt-8 text-right">
                  <div className="inline-block text-center mr-8">
                    <span>সভাপতি</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* ৫. ওয়ার্ড কমিটি সভা ০৩ - কাজ সমাপ্তি ও চূড়ান্ত বিল (TMPL-05)               */}
          {/* ========================================================================= */}
          {template.id === "ward-meeting-finish" && (() => {
            const meetingDate3 = formatDate(
              data.meetingDate3,
              "০৫/১১/২০২৬"
            );

            return (
              <div className="space-y-2">
                <div className="text-center">
                  {/* <div>সাধারণ</div> */}
                  <div className="text-lg sm:text-xl mt-0.5 font-normal">ওয়ার্ড কমিটি সভার কার্যবিবরণী</div>
                </div>

                <div className="py-1 pl-1">
                  <table className="border-collapse border-none text-inherit w-full">
                    <tbody>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভার নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">ওয়ার্ড কমিটি সভার কার্যবিবরণী</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">চুক্তিমূল্য</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{contractVal} ({contractWords})</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভা নং</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">০৩</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভার তারিখ</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{meetingDate3} {meetingTimeVal}। স্থান: {fallback(data.meetingPlace, "ইউপি কার্যালয়")}</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">সভাপতির নাম</td>
                        <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                        <td className="py-0.5 pl-2 align-top">{presidentVal}, ইউপি সদস্য {unionVal}, {upazilaVal}, {districtVal}।</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <table className="w-full border-collapse border border-black text-sm sm:text-[14.5px] my-2 table-fixed">
                  <thead>
                    <tr className="border-b border-black text-center bg-neutral-50/40">
                      <th className="border-r border-black py-1 px-1 w-[7%] font-normal">ক্রমিক</th>
                      <th className="border-r border-black py-1 px-1.5 w-[20%] font-normal text-left">নাম</th>
                      <th className="border-r border-black py-1 px-1.5 w-[18%] font-normal text-left">পিতার নাম</th>
                      <th className="border-r border-black py-1 px-1 w-[12%] font-normal">গ্রাম</th>
                      <th className="border-r border-black py-1 px-1 w-[12%] font-normal">পদবী</th>
                      <th className="border-r border-black py-1 px-1 w-[13%] font-normal">কমিটির পদবী</th>
                      <th className="py-1 px-1.5 w-[18%] min-w-[120px] font-normal">স্বাক্ষর</th>
                    </tr>
                  </thead>
                  <tbody>
                    {committeeList.map((m, idx) => (
                      <tr key={idx} className="border-b border-black h-9">
                        <td className="border-r border-black py-1 px-1 text-center align-middle">{toBanglaDigits(String(idx + 1).padStart(2, "0"))}</td>
                        <td className="border-r border-black py-1 px-1.5 align-middle truncate">{m.name || "—"}</td>
                        <td className="border-r border-black py-1 px-1.5 align-middle truncate">{m.fatherName || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.village || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.designation || "—"}</td>
                        <td className="border-r border-black py-1 px-1 text-center align-middle truncate">{m.committeeRole || "—"}</td>
                        <td className="py-1 px-1.5 align-middle"></td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="text-justify leading-relaxed">
                  <span>অদ্য সংশ্লিষ্ট ওয়ার্ডের ইউপি সদস্য ও ওয়ার্ড কমিটির সভাপতি সভাপতিত্বে এক সভা অনুষ্ঠিত হয়। সভায় ওয়ার্ড কমিটির সদস্য-সচিবসহ সংখ্যাগরিষ্ঠ সদস্যগণ উপস্থিত ছিলেন। সভার শুরুতে সভাপতি সকলকে গত কয়েক মাস যাবৎ চলমান রাস্তা উন্নয়ন কাজের সমাপ্তি সম্পর্কে অবহিত করেন।</span>
                </div>

                <div className="pt-1">
                  <div>আলোচ্য বিষয় ও সিদ্ধান্তসমূহ:</div>
                  <div className="pl-4 space-y-1.5 pt-1 text-justify leading-relaxed">
                    <div>• কাজ সমাপ্তি ও সরেজমিনে পরিদর্শন: সভায় জানানো হয় যে {projectVal} প্রকল্পের নির্মাণ কাজ প্রাক্কলন ও নকশা অনুযায়ী শতভাগ সম্পন্ন হয়েছে। ওয়ার্ড কমিটির সকল সদস্য সরেজমিনে কাজ পরিদর্শন করেন এবং কাজের গুণগত মানের সন্তোষ প্রকাশ করেন।</div>
                    <div>• প্রকৌশলী ও তদারকি কমিটির মতামত: সভায় জানানো হয় যে, সংশ্লিষ্ট উপ সহকারী প্রকৌশলী ইতিপূর্বে কাজ পরিদর্শন করিয়াছেন এবং কাজ পরিমাপ করিয়াছেন। তদারকি কমিটিও কাজের সঠিকতা নিশ্চিত করিয়াছেন।</div>
                    <div>• চূড়ান্ত বিল পরিশোধের সুপারিশ: প্রকল্পের কাজ সন্তোষজনকভাবে এবং চুক্তি মোতাবেক সম্পন্ন হওয়ায় ঠিকাদারের অনুকূলে চুক্তিমূল্য {contractVal} ({contractWords}) চূড়ান্ত বিল পরিশোধ এর জন্য ইউনিয়ন পরিষদ বরাবরে সুপারিশ করার সিদ্ধান্ত গৃহীত হইল।</div>
                    <div>• রক্ষণাবেক্ষণ ও জনসচেতনতা: নবনির্মিত রাস্তাটি যেন দীর্ঘস্থায়ী হয় এবং কোনো ভারী যানবাহন চলাচলের ফলে ক্ষতিগ্রস্ত না হয়, সে বিষয়ে স্থানীয় জনগণকে সচেতন করার সিদ্ধান্ত নেওয়া হয়।</div>
                  </div>
                </div>

                <div className="text-justify leading-relaxed pt-1">
                  <span>অবশেষে প্রকল্পের সফল সমাপ্তির জন্য সকলকে ধন্যবাদ জানিয়ে সভাপতি সভার সমাপ্তি ঘোষণা করেন।</span>
                </div>

                <div className="pt-6 text-right">
                  <div className="inline-block text-center mr-8">
                    <span>সভাপতি</span>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ========================================================================= */}
          {/* ২. ইউপি প্যাডে প্রকল্প কাজের চূড়ান্ত বিল ও কর্তন বিবরণী (TMPL-02)          */}
          {/* ========================================================================= */}
          {template.id === "final-bill" && (
            <div className="space-y-2">
              <div className="py-1 pl-1">
                <table className="border-collapse border-none text-inherit w-full">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top" colSpan={3}>{projectVal} প্রকল্প কাজের চুড়ান্ত বিল।</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">ঠিকাদের নাম</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top" colSpan={3}>{fallback(data.contractorName, "বারাকাত ডেভেলপমেন্ট")}</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">কার্যাদেশ নং</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{workOrderNo}</td>
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top text-right">তারিখ :</td>
                      <td className="py-0.5 pl-1.5 align-top whitespace-nowrap">{formatDate(data.billDate, "১০/১০/২০২৬")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <table className="w-full border-collapse border border-black text-sm sm:text-[15px] my-2">
                <thead>
                  <tr className="border-b border-black text-center">
                    <th className="border-r border-black p-2 text-left font-normal">বিবরণ</th>
                    <th className="border-r border-black p-2 w-28 font-normal">চুক্তিমূল্য</th>
                    <th className="border-r border-black p-2 w-36 font-normal">সম্পাদিত কাজের মূল্য</th>
                    <th className="p-2 w-20 font-normal">মন্তব্য</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2">
                      {projectVal} বাস্তবায়নের চুড়ান্ত বিল।
                    </td>
                    <td className="border-r border-black p-2 text-center font-mono">
                      {contractVal}
                    </td>
                    <td className="border-r border-black p-2 text-center font-mono">
                      {formatMoney(data.executedWorkValue || data.contractValue, "১,৭৪,০০০/-")}
                    </td>
                    <td className="p-2 text-center">কাজ সম্পন্ন</td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="border-r border-black p-2 text-right">মোট টাকা:</td>
                    <td className="border-r border-black p-2 text-center font-mono">
                      {contractVal}
                    </td>
                    <td className="border-r border-black p-2 text-center font-mono">
                      {contractVal}
                    </td>
                    <td className="p-2 text-center"></td>
                  </tr>
                </tbody>
              </table>

              <div className="py-0.5">
                কথায়: {getInWords(data.billAmount || data.contractValue, data.billAmountInWords, contractVal)}
              </div>

              <div className="space-y-1 pt-1">
                <div>কর্তন বিবরণী (অফিস ব্যবহারের জন্য):</div>
                <div className="py-1 pl-1">
                  <table className="border-collapse border-none text-inherit">
                    <tbody>
                      <tr className="leading-relaxed">
                        <td className="py-1 pr-2 whitespace-nowrap align-top">১. চুক্তিমূল্য</td>
                        <td className="py-1 px-3 align-top text-center">:</td>
                        <td className="py-1 pl-1 align-top">{contractVal} ({contractWords})</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-1 pr-2 whitespace-nowrap align-top">২. আয়কর ({dynamicTaxRate})</td>
                        <td className="py-1 px-3 align-top text-center">:</td>
                        <td className="py-1 pl-1 align-top">{formatMoney(data.tax, "১৩,০৫০/-")} ({numberToBanglaWords(data.tax || "13050", { includeTaka: false })}) টাকা</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-1 pr-2 whitespace-nowrap align-top">৩. ভ্যাট ({dynamicVatRate})</td>
                        <td className="py-1 px-3 align-top text-center">:</td>
                        <td className="py-1 pl-1 align-top">{formatMoney(data.vat, "১৭,৪০০/-")} ({numberToBanglaWords(data.vat || "17400", { includeTaka: false })}) টাকা</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-1 pr-2 whitespace-nowrap align-top">৪. জামানত ({dynamicSdRate})</td>
                        <td className="py-1 px-3 align-top text-center">:</td>
                        <td className="py-1 pl-1 align-top">{formatMoney(data.securityDeposit, "৮,৭০০/-")} ({numberToBanglaWords(data.securityDeposit || "8700", { includeTaka: false })}) টাকা</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-1 pr-2 whitespace-nowrap align-top">৫. সর্বমোট কর্তন</td>
                        <td className="py-1 px-3 align-top text-center">:</td>
                        <td className="py-1 pl-1 align-top">{formatMoney(data.totalDeduction, "৩৯,১৫০/-")} ({numberToBanglaWords(data.totalDeduction || "39150", { includeTaka: false })}) টাকা।</td>
                      </tr>
                      <tr className="leading-relaxed">
                        <td className="py-1 pr-2 whitespace-nowrap align-top">৬. নিট প্রদেয় বিল</td>
                        <td className="py-1 px-3 align-top text-center">:</td>
                        <td className="py-1 pl-1 align-top">{netPayVal} ({netPayWords}) টাকা।</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="pt-2 space-y-1 text-justify leading-relaxed">
                <div>হিসাব নিরীক্ষকের সার্টিফিকেট:</div>
                <div>বিলটি যথাযথভাবে যাচাই করা হয়েছে। প্রাক্কলন ও পরিমাপ বই অনুযায়ী বিলের অংক সঠিক পাওয়া গেছে। বাজেট বরাদ্দ সাপেক্ষে বিলটি পরিশোধ করা যেতে পারে।</div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ৪. ইউপি প্যাড — চেয়ারম্যানের প্রত্যয়ন পত্র (TMPL-04)                       */}
          {/* ========================================================================= */}
          {template.id === "chairman-cert" && (
            <div className="space-y-2">
              {/* <div className="text-left text-neutral-800 mb-1">
                <span>ইউপি প্যাড</span>
              </div> */}

              <div className="text-center">
                <div className="text-lg sm:text-xl font-normal">চেয়ারম্যানের প্রত্যয়ন পত্র</div>
              </div>

              <div className="py-1 pl-1">
                <table className="border-collapse border-none text-inherit">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">প্রকল্পের নাম</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{projectVal}।</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-1 pr-2 whitespace-nowrap align-top">চুক্তিমূল্য</td>
                      <td className="py-1 px-3 align-top text-center">:</td>
                      <td className="py-1 pl-1 align-top">{contractVal} ({contractWords})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-justify leading-relaxed">
                <span>এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল এর আওতায় বাস্তবায়িত উপরোক্ত প্রকল্পের নির্মাণ কাজ সজমিনে তদারকি কমিটি এবং সংশ্লিষ্ট উপ- সহকারী প্রকৌশলী কর্তৃক পরিদর্শন ও যাচাই করা হয়েছে। পরিদর্শন প্রতিবেদন ও প্রকৌশলী দাখিলকৃত পরিমাপ বই অনুযায়ী প্রকল্পের কাজটি অনুমোদিত প্রাক্কলন ও নকশা মোতাবেক সন্তোষজনকভাবে সম্পন্ন হয়েছে।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>প্রকল্পটি বাস্তবায়নের ফলে স্থানীয় জনগণের যাতায়াত সুবিধার উন্নয়ন ঘটেছে এবং সংশ্লিষ্ট এলাকায় সরকারি উন্নয়ন সহায়তা তহবিলের যথাযথ ব্যবহার নিশ্চিত হয়েছে। প্রকল্পের কাজ গুণগত মানসম্পন্ন হওয়ায় এবং যাবতীয় দাপ্তরিক প্রক্রিয়া সম্পন্ন হওয়ায় আমি প্রকল্পটির চূড়ান্ত বিল পরিশোধের জন্য অত্র প্রত্যয়ন পত্র প্রদান করছি।</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ১৪. চুক্তিপত্র দলিল — ৩ পাতার পূর্ণাঙ্গ রূপ (TMPL-14)                        */}
          {/* ========================================================================= */}
          {template.id === "contract-deed" && (
            <div className="space-y-4">
              {/* PAGE 1 */}
              {(contractPage === 1 || contractPage === "all") && (
                <div className="space-y-2">
                  <div className="text-center font-normal">
                    <div>পাতা নং (১)</div>
                    <div className="text-lg sm:text-xl mt-0.5 font-normal">চুক্তিপত্র</div>
                    <div className="text-sm sm:text-[15px] mt-0.5">ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল ব্যবহার নির্দেশিকা অনুযায়ী</div>
                    <div className="text-sm sm:text-[15px]">{unionVal} কার্যালয়, {upazilaVal}, {districtVal}।</div>
                  </div>

                  <div className="text-justify leading-relaxed">
                    <span>অদ্য {formatDate(data.contractDate || data.agreementDate, "১০/১০/২০২৬")} তারিখে {unionVal} কার্যালয় এর পক্ষে চেয়ারম্যান (যিনি অতঃপর নিয়োগকারী বা প্রথম পক্ষ হিসেবে অভিহিত) এবং {fallback(data.contractorName, "মোসাঃ জেসমিন আরা")} {fallback(data.contractorAddress, "ঘোড়ামারা, বোয়ালিয়া, রাজশাহী")} (যিনি অতঃপর ঠিকাদার বা দ্বিতীয় পক্ষ হিসেবে অবহিত) এর মধ্যে এই চুক্তিপত্রটি সম্পাদিত হইল।</span>
                  </div>

                  <div className="pt-1">
                    <div>প্রকল্পের বিবরণ:</div>
                    <div className="py-1 pl-1">
                      <table className="border-collapse border-none text-inherit w-full">
                        <tbody>
                          <tr className="leading-relaxed">
                            <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                            <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                            <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                          </tr>
                          <tr className="leading-relaxed">
                            <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">চুক্তিমূল্য</td>
                            <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                            <td className="py-0.5 pl-2 align-top">{contractVal} ({contractWords})</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <div>চুক্তির শর্তাবলী</div>
                  </div>

                  <div className="text-justify leading-relaxed">
                    <span>১. দ্বিতীয় পক্ষ সরকার অনুমোদিত ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল ব্যবহার নির্দেশিকা এবং সরবরাহকৃত প্রাক্কলন ও নকশা অনুযায়ী নির্ধারিত কাজ যথাযথভাবে সম্পন্ন করিবেন।</span>
                  </div>

                  <div className="pt-12 text-right text-sm">
                    <span>চলমান পাতা</span>
                  </div>
                </div>
              )}

              {/* Page separator if viewing all pages */}
              {contractPage === "all" && (
                <div className="print-break-after-page border-b-2 border-dashed border-neutral-300 my-10 print:border-0 print:my-0" />
              )}

              {/* PAGE 2 */}
              {(contractPage === 2 || contractPage === "all") && (
                <div className="space-y-3">
                  {/* <div className="text-left text-neutral-400 text-sm">
                    <span>স্ট্যাম্প</span>
                  </div> */}

                  {/* Stamp space for physical 100/300-taka non-judicial stamp (handled by 30% @page top margin in print) */}
                  <div className="h-28 sm:h-36 print:hidden" />

                  <div className="text-center font-normal">
                    <span>পাতা নং (২)</span>
                  </div>

                  <div className="space-y-3 pt-1 text-justify leading-relaxed">
                    <div>
                      ২. কার্যাদেশ জারির ৭ দিনের মধ্যে কাজ শুরু করিতে হইবে এবং আগামী {formatDate(data.contractExpiryDate, "৩০/০৬/২০২৬")} তারিখের মধ্যে কাজ সমাপ্ত করতে হইবে।
                    </div>

                    <div>
                      ৩. কাজের গুণগত মান উন্নয়ন সহায়তা তহবিলের কারিগরি মানদণ্ড অনুযায়ী হইতে হইবে। কোনো অবস্থাতেই নিম্নমানের সামগ্রী ব্যবহার করা যাইবে না।
                    </div>

                    <div>
                      ৪. উপজেলা পর্যায়ের তদারকি কমিটি বা সংশ্লিষ্ট উপ-সহকারি প্রকৌশলী কর্তৃক কাজ পরিমাপ করিবার পর ইউনিয়ন পরিষদ বিল পরিশোধ করিবে।
                    </div>

                    <div>
                      ৫. সরকারি বিধি মোতাবেক বিল হইতে আয়কর, ভ্যাট এবং জামানত ২২.৫% কর্তন করা হইবে। জামানতের টাকা কাজ সমাপ্তির ৬ মাস পর সন্তোষজনক অবস্থায় পাওয়া গেল ফেরত প্রদান করা হইবে।
                    </div>

                    <div>
                      ৬. নির্দেশিকা অনুযায়ী প্রকল্পের স্থানে অবশ্যই একটি দৃশ্যমান সাইনবোর্ড স্থাপন করিতে হইবে।
                    </div>
                  </div>

                  <div className="pt-12 text-right text-sm">
                    <span>চলমান পাতা</span>
                  </div>
                </div>
              )}

              {/* Page separator if viewing all pages */}
              {contractPage === "all" && (
                <div className="print-break-after-page border-b-2 border-dashed border-neutral-300 my-10 print:border-0 print:my-0" />
              )}

              {/* PAGE 3 (হুবহু ইউজারের সংযুক্ত ছবির অনুরূপ) */}
              {(contractPage === 3 || contractPage === "all") && (
                <div className="space-y-3">
                  {/* <div className="text-left text-neutral-400 text-sm">
                    <span>স্ট্যাম্প</span>
                  </div> */}

                  {/* Stamp space for physical 300-taka non-judicial stamp (handled by 30% @page top margin in print) */}
                  <div className="h-32 sm:h-44 print:hidden" />

                  <div className="text-center font-normal">
                    <span>পাতা নং (৩)</span>
                  </div>

                  <div className="text-justify leading-relaxed pt-1">
                    <span>উভয় পক্ষ অত্র চুক্তিপত্রের সকল শর্ত পাঠ করিয়া ও বুঝিয়া অদ্য সাক্ষীগণের সম্মুখে স্বাক্ষর করিলেন।</span>
                  </div>

                  <div className="flex justify-between gap-8 pt-4 text-sm sm:text-[15px] items-start">
                    {/* Left Column: Witness 1, Witness 2 & Second Party (Contractor) */}
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div>স্বাক্ষীর স্বাক্ষর ১</div>
                        <div className="pt-0.5">
                          <table className="border-collapse border-none text-inherit">
                            <tbody>
                              <tr className="leading-relaxed">
                                <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">নাম</td>
                                <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                                <td className="py-0.5 pl-2 align-top"></td>
                              </tr>
                              <tr className="leading-relaxed">
                                <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">পরিচিতি</td>
                                <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                                <td className="py-0.5 pl-2 align-top"></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="pt-2 space-y-1">
                        <div>স্বাক্ষীর স্বাক্ষর ২</div>
                        <div className="h-8"></div>
                        <div>দ্বিতীয় পক্ষ</div>
                        <div className="pt-0.5">
                          <table className="border-collapse border-none text-inherit">
                            <tbody>
                              <tr className="leading-relaxed">
                                <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">নাম</td>
                                <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                                <td className="py-0.5 pl-2 align-top"></td>
                              </tr>
                              <tr className="leading-relaxed">
                                <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">পরিচয়</td>
                                <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                                <td className="py-0.5 pl-2 align-top"></td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>

                      <div className="pt-4 space-y-1.5">
                        <div>সাক্ষীগণের স্বাক্ষর :</div>
                        <div className="pt-1 space-y-2.5 text-neutral-400 font-mono tracking-widest text-sm">
                          <div>১ ..................................................</div>
                          <div>২ ..................................................</div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: First Party (Chairman) */}
                    <div className="text-right space-y-1">
                      <div className="mr-6">প্রথম পক্ষের স্বাক্ষর</div>
                      <div className="pt-8">
                        <div>চেয়ারম্যান</div>
                        <div className="text-sm">{unionVal}</div>
                        <div className="text-sm">{upazilaVal}, {districtVal}।</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ৭. প্রকৌশলগত প্রত্যয়ন পত্র (TMPL-07)                                       */}
          {/* ========================================================================= */}
          {template.id === "engineering-cert" && (
            <div className="space-y-2">
              <div className="text-center">
                {/* <div>সাধারণ</div> */}
                <div className="text-lg sm:text-xl mt-0.5 font-normal">প্রকৌশলগত প্রত্যয়ন পত্র</div>
              </div>

              <div className="py-1 pl-1">
                <table className="border-collapse border-none text-inherit w-full">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">চুক্তিমূল্য</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{contractVal} ({contractWords})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-justify leading-relaxed">
                <span>এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, উপরোক্ত প্রকল্পের নির্মাণ কাজ আমার সার্বিক তত্ত্বাবধানে সম্পাদিত হয়েছে। আমি সরেজমিনে প্রকল্পটি পরিদর্শন করেছি এবং পরিমাপ বই অনুযায়ী সম্পাদিত কাজের পরিমাণ যাচাই করেছি।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>সম্পাদিত কাজটি অনুমোদিত প্রাক্কলন, নকশা এবং এলজিইডি তথা ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল ব্যবহার নির্দেশিকার কারিগরি স্পেসিফিকেশন অনুযায়ী গুণগত মান বজায় রেখে যথাযথভাবে সম্পন্ন হয়েছে। কাজের পরিমাপ অনুযায়ী ঠিকাদার কর্তৃক দাখিলকৃত বিলটি পরিশোধযোগ্য।</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ৬. তদারকী কমিটির প্রত্যয়ন পত্র (TMPL-06)                                   */}
          {/* ========================================================================= */}
          {template.id === "monitoring-cert" && (
            <div className="space-y-2">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-normal">তদারকী কমিটির প্রত্যয়ন পত্র</div>
              </div>

              <div className="text-right text-sm sm:text-[15px]">
                <div>তারিখ: {formatDate(data.supervisionDate, "০৫/১১/২০২৬")}</div>
              </div>

              <div className="py-1 pl-1">
                <table className="border-collapse border-none text-inherit w-full">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">প্রকল্পের নাম</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">চুক্তিমূল্য</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{contractVal} ({contractWords})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-justify leading-relaxed">
                <span>এই মর্মে প্রত্যয়ন করা যাচ্ছে যে, ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল এর আওতায় বাস্তবায়িত উপরোক্ত প্রকল্পের কাজ তদারকী কমিটির সদস্যগণ কর্তৃক সরেজমিনে পরিদর্শন করা হয়েছে। পরিদর্শনকালে দেখা গেছে যে ঠিকাদার /পিআইসি কর্তৃক সম্পাদিত কাজটি অনুমোদিত প্রাক্কলন, নকশা এবং ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল ব্যবহার নির্দেশিকার কারিগরি মানদণ্ড অনুযায়ী সন্তোষজনকভাবে সম্পন্ন হয়েছে।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>উক্ত প্রকল্পের কাজে ব্যবহৃত সামগ্রীর গুণগত মান সঠিক পাওয়া গেছে এবং কাজের পরিমাপ অনুযায়ী সম্পাদিত কাজের পরিমাণ দাখিলকৃত বিলের সাথে সামঞ্জস্যপূর্ণ। এমতাবস্থায়, প্রকল্পটির চূড়ান্ত বিল পরিশোধের জন্য সুপারিশ করা হলো।</span>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ১১. এইচবিবি রাস্তা নির্মাণ কাজের দরপত্র দাখিল পত্র (TMPL-11)                */}
          {/* ========================================================================= */}
          {template.id === "tender-submission" && (
            <div className="space-y-2">
              {/* <div className="text-left text-neutral-800 mb-1">
                <span>ঠিকাদার প্যাড</span>
              </div> */}

              <div className="space-y-1">
                <div>বরাবর,</div>
                <div>চেয়ারম্যান</div>
                <div>{unionVal}</div>
                <div>{upazilaVal}, {districtVal}।</div>
              </div>

              <div>
                <span>বিষয়: এইচবিবি রাস্তা নির্মাণ কাজের দরপত্র দাখিল প্রসঙ্গে।</span>
              </div>

              <div>
                <span>মহোদয়,</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>বিনীত নিবেদন এই যে, আপনার কার্যালয় কর্তৃক প্রকাশিত দরপত্র বিজ্ঞপ্তির আলোকে আমি নিম্নস্বাক্ষরকারী আপনার ইউনিয়নের আওতাধীন {projectVal} রাস্তা নির্মাণ কাজের একজন দরদাতা হিসাবে অংশগ্রহণ করছি।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>উক্ত কাজের বিপরীতে আমার প্রস্তাবিত প্রাক্কলিক মূল্য ও প্রয়োজনীয় সকল নথিপত্র (ট্রেডলাইসেন্স, আয়কর সনদ ও অন্যান্য তথ্যাদি) এই আবেদন পত্রের সাথে সংযুক্ত করা হলো।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>অতএব মহোদয়ের নিকট প্রার্থনা, আমার দাখিলকৃত দরপত্রটি বিবেচনা পূর্বক আমাকে উক্ত উন্নয়নমূলক কাজটি করার সুযোগদানে আপনার একান্ত মর্জি হয়।</span>
              </div>

              <div className="pt-12 text-right">
                <div className="inline-block text-center mr-8">
                  <span>বিনীত নিবেদক</span>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ১৭. নোট শিট (অনুচ্ছেদ ১ থেকে ৮ পর্যন্ত পূর্ণাঙ্গ রূপ - TMPL-17)             */}
          {/* ========================================================================= */}
          {template.id === "note-sheet" && (
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-lg sm:text-xl font-normal">{unionVal}</div>
                <div className="text-lg sm:text-xl font-normal">{data.upazila?.trim() || "গোদাগাড়ী"} , {data.district?.trim() || "রাজশাহী"} ।</div>
                <div className="my-3 inline-block border-b border-black pb-0.5 text-lg  font-normal">নোট শিট</div>
                <div className="text-sm sm:text-[15px] flex items-center justify-center gap-4 mt-1">
                  <span>অর্থবছর {fallback(data.fiscalYear, "২০২৬-২০২৭")}</span>
                  <span>ওয়ার্ড নং: {fallback(data.wardNo, "০৩")}</span>
                  <span>প্রকল্প নং {fallback(data.projectNo, "০১")}</span>
                </div>
                <div className="mt-1">
                  প্রকল্পের নাম : {projectVal}
                </div>
              </div>

              <table className="w-full border-collapse border border-black text-sm sm:text-[15px] mt-3">
                <thead>
                  <tr className="border-b border-black text-center">
                    <th className="border-r border-black p-2 w-14 font-normal">অনুচ্ছেদ নং</th>
                    <th className="border-r border-black p-2 font-normal">নোটের বিবরণ ও মূল বক্তব্য</th>
                    <th className="p-2 w-48 font-normal">দাপ্তরিক স্বাক্ষর ও অনুমোদন ব্লক</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">১.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      প্রাক্কলন অনুমোদন ও তহবিল বরাদ্দ: ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল-এর বার্ষিক উন্নয়ন পরিকল্পনা অনুযায়ী {fallback(data.fiscalYear, "২০২৬-২০২৭")} অর্থবছরে &ldquo;{projectVal}&rdquo; স্কিমটি বাস্তবায়নের জন্য উপ-সহকারী প্রকৌশলী কর্তৃক {estimatedVal} ({estimatedWords}) প্রাক্কলন ও নকশা প্রস্তুত করা হয়, যা যথাযথভাবে অনুমোদিত হয়েছে।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">২.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      দরপত্র বিজ্ঞপ্তি ও দাখিল: অনুমোদিত প্রাক্কলনের আলোকে &apos;ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল ব্যবহার নির্দেশিকা&apos; অনুযায়ী সিলমোহরকৃত দরপত্র আহ্বান করে বিজ্ঞপ্তি প্রকাশ করা হয়। নির্ধারিত শেষ তারিখ ও সময়ে মোট {toBanglaDigits(String((data.tenderOpeningList && data.tenderOpeningList.length > 0 ? data.tenderOpeningList : DEFAULT_TENDER_OPENING_LIST).length))} টি দরপত্র ({(data.tenderOpeningList && data.tenderOpeningList.length > 0 ? data.tenderOpeningList.map(t => t.name.split(",")[0].trim()).filter(Boolean) : ["রেইকো", "কল্পনা এন্টারপ্রাইজ", fallback(data.contractorName, "বারাকাত ডেভেলপমেন্ট")]).join(", ")}) জমা পড়ে।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">৩.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      দরপত্র মূল্যায়ন ও সর্বনিম্ন দরদাতা নির্বাচন: {formatDate(data.agreementDate, "৩০/০৪/২০২৬")} তারিখে দরপত্র উন্মুক্তকরণ ও মূল্যায়ন কমিটির সভা অনুষ্ঠিত হয়। কমিটির যাচাই-বাছাইয়ে {fallback(data.contractorName, "বারাকাত ডেভেলপমেন্ট")}-এর দাখিলকৃত দর সর্বনিম্ন ও কারিগরিভাবে যোগ্য বিবেচিত হওয়ায় তাকে কাজটি প্রদানের জন্য সর্বসম্মত সুপারিশ করা হয়।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">৪.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      চুক্তি সম্পাদন ও কার্যাদেশ জারি: মূল্যায়ন কমিটির সুপারিশের ভিত্তিতে {formatDate(data.agreementDate, "৩০/০৪/২০২৬")} তারিখে ঠিকাদার প্রতিষ্ঠানের সাথে চুক্তি স্বাক্ষরিত হয় এবং একই দিনে ঠিকাদারকে নির্দিষ্ট সময়ের মধ্যে কাজ শুরু করার জন্য কার্যাদেশ (Work Order) প্রদান করা হয়।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">৫.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      কাজ বাস্তবায়ন এবং কমিটি ও প্রকৌশলীর প্রত্যয়ন: নির্ধারিত সময়ের মধ্যে ঠিকাদার প্রতিষ্ঠান স্কিমের কাজ সন্তোষজনকভাবে সম্পন্ন করেন। সংশ্লিষ্ট ওয়ার্ড কমিটি ও তদারকি কমিটি সরেজমিন কাজ পরিদর্শন করে সন্তোষ প্রকাশ করেন। এছাড়া {fallback(data.finalDesignation, "উপ-সহকারী প্রকৌশলী, এলজিইডি, গোদাগাড়ী")} মহোদয় কাজ পরিদর্শনপূর্বক পরিমাপ বই অনুযায়ী কাজের গুণগত মান সঠিক আছে মর্মে কারিগরি প্রত্যয়নপত্র প্রদান করেন। হিসাব নিরীক্ষক কর্তৃক বিলটি যাচাইপূর্বক সঠিক পাওয়া গেছে।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">৬.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      চূড়ান্ত বিল ও সরকারি কর্তন হিসাব: সম্পাদিত কাজের চূড়ান্ত বিলের পরিমাণ {formatMoney(data.billAmount || data.contractValue, "১,৭৪,০০০/-")} ({getInWords(data.billAmount || data.contractValue, data.billAmountInWords, contractVal)})। সরকারি বিধি অনুযায়ী প্রযোজ্য কর্তনসমূহ নিম্নরূপ:
                      <div className="mt-1 pl-2 space-y-0.5">
                        <div>• আয়কর ({dynamicTaxRate}): {formatMoney(data.tax, "১৩,০৫০/-")} ({numberToBanglaWords(data.tax || "13050", { includeTaka: false })}) টাকা</div>
                        <div>• ভ্যাট ({dynamicVatRate}): {formatMoney(data.vat, "১৭,৪০০/-")} ({numberToBanglaWords(data.vat || "17400", { includeTaka: false })}) টাকা</div>
                        <div>• জামানত ({dynamicSdRate}): {formatMoney(data.securityDeposit, "৮,৭০০/-")} ({numberToBanglaWords(data.securityDeposit || "8700", { includeTaka: false })}) টাকা</div>
                        <div>সর্বমোট কর্তন: {formatMoney(data.totalDeduction, "৩৯,১৫০/-")} ({numberToBanglaWords(data.totalDeduction || "39150", { includeTaka: false })}) টাকা</div>
                        <div>নিট প্রদেয় বিল: {netPayVal} ({netPayWords})</div>
                      </div>
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="border-b border-black align-top">
                    <td className="border-r border-black p-2 text-center">৭.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      চেক ইস্যু ও প্রাপ্তি স্বীকার: নিট প্রদেয় {netPayVal} ({netPayWords}) বিপরীতে {fallback(data.bankName, "সোনালী ব্যাংক লিমিটেড")}, {fallback(data.bankBranchName, "গোদাগাড়ী")} শাখার {fallback(data.chequeNo, "০১২৩৩৩০৯")} নম্বর চেক (তারিখ: {formatDate(data.chequeDate, "০৫/০৫/২০২৬")}) ঠিকাদারের অনুকূলে ইস্যু করা হয়। ঠিকাদার সশরীরে উপস্থিত হয়ে চেক বুঝে নেন এবং দাপ্তরিকভাবে প্রাপ্তি স্বীকারপত্র জমা দেন।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                  <tr className="align-top">
                    <td className="border-r border-black p-2 text-center">৮.</td>
                    <td className="border-r border-black p-2 text-justify leading-relaxed">
                      উপস্থাপন ও চুড়ান্ত আদেশ: যেহেতু স্কিমের কাজ সফলভাবে সম্পন্ন হয়েছে, সংশ্লিষ্ট প্রকৌশলী ও তদারকি কমিটি কর্তৃক প্রত্যয়ন প্রদান করা হয়েছে এবং বিধি মোতাবেক ভ্যাট-ট্যাক্স কর্তনপূর্বক নিট বিল পরিশোধ করে চেকের প্রাপ্তি স্বীকারপত্র সংযুক্ত করা হয়েছে, সেহেতু সম্পূর্ণ ফাইলটি নথিজাত ও সংরক্ষণের জন্য চেয়ারম্যান মহোদয়ের সদয় অবগতি ও অনুমোদনের জন্য পেশ করা হলো।
                    </td>
                    <td className="p-2"></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ১২. দরপত্র বিজ্ঞপ্তি নং ০১ (TMPL-12)                                       */}
          {/* ========================================================================= */}
          {template.id === "tender-notice" && (
            <div className="space-y-2">
              {/* <div className="text-left text-neutral-800">
                <span>ইউপি প্যাড</span>
              </div> */}

              <div className="flex justify-between items-center">
                <div>
                  দরপত্র বিজ্ঞপ্তি নং{" "}
                  {fallback(data.tenderNoticeNo, "০১")
                    .replace(/^.*\//, "")
                    .replace(/^[^\d০-৯]+/, "")
                    .trim() || "০১"}
                </div>
                <div>তারিখ: {formatDate(data.tenderNoticeDate, "১০/১০/২০২৬")}</div>
              </div>

              <div className="text-justify leading-relaxed">
                <span>ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল নির্দেশিকা অনুযায়ী উন্নয়ন সহায়তা তহবিলের আওতায় নিম্নবর্ণিত কাজের জন্য প্রকৃত ঠিকাদার /প্রতিষ্ঠানের নিকট হতে সিলমোহরকৃত দরপত্র আহ্বান করা যাচ্ছে ।</span>
              </div>

              <table className="w-full border-collapse border border-black text-sm sm:text-[15px] my-2">
                <thead>
                  <tr className="border-b border-black text-center">
                    <th className="border-r border-black p-2 w-16 font-normal">ক্রমিক</th>
                    <th className="border-r border-black p-2 font-normal">প্রকল্পের নাম ও প্যাকেজ নং</th>
                    <th className="border-r border-black p-2 w-48 font-normal">প্রাক্কলিত মূল্য</th>
                    <th className="p-2 w-24 font-normal">সময়সীমা</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-black align-middle">
                    <td className="border-r border-black p-2 text-center">০১</td>
                    <td className="border-r border-black p-2 text-left leading-relaxed">
                      {projectVal}
                    </td>
                    <td className="border-r border-black p-2 text-center">
                      <div>{estimatedVal}</div>
                      <div className="text-[13px] sm:text-sm text-neutral-700">({estimatedWords})</div>
                    </td>
                    <td className="p-2 text-center">
                      {fallback(data.timeLimit, "৭ দিন")}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div className="pt-1">
                <div>দরপত্র সংক্রান্ত তথ্যাবলী</div>
                <div className="space-y-1 pt-1 text-justify leading-relaxed">
                  <div>১. দরপত্র বিক্রয়ের শেষ তারিখ {formatDate(data.tenderSellingLastDate, "১৫/১০/২০২৬")} (অফিস চলাকালিন সময় পর্যন্ত)</div>
                  <div>২. দরপত্র দাখিলের শেষ তারিখ ও সময় {formatDate(data.tenderSubmissionLastDate, "১৫/১০/২০২৬")} দুপুর ১২.০০ টা পর্যন্ত</div>
                  <div>৩. দরপত্র খোলার তারিখ ও সময় {formatDate(data.tenderSubmissionLastDate, "১৫/১০/২০২৬")} {formatDate(data.tenderOpeningDateTime, "দুপুর ২.৩০ টা পর্যন্ত")}</div>
                  <div>৪. দরপত্র কোন কারণ ব্যতিরেকে যে কোন দরপত্র গ্রহণ বা বাতিলের ক্ষমতা সংরক্ষণ করেন</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ৯. নোটিফিকেশন অব অ্যাওয়ার্ড (TMPL-09)                                      */}
          {/* ========================================================================= */}
          {template.id === "noa-award" && (
            <div className="space-y-2">
              <div className="text-center mb-2">
                <div className="text-lg sm:text-xl font-normal">নোটিফিকেশন অব অ্যাওয়ার্ড</div>
              </div>

              <div className="space-y-0.5">
                <div>প্রাপক,</div>
                <div className="flex items-center">
                  <span className="pr-1.5 whitespace-nowrap">ঠিকাদারের নাম</span>
                  <span className="px-1.5 text-center">:</span>
                  <span className="pl-2">{fallback(data.contractorName, "বারাকাত ডেভেলপমেন্ট")}</span>
                </div>
                {/* {data.contractorAddress && (
                  <div className="text-sm  pl-4">{data.contractorAddress}</div>
                )} */}
              </div>

              <div className="text-justify leading-relaxed">
                <span>এতদ্বারা জানানো যাচ্ছে যে, ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল এর আওতায় বাস্তবায়নের জন্য {projectVal} প্রকল্পের জন্য আপনার দাখিলকৃত দরপত্র চুক্তিমূল্য {contractVal} ({contractWords}) কর্তৃপক্ষ কর্তৃক অনুমোদিত হয়েছে।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>এমতাবস্থায়, আপনাকে আগামী {fallback(data.timeLimit, "০৭")} দিনের মধ্যে নিম্নবর্ণিত কার্যাদি সম্পন্ন করার জন্য অনুরোধ করা হলো:</span>
              </div>

              <div className="space-y-1 pl-4 text-justify leading-relaxed">
                <div>১. লিখিতভাবে এই নোটিফিকেশন অব অ্যাওয়ার্ড গ্রহণ নিশ্চিত করা।</div>
                <div>২. চুক্তিপত্রের শর্তানুযায়ী নির্ধারিত জামানত (যদি প্রযোজ্য হয়) দাখিল করা।</div>
                <div>৩. অত্র ইউনিয়ন পরিষদ কার্যালয়ের উপস্থিত হয়ে চুক্তিনামা সম্পাদন করা।</div>
              </div>

              <div className="text-justify leading-relaxed">
                <span>উল্লেখ্য যে, নির্ধারিত সময়ের মধ্যে চুক্তিনামা সম্পাদন করতে ব্যর্থ হলে দরপত্র জামানত বাজেয়াপ্তকরণসহ বিধি মোতাবেক পরবর্তী ব্যবস্থা গ্রহণ করা হবে।</span>
              </div>

              <div className="pt-2 text-sm sm:text-[15px] space-y-1">
                <div>অনুলিপি সদয় অবগতির জন্য:</div>
                <div className="pl-4 space-y-0.5">
                  <div>১. উপজেলা নির্বাহী অফিসার, {upazilaVal}, {districtVal}।</div>
                  <div>২. উপজেলা প্রকৌশলী, এলজিইডি, {upazilaVal}, {districtVal}।</div>
                  <div>৩. অফিস কপি।</div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* ৮. কার্যাদেশ প্রদান পত্র (TMPL-08)                                         */}
          {/* ========================================================================= */}
          {template.id === "work-order" && (
            <div className="space-y-2">
              {/* <div className="text-left text-neutral-800 mb-1">
                <span>ইউপি প্যাড</span>
              </div> */}

              <div className="space-y-1">
                <div>প্রাপক,</div>
                <div className="pl-6">{fallback(data.contractorName, "ঠিকাদার নাম")}</div>
              </div>

              <div>
                <span>বিষয়: কার্যাদেশ প্রদান।</span>
              </div>

              <div className="text-justify leading-relaxed">
                <span>উপযুক্ত বিষয় ও ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল ব্যবহার নির্দেশিকা এর আলোকে জানানো যাচ্ছে যে, আপনার দাখিলকৃত দরপত্র অনুমোদিত হওয়ার নিম্নবর্ণিত প্রকল্পটি বাস্তবায়নের জন্য আপনাকে কার্যাদেশ প্রদান করা হলো।</span>
              </div>

              <div className="py-1 pl-1">
                <table className="border-collapse border-none text-inherit w-full">
                  <tbody>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">১. প্রকল্পের নাম</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{projectVal}।</td>
                    </tr>
                    <tr className="leading-relaxed">
                      <td className="py-0.5 pr-1.5 whitespace-nowrap align-top w-px">২. চুক্তিমূল্য</td>
                      <td className="py-0.5 px-1.5 align-top text-center w-px">:</td>
                      <td className="py-0.5 pl-2 align-top">{contractVal} ({contractWords})</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="pt-1">
                <div>শর্তাবলী:</div>
                <div className="space-y-1 pt-1 text-justify leading-relaxed">
                  <div>১. নির্দেশিকা অনুযায়ী নির্ধারিত সময়ের মধ্যে প্রাক্কলন ও নকশা মোতাবেক কাজ সম্পন্ন করতে হবে।</div>
                  <div>২. কাজের গুণগত মান নিশ্চিত করতে হবে এবং সাইটে বাধ্যতামূলকভাবে প্রকল্পের তথ্য সম্বলিত সাইনবোর্ড স্থাপন করতে হবে।</div>
                  <div>৩. সুপারভিশন/তদারকি কমিটি বা দায়িত্বপ্রাপ্ত প্রকৌশলী দ্বারা কাজ যাচাইয়ের পর বিধি মোতাবেক বিল পরিশোধ করা হবে।</div>
                  <div>৪. দায়িত্বপ্রাপ্ত প্রকৌশলী দ্বারা কাজ যাচাইয়ের পর বিধি মোতাবেক বিল পরিশোধ করা হবে।</div>
                  <div>৫. সরকারি বিধি অনুযায়ী ভ্যাট, আয়কর এবং জামানত কর্তন করা হবে।</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
