import imageCompression from "browser-image-compression";
import { toBanglaDigits } from "./banglaUtils";

export interface CompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  initialQuality?: number;
  useWebWorker?: boolean;
}

/**
 * Compression options inspired by sahitya-dhara-UI:
 * Target size under 0.6MB, max 1600px width/height, 75% initial quality,
 * running in non-blocking web worker.
 */
export const DEFAULT_COMPRESSION_OPTIONS: CompressionOptions = {
  maxSizeMB: 0.6,
  maxWidthOrHeight: 1600,
  initialQuality: 0.75,
  useWebWorker: true,
};

export interface CompressionResult {
  compressedFile: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  reductionPercentage: number;
}

/**
 * Compress an image file using browser-image-compression.
 * Returns the compressed file, dataUrl, and size metrics.
 */
export async function compressAndProcessImage(
  file: File,
  customOptions?: Partial<CompressionOptions>,
  onProgress?: (progressPercent: number) => void
): Promise<CompressionResult> {
  const options: CompressionOptions = {
    ...DEFAULT_COMPRESSION_OPTIONS,
    ...customOptions,
  };

  const originalSize = file.size;

  let compressedBlob: Blob = file;
  if (file.type.startsWith("image/")) {
    try {
      compressedBlob = await imageCompression(file, {
        ...options,
        onProgress: onProgress ? (p: number) => onProgress(Math.round(p)) : undefined,
      });
    } catch (err) {
      console.warn("Image compression fallback to original file:", err);
      compressedBlob = file;
    }
  }

  const compressedFile = new File([compressedBlob], file.name, {
    type: compressedBlob.type || file.type || "image/jpeg",
    lastModified: Date.now(),
  });

  const dataUrl = await fileToDataUrl(compressedFile);
  const compressedSize = compressedFile.size;
  const reductionPercentage =
    originalSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

  return {
    compressedFile,
    dataUrl,
    originalSize,
    compressedSize,
    reductionPercentage,
  };
}

/**
 * Helper to convert File or Blob to base64 Data URL.
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Human-readable file size in Bangla (KB / MB).
 */
export function formatBanglaFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "০ KB";
  if (bytes < 1024) {
    return `${toBanglaDigits(bytes)} B`;
  }
  if (bytes < 1024 * 1024) {
    const kb = Math.round(bytes / 1024);
    return `${toBanglaDigits(kb)} KB`;
  }
  const mb = (bytes / (1024 * 1024)).toFixed(1);
  return `${toBanglaDigits(mb)} MB`;
}

