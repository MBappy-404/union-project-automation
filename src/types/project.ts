export type PhotoStage = "before" | "during" | "after" | "signboard" | "other";

export interface ProjectPhoto {
  id: string;
  url: string;
  publicId?: string;
  caption?: string;
  stage: PhotoStage;
  uploadedAt: string;
  size?: number;
  originalSize?: number;
  fileName?: string;
}

export interface WardCommitteeMember {
  id?: string;
  name: string;
  fatherName: string;
  village: string;
  designation: string;
  committeeRole: string;
}

export interface TenderEvaluationEntry {
  id?: string;
  name: string;             // দরপ্রদাতার নাম
  tradeLicense: string;      // ট্রেড লাইসেন্স দাখিল (হ্যাঁ / না)
  tinCertificate: string;    // টিন দাখিল (হ্যাঁ / না)
  experience: string;        // অভিজ্ঞতা দাখিল (হ্যাঁ / না)
  quotedRate: string;        // দর (টাকা) ও কথায়
  isResponsive: string;      // কারিগরিভাবে গ্রহণযোগ্য কিনা (হ্যাঁ / না)
  position: string;          // অবস্থান (১ম, ২য়, ৩য়...)
  remarks?: string;          // মন্তব্য
}

export const DEFAULT_TENDER_EVALUATION_LIST: TenderEvaluationEntry[] = [
  {
    name: "রেলকো",
    tradeLicense: "হ্যাঁ",
    tinCertificate: "হ্যাঁ",
    experience: "হ্যাঁ",
    quotedRate: "১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)",
    isResponsive: "হ্যাঁ",
    position: "১ম",
    remarks: "",
  },
  {
    name: "বারাকাত ডেভেলপমেন্ট, প্রো:মোসা: জেসমিন আরা",
    tradeLicense: "হ্যাঁ",
    tinCertificate: "হ্যাঁ",
    experience: "হ্যাঁ",
    quotedRate: "১,৭৩,৫০০/- (এক লক্ষ তিয়াত্তর হাজার পাঁচ শত টাকা মাত্র)",
    isResponsive: "হ্যাঁ",
    position: "২য়",
    remarks: "",
  },
  {
    name: "কল্পনা এন্টারপ্রাইজ",
    tradeLicense: "হ্যাঁ",
    tinCertificate: "হ্যাঁ",
    experience: "হ্যাঁ",
    quotedRate: "১,৭৫,০০০/- (এক লক্ষ পঁচাত্তর হাজার টাকা মাত্র)",
    isResponsive: "হ্যাঁ",
    position: "৩য়",
    remarks: "",
  },
];

export interface TenderOpeningEntry {
  id?: string;
  name: string;        // দরপত্রদাতার নাম ও ঠিকানা
  quotedPrice: string; // উদ্ধৃত দর (টাকা ও কথায়)
}

export const DEFAULT_TENDER_OPENING_LIST: TenderOpeningEntry[] = [
  {
    name: "মোঃ মাহফুজুর রহমান, সপুরা, বোয়ালিয়া, রাজশাহী।",
    quotedPrice: "১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)",
  },
  {
    name: "মোসাঃ জেসমিন আরা, ঘোড়ামারা, বোয়ালিয়া, রাজশাহী।",
    quotedPrice: "১,৭৩,৫০০/- (এক লক্ষ তিয়াত্তর হাজার পাঁচ শত টাকা মাত্র)",
  },
  {
    name: "মোঃ কামরুজ্জামান, বাউসা, বাঘা, রাজশাহী।",
    quotedPrice: "১,৭৫,০০০/- (এক লক্ষ পঁচাত্তর হাজার টাকা মাত্র)",
  },
];

export const DEFAULT_WARD_MEMBERS: WardCommitteeMember[] = [
  {
    name: "",
    fatherName: "",
    village: "",
    designation: "",
    committeeRole: "সভাপতি",
  },
];

