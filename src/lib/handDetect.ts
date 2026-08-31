/**
 * Dò bàn tay client-side bằng MediaPipe Hands (21 điểm mốc).
 *
 * Dùng để: (1) xác nhận ảnh CÓ lòng bàn tay xoè rõ trước khi gọi API luận giải,
 * (2) neo 3 đường chỉ tay chính theo đúng tỉ lệ & góc xoay bàn tay thật của từng
 * người — thay cho đường mẫu cố định. 3 đường (id giữ nguyên vì đã lưu trong DB):
 * path-life = Đường gia đình (đỏ), path-head = Đường tình duyên (xanh),
 * path-heart = Đường công danh sự nghiệp (vàng).
 *
 * Model + WASM nằm ở /public/mediapipe (tải qua `pnpm setup:mediapipe`).
 * MediaPipe chỉ được import động (browser-only) — module này an toàn cho SSR/test.
 */
import type { HandLandmarker } from "@mediapipe/tasks-vision";
import { refinePalmLines } from "./palmCrease.ts";
import { computeHandMetrics, type HandMetrics } from "./handMetrics.ts";

export type Pt = [number, number]; // toạ độ chuẩn hoá 0..1 trong không gian ảnh

export type PalmLineKey = "path-life" | "path-head" | "path-heart";
export type PalmAnchors = Record<PalmLineKey, Pt[]>;

export type PalmRejectReason = "no-hand" | "too-small" | "closed" | "load-failed";

export interface PalmDetection {
  ok: boolean;
  reason?: PalmRejectReason;
  message?: string;
  /** 21 điểm mốc bàn tay (chuẩn hoá) — chỉ có khi ok */
  landmarks?: Pt[];
  handedness?: "Left" | "Right";
  box?: { x: number; y: number; w: number; h: number };
  /** 3 đường chỉ tay: đã bám rãnh thật ở đâu được, còn lại là neo giải phẫu */
  anchors?: PalmAnchors;
  /** đường nào đã bám được nếp gấp thật trên ảnh */
  traced?: Record<PalmLineKey, boolean>;
  /** số đo ngón tay / hình bàn tay (tất định từ điểm mốc) */
  metrics?: HandMetrics;
  /** true nếu đầu các ngón tay bị cắt khỏi khung hình (không đủ dữ liệu để luận ngón tay) */
  fingersCropped?: boolean;
}

export type { HandMetrics } from "./handMetrics.ts";

const REJECT_MESSAGE: Record<PalmRejectReason, string> = {
  "no-hand":
    "Chưa nhận ra bàn tay trong ảnh. Xoè rộng bàn tay, hướng lòng bàn tay thẳng vào máy ảnh, chụp nơi đủ sáng và nền tương phản.",
  "too-small":
    "Bàn tay ở quá xa hoặc bị cắt. Đưa bàn tay lại gần, lấy trọn cả 5 ngón và cổ tay trong khung hình.",
  closed:
    "Các ngón tay đang co lại. Xoè thẳng cả 5 ngón, giữ lòng bàn tay phẳng rồi chụp lại.",
  "load-failed":
    "Không tải được bộ nhận diện bàn tay. Kiểm tra kết nối mạng rồi tải lại trang.",
};

// ── MediaPipe loader (singleton) ────────────────────────────────────────────
let landmarkerPromise: Promise<HandLandmarker> | null = null;

/**
 * MediaPipe/TFLite in stderr những dòng "INFO/WARNING: ... XNNPACK delegate ..."
 * qua console.error → Next.js 15 dev overlay bắt nhầm là lỗi. Lọc đúng các dòng
 * vô hại này (không đụng lỗi thật).
 */
let consoleQuieted = false;
function quietMediaPipeLogs(): void {
  if (consoleQuieted || typeof console === "undefined") return;
  consoleQuieted = true;
  const benign =
    /^(INFO|WARNING|VERBOSE|W\d*|I\d*)[:\s].*(TensorFlow Lite|XNNPACK|tflite|GL version|delegate for (CPU|GPU)|Graph successfully started)/i;
  for (const level of ["error", "warn"] as const) {
    const orig = console[level].bind(console) as (...a: unknown[]) => void;
    const wrapped = (...args: unknown[]): void => {
      if (typeof args[0] === "string" && benign.test(args[0])) {
        console.debug("[mediapipe]", ...args);
        return;
      }
      orig(...args);
    };
    console[level] = wrapped as typeof console.error;
  }
}

export function loadHandLandmarker(): Promise<HandLandmarker> {
  if (landmarkerPromise) return landmarkerPromise;
  quietMediaPipeLogs();
  landmarkerPromise = (async () => {
    const vision = await import("@mediapipe/tasks-vision");
    const fileset = await vision.FilesetResolver.forVisionTasks("/mediapipe/wasm");
    const opts = (delegate: "GPU" | "CPU") =>
      ({
        baseOptions: { modelAssetPath: "/mediapipe/hand_landmarker.task", delegate },
        numHands: 1,
        runningMode: "IMAGE" as const,
        minHandDetectionConfidence: 0.4,
        minHandPresenceConfidence: 0.4,
      }) as const;
    try {
      return await vision.HandLandmarker.createFromOptions(fileset, opts("GPU"));
    } catch {
      // Vài máy không có WebGL/GPU delegate → dùng CPU (XNNPACK).
      return await vision.HandLandmarker.createFromOptions(fileset, opts("CPU"));
    }
  })().catch((err) => {
    landmarkerPromise = null; // cho phép thử lại lần sau
    throw err;
  });
  return landmarkerPromise;
}

