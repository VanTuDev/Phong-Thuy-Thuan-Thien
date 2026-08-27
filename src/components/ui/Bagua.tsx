/**
 * Bát Quái / La Bàn phong thủy — vòng tròn trang trí dùng lại ở nhiều nơi
 * (Hero, Câu chuyện thương hiệu, Footer, Đăng nhập). Thuần SVG, không phụ thuộc.
 *
 * 8 quẻ (đọc từ dưới lên, true = hào dương liền, false = hào âm đứt):
 */
const TRIGRAMS: { name: string; lines: [boolean, boolean, boolean] }[] = [
  { name: "Càn", lines: [true, true, true] }, // ☰ Trời
  { name: "Tốn", lines: [false, true, true] }, // ☴ Gió
  { name: "Khảm", lines: [false, true, false] }, // ☵ Nước
  { name: "Cấn", lines: [false, false, true] }, // ☶ Núi
  { name: "Khôn", lines: [false, false, false] }, // ☷ Đất
  { name: "Chấn", lines: [true, false, false] }, // ☳ Sấm
  { name: "Ly", lines: [true, false, true] }, // ☲ Lửa
  { name: "Đoài", lines: [true, true, false] }, // ☱ Đầm
];

function Trigram({ lines }: { lines: [boolean, boolean, boolean] }) {
  // vẽ quanh gốc (0,0); 3 hào cách nhau 3.4 đơn vị, hào trên cùng ở trên
  return (
    <g>
      {lines
        .slice()
        .reverse()
        .map((solid, i) => {
          const y = -3.4 + i * 3.4;
          if (solid) {
            return <rect key={i} x={-6} y={y - 0.9} width={12} height={1.8} rx={0.9} />;
          }
          return (
            <g key={i}>
              <rect x={-6} y={y - 0.9} width={4.4} height={1.8} rx={0.9} />
              <rect x={1.6} y={y - 0.9} width={4.4} height={1.8} rx={0.9} />
            </g>
          );
        })}
    </g>
  );
}

interface BaguaProps {
  className?: string;
  /** Bật quay chậm (mặc định true, tự tắt khi prefers-reduced-motion) */
  spin?: boolean;
  /** Hiện Âm–Dương ở tâm */
  yinYang?: boolean;
}

export default function Bagua({ className = "", spin = true, yinYang = false }: BaguaProps) {
  return (
    <svg
      viewBox="-100 -100 200 200"
      className={className}
      role="img"
      aria-label="Bát Quái"
      fill="currentColor"
    >
      <defs>
        <radialGradient id="bagua-glow" cx="50%" cy="50%" r="50%">
          <stop offset="55%" stopColor="currentColor" stopOpacity="0" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.12" />
        </radialGradient>
      </defs>

      <circle r="98" fill="url(#bagua-glow)" />

      {/* vòng ngoài + vạch chia độ (24 sơn) */}
      <g stroke="currentColor" strokeOpacity="0.35" fill="none">
        <circle r="92" strokeWidth="0.6" />
        <circle r="82" strokeWidth="0.4" />
        {Array.from({ length: 24 }).map((_, i) => {
          const a = (i * 15 * Math.PI) / 180;
          return (
            <line
              key={i}
              x1={Math.cos(a) * 82}
              y1={Math.sin(a) * 82}
              x2={Math.cos(a) * 92}
              y2={Math.sin(a) * 92}
              strokeWidth={i % 3 === 0 ? 0.9 : 0.4}
            />
          );
        })}
      </g>

      {/* vành 8 quẻ (tự quay) */}
      <g className={spin ? "motion-safe:animate-slow-spin" : ""} style={{ transformOrigin: "center" }}>
        <g stroke="currentColor" strokeOpacity="0.22" fill="none">
          <circle r="72" strokeWidth="0.5" />
          <circle r="46" strokeWidth="0.5" />
        </g>
        {TRIGRAMS.map((t, i) => {
          const angle = i * 45;
          return (
            <g key={t.name} transform={`rotate(${angle}) translate(0 -59)`} opacity="0.55">
              <Trigram lines={t.lines} />
            </g>
          );
        })}
      </g>

      {/* tâm */}
      {yinYang ? (
        <g transform="scale(0.34)">
          <circle r="50" fill="none" stroke="currentColor" strokeWidth="2" strokeOpacity="0.6" />
          <path d="M0,-50 A25,25 0 0,1 0,0 A25,25 0 0,0 0,50 A50,50 0 0,1 0,-50 Z" fill="currentColor" fillOpacity="0.5" />
          <circle cx="0" cy="-25" r="6" fill="currentColor" />
          <circle cx="0" cy="25" r="6" fill="none" stroke="currentColor" strokeWidth="2.5" />
        </g>
      ) : (
        <circle r="14" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
      )}
    </svg>
  );
}
