"use client";

import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import ImageUploader from "@/components/ui/ImageUploader";
import EngineBadge from "@/components/ui/EngineBadge";
import FaceMoleEditor, { type EditMole, newMoleId } from "@/components/sections/not-ruoi/FaceMoleEditor";
import { ApiError } from "@/lib/api";
import { readings, type MoleResult, type Reading } from "@/lib/endpoints";
import {
  faceMoleArea,
  faceMoleBilateral,
  FACE_MOLE_CHART_IMG,
  FACE_MOLE_COUNT,
} from "@/lib/faceMolePositions";
import type { PreparedImage } from "@/lib/image";
import { useSession } from "@/components/session/SessionProvider";

type Phase = "empty" | "scanning" | "mark" | "interpreting" | "done" | "error";
type Gender = "nam" | "nu";

export default function MoleScanWorkspace() {
  const { isLoggedIn, wallet, setWallet, refreshWallet } = useSession();
  const [phase, setPhase] = useState<Phase>("empty");
  const [gender, setGender] = useState<Gender | null>(null);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [moles, setMoles] = useState<EditMole[]>([]);
  const [scanNote, setScanNote] = useState("");
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [renumId, setRenumId] = useState<string | null>(null);
  const [renumBusy, setRenumBusy] = useState(false);
  const [chartZoom, setChartZoom] = useState(false);

  const canScan = isLoggedIn && wallet.notRuoi > 0;
  const result = reading?.result as MoleResult | undefined;
  const aspect = image ? image.width / image.height : 0.78;
  const ready = moles.filter((m) => m.n > 0);
  const pending = moles.length - ready.length;

  const reset = () => {
    setPhase("empty");
    setImage(null);
    setMoles([]);
    setScanNote("");
    setReading(null);
    setError(null);
    setRenumId(null);
  };

  const scan = async (img: PreparedImage) => {
    setImage(img);
    setMoles([]);
    setScanNote("");
    setPhase("scanning");
    try {
      const res = await readings.moleScan(img.dataUrl);
      setMoles(
        res.moles.map((m) => ({
          id: newMoleId(),
          n: m.number && m.number >= 1 && m.number <= FACE_MOLE_COUNT ? m.number : 0,
          side: m.side,
          x: m.x,
          y: m.y,
        })),
      );
      setScanNote(
        res.moles.length
          ? `AI dò được ${res.moles.length} nốt ruồi (số là GỢI Ý). Kiểm tra lại, thêm/xoá/sửa số cho đúng.${res.note ? " " + res.note : ""}`
          : "AI không thấy nốt ruồi rõ nào. Bạn tự chấm các nốt trên ảnh nếu có.",
      );
      setPhase("mark");
    } catch (err) {
      // Dò lỗi cũng không chặn — cho người xem tự chấm.
      setScanNote(
        err instanceof ApiError && err.status === 402
          ? err.message
          : "AI dò nốt tạm gián đoạn — bạn tự chấm các nốt ruồi trên ảnh nhé.",
      );
      setPhase("mark");
    }
  };

  const interpret = async () => {
    if (!image || !gender || pending > 0) return;
    setPhase("interpreting");
    setError(null);
    try {
      const spots = ready.map((m) => ({
        n: m.n,
        ...(m.side && faceMoleBilateral(m.n) ? { side: m.side } : {}),
        x: Math.round(m.x),
        y: Math.round(m.y),
      }));
      const res = await readings.mole(image.dataUrl, { gender, spots });
      setReading(res.reading);
      setWallet({ ...wallet, notRuoi: res.remaining });
      setPhase("done");
    } catch (err) {
      void refreshWallet();
      setError(err instanceof ApiError ? err.message : "Không thể luận giải. Vui lòng thử lại.");
      setPhase("error");
    }
  };

  const renumber = async (moleId: string, n: number, side?: "T" | "P") => {
    if (!reading) return;
    setRenumBusy(true);
    try {
      const res = await readings.moleRenumber(reading.id, moleId, n, side);
      setReading(res.reading);
      setRenumId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không chỉnh được. Thử lại sau.");
    } finally {
      setRenumBusy(false);
    }
  };

  return (
    <>
      {/* ── Cột trái: ảnh + editor ─────────────────────────────────── */}
      <div className="flex flex-col lg:col-span-7">
        <div className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low tho-pattern">
          {!isLoggedIn && <Gate kind="login" />}
          {isLoggedIn && !canScan && phase === "empty" && <Gate kind="credits" />}

          {isLoggedIn && canScan && phase === "empty" && (
            <div className="flex flex-col gap-4 p-4 sm:p-6">
              <div>
                <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">Bước 1 · Giới tính</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["nu", "nam"] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`press flex items-center justify-center gap-2 rounded-lg border py-3 font-label-caps text-label-caps transition-colors ${
                        gender === g
                          ? "border-gold/60 bg-gold/10 text-gold"
                          : "border-white/12 text-on-surface-variant hover:bg-white/5"
                      }`}
                    >
                      <Icon name={g === "nu" ? "woman" : "man"} className="text-[18px]" />
                      {g === "nu" ? "Nữ" : "Nam"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 font-body-md text-[11px] text-outline">
                  Nhiều ý nghĩa nốt ruồi khác nhau giữa nam và nữ.
                </p>
              </div>

              <div className={gender ? "" : "pointer-events-none opacity-40"}>
                <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant">Bước 2 · Ảnh khuôn mặt</p>
                <ImageUploader
                  onReady={scan}
                  title="Tải ảnh khuôn mặt"
                  hint="Chụp chính diện, đủ sáng, không đeo kính · JPG, PNG, WebP"
                  icon="face_retouching_natural"
                  className="min-h-[240px]"
                />
              </div>
            </div>
          )}

          {image && (phase === "scanning" || phase === "interpreting") && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt="Ảnh khuôn mặt" className="w-full opacity-60 grayscale" />
              {phase === "scanning" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-gold to-transparent shadow-[0_0_15px_5px_rgba(212,175,55,0.2)] motion-safe:animate-scan" />
              )}
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/40 backdrop-blur-[1px]">
                <Icon name="progress_activity" className="animate-spin text-3xl text-gold" />
                <p className="font-body-md text-sm text-on-surface">
                  {phase === "scanning"
                    ? "AI đang dò nốt ruồi trên khuôn mặt…"
                    : "Đang luận giải theo kiến thức nốt ruồi…"}
                </p>
              </div>
            </div>
          )}

          {image && phase === "mark" && (
            <div className="p-3 sm:p-4">
              <FaceMoleEditor photo={image.dataUrl} moles={moles} onChange={setMoles} aspect={aspect} />
            </div>
          )}

          {image && phase === "done" && result && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.dataUrl} alt="Ảnh khuôn mặt" className="w-full" />
              {result.moles.map((m) => (
                <span
                  key={m.id}
                  className="absolute z-10 flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-background bg-gold font-data-mono text-[10px] text-on-gold"
                  style={{ left: `${m.x}%`, top: `${m.y}%` }}
                >
                  {m.number ?? "•"}
                </span>
              ))}
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 p-12 text-center">
              <Icon name="error" className="text-4xl text-error" />
              <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
            </div>
          )}
        </div>

        {/* nút hành động */}
        <div className="mt-4 flex flex-wrap gap-3">
          {phase === "mark" && (
            <>
              <button
                type="button"
                onClick={interpret}
                disabled={pending > 0}
                className="press flex flex-1 items-center justify-center gap-2 rounded-sm bg-gold py-3.5 font-label-caps text-label-caps uppercase tracking-widest text-on-gold hover:shadow-[0_0_24px_rgba(212,175,55,0.35)] disabled:opacity-50"
              >
                <Icon name="check_circle" className="text-[18px]" />
                {pending > 0
                  ? `Còn ${pending} nốt chưa chọn số`
                  : ready.length
                    ? `Hoàn thành — phân tích ${ready.length} nốt`
                    : "Hoàn thành — không có nốt ruồi"}
              </button>
              <button
                type="button"
                onClick={reset}
                className="press tap-target flex items-center justify-center rounded-sm border border-white/20 px-4 text-on-surface hover:bg-white/5"
                title="Ảnh khác"
              >
                <Icon name="refresh" className="text-[18px]" />
              </button>
            </>
          )}
          {(phase === "done" || phase === "error") && (
            <button
              type="button"
              onClick={reset}
              className="press flex flex-1 items-center justify-center gap-2 rounded-sm border border-white/15 bg-surface-container-high py-3.5 font-label-caps text-label-caps text-on-surface hover:bg-surface-variant"
            >
              <Icon name="add_a_photo" /> Phân tích ảnh khác
            </button>
          )}
        </div>
        {phase === "mark" && (
          <p className="mt-3 font-body-md text-xs text-outline">Mỗi lần phân tích trừ 1 lượt xem Nốt ruồi.</p>
        )}
      </div>

      {/* ── Cột phải: sơ đồ mẫu / kết quả ─────────────────────────── */}
      <div className="relative flex flex-col gap-gutter lg:col-span-5">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gold/10 blur-[100px]" />
        <div className="flex flex-grow flex-col overflow-hidden rounded-2xl border border-white/10 bg-surface-container-low p-4 sm:p-6">
          <div className="mb-4 flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="font-headline-md text-[19px] text-white sm:text-headline-md">
              {phase === "mark" ? "Sơ đồ 78 vị trí" : "Kết quả luận giải"}
            </h2>
            {phase === "done" && reading && <EngineBadge engine={reading.engine} />}
          </div>

          {phase === "mark" ? (
            <div className="flex-grow space-y-3 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setChartZoom(true)}
                className="group relative block w-full overflow-hidden rounded-xl border border-white/10 bg-surface-container-lowest/60"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={FACE_MOLE_CHART_IMG}
                  alt="Sơ đồ 78 vị trí nốt ruồi khuôn mặt"
                  className="w-full"
                  draggable={false}
                />
                <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-white/15 bg-background/70 px-2 py-1 font-data-mono text-[10px] text-on-surface-variant backdrop-blur-sm">
                  <Icon name="zoom_in" className="text-[13px]" /> Phóng to
                </span>
              </button>
              {scanNote && (
                <p className="rounded-lg border border-white/10 bg-surface-container-lowest/60 p-3 font-body-md text-[12px] text-on-surface-variant">
                  <Icon name="auto_awesome" className="mr-1 text-[14px] text-gold/70" />
                  {scanNote}
                </p>
              )}
              <p className="font-body-md text-sm text-on-surface">
                AI đã chấm sẵn các nốt nó thấy (số là <b>gợi ý</b>). Đối chiếu sơ đồ này với khuôn mặt bạn:{" "}
                <b>sửa số cho đúng</b>, thêm nốt AI bỏ sót, xoá nốt sai — xong bấm <b>“Hoàn thành”</b>.
              </p>
              {ready.length > 0 && (
                <ul className="space-y-1.5">
                  {ready.map((m) => (
                    <li
                      key={m.id}
                      className="flex items-start gap-2.5 rounded-lg border border-white/8 bg-surface-container-high/50 p-2.5"
                    >
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 font-data-mono text-[11px] text-gold">
                        {m.n}
                      </span>
                      <p className="font-body-md text-[12px] text-on-surface-variant">
                        {faceMoleArea(m.n)}
                        {m.side ? ` — bên ${m.side === "T" ? "trái" : "phải"}` : ""}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : phase === "done" && result ? (
            <div className="flex flex-grow flex-col space-y-3 overflow-y-auto pr-1">
              {reading?.summary && (
                <p className="rounded-xl border border-gold/20 bg-gold/[0.04] p-3.5 font-body-md text-sm text-on-surface">
                  {reading.summary}
                </p>
              )}
              {result.moles.length === 0 && (
                <p className="rounded-xl border border-white/10 bg-surface-container-lowest/60 p-4 text-center font-body-md text-sm text-on-surface-variant">
                  Không có nốt ruồi nào được luận giải cho lượt này.
                </p>
              )}
              {result.moles.map((m) => (
                <div key={m.id} className="rounded-xl border border-white/5 bg-surface-container-high p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <h4 className="font-headline-md text-[15px] leading-tight text-gold">
                      {m.number ? `Nốt ruồi số ${m.number}` : "Nốt ruồi"} — {m.area ?? m.name}
                      {m.side ? ` (bên ${m.side === "T" ? "trái" : "phải"})` : ""}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setRenumId(renumId === m.id ? null : m.id)}
                      className="press shrink-0 font-data-mono text-[11px] text-outline hover:text-gold"
                    >
                      chỉnh số
                    </button>
                  </div>
                  {renumId === m.id ? (
                    <RenumberPad
                      current={m.number ?? 1}
                      busy={renumBusy}
                      side={m.side}
                      onPick={(n, s) => renumber(m.id, n, s)}
                    />
                  ) : (
                    <p className="font-body-md text-[13px] leading-relaxed text-on-surface-variant">{m.desc}</p>
                  )}
                </div>
              ))}
              <Link
                href="/lich-su"
                className="press mt-1 flex items-center justify-center gap-2 rounded-sm border border-white/15 py-3 font-label-caps text-label-caps text-on-surface hover:bg-white/5"
              >
                <Icon name="history" className="text-[16px]" /> Xem trong lịch sử
              </Link>
            </div>
          ) : (
            <div className="flex flex-grow flex-col justify-center gap-3 text-center">
              <Icon name="face_6" className="mx-auto text-4xl text-gold/40" />
              <p className="font-body-md text-sm text-on-surface-variant">
                Chọn giới tính và tải ảnh khuôn mặt. Bạn tự chấm các nốt ruồi trên ảnh của mình rồi chọn số theo
                sơ đồ 78 vị trí — hệ thống luận giải theo kho kiến thức nốt ruồi.
              </p>
            </div>
          )}
        </div>
      </div>

      {chartZoom && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-background/92 p-3 backdrop-blur-sm"
          onClick={() => setChartZoom(false)}
        >
          <div className="relative max-h-full max-w-full overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={FACE_MOLE_CHART_IMG}
              alt="Sơ đồ 78 vị trí nốt ruồi khuôn mặt"
              className="w-[min(1000px,95vw)] max-w-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            type="button"
            onClick={() => setChartZoom(false)}
            className="press absolute right-3 top-3 rounded-full border border-white/20 bg-surface-container p-1.5 text-white"
            aria-label="Đóng"
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </>
  );
}

function RenumberPad({
  current,
  busy,
  side,
  onPick,
}: {
  current: number;
  busy: boolean;
  side?: "T" | "P";
  onPick: (n: number, side?: "T" | "P") => void;
}) {
  const [n, setN] = useState(current);
  const [s, setS] = useState<"T" | "P" | undefined>(side);
  return (
    <div className="rounded-lg border border-gold/25 bg-gold/[0.04] p-2.5">
      <div className="grid grid-cols-8 gap-1">
        {Array.from({ length: FACE_MOLE_COUNT }, (_, i) => i + 1).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setN(v)}
            className={`flex h-7 items-center justify-center rounded font-data-mono text-[11px] ${
              n === v ? "bg-gold text-on-gold" : "border border-white/12 text-on-surface-variant hover:text-gold"
            }`}
          >
            {v}
          </button>
        ))}
      </div>
      <p className="mt-2 font-body-md text-[11px] text-on-surface-variant">
        <span className="text-gold">Số {n}</span>: {faceMoleArea(n)}
      </p>
      <div className="mt-2 flex items-center gap-2">
        {faceMoleBilateral(n) && (
          <div className="flex overflow-hidden rounded border border-white/15">
            {(["T", "P"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setS(v)}
                className={`px-2 py-1 font-data-mono text-[11px] ${
                  s === v ? "bg-gold text-on-gold" : "text-on-surface-variant"
                }`}
              >
                {v === "T" ? "Trái" : "Phải"}
              </button>
            ))}
          </div>
        )}
        <button
          type="button"
          disabled={busy}
          onClick={() => onPick(n, faceMoleBilateral(n) ? s : undefined)}
          className="press flex flex-1 items-center justify-center gap-1.5 rounded bg-gold py-2 font-label-caps text-[11px] text-on-gold disabled:opacity-60"
        >
          {busy ? (
            <Icon name="progress_activity" className="animate-spin text-[14px]" />
          ) : (
            <Icon name="check" className="text-[14px]" />
          )}
          Luận lại theo số {n}
        </button>
      </div>
    </div>
  );
}

function Gate({ kind }: { kind: "login" | "credits" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-5 p-12 text-center">
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
        className="press rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold hover:shadow-[0_0_20px_rgba(212,175,55,0.3)]"
      >
        {kind === "login" ? "Đăng nhập" : "Nạp lượt xem"}
      </Link>
    </div>
  );
}
