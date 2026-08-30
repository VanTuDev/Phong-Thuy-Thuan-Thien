/**
 * Dò NẾP GẤP THẬT trên ảnh lòng bàn tay, dùng đường neo MediaPipe làm "ray dẫn".
 *
 * Ý tưởng: nếp gấp là rãnh tối, mảnh. Ta lọc ảnh để làm nổi rãnh tối
 * (black-hat + cân bằng sáng), rồi với mỗi đường neo, tại từng điểm ta tìm dọc
 * PHÁP TUYẾN xem rãnh tối nằm lệch bao nhiêu, giải quy hoạch động (Viterbi) để
 * có đường bám rãnh nhưng vẫn mượt và không rời xa đường neo.
 *
 * Thuần TS trên canvas/typed-array — không phụ thuộc thư viện.
 */
import type { PalmAnchors, PalmLineKey, Pt } from "./handDetect.ts";

export interface CreaseRefinement {
  anchors: PalmAnchors;
  /** đường nào đã bám được rãnh thật (ngược lại: giữ nguyên đường neo) */
  traced: Record<PalmLineKey, boolean>;
}

const LINE_KEYS: PalmLineKey[] = ["path-life", "path-head", "path-heart"];
const MAX_ROI_EDGE = 480; // px — giới hạn độ phân giải vùng xử lý cho nhanh

// ── Tiện ích mảng ──────────────────────────────────────────────────────────
function boxBlur1D(src: Float32Array, w: number, h: number, rad: number, horizontal: boolean): Float32Array {
  const out = new Float32Array(src.length);
  const n = 2 * rad + 1;
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      let sum = 0;
      const row = y * w;
      for (let x = -rad; x <= rad; x++) sum += src[row + clamp(x, 0, w - 1)];
      for (let x = 0; x < w; x++) {
        out[row + x] = sum / n;
        const add = clamp(x + rad + 1, 0, w - 1);
        const rem = clamp(x - rad, 0, w - 1);
        sum += src[row + add] - src[row + rem];
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      for (let y = -rad; y <= rad; y++) sum += src[clamp(y, 0, h - 1) * w + x];
      for (let y = 0; y < h; y++) {
        out[y * w + x] = sum / n;
        const add = clamp(y + rad + 1, 0, h - 1);
        const rem = clamp(y - rad, 0, h - 1);
        sum += src[add * w + x] - src[rem * w + x];
      }
    }
  }
  return out;
}
const boxBlur = (s: Float32Array, w: number, h: number, r: number) =>
  boxBlur1D(boxBlur1D(s, w, h, r, true), w, h, r, false);

/** Lọc min/max tách trục (phần tử cấu trúc hình vuông). */
function rankFilter1D(
  src: Float32Array,
  w: number,
  h: number,
  rad: number,
  horizontal: boolean,
  wantMax: boolean,
): Float32Array {
  const out = new Float32Array(src.length);
  const pick = wantMax ? Math.max : Math.min;
  if (horizontal) {
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        let v = src[row + x];
        for (let k = 1; k <= rad; k++) {
          v = pick(v, src[row + clamp(x - k, 0, w - 1)]);
          v = pick(v, src[row + clamp(x + k, 0, w - 1)]);
        }
        out[row + x] = v;
      }
    }
  } else {
    for (let x = 0; x < w; x++) {
      for (let y = 0; y < h; y++) {
        let v = src[y * w + x];
        for (let k = 1; k <= rad; k++) {
          v = pick(v, src[clamp(y - k, 0, h - 1) * w + x]);
          v = pick(v, src[clamp(y + k, 0, h - 1) * w + x]);
        }
        out[y * w + x] = v;
      }
    }
  }
  return out;
}
const morph = (s: Float32Array, w: number, h: number, r: number, wantMax: boolean) =>
  rankFilter1D(rankFilter1D(s, w, h, r, true, wantMax), w, h, r, false, wantMax);

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function percentile(src: Float32Array, p: number): number {
  const a = Float32Array.from(src).sort();
  return a[clamp(Math.floor(p * (a.length - 1)), 0, a.length - 1)] || 1e-6;
}

