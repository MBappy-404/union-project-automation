"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Building2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export const LoginPageClient: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromParam = searchParams.get("from");

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Check if session is already active on client mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => {
        if (res.ok) {
          const destination = fromParam && fromParam.startsWith("/") ? fromParam : "/";
          router.replace(destination);
        }
      })
      .catch(() => {
        // Not authenticated, stay on login page
      });
  }, [fromParam, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage("অনুগ্রহ করে আপনার ইমেইল ঠিকানা প্রদান করুন।");
      toast.error("ইমেইল ঠিকানা প্রয়োজন");
      return;
    }

    if (!password) {
      setErrorMessage("অনুগ্রহ করে আপনার পাসওয়ার্ড প্রদান করুন।");
      toast.error("পাসওয়ার্ড প্রয়োজন");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password,
          rememberMe,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success("লগইন সফল হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...");
        const destination = fromParam && fromParam.startsWith("/") ? fromParam : "/";
        setTimeout(() => {
          window.location.href = destination;
        }, 200);
      } else {
        const errorText =
          data.error || "ইমেইল বা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় চেষ্টা করুন।";
        setErrorMessage(errorText);
        toast.error(errorText);
      }
    } catch (err) {
      console.error("Login request error:", err);
      const networkError = "সার্ভারের সাথে সংযোগ স্থাপন করা সম্ভব হয়নি। ইন্টারনেট সংযোগ পরীক্ষা করুন।";
      setErrorMessage(networkError);
      toast.error(networkError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        {/* Top Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-600 text-white mb-3">
            <Building2 className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-normal text-slate-900 tracking-tight">
            ইউনিয়ন পরিষদ প্রকল্প অটোমেশন সিস্টেম
          </h1>
          <p className="text-sm font-normal text-slate-500 mt-1">
            প্রশাসনিক কর্মকর্তা ও ব্যবহারকারী লগইন
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-lg font-normal text-slate-900 mb-1">
              অ্যাকাউন্টে প্রবেশ করুন
            </h2>
            <p className="text-xs text-slate-500 font-normal">
              আপনার নির্ধারিত ইমেইল ও পাসওয়ার্ড প্রদান করে সাইন ইন করুন
            </p>
          </div>

          {/* Error Message Alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200/90 text-rose-800 text-xs sm:text-sm font-normal flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">{errorMessage}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs sm:text-sm font-normal text-slate-700"
              >
                ইমেইল ঠিকানা <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm font-normal rounded-xl border border-slate-300 hover:border-slate-400 focus:border-blue-600 text-slate-900 bg-white placeholder:text-slate-400 transition-colors outline-hidden"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs sm:text-sm font-normal text-slate-700"
              >
                পাসওয়ার্ড <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="আপনার পাসওয়ার্ড লিখুন"
                  className="w-full pl-10 pr-11 py-2.5 text-sm font-normal rounded-xl border border-slate-300 hover:border-slate-400 focus:border-blue-600 text-slate-900 bg-white placeholder:text-slate-400 transition-colors outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "পাসওয়ার্ড লুকান" : "পাসওয়ার্ড দেখুন"}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between text-xs sm:text-sm pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border border-slate-300 focus:outline-hidden cursor-pointer"
                />
                <span className="font-normal text-slate-700">সেশন মনে রাখুন</span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-xl text-white font-normal text-sm sm:text-base bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:via-indigo-700 hover:to-blue-800 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>লগইন হচ্ছে...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>লগইন করুন</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Clean Footer */}
        <p className="text-center text-xs font-normal text-slate-400">
          © ২০২৬ ইউনিয়ন পরিষদ তথ্য বাতায়ন
        </p>
      </div>
    </div>
  );
};
