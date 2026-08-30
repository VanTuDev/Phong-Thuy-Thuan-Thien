"use client";

import { useState } from "react";
import Icon from "@/components/ui/Icon";
import type { MoleMode } from "@/lib/endpoints";

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
}

const MODES: { id: MoleMode; label: string; icon: string; hint: string }[] = [
  { id: "declared", label: "Tôi biết vị trí", icon: "touch_app", hint: "Chấm số ô có nốt ruồi trên sơ đồ" },
  { id: "search", label: "Không rõ — để AI tìm", icon: "search", hint: "AI tự quét ảnh tìm nốt ruồi" },
  { id: "none", label: "Không có nốt ruồi", icon: "block", hint: "Bỏ qua phần nốt ruồi" },
];

export default function MolePicker({ chartSrc, chartAlt, count, where, value, onChange }: Props) {
  const [zoom, setZoom] = useState(false);

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
              Chấm số ô có nốt ruồi ({count} vị trí)
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
          {value.positions.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ mode: "declared", positions: [] })}
              className="press mt-1.5 font-data-mono text-[11px] text-outline hover:text-white"
            >
              Bỏ chọn tất cả
            </button>
          )}
        </div>
      )}

      {value.mode === "search" && (
        <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-surface-container-lowest/60 px-3 py-2 font-body-md text-[12px] text-on-surface-variant">
          <Icon name="auto_awesome" className="mt-0.5 shrink-0 text-[15px] text-gold/70" />
          AI sẽ tự quét ảnh {where}, tìm các nốt ruồi rõ nhất và luận giải theo cung vị.
        </p>
      )}
      {value.mode === "none" && (
        <p className="flex items-start gap-2 rounded-lg border border-white/10 bg-surface-container-lowest/60 px-3 py-2 font-body-md text-[12px] text-on-surface-variant">
          <Icon name="info" className="mt-0.5 shrink-0 text-[15px] text-outline" />
          Sẽ bỏ qua phần luận giải nốt ruồi trên {where}.
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
