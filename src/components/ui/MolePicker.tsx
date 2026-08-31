"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import type { MoleMode } from "@/lib/endpoints";
import type { HandMoleZone } from "@/lib/palmMoleMap";

export interface MolePickValue {
  mode: MoleMode;
  positions: number[];
}

interface Props {
  chartSrc: string;
  chartAlt: string;
  /** số ô tối đa (78 = mặt, 50 = tay) */
  count: number;
  /** "khuôn mặt" | "bàn tay" */
  where: string;
  value: MolePickValue;
  onChange: (v: MolePickValue) => void;
  /**
   * Sơ đồ đã số hoá (toạ độ từng ô trên ảnh) — khi có, chế độ "tự chấm" hiện các
   * chấm bấm được ĐÚNG vị trí trên ảnh thay vì bảng số rời. Hiện chỉ bàn tay có.
   */
  zones?: HandMoleZone[];
  /** true (lòng bàn tay): KHÔNG dùng từ "nốt ruồi" trong nhãn — gọi là "điểm cần lưu ý". */
  hideMoleWord?: boolean;
}

const MODES_MOLE: { id: MoleMode; label: string; icon: string; hint: string }[] = [
  { id: "search", label: "Để AI tự tìm", icon: "auto_awesome", hint: "AI quét ảnh, tự xác định vị trí nốt ruồi" },
  { id: "declared", label: "Tôi tự chấm vị trí", icon: "touch_app", hint: "Chấm vị trí có nốt ruồi trên sơ đồ" },
  { id: "none", label: "Không có nốt ruồi", icon: "block", hint: "Bỏ qua phần nốt ruồi" },
];
const MODES_PALM: { id: MoleMode; label: string; icon: string; hint: string }[] = [
  { id: "search", label: "Để AI tự xem", icon: "auto_awesome", hint: "AI tự quan sát lòng bàn tay" },
  { id: "declared", label: "Tôi tự đánh dấu", icon: "touch_app", hint: "Đánh dấu điểm cần lưu ý trên sơ đồ" },
  { id: "none", label: "Không có", icon: "block", hint: "Bỏ qua phần này" },
];

