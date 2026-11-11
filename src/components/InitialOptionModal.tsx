"use client";

import React from "react";
import {
  FileSpreadsheet,
  Users,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  X,
  Building2,
  ShieldCheck,
} from "lucide-react";

export type ImplementationMode = "quotation" | "pic";

interface InitialOptionModalProps {
  isOpen: boolean;
  activeMode: ImplementationMode;
  onSelectMode: (mode: ImplementationMode) => void;
  onClose?: () => void;
  canDismiss?: boolean;
}

export const InitialOptionModal: React.FC<InitialOptionModalProps> = React.memo(({
  isOpen,
  activeMode,
  onSelectMode,
  onClose,
  canDismiss = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto no-print">
      {/* Smooth Backdrop without flickering animations */}
      <div
        onClick={canDismiss ? onClose : undefined}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity"
      />

      {/* Main Card with clean border and no conflicting shadows */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-3xl overflow-hidden z-10">
        {/* Close button if dismissible */}
        {canDismiss && onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer z-20"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Top Header Banner */}
        <div className="px-6 pt-6 pb-4 sm:px-8 sm:pt-8 sm:pb-5 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/90 to-white">
          <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80 text-xs font-normal mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>ইউনিয়ন পরিষদ প্রকল্প অটোমেশন</span>
          </div>

          <h2 className="text-lg sm:text-2xl font-normal text-slate-900 tracking-tight leading-snug">
            প্রকল্প বাস্তবায়ন পদ্ধতি নির্বাচন করুন
          </h2>
          <p className="text-xs sm:text-sm font-normal text-slate-500 mt-1 max-w-xl mx-auto leading-relaxed">
            আপনার প্রকল্পের ধরন অনুযায়ী প্রযোজ্য পদ্ধতি বেছে নিন। পরবর্তীতে যেকোনো সময় সুইচার দিয়ে পরিবর্তন করতে পারবেন।
          </p>
        </div>

        {/* Two Grand Interactive Selection Cards */}
        <div className="p-5 sm:p-7 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-slate-50/40">
          {/* Card 1: General Quotation */}
          <div
            onClick={() => onSelectMode("quotation")}
            className={`group relative rounded-2xl p-5 sm:p-6 text-left cursor-pointer transition-colors duration-150 flex flex-col justify-between ${
              activeMode === "quotation"
                ? "bg-white border-2 border-blue-600"
                : "bg-white border border-slate-200 hover:border-blue-400"
            }`}
          >
            <div className="space-y-3">
              {/* Header Pill & Icon */}
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-blue-50 text-blue-700 border border-blue-200">
                  <Building2 className="w-3.5 h-3.5 text-blue-600" />
                  <span>পদ্ধতি ০১ • উন্মুক্ত দরপত্র</span>
                </span>
                {activeMode === "quotation" && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>সক্রিয়</span>
                  </span>
                )}
              </div>

              {/* Title & Core Description */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-normal text-slate-900 leading-snug">
                  সাধারণ কোটেশন (General Quotation)
                </h3>
                <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
                  উন্মুক্ত দরপত্র বিজ্ঞপ্তি, ঠিকাদারি চুক্তিপত্র দলিল ও সরকারি কার্যাদেশ ভিত্তিক আনুষ্ঠানিক বাস্তবায়ন পদ্ধতি।
                </p>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode("quotation");
                }}
                className={`w-full h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-normal transition-colors cursor-pointer ${
                  activeMode === "quotation"
                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                    : "bg-slate-100 group-hover:bg-blue-600 text-slate-800 group-hover:text-white"
                }`}
              >
                <span>কোটেশন পদ্ধতি নির্বাচন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Card 2: PIC (Project Implementation Committee) */}
          <div
            onClick={() => onSelectMode("pic")}
            className={`group relative rounded-2xl p-5 sm:p-6 text-left cursor-pointer transition-colors duration-150 flex flex-col justify-between ${
              activeMode === "pic"
                ? "bg-white border-2 border-emerald-600"
                : "bg-white border border-slate-200 hover:border-emerald-400"
            }`}
          >
            <div className="space-y-3">
              {/* Header Pill & Icon */}
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-normal bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>পদ্ধতি ০২ • সরাসরি বাস্তবায়ন</span>
                </span>
                {activeMode === "pic" && (
                  <span className="inline-flex items-center gap-1 text-xs font-normal text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>সক্রিয়</span>
                  </span>
                )}
              </div>

              {/* Title & Core Description */}
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-normal text-slate-900 leading-snug">
                  পিআইসি (PIC - কমিটি বাস্তবায়ন)
                </h3>
                <p className="text-xs sm:text-sm font-normal text-slate-600 leading-relaxed">
                  ইউনিয়ন পরিষদ ওয়ার্ড কমিটি গঠন ও ৩টি সভার কার্যবিবরণী (রেজুলেশন) ভিত্তিক সরাসরি বাস্তবায়ন পদ্ধতি।
                </p>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="mt-5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectMode("pic");
                }}
                className={`w-full h-10 px-4 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-normal transition-colors cursor-pointer ${
                  activeMode === "pic"
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                    : "bg-slate-100 group-hover:bg-emerald-600 text-slate-800 group-hover:text-white"
                }`}
              >
                <span>পিআইসি পদ্ধতি নির্বাচন করুন</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Helpful Note */}
        <div className="px-6 py-4 sm:px-10 border-t border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-500 font-normal">
          <p className="flex items-center gap-1.5 text-center sm:text-left">
            <span>💡</span>
            <span>উভয় পদ্ধতির জন্যই ২০ পাতার সকল সরকারি নথিপত্র স্বয়ংক্রিয়ভাবে প্রস্তুত থাকবে।</span>
          </p>
          {canDismiss && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-slate-600 hover:text-slate-900 underline underline-offset-2 cursor-pointer font-normal"
            >
              এখনই বন্ধ করুন
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

InitialOptionModal.displayName = "InitialOptionModal";
