/**
 * Số đo bàn tay tính TRỰC TIẾP từ 21 điểm mốc MediaPipe — tất định, không đoán.
 * Trả về: ngón dài/ngắn nhất, độ hở giữa các ngón, hình bàn tay, nguyên tố…
 */
import type { Pt } from "./handDetect.ts";

export type FingerId = "thumb" | "index" | "middle" | "ring" | "pinky";
export type ElementVi = "Thổ" | "Khí" | "Hỏa" | "Thủy";

export interface FingerMetric {
  id: FingerId;
  label: string;
  /** chiều dài (tổng các đốt) chuẩn hoá theo chiều dài lòng bàn tay */
  length: number;
  /** hạng chiều dài trong 4 ngón (trỏ/giữa/áp út/út): 1 = dài nhất; ngón cái = 0 */
  rank: number;
  relative: "dài" | "vừa" | "ngắn" | "";
}

export interface FingerGap {
  label: string;
  /** góc giữa hướng hai ngón (độ) */
  angleDeg: number;
  openness: "khép" | "vừa" | "hở rộng";
}

export interface HandMetrics {
  fingers: FingerMetric[];
  longest: string;
  shortest: string;
  gaps: FingerGap[];
  widestGap: string;
  palmShape: "vuông" | "chữ nhật";
  /** rộng / dài của lòng bàn tay */
  palmRatio: number;
  fingerToPalm: "dài" | "cân đối" | "ngắn";
  element: ElementVi;
  elementIcon: string;
  /** ngón trỏ / ngón áp út */
  digitRatio: number;
  pinkyReach: "vượt khớp trên" | "tới khớp giữa" | "ngắn";
  lowSetPinky: boolean;
  thumbAngleDeg: number;
  /** câu mô tả khách quan (tiếng Việt) để hiển thị + đưa vào ngữ cảnh AI */
  notes: string[];
}

const FINGERS: Record<FingerId, [number, number, number, number]> = {
  thumb: [1, 2, 3, 4],
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};
const LABEL: Record<FingerId, string> = {
  thumb: "Ngón cái",
  index: "Ngón trỏ",
  middle: "Ngón giữa",
  ring: "Ngón áp út",
  pinky: "Ngón út",
};
const ELEMENT_ICON: Record<ElementVi, string> = {
  Thổ: "landscape",
  Khí: "air",
  Hỏa: "local_fire_department",
  Thủy: "water_drop",
};

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const sub = (a: Pt, b: Pt): Pt => [a[0] - b[0], a[1] - b[1]];
const dot = (a: Pt, b: Pt) => a[0] * b[0] + a[1] * b[1];
const round2 = (n: number) => Math.round(n * 100) / 100;
function unit(a: Pt, b: Pt): Pt {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const l = Math.hypot(dx, dy) || 1;
  return [dx / l, dy / l];
}
function angleDeg(a: Pt, b: Pt): number {
  return (Math.acos(Math.max(-1, Math.min(1, dot(a, b)))) * 180) / Math.PI;
}
function boneLength(lm: Pt[], idx: number[]): number {
  let s = 0;
  for (let i = 1; i < idx.length; i++) s += dist(lm[idx[i - 1]], lm[idx[i]]);
  return s;
}

