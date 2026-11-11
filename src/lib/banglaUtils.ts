/**
 * Utilities for Bangla digit, currency formatting, and number-to-words conversion
 * Supports up to multi-crore amounts with official Bangladesh government/banking conventions.
 */

const banglaDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/**
 * Converts any English digits (0-9) within a string or number into Bangla digits (০-৯)
 */
export function toBanglaDigits(num: number | string | undefined | null): string {
  if (num === null || num === undefined) return "";
  return num.toString().replace(/[0-9]/g, (d) => banglaDigits[parseInt(d, 10)]);
}

/**
 * Parses a string containing either English or Bengali digits into a valid JS number
 */
export function parseBanglaNumber(val: number | string | undefined | null): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") return isNaN(val) ? 0 : val;
  const str = val.toString().trim();
  if (!str) return 0;

  // Convert any Bengali digits to English digits
  const enStr = str.replace(/[০-৯]/g, (d) => banglaDigits.indexOf(d).toString());
  // Remove commas
  const cleaned = enStr.replace(/,/g, "");
  // Extract first valid numeric match (including negative and floating point)
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Standard Bengali words for numbers from 0 to 99
 */
const ones = [
  "", "এক", "দুই", "তিন", "চার", "পাঁচ", "ছয়", "সাত", "আট", "নয়",
  "দশ", "এগারো", "বারো", "তেরো", "চৌদ্দ", "পনেরো", "ষোলো", "সতেরো", "আঠারো", "উনিশ",
  "বিশ", "একুশ", "বাইশ", "তেইশ", "চব্বিশ", "পঁচিশ", "ছাব্বিশ", "সাতাশ", "আঠাশ", "ঊনত্রিশ",
  "ত্রিশ", "একত্রিশ", "বত্রিশ", "তেত্রিশ", "চৌত্রিশ", "পঁয়ত্রিশ", "ছত্রিশ", "সাইত্রিশ", "আটত্রিশ", "ঊনচল্লিশ",
  "চল্লিশ", "একচল্লিশ", "বিয়াল্লিশ", "তেতাল্লিশ", "চুয়াল্লিশ", "পঁয়তাল্লিশ", "ছেচল্লিশ", "সাতচল্লিশ", "আটচল্লিশ", "ঊনপঞ্চাশ",
  "পঞ্চাশ", "একান্ন", "বায়ান্ন", "তিপ্পান্ন", "চুয়ান্ন", "পঞ্চান্ন", "ছাপ্পান্ন", "সাতান্ন", "আটান্ন", "ঊনষাট",
  "ষাট", "একষট্টি", "বাষট্টি", "তেষট্টি", "চৌষট্টি", "পঁয়ষট্টি", "ছেষট্টি", "সাতষট্টি", "আটষট্টি", "ঊনসত্তর",
  "সত্তর", "একাত্তর", "বাহাত্তর", "তিয়াত্তর", "চুয়াত্তর", "পঁচাত্তর", "ছিয়াত্তর", "সাতাত্তর", "আটাত্তর", "ঊনআশি",
  "আশি", "একাশি", "বিরাশি", "তিরাশি", "চুরাশি", "পঁচাশি", "ছিয়াশি", "সাতাশি", "আটাশি", "ঊননব্বই",
  "নব্বই", "একানব্বই", "বানব্বই", "তিরানব্বই", "চুরানব্বই", "পঁচানব্বই", "ছিয়ানব্বই", "সাতানব্বই", "আটানব্বই", "নিরানব্বই"
];

/**
 * Recursive chunk converter for South Asian numbering system:
 * Crore (কোটি) = 1,00,00,000
 * Lakh (লক্ষ)  = 1,00,000
 * Thousand (হাজার) = 1,000
 * Hundred (শত) = 100
 */
function convertChunk(num: number): string {
  if (num === 0) return "";

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;

  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;

  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;

  const hundred = Math.floor(rem / 100);
  rem = rem % 100;

  const parts: string[] = [];

  if (crore > 0) {
    parts.push(`${convertChunk(crore)} কোটি`);
  }
  if (lakh > 0) {
    parts.push(`${ones[lakh] || lakh} লক্ষ`);
  }
  if (thousand > 0) {
    parts.push(`${ones[thousand] || thousand} হাজার`);
  }
  if (hundred > 0) {
    parts.push(`${ones[hundred] || hundred} শত`);
  }
  if (rem > 0) {
    parts.push(ones[rem] || rem.toString());
  }

  return parts.join(" ").trim();
}

export interface BanglaWordOptions {
  includeTaka?: boolean; // Default true: appends "টাকা মাত্র"
}

/**
 * Converts any number or currency string (e.g. 1200000, "12,00,000/-", "১,৭৪,০০০/-")
 * into professional Bangla words (e.g. "বারো লক্ষ টাকা মাত্র", "এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র").
 */
export function numberToBanglaWords(
  val: number | string | undefined | null,
  options: BanglaWordOptions = { includeTaka: true }
): string {
  if (val === null || val === undefined) return "";

  const str = val.toString().trim();
  if (!str) return "";

  // If already non-numeric words (no digits present)
  if (!/[0-9০-৯]/.test(str)) {
    return str;
  }

  const n = typeof val === "number" ? val : parseBanglaNumber(str);
  if (isNaN(n) || n < 0) return "";
  if (n === 0) {
    return options.includeTaka !== false ? "শূন্য টাকা মাত্র" : "শূন্য";
  }

  const integerPart = Math.floor(n);
  const decimalPart = Math.round((n - integerPart) * 100);

  const integerWords = integerPart > 0 ? convertChunk(integerPart) : "";
  const paisaWords = decimalPart > 0 ? (ones[decimalPart] || decimalPart.toString()) : "";

  if (options.includeTaka === false) {
    if (integerWords && paisaWords) {
      return `${integerWords} দশমিক ${paisaWords}`;
    }
    return integerWords || paisaWords;
  }

  if (integerWords && paisaWords) {
    return `${integerWords} টাকা ${paisaWords} পয়সা মাত্র`;
  } else if (integerWords) {
    return `${integerWords} টাকা মাত্র`;
  } else if (paisaWords) {
    return `${paisaWords} পয়সা মাত্র`;
  }

  return "শূন্য টাকা মাত্র";
}