/** Nạp data URL thành <img> ĐÃ decode (bảo đảm có kích thước) để đưa vào MediaPipe. */
export async function loadImageElement(src: string): Promise<HTMLImageElement> {
  const img = new Image();
  img.decoding = "async";
  img.src = src;
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Không đọc được ảnh."));
  });
  try {
    await img.decode();
  } catch {
    /* trình duyệt cũ không có decode() — đã qua onload là đủ */
  }
  if (!img.naturalWidth || !img.naturalHeight) throw new Error("Ảnh rỗng hoặc hỏng.");
  return img;
}

// ── Hình học ───────────────────────────────────────────────────────────────
// Chỉ số điểm mốc MediaPipe Hands
const WRIST = 0;
const THUMB_CMC = 1;
const THUMB_TIP = 4;
const INDEX_MCP = 5;
const MIDDLE_MCP = 9;
const PINKY_MCP = 17;

const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const add = (a: Pt, b: Pt): Pt => [a[0] + b[0], a[1] + b[1]];
const scale = (a: Pt, k: number): Pt => [a[0] * k, a[1] * k];
const dot = (a: Pt, b: Pt): number => a[0] * b[0] + a[1] * b[1];
const len = (a: Pt): number => Math.hypot(a[0], a[1]);
const dist = (a: Pt, b: Pt): number => Math.hypot(a[0] - b[0], a[1] - b[1]);
const norm = (a: Pt): Pt => {
  const l = len(a) || 1;
  return [a[0] / l, a[1] / l];
};
const clamp01 = (n: number): number => Math.min(0.99, Math.max(0.01, n));
const clampPt = (p: Pt): Pt => [clamp01(p[0]), clamp01(p[1])];

export function handBBox(lm: Pt[]): { x: number; y: number; w: number; h: number } {
  let minX = 1;
  let minY = 1;
  let maxX = 0;
  let maxY = 0;
  for (const [x, y] of lm) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}

/** Ngón bị co lại nếu đầu ngón GẦN cổ tay hơn khớp giữa (PIP). */
export function fingerCurled(lm: Pt[], tip: number, pip: number): boolean {
  return dist(lm[tip], lm[WRIST]) < dist(lm[pip], lm[WRIST]) * 1.03;
}

/** Số ngón (trỏ, giữa, áp út, út) đang duỗi thẳng. */
export function countExtendedFingers(lm: Pt[]): number {
  const pairs: [number, number][] = [
    [8, 6],
    [12, 10],
    [16, 14],
    [20, 18],
  ];
  return pairs.filter(([tip, pip]) => !fingerCurled(lm, tip, pip)).length;
}

/**
 * Neo 3 đường chỉ tay vào khung toạ độ cục bộ của bàn tay:
 *   u = trục cổ tay → gốc ngón giữa (dọc lòng bàn tay)
 *   r = trục vuông góc, hướng về phía ngón cái (bán kính)
 * P(a,b) = cổ tay + a·(dài lòng bàn tay)·u + b·(rộng lòng bàn tay)·r
 */
export function computeAnchors(lm: Pt[]): PalmAnchors {
  const w = lm[WRIST];
  const u = norm(sub(lm[MIDDLE_MCP], w));
  const perpA: Pt = [-u[1], u[0]];
  const perpB: Pt = [u[1], -u[0]];
  const r = dot(perpA, sub(lm[THUMB_CMC], w)) > 0 ? perpA : perpB;

  const palmLen = Math.max(0.12, dist(w, lm[MIDDLE_MCP]));
  const palmWide = Math.max(0.1, dist(lm[INDEX_MCP], lm[PINKY_MCP]));

  const P = (a: number, b: number): Pt =>
    add(w, add(scale(u, a * palmLen), scale(r, b * palmWide)));

  // a = tỉ lệ dọc lòng bàn tay (0 = cổ tay, 1 = gốc ngón giữa); b = lệch bán kính (+ = ngón cái).
  const heart = catmullRom([P(0.74, -0.5), P(0.72, -0.02), P(0.86, 0.42)], 6);
  const head = catmullRom([P(0.58, 0.44), P(0.54, 0.0), P(0.46, -0.42)], 6);
  const life = catmullRom([P(0.6, 0.4), P(0.34, 0.62), P(0.06, 0.2)], 7);

  return {
    "path-heart": heart.map(clampPt),
    "path-head": head.map(clampPt),
    "path-life": life.map(clampPt),
  };
}

