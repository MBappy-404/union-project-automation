"use client";

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const BN_MONTHS = [
  "জানুয়ারি",
  "ফেব্রুয়ারি",
  "মার্চ",
  "এপ্রিল",
  "মে",
  "জুন",
  "জুলাই",
  "আগস্ট",
  "সেপ্টেম্বর",
  "অক্টোবর",
  "নভেম্বর",
  "ডিসেম্বর",
];

// Full weekday names indexed by JS getDay() (0 = Sunday)
const BN_WEEKDAYS_FULL = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];

// Calendar grid starts from Saturday (Bangladesh office week)
const BN_WEEK_HEADERS = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহঃ", "শুক্র"];

const YEAR_START = 2000;
const YEAR_END = 2050;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const BN_DIGITS = "০১২৩৪৫৬৭৮৯";
const toEnDigits = (s: string) => s.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));

interface YMD {
  y: number;
  m: number; // 1-12
  d: number;
}

const daysInMonth = (y: number, m: number) => new Date(y, m, 0).getDate();

const isValidYMD = ({ y, m, d }: YMD) =>
  y >= 1900 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= daysInMonth(y, m);

/** Parse any stored date value (ISO YYYY-MM-DD in English/Bangla digits or DD/MM/YYYY) */
const parseDateValue = (raw?: string | null): YMD | null => {
  if (!raw) return null;
  const s = toEnDigits(raw.trim());
  if (!s) return null;

  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    const ymd = { y: +match[1], m: +match[2], d: +match[3] };
    return isValidYMD(ymd) ? ymd : null;
  }
  match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (match) {
    const ymd = { y: +match[3], m: +match[2], d: +match[1] };
    return isValidYMD(ymd) ? ymd : null;
  }
  return null;
};

const pad2 = (n: number) => String(n).padStart(2, "0");

/** Stored format: ISO YYYY-MM-DD (English digits) — fully compatible with all templates */
const toIso = ({ y, m, d }: YMD) => `${y}-${pad2(m)}-${pad2(d)}`;

/** Display format: DD/MM/YYYY in English digits */
const toDisplay = ({ y, m, d }: YMD) => `${pad2(d)}/${pad2(m)}/${y}`;

/** Readable full date: 18 এপ্রিল 2026, শনিবার */
const toReadable = ({ y, m, d }: YMD) => {
  const weekday = BN_WEEKDAYS_FULL[new Date(y, m - 1, d).getDay()];
  return `${d} ${BN_MONTHS[m - 1]} ${y}, ${weekday}`;
};

/** Format raw typed digits (max 8) into DD/MM/YYYY progressively */
const formatTypedDigits = (digits: string) => {
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  let out = dd;
  if (digits.length > 2) out += "/" + mm;
  if (digits.length > 4) out += "/" + yyyy;
  return out;
};

const todayYMD = (): YMD => {
  const t = new Date();
  return { y: t.getFullYear(), m: t.getMonth() + 1, d: t.getDate() };
};

const sameYMD = (a: YMD | null, b: YMD | null) =>
  !!a && !!b && a.y === b.y && a.m === b.m && a.d === b.d;

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface BanglaDatePickerProps {
  value?: string;
  onChange: (isoValue: string) => void;
  accent?: "blue" | "emerald";
  className?: string;
  showReadable?: boolean;
  ariaLabel?: string;
}

const POPOVER_WIDTH = 320;
const POPOVER_HEIGHT_ESTIMATE = 410;

