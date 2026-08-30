/**
 * Sơ đồ vị trí nốt ruồi (đánh số) để người xem tự khai TRƯỚC khi phân tích:
 *  - Lòng bàn tay: 50 ô  — `/DataNotRuoi/AnhNotRuoiTrenTay.png`
 *  - Khuôn mặt:    78 vị trí — `/DataNotRuoi/AnhNotRuoiTrenMat.png`
 *
 * KHÔNG hard-code ý nghĩa từng ô — Gemini tự luận theo số ô; admin bổ sung tri
 * thức ở Kho kiến thức nếu muốn bám sát tướng số. Bản mirror phía backend:
 * `Backend/src/services/palmRegions.ts`.
 */
export const HAND_MOLE_ZONES = 50;
export const FACE_MOLE_POSITIONS = 78;

export const FACE_CHART_IMG = "/DataNotRuoi/AnhNotRuoiTrenMat.png";
export const HAND_CHART_IMG = "/DataNotRuoi/AnhNotRuoiTrenTay.png";

/** Lọc + chuẩn hoá danh sách số ô (nguyên, 1..max, không trùng, tăng dần). */
export function sanitizePositions(raw: number[], max: number): number[] {
  const seen = new Set<number>();
  for (const v of raw) {
    const n = Math.trunc(v);
    if (Number.isFinite(n) && n >= 1 && n <= max) seen.add(n);
  }
  return [...seen].sort((a, b) => a - b);
}

/** Quy ước: nam xem tay trái, nữ xem tay phải. */
export function moleHand(gender: "nam" | "nu"): "trai" | "phai" {
  return gender === "nam" ? "trai" : "phai";
}

export function handLabel(hand: "trai" | "phai"): string {
  return hand === "trai" ? "trái" : "phải";
}
