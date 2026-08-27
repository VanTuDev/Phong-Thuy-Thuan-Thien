/** Tiện ích xử lý ảnh phía client trước khi gửi lên API. */

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
export const MAX_UPLOAD_BYTES = 12 * 1024 * 1024;

export interface PreparedImage {
  /** Data URL đã nén (image/jpeg) — gửi thẳng lên POST /readings/* */
  dataUrl: string;
  width: number;
  height: number;
  /** Kích thước xấp xỉ của payload sau nén (bytes) */
  approxBytes: number;
}

/**
 * Đọc file ảnh, xoay theo EXIF (trình duyệt tự làm khi vẽ lên canvas từ
 * createImageBitmap với imageOrientation), thu nhỏ về tối đa `maxEdge` px và
 * xuất JPEG chất lượng `quality`. Giảm mạnh dung lượng để upload nhanh trên 3G/4G.
 */
export async function prepareImage(
  file: File,
  { maxEdge = 1600, quality = 0.85 }: { maxEdge?: number; quality?: number } = {},
): Promise<PreparedImage> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("Ảnh vượt quá 12MB. Vui lòng chọn ảnh nhỏ hơn hoặc chụp ở độ phân giải thấp hơn.");
  }

  const bitmap = await loadBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Trình duyệt không hỗ trợ xử lý ảnh (canvas).");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return {
    dataUrl,
    width,
    height,
    approxBytes: Math.round((dataUrl.length - "data:image/jpeg;base64,".length) * 0.75),
  };
}

async function loadBitmap(file: File): Promise<ImageBitmap & { close?: () => void }> {
  try {
    return (await createImageBitmap(file, { imageOrientation: "from-image" as ImageOrientation })) as ImageBitmap & {
      close?: () => void;
    };
  } catch {
    // Fallback cho trình duyệt cũ / HEIC không hỗ trợ
    const url = URL.createObjectURL(file);
    try {
      const img = await new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("Không đọc được ảnh. Thử định dạng JPG hoặc PNG."));
        el.src = url;
      });
      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext("2d")!.drawImage(img, 0, 0);
      return (await createImageBitmap(canvas)) as ImageBitmap & { close?: () => void };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}