export const DEFAULT_PIC_COMMITTEE_MEMBERS: WardCommitteeMember[] = [
  {
    name: "গোলাম আরিফ",
    fatherName: "",
    village: "দক্ষিণ বালিয়াঘাট্টা",
    designation: "ইউপি সদস্য",
    committeeRole: "সভাপতি",
  },
  {
    name: "মোসাঃ শাহিদা খাতুন",
    fatherName: "",
    village: "দক্ষিণ বালিয়াঘাট্টা",
    designation: "ইউপি সদস্য",
    committeeRole: "স. সচিব",
  },
  {
    name: "আব্দুল মালেক",
    fatherName: "",
    village: "দক্ষিণ বালিয়াঘাট্টা",
    designation: "শিক্ষক",
    committeeRole: "সদস্য",
  },
  {
    name: "মোঃ মোস্তাফিজুর রহমান",
    fatherName: "",
    village: "দক্ষিণ বালিয়াঘাট্টা",
    designation: "ইমাম",
    committeeRole: "সদস্য",
  },
  {
    name: "আব্দুল হাকিম",
    fatherName: "",
    village: "দক্ষিণ বালিয়াঘাট্টা",
    designation: "গণ্যমান্য",
    committeeRole: "সদস্য",
  },
];

export interface ProjectData {
  id: string;
  createdAt: string;
  updatedAt: string;
  isDeleted?: boolean;
  deletedAt?: string | null;
  implementationMode?: "quotation" | "pic";

  // ১. প্রকল্পের সাধারণ তথ্য (General Project Info)
  projectName: string;
  projectCode: string;
  projectNo: string;
  fileNo: string;
  fileRegNo?: string;
  contractValue: string;
  contractValueInWords?: string;
  contractDate: string;
  workOrderDate: string;
  fileOpeningDate: string;
  contractorName: string;
  contractorAddress?: string;
  fiscalYear: string;
  presidentName: string;
  wardNo: string;
  unionName: string;
  upazila?: string;
  district?: string;
  implementingAgency?: string;

  // ২. প্রাক্কলন ও প্রশাসনিক তথ্য (Estimation & Administrative Info)
  estimationDate: string;
  estimatedValue: string;
  estimatedValueInWords?: string;
  sectorName: string;
  allocationAmount: string;

  // ৩. দরপত্র ও চুক্তি সংক্রান্ত তথ্য (Tender & Contract Info)
  donorAgency: string;
  contractorAndFirm: string;
  tenderNoticeNo: string;
  tenderNoticeDate: string;
  tenderSellingLastDate: string;
  tenderSubmissionLastDate: string;
  tenderOpeningDateTime: string;
  tenderEvaluationDate: string;
  quotedPrice: string;
  lowestPrice: string;
  tenderWorkOrderNo: string;
  tenderWorkOrderDate: string;
  agreementDate: string;
  tenderContractPrice: string;
  contractExpiryDate: string;
  executedWorkValue: string;
  timeLimit: string;
  // Competitors for Tender Opening Sheet
  tenderer1?: string;
  tenderer1Firm?: string;
  tenderer1Price?: string;
  tenderer2?: string;
  contractorFirm?: string;
  tenderer2Price?: string;
  tenderer3?: string;
  tenderer3Firm?: string;
  tenderer3Price?: string;
  tenderEvaluationList?: TenderEvaluationEntry[];
  tenderOpeningList?: TenderOpeningEntry[];

  // ৪. সভা ও কমিটি সংক্রান্ত তথ্য (Meeting & Committee Info)
  meetingNo: string;
  meetingDate: string;
  meetingTime?: string;          // সভার সময় (যেমন: সকাল ১০.০০ ঘটিকা)
  meetingDate1?: string;         // সভা ০১ (দরপত্র মূল্যায়ন ও কার্যাদেশ)
  meetingDate2?: string;         // সভা ০২ (কাজ আরম্ভ ও অনুমোদন)
  meetingDate3?: string;         // সভা ০৩ (কাজ সমাপ্তি ও চূড়ান্ত বিল)
  meetingPlace?: string;
  president: string;
  designation: string;
  committeeDesignation: string;
  committeeMembers: string;
  village: string;
  signature: string;
  memberFatherOrHusband: string;
  wardCommitteeMembers?: WardCommitteeMember[];

  // ৫. ব্যাংক, চেক, বিল ও আর্থিক লেনদেন (Banking, Cheque, Bills & Financials)
  bankName: string;
  bankBranchName: string;
  bankAccountNo?: string;
  chequeNo: string;
  chequeDate: string;
  chequeSignatories: string;
  vatRate?: string;
  vat: string;
  taxRate?: string;
  tax: string;
  securityDepositRate?: string;
  securityDeposit: string;
  totalDeduction: string;
  moneyAmount: string;
  netPayment: string;
  netPaymentInWords?: string;
  billAmount: string;
  billAmountInWords?: string;
  billDate: string;
  installmentNo: string;
  receiptDate: string;
  financialDate: string;

