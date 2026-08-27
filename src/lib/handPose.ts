/**
 * Tư thế bàn tay từ 21 điểm mốc MediaPipe — bổ sung cho `handMetrics.ts`:
 *   • độ cong/co từng ngón (góc gập tại PIP + DIP)
 *   • bàn tay nghiêng trong mặt phẳng ảnh (tilt)
 *   • bàn tay xoay/ngửa ngoài mặt phẳng — phối cảnh làm méo số đo (roll)
 *   • lòng bàn tay khum (cupped) hay phẳng
 *
 * Thuần, tất định, 0 dependency. Dùng để cảnh báo mềm khi ảnh chưa lý tưởng và
 * cho AI biết để luận giải dè dặt.
 */
import type { Pt } from "./handDetect.ts";
import type { FingerId } from "./handMetrics.ts";

export interface FingerBend {
  id: FingerId;
  label: string;
  /** góc gập tại khớp PIP (độ) — 0 = thẳng */
  pipDeg: number;
  /** tổng độ cong PIP + DIP (độ) */
  curveDeg: number;
  state: "thẳng" | "hơi cong" | "cong nhiều";
}

export interface HandPose {
  /** 4 ngón (trừ ngón cái) */
  fingerBends: FingerBend[];
  /** lệch trục cổ tay → gốc ngón giữa so với phương dọc ảnh (độ) */
  tiltDeg: number;
  /** mức xoay/ngửa ngoài mặt phẳng ảnh (phối cảnh) */
  roll: "chính diện" | "hơi nghiêng" | "nghiêng nhiều";
  cupping: "phẳng" | "hơi khum" | "khum";
  quality: "tốt" | "khá" | "kém";
  /** câu ngắn cho banner cảnh báo người dùng */
  issues: string[];
  /** câu mô tả cho ngữ cảnh AI */
  notes: string[];
}

const FINGER_LM: Record<Exclude<FingerId, "thumb">, [number, number, number, number]> = {
  index: [5, 6, 7, 8],
  middle: [9, 10, 11, 12],
  ring: [13, 14, 15, 16],
  pinky: [17, 18, 19, 20],
};
const LABEL: Record<Exclude<FingerId, "thumb">, string> = {
  index: "Ngón trỏ",
  middle: "Ngón giữa",
  ring: "Ngón áp út",
  pinky: "Ngón út",
};

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const round1 = (n: number) => Math.round(n * 10) / 10;

/** Góc lệch hướng (độ) giữa 2 đoạn a→b và b→c; 0 khi thẳng hàng. */
function turnDeg(a: Pt, b: Pt, c: Pt): number {
  const u: Pt = [b[0] - a[0], b[1] - a[1]];
  const v: Pt = [c[0] - b[0], c[1] - b[1]];
  const lu = Math.hypot(u[0], u[1]) || 1;
  const lv = Math.hypot(v[0], v[1]) || 1;
  const cos = clamp((u[0] * v[0] + u[1] * v[1]) / (lu * lv), -1, 1);
  return (Math.acos(cos) * 180) / Math.PI;
}

