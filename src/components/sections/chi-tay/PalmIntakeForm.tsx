"use client";

import { useMemo, useState } from "react";
import Icon from "@/components/ui/Icon";
import PalmRegionDiagram from "@/components/sections/chi-tay/PalmRegionDiagram";
import { handLabel, moleHand, PALM_REGIONS } from "@/lib/palmRegions";
import type { PalmIntake } from "@/lib/endpoints";

const FIELD =
  "w-full rounded-lg border border-white/15 bg-surface-container-lowest/70 px-3.5 py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-gold/60";

function isoDaysAgo(years: number): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

export default function PalmIntakeForm({
  initial,
  onComplete,
}: {
  initial?: PalmIntake | null;
  onComplete: (intake: PalmIntake) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [dob, setDob] = useState(initial?.dob ?? "");
  const [gender, setGender] = useState<"nam" | "nu" | null>(initial?.gender ?? null);
  const [moles, setMoles] = useState<number[]>(initial?.handMoles ?? []);
  const [noMoles, setNoMoles] = useState<boolean>(
    initial ? initial.handMoles.length === 0 : false,
  );
  const [imgFailed, setImgFailed] = useState(false);

  const hand = gender ? moleHand(gender) : null;
  const dobValid = /^\d{4}-\d{2}-\d{2}$/.test(dob);
  const moleAnswered = noMoles || moles.length > 0;
  const canSubmit = name.trim().length > 0 && dobValid && !!gender && moleAnswered;

  const maxDob = useMemo(() => isoDaysAgo(5), []);
  const minDob = useMemo(() => isoDaysAgo(120), []);

  const toggleRegion = (n: number) => {
    setNoMoles(false);
    setMoles((prev) => (prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n].sort((a, b) => a - b)));
  };

  const submit = () => {
    if (!canSubmit || !gender) return;
    onComplete({
      name: name.trim(),
      dob,
      gender,
      hand: moleHand(gender),
      handMoles: noMoles ? [] : moles,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-5 sm:p-7">
      <header>
        <h3 className="font-headline-md text-headline-md text-white">Trước khi bắt đầu</h3>
        <p className="mt-1 font-body-md text-sm text-on-surface-variant">
          Vài thông tin giúp Modern Sage luận giải sát với bạn hơn (tuổi, cung mệnh Bát Trạch,
          nốt ruồi trên tay). Bắt buộc trước khi tải ảnh.
        </p>
      </header>

      {/* Họ tên */}
      <label className="block">
        <span className="mb-1.5 block font-label-caps text-label-caps text-on-surface-variant">Họ và tên</span>
        <input
          className={FIELD}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
          maxLength={80}
          autoComplete="name"
        />
      </label>

      {/* Ngày sinh */}
      <label className="block">
        <span className="mb-1.5 block font-label-caps text-label-caps text-on-surface-variant">Ngày tháng năm sinh</span>
        <input
          type="date"
          className={`${FIELD} [color-scheme:dark]`}
          value={dob}
          min={minDob}
          max={maxDob}
          onChange={(e) => setDob(e.target.value)}
        />
      </label>

      {/* Giới tính */}
      <div>
        <span className="mb-1.5 block font-label-caps text-label-caps text-on-surface-variant">Giới tính</span>
        <div className="grid grid-cols-2 gap-2">
          {(["nam", "nu"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`press flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-label-caps text-label-caps transition-colors ${
                gender === g
                  ? "border-gold/50 bg-gold/10 text-gold"
                  : "border-white/15 text-on-surface hover:bg-white/5"
              }`}
            >
              <Icon name={g === "nam" ? "male" : "female"} className="text-[16px]" />
              {g === "nam" ? "Nam" : "Nữ"}
            </button>
          ))}
        </div>
        {hand && (
          <p className="mt-2 flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/[0.07] px-3 py-2 font-body-md text-sm text-gold/90 motion-safe:animate-fade-in">
            <Icon name="back_hand" className={`text-[18px] ${hand === "trai" ? "-scale-x-100" : ""}`} />
            Bạn sẽ chụp <b>lòng bàn tay {handLabel(hand).toUpperCase()}</b> (quy ước nam xem tay
            trái, nữ xem tay phải).
          </p>
        )}
      </div>

      {/* Nốt ruồi trên tay */}
      <div>
        <span className="mb-1.5 block font-label-caps text-label-caps text-on-surface-variant">
          Trên bàn tay bạn có nốt ruồi ở khu vực số mấy?
        </span>

        <div className="mb-3 overflow-hidden rounded-xl border border-white/10 bg-surface-container-lowest/60">
          <div className="relative mx-auto aspect-[4/3] w-full max-w-sm">
            {hand && !imgFailed ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/palm-regions/${hand === "trai" ? "left" : "right"}.png`}
                alt={`Sơ đồ vùng nốt ruồi — bàn tay ${handLabel(hand)}`}
                className="absolute inset-0 h-full w-full object-contain"
                onError={() => setImgFailed(true)}
              />
            ) : (
              <PalmRegionDiagram side={hand ?? "phai"} active={noMoles ? [] : moles} onToggle={toggleRegion} />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
          {PALM_REGIONS.map((r) => {
            const on = !noMoles && moles.includes(r.n);
            return (
              <button
                key={r.n}
                type="button"
                onClick={() => toggleRegion(r.n)}
                className={`press flex items-center gap-2 rounded-lg border px-3 py-2 text-left font-body-md text-sm transition-colors ${
                  on
                    ? "border-gold/50 bg-gold/10 text-gold"
                    : "border-white/10 text-on-surface-variant hover:bg-white/5"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-data-mono text-[11px] ${
                    on ? "bg-gold text-on-gold" : "border border-gold/40 text-gold/80"
                  }`}
                >
                  {r.n}
                </span>
                <span className="truncate">{r.name}</span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => {
            setNoMoles(true);
            setMoles([]);
          }}
          className={`press mt-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 font-label-caps text-label-caps transition-colors ${
            noMoles
              ? "border-gold/50 bg-gold/10 text-gold"
              : "border-white/15 text-on-surface hover:bg-white/5"
          }`}
        >
          <Icon name={noMoles ? "check" : "block"} className="text-[16px]" />
          Không có nốt ruồi trên tay
        </button>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="press mt-1 flex items-center justify-center gap-2 rounded-sm bg-gold px-6 py-3.5 font-label-caps text-label-caps text-on-gold transition-shadow hover:shadow-[0_0_24px_rgba(212,175,55,0.35)] disabled:opacity-40 disabled:hover:shadow-none"
      >
        <Icon name="arrow_forward" className="text-[18px]" />
        Tiếp tục — tải ảnh lòng bàn tay
      </button>
    </div>
  );
}
