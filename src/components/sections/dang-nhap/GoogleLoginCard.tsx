"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Icon from "@/components/ui/Icon";
import Bagua from "@/components/ui/Bagua";
import { ApiError, GOOGLE_CLIENT_ID } from "@/lib/api";
import { useSession } from "@/components/session/SessionProvider";

type Phase = "idle" | "authenticating" | "success";

export default function GoogleLoginCard() {
  const { loginWithGoogle, loginAsGuest, guestLoginEnabled, online } = useSession();
  const router = useRouter();
  const params = useSearchParams();
  const nextPath = params.get("next") || "/";

  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [guestName, setGuestName] = useState("");
  const gsiRef = useRef<HTMLDivElement>(null);

  const finishLogin = useCallback(() => {
    setPhase("success");
    window.setTimeout(() => router.push(nextPath), 700);
  }, [router, nextPath]);

  const handleError = useCallback((err: unknown, fallback: string) => {
    setPhase("idle");
    setError(err instanceof ApiError ? err.message : fallback);
  }, []);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !gsiRef.current) return;
    const scriptId = "gsi-script";

    const mount = () => {
      const google = (window as { google?: any }).google;
      if (!google?.accounts?.id || !gsiRef.current) return;
      google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          setError(null);
          setPhase("authenticating");
          try {
            await loginWithGoogle(resp.credential);
            finishLogin();
          } catch (err) {
            handleError(err, "Xác thực Google thất bại.");
          }
        },
      });
      google.accounts.id.renderButton(gsiRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: 300,
        text: "continue_with",
        logo_alignment: "center",
      });
    };

    if (document.getElementById(scriptId)) {
      mount();
    } else {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.async = true;
      s.id = scriptId;
      s.onload = mount;
      document.head.appendChild(s);
    }
  }, [loginWithGoogle, finishLogin, handleError]);

  const onGuest = async () => {
    setError(null);
    setPhase("authenticating");
    try {
      await loginAsGuest(guestName);
      finishLogin();
    } catch (err) {
      handleError(err, "Đăng nhập khách thất bại.");
    }
  };

  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low p-8 motion-safe:animate-scale-in sm:p-10">
      <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-gold/10 blur-[100px]" />
      <Bagua className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 text-gold/[0.07]" />

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-6">
          <Bagua className="h-14 w-14 text-gold" spin={false} yinYang />
        </div>
        <h1 className="font-headline-lg text-headline-lg text-white">Modern Sage</h1>
        <p className="mb-8 mt-2 font-body-md text-body-md text-on-surface-variant">
          Đăng nhập bằng Google để lưu lượt xem, lịch sử luận giải và tiếp tục hành trình thấu hiểu
          vận mệnh.
        </p>

        {online === false && (
          <p className="mb-6 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/20 px-4 py-3 text-left font-body-md text-sm text-error">
            <Icon name="cloud_off" className="shrink-0 text-[18px]" />
            Chưa kết nối được máy chủ. Hãy khởi động Backend-Thuan-Thien rồi thử lại.
          </p>
        )}

        {phase === "success" ? (
          <div className="flex w-full items-center justify-center gap-3 rounded-full bg-wood/10 py-3.5 text-wood">
            <Icon name="check_circle" className="text-[18px]" />
            <span className="font-body-md text-body-md">Đăng nhập thành công</span>
          </div>
        ) : (
          <div className="flex w-full flex-col items-center gap-4">
            {GOOGLE_CLIENT_ID ? (
              <div className="flex min-h-[44px] w-full flex-col items-center gap-3">
                <div ref={gsiRef} className="flex justify-center [color-scheme:light]" />
              </div>
            ) : (
              <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-surface-container px-4 py-3 text-left font-body-md text-sm text-on-surface-variant">
                <Icon name="settings" className="mt-0.5 shrink-0 text-[16px]" />
                Chưa cấu hình Google OAuth. Đặt{" "}
                <code className="mx-1 text-gold">NEXT_PUBLIC_GOOGLE_CLIENT_ID</code> ở
                <code className="mx-1 text-gold">frontend/.env.local</code> và
                <code className="mx-1 text-gold">GOOGLE_CLIENT_ID</code> ở backend.
              </p>
            )}

            {guestLoginEnabled && (
              <div className="w-full">
                {GOOGLE_CLIENT_ID && (
                  <div className="my-3 flex items-center gap-3">
                    <span className="h-px flex-1 bg-white/10" />
                    <span className="font-data-mono text-[11px] uppercase tracking-wider text-outline">
                      hoặc
                    </span>
                    <span className="h-px flex-1 bg-white/10" />
                  </div>
                )}
                <label
                  htmlFor="guest-name"
                  className="mb-1.5 block text-left font-data-mono text-[11px] uppercase tracking-wide text-outline"
                >
                  Tên hiển thị (tùy chọn)
                </label>
                <input
                  id="guest-name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && phase === "idle") void onGuest();
                  }}
                  maxLength={40}
                  placeholder="Khách tham quan"
                  className="mb-3 w-full rounded-lg border border-white/10 bg-surface-container-lowest px-4 py-2.5 font-body-md text-body-md text-on-surface placeholder:text-outline focus:border-gold/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={onGuest}
                  disabled={phase === "authenticating" || online === false}
                  className="press flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-3 font-label-caps text-label-caps text-on-surface transition-colors hover:bg-white/5 disabled:opacity-50"
                >
                  <Icon name="visibility" className="text-[16px]" />
                  Tiếp tục với tư cách khách
                </button>
                <p className="mt-2 text-left font-body-md text-xs text-outline">
                  Chế độ xem thử — được tặng sẵn vài lượt luận giải. Lịch sử lưu theo tên bạn nhập.
                </p>
              </div>
            )}

            {phase === "authenticating" && (
              <span className="flex items-center gap-2 text-on-surface-variant">
                <Icon name="progress_activity" className="animate-spin text-[18px]" /> Đang xác thực…
              </span>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 flex items-start gap-2 font-body-md text-sm text-error">
            <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
            {error}
          </p>
        )}

        <p className="mt-8 font-data-mono text-[11px] leading-relaxed text-outline">
          Đăng nhập an toàn qua Google Identity Services. Trí tuệ AI là người dẫn đường, không phải
          định mệnh tuyệt đối.
        </p>
      </div>
    </div>
  );
}
