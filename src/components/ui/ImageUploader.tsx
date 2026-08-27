"use client";

import { useCallback, useId, useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { ACCEPTED_IMAGE_TYPES, prepareImage, type PreparedImage } from "@/lib/image";

interface ImageUploaderProps {
  onReady: (image: PreparedImage) => void;
  disabled?: boolean;
  title?: string;
  hint?: string;
  icon?: string;
  className?: string;
  /** Tuỳ chọn nén ảnh (vd Chỉ tay dùng maxEdge nhỏ hơn cho AI phản hồi nhanh). */
  prepareOptions?: { maxEdge?: number; quality?: number };
}

/**
 * Khu vực kéo–thả / chọn ảnh dùng chung cho Chỉ tay và Nốt ruồi.
 * Ảnh được thu nhỏ + nén ngay trên máy trước khi trả về qua `onReady`.
 */
export default function ImageUploader({
  onReady,
  disabled = false,
  title = "Tải ảnh lên",
  hint = "Kéo thả ảnh vào đây, hoặc nhấn để chọn · JPG, PNG, WebP (≤ 12MB)",
  icon = "add_photo_alternate",
  className = "",
  prepareOptions,
}: ImageUploaderProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File | undefined) => {
      if (!file || disabled) return;
      setError(null);
      if (!file.type.startsWith("image/")) {
        setError("Tệp không phải ảnh. Vui lòng chọn JPG, PNG hoặc WebP.");
        return;
      }
      setBusy(true);
      try {
        const prepared = await prepareImage(file, prepareOptions);
        onReady(prepared);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Không xử lý được ảnh này.");
      } finally {
        setBusy(false);
      }
    },
    [disabled, onReady, prepareOptions],
  );

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-busy={busy}
        onClick={() => !disabled && !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled && !busy) {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handleFile(e.dataTransfer.files?.[0]);
        }}
        className={`group relative flex h-full min-h-[280px] w-full flex-col items-center justify-center gap-5 overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-all duration-500 ${
          disabled
            ? "cursor-not-allowed border-white/10 opacity-50"
            : "cursor-pointer border-outline-variant hover:border-gold/60 focus-visible:border-gold focus-visible:outline-none"
        } ${dragging ? "scale-[1.01] border-gold bg-gold/[0.07]" : "bg-surface-container-lowest/40"}`}
      >
        {/* halo động */}
        <div className="pointer-events-none absolute -inset-24 bg-gold/[0.06] blur-3xl opacity-0 transition-opacity duration-700 group-hover:opacity-100" />
        <div
          className={`relative flex h-24 w-24 items-center justify-center rounded-full border transition-all duration-500 ${
            dragging ? "border-gold text-gold" : "border-outline-variant text-on-surface-variant group-hover:border-gold/50 group-hover:text-gold"
          }`}
        >
          <span className="absolute inset-0 rounded-full border border-gold/10 motion-safe:animate-slow-spin" />
          {busy ? (
            <Icon name="progress_activity" className="animate-spin text-3xl text-gold" />
          ) : (
            <Icon name={icon} weight={200} className="text-4xl" />
          )}
        </div>

        <div className="relative">
          <h3 className="font-headline-md text-headline-md text-white">
            {busy ? "Đang xử lý ảnh…" : title}
          </h3>
          <p className="mx-auto mt-2 max-w-sm font-body-md text-body-md text-on-surface-variant">{hint}</p>
        </div>

        {!disabled && !busy && (
          <div className="relative flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold transition-shadow duration-300 group-hover:shadow-[0_0_24px_rgba(212,175,55,0.35)]">
              Chọn ảnh
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                cameraRef.current?.click();
              }}
              className="flex items-center gap-2 rounded-sm border border-white/20 px-5 py-2.5 font-label-caps text-label-caps text-on-surface transition-colors hover:border-gold/50 hover:text-gold sm:hidden"
            >
              <Icon name="photo_camera" className="text-[16px]" />
              Chụp ảnh
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 flex items-start gap-2 font-body-md text-sm text-error motion-safe:animate-[fade-in-up_0.3s_ease-out]">
          <Icon name="error" className="mt-0.5 text-[16px] shrink-0" />
          {error}
        </p>
      )}

      <input
        id={inputId}
        ref={inputRef}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => void handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
