/**
 * Số đo bàn tay tính TRỰC TIẾP từ 21 điểm mốc MediaPipe — tất định, không đoán.
 * Trả về: ngón dài/ngắn nhất, độ hở giữa các ngón, hình bàn tay, nguyên tố…
 */
import type { Pt } from "./handDetect.ts";
import { computeHandPose, type HandPose } from "./handPose.ts";

export type { FingerBend, HandPose } from "./handPose.ts";

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
  /** góc lệch CÓ DẤU (độ) giữa đốt gần gốc của ngón NGOÀI (gần út) so với ngón
   *  TRONG (gần cái): + = toác ra (hở); ~0 = khép sát; − = ngón ngoài CONG QUẶP
   *  vào ngón trong. */
  angleDeg: number;
  openness: "cong vào" | "khép" | "vừa" | "hở rộng";
  /**
   * Xu hướng khe hở dọc theo ngón — so góc ở ĐỐT GẦN GỐC (angleDeg ở trên) với
   * góc ở ĐỐT GẦN ĐẦU MÓNG (DIP→TIP): hai ngón có thể khép sát ở gốc nhưng CONG
   * TOÁC ra dần về đầu móng (hoặc ngược lại) — điều mà chỉ đo ở gốc không thấy
   * được. "toác dần" = càng về đầu móng càng hở; "khép dần" = càng về đầu móng
   * càng khép lại; "đều" = không đổi rõ rệt dọc theo ngón.
   */
  trend: "toác dần" | "khép dần" | "đều";
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface HandMetrics {
  fingers: FingerMetric[];
  longest: string;
  shortest: string;
  gaps: FingerGap[];
  widestGap: string;
  /** góc lệch bên CÓ DẤU (độ) của riêng ngón út so với ngón áp út — trùng gaps[2].angleDeg,
   *  tách riêng để dùng trực tiếp (khớp trường "pinkyCurl" AI quan sát trên ảnh). */
  pinkyCurlDeg: number;
  /** "cong vào áp út" = ngón út quặp vào ngón áp út; "hở khỏi áp út" = toác xa; "thẳng" = bình thường. */
  pinkyCurl: "cong vào áp út" | "thẳng" | "hở khỏi áp út";
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
  /** phân loại `thumbAngleDeg`: "hẹp" = ngón cái khép sát lòng bàn tay; "rộng" = xoè xa. */
  thumbOpenness: "hẹp" | "vừa" | "rộng";
  /** tư thế bàn tay: độ cong ngón, nghiêng, phối cảnh, khum */
  pose: HandPose;
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
const round1 = (n: number) => Math.round(n * 10) / 10;
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Quy đổi điểm mốc chuẩn hoá 0..1 (x theo BỀ RỘNG, y theo BỀ CAO — ĐỘC LẬP nhau)
 * sang không gian đã hiệu chỉnh tỉ lệ khung ảnh, để khoảng cách/góc không bị MÉO
 * khi ảnh không vuông (ảnh điện thoại thường chụp DỌC). Không có kích thước ảnh
 * → giữ nguyên (coi như ảnh vuông, hành vi như trước).
 */
function toGeometrySpace(lm: Pt[], imageSize?: ImageSize): Pt[] {
  const w = imageSize?.width ?? 0;
  const h = imageSize?.height ?? 0;
  if (!(w > 0) || !(h > 0)) return lm;
  const aspect = w / h;
  if (Math.abs(aspect - 1) < 1e-6) return lm;
  return lm.map(([x, y]) => [x * aspect, y] as Pt);
}
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

export function computeHandMetrics(lm0: Pt[], imageSize?: ImageSize): HandMetrics {
  const lm = toGeometrySpace(lm0, imageSize);
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

  // ── Độ hở / độ cong giữa các ngón ───────────────────────────────────────
  // Trục cục bộ của lòng bàn tay, suy từ vị trí NGÓN CÁI thật (không giả định
  // chiều xoay trên ảnh) → cho kết quả ĐÚNG với cả tay trái lẫn tay phải, mọi góc chụp.
  // Dùng khớp NGÓN CÁI (MCP, mốc 2) — không dùng mốc 1 (CMC, sát cổ tay, đòn
  // bẩy ngắn) vì mốc 1 có thể gần trùng trục `u` ở một số dáng tay → dấu bị
  // nhiễu do sai số MediaPipe. Mốc 2 luôn lệch trục rõ rệt khi lòng bàn tay xoè.
  const perp: Pt = [-u[1], u[0]];
  const towardThumb: Pt = dot(perp, sub(lm[2], wrist)) > 0 ? perp : ([u[1], -u[0]] as Pt);
  const towardPinky: Pt = [-towardThumb[0], -towardThumb[1]];

  /**
   * Góc (độ) của ĐỐT GẦN GỐC ngón (MCP→PIP) so với trục dọc lòng bàn tay `u`,
   * quay dương về phía ngón út. Chỉ dùng đốt GẦN GỐC (không dùng cả ngón tới đầu
   * móng) để KHÔNG lẫn độ CONG của ngón (đốt xa gập lại) vào độ TOÁC/KHÉP thật
   * sự giữa các ngón — hai chuyện khác nhau bị đo chung là nguồn sai số cũ.
   */
  const sideAngleDeg = (id: Exclude<FingerId, "thumb">): number => {
    const [mcp, pip] = FINGERS[id];
    const dir = unit(lm[mcp], lm[pip]);
    return (Math.atan2(dot(dir, towardPinky), dot(dir, u)) * 180) / Math.PI;
  };
  /** Cùng công thức trên nhưng đo ĐỐT GẦN ĐẦU MÓNG (DIP→TIP) — để so với gốc,
   *  phát hiện khe hở TOÁC/KHÉP DẦN dọc theo ngón (kho tri thức tướng tay quan
   *  tâm chiều này: "càng về phần móng tay càng hở/khép" mang ý nghĩa riêng,
   *  khác với việc CÓ hở ở gốc hay không). */
  const tipDir = (id: Exclude<FingerId, "thumb">): Pt => {
    const [, , dip, tip] = FINGERS[id];
    return unit(lm[dip], lm[tip]);
  };
  const tipSideAngleDeg = (id: Exclude<FingerId, "thumb">): number => {
    const dir = tipDir(id);
    return (Math.atan2(dot(dir, towardPinky), dot(dir, u)) * 180) / Math.PI;
  };
  /**
   * Ngón CÒN DUỖI RA KHỎI lòng bàn tay (đốt gần đầu móng vẫn hướng ra xa cổ
   * tay theo trục `u`) — chỉ khi cả 2 ngón trong cặp đạt điều kiện này thì góc
   * đo ở đầu móng mới phản ánh đúng khe hở NGANG. Ngón đang CO/GẬP vào lòng
   * bàn tay (đầu móng quay ngược lại) sẽ cho góc ở đầu móng SAI LỆCH RẤT LỚN
   * dù không hề có toác/khép ngang thật — nếu không lọc, một ngón chỉ đang co
   * lại (vd chụp chưa xoè hết) sẽ bị báo nhầm "khép dần"/"toác dần".
   */
  const stillExtended = (id: Exclude<FingerId, "thumb">) => dot(tipDir(id), u) > 0.6;

  const gapPairs: [Exclude<FingerId, "thumb">, Exclude<FingerId, "thumb">, string][] = [
    ["index", "middle", "Trỏ – Giữa"],
    ["middle", "ring", "Giữa – Áp út"],
    ["ring", "pinky", "Áp út – Út"],
  ];
  const classifyGap = (angle: number): FingerGap["openness"] =>
    angle < -4 ? "cong vào" : angle < 7 ? "khép" : angle < 16 ? "vừa" : "hở rộng";
  const classifyTrend = (delta: number): FingerGap["trend"] =>
    delta > 6 ? "toác dần" : delta < -6 ? "khép dần" : "đều";
  const gaps: FingerGap[] = gapPairs.map(([inner, outer, label]) => {
    // + = ngón NGOÀI toác xa khỏi ngón TRONG; − = ngón NGOÀI quặp vào ngón TRONG.
    const angle = round1(sideAngleDeg(outer) - sideAngleDeg(inner));
    let trend: FingerGap["trend"] = "đều";
    if (stillExtended(inner) && stillExtended(outer)) {
      const tipAngle = round1(tipSideAngleDeg(outer) - tipSideAngleDeg(inner));
      trend = classifyTrend(round1(tipAngle - angle));
    }
    return { label, angleDeg: angle, openness: classifyGap(angle), trend };
  });
  const widest = [...gaps].sort((x, y) => y.angleDeg - x.angleDeg)[0];
  const pinkyCurlDeg = gaps[2].angleDeg; // cặp Áp út – Út
  const pinkyCurl: HandMetrics["pinkyCurl"] =
    pinkyCurlDeg < -4 ? "cong vào áp út" : pinkyCurlDeg > 16 ? "hở khỏi áp út" : "thẳng";

  const thumbAngleDeg = round2(angleDeg(unit(lm[2], lm[4]), unit(lm[5], lm[8])));
  // Ngưỡng hiệu chỉnh từ dáng tay "xoè phẳng, chính diện" bình thường (~29°);
  // <15° gần như áp sát lòng bàn tay, >40° xoè rất xa — có thể cần tinh chỉnh thêm khi có ảnh thật.
  const thumbOpenness: HandMetrics["thumbOpenness"] =
    thumbAngleDeg < 15 ? "hẹp" : thumbAngleDeg < 40 ? "vừa" : "rộng";

  // ── Ngón út: với tới đâu so với ngón áp út ──
  // Ngón út đang CO LẠI (không còn duỗi) sẽ khiến đầu ngón tụt gần cổ tay và bị
  // hiểu NHẦM là "ngón ngắn" dù thực ra chỉ chưa xoè hết — cùng dạng lỗi với
  // trend ở trên, dùng lại `stillExtended` để chặn.
  const pinkyTipU = projU(lm[20]);
  const ringDipU = projU(lm[15]);
  const ringPipU = projU(lm[14]);
  const pinkyReach: HandMetrics["pinkyReach"] = !stillExtended("pinky")
    ? "tới khớp giữa"
    : pinkyTipU >= ringDipU
      ? "vượt khớp trên"
      : pinkyTipU >= ringPipU
        ? "tới khớp giữa"
        : "ngắn";

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

  const pose = computeHandPose(lm);

  const notes: string[] = [
    `Ngón dài nhất: ${longest}; ngắn nhất: ${shortest}.`,
    widest.openness === "cong vào"
      ? `${widest.label}: ngón ngoài CONG QUẶP vào ngón trong (~${Math.abs(widest.angleDeg)}°).`
      : `Khe hở rộng nhất: ${widest.label} (~${widest.angleDeg}°, ${widest.openness}).`,
    `Bàn tay ${palmShape} (rộng/dài ${palmRatio}), ngón ${fingerToPalm} → thiên hướng nguyên tố ${element}.`,
    `Góc mở ngón cái ~${Math.round(thumbAngleDeg)}° (${thumbOpenness}).`,
  ];
  if (pinkyCurl === "cong vào áp út") {
    notes.push(`Ngón út cong quặp vào ngón áp út (~${Math.abs(pinkyCurlDeg)}°).`);
  }
  if (pinkyReach === "vượt khớp trên") notes.push("Ngón út dài — vượt khớp trên của ngón áp út.");
  if (pinkyReach === "ngắn") notes.push("Ngón út ngắn — chưa tới khớp giữa ngón áp út.");
  if (lowSetPinky) notes.push("Ngón út đặt thấp so với hàng khớp bàn tay.");
  if (digitRatio > 1.03) notes.push("Ngón trỏ dài hơn ngón áp út.");
  else if (digitRatio < 0.97) notes.push("Ngón áp út dài hơn ngón trỏ.");

  notes.push(...pose.notes);

  return {
    fingers,
    longest,
    shortest,
    gaps,
    widestGap: widest.label,
    pinkyCurlDeg,
    pinkyCurl,
    palmShape,
    palmRatio,
    fingerToPalm,
    element,
    elementIcon: ELEMENT_ICON[element],
    digitRatio,
    pinkyReach,
    lowSetPinky,
    thumbAngleDeg,
    thumbOpenness,
    pose,
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
