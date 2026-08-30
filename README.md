# Phong Thủy Thuận Thiên — Frontend (Next.js)

> Muốn hiểu **câu chuyện sản phẩm** (thương hiệu, logic phong thủy, mock data
> ở đâu, quy ước thêm dữ liệu mới) trước khi sửa/viết thêm code hoặc nội
> dung? Đọc [`STORY.md`](./STORY.md).

Ứng dụng Next.js (App Router, TypeScript, Tailwind CSS) có cấu trúc rõ ràng:
`app/` (route/page), `components/layout`, `components/ui`,
`components/sections/<tính năng>`, `lib/` (client API + tiện ích).

> **Đã nối backend thật.** Giao diện gọi API ở `Backend-Thuan-Thien` (mặc định
> `http://localhost:4000`, đổi qua `NEXT_PUBLIC_API_URL` trong `.env.local`).
> Hãy chạy backend trước. Tổng quan toàn hệ thống + tích hợp Google API:
> [`../README.md`](../README.md).

## Cài đặt & chạy

Project dùng **pnpm** (xem `packageManager` trong `package.json`). Nếu chưa có:
`corepack enable pnpm`.

```bash
pnpm install
pnpm dev          # http://localhost:3000 (kèm địa chỉ Network: http://<IP-LAN>:3000)
pnpm build        # build production
pnpm start        # chạy bản đã build
pnpm test         # test cho các hàm thuần trong lib/ (node --test, không cần cài gì)
```

Khi khởi động, `next.config.mjs` in cấu hình đang dùng (API backend, Google Client ID).

> **360 Total Security:** máy dev có 360 chặn chuỗi `node.exe → cmd.exe → node.exe`,
> làm `npm run dev` thoát âm thầm. Cách né: chạy thẳng không qua package manager
> `node node_modules/next/dist/bin/next dev`, hoặc đặt
> `scriptShell: C:/Program Files/Git/usr/bin/bash.exe` trong `.npmrc` cục bộ
> (**không commit** — đường dẫn Windows làm hỏng build trên Vercel).

## Deploy

Xem [`DEPLOY.md`](./DEPLOY.md) — deploy lên **Vercel** (zero-config Next.js). URL
production đặt ở [`.env.production`](./.env.production) (có commit — chỉ chứa
`NEXT_PUBLIC_*`) hoặc Vercel Dashboard. Backend deploy lên **Render**
(`../Backend-Phong-Thuy-Thuan-Thien/DEPLOY.md`).

## Biến môi trường

| File | Dùng khi | Commit? |
|---|---|---|
| `.env.local` | Dev cục bộ (ghi đè mọi file) | Không |
| `.env.production` | `next build` / Vercel Production | **Có** |

```
NEXT_PUBLIC_API_URL=            # TRỐNG = tự suy ra <host đang mở>:4000 (dev/LAN).
                               # Production: https://<backend>.onrender.com (KHÔNG "/" cuối)
NEXT_PUBLIC_API_PORT=4000       # cổng API khi tự suy ra
NEXT_PUBLIC_GOOGLE_CLIENT_ID=   # để trống = nút "Đăng nhập demo"
```

Truy cập từ điện thoại cùng Wi-Fi: `pnpm dev` in ra dòng `Network:
http://192.168.x.x:3000` — mở link đó. Backend cần chạy với `CORS_ORIGIN=*`
(mặc định).

## Cấu trúc thư mục

```
src/
  app/
    layout.tsx                 # Root layout: fonts + Material Symbols + SessionProvider
    page.tsx                   # Landing ("/")
    dang-nhap/                 # Đăng nhập Google (thật hoặc demo)
    phan-tich-chi-tay/         # Phân tích chỉ tay (upload ảnh thật → API)
    phan-tich-not-ruoi/        # Phân tích nốt ruồi (upload ảnh thật → API)
    co-van/                    # Cố vấn AI — ChatWorkspace (nhiều phiên, lưu server)
    lich-su/  nap-luot/        # Lịch sử luận giải · Nạp lượt (đơn hàng + QR)
    admin/
      quan-ly-nguoi-dung/  quan-ly-tai-chinh/
      lich-su-luot-xem/    kho-kien-thuc-ai/
  components/
    layout/     SiteHeader (drawer mobile), SiteFooter, AdminShell
    ui/         Icon, ImageUploader, Reveal, EngineBadge, CreditBadge
    session/    SessionProvider — phiên + ví, cờ online/demo-mode
    sections/<feature>/   Component theo trang
  lib/
    api.ts       fetch client + token + ApiError + mediaUrl + pingHealth
    endpoints.ts mọi endpoint gói thành hàm có kiểu
    image.ts     nén ảnh phía client trước khi upload
  app/globals.css   Tailwind layers + glass-panel, skeleton, reveal, keyframes,
                    prefers-reduced-motion
tailwind.config.ts  Design tokens + keyframes/animation (fade-in-up, shimmer, float…)
```

## Nâng cấp trong bản này

- **Upload ảnh thật**: `ImageUploader` (kéo–thả + chụp ảnh trên mobile), nén ảnh
  bằng canvas xuống ~1600px/JPEG trước khi gửi → upload nhanh trên 4G.
- **Nối API**: đăng nhập, ví lượt, luận giải chỉ tay/nốt ruồi, chat, đơn hàng,
  lịch sử, và toàn bộ trang admin đều lấy dữ liệu thật từ backend.
- **Mobile-first**: drawer điều hướng cho cả site và admin (trước không có),
  `100dvh`, `env(safe-area-inset)`, target chạm ≥ 44px, bảng cuộn ngang.
- **Hiệu ứng**: reveal khi cuộn (IntersectionObserver), gradient vàng động,
  chuyển cảnh mờ–trượt, skeleton shimmer, chỉ báo "đang soạn", hoạt ảnh vẽ
  đường chỉ tay — tất cả tôn trọng `prefers-reduced-motion`.
- **Mô-típ phong thủy**: `components/ui/Bagua.tsx` (la bàn Bát Quái SVG, dùng ở
  hero / câu chuyện thương hiệu / footer / đăng nhập); `sections/landing/NguHanh.tsx`
  (sơ đồ ngũ giác tương sinh); tiện ích nền `.starfield` / `.qi-grid` / `.tho-pattern`
  trong `globals.css`. Panel "đang chờ" của Chỉ tay / Nốt ruồi hiển thị trước
  các mục sẽ luận giải để không trống trải.

## Design system

Tokens trong `tailwind.config.ts` được hợp nhất từ
`../Thuan-Thien-Phong-Thuy/DESIGN.md` và `zenith_qi_gold/DESIGN.md`: nền tối
gần đen (`background`), chữ trắng (`on-surface`), và **gold** (`#D4AF37`) là
màu nhấn (accent) duy nhất xuyên suốt toàn bộ ứng dụng — thay cho việc mỗi
mockup gốc tự đặt tên token `primary` khác nhau (có màn dùng trắng, có màn
dùng vàng cho cùng một token `primary`).

## Dữ liệu

Không còn mock data tĩnh cho các luồng chính — tất cả đi qua `lib/endpoints.ts`
tới `Backend-Thuan-Thien`. Còn lại ở dạng dữ liệu tĩnh (nội dung marketing, không
phải dữ liệu vận hành): `sections/landing/servicesData.ts`,
`sections/co-van/chatData.ts` (gợi ý câu hỏi), `sections/nap-luot/packageData.ts`
(fallback khi chưa gọi được `/packages`).

Giọng văn / logic phong thủy khi viết thêm nội dung: xem [`STORY.md`](./STORY.md).
