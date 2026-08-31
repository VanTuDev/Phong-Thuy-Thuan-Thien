"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ImageUploader from "@/components/ui/ImageUploader";
import EngineBadge from "@/components/ui/EngineBadge";
import { ApiError } from "@/lib/api";
import {
  readings,
  type PalmIntake,
  type PalmObservation,
  type PalmResult,
  type Reading,
} from "@/lib/endpoints";
import PalmIntakeForm from "@/components/sections/chi-tay/PalmIntakeForm";
import { handLabel } from "@/lib/palmRegions";
import HandMolePanel from "@/components/sections/chi-tay/HandMolePanel";
import ReadingFollowupChat from "@/components/sections/chi-tay/ReadingFollowupChat";
import type { PreparedImage } from "@/lib/image";
import {
  catmullRom,
  detectPalm,
  loadHandLandmarker,
  loadImageElement,
  resamplePolyline,
  HAND_CONNECTIONS,
  type PalmDetection,
  type PalmLineKey,
  type Pt,
} from "@/lib/handDetect";
import { refineLinesToCrease } from "@/lib/palmCrease";
import PalmLineEditor, { PALM_LINE_COLOR } from "@/components/sections/chi-tay/PalmLineEditor";
import PalmMetricsPanel from "@/components/sections/chi-tay/PalmMetricsPanel";
import { useSession } from "@/components/session/SessionProvider";

/** Số điểm kéo trên mỗi đường khi chỉnh — ít điểm cho dễ căn chỉnh. */
const EDIT_HANDLES = 4;
const LINE_KEYS: PalmLineKey[] = ["path-life", "path-head", "path-heart"];

/** Vị trí đường mặc định khi người dùng tự vẽ từ đầu (không có kết quả dò). */
const MANUAL_START: Record<PalmLineKey, Pt[]> = {
  "path-heart": [
    [0.28, 0.34],
    [0.45, 0.29],
    [0.63, 0.29],
    [0.8, 0.34],
  ],
  "path-head": [
    [0.28, 0.46],
    [0.45, 0.48],
    [0.63, 0.5],
    [0.78, 0.53],
  ],
  "path-life": [
    [0.34, 0.4],
    [0.29, 0.56],
    [0.32, 0.72],
    [0.42, 0.84],
  ],
};

type Phase = "empty" | "preview" | "scanning" | "done" | "error";
type ErrorKind = "not-palm" | "system";

const LINE_LABEL: Record<string, string> = {
  "path-life": "Đường gia đình",
  "path-head": "Đường tình duyên",
  "path-heart": "Đường công danh sự nghiệp",
};

