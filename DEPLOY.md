# Deploy Frontend lên Vercel

App Next.js 15 (App Router). Vercel nhận diện tự động — không cần `vercel.json`.

## Môi trường env

| File | Có commit? | Dùng khi |
|---|---|---|
| `.env.local` | Không (`.gitignore`) | Dev cục bộ — ghi đè mọi file khác |
| `.env.production` | **Có** (chỉ chứa `NEXT_PUBLIC_*` — công khai) | `next build` / Vercel Production |
| `.env.example` | Có | Mẫu |

`.env.production` **được commit** vì chỉ có biến `NEXT_PUBLIC_*` (nằm sẵn trong
bundle trình duyệt, không phải bí mật). Sửa URL trong file này rồi push → Vercel
tự dùng. Hoặc đặt ở **Vercel → Settings → Environment Variables** (Dashboard thắng file).

## 1. Import project

1. [vercel.com](https://vercel.com) → **Add New → Project** → import
   `VanTuDev/Phong-Thuy-Thuan-Thien`.
2. Framework Preset: **Next.js** (tự nhận). Root Directory: `.`.
3. Package manager: **pnpm** (tự nhận từ `pnpm-lock.yaml`). Node: `.nvmrc` = 22.
   - Install: `pnpm install`
   - Build: `pnpm build` — chạy `prebuild` tải tài nguyên MediaPipe (~7.5MB) rồi `next build`.
   - Output: `.next`.

## 2. Environment Variables

Điền vào [`.env.production`](./.env.production) (rồi push) **hoặc** Vercel Dashboard
(cả Production + Preview):

```
NEXT_PUBLIC_API_URL=https://<ten-app>.onrender.com     # URL backend Render, KHÔNG có "/" cuối
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Google OAuth Client ID>  # = GOOGLE_CLIENT_ID ở backend
```

> `NEXT_PUBLIC_*` nhúng vào bundle lúc **build** → đổi giá trị phải **Redeploy**.
> `NEXT_PUBLIC_API_PORT` không cần khi đã set `NEXT_PUBLIC_API_URL`.

## 3. Sau khi có domain Vercel

1. **Backend (Render)** → Environment → đặt
   `CORS_ORIGIN=https://<ten-app>.vercel.app` (thêm `,*.vercel.app` nếu muốn
   preview deploy gọi được API) → redeploy.
2. **Google Cloud Console** → OAuth Client → *Authorized JavaScript origins* →
   thêm `https://<ten-app>.vercel.app` (+ domain custom nếu có). Thêm email vào
   *OAuth consent screen → Test users* nếu app đang ở chế độ Testing.
3. `next.config.mjs` tự thêm host của `NEXT_PUBLIC_API_URL` vào
   `images.remotePatterns`; ảnh Cloudinary + avatar `https://**` đã whitelist sẵn.

## 4. Kiểm tra

- Mở `https://<ten-app>.vercel.app` → landing hiển thị.
- `/dang-nhap` → nút Google thật (không phải form demo).
- Đăng nhập → `/phan-tich-chi-tay` tải ảnh → luận giải chạy (gọi Render OK, CORS OK).

## Ghi chú build

- `public/mediapipe/` bị `.gitignore` — `prebuild` tải lại mỗi lần build. Nếu
  Google Storage chặn khi build, tính năng dò chỉ tay client-side hiện hướng dẫn
  cấu hình; phần khác không ảnh hưởng (đường chỉ tay vẫn có nhờ Gemini).
- `pnpm build` (không MediaPipe) vẫn compile thành công.