  // ৬. বাস্তবায়ন ও অন্যান্য বিবরণ (Implementation & Other Details)
  materialsDescription: string;
  workMeasurement: string;
  laborName: string;
  supervisionDate: string;
  chairmanDate: string;
  applicationDate: string;
  applicationRecommendDate: string;
  finalDesignation: string;

  // ৭. প্রকল্পের ছবি ও স্থিরচিত্র (Project Photos)
  photos?: ProjectPhoto[];

  // ৮. কপি মেটাডেটা (Copy Metadata)
  copiedFrom?: string;           // ID of original project
  copiedAt?: string;             // ISO timestamp of when copy was made
  originalProjectName?: string;  // Name at time of copy (to detect rename)
}

/**
 * Determines whether a project is currently an active "Copy":
 * 1. Has `copiedAt` timestamp.
 * 2. Less than 1 hour (3,600,000 ms = 60 mins) has elapsed since `copiedAt`.
 * (Note: Even if project name is changed, the "কপি" tag remains visible for the entire 1 hour).
 */
export function isProjectCopyActive(
  project?: Partial<ProjectData> | null,
  currentTimeMs?: number
): boolean {
  if (!project || !project.copiedAt) return false;

  // 1. Determine current time: client-provided timestamp, or fallback to Date.now() if on client
  const now =
    typeof currentTimeMs === "number"
      ? currentTimeMs
      : typeof window !== "undefined"
      ? Date.now()
      : 0;
  if (!now) {
    return false; // Safe during server-side prerender
  }

  // 2. If 1 hour (3,600,000 ms) has passed, auto-remove copy badge
  const copiedTime = new Date(project.copiedAt).getTime();
  if (isNaN(copiedTime)) return false;

  const diffMs = now - copiedTime;
  // Strictly active for the full 1 hour (60 minutes), even if name is changed
  if (diffMs < 0 || diffMs >= 60 * 60 * 1000) {
    return false;
  }

  return true;
}

/**
 * Returns remaining minutes of the 1-hour copy window (0 if expired).
 */
export function getCopyRemainingMinutes(
  project?: Partial<ProjectData> | null,
  currentTimeMs?: number
): number {
  if (!project || !project.copiedAt) return 0;
  const now =
    typeof currentTimeMs === "number"
      ? currentTimeMs
      : typeof window !== "undefined"
      ? Date.now()
      : 0;
  if (!now) return 0;
  const copiedTime = new Date(project.copiedAt).getTime();
  if (isNaN(copiedTime)) return 0;
  const diffMs = now - copiedTime;
  const remainingMs = 60 * 60 * 1000 - diffMs;
  if (remainingMs <= 0) return 0;
  return Math.max(1, Math.ceil(remainingMs / (60 * 1000)));
}

/**
 * Automatically cleans expired copy metadata from a project after 1 hour has elapsed.
 */
export function sanitizeProjectCopyMetadata(
  project: ProjectData,
  currentTimeMs?: number
): ProjectData {
  if (!project.copiedAt) return project;

  const now =
    typeof currentTimeMs === "number"
      ? currentTimeMs
      : typeof window !== "undefined"
      ? Date.now()
      : 0;
  const copiedTime = new Date(project.copiedAt).getTime();
  const isTimeExpired = now > 0 && !isNaN(copiedTime) && now - copiedTime >= 60 * 60 * 1000;

  if (isTimeExpired) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { copiedAt, originalProjectName, copiedFrom, ...cleanProject } = project;
    return cleanProject as ProjectData;
  }

  return project;
}

export interface SectionMeta {
  id: number;
  numberBn: string;
  titleBn: string;
  titleEn: string;
  fieldCount: number;
  description: string;
}