export default function PalmScanWorkspace() {
  const { isLoggedIn, wallet, setWallet, refreshWallet } = useSession();
  const [phase, setPhase] = useState<Phase>("empty");
  const [intake, setIntake] = useState<PalmIntake | null>(null);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorKind, setErrorKind] = useState<ErrorKind>("system");

  const [checking, setChecking] = useState(false);
  const [detection, setDetection] = useState<PalmDetection | null>(null);
  const [detectorDown, setDetectorDown] = useState(false);

  // Chế độ luận giải: "ai" = AI đọc sâu (MẶC ĐỊNH, ưu tiên) · "manual" = tự chỉnh đường
  const [readMode, setReadMode] = useState<"manual" | "ai">("ai");

  // Chỉnh / đồ lại đường chỉ tay
  const [editMode, setEditMode] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [workLines, setWorkLines] = useState<Record<PalmLineKey, Pt[]> | null>(null);
  const [editedIds, setEditedIds] = useState<Set<PalmLineKey>>(new Set());
  const [redraw, setRedraw] = useState<PalmLineKey | null>(null);

  const canScan = isLoggedIn && wallet.chiTay > 0;
  const result = reading?.result as PalmResult | undefined;
  const observation = reading?.observation ?? null;
  // AI đọc sâu: Gemini tự xác thực ảnh → không cần MediaPipe nhận diện xong mới cho chạy.
  const canProceed = readMode === "ai" || detection?.ok || detectorDown || manualMode;

  // Khởi tạo bản nháp đường khi có kết quả dò (hoặc khi vào chế độ tự vẽ)
  useEffect(() => {
    if (workLines) return;
    if (manualMode) {
      setWorkLines({
        "path-life": MANUAL_START["path-life"],
        "path-head": MANUAL_START["path-head"],
        "path-heart": MANUAL_START["path-heart"],
      });
    } else if (detection?.ok && detection.anchors) {
      const a = detection.anchors;
      setWorkLines({
        "path-life": resamplePolyline(a["path-life"], EDIT_HANDLES),
        "path-head": resamplePolyline(a["path-head"], EDIT_HANDLES),
        "path-heart": resamplePolyline(a["path-heart"], EDIT_HANDLES),
      });
    }
  }, [manualMode, detection, workLines]);

  // Nạp sẵn bộ nhận diện bàn tay khi vào trang → lúc chọn ảnh phản hồi tức thì.
  useEffect(() => {
    if (isLoggedIn && canScan) void loadHandLandmarker().catch(() => setDetectorDown(true));
  }, [isLoggedIn, canScan]);

  const reset = () => {
    setPhase("empty");
    setImage(null);
    setReading(null);
    setError(null);
    setDetection(null);
    setChecking(false);
    setEditMode(false);
    setManualMode(false);
    setWorkLines(null);
    setEditedIds(new Set());
    setRedraw(null);
    setReadMode("ai"); // mỗi ảnh mới bắt đầu ở chế độ AI (ưu tiên)
  };

  const startManual = () => {
    setReadMode("manual");
    setManualMode(true);
    setWorkLines(null); // effect sẽ nạp lại MANUAL_START
    setEditedIds(new Set());
    setEditMode(true);
    setError(null);
    setPhase("preview");
  };

  const setLine = (id: PalmLineKey, pts: Pt[]) => {
    setWorkLines((prev) => (prev ? { ...prev, [id]: pts } : prev));
    setEditedIds((prev) => new Set(prev).add(id));
  };

  const resetLine = (id: PalmLineKey) => {
    setRedraw(null);
    const src =
      manualMode || !detection?.anchors
        ? MANUAL_START[id]
        : resamplePolyline(detection.anchors[id], EDIT_HANDLES);
    setWorkLines((prev) => (prev ? { ...prev, [id]: src } : prev));
    setEditedIds((prev) => {
      const n = new Set(prev);
      n.delete(id);
      return n;
    });
  };

  const appendRedrawPoint = (pt: Pt) => {
    if (!redraw) return;
    setWorkLines((prev) => (prev ? { ...prev, [redraw]: [...(prev[redraw] ?? []), pt] } : prev));
  };

  const finishRedraw = () => {
    if (redraw) {
      const pts = workLines?.[redraw] ?? [];
      if (pts.length >= 3) {
        setLine(redraw, resamplePolyline(pts, EDIT_HANDLES));
      } else {
        resetLine(redraw);
      }
    }
    setRedraw(null);
  };

  const runCheck = useCallback(async (img: PreparedImage) => {
    setChecking(true);
    setError(null);
    setDetection(null);
    try {
      const el = await loadImageElement(img.dataUrl);
      const d = await detectPalm(el);
      if (d.ok) {
        setDetection(d);
      } else if (d.reason === "load-failed") {
        // Hạ tầng lỗi → không chặn, để Gemini tự xác thực bàn tay.
        setDetectorDown(true);
      } else {
        setErrorKind("not-palm");
        setError(d.message ?? "Ảnh chưa hợp lệ.");
        setPhase("error");
      }
    } catch {
      setDetectorDown(true);
    } finally {
      setChecking(false);
    }
  }, []);

  /**
   * Sau khi Gemini dò thô 3 đường: kéo chúng về đúng nếp gấp thật trên ảnh (xử lý
   * ảnh trên máy), rồi ghi lại (source → "cv"). Không đụng đường người dùng tự vẽ.
   */
  const refineAiLines = async (rd: Reading): Promise<Reading> => {
    if (!image || rd.type !== "chi-tay") return rd;
    const res = rd.result as PalmResult | null;
    const aiLines = (res?.lines ?? []).filter(
      (l): l is typeof l & { points: [number, number][] } =>
        l.source === "ai" && Array.isArray(l.points) && l.points.length >= 3,
    );
    if (!aiLines.length) return rd;
    try {
      const el = await loadImageElement(image.dataUrl);
      const input: Record<string, Pt[]> = {};
      for (const l of aiLines) input[l.id] = l.points;
      const snapped = refineLinesToCrease(el, input, detection?.landmarks ?? null);

      const nextLines = (res?.lines ?? []).map((l) => {
        const s = snapped[l.id];
        return s?.traced ? { ...l, points: s.points, source: "cv" as const } : l;
      });
      const changed = nextLines.filter(
        (l, i) => l.source === "cv" && l !== (res?.lines ?? [])[i],
      );
      if (!changed.length) return rd;

      const patched: Reading = { ...rd, result: { ...(res as PalmResult), lines: nextLines } };
      void readings
        .updateLines(
          rd.id,
          changed.map((l) => ({ id: l.id, points: l.points as [number, number][] })),
        )
        .catch(() => undefined);
      return patched;
    } catch {
      return rd;
    }
  };

  const analyze = async () => {
    if (!image) return;
    if (redraw) finishRedraw();
    setPhase("scanning");
    setError(null);
    try {
      let hint: Parameters<typeof readings.palm>[1];
      if (readMode === "ai") {
        // AI đọc sâu: chỉ đưa điểm mốc + số đo, KHÔNG gửi đường tự chỉnh — để Gemini tự dò.
        hint = {
          landmarks: detection?.landmarks,
          metrics: detection?.metrics,
          fingersCropped: detection?.fingersCropped,
          mode: "ai",
        };
      } else if (workLines) {
        // Người dùng đã xem/chỉnh: gửi bản nháp (làm mượt) làm nguồn chính.
        const anchors: Record<string, Pt[]> = {};
        for (const id of LINE_KEYS) anchors[id] = catmullRom(workLines[id], 3);
        const edited = [...editedIds];
        hint = {
          landmarks: detection?.landmarks,
          anchors,
          userDrawn: manualMode ? LINE_KEYS : edited,
          creaseTraced:
            !manualMode && detection?.traced
              ? LINE_KEYS.filter((id) => detection.traced?.[id] && !editedIds.has(id))
              : undefined,
          metrics: detection?.metrics,
          fingersCropped: detection?.fingersCropped,
        };
      } else if (detection?.ok) {
        hint = {
          landmarks: detection.landmarks,
          anchors: detection.anchors,
          creaseTraced: detection.traced
            ? LINE_KEYS.filter((id) => detection.traced?.[id])
            : undefined,
          metrics: detection.metrics,
          fingersCropped: detection.fingersCropped,
        };
      }
      if (intake) hint = { ...(hint ?? {}), intake };
      const res = await readings.palm(image.dataUrl, hint);
      setReading(res.reading);
      setWallet({ ...wallet, chiTay: res.remaining });
      setPhase("done");
      // Chế độ thủ công: Gemini dò thô → bám nếp gấp THẬT trên ảnh (xử lý phía trình duyệt).
      // Chế độ AI đọc sâu: không vẽ đường lên ảnh nên bỏ qua bước này.
      if (readMode === "manual") void refineAiLines(res.reading).then((rd) => setReading(rd));
    } catch (err) {
      void refreshWallet(); // BE hoàn lượt khi thất bại
      if (err instanceof ApiError && err.status === 422) {
        setErrorKind("not-palm");
        setError(err.message);
      } else {
        setErrorKind("system");
        setError(err instanceof ApiError ? err.message : "Không thể luận giải. Vui lòng thử lại.");
      }
      setPhase("error");
    }
  };

  const readyToScan = phase === "preview" && !checking && canProceed && !redraw;

  return (
    <>
      {/* ── Cột trái: ảnh ─────────────────────────────────────────────── */}
      <div className="lg:col-span-7">
        <div className="relative flex min-h-[420px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low">
          {!isLoggedIn && <Gate kind="login" />}
          {isLoggedIn && !canScan && phase === "empty" && <Gate kind="credits" />}

          {isLoggedIn && canScan && phase === "empty" && !intake && (
            <PalmIntakeForm initial={intake} onComplete={(v) => setIntake(v)} />
          )}

          {isLoggedIn && canScan && phase === "empty" && intake && (
            <div className="flex flex-1 flex-col p-4">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-surface-container-lowest/60 px-3.5 py-2.5">
                <span className="flex items-center gap-2 font-body-md text-sm text-on-surface-variant">
                  <Icon name="person" className="text-[16px] text-gold/70" />
                  {intake.name} · tay {handLabel(intake.hand)}
                  {intake.handMoleMode === "search"
                    ? " · nốt ruồi: AI tìm"
                    : intake.handMoles.length > 0
                      ? ` · nốt ruồi ô ${intake.handMoles.join(", ")}`
                      : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setIntake(null)}
                  className="press flex items-center gap-1 rounded px-2 py-1 font-data-mono text-[11px] text-on-surface-variant hover:bg-white/5 hover:text-white"
                >
                  <Icon name="edit" className="text-[13px]" />
                  Sửa
                </button>
              </div>
              <ImageUploader
                onReady={(img) => {
                  setImage(img);
                  setPhase("preview");
                  void runCheck(img);
                }}
                prepareOptions={{ maxEdge: 1024, quality: 0.82 }}
                title={`Tải ảnh lòng bàn tay ${handLabel(intake.hand)}`}
                hint={`Chụp lòng bàn tay ${handLabel(intake.hand)}: xoè rộng 5 ngón, hướng thẳng vào máy ảnh · đủ sáng · thấy trọn bàn tay và cổ tay`}
                icon="pan_tool"
                className="flex-1"
              />
            </div>
          )}

          {image && phase !== "empty" && (
            <div className="relative flex flex-1 flex-col items-center justify-center p-3">
              <div
                className="relative w-full overflow-hidden rounded-xl"
                style={{ aspectRatio: `${image.width} / ${image.height}`, maxHeight: "66vh" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.dataUrl}
                  alt="Ảnh lòng bàn tay đã tải lên"
                  className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${
                    phase === "scanning" || checking ? "opacity-80" : "opacity-95"
                  }`}
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />

                {checking && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container/80 px-4 py-2 font-data-mono text-data-mono text-on-surface backdrop-blur-md">
                      <Icon name="progress_activity" className="animate-spin text-[16px] text-gold" />
                      Đang tìm bàn tay…
                    </span>
                  </div>
                )}

                {phase === "scanning" && (
                  <>
                    <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_15px_5px_rgba(212,175,55,0.25)] motion-safe:animate-scan" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="rounded-full border border-white/10 bg-surface-container/80 px-4 py-2 font-data-mono text-data-mono text-on-surface backdrop-blur-md">
                        <span className="mr-2 inline-block h-2 w-2 animate-pulse rounded-full bg-gold" />
                        {readMode === "ai"
                          ? "AI đang đọc kỹ ảnh & luận giải… (20–40 giây)"
                          : "Đang lần theo các đường chỉ tay…"}
                      </span>
                    </div>
                  </>
                )}

                {/* Preview: chỉnh tay / khung bàn tay + 3 đường đã định vị */}
                {phase === "preview" && editMode && workLines && (
                  <PalmLineEditor
                    lines={workLines}
                    onChange={setLine}
                    redraw={redraw}
                    onRedrawAppend={appendRedrawPoint}
                  />
                )}
                {/* Chế độ AI đọc sâu: KHÔNG vẽ đường màu lên ảnh (dễ hiểu lầm là nếp gấp thật) */}
                {phase === "preview" && !editMode && detection?.ok && readMode === "manual" && (
                  <HandPreviewOverlay detection={detection} />
                )}

                {phase === "done" && result && !result.aiDeep && (
                  <PalmLinesOverlay lines={result.lines} />
                )}
              </div>

              {/* Chọn chế độ luận giải */}
              {phase === "preview" && !redraw && (
                <div className="mt-3 w-full">
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      [
                        { key: "ai", icon: "neurology", label: "AI đọc sâu", sub: "Mặc định — AI tự đọc & luận kỹ" },
                        { key: "manual", icon: "draw", label: "Thủ công", sub: "Tự chỉnh đường chỉ tay" },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.key}
                        type="button"
                        onClick={() => {
                          setReadMode(m.key);
                          if (m.key === "ai") setEditMode(false);
                        }}
                        className={`press flex flex-col items-start gap-0.5 rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                          readMode === m.key
                            ? "border-gold/50 bg-gold/10"
                            : "border-white/15 hover:bg-white/5"
                        }`}
                      >
                        <span
                          className={`flex items-center gap-1.5 font-label-caps text-[11px] sm:text-label-caps ${
                            readMode === m.key ? "text-gold" : "text-on-surface"
                          }`}
                        >
                          <Icon name={m.icon} className="text-[15px]" />
                          {m.label}
                        </span>
                        <span className="font-body-md text-[11px] text-on-surface-variant sm:text-xs">
                          {m.sub}
                        </span>
                      </button>
                    ))}
                  </div>
                  {readMode === "ai" && (
                    <p className="mt-1.5 flex items-start gap-1.5 font-body-md text-[11px] text-on-surface-variant sm:text-xs">
                      <Icon name="info" className="mt-px shrink-0 text-[13px] text-gold/60" />
                      AI đọc ảnh, suy nghĩ sâu, nói rõ từng đường chỉ + độ hở/độ dài ngón + bám kho tri
                      thức rồi kết luận. Chậm hơn một chút, vẫn trừ 1 lượt.
                    </p>
                  )}
                </div>
              )}

              <div className="mt-3 flex w-full flex-wrap items-center justify-between gap-3">
                {phase === "done" && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container/80 px-4 py-2 font-data-mono text-data-mono text-on-surface backdrop-blur-md motion-safe:animate-fade-in-up">
                    <span className="h-2 w-2 rounded-full bg-gold animate-pulse" />
                    {result?.aiDeep
                      ? "AI đã đọc kỹ ảnh & luận giải"
                      : result?.lines.some((l) => l.source === "manual")
                        ? "Luận giải theo đường bạn tự đồ"
                        : result?.lines.some((l) => l.source === "cv")
                          ? "Đã bám theo nếp gấp thật trên ảnh"
                          : result?.lines.some((l) => l.source === "anchor")
                            ? "Đã định vị đường chỉ theo bàn tay của bạn"
                            : result?.lines.some((l) => l.source === "ai")
                              ? "AI đã dò được đường chỉ tay"
                              : "Phân tích hoàn tất"}
                  </span>
                )}

                {phase === "preview" && !editMode && detection?.ok && readMode === "manual" && (
                  <span className="flex items-center gap-2 rounded-full border border-wood/30 bg-wood/10 px-3 py-1.5 font-data-mono text-[12px] text-wood motion-safe:animate-fade-in">
                    <Icon name="check_circle" className="text-[14px]" />
                    {detection.traced && Object.values(detection.traced).some(Boolean)
                      ? `Đã bám ${Object.values(detection.traced).filter(Boolean).length}/3 nếp gấp`
                      : "Đã nhận diện bàn tay"}
                  </span>
                )}
                {phase === "preview" && !editMode && !checking && detectorDown && !manualMode && (
                  <span className="flex items-center gap-2 rounded-full border border-white/10 bg-surface-container px-3 py-1.5 font-data-mono text-[12px] text-on-surface-variant">
                    <Icon name="info" className="text-[14px]" />
                    Bỏ qua bước dò cục bộ — AI sẽ tự kiểm tra
                  </span>
                )}
                {phase === "preview" && !editMode && detection?.metrics?.pose &&
                  detection.metrics.pose.quality !== "tốt" && (
                    <span className="flex items-start gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 font-data-mono text-[12px] text-gold/90">
                      <Icon name="report" className="mt-px shrink-0 text-[14px]" />
                      {detection.metrics.pose.issues.join(" · ") || "Tư thế bàn tay chưa lý tưởng"} —
                      vẫn luận giải được, ảnh xoè phẳng sẽ chính xác hơn
                    </span>
                  )}
                {phase === "preview" && editMode && (
                  <span className="flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3 py-1.5 font-data-mono text-[12px] text-gold/90">
                    <Icon name="edit" className="text-[14px]" />
                    {redraw
                      ? `Đang vẽ ${LINE_LABEL[redraw]} — chấm ≥3 điểm dọc đường chỉ`
                      : "Kéo các điểm cho khớp đường chỉ trên tay bạn"}
                  </span>
                )}

                {phase === "preview" && editMode && redraw && (
                  <button
                    type="button"
                    onClick={finishRedraw}
                    className="press flex items-center gap-2 rounded-sm border border-white/20 px-5 py-2.5 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
                  >
                    <Icon name="check" className="text-[16px]" />
                    Xong
                  </button>
                )}

                {phase === "preview" && canProceed && !redraw && readMode === "manual" && (
                  <button
                    type="button"
                    onClick={() => setEditMode((v) => !v)}
                    className={`press flex items-center gap-2 rounded-sm border px-4 py-3 font-label-caps text-label-caps transition-colors ${
                      editMode
                        ? "border-gold/50 bg-gold/10 text-gold"
                        : "border-white/20 text-on-surface hover:bg-white/5"
                    }`}
                  >
                    <Icon name={editMode ? "check" : "edit"} className="text-[16px]" />
                    {editMode ? "Xong chỉnh" : "Chỉnh đường"}
                  </button>
                )}

                {phase === "preview" && !redraw && (
                  <button
                    type="button"
                    onClick={analyze}
                    disabled={!readyToScan}
                    className="press flex items-center gap-2 rounded-sm bg-gold px-6 py-3 font-label-caps text-label-caps text-on-gold transition-shadow hover:shadow-[0_0_24px_rgba(212,175,55,0.35)] disabled:opacity-40 disabled:hover:shadow-none"
                  >
                    <Icon name={readMode === "ai" ? "neurology" : "auto_awesome"} className="text-[18px]" />
                    {readMode === "ai" ? "Luận giải AI — đọc sâu" : "Bắt đầu luận giải"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={reset}
                  className="press tap-target ml-auto flex items-center justify-center rounded-full border border-white/20 bg-surface-container text-on-surface transition-colors hover:bg-surface-variant"
                  title="Chọn ảnh khác"
                >
                  <Icon name="refresh" className="text-[18px]" />
                </button>
              </div>

              {phase === "preview" && editMode && workLines && (
                <div className="mt-3 grid w-full gap-2 sm:grid-cols-3">
                  {LINE_KEYS.map((id) => (
                    <div
                      key={id}
                      className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-surface-container-lowest/70 px-3 py-2"
                    >
                      <span className="flex items-center gap-2 font-body-md text-sm text-on-surface">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ background: PALM_LINE_COLOR[id] }}
                        />
                        {LINE_LABEL[id]}
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setRedraw(id);
                            setWorkLines((p) => (p ? { ...p, [id]: [] } : p));
                          }}
                          className="press rounded px-2 py-1 font-data-mono text-[11px] text-on-surface-variant hover:bg-white/5 hover:text-white"
                          title={`Vẽ lại ${LINE_LABEL[id]}`}
                        >
                          Vẽ lại
                        </button>
                        <button
                          type="button"
                          onClick={() => resetLine(id)}
                          className="press rounded px-2 py-1 font-data-mono text-[11px] text-on-surface-variant hover:bg-white/5 hover:text-white"
                          title="Đặt lại về tự động"
                        >
                          <Icon name="undo" className="text-[13px]" />
                        </button>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {phase === "preview" && !editMode && (
          <p className="mt-3 text-center font-body-md text-sm text-on-surface-variant">
            {readMode === "ai" ? (
              <>AI sẽ tự đọc ảnh và luận giải kỹ. Mỗi lần luận giải trừ 1 lượt xem Chỉ tay.</>
            ) : (
              <>
                Ảnh được kiểm tra ngay trên máy bạn. Đường chưa khớp? Bấm <b>Chỉnh đường</b> để tự đồ
                lại. Mỗi lần luận giải trừ 1 lượt xem Chỉ tay.
              </>
            )}
          </p>
        )}
      </div>

      {/* ── Cột phải: kết quả ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-unit lg:col-span-5">
        {phase !== "done" && (
          <div className="flex h-full min-h-[420px] flex-col rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8">
            {phase === "error" ? (
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <Icon
                  name={errorKind === "not-palm" ? "pan_tool" : "error"}
                  weight={300}
                  className={`mb-4 text-4xl ${errorKind === "not-palm" ? "text-gold/70" : "text-error"}`}
                />
                <h4 className="font-headline-md text-headline-md text-white">
                  {errorKind === "not-palm" ? "Bàn tay cần được chụp rõ hơn" : "Luận giải chưa hoàn tất"}
                </h4>
                <p className="mt-2 font-body-md text-body-md text-on-surface-variant">{error}</p>
                {errorKind === "not-palm" && (
                  <ul className="mx-auto mt-4 max-w-xs space-y-1.5 text-left font-body-md text-sm text-on-surface-variant">
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 text-[15px] text-gold/70" />
                      Xoè thẳng cả 5 ngón, lòng bàn tay phẳng, hướng vào máy ảnh
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 text-[15px] text-gold/70" />
                      Đưa tay lại gần, lấy trọn bàn tay và cổ tay trong khung
                    </li>
                    <li className="flex gap-2">
                      <Icon name="check" className="mt-0.5 text-[15px] text-gold/70" />
                      Đủ sáng, không loá, nền phía sau tương phản với da tay
                    </li>
                  </ul>
                )}
                <div className="mt-6 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={errorKind === "not-palm" ? reset : analyze}
                    className="press rounded-sm border border-white/20 px-6 py-2.5 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
                  >
                    {errorKind === "not-palm" ? "Chọn ảnh khác" : "Thử lại"}
                  </button>
                  {errorKind === "not-palm" && image && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setReadMode("ai");
                          setEditMode(false);
                          setError(null);
                          setPhase("preview");
                        }}
                        className="press rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold"
                      >
                        Để AI đọc sâu thử ảnh này
                      </button>
                      <button
                        type="button"
                        onClick={startManual}
                        className="press rounded-sm border border-gold/40 px-6 py-2.5 font-label-caps text-label-caps text-gold hover:bg-gold/5"
                      >
                        Đây đúng là lòng bàn tay — tôi tự vẽ
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : phase === "scanning" ? (
              <div className="flex flex-1 items-center">
                <PalmSkeleton />
              </div>
            ) : detection?.metrics ? (
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto pr-1">
                <div className="flex items-center gap-2">
                  <Icon name="back_hand" className="text-[18px] text-gold/70" />
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant">
                    Số đo bàn tay của bạn
                  </h4>
                </div>
                <PalmMetricsPanel metrics={detection.metrics} defaultOpen />
                <p className="font-body-md text-xs text-outline">
                  Bấm <b>Bắt đầu luận giải</b> để AI diễn giải các số đo này cùng đường chỉ tay. Trừ 1 lượt xem Chỉ tay.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-2">
                  <Icon name="auto_awesome" className="text-[18px] text-gold/70" />
                  <h4 className="font-label-caps text-label-caps text-on-surface-variant">Bạn sẽ nhận được</h4>
                </div>
                <ul className="space-y-3">
                  {[
                    { c: "#D4AF37", t: "Nguyên tố bàn tay", d: "Nước · Hỏa · Thổ · Khí" },
                    { c: "#FF5252", t: "Đường gia đình", d: "Cội nguồn & sự gắn kết gia đạo" },
                    { c: "#448AFF", t: "Đường tình duyên", d: "Tình cảm, hôn nhân & bạn đời" },
                    { c: "#FFC107", t: "Đường công danh sự nghiệp", d: "Sự nghiệp, danh vọng & thăng tiến" },
                  ].map((row) => (
                    <li key={row.t} className="flex items-start gap-3 rounded-lg border border-white/5 bg-surface-container-lowest/60 p-3.5">
                      <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: row.c, boxShadow: `0 0 8px ${row.c}66` }} />
                      <div>
                        <p className="font-headline-md text-[17px] text-on-surface">{row.t}</p>
                        <p className="font-body-md text-sm text-on-surface-variant">{row.d}</p>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-auto pt-6 font-body-md text-xs text-outline">
                  Bộ nhận diện bàn tay chạy ngay trên máy bạn: định vị 21 điểm mốc rồi bám các đường
                  chỉ vào đúng nếp gấp trên ảnh, sau đó AI luận giải theo quan sát đó.
                </p>
              </>
            )}
          </div>
        )}

        {phase === "done" && result && (
          <div className="flex h-full flex-col gap-gutter">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low p-6 motion-safe:animate-fade-in-up">
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/5 blur-3xl" />
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-label-caps text-label-caps text-gold/70">Nguyên tố chính</h2>
                <div className="flex items-center gap-2">
                  {result.aiDeep && (
                    <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-label-caps text-[10px] text-gold">
                      <Icon name="neurology" className="text-[12px]" />
                      AI đọc sâu
                    </span>
                  )}
                  <EngineBadge engine={reading!.engine} />
                </div>
              </div>
              <div className="mb-3 flex items-center gap-3 font-headline-lg text-headline-lg text-gold">
                {result.element}
                <Icon name={result.elementIcon} weight={200} className="text-gold/50" />
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{result.elementDescription}</p>
            </div>

            <div className="flex-grow space-y-unit overflow-y-auto pr-1">
              {result.lines.map((line, i) => (
                <div
                  key={line.id}
                  style={{ animationDelay: `${i * 90}ms` }}
                  className="group rounded-xl border border-white/5 bg-surface-container-lowest p-5 transition-colors hover:border-white/20 motion-safe:animate-fade-in-up"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: line.color, boxShadow: `0 0 8px ${line.color}` }}
                      />
                      <h3 className="font-headline-md text-[20px] text-on-surface">{line.title}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {!result.aiDeep && <SourceBadge source={line.source} />}
                      <span className="font-data-mono text-[12px] text-outline">{line.tag}</span>
                    </div>
                  </div>
                  <p className="whitespace-pre-line font-body-md text-sm text-on-surface-variant">{line.description}</p>
                </div>
              ))}

              {result.handNarrative && (
                <div className="rounded-xl border border-gold/20 bg-gold/[0.04] p-5 motion-safe:animate-fade-in-up">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name="back_hand" className="text-[18px] text-gold/70" />
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                      Tổng quan bàn tay — ngón tay &amp; độ hở
                    </h3>
                  </div>
                  <p className="whitespace-pre-line font-body-md text-sm leading-relaxed text-on-surface-variant">
                    {result.handNarrative}
                  </p>
                </div>
              )}

              {result.moleReadings && result.moleReadings.length > 0 && (
                <HandMolePanel readings={result.moleReadings} observed={observation?.moles} />
              )}

              {(!result.moleReadings || result.moleReadings.length === 0) && result.moleNote && (
                <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-surface-container-lowest p-4 motion-safe:animate-fade-in-up">
                  <Icon name="spa" className="mt-0.5 shrink-0 text-[15px] text-gold/50" />
                  <p className="font-body-md text-[13px] leading-relaxed text-on-surface-variant">
                    {result.moleNote}
                  </p>
                </div>
              )}

              {result.fingerNote && (
                <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-5 motion-safe:animate-fade-in-up">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name="back_hand" className="text-[16px] text-gold/70" />
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                      Độ dài &amp; độ hở các ngón tay
                    </h3>
                  </div>
                  <p className="whitespace-pre-line font-body-md text-sm leading-relaxed text-on-surface-variant">
                    {result.fingerNote}
                  </p>
                </div>
              )}

              {result.healthNote && (
                <div className="rounded-xl border border-gold/20 bg-gold/[0.04] p-5 motion-safe:animate-fade-in-up">
                  <div className="mb-2 flex items-center gap-2">
                    <Icon name="health_and_safety" className="text-[16px] text-gold/70" />
                    <h3 className="font-label-caps text-label-caps text-on-surface-variant">
                      Sắc thái bàn tay — sức khỏe &amp; tinh thần
                    </h3>
                  </div>
                  <p className="whitespace-pre-line font-body-md text-sm leading-relaxed text-on-surface-variant">
                    {result.healthNote}
                  </p>
                  <p className="mt-3 font-body-md text-[11px] text-outline">
                    Góc nhìn tướng học, mang tính tham khảo — không thay thế cho việc thăm khám bác sĩ.
                  </p>
                </div>
              )}

              {(observation?.fingers?.visible === false || detection?.fingersCropped) && (
                <div className="flex items-start gap-2.5 rounded-xl border border-gold/25 bg-gold/[0.05] p-4 motion-safe:animate-fade-in-up">
                  <Icon name="crop_free" className="mt-0.5 shrink-0 text-[15px] text-gold/70" />
                  <p className="font-body-md text-[13px] leading-relaxed text-on-surface-variant">
                    Ảnh chưa lấy trọn các ngón tay nên phần luận về độ dài / độ hở ngón tay được bỏ qua.
                    Lần sau hãy chụp thấy đủ cả 5 ngón và cổ tay để luận đầy đủ hơn.
                  </p>
                </div>
              )}

              {observation?.fingers?.visible !== false &&
                !detection?.fingersCropped &&
                (result.hand ?? detection?.metrics) && (
                  <PalmMetricsPanel metrics={(result.hand ?? detection?.metrics)!} />
                )}

              {observation && <ObservationPanel obs={observation} />}

              {reading && (
                <ReadingFollowupChat reading={reading} onUpdated={(r) => setReading(r)} />
              )}

              {(detection?.ok || manualMode) && (
                <button
                  type="button"
                  onClick={() => {
                    // Bắt đầu chỉnh TỪ đường kết quả (đã bám nếp gấp), không phải neo thô.
                    const seed: Partial<Record<PalmLineKey, Pt[]>> = {};
                    for (const id of LINE_KEYS) {
                      const l = result.lines.find((x) => x.id === id);
                      if (l?.points && l.points.length >= 3) {
                        seed[id] = resamplePolyline(l.points as Pt[], EDIT_HANDLES);
                      }
                    }
                    if (Object.keys(seed).length === 3) {
                      setWorkLines(seed as Record<PalmLineKey, Pt[]>);
                      setEditedIds(new Set());
                    }
                    setReading(null);
                    setReadMode("manual");
                    setEditMode(true);
                    setPhase("preview");
                  }}
                  className="press flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-surface-container-lowest/60 py-3 font-body-md text-sm text-on-surface-variant hover:border-white/25 hover:text-white"
                >
                  <Icon name="edit" className="text-[15px]" />
                  {result.aiDeep
                    ? "Muốn tự vẽ đường chỉ tay? Chuyển sang chế độ thủ công (trừ 1 lượt)"
                    : "Đường chưa đúng? Chỉnh lại rồi luận giải lại (trừ 1 lượt)"}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/lich-su"
                className="press flex flex-1 items-center justify-center gap-2 rounded-sm border border-white/20 py-3.5 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
              >
                <Icon name="history" className="text-[16px]" />
                Xem trong lịch sử
              </Link>
              <button
                type="button"
                onClick={reset}
                className="press flex flex-1 items-center justify-center gap-2 rounded-sm bg-gold py-3.5 font-label-caps text-label-caps text-on-gold"
              >
                <Icon name="add_a_photo" className="text-[16px]" />
                Luận giải ảnh khác
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function SourceBadge({ source }: { source?: "manual" | "cv" | "anchor" | "ai" | "template" }) {
  if (source === "manual") {
    return (
      <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/15 px-2 py-0.5 font-data-mono text-[10px] text-gold">
        <Icon name="draw" className="text-[11px]" />
        Bạn vẽ
      </span>
    );
  }
  if (source === "cv") {
    return (
      <span className="flex items-center gap-1 rounded-full border border-wood/40 bg-wood/15 px-2 py-0.5 font-data-mono text-[10px] text-wood">
        <Icon name="gesture" className="text-[11px]" />
        Bám nếp gấp
      </span>
    );
  }
  if (source === "anchor") {
    return (
      <span className="flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 font-data-mono text-[10px] text-on-surface-variant">
        <Icon name="center_focus_strong" className="text-[11px]" />
        Định vị
      </span>
    );
  }
  if (source === "ai") {
    return (
      <span className="flex items-center gap-1 rounded-full border border-gold/30 bg-gold/10 px-2 py-0.5 font-data-mono text-[10px] text-gold/90">
        <Icon name="my_location" className="text-[11px]" />
        AI dò
      </span>
    );
  }
  return null;
}

function Gate({ kind }: { kind: "login" | "credits" }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-surface-container-lowest/50">
        <Icon name={kind === "login" ? "lock" : "bolt"} className="text-3xl text-gold/70" />
      </div>
      <div>
        <h3 className="font-headline-md text-headline-md text-white">
          {kind === "login" ? "Đăng nhập để bắt đầu" : "Bạn đã hết lượt xem Chỉ tay"}
        </h3>
        <p className="mx-auto mt-2 max-w-sm font-body-md text-body-md text-on-surface-variant">
          {kind === "login"
            ? "Đăng nhập bằng Google và nạp lượt xem để AI luận giải lòng bàn tay của bạn."
            : "Nạp thêm lượt để tiếp tục luận giải cùng Thuận Thiên."}
        </p>
      </div>
      <Link
        href={kind === "login" ? "/dang-nhap?next=/phan-tich-chi-tay" : "/nap-luot"}
        className="press rounded-sm bg-gold px-8 py-3 font-label-caps text-label-caps text-on-gold transition-shadow hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >
        {kind === "login" ? "Đăng nhập" : "Nạp lượt xem"}
      </Link>
    </div>
  );
}

/** Đường mẫu cố định — chỉ dùng khi không có cả anchor lẫn điểm AI. */
const TEMPLATE_PATHS: Record<string, string> = {
  "path-life": "M 40,20 Q 32,44 35,66 Q 38,84 46,92",
  "path-head": "M 38,36 Q 56,40 72,46 Q 82,49 88,54",
  "path-heart": "M 22,26 Q 46,17 68,22 Q 82,25 90,30",
};

/** Nối các điểm chuẩn hoá 0..1 thành đường cong mượt trong viewBox 0..100. */
function smoothPath(points: [number, number][], scale = 100): string {
  const p = points.map(([x, y]) => [x * scale, y * scale] as [number, number]);
  if (p.length < 2) return "";
  if (p.length === 2) return `M ${p[0][0]},${p[0][1]} L ${p[1][0]},${p[1][1]}`;
  const mid = (a: [number, number], b: [number, number]): [number, number] => [
    (a[0] + b[0]) / 2,
    (a[1] + b[1]) / 2,
  ];
  let d = `M ${p[0][0]},${p[0][1]} L ${mid(p[0], p[1]).join(",")}`;
  for (let i = 1; i < p.length - 1; i++) {
    const m = mid(p[i], p[i + 1]);
    d += ` Q ${p[i][0]},${p[i][1]} ${m[0]},${m[1]}`;
  }
  const last = p[p.length - 1];
  d += ` L ${last[0]},${last[1]}`;
  return d;
}

/** Preview: khung xương bàn tay MediaPipe + 3 đường đã định vị (mờ). */
function HandPreviewOverlay({ detection }: { detection: PalmDetection }) {
  const lm = detection.landmarks ?? [];
  const anchors = detection.anchors;
  return (
    <svg
      className="palm-overlay pointer-events-none absolute inset-0 h-full w-full motion-safe:animate-fade-in"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {lm.length === 21 &&
        HAND_CONNECTIONS.map(([a, b], i) => (
          <line
            key={i}
            x1={lm[a][0] * 100}
            y1={lm[a][1] * 100}
            x2={lm[b][0] * 100}
            y2={lm[b][1] * 100}
            stroke="#D4AF37"
            strokeOpacity={0.35}
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        ))}
      {lm.map(([x, y], i) => (
        <circle key={i} cx={x * 100} cy={y * 100} r={0.8} fill="#D4AF37" fillOpacity={0.6} />
      ))}
      {anchors &&
        (["path-life", "path-head", "path-heart"] as const).map((id) => {
          const pts = anchors[id];
          if (!pts || pts.length < 2) return null;
          const isTraced = detection.traced?.[id];
          const color =
            id === "path-life" ? "#FF5252" : id === "path-head" ? "#448AFF" : "#FFC107";
          return (
            <path
              key={id}
              d={smoothPath(pts)}
              fill="none"
              stroke={color}
              strokeOpacity={isTraced ? 0.9 : 0.55}
              strokeWidth={isTraced ? 0.9 : 0.7}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={isTraced ? undefined : "2 1.5"}
            />
          );
        })}
    </svg>
  );
}

function PalmLinesOverlay({ lines }: { lines: PalmResult["lines"] }) {
  return (
    <svg
      className="palm-overlay pointer-events-none absolute inset-0 h-full w-full"
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      {lines.map((line, i) => {
        const traced =
          line.points && line.points.length >= 2 ? smoothPath(line.points) : null;
        const d = traced ?? TEMPLATE_PATHS[line.id] ?? TEMPLATE_PATHS["path-head"];
        const delay = i * 0.4;
        return (
          <g key={line.id}>
            <path
              d={d}
              fill="none"
              stroke={line.color}
              strokeOpacity={0.22}
              strokeWidth={traced ? 1.8 : 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `palm-draw 1.6s ${delay}s cubic-bezier(0.22,1,0.36,1) forwards`,
              }}
            />
            <path
              d={d}
              fill="none"
              stroke={line.color}
              strokeWidth={traced ? 0.7 : 0.6}
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength={1}
              style={{
                strokeDasharray: 1,
                strokeDashoffset: 1,
                animation: `palm-draw 1.6s ${delay}s cubic-bezier(0.22,1,0.36,1) forwards`,
              }}
            />
            {traced &&
              line.points!.map(([x, y], j) => (
                <circle
                  key={j}
                  cx={x * 100}
                  cy={y * 100}
                  r={0.7}
                  fill={line.color}
                  style={{
                    opacity: 0,
                    animation: `palm-dot 0.4s ${delay + 0.3 + j * 0.1}s ease-out forwards`,
                  }}
                />
              ))}
          </g>
        );
      })}
      <style>{`
        @keyframes palm-draw { to { stroke-dashoffset: 0 } }
        @keyframes palm-dot { to { opacity: 0.9 } }
        @media (prefers-reduced-motion: reduce) {
          .palm-overlay path { animation: none !important; stroke-dashoffset: 0 !important }
          .palm-overlay circle { animation: none !important; opacity: 0.9 !important }
        }
      `}</style>
    </svg>
  );
}

function ObservationPanel({ obs }: { obs: PalmObservation }) {
  return (
    <details className="group rounded-xl border border-white/5 bg-surface-container-lowest/60 [&_summary::-webkit-details-marker]:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="flex items-center gap-2">
          <Icon name="visibility" className="text-[16px] text-gold/60" />
          <span className="font-label-caps text-label-caps text-on-surface-variant">AI đã quan sát</span>
        </span>
        <Icon
          name="expand_more"
          className="text-[18px] text-outline transition-transform group-open:rotate-180"
        />
      </summary>
      <div className="space-y-3 border-t border-white/5 px-4 pb-4 pt-3">
        <div className="grid grid-cols-2 gap-2">
          <ObsField label="Dáng bàn tay" value={obs.handShape} />
          <ObsField label="Độ rõ ảnh" value={obs.clarity} />
        </div>
        {obs.dominantElementHint && (
          <ObsField label="Thiên hướng nguyên tố" value={obs.dominantElementHint} />
        )}
        {obs.note && <p className="font-body-md text-xs text-outline">{obs.note}</p>}
        <ul className="space-y-2">
          {obs.lines.map((l) => (
            <li
              key={l.id}
              className="rounded-lg border border-white/5 bg-surface-container-lowest/60 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-headline-md text-[15px] text-on-surface">
                  {LINE_LABEL[l.id] ?? l.id}
                </span>
                <span
                  className={`font-data-mono text-[11px] ${
                    l.present ? "text-gold/70" : "text-error/70"
                  }`}
                >
                  {l.present ? "thấy rõ" : "khó thấy"}
                </span>
              </div>
              <p className="mt-1 font-body-md text-xs text-on-surface-variant">
                Độ sâu: {l.depth} · Độ dài: {l.length}
                {l.features.length > 0 && <> · {l.features.join(", ")}</>}
              </p>
            </li>
          ))}
        </ul>
        <p className="font-body-md text-[11px] text-outline">
          Đường chỉ được định vị theo 21 điểm mốc bàn tay; phần luận giải bám theo quan sát này để hạn chế suy diễn.
        </p>
      </div>
    </details>
  );
}

function ObsField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-data-mono text-[10px] uppercase tracking-wide text-outline">{label}</p>
      <p className="font-body-md text-sm text-on-surface">{value || "không rõ"}</p>
    </div>
  );
}

function PalmSkeleton() {
  return (
    <div className="w-full space-y-4">
      <div className="skeleton h-24 w-full rounded-xl" />
      <div className="skeleton h-20 w-full rounded-xl" />
      <div className="skeleton h-20 w-full rounded-xl" />
      <p className="pt-2 font-data-mono text-[12px] text-outline">
        AI đang quan sát ảnh rồi luận giải…
      </p>
    </div>
  );
}