/** Nội suy Catmull-Rom qua các điểm điều khiển → đường cong mượt (đi qua mọi điểm). */
export function catmullRom(points: Pt[], perSegment: number): Pt[] {
  if (points.length < 3) return points.slice();
  const pts = [points[0], ...points, points[points.length - 1]];
  const out: Pt[] = [];
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];
    for (let s = 0; s < perSegment; s++) {
      const t = s / perSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      out.push([
        0.5 *
          (2 * p1[0] +
            (-p0[0] + p2[0]) * t +
            (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 +
            (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
        0.5 *
          (2 * p1[1] +
            (-p0[1] + p2[1]) * t +
            (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 +
            (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
      ]);
    }
  }
  out.push(points[points.length - 1]);
  return out;
}

/** Lấy lại n điểm cách đều dọc polyline (giữ điểm đầu/cuối). */
export function resamplePolyline(pts: Pt[], n: number): Pt[] {
  if (pts.length <= 1 || n < 2) return pts.slice();
  const acc = [0];
  for (let i = 1; i < pts.length; i++) {
    acc.push(acc[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  }
  const total = acc[acc.length - 1] || 1;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / (n - 1)) * total;
    let k = 1;
    while (k < acc.length && acc[k] < d) k++;
    const t = (d - acc[k - 1]) / (acc[k] - acc[k - 1] || 1);
    out.push([
      pts[k - 1][0] + (pts[k][0] - pts[k - 1][0]) * t,
      pts[k - 1][1] + (pts[k][1] - pts[k - 1][1]) * t,
    ]);
  }
  return out;
}

// ── API chính ──────────────────────────────────────────────────────────────
export async function detectPalm(
  image: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
): Promise<PalmDetection> {
  let landmarker: HandLandmarker;
  try {
    landmarker = await loadHandLandmarker();
  } catch {
    return { ok: false, reason: "load-failed", message: REJECT_MESSAGE["load-failed"] };
  }

  // Ảnh phải có kích thước thật trước khi đưa vào MediaPipe.
  const iw = "naturalWidth" in image ? image.naturalWidth : image.width;
  const ih = "naturalHeight" in image ? image.naturalHeight : image.height;
  if (!iw || !ih) {
    return { ok: false, reason: "load-failed", message: REJECT_MESSAGE["load-failed"] };
  }

  let res: ReturnType<HandLandmarker["detect"]>;
  try {
    res = landmarker.detect(image);
  } catch (err) {
    // MediaPipe/WASM lỗi lúc suy luận → không chặn, để Gemini tự xác thực bàn tay.
    console.warn("[handDetect] landmarker.detect lỗi:", (err as Error)?.message ?? err);
    return { ok: false, reason: "load-failed", message: REJECT_MESSAGE["load-failed"] };
  }
  if (!res || !res.landmarks || res.landmarks.length === 0) {
    return { ok: false, reason: "no-hand", message: REJECT_MESSAGE["no-hand"] };
  }

  const lm: Pt[] = res.landmarks[0].map((p) => [p.x, p.y]);
  const box = handBBox(lm);
  if (box.w * box.h < 0.055 || box.w < 0.16 || box.h < 0.24) {
    return { ok: false, reason: "too-small", message: REJECT_MESSAGE["too-small"] };
  }
  if (countExtendedFingers(lm) < 2) {
    return { ok: false, reason: "closed", message: REJECT_MESSAGE.closed };
  }

  const handedness = res.handedness?.[0]?.[0]?.categoryName as "Left" | "Right" | undefined;

  // Đầu 4 ngón (trỏ/giữa/áp út/út) bị CẮT khỏi khung: MediaPipe đặt điểm mốc ra
  // NGOÀI ảnh (x/y < 0 hoặc > 1) hoặc ép sát mép. Ngón sát mép nhưng vẫn trong
  // khung thì KHÔNG tính (ảnh chụp hơi khít vẫn luận được). Bỏ qua ngón cái.
  const outOfFrame = [8, 12, 16, 20].filter((i) => {
    const p = lm[i];
    return !p || p[0] < 0.004 || p[0] > 0.996 || p[1] < 0.004 || p[1] > 0.996;
  }).length;
  const fingersCropped = outOfFrame >= 1;

  const anchors = computeAnchors(lm);
  let metrics: HandMetrics | undefined;
  try {
    metrics = computeHandMetrics(lm);
  } catch {
    metrics = undefined;
  }

  // Bám đường neo vào nếp gấp thật trên ảnh (chỉ khi nguồn là ảnh vẽ được lên canvas).
  let traced: Record<PalmLineKey, boolean> | undefined;
  if (typeof document !== "undefined") {
    const refined = refinePalmLines(image, lm, anchors);
    Object.assign(anchors, refined.anchors);
    traced = refined.traced;
  }

  return { ok: true, landmarks: lm, handedness, box, anchors, traced, metrics, fingersCropped };
}

/** Bộ khung nối các điểm mốc để vẽ preview (cặp chỉ số). */
export const HAND_CONNECTIONS: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4],
  [0, 5], [5, 6], [6, 7], [7, 8],
  [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16],
  [13, 17], [17, 18], [18, 19], [19, 20],
  [0, 17],
];