export const SECTIONS: SectionMeta[] = [
  {
    id: 1,
    numberBn: "১",
    titleBn: "প্রকল্পের সাধারণ তথ্য",
    titleEn: "General Project Info",
    fieldCount: 13,
    description: "প্রকল্পের নাম, কোড, ইউনিয়ন, ওয়ার্ড, সভাপতি ও বেসিক চুক্তির বিবরণ",
  },
  {
    id: 2,
    numberBn: "২",
    titleBn: "প্রাক্কলন ও প্রশাসনিক তথ্য",
    titleEn: "Estimation & Administrative Info",
    fieldCount: 4,
    description: "প্রাক্কলিত ব্যয়, বরাদ্দের পরিমাণ, তহবিল খাত এবং প্রাক্কলনের তারিখ",
  },
  {
    id: 3,
    numberBn: "৩",
    titleBn: "দরপত্র ও চুক্তি সংক্রান্ত তথ্য",
    titleEn: "Tender & Contract Info",
    fieldCount: 17,
    description: "বিজ্ঞপ্তি, দরপত্র দাখিল/উন্মুক্তকরণ, দরপত্র মূল্যায়ন, ঠিকাদার ও কার্যাদেশ",
  },
  {
    id: 4,
    numberBn: "৪",
    titleBn: "সভা ও কমিটি সংক্রান্ত তথ্য",
    titleEn: "Meeting & Committee Info",
    fieldCount: 6,
    description: "সভার নং, সময়, স্থান, ৩টি সভার তারিখ এবং নিচের ছকে কমিটির সদস্য তালিকা",
  },
  {
    id: 5,
    numberBn: "৫",
    titleBn: "ব্যাংক, চেক, বিল ও আর্থিক লেনদেন",
    titleEn: "Banking, Cheque, Bills & Financials",
    fieldCount: 16,
    description: "ব্যাংক হিসাব, চেক ইস্যু, ভ্যাট/ট্যাক্স/জামানত কর্তন ও নিট বিল পরিশোধ",
  },
  {
    id: 6,
    numberBn: "৬",
    titleBn: "বাস্তবায়ন ও অন্যান্য বিবরণ",
    titleEn: "Implementation & Other Details",
    fieldCount: 8,
    description: "মালামাল, পরিমাপ, তদারকি, চেয়ারম্যান স্বাক্ষর ও সুপারিশের বিবরণ",
  },
];

export const PIC_SECTIONS: SectionMeta[] = [
  {
    id: 1,
    numberBn: "১",
    titleBn: "সাধারণ তথ্য",
    titleEn: "General Info",
    fieldCount: 10,
    description: "প্রকল্পের নাম, অর্থবছর, কিস্তি নং, কোড, ফাইল নং, খাতের নাম, ওয়ার্ড ও বরাদ্দ",
  },
  {
    id: 2,
    numberBn: "২",
    titleBn: "সভা ও কমিটি সংক্রান্ত তথ্য",
    titleEn: "Meeting & Committee Info",
    fieldCount: 6,
    description: "সভার নং, সময়, স্থান, ১ম, ২য় ও ৩য় সভার তারিখ এবং নিচের ছকে কমিটির সদস্য তালিকা",
  },
  {
    id: 3,
    numberBn: "৩",
    titleBn: "প্রাক্কলন ও প্রশাসনিক তথ্য",
    titleEn: "Estimation & Administrative Info",
    fieldCount: 9,
    description: "প্রাক্কলন তারিখ ও মূল্য, কার্যদেশ, চুক্তি মূল্য, মেয়াদ ও সময় সীমা",
  },
  {
    id: 4,
    numberBn: "৪",
    titleBn: "বাস্তবায়ন ও অন্যান্য বিবরণ",
    titleEn: "Implementation & Other Details",
    fieldCount: 4,
    description: "কাজের পরিমাপ, চেয়ারম্যান ও প্রকৌশলীর প্রত্যয়ন তারিখ এবং আবেদনের তারিখ",
  },
  {
    id: 5,
    numberBn: "৫",
    titleBn: "ব্যাংক, চেক, বিল ও আর্থিক লেনদেন",
    titleEn: "Banking, Cheque, Bills & Financials",
    fieldCount: 11,
    description: "ভ্যাট, আয়কর, সর্বমোট কর্তন, নিট প্রদান, বিলের পরিমাণ, ব্যাংক শাখা, হিসাব নং ও চেক",
  },
];

