# Câu chuyện sản phẩm — Phong Thủy Thuận Thiên

> Tài liệu này viết cho **AI** (và người) làm việc tiếp trên codebase này.
> `README.md` giải thích *cách chạy và cấu trúc kỹ thuật*; file này giải thích
> **thế giới quan / câu chuyện thương hiệu** đứng sau các trang, để khi cần
> viết thêm copy, mock data hay tính năng mới, nội dung sinh ra vẫn "đúng
> chất" — nhất quán về giọng văn, nhân vật, và logic phong thủy — thay vì
> chỉ đúng cú pháp React.

## 1. Sản phẩm là gì

**Phong Thủy Thuận Thiên** (tên hiển thị trong app: **Thuận Thiên**) là một ứng dụng web
tư vấn **phong thủy & nhân tướng học** ứng dụng **AI**. Định vị thương hiệu:
*"Thấu hiểu vận mệnh qua lăng kính công nghệ AI"* — lấy tri thức phương Đông
cổ xưa (Bát Trạch, Ngũ Hành, Kinh Dịch, nhân tướng học) làm **nội dung**, và
AI/Computer Vision làm **phương tiện phân tích**.

Đây **không phải** một app horoscope vui giải trí kiểu "xem cho vui" — giọng
văn của sản phẩm nghiêm túc, tối giản, gần với một dịch vụ tư vấn cao cấp
("modern sage" = hiền triết hiện đại), không hài hước, không dùng emoji,
không màu mè nhiều màu (toàn bộ UI chỉ có 1 accent màu **gold** `#D4AF37`
trên nền gần đen `#0A0A0A`).

## 2. Bốn trụ cột tính năng (customer-facing)

| Route | Tính năng | Bản chất |
|---|---|---|
| `/` | Landing page | Giới thiệu thương hiệu, dẫn tới 3 tính năng dưới |
| `/phan-tich-chi-tay` | Phân tích Chỉ tay | Upload ảnh lòng bàn tay → AI "quét" 3 đường chỉ tay: **Đường gia đình** (đỏ, `path-life`), **Đường tình duyên** (xanh dương, `path-head`), **Đường công danh sự nghiệp** (vàng, `path-heart`), kèm số đo ngón tay/độ hở ngón và Bát Trạch |
| `/phan-tich-not-ruoi` | Phân tích Nốt ruồi (MẶT) | Upload ảnh khuôn mặt → người xem chấm các ô có nốt ruồi trên **sơ đồ 78 vị trí** (`/DataNotRuoi/AnhNotRuoiTrenMat.png`), hoặc chọn "để AI tìm" / "không có" → AI luận theo cung vị tướng số. Nốt ruồi trên **TAY** khai ở sơ đồ 50 ô trong trắc nghiệm của trang Chỉ tay. |
| `/co-van` | Cố vấn AI (chatbot) | Trò chuyện tự do với "Thuận Thiên" — trả lời theo Bát Trạch (Quái số, Đông/Tây Tứ Trạch), Ngũ Hành, hướng nhà/hướng bàn làm việc |

Và khu vực **admin** (nội bộ, không phải khách hàng dùng):

| Route | Tính năng | Bản chất |
|---|---|---|
| `/admin/quan-ly-nguoi-dung` | Quản lý Người dùng | CRM đơn giản: danh sách user, tổng số tiền đã nạp, trạng thái khóa/hoạt động |
| `/admin/kho-kien-thuc-ai` | Kho Kiến thức AI | Nơi admin upload tài liệu (PDF/Docx/Text) để "huấn luyện" mô hình Gemini đứng sau `/co-van` |

## 3. Logic phong thủy dùng xuyên suốt (để sinh nội dung mới cho đúng)

Khi viết thêm luận giải (chat, chỉ tay, nốt ruồi...), giữ đúng các quy tắc
sau — đây là tri thức nền, không phải thứ được bịa tự do:

- **Ngũ Hành**: Mộc (`wood`, xanh lá `#4CAF50`) – Hỏa (`fire`, cam `#FF9800`)
  – Thổ – Kim – Thủy (`water`, xanh dương `#2196F3`). Mỗi hành có màu token
  riêng trong `tailwind.config.ts`, dùng để tô điểm chữ liên quan đến hành đó
  (ví dụ "Hành Mộc" luôn tô `text-wood`).
- **Bát Trạch**: mỗi người có **Quái số** (Kua number), chia làm **Đông Tứ
  Trạch** hoặc **Tây Tứ Trạch**, từ đó suy ra các hướng tốt/xấu (Sinh Khí,
  Thiên Y, Diên Niên, Phục Vị = tốt; Họa Hại, Ngũ Quỷ, Lục Sát, Tuyệt Mệnh =
  xấu).
- **Chỉ tay**: chỉ dùng **3 đường**, mỗi đường 1 màu cố định và 1 ý nghĩa:
  - `path-life` — **đỏ `#FF5252`** — **Đường gia đình** (cội nguồn, quan hệ cha mẹ/anh em, gắn kết & hậu phương gia đạo).
  - `path-head` — **xanh dương `#448AFF`** — **Đường tình duyên** (tình cảm, hôn nhân, cách yêu & chọn bạn đời).
  - `path-heart` — **vàng `#FFC107`** — **Đường công danh sự nghiệp** (sự nghiệp, danh vọng, thăng tiến).
  Id đường (`path-life/head/heart`) giữ nguyên vì đã lưu trong DB — chỉ đổi
  `title`/`tag`/ý nghĩa. Màu + nhãn đồng bộ ở `lib/handDetect.ts`,
  `PalmLineEditor.tsx`, prompt Gemini (`Backend/src/services/gemini.ts`) và dữ
  liệu mẫu (`Backend/src/services/demoData.ts`). **Không có đường phụ nào khác.**
- **Nốt ruồi**: luận theo **cung vị** — trên mặt (tài bạch, sự nghiệp, tình
  duyên, phúc đức, tử tức, nô bộc, phu thê...) và trên lòng bàn tay (các gò Kim
  Tinh / Thái Dương / Thái Âm...). KHÔNG luận theo hình dạng/màu sắc nốt ruồi.
  Người xem tự khai ô số trên sơ đồ (78 mặt / 50 tay); backend KHÔNG hard-code ý
  nghĩa từng ô — Gemini tự luận theo số ô, admin nạp tri thức ở Kho kiến thức nếu
  muốn bám sát tướng số. Helper: `lib/palmRegions.ts` (FE) ·
  `Backend/src/services/palmRegions.ts` · component `ui/MolePicker.tsx`.
- Giọng luận giải: khẳng định nhưng không tuyệt đối hoá — ví dụ dòng disclaimer
  cố định trong `ChatInputBar.tsx`: *"Trí tuệ AI là người dẫn đường, không
  phải định mệnh tuyệt đối."* Mọi luận giải mới nên giữ tinh thần này (gợi mở,
  không phán quyết).

## 4. Nhân vật / persona xuất hiện trong mock data

Đây là các "nhân vật" đã tồn tại trong mock data — khi cần thêm dữ liệu mẫu
mới, có thể tái dùng hoặc thêm nhân vật cùng "vibe" (tên người Việt thật,
email cá nhân, không phải tên doanh nghiệp):

- **"Người Tìm Kiếm"** (`ChatSideNav.tsx`) — danh xưng mặc định cho user
  đang chat với Thuận Thiên, cố tình ẩn danh/phiếm chỉ (không phải tên riêng).
- **Khách hàng ẩn danh trong `/co-van`** (`chatData.ts`) — Quái số 4, đang
  thiết kế lại văn phòng tại nhà, muốn tăng tập trung + thăng tiến sự nghiệp.
  Đây là kịch bản demo mẫu cho hội thoại tư vấn hướng bàn làm việc.