export function computeHandPose(lm: Pt[]): HandPose {
  const wrist = lm[0];
  const palmLength = Math.max(1e-4, dist(wrist, lm[9]));
  const palmWidth = dist(lm[5], lm[17]);

  // ── Độ cong từng ngón ────────────────────────────────────────────────────
  const fingerBends: FingerBend[] = (Object.keys(FINGER_LM) as Array<keyof typeof FINGER_LM>).map(
    (id) => {
      const [mcp, pip, dipp, tip] = FINGER_LM[id];
      const pipDeg = turnDeg(lm[mcp], lm[pip], lm[dipp]);
      const dipDeg = turnDeg(lm[pip], lm[dipp], lm[tip]);
      const curveDeg = pipDeg + dipDeg;
      return {
        id,
        label: LABEL[id],
        pipDeg: round1(pipDeg),
        curveDeg: round1(curveDeg),
        state: curveDeg < 25 ? "thẳng" : curveDeg < 55 ? "hơi cong" : "cong nhiều",
      };
    },
  );
  const bent = fingerBends.filter((f) => f.state !== "thẳng");
  const heavy = fingerBends.filter((f) => f.state === "cong nhiều");

  // ── Nghiêng trong mặt phẳng ảnh ──────────────────────────────────────────
  const axis: Pt = [lm[9][0] - wrist[0], lm[9][1] - wrist[1]];
  const axisLen = Math.hypot(axis[0], axis[1]) || 1;
  // so với phương dọc ảnh [0,-1] (y hướng xuống)
  const tiltDeg = round1((Math.acos(clamp(-axis[1] / axisLen, -1, 1)) * 180) / Math.PI);

  // ── Phối cảnh (xoay/ngửa ngoài mặt phẳng) ────────────────────────────────
  const widthRatio = palmWidth / palmLength; // chính diện xoè ~0.6–0.95
  const skewW = clamp(Math.abs(widthRatio - 0.75) / 0.45, 0, 1);
  const asym = Math.abs(dist(wrist, lm[5]) - dist(wrist, lm[17])) / palmLength;
  const skewA = clamp(asym / 0.4, 0, 1);
  const skew = Math.min(1, skewW * 0.6 + skewA);
  const roll: HandPose["roll"] =
    skew < 0.2 ? "chính diện" : skew < 0.4 ? "hơi nghiêng" : "nghiêng nhiều";

  // ── Lòng bàn tay khum ────────────────────────────────────────────────────
  const tipSpread = dist(lm[8], lm[20]);
  const mcpSpread = Math.max(1e-4, dist(lm[5], lm[17]));
  const spreadRatio = tipSpread / mcpSpread; // xoè phẳng ≳ 0.9
  let cupping: HandPose["cupping"] =
    spreadRatio >= 0.85 ? "phẳng" : spreadRatio >= 0.62 ? "hơi khum" : "khum";
  if (heavy.length >= 2 && cupping === "phẳng") cupping = "hơi khum";

  // ── Tổng hợp ─────────────────────────────────────────────────────────────
  const quality: HandPose["quality"] =
    heavy.length > 0 || roll === "nghiêng nhiều" || cupping === "khum"
      ? "kém"
      : bent.length > 0 || roll === "hơi nghiêng" || cupping === "hơi khum" || tiltDeg > 22
        ? "khá"
        : "tốt";

  const issues: string[] = [];
  const notes: string[] = [];
  if (heavy.length) {
    const names = heavy.map((f) => f.label.replace("Ngón ", "")).join(", ");
    issues.push(`${heavy.length > 1 ? "Các ngón" : "Ngón"} ${names} đang cong nhiều`);
  } else if (bent.length) {
    issues.push(`${bent.map((f) => f.label.replace("Ngón ", "")).join(", ")} hơi cong`);
  }
  if (roll !== "chính diện") issues.push(`Bàn tay ${roll} so với máy ảnh`);
  if (cupping !== "phẳng") issues.push(`Lòng bàn tay ${cupping}`);
  if (tiltDeg > 22) issues.push(`Ảnh nghiêng ~${Math.round(tiltDeg)}°`);

  notes.push(
    bent.length
      ? `Độ cong ngón: ${fingerBends.map((f) => `${f.label} ${f.state}`).join(", ")}.`
      : "Các ngón duỗi thẳng.",
  );
  notes.push(`Bàn tay ${roll} máy ảnh, nghiêng ~${Math.round(tiltDeg)}°, lòng bàn tay ${cupping}.`);
  if (quality !== "tốt") {
    notes.push("Tư thế chưa lý tưởng — một số số đo có thể sai lệch, nên nhìn nhận thận trọng.");
  }

  return { fingerBends, tiltDeg, roll, cupping, quality, issues, notes };
}