export const INITIAL_PROJECT_DATA: ProjectData = {
  id: "",
  createdAt: "",
  updatedAt: "",

  // ১. সাধারণ তথ্য
  projectName: "",
  projectCode: "",
  projectNo: "",
  fileNo: "",
  fileRegNo: "",
  contractValue: "",
  contractValueInWords: "",
  contractDate: "",
  workOrderDate: "",
  fileOpeningDate: "",
  contractorName: "",
  contractorAddress: "",
  fiscalYear: "২০২৬-২০২৭",
  presidentName: "",
  wardNo: "",
  unionName: "",
  upazila: "",
  district: "",
  implementingAgency: "",

  // ২. প্রাক্কলন ও প্রশাসনিক তথ্য
  estimationDate: "",
  estimatedValue: "",
  estimatedValueInWords: "",
  sectorName: "",
  allocationAmount: "",

  // ৩. দরপত্র ও চুক্তি
  donorAgency: "",
  contractorAndFirm: "",
  tenderNoticeNo: "",
  tenderNoticeDate: "",
  tenderSellingLastDate: "",
  tenderSubmissionLastDate: "",
  tenderOpeningDateTime: "",
  tenderEvaluationDate: "",
  quotedPrice: "",
  lowestPrice: "",
  tenderWorkOrderNo: "",
  tenderWorkOrderDate: "",
  agreementDate: "",
  tenderContractPrice: "",
  contractExpiryDate: "",
  executedWorkValue: "",
  timeLimit: "",
  tenderer1: "",
  tenderer1Price: "",
  tenderer2: "",
  contractorFirm: "",
  tenderer2Price: "",
  tenderer3: "",
  tenderer3Price: "",
  tenderEvaluationList: DEFAULT_TENDER_EVALUATION_LIST,
  tenderOpeningList: DEFAULT_TENDER_OPENING_LIST,

  // ৪. সভা ও কমিটি
  meetingNo: "",
  meetingDate: "",
  meetingTime: "সকাল ১০.০০ ঘটিকা",
  meetingDate1: "",
  meetingDate2: "",
  meetingDate3: "",
  meetingPlace: "ইউপি কার্যালয়",
  president: "",
  designation: "",
  committeeDesignation: "",
  committeeMembers: "",
  village: "",
  signature: "",
  memberFatherOrHusband: "",
  wardCommitteeMembers: DEFAULT_WARD_MEMBERS,
  tenderEvaluationList: DEFAULT_TENDER_EVALUATION_LIST,

  // ৫. ব্যাংক, চেক, বিল
  bankName: "",
  bankBranchName: "",
  bankAccountNo: "",
  chequeNo: "",
  chequeDate: "",
  chequeSignatories: "",
  vatRate: "",
  vat: "",
  taxRate: "",
  tax: "",
  securityDepositRate: "",
  securityDeposit: "",
  totalDeduction: "",
  moneyAmount: "",
  netPayment: "",
  netPaymentInWords: "",
  billAmount: "",
  billAmountInWords: "",
  billDate: "",
  installmentNo: "১ম ও চূড়ান্ত বিল",
  receiptDate: "",
  financialDate: "",

  // ৬. বাস্তবায়ন ও অন্যান্য
  materialsDescription: "",
  workMeasurement: "",
  laborName: "",
  supervisionDate: "",
  chairmanDate: "",
  applicationDate: "",
  applicationRecommendDate: "",
  finalDesignation: "",
  photos: [],
};

