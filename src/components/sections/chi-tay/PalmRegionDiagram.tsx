"use client";

import { PALM_REGIONS } from "@/lib/palmRegions";

/**
 * Sơ đồ bàn tay tối giản + 10 vùng đánh số — hiển thị trong trắc nghiệm khi chưa
 * có ảnh thật (`public/palm-regions/{left,right}.png`). `side` = tay được xem.
 */
export default function PalmRegionDiagram({
  side,
  active = [],
  onToggle,
}: {
  side: "trai" | "phai";
  active?: number[];
  onToggle?: (n: number) => void;
}) {
  // Khung lòng bàn tay trong viewBox 0..100 (rộng) × 0..100 (cao).
  const PALM = { x: 20, y: 18, w: 60, h: 66 };
  const px = (rx: number) => {
    const r = side === "trai" ? 1 - rx : rx; // lật ngang cho tay trái
    return PALM.x + r * PALM.w;
  };
  const py = (ry: number) => PALM.y + ry * PALM.h;

  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" role="img" aria-label={`Sơ đồ vùng bàn tay ${side === "trai" ? "trái" : "phải"}`}>
      <g transform={side === "trai" ? "translate(100,0) scale(-1,1)" : undefined}>
        {/* lòng bàn tay */}
        <rect x={20} y={30} width={60} height={54} rx={16} className="fill-white/[0.04] stroke-white/15" strokeWidth={1} />
        {/* 4 ngón */}
        {[0, 1, 2, 3].map((i) => (
          <rect
            key={i}
            x={30 + i * 12}
            y={8 + (i === 0 || i === 3 ? 8 : 0)}
            width={9}
            height={26 - (i === 0 || i === 3 ? 6 : 0)}
            rx={4.5}
            className="fill-white/[0.03] stroke-white/12"
            strokeWidth={1}
          />
        ))}
        {/* ngón cái */}
        <rect x={8} y={44} width={22} height={9} rx={4.5} transform="rotate(-28 12 52)" className="fill-white/[0.03] stroke-white/12" strokeWidth={1} />
      </g>

      {PALM_REGIONS.map((r) => {
        const cx = px(r.at[0]);
        const cy = py(r.at[1]);
        const on = active.includes(r.n);
        return (
          <g
            key={r.n}
            transform={`translate(${cx} ${cy})`}
            onClick={onToggle ? () => onToggle(r.n) : undefined}
            className={onToggle ? "cursor-pointer" : undefined}
          >
            <circle
              r={4.6}
              className={on ? "fill-gold stroke-gold" : "fill-background stroke-gold/60"}
              strokeWidth={1}
            />
            <text
              x={0}
              y={0.1}
              textAnchor="middle"
              dominantBaseline="central"
              className={`font-data-mono ${on ? "fill-on-gold" : "fill-gold"}`}
              style={{ fontSize: 4.6 }}
            >
              {r.n}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