export function computeHandMetrics(lm: Pt[]): HandMetrics {
  const wrist = lm[0];
  const palmLength = Math.max(1e-4, dist(wrist, lm[9]));
  const palmWidth = dist(lm[5], lm[17]);
  const u = unit(wrist, lm[9]); // trục lòng bàn tay hướng lên các ngón
  const projU = (p: Pt) => dot(sub(p, wrist), u);

  const ids: FingerId[] = ["thumb", "index", "middle", "ring", "pinky"];
  const len: Record<FingerId, number> = {} as Record<FingerId, number>;
  for (const id of ids) len[id] = boneLength(lm, FINGERS[id]) / palmLength;

  const four: FingerId[] = ["index", "middle", "ring", "pinky"];
  const sorted = [...four].sort((a, b) => len[b] - len[a]);
  const rank: Record<string, number> = {};
  sorted.forEach((id, i) => (rank[id] = i + 1));
  const mean4 = four.reduce((s, id) => s + len[id], 0) / 4;

  const fingers: FingerMetric[] = ids.map((id) => ({
    id,
    label: LABEL[id],
    length: round2(len[id]),
    rank: rank[id] ?? 0,
    relative:
      id === "thumb"
        ? ""
        : len[id] > mean4 * 1.04
          ? "dài"
          : len[id] < mean4 * 0.93
            ? "ngắn"
            : "vừa",
  }));

  const longest = LABEL[sorted[0]];
  const shortest = LABEL[sorted[3]];

  // ── Độ hở giữa các ngón (góc giữa hướng ngón) ──
  const fdir = (id: FingerId) => unit(lm[FINGERS[id][0]], lm[FINGERS[id][3]]);
  const pairs: [FingerId, FingerId, string][] = [
    ["index", "middle", "Trỏ – Giữa"],
    ["middle", "ring", "Giữa – Áp út"],
    ["ring", "pinky", "Áp út – Út"],
  ];
  const gaps: FingerGap[] = pairs.map(([a, b, label]) => {
    const ang = angleDeg(fdir(a), fdir(b));
    return {
      label,
      angleDeg: round2(ang),
      openness: ang < 7 ? "khép" : ang < 16 ? "vừa" : "hở rộng",
    };
  });
  const widest = [...gaps].sort((x, y) => y.angleDeg - x.angleDeg)[0];

  const thumbAngleDeg = round2(angleDeg(unit(lm[2], lm[4]), unit(lm[5], lm[8])));

  // ── Ngón út: với tới đâu so với ngón áp út ──
  const pinkyTipU = projU(lm[20]);
  const ringDipU = projU(lm[15]);
  const ringPipU = projU(lm[14]);
  const pinkyReach: HandMetrics["pinkyReach"] =
    pinkyTipU >= ringDipU ? "vượt khớp trên" : pinkyTipU >= ringPipU ? "tới khớp giữa" : "ngắn";

  // ── Ngón út đặt thấp? (so với ngoại suy hàng khớp) ──
  const midMcpU = projU(lm[9]);
  const ringMcpU = projU(lm[13]);
  const pinkyMcpU = projU(lm[17]);
  const expectedPinkyMcpU = ringMcpU - (midMcpU - ringMcpU) * 0.9;
  const lowSetPinky = (expectedPinkyMcpU - pinkyMcpU) / palmLength > 0.06;

  // ── Hình bàn tay + nguyên tố ──
  const palmRatio = round2(palmWidth / palmLength);
  const palmShape: HandMetrics["palmShape"] = palmRatio >= 0.88 ? "vuông" : "chữ nhật";
  const fingerToPalm: HandMetrics["fingerToPalm"] =
    mean4 > 0.72 ? "dài" : mean4 < 0.62 ? "ngắn" : "cân đối";
  const longFingers = mean4 > 0.7;
  const element: ElementVi =
    palmShape === "vuông" ? (longFingers ? "Khí" : "Thổ") : longFingers ? "Thủy" : "Hỏa";

  const digitRatio = round2(len.index / len.ring);

  const notes: string[] = [
    `Ngón dài nhất: ${longest}; ngắn nhất: ${shortest}.`,
    `Khe hở rộng nhất: ${widest.label} (~${Math.round(widest.angleDeg)}°, ${widest.openness}).`,
    `Bàn tay ${palmShape} (rộng/dài ${palmRatio}), ngón ${fingerToPalm} → thiên hướng nguyên tố ${element}.`,
    `Góc mở ngón cái ~${Math.round(thumbAngleDeg)}°.`,
  ];
  if (pinkyReach === "vượt khớp trên") notes.push("Ngón út dài — vượt khớp trên của ngón áp út.");
  if (pinkyReach === "ngắn") notes.push("Ngón út ngắn — chưa tới khớp giữa ngón áp út.");
  if (lowSetPinky) notes.push("Ngón út đặt thấp so với hàng khớp bàn tay.");
  if (digitRatio > 1.03) notes.push("Ngón trỏ dài hơn ngón áp út.");
  else if (digitRatio < 0.97) notes.push("Ngón áp út dài hơn ngón trỏ.");

  return {
    fingers,
    longest,
    shortest,
    gaps,
    widestGap: widest.label,
    palmShape,
    palmRatio,
    fingerToPalm,
    element,
    elementIcon: ELEMENT_ICON[element],
    digitRatio,
    pinkyReach,
    lowSetPinky,
    thumbAngleDeg,
    notes,
  };
}

/** Tóm tắt 1 dòng cho ngữ cảnh AI. */
export function metricsBrief(m: HandMetrics): string {
  return (
    `SỐ ĐO BÀN TAY (đo từ ảnh, tất định): ${m.notes.join(" ")} ` +
    `Chiều dài ngón (chuẩn hoá): ${m.fingers
      .filter((f) => f.id !== "thumb")
      .map((f) => `${f.label} ${f.length}${f.relative ? ` (${f.relative})` : ""}`)
      .join(", ")}.`
  );
}