export const DEMO_PROJECT_DATA: ProjectData = {
  id: "demo-prj-08-basudebpur",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),

  // ১. প্রকল্পের সাধারণ তথ্য (হুবহু ইউজারের ডকুমেন্টের তথ্যানুযায়ী)
  projectName: "হাতনাবাদ হাবিবুর রহমানের বাড়ী হতে শহিদুল মাস্টারের বাড়ী পর্যন্ত রাস্তা এইচবিবি করণ",
  projectCode: "UP-BASU-2026-01",
  projectNo: "০১",
  fileNo: "ইউপি/উন্নয়ন/২০২৬-২৭/০১",
  contractValue: "১,৭৪,০০০/-",
  contractValueInWords: "এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র",
  contractDate: "২০২৬-০৪-৩০",
  workOrderDate: "২০২৬-১০-১৫",
  fileOpeningDate: "২০২৬-০৪-১৫",
  contractorName: "বারাকাত ডেভেলপমেন্ট (মোসাঃ জেসমিন আরা)",
  contractorAddress: "ঘোড়ামারা, বোয়ালিয়া, রাজশাহী",
  fiscalYear: "২০২৬-২০২৭",
  presidentName: "মোঃ কামরুজ্জামান",
  wardNo: "০৩",
  unionName: "০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ",
  upazila: "গোদাগাড়ী",
  district: "রাজশাহী",

  // ২. প্রাক্কলন ও প্রশাসনিক তথ্য
  estimationDate: "২০২৬-০৪-২০",
  estimatedValue: "১,৭৪,০০০/-",
  estimatedValueInWords: "এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র",
  sectorName: "ইউনিয়ন পরিষদ উন্নয়ন সহায়তা তহবিল",
  allocationAmount: "১,৭৪,০০০/-",

  // ৩. দরপত্র ও চুক্তি সংক্রান্ত তথ্য
  donorAgency: "স্থানীয় সরকার বিভাগ (LGD) - উন্নয়ন সহায়তা তহবিল",
  contractorAndFirm: "বারাকাত ডেভেলপমেন্ট (প্রোপ্রাইটর: মোসাঃ জেসমিন আরা)",
  tenderNoticeNo: "০১",
  tenderNoticeDate: "২০২৬-০৪-২৫",
  tenderSellingLastDate: "২০২৬-০৪-২৯",
  tenderSubmissionLastDate: "২০২৬-০৪-৩০",
  tenderOpeningDateTime: "১৫/১০/২০২৬ সময়: ২.৩০ ঘটিকা",
  tenderEvaluationDate: "২০২৬-০৪-৩০",
  quotedPrice: "১,৭৪,০০০/-",
  lowestPrice: "১,৭৪,০০০/-",
  tenderWorkOrderNo: "০১",
  tenderWorkOrderDate: "২০২৬-১০-১৫",
  agreementDate: "২০২৬-০৪-৩০",
  tenderContractPrice: "১,৭৪,০০০/-",
  contractExpiryDate: "২০২৬-১১-১০",
  executedWorkValue: "১,৭৪,০০০/-",
  timeLimit: "৩০ দিন",

  // দরপত্র খোলা সীটের জন্য প্রতিযোগী দরপত্রদাতাদের বিবরণ
  tenderer1: "মোঃ মাহফুজুর রহমান, সপুরা, বোয়ালিয়া, রাজশাহী।",
  tenderer1Price: "১,৭৬,০০০/- (এক লক্ষ ছিয়াত্তর হাজার টাকা মাত্র)",
  tenderer2: "মোসাঃ জেসমিন আরা, ঘোড়ামারা, বোয়ালিয়া, রাজশাহী।",
  tenderer2Price: "১,৭৪,০০০/- (এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র)",
  tenderer3: "মোঃ কামরুজ্জামান, বাউসা, বাঘা, রাজশাহী।",
  tenderer3Price: "১,৭৫,০০০/- (এক লক্ষ পঁচাত্তর হাজার টাকা মাত্র)",
  tenderEvaluationList: DEFAULT_TENDER_EVALUATION_LIST,
  tenderOpeningList: DEFAULT_TENDER_OPENING_LIST,

  // ৪. সভা ও কমিটি সংক্রান্ত তথ্য
  meetingNo: "০৩",
  meetingDate: "২০২৬-১১-০৫",
  meetingTime: "সকাল ১০.০০ ঘটিকা",
  meetingDate1: "২০২৬-০৪-৩০",
  meetingDate2: "২০২৬-১০-১৫",
  meetingDate3: "২০২৬-১১-০৫",
  meetingPlace: "ইউপি কার্যালয়",
  president: "মোঃ কামরুজ্জামান",
  designation: "ইউপি সদস্য (০৩ নং ওয়ার্ড)",
  committeeDesignation: "সভাপতি, ওয়ার্ড কমিটি",
  committeeMembers: "",
  village: "হাতনাবাদ",
  signature: "সম্পাদিত ও অনুমোদিত",
  memberFatherOrHusband: "",
  wardCommitteeMembers: DEFAULT_WARD_MEMBERS,
  tenderEvaluationList: DEFAULT_TENDER_EVALUATION_LIST,

  // ৫. ব্যাংক, চেক, বিল ও আর্থিক লেনদেন (ইউজারের কর্তন শিটের হুবহু মিল)
  bankName: "সোনালি ব্যাংক লিমিটেড",
  bankBranchName: "গোদাগাড়ী",
  chequeNo: "CD-892341",
  chequeDate: "২০২৬-১১-১০",
  chequeSignatories: "চেয়ারম্যান ও ইউপি সচিব",
  vatRate: "১০%",
  vat: "১৭,৪০০/-",
  taxRate: "৭.৫%",
  tax: "১৩,০৫০/-",
  securityDepositRate: "৫%",
  securityDeposit: "৮,৭০০/-",
  totalDeduction: "৩৯,১৫০/-",
  moneyAmount: "১,৭৪,০০০/-",
  netPayment: "১,৩৪,৮৫০/-",
  netPaymentInWords: "এক লক্ষ চৌত্রিশ হাজার আটশত পঞ্চাশ টাকা",
  billAmount: "১,৭৪,০০০/-",
  billAmountInWords: "এক লক্ষ চুয়াত্তর হাজার টাকা মাত্র",
  billDate: "২০২৬-১০-১০",
  installmentNo: "১ম ও চূড়ান্ত বিল",
  receiptDate: "২০২৬-১১-১০",
  financialDate: "২০২৬-১১-১০",

  // ৬. বাস্তবায়ন ও অন্যান্য বিবরণ
  materialsDescription: "এইচবিবি ইটের সোলিং ও হেরিংবোন বন্ড, বালু ও সাইড ওয়াল",
  workMeasurement: "হাতনাবাদ হাবিবুর রহমানের বাড়ী হতে শহিদুল মাস্টারের বাড়ী পর্যন্ত রাস্তা এইচবিবি করণ কাজ শতভাগ সম্পন্ন",
  laborName: "নির্মাণ শ্রমিক দল",
  supervisionDate: "২০২৬-১০-০৮",
  chairmanDate: "২০২৬-১০-১৫",
  applicationDate: "২০২৬-১০-১৫",
  applicationRecommendDate: "২০২৬-১০-১৫",
  finalDesignation: "উপ-সহকারী প্রকৌশলী, এলজিইডি, গোদাগাড়ী",
  photos: [],
};

