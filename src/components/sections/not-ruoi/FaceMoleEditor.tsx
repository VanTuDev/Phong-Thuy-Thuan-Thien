"use client";

import { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { faceMoleArea, faceMoleBilateral, FACE_MOLE_CHART_IMG, FACE_MOLE_COUNT } from "@/lib/faceMolePositions";

export interface EditMole {
  id: string;
  n: number; // 0 = chưa chọn số
  side?: "T" | "P";
  x: number; // % 0..100
  y: number;
}

const clampPct = (n: number) => Math.min(97, Math.max(3, n));
let seq = 0;
const newId = () => `e${Date.now().toString(36)}${(seq++).toString(36)}`;

interface Props {
  photo: string;
  moles: EditMole[];
  onChange: (moles: EditMole[]) => void;
  aspect: number; // width / height của ảnh
}

export default function FaceMoleEditor({ photo, moles, onChange, aspect }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ id: string; moved: boolean } | null>(null);
  const pendingId = useRef<string | null>(null);
  const [selId, setSelId] = useState<string | null>(moles[0]?.id ?? null);
  const [addMode, setAddMode] = useState(false);
  const [numPad, setNumPad] = useState(false);
  const [lightbox, setLightbox] = useState(false);

  const sel = moles.find((m) => m.id === selId) ?? null;

  const toPct = (cx: number, cy: number) => {
    const r = boxRef.current!.getBoundingClientRect();
    return { x: clampPct(((cx - r.left) / r.width) * 100), y: clampPct(((cy - r.top) / r.height) * 100) };
  };

  const patch = (id: string, p: Partial<EditMole>) =>
    onChange(moles.map((m) => (m.id === id ? { ...m, ...p } : m)));

  const remove = (id: string) => {
    const next = moles.filter((m) => m.id !== id);
    onChange(next);
    setSelId((cur) => (cur === id ? (next[next.length - 1]?.id ?? null) : cur));
  };

  const addAt = (cx: number, cy: number) => {
    const { x, y } = toPct(cx, cy);
    const m: EditMole = { id: newId(), n: 0, x, y };
    onChange([...moles, m]);
    setSelId(m.id);
    pendingId.current = m.id;
    setAddMode(false);
    setNumPad(true);
  };

  const closeNumPad = () => {
    setNumPad(false);
    // Thêm nốt mới nhưng không chọn số → bỏ nốt đó.
    if (pendingId.current) {
      const p = moles.find((m) => m.id === pendingId.current);
      if (p && p.n === 0) remove(p.id);
      pendingId.current = null;
    }
  };

  const pickNumber = (n: number) => {
    if (!sel) return;
    patch(sel.id, { n, side: faceMoleBilateral(n) ? (sel.side ?? (sel.x < 50 ? "T" : "P")) : undefined });
    pendingId.current = null;
    setNumPad(false);
  };

  return (
    <div className="space-y-3">
      <div
        ref={boxRef}
        className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-surface-container-lowest select-none"
        style={{ aspectRatio: String(aspect || 0.78), cursor: addMode ? "crosshair" : "default" }}
        onPointerDown={(e) => {
          if (!addMode) return;
          if ((e.target as HTMLElement).dataset.dot) return;
          addAt(e.clientX, e.clientY);
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="Ảnh khuôn mặt" className="absolute inset-0 h-full w-full object-cover" draggable={false} />

        {addMode && (
          <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center">
            <span className="rounded-full bg-gold px-3 py-1 font-label-caps text-[10px] text-on-gold shadow-lg">
              Chạm vào nốt ruồi trên mặt
            </span>
          </div>
        )}

        {moles.map((m) => {
          const on = m.id === selId;
          return (
            <button
              key={m.id}
              type="button"
              data-dot="1"
              onPointerDown={(e) => {
                if (addMode) return;
                e.stopPropagation();
                e.currentTarget.setPointerCapture(e.pointerId);
                drag.current = { id: m.id, moved: false };
                setSelId(m.id);
              }}
              onPointerMove={(e) => {
                if (drag.current?.id !== m.id) return;
                const dx = Math.abs(e.movementX) + Math.abs(e.movementY);
                if (dx > 0) drag.current.moved = true;
                const { x, y } = toPct(e.clientX, e.clientY);
                patch(m.id, { x, y, ...(faceMoleBilateral(m.n) ? { side: x < 50 ? "T" : "P" } : {}) });
              }}
              onPointerUp={(e) => {
                e.currentTarget.releasePointerCapture?.(e.pointerId);
                const wasTap = drag.current && !drag.current.moved;
                drag.current = null;
                if (wasTap) setNumPad(true); // chạm chấm → mở bảng chọn số ngay
              }}
              className="absolute z-10 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 touch-none items-center justify-center"
              style={{ left: `${m.x}%`, top: `${m.y}%` }}
              aria-label={m.n ? `Nốt ruồi số ${m.n}` : "Nốt ruồi chưa chọn số"}
            >
              <span
                data-dot="1"
                className={`flex items-center justify-center rounded-full border-2 font-data-mono leading-none transition-all ${
                  on ? "h-8 w-8 text-[12px] shadow-[0_0_0_4px_rgba(212,175,55,0.35)]" : "h-7 w-7 text-[11px]"
                } ${
                  m.n === 0
                    ? "border-white bg-error text-white"
                    : on
                      ? "border-white bg-gold text-on-gold"
                      : "border-background bg-gold/90 text-on-gold"
                }`}
              >
                {m.n || "?"}
              </span>
            </button>
          );
        })}
      </div>

      {/* thanh công cụ */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setAddMode((v) => !v)}
          className={`press flex items-center gap-1.5 rounded-lg border px-3 py-1.5 font-label-caps text-[11px] ${
            addMode ? "border-gold bg-gold text-on-gold" : "border-white/20 text-on-surface hover:bg-white/5"
          }`}
        >
          <Icon name={addMode ? "close" : "add"} className="text-[15px]" />
          {addMode ? "Huỷ thêm" : "Thêm nốt ruồi"}
        </button>
        <span className="font-body-md text-[11px] text-outline">
          {addMode ? "Chạm vào vị trí nốt ruồi trên ảnh." : "Chạm chấm để sửa số · kéo chấm để di chuyển."}
        </span>
      </div>

      {/* nốt đang chọn */}
      {sel && sel.n > 0 ? (
        <div className="flex items-center gap-2 rounded-xl border border-gold/25 bg-gold/[0.04] p-2.5">
          <button
            type="button"
            onClick={() => setNumPad(true)}
            className="press flex h-11 min-w-[52px] flex-col items-center justify-center rounded-lg border border-gold/50 bg-gold/10 leading-none text-gold"
          >
            <span className="font-data-mono text-[16px]">{sel.n}</span>
            <span className="font-label-caps text-[8px] text-gold/70">đổi số</span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate font-body-md text-[12px] text-on-surface">{faceMoleArea(sel.n)}</p>
            {faceMoleBilateral(sel.n) && (
              <div className="mt-1 flex w-max overflow-hidden rounded border border-white/15">
                {(["T", "P"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => patch(sel.id, { side: s })}
                    className={`px-2.5 py-0.5 font-data-mono text-[11px] ${
                      sel.side === s ? "bg-gold text-on-gold" : "text-on-surface-variant"
                    }`}
                  >
                    {s === "T" ? "Trái" : "Phải"}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => remove(sel.id)}
            className="press flex items-center gap-1 rounded-lg border border-white/15 px-2.5 py-2 font-data-mono text-[11px] text-error/80 hover:text-error"
          >
            <Icon name="delete" className="text-[15px]" /> Xoá
          </button>
        </div>
      ) : (
        <p className="rounded-xl border border-white/10 bg-surface-container-lowest/60 p-3 text-center font-body-md text-[12px] text-on-surface-variant">
          {moles.length
            ? "Chạm một chấm trên ảnh để sửa số / xoá."
            : "Chưa có nốt ruồi. Bấm “Thêm nốt ruồi” để chấm, hoặc “Hoàn thành” nếu mặt bạn không có nốt nổi bật."}
        </p>
      )}

      {/* danh sách nhanh */}
      {moles.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {moles.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                onClick={() => {
                  setSelId(m.id);
                  setNumPad(true);
                }}
                className={`press rounded-full border px-2.5 py-1 font-data-mono text-[11px] ${
                  m.n === 0
                    ? "border-error/60 bg-error/10 text-error"
                    : m.id === selId
                      ? "border-gold bg-gold/15 text-gold"
                      : "border-white/15 text-on-surface-variant"
                }`}
              >
                {m.n ? `#${m.n}${m.side ?? ""}` : "? chọn số"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {/* bảng chọn số */}
      {numPad && sel && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-background/80 p-3 backdrop-blur-sm sm:items-center"
          onClick={closeNumPad}
        >
          <div
            className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-white/12 bg-surface-container p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-headline-md text-[16px] text-white">Chọn số theo sơ đồ mẫu</h4>
              <button type="button" onClick={closeNumPad} aria-label="Đóng">
                <Icon name="close" className="text-on-surface-variant" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setLightbox(true)}
              className="group relative mb-3 block w-full overflow-hidden rounded-lg border border-white/10"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={FACE_MOLE_CHART_IMG} alt="Sơ đồ 78 vị trí nốt ruồi" className="w-full" draggable={false} />
              <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 rounded-full border border-white/15 bg-background/70 px-2 py-0.5 font-data-mono text-[10px] text-on-surface-variant backdrop-blur-sm">
                <Icon name="zoom_in" className="text-[12px]" /> phóng to
              </span>
            </button>
            <div className="grid grid-cols-6 gap-1.5">
              {Array.from({ length: FACE_MOLE_COUNT }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => pickNumber(n)}
                  className={`flex h-10 items-center justify-center rounded font-data-mono text-[13px] ${
                    sel.n === n
                      ? "bg-gold text-on-gold"
                      : "border border-white/12 text-on-surface-variant hover:border-gold/40 hover:text-gold"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            {sel.n > 0 && (
              <p className="mt-3 rounded-lg bg-white/[0.04] p-2 font-body-md text-[12px] text-on-surface-variant">
                <span className="text-gold">Số {sel.n}</span>: {faceMoleArea(sel.n)}
              </p>
            )}
          </div>
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-[75] flex items-center justify-center bg-background/90 p-3 backdrop-blur-sm"
          onClick={() => setLightbox(false)}
        >
          <div className="relative max-h-full max-w-full overflow-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={FACE_MOLE_CHART_IMG} alt="Sơ đồ 78 vị trí nốt ruồi" className="w-[min(900px,95vw)] max-w-none" onClick={(e) => e.stopPropagation()} />
          </div>
          <button type="button" onClick={() => setLightbox(false)} className="press absolute right-3 top-3 rounded-full border border-white/20 bg-surface-container p-1.5 text-white" aria-label="Đóng">
            <Icon name="close" />
          </button>
        </div>
      )}
    </div>
  );
}

export { newId as newMoleId };