function bilinear(src: Float32Array, w: number, h: number, x: number, y: number): number {
  if (x < 0 || y < 0 || x > w - 1 || y > h - 1) return 0;
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0;
  const fy = y - y0;
  return (
    src[y0 * w + x0] * (1 - fx) * (1 - fy) +
    src[y0 * w + x1] * fx * (1 - fy) +
    src[y1 * w + x0] * (1 - fx) * fy +
    src[y1 * w + x1] * fx * fy
  );
}

// ── Bản đồ "độ tối rãnh" ───────────────────────────────────────────────────
/** Trả về map [0..~1], cao ở nơi có rãnh tối mảnh (nếp gấp). */
export function creaseResponse(gray: Float32Array, w: number, h: number, roiEdge: number): Float32Array {
  const flat = boxBlur(gray, w, h, Math.max(8, Math.round(roiEdge * 0.14)));
  const g2 = new Float32Array(gray.length);
  for (let i = 0; i < gray.length; i++) g2[i] = gray[i] - flat[i] + 0.5; // cân bằng sáng

  const rad = Math.max(2, Math.round(roiEdge * 0.012));
  const closed = morph(morph(g2, w, h, rad, true), w, h, rad, false); // closing = dilate→erode
  const resp = new Float32Array(gray.length);
  for (let i = 0; i < resp.length; i++) resp[i] = Math.max(0, closed[i] - g2[i]); // black-hat

  const sm = boxBlur(resp, w, h, 1);
  const norm = percentile(sm, 0.97);
  for (let i = 0; i < sm.length; i++) sm[i] = clamp(sm[i] / norm, 0, 1.5);
  return sm;
}

// ── Bám đường vào rãnh (Viterbi dọc pháp tuyến) ────────────────────────────
export interface SnapResult {
  pts: Pt[]; // px trong ROI
  confidence: number;
}

export function snapLineToCrease(
  resp: Float32Array,
  w: number,
  h: number,
  polyPx: Pt[],
  opts: { searchPx: number; stepPx?: number; inMask?: (x: number, y: number) => boolean },
): SnapResult {
  const step = opts.stepPx ?? 1.2;
  const K = Math.max(4, Math.round(opts.searchPx / step));
  const offsets = K * 2 + 1;
  const N = polyPx.length;

  // pháp tuyến tại mỗi điểm (từ tiếp tuyến sai phân trung tâm)
  const normals: Pt[] = polyPx.map((_, i) => {
    const a = polyPx[Math.max(0, i - 1)];
    const b = polyPx[Math.min(N - 1, i + 1)];
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    return [-ty / len, tx / len];
  });

  const score = (i: number, k: number): number => {
    const off = (k - K) * step;
    const x = polyPx[i][0] + normals[i][0] * off;
    const y = polyPx[i][1] + normals[i][1] * off;
    if (opts.inMask && !opts.inMask(x, y)) return -1;
    return bilinear(resp, w, h, x, y) - 0.0009 * (k - K) * (k - K); // phạt lệch xa neo
  };

  const LAMBDA = 0.05; // phạt gấp khúc
  const dp = new Float32Array(N * offsets);
  const back = new Int16Array(N * offsets);
  for (let k = 0; k < offsets; k++) dp[k] = score(0, k);
  for (let i = 1; i < N; i++) {
    for (let k = 0; k < offsets; k++) {
      let best = -Infinity;
      let bj = k;
      for (let j = 0; j < offsets; j++) {
        const v = dp[(i - 1) * offsets + j] - LAMBDA * (k - j) * (k - j);
        if (v > best) {
          best = v;
          bj = j;
        }
      }
      dp[i * offsets + k] = best + score(i, k);
      back[i * offsets + k] = bj;
    }
  }

  let endK = 0;
  let bestEnd = -Infinity;
  for (let k = 0; k < offsets; k++) {
    if (dp[(N - 1) * offsets + k] > bestEnd) {
      bestEnd = dp[(N - 1) * offsets + k];
      endK = k;
    }
  }
  const chosen = new Array<number>(N);
  chosen[N - 1] = endK;
  for (let i = N - 1; i > 0; i--) chosen[i - 1] = back[i * offsets + chosen[i]];

  // làm mượt offset rồi dựng lại điểm
  const raw = chosen.map((k) => (k - K) * step);
  const smooth = raw.map((_, i) => {
    const a = raw[Math.max(0, i - 1)];
    const b = raw[i];
    const c = raw[Math.min(N - 1, i + 1)];
    return (a + 2 * b + c) / 4;
  });
  const pts: Pt[] = polyPx.map((p, i) => [
    p[0] + normals[i][0] * smooth[i],
    p[1] + normals[i][1] * smooth[i],
  ]);

  let sum = 0;
  let hits = 0;
  for (let i = 0; i < N; i++) {
    const r = bilinear(resp, w, h, pts[i][0], pts[i][1]);
    sum += r;
    if (r > 0.15) hits++;
  }
  const confidence = (sum / N) * (hits / N); // vừa mạnh vừa liên tục
  return { pts, confidence };
}