export const BanglaDatePicker: React.FC<BanglaDatePickerProps> = ({
  value,
  onChange,
  accent = "blue",
  className = "",
  showReadable = true,
  ariaLabel = "তারিখ নির্বাচন করুন",
}) => {
  const parsed = useMemo(() => parseDateValue(value), [value]);

  const [text, setText] = useState<string>(parsed ? toDisplay(parsed) : "");
  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(parsed?.y ?? todayYMD().y);
  const [viewMonth, setViewMonth] = useState<number>(parsed?.m ?? todayYMD().m);
  const [hasError, setHasError] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const isTypingRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Sync display text when external value changes (e.g., switching projects)
  useEffect(() => {
    if (isTypingRef.current) return;
    setText(parsed ? toDisplay(parsed) : "");
    setHasError(false);
  }, [parsed]);

  const isEmerald = accent === "emerald";
  const theme = {
    focus: isEmerald
      ? "focus-within:border-emerald-600 focus-within:ring-emerald-500/15 hover:border-emerald-400"
      : "focus-within:border-blue-600 focus-within:ring-blue-500/15 hover:border-blue-400",
    icon: isEmerald ? "text-emerald-600" : "text-blue-600",
    iconBtn: isEmerald ? "hover:bg-emerald-50" : "hover:bg-blue-50",
    selected: isEmerald ? "bg-emerald-600 text-white hover:bg-emerald-700" : "bg-blue-600 text-white hover:bg-blue-700",
    today: isEmerald ? "ring-1 ring-emerald-500 text-emerald-700" : "ring-1 ring-blue-500 text-blue-700",
    header: isEmerald ? "from-emerald-600 to-teal-600" : "from-blue-600 to-indigo-600",
    softBtn: isEmerald
      ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200"
      : "text-blue-700 bg-blue-50 hover:bg-blue-100 border-blue-200",
    readable: isEmerald ? "text-emerald-700" : "text-blue-700",
  };

  /* ---------------- Positioning (portal, fixed) ---------------- */
  const updatePosition = useCallback(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(POPOVER_WIDTH, vw - 16);

    let left = rect.left;
    if (left + width > vw - 8) left = vw - width - 8;
    if (left < 8) left = 8;

    const spaceBelow = vh - rect.bottom;
    const top =
      spaceBelow < POPOVER_HEIGHT_ESTIMATE && rect.top > POPOVER_HEIGHT_ESTIMATE
        ? rect.top - POPOVER_HEIGHT_ESTIMATE - 6
        : rect.bottom + 6;

    setPos({ top: Math.max(8, top), left });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen, updatePosition]);

  // Close on outside click / Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapperRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setIsOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [isOpen]);

  const openCalendar = () => {
    const base = parsed ?? todayYMD();
    setViewYear(base.y);
    setViewMonth(base.m);
    setIsOpen(true);
  };

  /* ---------------- Typing handlers ---------------- */
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    isTypingRef.current = true;
    const digits = toEnDigits(e.target.value).replace(/\D/g, "").slice(0, 8);
    setText(formatTypedDigits(digits));

    if (digits.length === 0) {
      setHasError(false);
      onChange("");
      return;
    }
    if (digits.length === 8) {
      const ymd = { d: +digits.slice(0, 2), m: +digits.slice(2, 4), y: +digits.slice(4, 8) };
      if (isValidYMD(ymd)) {
        setHasError(false);
        setViewYear(ymd.y);
        setViewMonth(ymd.m);
        onChange(toIso(ymd));
      } else {
        setHasError(true);
      }
    } else {
      setHasError(false);
    }
  };

  const handleBlur = () => {
    isTypingRef.current = false;
    const digits = toEnDigits(text).replace(/\D/g, "");
    if (digits.length === 0) {
      setHasError(false);
      return;
    }
    // Revert incomplete / invalid input back to last valid value
    if (digits.length < 8 || hasError) {
      setText(parsed ? toDisplay(parsed) : "");
      setHasError(false);
    }
  };

  /* ---------------- Calendar handlers ---------------- */
  const selectDay = (d: number) => {
    const ymd = { y: viewYear, m: viewMonth, d };
    isTypingRef.current = false;
    setText(toDisplay(ymd));
    setHasError(false);
    onChange(toIso(ymd));
    setIsOpen(false);
  };

  const goMonth = (delta: number) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    if (y < YEAR_START || y > YEAR_END) return;
    setViewMonth(m);
    setViewYear(y);
  };

  const selectToday = () => {
    const t = todayYMD();
    setViewYear(t.y);
    setViewMonth(t.m);
    isTypingRef.current = false;
    setText(toDisplay(t));
    setHasError(false);
    onChange(toIso(t));
    setIsOpen(false);
  };

  const clearDate = () => {
    isTypingRef.current = false;
    setText("");
    setHasError(false);
    onChange("");
    setIsOpen(false);
  };

  /* ---------------- Calendar grid ---------------- */
  const today = todayYMD();
  const totalDays = daysInMonth(viewYear, viewMonth);
  const firstWeekday = new Date(viewYear, viewMonth - 1, 1).getDay(); // 0 = Sun
  const offset = (firstWeekday + 1) % 7; // Grid starts on Saturday
  const cells: (number | null)[] = [
    ...Array.from({ length: offset }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const years = Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, i) => YEAR_START + i);

  const popover =
    isOpen && mounted
      ? createPortal(
          <div
            ref={popoverRef}
            role="dialog"
            aria-label="বাংলা ক্যালেন্ডার"
            style={{ position: "fixed", top: pos.top, left: pos.left, width: Math.min(POPOVER_WIDTH, typeof window !== "undefined" ? window.innerWidth - 16 : POPOVER_WIDTH) }}
            className="z-[10050] bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden no-print"
          >
            {/* Header: Month / Year selectors */}
            <div className={`bg-gradient-to-r ${theme.header} px-3 py-2.5 flex items-center justify-between gap-2`}>
              <button
                type="button"
                onClick={() => goMonth(-1)}
                title="পূর্ববর্তী মাস"
                className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>

              <div className="flex items-center gap-1.5">
                <select
                  aria-label="মাস নির্বাচন"
                  value={viewMonth}
                  onChange={(e) => setViewMonth(+e.target.value)}
                  className="h-8 px-2 text-sm font-normal rounded-lg bg-white/95 text-slate-900 border-0 focus:outline-none cursor-pointer"
                >
                  {BN_MONTHS.map((name, i) => (
                    <option key={name} value={i + 1}>
                      {name}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="বছর নির্বাচন"
                  value={viewYear}
                  onChange={(e) => setViewYear(+e.target.value)}
                  className="h-8 px-2 text-sm font-normal rounded-lg bg-white/95 text-slate-900 border-0 focus:outline-none cursor-pointer"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={() => goMonth(1)}
                title="পরবর্তী মাস"
                className="p-1.5 rounded-lg text-white/90 hover:text-white hover:bg-white/15 cursor-pointer transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Weekday headers */}
            <div className="grid grid-cols-7 px-2.5 pt-2.5 pb-1">
              {BN_WEEK_HEADERS.map((w) => (
                <div
                  key={w}
                  className={`text-center text-xs font-normal py-1 ${w === "শুক্র" ? "text-red-500" : "text-slate-500"}`}
                >
                  {w}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 px-2.5 pb-2.5">
              {cells.map((day, idx) => {
                if (day === null) return <div key={`e-${idx}`} className="h-9" />;
                const cellYMD = { y: viewYear, m: viewMonth, d: day };
                const isSelected = sameYMD(cellYMD, parsed);
                const isToday = sameYMD(cellYMD, today);
                const isFriday = idx % 7 === 6;
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => selectDay(day)}
                    className={`h-9 rounded-lg text-[15px] font-normal cursor-pointer transition-colors ${
                      isSelected
                        ? theme.selected
                        : isToday
                        ? `${theme.today} hover:bg-slate-100`
                        : isFriday
                        ? "text-red-500 hover:bg-red-50"
                        : "text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Selected preview + footer actions */}
            <div className="border-t border-slate-100 px-3 py-2.5 bg-slate-50/70 space-y-2">
              <div className="text-xs sm:text-sm font-normal text-slate-600 text-center leading-relaxed">
                {parsed ? (
                  <>
                    নির্বাচিত: <span className={theme.readable}>{toReadable(parsed)}</span>
                  </>
                ) : (
                  "একটি তারিখে ক্লিক করুন"
                )}
              </div>
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={clearDate}
                  className="px-3 py-1.5 text-xs sm:text-sm font-normal rounded-lg text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 cursor-pointer transition-colors"
                >
                  মুছুন
                </button>
                <button
                  type="button"
                  onClick={selectToday}
                  className={`px-3 py-1.5 text-xs sm:text-sm font-normal rounded-lg border cursor-pointer transition-colors ${theme.softBtn}`}
                >
                  আজকের তারিখ
                </button>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-3 py-1.5 text-xs sm:text-sm font-normal rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <div className={`w-full ${className}`}>
      <div
        ref={wrapperRef}
        className={`flex items-center w-full h-11.5 bg-slate-50/70 border rounded-xl focus-within:bg-white focus-within:ring-2 transition-all ${
          hasError ? "border-red-400 ring-2 ring-red-500/15" : `border-slate-300 ${theme.focus}`
        }`}
      >
        <button
          type="button"
          onClick={() => (isOpen ? setIsOpen(false) : openCalendar())}
          title="ক্যালেন্ডার খুলুন"
          aria-label="ক্যালেন্ডার খুলুন"
          className={`h-full px-3 flex items-center rounded-l-xl cursor-pointer transition-colors ${theme.iconBtn}`}
        >
          <Calendar className={`w-4.5 h-4.5 ${theme.icon}`} />
        </button>
        <input
          type="text"
          inputMode="numeric"
          aria-label={ariaLabel}
          value={text}
          onChange={handleTextChange}
          onBlur={handleBlur}
          onFocus={() => (isTypingRef.current = true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" || (e.altKey && e.key === "ArrowDown")) {
              e.preventDefault();
              openCalendar();
            }
          }}
          placeholder="DD/MM/YYYY"
          className="flex-1 min-w-0 h-full bg-transparent text-base sm:text-[17px] font-normal tracking-wide text-slate-900 placeholder:text-slate-400 outline-none"
        />
        {text && (
          <button
            type="button"
            onClick={clearDate}
            title="তারিখ মুছুন"
            aria-label="তারিখ মুছুন"
            className="h-full px-2.5 flex items-center text-slate-400 hover:text-red-500 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {hasError && (
        <p className="mt-1 pl-1 text-xs sm:text-[13px] font-normal leading-relaxed text-red-500 no-print">
          সঠিক তারিখ লিখুন (DD/MM/YYYY)
        </p>
      )}

      {popover}
    </div>
  );
};

export default BanglaDatePicker;

