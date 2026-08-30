"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import MolePicker, { type MolePickValue } from "@/components/ui/MolePicker";
import { handLabel, moleHand, HAND_CHART_IMG, HAND_MOLE_ZONES } from "@/lib/palmRegions";
import type { PalmIntake } from "@/lib/endpoints";

const FIELD =
  "w-full rounded-lg border border-white/15 bg-surface-container-lowest/70 px-3.5 py-2.5 font-body-md text-sm text-on-surface outline-none transition-colors focus:border-gold/60 sm:text-body-md";

const MIN_AGE = 5;
const MAX_AGE = 120;

/** Ghép ngày/tháng/năm rời thành "YYYY-MM-DD"; trả "" nếu không hợp lệ (lịch sai hoặc tuổi ngoài 5–120). */
function composeDob(day: string, month: string, year: string): string {
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);
  if (!Number.isInteger(d) || !Number.isInteger(m) || !Number.isInteger(y)) return "";
  if (m < 1 || m > 12 || d < 1 || d > 31 || year.length !== 4) return "";
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return "";
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() < m - 1 || (now.getMonth() === m - 1 && now.getDate() < d)) age -= 1;
  if (age < MIN_AGE || age > MAX_AGE) return "";
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const onlyDigits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

export default function PalmIntakeForm({
  initial,
  onComplete,
}: {
  initial?: PalmIntake | null;
  onComplete: (intake: PalmIntake) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [initY, initM, initD] = (initial?.dob ?? "").split("-");
  const [day, setDay] = useState(initD ? String(Number(initD)) : "");
  const [month, setMonth] = useState(initM ? String(Number(initM)) : "");
  const [year, setYear] = useState(initY ?? "");
  const [gender, setGender] = useState<"nam" | "nu" | null>(initial?.gender ?? null);
  const [mole, setMole] = useState<MolePickValue>({
    // Mặc định: để AI tự tìm nốt ruồi trên ảnh — không bắt người dùng chấm thủ công.
    mode: initial?.handMoleMode ?? (initial?.handMoles?.length ? "declared" : "search"),
    positions: initial?.handMoles ?? [],
  });

  const hand = gender ? moleHand(gender) : null;
  const dob = composeDob(day, month, year);
  const dobTouched = day !== "" || month !== "" || year !== "";
  const canSubmit = name.trim().length > 0 && dob !== "" && !!gender;

  const submit = () => {
    if (!canSubmit || !gender) return;
    onComplete({
      name: name.trim(),
      dob,
      gender,
      hand: moleHand(gender),
      handMoles: mole.mode === "declared" ? mole.positions : [],
      handMoleMode: mole.mode,
    });
  };

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4 sm:p-6">
      <header>
        <h3 className="font-headline-md text-[19px] text-white sm:text-headline-md">Trước khi bắt đầu</h3>
        <p className="mt-1 font-body-md text-xs text-on-surface-variant sm:text-sm">
          Vài thông tin giúp Thuận Thiên luận giải sát với bạn hơn: tuổi, giới tính và nốt ruồi
          trên tay.
        </p>
      </header>

      {/* Họ tên */}
      <label className="block">
        <span className="mb-1.5 block font-label-caps text-[11px] text-on-surface-variant sm:text-label-caps">
          Họ và tên
        </span>
        <input
          className={FIELD}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nguyễn Văn A"
          maxLength={80}
          autoComplete="name"
        />
      </label>

      {/* Ngày sinh — nhập số cho nhanh, không dùng lịch bật lên */}
      <div>
        <span className="mb-1.5 block font-label-caps text-[11px] text-on-surface-variant sm:text-label-caps">
          Ngày tháng năm sinh
        </span>
        <div className="grid grid-cols-3 gap-2">
          <input
            className={`${FIELD} text-center`}
            value={day}
            onChange={(e) => setDay(onlyDigits(e.target.value, 2))}
            inputMode="numeric"
            placeholder="Ngày"
            aria-label="Ngày sinh"
          />
          <input
            className={`${FIELD} text-center`}
            value={month}
            onChange={(e) => setMonth(onlyDigits(e.target.value, 2))}
            inputMode="numeric"
            placeholder="Tháng"
            aria-label="Tháng sinh"
          />
          <input
            className={`${FIELD} text-center`}
            value={year}
            onChange={(e) => setYear(onlyDigits(e.target.value, 4))}
            inputMode="numeric"
            placeholder="Năm"
            aria-label="Năm sinh"
          />
        </div>
        {dobTouched && dob === "" && (
          <p className="mt-1.5 font-body-md text-[11px] text-error/90">
            Ngày sinh chưa hợp lệ (tuổi từ {MIN_AGE}–{MAX_AGE}). Ví dụ: 15 · 8 · 1995.
          </p>
        )}
      </div>

      {/* Giới tính */}
      <div>
        <span className="mb-1.5 block font-label-caps text-[11px] text-on-surface-variant sm:text-label-caps">
          Giới tính
        </span>
        <div className="grid grid-cols-2 gap-2">
          {(["nam", "nu"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGender(g)}
              className={`press flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 font-label-caps text-[11px] transition-colors sm:text-label-caps ${
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
          <p className="mt-2 flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/[0.07] px-3 py-2 font-body-md text-[12px] text-gold/90 motion-safe:animate-fade-in sm:text-sm">
            <Icon name="back_hand" className={`text-[18px] ${hand === "trai" ? "-scale-x-100" : ""}`} />
            Bạn sẽ chụp <b>lòng bàn tay {handLabel(hand).toUpperCase()}</b> (nam xem tay trái, nữ xem
            tay phải).
          </p>
        )}
      </div>

      {/* Nốt ruồi trên tay */}
      <div>
        <span className="mb-1.5 block font-label-caps text-[11px] text-on-surface-variant sm:text-label-caps">
          Nốt ruồi trên lòng bàn tay
        </span>
        <MolePicker
          chartSrc={HAND_CHART_IMG}
          chartAlt="Sơ đồ 50 ô nốt ruồi trên lòng bàn tay"
          count={HAND_MOLE_ZONES}
          where="bàn tay"
          value={mole}
          onChange={setMole}
        />
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
