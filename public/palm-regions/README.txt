Ảnh sơ đồ vùng nốt ruồi trên bàn tay — dùng trong trắc nghiệm trước khi phân
tích chỉ tay (/phan-tich-chi-tay).

Đặt 2 file vào đúng thư mục này:

  left.png   — bàn tay TRÁI  (nam xem tay trái)
  right.png  — bàn tay PHẢI  (nữ xem tay phải)

Yêu cầu:
- Ảnh hình chữ nhật, tỉ lệ ~4:3 (component hiển thị trong khung aspect-[4/3],
  object-contain nên tỉ lệ khác vẫn được nhưng 4:3 đẹp nhất).
- Trên ảnh đánh số 1..10 đúng theo bảng trong:
    frontend/src/lib/palmRegions.ts   (và bản mirror ở backend)
      1  Gò Kim Tinh           (gốc ngón cái)
      2  Gò Mộc Tinh           (dưới ngón trỏ)
      3  Gò Thổ Tinh           (dưới ngón giữa)
      4  Gò Thái Dương         (dưới ngón áp út)
      5  Gò Thủy Tinh          (dưới ngón út)
      6  Gò Hỏa Tinh dương     (mép trong, trên Sinh đạo)
      7  Gò Hỏa Tinh âm        (mép ngoài, dưới Thủy Tinh)
      8  Bình nguyên Hỏa Tinh  (giữa lòng bàn tay)
      9  Gò Thái Âm / Nguyệt   (mép ngoài, gần cổ tay)
      10 Vùng cổ tay           (ngay trên cổ tay)

Nếu ảnh dùng cách đánh số khác: sửa mảng PALM_REGIONS ở CẢ HAI file
(frontend/src/lib/palmRegions.ts + Backend-Thuan-Thien/src/services/palmRegions.ts)
cho khớp — số 'n' và thứ tự phải trùng nhau.

Khi chưa có 2 file này, form tự vẽ sơ đồ SVG thay thế (PalmRegionDiagram.tsx).
