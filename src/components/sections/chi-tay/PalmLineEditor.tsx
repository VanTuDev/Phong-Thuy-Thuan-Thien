"use client";

import { useRef } from "react";
import type { PalmLineKey, Pt } from "@/lib/handDetect";

const COLOR: Record<PalmLineKey, string> = {
  "path-life": "#FF5252",
  "path-head": "#448AFF",
  "path-heart": "#FFC107",
};
const ORDER: PalmLineKey[] = ["path-life", "path-head", "path-heart"];

const clamp01 = (n: number) => Math.min(0.99, Math.max(0.01, n));

/** Đường cong mượt qua các điểm (viewBox 0..100). */
function smoothPath(pts: Pt[]): string {
  const p = pts.map(([x, y]) => [x * 100, y * 100] as [number, number]);
  if (p.length < 2) return "";
  const mid = (a: number[], b: number[]) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${p[0][0]},${p[0][1]} L ${mid(p[0], p[1]).join(",")}`;
  for (let i = 1; i < p.length - 1; i++) d += ` Q ${p[i][0]},${p[i][1]} ${mid(p[i], p[i + 1]).join(",")}`;
  d += ` L ${p[p.length - 1][0]},${p[p.length - 1][1]}`;
  return d;
}

interface Props {
  lines: Record<PalmLineKey, Pt[]>;
  onChange: (id: PalmLineKey, pts: Pt[]) => void;
  /** đường đang ở chế độ vẽ lại (chấm điểm mới) */
  redraw: PalmLineKey | null;
  onRedrawAppend: (pt: Pt) => void;
}

export default function PalmLineEditor({ lines, onChange, redraw, onRedrawAppend }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ id: PalmLineKey; idx: number } | null>(null);

  const toNorm = (clientX: number, clientY: number): Pt => {
    const r = svgRef.current!.getBoundingClientRect();
    return [clamp01((clientX - r.left) / r.width), clamp01((clientY - r.top) / r.height)];
  };

  return (
    <svg
      ref={svgRef}
      className="palm-overlay absolute inset-0 h-full w-full touch-none"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ cursor: redraw ? "crosshair" : "default" }}
      onPointerDown={(e) => {
        if (redraw) {
          e.preventDefault();
          onRedrawAppend(toNorm(e.clientX, e.clientY));
        }
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        const next = lines[d.id].slice();
        next[d.idx] = toNorm(e.clientX, e.clientY);
        onChange(d.id, next);
      }}
      onPointerUp={(e) => {
        if (drag.current) {
          (e.target as Element).releasePointerCapture?.(e.pointerId);
          drag.current = null;
        }
      }}
    >
      {ORDER.map((id) => {
        const pts = lines[id];
        if (!pts || pts.length < 2) return null;
        const isRedraw = redraw === id;
        return (
          <path
            key={`p-${id}`}
            d={smoothPath(pts)}
            fill="none"
            stroke={COLOR[id]}
            strokeOpacity={redraw && !isRedraw ? 0.25 : 0.9}
            strokeWidth={1}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        );
      })}

      {ORDER.map((id) => {
        const pts = lines[id];
        if (!pts) return null;
        // khi đang vẽ lại đường khác → ẩn tay cầm để đỡ rối
        if (redraw && redraw !== id) return null;
        return pts.map(([x, y], i) => (
          <g key={`h-${id}-${i}`}>
            <circle
              cx={x * 100}
              cy={y * 100}
              r={4.5}
              fill="transparent"
              style={{ cursor: "grab" }}
              onPointerDown={(e) => {
                if (redraw) return;
                e.stopPropagation();
                (e.target as Element).setPointerCapture(e.pointerId);
                drag.current = { id, idx: i };
              }}
            />
            <circle
              cx={x * 100}
              cy={y * 100}
              r={1.7}
              fill={COLOR[id]}
              stroke="#fff"
              strokeWidth={0.5}
              pointerEvents="none"
            />
          </g>
        ));
      })}
    </svg>
  );
}

export { COLOR as PALM_LINE_COLOR, ORDER as PALM_LINE_ORDER };
