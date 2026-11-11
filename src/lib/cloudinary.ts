import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary server-side
cloudinary.config({
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    "",
  api_key:
    process.env.CLOUDINARY_API_KEY ||
    process.env.CLOUDINARY_PRESET_KEY ||
    "",
  api_secret:
    process.env.CLOUDINARY_SECRET_KEY ||
    "",
  secure: true,
});

export { cloudinary };

/**
 * Extract Cloudinary public_id from secure URL.
 * Handles both flat and folder structures:
 * e.g. https://res.cloudinary.com/demo/image/upload/v12345/folder/sample.jpg -> folder/sample
 */
export function getPublicIdFromUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  if (!url.includes("cloudinary.com")) return null;

  try {
    const uploadIndex = url.indexOf("/upload/");
    if (uploadIndex === -1) return null;

    let pathAfterUpload = url.substring(uploadIndex + "/upload/".length);
    // Strip version tag (e.g. v1793372646/)
    pathAfterUpload = pathAfterUpload.replace(/^v\d+\//, "");

    // Strip extension (.jpg, .png, etc.)
    const dotIndex = pathAfterUpload.lastIndexOf(".");
    if (dotIndex !== -1) {
      pathAfterUpload = pathAfterUpload.substring(0, dotIndex);
    }

    return pathAfterUpload || null;
  } catch {
    return null;
  }
}

/**
 * Delete image from Cloudinary storage.
 */
export async function deleteFromCloudinary(
  publicIdOrUrl: string
): Promise<{ success: boolean; result?: string; error?: string }> {
  try {
    const cloudName =
      process.env.CLOUDINARY_CLOUD_NAME ||
      process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    if (!cloudName || cloudName === "your_cloud_name_here") {
      return { success: false, error: "Cloudinary credentials not configured" };
    }

    const publicId = publicIdOrUrl.startsWith("http")
      ? getPublicIdFromUrl(publicIdOrUrl)
      : publicIdOrUrl;

    if (!publicId) {
      return { success: false, error: "Invalid Cloudinary public ID" };
    }

    const res = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    return {
      success: res.result === "ok" || res.result === "not found",
      result: res.result,
    };
  } catch (err: any) {
    console.error("Cloudinary destroy error:", err);
    return {
      success: false,
      error: err?.message || "Failed to delete from Cloudinary",
    };
  }
}

