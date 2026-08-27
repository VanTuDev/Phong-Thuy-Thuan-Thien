/**
 * Sơ đồ cung/gò trên lòng bàn tay — đánh số 1..10 để người xem tự khai vị trí
 * nốt ruồi trong trắc nghiệm trước khi phân tích chỉ tay.
 *
 * Bản mirror của `Backend-Thuan-Thien/src/services/palmRegions.ts`. Đổi số/nhãn
 * ở CẢ HAI nơi (và ảnh `public/palm-regions/{left,right}.png`) nếu dùng cách
 * đánh số khác.
 */
export interface PalmRegion {
  n: number;
  key: string;
  name: string;
  meaning: string;
  /** Toạ độ tương đối trên sơ đồ SVG bàn tay PHẢI (0..1). Tay trái = lật ngang. */
  at: [number, number];
}

export const PALM_REGIONS: readonly PalmRegion[] = [
  { n: 1, key: "venus", name: "Gò Kim Tinh", meaning: "tình cảm, sinh lực, gia đạo", at: [0.36, 0.66] },
  { n: 2, key: "jupiter", name: "Gò Mộc Tinh", meaning: "tham vọng, vị thế, khả năng lãnh đạo", at: [0.34, 0.3] },
  { n: 3, key: "saturn", name: "Gò Thổ Tinh", meaning: "kỷ luật, trách nhiệm, nghiệp vận", at: [0.5, 0.26] },
  { n: 4, key: "apollo", name: "Gò Thái Dương", meaning: "danh tiếng, nghệ thuật, may mắn", at: [0.64, 0.29] },
  { n: 5, key: "mercury", name: "Gò Thủy Tinh", meaning: "giao tiếp, tài kinh doanh, con cái", at: [0.75, 0.36] },
  { n: 6, key: "mars_pos", name: "Gò Hỏa Tinh dương", meaning: "dũng khí, tính chủ động", at: [0.3, 0.46] },
  { n: 7, key: "mars_neg", name: "Gò Hỏa Tinh âm", meaning: "kiên nhẫn, sức chịu đựng", at: [0.74, 0.53] },
  { n: 8, key: "mars_plain", name: "Bình nguyên Hỏa Tinh", meaning: "bản ngã, cân bằng nội tâm", at: [0.52, 0.5] },
  { n: 9, key: "luna", name: "Gò Thái Âm (Nguyệt)", meaning: "trực giác, tưởng tượng, sự dịch chuyển", at: [0.68, 0.72] },
  { n: 10, key: "wrist", name: "Vùng cổ tay (Long mạch)", meaning: "nền tảng sức khỏe, tổ ấm", at: [0.5, 0.9] },
] as const;

/** Quy ước: nam xem tay trái, nữ xem tay phải. */
export function moleHand(gender: "nam" | "nu"): "trai" | "phai" {
  return gender === "nam" ? "trai" : "phai";
}

export function handLabel(hand: "trai" | "phai"): string {
  return hand === "trai" ? "trái" : "phải";
}
