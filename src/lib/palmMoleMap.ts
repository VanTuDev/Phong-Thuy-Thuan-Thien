/**
 * SỐ HOÁ sơ đồ 50 ô nốt ruồi lòng bàn tay — ảnh `/DataNotRuoi/AnhNotRuoiTrenTay.png`
 * (bàn tay PHẢI, lòng hướng ra, 767×1024).
 *
 *  - `x`, `y` = tỉ lệ 0..1 theo ẢNH GỐC (gốc góc trên–trái) → vị trí chấm bấm trên ảnh.
 *  - `area`   = mô tả vị trí giải phẫu (chỉ để hiển thị / tooltip).
 *
 * Toạ độ là ƯỚC LƯỢNG. Lệch thì chỉnh ở đây — phải GIỐNG bản backend
 * `Backend/src/services/palmMoleMap.ts`.
 */
export interface HandMoleZone {
  n: number;
  x: number;
  y: number;
  area: string;
}

export const HAND_MOLE_MAP: HandMoleZone[] = [
  { n: 1, x: 0.928, y: 0.54, area: "Ngón cái — đốt ngoài (gần móng)" },
  { n: 2, x: 0.847, y: 0.579, area: "Ngón cái — đốt trong / khớp giữa" },
  { n: 3, x: 0.782, y: 0.646, area: "Ngón cái — gốc ngón (phần thịt ngoài)" },
  { n: 4, x: 0.42, y: 0.161, area: "Ngón trỏ — đốt ngoài" },
  { n: 5, x: 0.411, y: 0.227, area: "Ngón trỏ — đốt giữa" },
  { n: 6, x: 0.391, y: 0.32, area: "Ngón trỏ — đốt gốc" },
  { n: 7, x: 0.502, y: 0.117, area: "Ngón giữa — đốt ngoài" },
  { n: 8, x: 0.506, y: 0.193, area: "Ngón giữa — đốt giữa" },
  { n: 9, x: 0.502, y: 0.291, area: "Ngón giữa — đốt gốc" },
  { n: 10, x: 0.589, y: 0.158, area: "Ngón áp út — đốt ngoài" },
  { n: 11, x: 0.602, y: 0.232, area: "Ngón áp út — đốt giữa" },
  { n: 12, x: 0.615, y: 0.314, area: "Ngón áp út — đốt gốc (giáp ngón út)" },
  { n: 13, x: 0.319, y: 0.252, area: "Cạnh ngoài gốc ngón trỏ (bờ quay, ngoài gò Mộc Tinh)" },
  { n: 14, x: 0.274, y: 0.314, area: "Mép ngoài bàn tay dưới ngón trỏ (gò Hỏa Tinh trong, phía trên)" },
  { n: 15, x: 0.256, y: 0.379, area: "Bờ quay lòng bàn tay, ngay dưới gò Mộc Tinh" },
  { n: 16, x: 0.253, y: 0.459, area: "Bờ quay lòng bàn tay, vùng gò Hỏa Tinh trong" },
  { n: 17, x: 0.342, y: 0.443, area: "Dưới gò Mộc Tinh, phía trong lòng bàn tay" },
  { n: 18, x: 0.561, y: 0.397, area: "Gò Thổ Tinh (dưới ngón giữa)" },
  { n: 19, x: 0.493, y: 0.391, area: "Dưới kẽ ngón trỏ–giữa (giữa gò Mộc Tinh và Thổ Tinh)" },
  { n: 20, x: 0.623, y: 0.397, area: "Gò Thái Dương (dưới ngón áp út)" },
  { n: 21, x: 0.54, y: 0.463, area: "Dưới gò Thổ Tinh, phần trên Đường Tâm đạo" },
  { n: 22, x: 0.623, y: 0.459, area: "Gò Thủy Tinh (dưới ngón út) / rìa gò Thái Dương" },
  { n: 23, x: 0.253, y: 0.54, area: "Bờ trụ lòng bàn tay, phần trên gò Thái Âm" },
  { n: 24, x: 0.343, y: 0.527, area: "Vùng giữa Đường Trí đạo và Tâm đạo, phía ngón trỏ" },
  { n: 25, x: 0.411, y: 0.501, area: "Trung tâm lòng bàn tay, phần trên (khu Đường Trí đạo)" },
  { n: 26, x: 0.508, y: 0.54, area: "Trung tâm lòng bàn tay (Minh đường)" },
  { n: 27, x: 0.425, y: 0.414, area: "Đầu Đường Trí đạo, sát chỗ tách khỏi Đường Sinh đạo (bờ quay)" },
  { n: 28, x: 0.525, y: 0.609, area: "Trung tâm lòng bàn tay, phần dưới" },
  { n: 29, x: 0.593, y: 0.545, area: "Trung tâm lệch về bờ trụ (giáp gò Thái Âm)" },
  { n: 30, x: 0.6, y: 0.615, area: "Gò Thái Âm, phần trên–giữa" },
  { n: 31, x: 0.639, y: 0.51, area: "Bờ trụ dưới ngón út (gò Thủy Tinh thấp)" },
  { n: 32, x: 0.269, y: 0.604, area: "Bờ trụ lòng bàn tay, giữa gò Thái Âm" },
  { n: 33, x: 0.347, y: 0.605, area: "Gò Thái Âm, phần trên" },
  { n: 34, x: 0.435, y: 0.604, area: "Trung tâm lòng bàn tay phía dưới, trên gò Kim Tinh–Thái Âm" },
  { n: 35, x: 0.678, y: 0.631, area: "Gò Kim Tinh, phần dưới (trong Đường Sinh đạo), gần cổ tay" },
  { n: 36, x: 0.305, y: 0.756, area: "Lằn cổ tay, phía bờ trụ" },
  { n: 37, x: 0.37, y: 0.754, area: "Lằn cổ tay, lệch bờ trụ" },
  { n: 38, x: 0.441, y: 0.754, area: "Lằn cổ tay, giữa" },
  { n: 39, x: 0.519, y: 0.758, area: "Lằn cổ tay, giữa (lệch bờ quay)" },
  { n: 40, x: 0.584, y: 0.687, area: "Dải dưới lòng bàn tay, gò Kim Tinh–Thái Âm phía trong" },
  { n: 41, x: 0.678, y: 0.687, area: "Dải dưới lòng bàn tay, gò Kim Tinh phía dưới" },
  { n: 42, x: 0.658, y: 0.571, area: "Gốc ngón cái phía trong, sát Đường Sinh đạo (đầu gò Kim Tinh)" },
  { n: 43, x: 0.594, y: 0.766, area: "Chính giữa lằn cổ tay (rắn cổ tay)" },
  { n: 44, x: 0.435, y: 0.561, area: "Trung tâm lòng bàn tay, hơi lệch bờ quay (Bình nguyên Hỏa Tinh)" },
  { n: 45, x: 0.727, y: 0.596, area: "Góc hổ khẩu — giữa gốc ngón cái và ngón trỏ (gò Hỏa Tinh trong)" },
  { n: 46, x: 0.274, y: 0.682, area: "Bờ trụ phía dưới, gò Thái Âm thấp" },
  { n: 47, x: 0.352, y: 0.682, area: "Phần dưới gò Thái Âm" },
  { n: 48, x: 0.435, y: 0.68, area: "Phần dưới trung tâm lòng bàn tay" },
  { n: 49, x: 0.514, y: 0.684, area: "Phần dưới lòng bàn tay, giáp gò Kim Tinh" },
  { n: 50, x: 0.678, y: 0.734, area: "Bờ quay sát cổ tay, dưới gò Kim Tinh (gần gốc ngón cái)" },
];
