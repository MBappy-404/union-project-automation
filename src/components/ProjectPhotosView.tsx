"use client";

import React, { useState, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { useDropzone } from "react-dropzone";
import {
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit2,
  Check,
  Maximize2,
} from "lucide-react";
import { ProjectData, ProjectPhoto, PhotoStage } from "@/types/project";
import {
  compressAndProcessImage,
  formatBanglaFileSize,
} from "@/lib/imageOptimization";
import {
  fetchPhotosFromServer,
  savePhotoToServer,
  deletePhotoFromServer,
  updatePhotoOnServer,
} from "@/lib/api";
import { toBanglaDigits, formatBanglaDate } from "@/lib/banglaUtils";
import { SearchableProjectSelect } from "@/components/SearchableProjectSelect";

interface ProjectPhotosViewProps {
  data: ProjectData;
  allProjects: ProjectData[];
  onSelectProject: (id: string, project?: ProjectData) => void;
  onPhotosUpdated?: (photos: ProjectPhoto[]) => void;
}

const STAGE_LABELS: Record<PhotoStage, { title: string; color: string; bg: string; border: string }> = {
  before: {
    title: "কাজ শুরুর পূর্বের অবস্থা",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
  },
  during: {
    title: "কাজ চলাকালীন অবস্থা",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
  },
  after: {
    title: "কাজ সমাপ্তির অবস্থা",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  signboard: {
    title: "প্রকল্প সাইনবোর্ড",
    color: "text-indigo-700",
    bg: "bg-indigo-50",
    border: "border-indigo-200",
  },
  other: {
    title: "অন্যান্য স্থিরচিত্র",
    color: "text-slate-700",
    bg: "bg-slate-50",
    border: "border-slate-200",
  },
};

export const ProjectPhotosView: React.FC<ProjectPhotosViewProps> = ({
  data,
  allProjects,
  onSelectProject,
  onPhotosUpdated,
}) => {
  const [photos, setPhotos] = useState<ProjectPhoto[]>(data.photos || []);
  const [selectedStage, setSelectedStage] = useState<PhotoStage>("before");
  const [filterStage, setFilterStage] = useState<"all" | PhotoStage>("all");
  const [captionInput, setCaptionInput] = useState<string>("");
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionProgress, setCompressionProgress] = useState<number>(0);
  const [uploadStatusText, setUploadStatusText] = useState<string>("ছবি আপলোড হচ্ছে...");
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Lightbox / Fullscreen state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);

  // Caption inline editing
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editingCaption, setEditingCaption] = useState<string>("");

  // Deletion modal
  const [photoToDelete, setPhotoToDelete] = useState<ProjectPhoto | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Printable view toggle
  const [printMode, setPrintMode] = useState<boolean>(false);

  // Unique IDs for accessibility
  const projectSelectId = useId();
  const stageSelectId = useId();

  // Sync photos when current project changes or fetch from server
  useEffect(() => {
    let isCurrent = true;
    setPhotos(data.photos || []);

    if (data.id) {
      fetchPhotosFromServer(data.id)
        .then((fetched) => {
          if (isCurrent && fetched && fetched.length > 0) {
            setPhotos(fetched);
            onPhotosUpdated?.(fetched);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch photos from server:", err);
        });
    }

    return () => {
      isCurrent = false;
    };
  }, [data.id, data.photos, onPhotosUpdated]);

  // Handle Dropzone Upload
  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles || acceptedFiles.length === 0) return;

      const validImages = acceptedFiles.filter((f) => f.type.startsWith("image/"));
      if (validImages.length === 0) {
        setFeedbackMsg({
          type: "error",
          text: "শুধুমাত্র ছবি (JPG, PNG, WEBP) আপলোড করা যাবে।",
        });
        return;
      }

      setIsCompressing(true);
      setCompressionProgress(0);

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

      if (
        !cloudName ||
        cloudName === "your_cloud_name_here" ||
        !uploadPreset ||
        uploadPreset === "your_upload_preset_here"
      ) {
        setFeedbackMsg({
          type: "error",
          text: "ছবি আপলোড কনফিগারেশনে সমস্যা। অনুগ্রহ করে অ্যাডমিনের সাথে যোগাযোগ করুন।",
        });
        setIsCompressing(false);
        return;
      }

      try {
        const newUploadedPhotos: ProjectPhoto[] = [];

        for (let i = 0; i < validImages.length; i++) {
          const original = validImages[i];
          const progressStep = Math.round(((i + 1) / validImages.length) * 100);

          setUploadStatusText(`ছবি আপলোড হচ্ছে (${toBanglaDigits(i + 1)}/${toBanglaDigits(validImages.length)})...`);

          // 1. Compress image via browser-image-compression
          const result = await compressAndProcessImage(
            original,
            {
              maxSizeMB: 0.6,
              maxWidthOrHeight: 1600,
              initialQuality: 0.75,
              useWebWorker: true,
            },
            (p) => setCompressionProgress(p)
          );

          setUploadStatusText(`ছবি আপলোড হচ্ছে (${toBanglaDigits(i + 1)}/${toBanglaDigits(validImages.length)})...`);

          // 2. Direct upload to Cloudinary (exact Dhara pattern)
          let finalUrl = result.dataUrl;
          let publicId: string | undefined = undefined;
          let finalSize = result.compressedSize;

          try {
            const uploadData = new FormData();
            uploadData.append("file", result.compressedFile);
            uploadData.append("upload_preset", uploadPreset);

            const cRes = await fetch(
              `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
              {
                method: "POST",
                body: uploadData,
              }
            );

            if (cRes.ok) {
              const cData = await cRes.json();
              if (cData.secure_url) {
                finalUrl = cData.secure_url;
                publicId = cData.public_id;
                finalSize = cData.bytes || result.compressedSize;
              }
            } else {
              console.warn("Cloudinary upload failed, falling back to local compressed dataUrl");
            }
          } catch (cloudErr) {
            console.warn("Cloudinary direct upload network error, using local fallback:", cloudErr);
          }

          const newPhoto: ProjectPhoto = {
            id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            url: finalUrl,
            publicId: publicId,
            caption:
              captionInput.trim() ||
              (validImages.length === 1
                ? STAGE_LABELS[selectedStage].title
                : `${STAGE_LABELS[selectedStage].title} - ${toBanglaDigits(i + 1)}`),
            stage: selectedStage,
            uploadedAt: new Date().toISOString(),
            size: finalSize,
            originalSize: result.originalSize,
            fileName: original.name,
          };

          // 3. Save to database
          await savePhotoToServer(data.id, newPhoto);
          newUploadedPhotos.push(newPhoto);

          setCompressionProgress(progressStep);
        }

        const updated = [...newUploadedPhotos, ...photos];
        setPhotos(updated);
        onPhotosUpdated?.(updated);
        setCaptionInput("");

        setFeedbackMsg({
          type: "success",
          text: `${toBanglaDigits(validImages.length)}টি ছবি সফলভাবে আপলোড হয়েছে।`,
        });
      } catch (err: any) {
        console.error("Photo upload error:", err);
        setFeedbackMsg({
          type: "error",
          text: "ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।",
        });
      } finally {
        setIsCompressing(false);
        setCompressionProgress(0);
      }
    },
    [captionInput, selectedStage, photos, data.id, onPhotosUpdated]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleDrop,
    accept: {
      "image/jpeg": [".jpg", ".jpeg"],
      "image/png": [".png"],
      "image/webp": [".webp"],
    },
    disabled: isCompressing,
  });

  // Handle Photo Deletion
  const handleDeletePhoto = async () => {
    if (!photoToDelete) return;
    setIsDeleting(true);

    try {
      const res = await deletePhotoFromServer(
        data.id,
        photoToDelete.id,
        photoToDelete.publicId
      );
      const filtered = photos.filter((p) => p.id !== photoToDelete.id);
      setPhotos(filtered);
      onPhotosUpdated?.(filtered);

      if (lightboxIndex !== null) {
        setLightboxIndex(null);
      }

      setFeedbackMsg({
        type: "success",
        text: "ছবিটি সফলভাবে মুছে ফেলা হয়েছে।",
      });
    } catch (err) {
      console.error("Delete photo error:", err);
      setFeedbackMsg({
        type: "error",
        text: "ছবি ডিলিট করতে সমস্যা হয়েছে।",
      });
    } finally {
      setIsDeleting(false);
      setPhotoToDelete(null);
    }
  };

  // Handle Inline Caption Save
  const handleSaveCaption = async (photoId: string) => {
    try {
      await updatePhotoOnServer(data.id, photoId, { caption: editingCaption.trim() });
      const updated = photos.map((p) =>
        p.id === photoId ? { ...p, caption: editingCaption.trim() } : p
      );
      setPhotos(updated);
      onPhotosUpdated?.(updated);
      setEditingPhotoId(null);
    } catch (err) {
      console.error("Save caption error:", err);
    }
  };

  // Filtered photos list
  const filteredPhotos =
    filterStage === "all"
      ? photos
      : photos.filter((p) => p.stage === filterStage);

  // Lightbox navigation
  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setZoomLevel(1);
    setRotation(0);
  };

  const closeLightbox = () => {
    setLightboxIndex(null);
    setZoomLevel(1);
    setRotation(0);
  };

  const nextPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % filteredPhotos.length);
    setZoomLevel(1);
    setRotation(0);
  };

  const prevPhoto = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      (lightboxIndex - 1 + filteredPhotos.length) % filteredPhotos.length
    );
    setZoomLevel(1);
    setRotation(0);
  };

  // Download image file
  const handleDownloadImage = (photo: ProjectPhoto) => {
    const link = document.createElement("a");
    link.href = photo.url;
    link.download = `${data.projectCode || "UP"}_${photo.stage}_${photo.id}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") nextPhoto();
      if (e.key === "ArrowLeft") prevPhoto();
      if (e.key === "Escape") closeLightbox();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, filteredPhotos.length]);

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* 1. TOP HEADER & PROJECT SELECTOR (No-print)                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="no-print bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Project Selector with clear Bangla Label */}
        <div className="flex-1">
          <label
            className="block text-xs font-normal text-slate-500 mb-1"
          >
            সক্রিয় প্রকল্প নির্বাচন করুন
          </label>
          <div className="flex items-center gap-2">
            <SearchableProjectSelect
              currentProject={data}
              allProjects={allProjects}
              onSelectProject={onSelectProject}
              maxWidthClass="max-w-[540px]"
            />
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-normal border border-blue-100 whitespace-nowrap">
              <Camera className="w-3.5 h-3.5" />
              <span>মোট ছবি: {toBanglaDigits(photos.length)}টি</span>
            </span>
          </div>
        </div>

        {/* Action Buttons: Print Photo Sheet / Toggle */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <button
            type="button"
            onClick={() => {
              setPrintMode(!printMode);
              if (!printMode) {
                setTimeout(() => window.print(), 300);
              }
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm sm:text-[15px] font-normal bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-blue-600" />
            <span>ছবির অ্যালবাম প্রিন্ট</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackMsg && (
        <div
          className={`no-print px-4 py-3 rounded-xl text-sm sm:text-base font-normal flex items-center justify-between border ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMsg.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMsg(null)}
            className="text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 2. IMAGE UPLOAD & OPTIMIZATION CARD (No-print)               */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="no-print bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-normal text-slate-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-blue-600" />
              <span>প্রকল্পের স্থিরচিত্র সংযুক্তকরণ</span>
            </h3>
            <p className="text-xs sm:text-sm font-normal text-slate-500 mt-0.5">
              প্রকল্পের কাজের বিভিন্ন পর্যায়ের ছবি আপলোড ও সংরক্ষণ করুন
            </p>
          </div>
        </div>

        {/* Upload Controls: Stage Selection & Optional Caption */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor={stageSelectId}
              className="block text-xs font-normal text-slate-600 mb-1.5"
            >
              ছবির পর্যায় / কাজের অবস্থা নির্ধারণ করুন
            </label>
            <select
              id={stageSelectId}
              aria-label="ছবির পর্যায় নির্ধারণ করুন"
              value={selectedStage}
              onChange={(e) => setSelectedStage(e.target.value as PhotoStage)}
              className="w-full h-10 px-3 text-sm sm:text-base font-normal bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              <option value="before">১. কাজ শুরুর পূর্বের অবস্থা</option>
              <option value="during">২. কাজ চলাকালীন অবস্থা</option>
              <option value="after">৩. কাজ সমাপ্তির অবস্থা</option>
              <option value="signboard">৪. প্রকল্প সাইনবোর্ড</option>
              <option value="other">৫. অন্যান্য স্থিরচিত্র</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-normal text-slate-600 mb-1.5">
              ক্যাপশন বা বিবরণ (ঐচ্ছিক)
            </label>
            <input
              type="text"
              value={captionInput}
              onChange={(e) => setCaptionInput(e.target.value)}
              placeholder={`যেমন: ${STAGE_LABELS[selectedStage].title}`}
              className="w-full h-10 px-3 text-sm sm:text-base font-normal bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Drag and Drop Zone */}
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer ${
            isDragActive
              ? "border-blue-600 bg-blue-50/60 ring-4 ring-blue-100"
              : "border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50"
          } ${isCompressing ? "pointer-events-none opacity-80" : ""}`}
        >
          <input {...getInputProps()} />

          {/* Loading overlay during compression & upload */}
          {isCompressing && (
            <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center gap-3 z-20">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <div className="text-center">
                <p className="text-sm sm:text-base font-normal text-slate-800">
                  {uploadStatusText}
                </p>
                {compressionProgress > 0 && (
                  <p className="text-xs font-normal text-blue-600 mt-1">
                    অগ্রগতি: {toBanglaDigits(compressionProgress)}%
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Upload className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm sm:text-base font-normal text-slate-800">
                <span className="text-blue-600 underline">ছবি সিলেক্ট করুন</span> অথবা এখানে টেনে এনে ছাড়ুন (Drag & Drop)
              </p>
              <p className="text-xs sm:text-[13px] font-normal text-slate-500 mt-1">
                JPG, PNG, বা WEBP ফাইল সাপোর্ট করে (এক সাথে একাধিক ছবি আপলোড করা যাবে)
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 3. PHOTO GALLERY & FILTER TABS (No-print)                     */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="no-print space-y-4">
        {/* Stage Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setFilterStage("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-normal whitespace-nowrap transition-colors cursor-pointer ${
              filterStage === "all"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            সকল ছবি ({toBanglaDigits(photos.length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("before")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-normal whitespace-nowrap transition-colors cursor-pointer ${
              filterStage === "before"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            শুরুর পূর্বের ({toBanglaDigits(photos.filter((p) => p.stage === "before").length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("during")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-normal whitespace-nowrap transition-colors cursor-pointer ${
              filterStage === "during"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            চলাকালীন ({toBanglaDigits(photos.filter((p) => p.stage === "during").length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("after")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-normal whitespace-nowrap transition-colors cursor-pointer ${
              filterStage === "after"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            সমাপ্তির পর ({toBanglaDigits(photos.filter((p) => p.stage === "after").length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("signboard")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-normal whitespace-nowrap transition-colors cursor-pointer ${
              filterStage === "signboard"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            সাইনবোর্ড ({toBanglaDigits(photos.filter((p) => p.stage === "signboard").length)})
          </button>
          <button
            type="button"
            onClick={() => setFilterStage("other")}
            className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-normal whitespace-nowrap transition-colors cursor-pointer ${
              filterStage === "other"
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            অন্যান্য ({toBanglaDigits(photos.filter((p) => p.stage === "other").length)})
          </button>
        </div>

        {/* Gallery Grid */}
        {filteredPhotos.length === 0 ? (
          <div className="bg-white border border-slate-200/90 rounded-2xl p-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h4 className="text-base sm:text-lg font-normal text-slate-800">
              কোনো ছবি পাওয়া যায়নি
            </h4>
            <p className="text-xs sm:text-sm font-normal text-slate-500">
              {photos.length === 0
                ? "উপরের বক্সে ক্লিক করে বা ছবি টেনে এনে প্রকল্পের স্থিরচিত্র যোগ করুন।"
                : "এই ক্যাটাগরিতে কোনো ছবি নেই।"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPhotos.map((photo, idx) => {
              const stageMeta = STAGE_LABELS[photo.stage] || STAGE_LABELS.other;
              const isEditing = editingPhotoId === photo.id;

              return (
                <div
                  key={photo.id}
                  className="group bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col"
                >
                  {/* Image Thumbnail Container */}
                  <div className="relative aspect-4/3 bg-slate-100 overflow-hidden cursor-pointer">
                    <img
                      src={photo.url}
                      alt={photo.caption || "প্রকল্পের ছবি"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onClick={() => openLightbox(idx)}
                    />

                    {/* Stage Badge on Top Left */}
                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-normal border backdrop-blur-md bg-white/90 ${stageMeta.color} ${stageMeta.border}`}
                      >
                        {stageMeta.title}
                      </span>
                    </div>

                    {/* Overlay Action Buttons on Hover */}
                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => openLightbox(idx)}
                        title="বড় করে প্রিভিউ দেখুন"
                        className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-xs transition-transform transform hover:scale-110 cursor-pointer"
                      >
                        <Maximize2 className="w-4 h-4 text-blue-600" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDownloadImage(photo)}
                        title="ডাউনলোড করুন"
                        className="p-2 bg-white/95 hover:bg-white text-slate-800 rounded-xl shadow-xs transition-transform transform hover:scale-110 cursor-pointer"
                      >
                        <Download className="w-4 h-4 text-slate-700" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setPhotoToDelete(photo)}
                        title="মুছে ফেলুন"
                        className="p-2 bg-white/95 hover:bg-white text-red-600 rounded-xl shadow-xs transition-transform transform hover:scale-110 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Caption & Metadata Footer */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                    {/* Caption / Editable Input */}
                    {isEditing ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editingCaption}
                          onChange={(e) => setEditingCaption(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveCaption(photo.id);
                            if (e.key === "Escape") setEditingPhotoId(null);
                          }}
                          autoFocus
                          className="flex-1 h-8 px-2 text-xs font-normal border border-blue-400 rounded-lg focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveCaption(photo.id)}
                          className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingPhotoId(null)}
                          className="p-1.5 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="text-xs sm:text-sm font-normal text-slate-800 line-clamp-2 cursor-pointer hover:text-blue-600"
                          onClick={() => {
                            setEditingPhotoId(photo.id);
                            setEditingCaption(photo.caption || "");
                          }}
                          title="ক্যাপশন পরিবর্তন করতে ক্লিক করুন"
                        >
                          {photo.caption || stageMeta.title}
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPhotoId(photo.id);
                            setEditingCaption(photo.caption || "");
                          }}
                          title="ক্যাপশন পরিবর্তন"
                          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-blue-600 transition-opacity p-0.5 cursor-pointer shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 4. LIGHTBOX / FULLSCREEN PREVIEW MODAL (Portal above Navbar)  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {typeof document !== "undefined" &&
        lightboxIndex !== null &&
        filteredPhotos[lightboxIndex] &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] bg-slate-950/92 backdrop-blur-sm flex flex-col no-print"
            onClick={closeLightbox}
          >
            {/* Top Bar with Info & Controls (Always above zoomed image) */}
            <div
              className="relative z-30 h-16 px-4 sm:px-6 bg-slate-900/90 border-b border-white/15 flex items-center justify-between text-white shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs sm:text-sm font-normal bg-white/15 px-3 py-1 rounded-lg shrink-0">
                  {toBanglaDigits(lightboxIndex + 1)} / {toBanglaDigits(filteredPhotos.length)}
                </span>
                <span className="text-sm sm:text-base font-normal text-slate-200 truncate max-w-[180px] sm:max-w-[420px]">
                  {filteredPhotos[lightboxIndex].caption ||
                    STAGE_LABELS[filteredPhotos[lightboxIndex].stage]?.title}
                </span>
              </div>

              {/* Action Tools & Prominent Close (X) Button */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.25, 3))}
                  title="বড় করুন (Zoom In)"
                  className="p-2 text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.25, 0.5))}
                  title="ছোট করুন (Zoom Out)"
                  className="p-2 text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  title="ঘোরান (Rotate)"
                  className="p-2 text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors"
                >
                  <RotateCw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadImage(filteredPhotos[lightboxIndex])}
                  title="ডাউনলোড"
                  className="p-2 text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPhotoToDelete(filteredPhotos[lightboxIndex])}
                  title="মুছে ফেলুন"
                  className="p-2 text-red-400 hover:text-red-300 bg-red-500/15 hover:bg-red-500/25 rounded-xl cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Prominent Cross / Close Button */}
                <button
                  type="button"
                  onClick={closeLightbox}
                  title="বন্ধ করুন (Esc)"
                  aria-label="প্রিভিউ বন্ধ করুন"
                  className="flex items-center gap-1.5 px-3.5 py-2 ml-2 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-md cursor-pointer transition-colors text-xs sm:text-sm font-normal"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span>বন্ধ করুন</span>
                </button>
              </div>
            </div>

            {/* Central Image Viewer */}
            <div className="flex-1 relative flex items-center justify-center p-4 overflow-hidden select-none">
              {/* Prev Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  title="পূর্ববর্তী ছবি"
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 rounded-2xl shadow-lg transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}

              {/* Current Image */}
              <div
                className="max-w-full max-h-full flex items-center justify-center transition-transform duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={filteredPhotos[lightboxIndex].url}
                  alt={filteredPhotos[lightboxIndex].caption || "প্রকল্প ছবি"}
                  style={{
                    transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                    maxHeight: "80vh",
                    maxWidth: "90vw",
                    objectFit: "contain",
                  }}
                  className="rounded-lg shadow-2xl transition-all"
                />
              </div>

              {/* Next Button */}
              {filteredPhotos.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  title="পরবর্তী ছবি"
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3 bg-slate-900/80 hover:bg-slate-800 text-white border border-white/15 rounded-2xl shadow-lg transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Bottom Bar: Stage Label Only */}
            <div
              className="relative z-30 h-11 px-6 bg-slate-900/90 border-t border-white/15 flex items-center justify-center text-xs sm:text-sm text-slate-300 font-normal shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <span>{STAGE_LABELS[filteredPhotos[lightboxIndex].stage]?.title}</span>
            </div>
          </div>,
          document.body
        )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 5. DELETE CONFIRMATION MODAL                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      {typeof document !== "undefined" &&
        photoToDelete &&
        createPortal(
          <div className="fixed inset-0 z-[10000] bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 no-print">
            <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-3 text-red-600">
                <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Trash2 className="w-5 h-5" />
                </div>
                <h4 className="text-base font-normal text-slate-900">
                  ছবি ডিলিট করতে চান?
                </h4>
              </div>

              <p className="text-xs sm:text-sm font-normal text-slate-600">
                এই প্রকল্পটি থেকে ছবিটি মুছে ফেলা হবে। আপনি কি নিশ্চিত?
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setPhotoToDelete(null)}
                  className="px-3.5 py-1.5 text-xs sm:text-sm font-normal text-slate-700 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeletePhoto}
                  className="px-4 py-1.5 text-xs sm:text-sm font-normal text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>হ্যাঁ, ডিলিট করুন</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* 6. OFFICIAL PRINTABLE PHOTO REPORT SHEET (প্রিন্ট টেমপ্লেট) */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div id="printable-template-document" className="print:block hidden bg-white">
        <style dangerouslySetInnerHTML={{
          __html: `
            @page {
              size: A4 portrait;
              margin: 12mm 15mm 12mm 15mm;
            }
            @media print {
              body {
                background: white !important;
                color: #000 !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `
        }} />

        <div className="space-y-4 text-black text-center font-normal">
          {/* Header */}
          <div className="border-b-2 border-black pb-3">
            <h2 className="text-lg font-normal">গণপ্রজাতন্ত্রী বাংলাদেশ সরকার</h2>
            <h1 className="text-xl font-normal mt-0.5">
              {data.unionName || "০৮ নং বাসুদেবপুর ইউনিয়ন পরিষদ"}
            </h1>
            <p className="text-sm font-normal text-slate-700">
              উপজেলা: {data.upazila || "গোদাগাড়ী"}, জেলা: {data.district || "রাজশাহী"}
            </p>
            <div className="mt-2 inline-block px-4 py-1 border border-black rounded-md text-base font-normal">
              উন্নয়ন প্রকল্পের স্থিরচিত্র প্রতিবেদন (ফটোগ্রাফিক অ্যালবাম)
            </div>
          </div>

          {/* Project Details Banner */}
          <div className="text-left text-sm border border-black p-3 rounded space-y-1 bg-slate-50/50">
            <p><span className="font-normal">প্রকল্পের নাম:</span> {data.projectName}</p>
            <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
              <p><span>কোড:</span> {data.projectCode}</p>
              <p><span>ওয়ার্ড:</span> {toBanglaDigits(data.wardNo)}</p>
              <p><span>অর্থবছর:</span> {toBanglaDigits(data.fiscalYear)}</p>
            </div>
          </div>

          {/* Photo Grid (2x3 or 2x2) */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            {photos.slice(0, 6).map((photo, i) => (
              <div key={photo.id} className="border border-black p-2 rounded flex flex-col items-center">
                <div className="w-full h-44 overflow-hidden flex items-center justify-center bg-slate-100">
                  <img
                    src={photo.url}
                    alt={photo.caption || "ছবি"}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div className="mt-2 text-center text-xs font-normal">
                  <span className="inline-block px-2 py-0.5 border border-black text-[11px] rounded mb-1">
                    {STAGE_LABELS[photo.stage]?.title}
                  </span>
                  <p className="font-normal">{photo.caption || `ছবি নং- ${toBanglaDigits(i + 1)}`}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Signatures at bottom */}
          <div className="grid grid-cols-4 gap-4 pt-12 text-xs text-center border-t border-black mt-8">
            <div>
              <p className="pt-2 border-t border-dotted border-black">সভাপতি</p>
              <p className="text-[11px] text-slate-600">ওয়ার্ড কমিটি</p>
            </div>
            <div>
              <p className="pt-2 border-t border-dotted border-black">ইউপি সচিব</p>
              <p className="text-[11px] text-slate-600">{data.unionName}</p>
            </div>
            <div>
              <p className="pt-2 border-t border-dotted border-black">উপ-সহকারী প্রকৌশলী</p>
              <p className="text-[11px] text-slate-600">এলজিইডি</p>
            </div>
            <div>
              <p className="pt-2 border-t border-dotted border-black">চেয়ারম্যান</p>
              <p className="text-[11px] text-slate-600">{data.unionName}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

