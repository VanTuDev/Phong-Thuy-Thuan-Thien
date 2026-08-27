"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ImageUploader from "@/components/ui/ImageUploader";
import EngineBadge from "@/components/ui/EngineBadge";
import { ApiError } from "@/lib/api";
import { readings, type MoleResult, type Reading } from "@/lib/endpoints";
import type { PreparedImage } from "@/lib/image";
import { useSession } from "@/components/session/SessionProvider";

type Phase = "empty" | "preview" | "scanning" | "done" | "error";

export default function MoleScanWorkspace() {
  const { isLoggedIn, wallet, setWallet } = useSession();
  const [phase, setPhase] = useState<Phase>("empty");
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const canScan = isLoggedIn && wallet.notRuoi > 0;
  const result = reading?.result as MoleResult | undefined;

  const reset = () => {
    setPhase("empty");
    setImage(null);
    setReading(null);
    setError(null);
    setActive(null);
  };

  const analyze = async () => {
    if (!image) return;
    setPhase("scanning");
    setError(null);
    try {
      const res = await readings.mole(image.dataUrl);
      setReading(res.reading);
      setWallet({ ...wallet, notRuoi: res.remaining });
      setPhase("done");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không thể luận giải. Vui lòng thử lại.");
      setPhase("error");
    }
  };

  return (
    <>
      {/* ── Cột trái ─────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center lg:col-span-7">
        <div className="relative aspect-[3/4] w-full max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low tho-pattern">
          {!isLoggedIn && <Gate kind="login" />}
          {isLoggedIn && !canScan && phase === "empty" && <Gate kind="credits" />}

          {isLoggedIn && canScan && phase === "empty" && (
            <ImageUploader
              onReady={(img) => {
                setImage(img);
                setPhase("preview");
              }}
              title="Tải ảnh khuôn mặt"
              hint="Chụp chính diện, đủ sáng, không đeo kính · JPG, PNG, WebP"
              icon="face_retouching_natural"
              className="h-full p-4"
            />
          )}

          {image && phase !== "empty" && (
            <div className="absolute inset-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.dataUrl}
                alt="Ảnh khuôn mặt đã tải lên"
                className={`h-full w-full object-cover transition-all duration-700 ${
                  phase === "done" ? "opacity-90" : "opacity-70 grayscale"
                }`}
              />
              <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px]" />

              {phase === "scanning" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_15px_5px_rgba(212,175,55,0.2)] motion-safe:animate-scan" />
              )}

              {phase === "done" &&
                result?.moles.map((mole, i) => (
                  <button
                    key={mole.id}
                    type="button"
                    onMouseEnter={() => setActive(mole.id)}
                    onMouseLeave={() => setActive(null)}
                    onFocus={() => setActive(mole.id)}
                    onBlur={() => setActive(null)}
                    className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-gold transition-all duration-300 motion-safe:animate-scale-in"
                    style={{
                      left: `${mole.x}%`,
                      top: `${mole.y}%`,
                      width: active === mole.id ? 20 : 13,
                      height: active === mole.id ? 20 : 13,
                      boxShadow:
                        active === mole.id
                          ? "0 0 22px rgba(212,175,55,0.85)"
                          : "0 0 10px rgba(212,175,55,0.5)",
                      animationDelay: `${i * 250}ms`,
                    }}
                    aria-label={`Nốt ruồi cung ${mole.name}`}
                  />
                ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex w-full max-w-lg gap-3">
          {phase === "preview" && (
            <button
              type="button"
              onClick={analyze}
              className="press flex flex-1 items-center justify-center gap-2 rounded-sm bg-gold py-4 font-label-caps text-label-caps uppercase tracking-widest text-on-gold transition-shadow hover:shadow-[0_0_24px_rgba(212,175,55,0.35)]"
            >
              <Icon name="auto_awesome" className="text-[18px]" />
              Bắt đầu phân tích
            </button>
          )}
          {phase === "scanning" && (
            <button
              type="button"
              disabled
              className="flex flex-1 items-center justify-center gap-2 rounded-sm bg-gold/60 py-4 font-label-caps text-label-caps uppercase tracking-widest text-on-gold"
            >
              <Icon name="progress_activity" className="animate-spin" />
              Đang phân tích…
            </button>
          )}
          {(phase === "done" || phase === "error") && (
            <button
              type="button"
              onClick={reset}
              className="press flex flex-1 items-center justify-center gap-2 rounded-sm border border-white/15 bg-surface-container-high py-4 font-label-caps text-label-caps text-on-surface hover:bg-surface-variant"
            >
              <Icon name="add_a_photo" />
              Phân tích ảnh khác
            </button>
          )}
        </div>
      </div>

      {/* ── Cột phải ─────────────────────────────────────────────────── */}
      <div className="relative flex flex-col gap-gutter lg:col-span-5">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-[100px]" />
        <div className="flex flex-grow flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8">
          <div className="mb-6 flex items-center justify-between border-b border-white/10 pb-4">
            <h2 className="font-headline-md text-headline-md text-white">Kết quả phân tích</h2>
            {phase === "done" && reading && <EngineBadge engine={reading.engine} />}
          </div>

          {phase === "done" && result ? (
            <div className="flex flex-grow flex-col space-y-4 overflow-y-auto pr-1">
              {reading?.summary && (
                <p className="rounded-xl border border-gold/20 bg-gold/[0.04] p-4 font-body-md text-sm text-on-surface motion-safe:animate-fade-in-up">
                  {reading.summary}
                </p>
              )}
              {result.moles.map((mole, i) => (
                <div
                  key={mole.id}
                  onMouseEnter={() => setActive(mole.id)}
                  onMouseLeave={() => setActive(null)}
                  className="flex cursor-default gap-4 rounded-xl border bg-surface-container-high p-5 transition-colors duration-300 motion-safe:animate-fade-in-up"
                  style={{
                    animationDelay: `${i * 90}ms`,
                    borderColor: active === mole.id ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border transition-colors"
                    style={{
                      borderColor: active === mole.id ? "rgba(212,175,55,0.6)" : "rgba(255,255,255,0.1)",
                      background: active === mole.id ? "rgba(212,175,55,0.12)" : "rgba(53,52,52,0.6)",
                    }}
                  >
                    <Icon name={mole.icon} className="text-xl text-gold" />
                  </div>
                  <div>
                    <h4 className="mb-1 font-headline-md text-[20px] leading-7 text-gold">{mole.name}</h4>
                    <p className="font-body-md text-sm text-on-surface-variant">{mole.desc}</p>
                  </div>
                </div>
              ))}
              <Link
                href="/lich-su"
                className="press mt-2 flex items-center justify-center gap-2 rounded-sm border border-white/15 py-3 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
              >
                <Icon name="history" className="text-[16px]" />
                Xem trong lịch sử
              </Link>
            </div>
          ) : phase === "scanning" ? (
            <div className="flex-grow space-y-4">
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-16 w-full rounded-xl" />
              <div className="skeleton h-16 w-full rounded-xl" />
              <p className="font-data-mono text-[12px] text-outline">AI đang xác định các cung vị…</p>
            </div>
          ) : phase === "error" ? (
            <div className="flex flex-grow flex-col items-center justify-center py-12 text-center">
              <Icon name="error" className="mb-4 text-4xl text-error" />
              <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
              <button
                type="button"
                onClick={analyze}
                className="press mt-6 rounded-sm border border-white/20 px-6 py-2.5 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="flex flex-grow flex-col">
              <div className="mb-6 flex items-center gap-2">
                <Icon name="auto_awesome" className="text-[18px] text-gold/70" />
                <h4 className="font-label-caps text-label-caps text-on-surface-variant">Bạn sẽ nhận được</h4>
              </div>
              <ul className="space-y-3">
                {[
                  { icon: "attach_money", t: "Cung Tài bạch", d: "Khả năng tích lũy, tài lộc" },
                  { icon: "work", t: "Cung Sự nghiệp", d: "Lãnh đạo, quý nhân phù trợ" },
                  { icon: "favorite", t: "Cung Tình duyên", d: "Đường tình cảm, thị phi" },
                ].map((row) => (
                  <li key={row.t} className="flex items-start gap-3 rounded-lg border border-white/5 bg-surface-container-high/60 p-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-variant/60 text-gold">
                      <Icon name={row.icon} className="text-[16px]" />
                    </span>
                    <div>
                      <p className="font-headline-md text-[17px] text-on-surface">{row.t}</p>
                      <p className="font-body-md text-sm text-on-surface-variant">{row.d}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-auto pt-6 font-body-md text-xs text-outline">
                AI xác định vị trí nốt ruồi theo cung vị trên khuôn mặt, không luận theo hình dạng.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Gate({ kind }: { kind: "login" | "credits" }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/10 bg-surface-container-lowest/60">
        <Icon name={kind === "login" ? "lock" : "bolt"} className="text-3xl text-gold/70" />
      </div>
      <div>
        <h3 className="font-headline-md text-headline-md text-white">
          {kind === "login" ? "Đăng nhập để bắt đầu" : "Bạn đã hết lượt xem Nốt ruồi"}
        </h3>
        <p className="mx-auto mt-2 max-w-xs font-body-md text-body-md text-on-surface-variant">
          {kind === "login"
            ? "Đăng nhập bằng Google và nạp lượt để AI phân tích khuôn mặt của bạn."
            : "Nạp thêm lượt để tiếp tục phân tích nốt ruồi."}
        </p>
      </div>
      <Link
        href={kind === "login" ? "/dang-nhap?next=/phan-tich-not-ruoi" : "/nap-luot"}
        className="press rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold transition-shadow hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >
        {kind === "login" ? "Đăng nhập" : "Nạp lượt xem"}
      </Link>
    </div>
  );
}