- **Người dùng trong admin** (`userData.ts`): Nguyễn Văn An, Trần Thị Bình,
  Lê Văn Cường, Phạm Dung — mix số tiền đã nạp khác nhau, có người bị khóa
  tài khoản (để demo trạng thái UI, không có ý nghĩa tường thuật gì thêm).

## 5. Mock data: đã có sẵn ở đâu, quy ước đặt thêm

Toàn bộ dữ liệu "giả" (chưa nối backend thật `Backend-Thuan-Thien`) đã được
tách khỏi component JSX, đặt cạnh component dùng nó, theo quy ước
`*Data.ts` xuất `interface` + `const ALL_CAPS: Type[]`:

```
components/sections/landing/servicesData.ts       SERVICES        (3 thẻ dịch vụ trên landing)
components/sections/co-van/chatData.ts             DEMO_EXCHANGE   (hội thoại mẫu trong /co-van)
components/sections/chi-tay/lineDetails.ts         LINE_DETAILS    (luận giải 3 đường chỉ tay)
(nốt ruồi: không còn mock data — người xem tự khai qua ui/MolePicker.tsx, backend luận qua Gemini)
components/sections/kho-kien-thuc-ai/documentData.ts DOCUMENTS     (tài liệu huấn luyện AI)
components/sections/quan-ly-nguoi-dung/userData.ts   USERS         (danh sách người dùng)
components/sections/quan-ly-nguoi-dung/statsData.ts  STATS         (3 chỉ số tổng quan)
```

Quy ước khi thêm mock data mới:

1. File `xxxData.ts` nằm **cùng thư mục** `sections/<feature>/` với component
   dùng nó — không gom vào 1 nơi chung, vì mỗi tính năng có domain riêng.
2. Export 1 `interface` mô tả shape + 1 `const` (UPPER_SNAKE_CASE) là mảng dữ
   liệu. Component chỉ `import` và `.map()`, không có logic sinh dữ liệu.
3. Ảnh dùng domain giả `lh3.googleusercontent.com/aida-public/...` (ảnh mock
   từ công cụ thiết kế gốc) — khi có ảnh thật, chỉ cần đổi `src` trong data
   file, component không đổi.
4. Nếu nội dung có định dạng phong phú (chữ đậm, tô màu theo hành...) như
   `chatData.ts`, tách thành mảng "segments" có `text` + `emphasis` thay vì
   nhúng JSX/HTML vào string — tránh `dangerouslySetInnerHTML` và giữ style
   nhất quán qua 1 bảng map class (`EMPHASIS_CLASS`) dùng class Tailwind
   tĩnh (không ghép chuỗi `text-${x}` — Tailwind JIT không nhận diện được
   class được ghép động lúc build).
5. Điều hướng (`NAV_ITEMS` trong `SiteHeader`, `ChatHeader`, `AdminSideNav`,
   `FOOTER_LINKS` trong `SiteFooter`) **không** phải mock data — đó là cấu
   trúc site thật (route thật), nên vẫn để inline trong component layout,
   không tách file riêng.

## 6. Khi AI cần sinh thêm nội dung/tính năng

- Giữ nguyên giọng văn tiếng Việt trang trọng, không teencode, không emoji.
- Giữ đúng bảng màu Ngũ Hành ở mục 3 khi nhắc tới một Hành cụ thể.
- Một tính năng mới theo mô hình "quét ảnh → luận giải" nên có 3 phase UI
  quen thuộc đã dùng ở `PalmScanWorkspace`/`MoleScanWorkspace`: **rỗng
  (chưa upload) → đang quét (loading/scan animation) → xong (hiển thị luận
  giải)**, tách state bằng `Phase` union type trong component `"use client"`.
- Dữ liệu luận giải cho tính năng mới luôn tách thành `*Data.ts` riêng theo
  quy ước ở mục 5, không hard-code trong JSX.