export const DEMO_PIC_PROJECT_DATA: ProjectData = {
  id: "demo-pic-08-basudebpur",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  implementationMode: "pic",

  // ১. সাধারণ তথ্য (পিআইসি ডকুমেন্টের তথ্যানুযায়ী)
  projectName: "দক্ষিণ বালিয়াঘাট্টা আমিনুলের বাড়ি হতে শাহিনের বাড়ি পর্যন্ত রাস্তা বালি ভরাট, ছলিং ও সিঁড়ি নির্মাণ",
  projectCode: "২০২৬০৯০০৩",
  projectNo: "১০",
  fileNo: "৪৬.৮৩.৮১.৩৪.০২২.০১.০০০.২৪-",
  contractValue: "১,৫০,১৪০/-",
  contractValueInWords: "এক লক্ষ পঞ্চাশ হাজার একশত চল্লিশ টাকা মাত্র",
  contractDate: "২০২৬-০৩-১১",
  workOrderDate: "২০২৬-০৬-৩০",
  fileOpeningDate: "২০২৬-০৩-১১",
  contractorName: "মোসাঃ জেসমিন আরা",
  contractorAddress: "গোদাগাড়ী, রাজশাহী",
  fiscalYear: "২০২৬-২০২৭",
  presidentName: "গোলাম আরিফ",
  wardNo: "০২",
  unionName: "০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ",
  upazila: "গোদাগাড়ী",
  district: "রাজশাহী",
  implementingAgency: "০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ, গোদাগাড়ী, রাজশাহী",

  // ২. প্রাক্কলন ও প্রশাসনিক তথ্য
  estimationDate: "২০২৬-০৪-১৮",
  estimatedValue: "১,৫০,১৪০/-",
  estimatedValueInWords: "এক লক্ষ পঞ্চাশ হাজার একশত চল্লিশ টাকা মাত্র",
  sectorName: "স্থাবর সম্পত্তি হস্তান্তর কর ১%",
  allocationAmount: "১,৫০,১৪০/-",

  // ৩. দরপত্র ও চুক্তি সংক্রান্ত তথ্য (পিআইসি)
  donorAgency: "ইউনিয়ন পরিষদ ভূমি হস্তান্তর ১% তহবিল",
  contractorAndFirm: "বারাকাত ডেভেলপমেন্ট",
  tenderNoticeNo: "",
  tenderNoticeDate: "",
  tenderSellingLastDate: "",
  tenderSubmissionLastDate: "",
  tenderOpeningDateTime: "",
  tenderEvaluationDate: "",
  quotedPrice: "",
  lowestPrice: "",
  tenderWorkOrderNo: "০৫",
  tenderWorkOrderDate: "২০২৬-০৬-৩০",
  agreementDate: "২০২৬-০৩-১১",
  tenderContractPrice: "১,৫০,১৪০/-",
  contractExpiryDate: "২০২৬-০৭-৩০",
  executedWorkValue: "১,৫০,১৪০/-",
  timeLimit: "৩০ দিন",
  contractorFirm: "বারাকাত ডেভেলপমেন্ট",

  // ৪. সভা ও কমিটি সংক্রান্ত তথ্য
  meetingNo: "০১",
  meetingDate: "২০২৬-০৩-১১",
  meetingTime: "সকাল ১০.০০ ঘটিকা",
  meetingDate1: "২০২৬-০৩-১১",
  meetingDate2: "২০২৬-০৬-৩০",
  meetingDate3: "২০২৬-০৭-১৫",
  meetingPlace: "ইউনিয়ন পরিষদ কার্যালয়",
  president: "গোলাম আরিফ",
  designation: "ইউপি সদস্য",
  committeeDesignation: "সভাপতি",
  committeeMembers: "গোলাম আরিফ, মোসাঃ শাহিদা খাতুন, আব্দুল মালেক, মোঃ মোস্তাফিজুর রহমান, আব্দুল হাকিম",
  village: "দক্ষিণ বালিয়াঘাট্টা",
  signature: "সম্পাদিত ও অনুমোদিত",
  memberFatherOrHusband: "",
  wardCommitteeMembers: DEFAULT_PIC_COMMITTEE_MEMBERS,

  // ৫. ব্যাংক, চেক, বিল ও আর্থিক লেনদেন
  bankName: "জনতা ব্যাংক লিমিটেড",
  bankBranchName: "জনতা ব্যাংক লিমিটেড",
  bankAccountNo: "০১০০০৩৭২৪৯১৫১",
  chequeNo: "১৬৬৭৬৬০",
  chequeDate: "২০২৬-০৫-১৮",
  chequeSignatories: "চেয়ারম্যান ও ইউপি সচিব",
  vatRate: "৯.৫%",
  vat: "১৪,৫১৯.৫০",
  taxRate: "৭.৫%",
  tax: "১১,২৬০.৫০",
  securityDepositRate: "",
  securityDeposit: "",
  totalDeduction: "২৫,৭৮০.০০",
  moneyAmount: "১,২৪,৩৬০.৫০/-",
  netPayment: "১,২৪,৩৬০.৫০/-",
  netPaymentInWords: "এক লক্ষ চব্বিশ হাজার তিনশত ষাট টাকা পঞ্চাশ পয়সা মাত্র",
  billAmount: "১,৫০,১৪০/-",
  billAmountInWords: "এক লক্ষ পঞ্চাশ হাজার একশত চল্লিশ টাকা মাত্র",
  billDate: "২০২৬-০৫-১৮",
  installmentNo: "০৩/২০২৫-২৬",
  receiptDate: "২০২৬-০৫-১৮",
  financialDate: "২০২৬-০৫-১৮",

  // ৬. বাস্তবায়ন ও অন্যান্য বিবরণ
  materialsDescription: "বালি ভরাট, ইটের ছলিং ও সিঁড়ি নির্মাণ",
  workMeasurement: "বালি ভরাট, ইটের ছলিং ও সিঁড়ি নির্মাণ",
  laborName: "",
  supervisionDate: "২০২৬-০৪-১৮",
  chairmanDate: "২০২৬-০৪-১৮",
  applicationDate: "২০২৬-০৪-১৮",
  applicationRecommendDate: "২০২৬-০৪-১৮",
  finalDesignation: "উপ-প্রকৌশলী, গোদাগাড়ী, রাজশাহী",
  photos: [],
};