export interface FormatCurrencyOptions {
  hasSlashDash?: boolean; // Default true: appends "/-"
  fallbackPlaceholder?: string;
}

/**
 * Formats any number or numeric string into official Bangladeshi currency notation in Bengali numerals.
 * Example: 1200000 -> "১২,০০,০০০/-"
 * Example: "1,74,000" -> "১,৭৪,০০০/-"
 * Example: 50000000 -> "৫,০০,০০,০০০/-"
 */
export function formatBanglaCurrency(
  val: number | string | undefined | null,
  options: FormatCurrencyOptions = {}
): string {
  const { hasSlashDash = true, fallbackPlaceholder = "................................" } = options;
  if (val === null || val === undefined) return fallbackPlaceholder;

  const str = val.toString().trim();
  if (!str) return fallbackPlaceholder;

  // If there are no digits at all, return with any English digits converted to Bangla digits
  if (!/[0-9০-৯]/.test(str)) {
    return toBanglaDigits(str);
  }

  const num = typeof val === "number" ? val : parseBanglaNumber(str);
  if (isNaN(num)) return fallbackPlaceholder;

  const isNegative = num < 0;
  const absNum = Math.abs(num);
  const integerPart = Math.floor(absNum);
  const decimalPart = Math.round((absNum - integerPart) * 100);

  // Use Indian/South Asian grouping: 12,00,000
  const enFormattedInt = integerPart.toLocaleString("en-IN");
  let bnFormatted = toBanglaDigits(enFormattedInt);

  if (decimalPart > 0) {
    const decStr = decimalPart < 10 ? `0${decimalPart}` : decimalPart.toString();
    bnFormatted += `.${toBanglaDigits(decStr)}`;
  }

  if (isNegative) {
    bnFormatted = `-${bnFormatted}`;
  }

  if (hasSlashDash) {
    bnFormatted = `${bnFormatted}/-`;
  }

  return bnFormatted;
}

/**
 * Dynamically calculates what percentage `partVal` is of `totalVal`
 * and returns it formatted in Bengali digits with a '%' sign (e.g., "৪%", "৭.৫%").
 */
export function calculateBanglaPercentage(
  partVal: number | string | undefined | null,
  totalVal: number | string | undefined | null
): string {
  const part = parseBanglaNumber(partVal);
  const total = parseBanglaNumber(totalVal);
  if (!total || total <= 0 || isNaN(part) || part < 0) {
    return "০%";
  }
  const pct = (part / total) * 100;
  const formatted = Number(pct.toFixed(2)).toString();
  return `${toBanglaDigits(formatted)}%`;
}

/**
 * Formats any date string (including ISO YYYY-MM-DD in English or Bengali digits,
 * YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY, or date-time strings containing YYYY-MM-DD)
 * into Day/Month/Year (DD/MM/YYYY) format in Bengali digits (e.g., "২০২৬-১০-৩০" -> "৩০/১০/২০২৬").
 */
export function formatBanglaDate(
  val: string | undefined | null,
  fallbackPlaceholder: string = "................................"
): string {
  if (!val || val.trim() === "") return fallbackPlaceholder;
  const trimmed = val.trim();

  const toEn = (s: string) =>
    s.replace(/[০-৯]/g, (d) => banglaDigits.indexOf(d).toString());

  // 1. Convert YYYY-MM-DD / YYYY/MM/DD / YYYY.MM.DD -> DD/MM/YYYY
  const reversedYmd = trimmed.replace(
    /(?<![0-9০-৯])([0-9০-৯]{4})([-/.])([0-9০-৯]{1,2})\2([0-9০-৯]{1,2})(?![0-9০-৯])/g,
    (match, yRaw: string, _sep: string, mRaw: string, dRaw: string) => {
      const mNum = parseInt(toEn(mRaw), 10);
      const dNum = parseInt(toEn(dRaw), 10);
      if (mNum >= 1 && mNum <= 12 && dNum >= 1 && dNum <= 31) {
        const dd = String(dNum).padStart(2, "0");
        const mm = String(mNum).padStart(2, "0");
        const yyyy = toEn(yRaw);
        return toBanglaDigits(`${dd}/${mm}/${yyyy}`);
      }
      return match;
    }
  );

  // 2. Normalize DD-MM-YYYY / DD.MM.YYYY -> DD/MM/YYYY
  const normalizedDmy = reversedYmd.replace(
    /(?<![0-9০-৯])([0-9০-৯]{1,2})([-.])([0-9০-৯]{1,2})\2([0-9০-৯]{4})(?![0-9০-৯])/g,
    (match, dRaw: string, _sep: string, mRaw: string, yRaw: string) => {
      const dNum = parseInt(toEn(dRaw), 10);
      const mNum = parseInt(toEn(mRaw), 10);
      if (dNum >= 1 && dNum <= 31 && mNum >= 1 && mNum <= 12) {
        const dd = String(dNum).padStart(2, "0");
        const mm = String(mNum).padStart(2, "0");
        const yyyy = toEn(yRaw);
        return toBanglaDigits(`${dd}/${mm}/${yyyy}`);
      }
      return match;
    }
  );

  return toBanglaDigits(normalizedDmy);
}