export default function MolePicker({
  chartSrc,
  chartAlt,
  count,
  where,
  value,
  onChange,
  zones,
  hideMoleWord,
}: Props) {
  const MODES = hideMoleWord ? MODES_PALM : MODES_MOLE;
  const noun = hideMoleWord ? "điểm cần lưu ý" : "nốt ruồi";
  const [zoom, setZoom] = useState(false);
  const [useGrid, setUseGrid] = useState(false);

  const setMode = (mode: MoleMode) =>
    onChange({ mode, positions: mode === "declared" ? value.positions : [] });

  const toggle = (n: number) => {
    const has = value.positions.includes(n);
    onChange({
      mode: "declared",
      positions: has
        ? value.positions.filter((x) => x !== n)
        : [...value.positions, n].sort((a, b) => a - b),
    });
  };

  const zoneOf = (n: number) => zones?.find((z) => z.n === n);
  const mappedPicker = zones && zones.length > 0 && !useGrid;

  return (
    <div className="space-y-3">
      {/* chọn cách khai */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {MODES.map((m) => {
          const on = value.mode === m.id;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              className={`press flex flex-col items-start gap-0.5 rounded-lg border px-3 py-2 text-left transition-colors ${
                on ? "border-gold/60 bg-gold/10 text-gold" : "border-white/12 text-on-surface-variant hover:bg-white/5"
              }`}
            >
              <span className="flex items-center gap-1.5 font-label-caps text-[11px] sm:text-label-caps">
                <Icon name={on ? "check_circle" : m.icon} className="text-[15px]" />
                {m.label}
              </span>
              <span className="font-body-md text-[11px] leading-tight text-outline">{m.hint}</span>
            </button>
          );
        })}
      </div>

      {/* ── Sơ đồ đã số hoá: chấm bấm được ngay trên ảnh ──────────────────── */}
      {value.mode === "declared" && mappedPicker ? (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-label-caps text-[11px] text-on-surface-variant">
              Bấm vào ô có {noun} trên {where}
            </span>
            <span className="font-data-mono text-[11px] text-gold">Đã chọn: {value.positions.length}</span>
          </div>

          <div className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-container-lowest/60">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={chartSrc} alt={chartAlt} className="block w-full select-none" draggable={false} />
            {zones!.map((z) => {
              const on = value.positions.includes(z.n);
              return (
                <button
                  key={z.n}
                  type="button"
                  onClick={() => toggle(z.n)}
                  title={z.area}
                  aria-label={`Ô ${z.n} — ${z.area}`}
                  aria-pressed={on}
                  style={{ left: `${z.x * 100}%`, top: `${z.y * 100}%` }}
                  className={`absolute flex h-[22px] w-[22px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border font-data-mono text-[10px] leading-none transition-colors ${
                    on
                      ? "border-gold bg-gold text-on-gold shadow-[0_0_0_3px_rgba(212,175,55,0.25)]"
                      : "border-white/45 bg-background/55 text-white/90 backdrop-blur-[1px] hover:border-gold/70 hover:bg-background/80"
                  }`}
                >
                  {z.n}
                </button>
              );
            })}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="press flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 font-data-mono text-[10px] text-on-surface-variant hover:text-gold"
            >
              <Icon name="zoom_in" className="text-[13px]" /> Phóng to
            </button>
            <button
              type="button"
              onClick={() => setUseGrid(true)}
              className="press flex items-center gap-1 rounded-full border border-white/15 px-2.5 py-1 font-data-mono text-[10px] text-on-surface-variant hover:text-gold"
            >
              <Icon name="grid_on" className="text-[13px]" /> Dùng bảng số
            </button>
            {value.positions.length > 0 && (
              <button
                type="button"
                onClick={() => onChange({ mode: "declared", positions: [] })}
                className="press font-data-mono text-[10px] text-outline hover:text-white"
              >
                Bỏ chọn tất cả
              </button>
            )}
          </div>

          {value.positions.length > 0 && (
            <ul className="mt-2 space-y-1">
              {value.positions.map((n) => (
                <li key={n} className="flex items-start gap-2 font-body-md text-[11px] text-on-surface-variant">
                  <Icon name="spa" className="mt-0.5 shrink-0 text-[12px] text-gold/60" />
                  {zoneOf(n)?.area ?? `Ô số ${n}`}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : (
        <>
          {/* sơ đồ tham chiếu */}
          <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-container-lowest/60">
            <button
              type="button"
              onClick={() => setZoom(true)}
              className="group relative block w-full"
              aria-label="Phóng to sơ đồ"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={chartSrc}
                alt={chartAlt}
                className={`mx-auto w-full object-contain transition-opacity ${
                  value.mode === "declared" ? "max-h-[46vh]" : "max-h-[30vh] opacity-70"
                }`}
              />
              <span className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full border border-white/15 bg-background/70 px-2 py-1 font-data-mono text-[10px] text-on-surface-variant backdrop-blur-sm">
                <Icon name="zoom_in" className="text-[13px]" />
                Phóng to
              </span>
            </button>
          </div>

          {value.mode === "declared" && (
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-label-caps text-[11px] text-on-surface-variant">
                  Chấm số ô có {noun} ({count} vị trí)
                </span>
                <span className="font-data-mono text-[11px] text-gold">
                  Đã chọn: {value.positions.length}
                </span>
              </div>
              <div className="grid max-h-[42vh] grid-cols-8 gap-1.5 overflow-y-auto rounded-lg border border-white/10 bg-surface-container-lowest/60 p-2 sm:grid-cols-10">
                {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
                  const on = value.positions.includes(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => toggle(n)}
                      className={`press flex h-8 items-center justify-center rounded font-data-mono text-[12px] transition-colors ${
                        on
                          ? "bg-gold text-on-gold"
                          : "border border-white/12 text-on-surface-variant hover:border-gold/40 hover:text-gold"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-3">
                {zones && zones.length > 0 && useGrid && (
                  <button
                    type="button"
                    onClick={() => setUseGrid(false)}
                    className="press font-data-mono text-[11px] text-outline hover:text-white"
                  >
                    ← Chấm trực tiếp trên ảnh
                  </button>
                )}
                {value.positions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => onChange({ mode: "declared", positions: [] })}
                    className="press font-data-mono text-[11px] text-outline hover:text-white"
                  >
                    Bỏ chọn tất cả
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {value.mode === "search" && (
        <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-surface-container-lowest/60 px-3 py-2 font-body-md text-[12px] text-on-surface-variant">
          <Icon name="auto_awesome" className="mt-0.5 shrink-0 text-[15px] text-gold/70" />
          AI sẽ tự quan sát ảnh {where} và luận giải theo từng vùng.
        </p>
      )}
      {value.mode === "none" && (
        <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-surface-container-lowest/60 px-3 py-2 font-body-md text-[12px] text-on-surface-variant">
          <Icon name="info" className="mt-0.5 shrink-0 text-[15px] text-outline" />
          Sẽ bỏ qua phần luận giải theo vùng trên {where}.
        </p>
      )}

      {/* lightbox */}
      {zoom && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/90 p-3 backdrop-blur-sm"
          onClick={() => setZoom(false)}
        >
          <div className="relative max-h-full max-w-full overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={chartSrc}
              alt={chartAlt}
              className="w-[min(1100px,180vw)] max-w-none"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <button
            type="button"
            onClick={() => setZoom(false)}
            className="press tap-target absolute right-3 top-3 flex items-center justify-center rounded-full border border-white/20 bg-surface-container text-white"
            aria-label="Đóng"
          >
            <Icon name="close" />
          </button>
        </div>
      )}
    </div>
  );
}
