/**
 * Bản mirror (client) của `Backend/src/services/faceMolePositions.ts` — CHỈ phần
 * hiển thị: số → mô tả vùng, để bộ "chỉnh số" cho người xem biết mỗi số là vùng nào.
 * Sửa CẢ HAI file nếu đổi nội dung.
 */
export const FACE_MOLE_COUNT = 78;

/** Ảnh sơ đồ 78 vị trí (public/) — cùng đánh số với bản backend gửi cho Gemini. */
export const FACE_MOLE_CHART_IMG = "/DataNotRuoi/AnhNotRuoiTrenKhuongMat.jpg";

const AREA: Record<number, string> = {
  1: "Chính giữa trán trên cao",
  2: "Mí mắt trên, phần trong (2 bên)",
  3: "Mí mắt trên, phần ngoài (2 bên)",
  4: "Trán trên, lệch giữa",
  5: "Trán trên, giữa Thiên đình và mép trán",
  6: "Trán trên, gần chân tóc",
  7: "Trán trên, phần giữa (Nhật/Nguyệt giác)",
  8: "Trán trên, sát mép ngoài",
  9: "Trán giữa, trên đầu lông mày",
  10: "Góc trán trên (Dịch mã), sát tóc mai",
  11: "Trán giữa, trên đầu mày, lệch trong",
  12: "Trán, trên đuôi lông mày (Phúc đường)",
  13: "Sơn căn — sống mũi trên, giữa hai đầu mắt",
  14: "Đầu lông mày, phía trong sát ấn đường",
  15: "Trong/trên lông mày, phần đầu mày",
  16: "Dưới lông mày, phần đầu mày",
  17: "Trong/trên lông mày, thân mày phía trong",
  18: "Dưới lông mày, thân mày phía trong",
  19: "Trong/trên lông mày, phần giữa thân mày",
  20: "Dưới lông mày, phần giữa thân mày",
  21: "Trong/trên lông mày, phần đuôi mày",
  22: "Dưới lông mày, phần đuôi mày",
  23: "Đuôi lông mày, phía ngoài",
  24: "Ngoài đuôi lông mày / thái dương trên",
  25: "Đầu mắt / khoé mắt trong (lệ đường)",
  26: "Bọng mắt dưới, phía trong",
  27: "Bọng mắt dưới, phần giữa (Ngoạ tằm)",
  28: "Bọng mắt dưới, phần giữa–trong",
  29: "Bọng mắt dưới, phần giữa–ngoài",
  30: "Dưới bọng mắt, phần giữa",
  31: "Đuôi mắt phía dưới (Gian môn)",
  32: "Dưới đuôi mắt, lệch xuống gò má",
  33: "Đuôi mắt ngoài, phía dưới–ngoài",
  34: "Nhân trung — rãnh giữa mũi và môi trên",
  35: "Cạnh nhân trung",
  36: "Rãnh pháp lệnh, đoạn trên",
  37: "Rãnh pháp lệnh, đoạn giữa (cạnh mép)",
  38: "Dưới môi dưới, lệch trái (trên cằm)",
  39: "Dưới môi dưới, gần chính giữa",
  40: "Cằm phần trên–giữa",
  41: "Cằm, lệch phải phần trên",
  42: "Cằm–hàm bên phải, phần trên",
  43: "Hàm bên phải (Địa khố)",
  44: "Góc hàm bên phải, phía ngoài",
  45: "Quai hàm bên trái, phần dưới",
  46: "Quai hàm bên phải, phần dưới",
  47: "Giữa trán phần thấp, trên ấn đường",
  48: "Ấn đường — giữa hai đầu lông mày",
  49: "Sống mũi trên–giữa, ngang hai đuôi mắt",
  50: "Sống mũi phần giữa (Niên/Thọ thượng)",
  51: "Cạnh sống mũi, phần giữa (2 bên)",
  52: "Cạnh mũi phần dưới, sát chân cánh mũi",
  53: "Cạnh cánh mũi / rãnh mũi–má",
  54: "Đầu mũi trên",
  55: "Cằm chính giữa (Địa các trên)",
  56: "Cằm chính giữa phần dưới (Địa các)",
  57: "Cằm bên phải",
  58: "Cằm bên trái",
  59: "Cánh mũi (Lan đài / Đình uý)",
  60: "Đuôi mắt / khoé mắt ngoài (Ngư vĩ)",
  61: "Khoé mắt ngoài, sát chân mày đuôi",
  62: "Gò má trên, dưới đuôi mắt (Quyền)",
  63: "Gò má, dưới đuôi mắt",
  64: "Cạnh ấn đường, phía trong đầu mày",
  65: "Thái dương, ngang đuôi lông mày",
  66: "Trên đầu lông mày",
  67: "Cạnh ấn đường, dưới đầu mày",
  68: "Thái dương ngoài, ngang đuôi mày",
  69: "Trên lông mày, phần giữa–đuôi mày",
  70: "Chuẩn đầu — đầu mũi",
  71: "Trên môi trên, lệch một bên",
  72: "Khoé miệng ngoài",
  73: "Bên mép miệng, phía ngoài–dưới",
  74: "Dưới mép miệng, phía ngoài",
  75: "Môi trên",
  76: "Dưới môi dưới, chính giữa (Thừa tương)",
  77: "Khoé miệng bên trái",
  78: "Khoé miệng bên phải",
};

/** Số có ở cả hai bên mặt (side có ý nghĩa). */
const BILATERAL = new Set<number>([
  2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
  30, 31, 32, 33, 35, 36, 37, 51, 52, 53, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 71, 72, 73, 74,
]);

export function faceMoleArea(n: number): string {
  return AREA[n] ?? `Vị trí số ${n}`;
}
export function faceMoleBilateral(n: number): boolean {
  return BILATERAL.has(n);
}
