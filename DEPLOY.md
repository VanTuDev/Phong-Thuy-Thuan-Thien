# Deploy Frontend lên Vercel

App Next.js 15 (App Router). Vercel nhận diện tự động — không cần `vercel.json`.

## 1. Import project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import
   `VanTuDev/Phong-Thuy-Thuan-Thien`.
2. Framework Preset: **Next.js** (tự nhận). Root Directory: `.` (mặc định).
3. Package manager: **pnpm** (tự nhận từ `pnpm-lock.yaml`).
   - Install: `pnpm install`
   - Build: `pnpm build` — chạy `prebuild` tải tài nguyên MediaPipe (~7.5MB) rồi `next build`.
   - Output: `.next` (mặc định).

## 2. Environment Variables (Settings → Environment Variables)

Đặt cho cả 3 môi trường (Production / Preview / Development):

```
NEXT_PUBLIC_API_URL=https://<ten-app>.up.railway.app     # URL backend Railway, KHÔNG có "/" cuối
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth Client ID>    # cùng giá trị với GOOGLE_CLIENT_ID ở backend
```

`NEXT_PUBLIC_API_PORT` không cần khi đã set `NEXT_PUBLIC_API_URL`.

> Biến `NEXT_PUBLIC_*` được nhúng vào bundle lúc **build** → đổi giá trị phải
> **Redeploy** mới có hiệu lực.

## 3. Sau khi có domain Vercel

1. **Backend (Railway)** → Variables → đặt
   `CORS_ORIGIN=https://<ten-app>.vercel.app` rồi redeploy.
2. **Google Cloud Console** → OAuth Client → *Authorized JavaScript origins* →
   thêm `https://<ten-app>.vercel.app` (và domain custom nếu có).
3. `next.config.mjs` tự thêm host của `NEXT_PUBLIC_API_URL` vào `images.remotePatterns`
   nên ảnh `/uploads/...` từ backend hiển thị được. Ảnh Cloudinary
   (`res.cloudinary.com`) đã whitelist sẵn.

## 4. Kiểm tra

- Mở `https://<ten-app>.vercel.app` → landing hiển thị.
- `/dang-nhap` → nút Google thật (không phải form demo) nghĩa là
  `NEXT_PUBLIC_GOOGLE_CLIENT_ID` đã nhận.
- Đăng nhập → `/phan-tich-chi-tay` tải ảnh → luận giải chạy (gọi Railway OK, CORS OK).

## Ghi chú build

- `public/mediapipe/` bị `.gitignore` — script `prebuild` tự tải lại mỗi lần build.
  Nếu Google Storage chặn trong lúc build, tính năng dò chỉ tay client-side sẽ
  hiện hướng dẫn cấu hình; các phần khác không ảnh hưởng.
- `scriptShell` Windows đã bỏ khỏi `pnpm-workspace.yaml` (chỉ dùng cục bộ).