// ── Điểm-trong-đa-giác (mặt nạ lòng bàn tay) ───────────────────────────────
function pointInPoly(x: number, y: number, poly: Pt[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function resample(poly: Pt[], n: number): Pt[] {
  const seg: number[] = [0];
  for (let i = 1; i < poly.length; i++) {
    seg.push(seg[i - 1] + Math.hypot(poly[i][0] - poly[i - 1][0], poly[i][1] - poly[i - 1][1]));
  }
  const total = seg[seg.length - 1] || 1;
  const out: Pt[] = [];
  for (let i = 0; i < n; i++) {
    const d = (i / (n - 1)) * total;
    let k = 1;
    while (k < seg.length && seg[k] < d) k++;
    const t = (d - seg[k - 1]) / (seg[k] - seg[k - 1] || 1);
    out.push([
      poly[k - 1][0] + (poly[k][0] - poly[k - 1][0]) * t,
      poly[k - 1][1] + (poly[k][1] - poly[k - 1][1]) * t,
    ]);
  }
  return out;
}

// ── API chính ──────────────────────────────────────────────────────────────
export function refinePalmLines(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  landmarks: Pt[],
  anchors: PalmAnchors,
): CreaseRefinement {
  const fallback: CreaseRefinement = {
    anchors,
    traced: { "path-life": false, "path-head": false, "path-heart": false },
  };
  try {
    const iw =
      "naturalWidth" in source
        ? source.naturalWidth
        : (source as HTMLCanvasElement | ImageBitmap).width;
    const ih =
      "naturalHeight" in source
        ? source.naturalHeight
        : (source as HTMLCanvasElement | ImageBitmap).height;
    if (!iw || !ih) return fallback;

    // ROI = khung bàn tay nới rộng
    let minX = 1;
    let minY = 1;
    let maxX = 0;
    let maxY = 0;
    for (const [x, y] of landmarks) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const padX = (maxX - minX) * 0.1;
    const padY = (maxY - minY) * 0.1;
    const sx = clamp((minX - padX) * iw, 0, iw - 1);
    const sy = clamp((minY - padY) * ih, 0, ih - 1);
    const sw = clamp((maxX + padX) * iw, 0, iw) - sx;
    const sh = clamp((maxY + padY) * ih, 0, ih) - sy;
    if (sw < 20 || sh < 20) return fallback;

    const scale = Math.min(1, MAX_ROI_EDGE / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return fallback;
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);

    const gray = new Float32Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    }
    const resp = creaseResponse(gray, w, h, Math.max(w, h));

    // toạ độ ảnh-chuẩn-hoá → px trong ROI
    const toRoi = ([x, y]: Pt): Pt => [(x * iw - sx) * scale, (y * ih - sy) * scale];
    const toNorm = ([x, y]: Pt): Pt => [(x / scale + sx) / iw, (y / scale + sy) / ih];

    // mặt nạ lòng bàn tay (bao lồi vài mốc, nới rộng để không loại nhầm vùng rãnh)
    const hullIdx = [0, 1, 2, 5, 9, 13, 17];
    const cx = hullIdx.reduce((s, i) => s + landmarks[i][0], 0) / hullIdx.length;
    const cy = hullIdx.reduce((s, i) => s + landmarks[i][1], 0) / hullIdx.length;
    const maskPoly: Pt[] = hullIdx.map((i) =>
      toRoi([cx + (landmarks[i][0] - cx) * 1.4, cy + (landmarks[i][1] - cy) * 1.4]),
    );
    const inMask = (x: number, y: number) => pointInPoly(x, y, maskPoly);

    const wristRoi = toRoi(landmarks[0]);
    const midRoi = toRoi(landmarks[9]);
    const palmLenPx = Math.hypot(midRoi[0] - wristRoi[0], midRoi[1] - wristRoi[1]) || w;
    const searchByLine: Record<PalmLineKey, number> = {
      "path-life": palmLenPx * 0.14,
      "path-head": palmLenPx * 0.12,
      "path-heart": palmLenPx * 0.12,
    };

    const outAnchors = { ...anchors };
    const traced: Record<PalmLineKey, boolean> = {
      "path-life": false,
      "path-head": false,
      "path-heart": false,
    };

    // Dịch cả đường dọc pháp tuyến giữa để bắt được rãnh khi đường neo lệch nhiều.
    const coarseShift = (poly: Pt[]): Pt[] => {
      const m = Math.floor(poly.length / 2);
      const a = poly[Math.max(0, m - 2)];
      const b = poly[Math.min(poly.length - 1, m + 2)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const nl = Math.hypot(tx, ty) || 1;
      const nrm: Pt = [-ty / nl, tx / nl];
      const range = palmLenPx * 0.28;
      let bestOff = 0;
      let bestScore = -Infinity;
      for (let off = -range; off <= range; off += 1.5) {
        let sum = 0;
        for (const [x, y] of poly) sum += bilinear(resp, w, h, x + nrm[0] * off, y + nrm[1] * off);
        if (sum > bestScore) {
          bestScore = sum;
          bestOff = off;
        }
      }
      return poly.map(([x, y]) => [x + nrm[0] * bestOff, y + nrm[1] * bestOff]);
    };

    for (const key of LINE_KEYS) {
      const base = coarseShift(resample(anchors[key], 26).map(toRoi));
      const { pts, confidence } = snapLineToCrease(resp, w, h, base, {
        searchPx: searchByLine[key],
        inMask,
      });
      if (confidence > 0.13) {
        outAnchors[key] = pts.map(toNorm).map(
          ([x, y]) => [clamp(x, 0.01, 0.99), clamp(y, 0.01, 0.99)] as Pt,
        );
        traced[key] = true;
      }
    }

    return { anchors: outAnchors, traced };
  } catch {
    return fallback;
  }
}

// ── Tinh chỉnh polyline BẤT KỲ (vd đường Gemini dò thô) về nếp gấp thật ─────
export interface LineSnapResult {
  /** polyline đã bám nếp gấp (hoặc giữ nguyên nếu không đủ tin cậy), toạ độ 0..1 */
  points: Pt[];
  /** true nếu đã bám được rãnh thật */
  traced: boolean;
  confidence: number;
}

/**
 * Nhận danh sách polyline THÔ (0..1) — thường do Gemini dò từ ảnh — và kéo từng
 * đường về đúng nếp gấp tối trên ảnh. Không cần điểm mốc MediaPipe: ROI + mặt nạ
 * suy từ chính các điểm đường (nới rộng). Dùng khi đã có ảnh + đường thô đủ tốt.
 */
export function refineLinesToCrease(
  source: HTMLImageElement | HTMLCanvasElement | ImageBitmap,
  lines: Record<string, Pt[]>,
  landmarks?: Pt[] | null,
): Record<string, LineSnapResult> {
  const keys = Object.keys(lines);
  const passthrough = (): Record<string, LineSnapResult> =>
    Object.fromEntries(
      keys.map((k) => [k, { points: lines[k], traced: false, confidence: 0 } as LineSnapResult]),
    );
  try {
    if (typeof document === "undefined") return passthrough();
    const iw =
      "naturalWidth" in source ? source.naturalWidth : (source as HTMLCanvasElement | ImageBitmap).width;
    const ih =
      "naturalHeight" in source
        ? source.naturalHeight
        : (source as HTMLCanvasElement | ImageBitmap).height;
    if (!iw || !ih) return passthrough();

    // ROI: bao tất cả điểm đường (+ mốc nếu có), nới 14%.
    const allPts: Pt[] = keys.flatMap((k) => lines[k]).concat(landmarks ?? []);
    if (allPts.length < 6) return passthrough();
    let minX = 1,
      minY = 1,
      maxX = 0,
      maxY = 0;
    for (const [x, y] of allPts) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    const padX = Math.max(0.04, (maxX - minX) * 0.14);
    const padY = Math.max(0.04, (maxY - minY) * 0.14);
    const sx = clamp((minX - padX) * iw, 0, iw - 1);
    const sy = clamp((minY - padY) * ih, 0, ih - 1);
    const sw = clamp((maxX + padX) * iw, 0, iw) - sx;
    const sh = clamp((maxY + padY) * ih, 0, ih) - sy;
    if (sw < 40 || sh < 40) return passthrough();

    const scale = Math.min(1, MAX_ROI_EDGE / Math.max(sw, sh));
    const w = Math.max(1, Math.round(sw * scale));
    const h = Math.max(1, Math.round(sh * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return passthrough();
    ctx.drawImage(source, sx, sy, sw, sh, 0, 0, w, h);
    const { data } = ctx.getImageData(0, 0, w, h);
    const gray = new Float32Array(w * h);
    for (let i = 0; i < gray.length; i++) {
      gray[i] = (0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2]) / 255;
    }
    const resp = creaseResponse(gray, w, h, Math.max(w, h));

    const toRoi = ([x, y]: Pt): Pt => [(x * iw - sx) * scale, (y * ih - sy) * scale];
    const toNorm = ([x, y]: Pt): Pt => [(x / scale + sx) / iw, (y / scale + sy) / ih];

    // mặt nạ rộng: bao lồi các điểm đường nới 30% (giữ đường không văng ra mép/ngón).
    const maskSrc = keys.flatMap((k) => lines[k]);
    const mcx = maskSrc.reduce((s, p) => s + p[0], 0) / maskSrc.length;
    const mcy = maskSrc.reduce((s, p) => s + p[1], 0) / maskSrc.length;
    const maskPoly = maskSrc.map((p) =>
      toRoi([mcx + (p[0] - mcx) * 1.5, mcy + (p[1] - mcy) * 1.5] as Pt),
    );
    const inMask = (x: number, y: number) =>
      x >= -2 && y >= -2 && x <= w + 2 && y <= h + 2 && pointInPoly(x, y, maskPoly);

    // thước đo: đường chéo ROI
    const diag = Math.hypot(w, h);
    const searchPx = diag * 0.06;
    const coarseRange = diag * 0.1;

    const coarseShift = (poly: Pt[]): Pt[] => {
      const m = Math.floor(poly.length / 2);
      const a = poly[Math.max(0, m - 2)];
      const b = poly[Math.min(poly.length - 1, m + 2)];
      const tx = b[0] - a[0];
      const ty = b[1] - a[1];
      const nl = Math.hypot(tx, ty) || 1;
      const nrm: Pt = [-ty / nl, tx / nl];
      let bestOff = 0;
      let bestScore = -Infinity;
      for (let off = -coarseRange; off <= coarseRange; off += 1.5) {
        let sum = 0;
        for (const [x, y] of poly) sum += bilinear(resp, w, h, x + nrm[0] * off, y + nrm[1] * off);
        if (sum > bestScore) {
          bestScore = sum;
          bestOff = off;
        }
      }
      return poly.map(([x, y]) => [x + nrm[0] * bestOff, y + nrm[1] * bestOff]);
    };

    const out: Record<string, LineSnapResult> = {};
    for (const key of keys) {
      const src = lines[key];
      if (!src || src.length < 3) {
        out[key] = { points: src ?? [], traced: false, confidence: 0 };
        continue;
      }
      const base = coarseShift(resample(src, 26).map(toRoi));
      const { pts, confidence } = snapLineToCrease(resp, w, h, base, { searchPx, inMask });
      if (confidence > 0.12) {
        out[key] = {
          points: pts
            .map(toNorm)
            .map(([x, y]) => [clamp(x, 0.01, 0.99), clamp(y, 0.01, 0.99)] as Pt),
          traced: true,
          confidence,
        };
      } else {
        out[key] = { points: src, traced: false, confidence };
      }
    }
    return out;
  } catch {
    return passthrough();
  }
}
