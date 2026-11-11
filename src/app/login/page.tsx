import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginPageClient } from "@/components/LoginPageClient";

export const metadata: Metadata = {
  title: "লগইন | ইউনিয়ন পরিষদ প্রকল্প অটোমেশন সিস্টেম",
  description: "ইউনিয়ন পরিষদ প্রকল্প মাস্টার ফর্ম ও অটোমেশন সিস্টেমে প্রশাসনিক প্রবেশদ্বার",
};

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-normal text-slate-600">লগইন পাতা প্রস্তুত হচ্ছে...</p>
          </div>
        </div>
      }
    >
      <LoginPageClient />
    </Suspense>
  );
}

