import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

interface Element {
  key: string;
  name: string;
  color: string;
  icon: string;
  blurb: string;
}

/** Thứ tự vòng TƯƠNG SINH: Mộc → Hỏa → Thổ → Kim → Thủy → Mộc */
const ELEMENTS: Element[] = [
  { key: "moc", name: "Mộc", color: "#4CAF50", icon: "park", blurb: "Sinh sôi, phát triển, hướng lên" },
  { key: "hoa", name: "Hỏa", color: "#FF7043", icon: "local_fire_department", blurb: "Bùng cháy, danh tiếng, nhiệt huyết" },
  { key: "tho", name: "Thổ", color: "#D4AF37", icon: "landscape", blurb: "Ổn định, nuôi dưỡng, trung tâm" },
  { key: "kim", name: "Kim", color: "#B8BCC4", icon: "diamond", blurb: "Cô đọng, kỷ luật, sắc bén" },
  { key: "thuy", name: "Thủy", color: "#2196F3", icon: "water_drop", blurb: "Uyển chuyển, trí tuệ, luân chuyển" },
];

// Toạ độ 5 đỉnh ngũ giác (viewBox 0 0 360 360, tâm 180,180, R 132), đỉnh đầu ở trên.
const R = 132;
const POINTS = ELEMENTS.map((_, i) => {
  const a = (-90 + i * 72) * (Math.PI / 180);
  return { x: 180 + R * Math.cos(a), y: 180 + R * Math.sin(a) };
});

export default function NguHanh() {
  return (
    <section className="relative mx-auto mb-24 md:mb-32 w-full max-w-container-max px-margin-mobile md:px-margin-desktop">
      <Reveal className="mb-14 text-center">
        <p className="mb-3 font-label-caps text-label-caps tracking-[0.3em] text-gold/70">NGŨ HÀNH</p>
        <h2 className="font-headline-lg text-headline-lg-mobile text-white md:text-headline-lg">
          Vạn vật vận hành theo vòng <span className="text-gold-sheen">tương sinh</span>
        </h2>
        <p className="mx-auto mt-4 max-w-xl font-body-lg text-body-lg text-on-surface-variant">
          Mộc sinh Hỏa · Hỏa sinh Thổ · Thổ sinh Kim · Kim sinh Thủy · Thủy sinh Mộc.
          Mọi luận giải của Thuận Thiên đều đặt trên nền quy luật này.
        </p>
      </Reveal>

      <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr]">
        {/* Sơ đồ vòng tương sinh */}
        <Reveal className="mx-auto w-full max-w-[420px]">
          <div className="relative aspect-square">
            <div className="absolute inset-0 rounded-full bg-gold/[0.06] blur-3xl" />
            <svg viewBox="0 0 360 360" className="relative h-full w-full">
              <defs>
                <marker id="nh-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M0 0 L10 5 L0 10 z" fill="rgba(212,175,55,0.55)" />
                </marker>
              </defs>

              {/* các cung nối theo vòng tương sinh */}
              {POINTS.map((p, i) => {
                const next = POINTS[(i + 1) % POINTS.length];
                const mx = (p.x + next.x) / 2;
                const my = (p.y + next.y) / 2;
                // kéo điểm điều khiển ra ngoài tâm cho cung cong nhẹ
                const cx = 180 + (mx - 180) * 1.28;
                const cy = 180 + (my - 180) * 1.28;
                return (
                  <path
                    key={i}
                    d={`M ${p.x} ${p.y} Q ${cx} ${cy} ${next.x} ${next.y}`}
                    fill="none"
                    stroke="rgba(212,175,55,0.3)"
                    strokeWidth="1.4"
                    strokeDasharray="4 5"
                    markerEnd="url(#nh-arrow)"
                    style={{ animation: `nh-flow ${6 + i}s linear infinite` }}
                  />
                );
              })}

              {/* nút mỗi hành */}
              {ELEMENTS.map((el, i) => (
                <g key={el.key} transform={`translate(${POINTS[i].x} ${POINTS[i].y})`}>
                  <circle r="30" fill="#121212" stroke={el.color} strokeOpacity="0.5" strokeWidth="1.4" />
                  <circle r="30" fill={el.color} fillOpacity="0.08" />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    className="font-serif"
                    fontSize="20"
                    fill={el.color}
                  >
                    {el.name}
                  </text>
                </g>
              ))}
              <style>{`@keyframes nh-flow { to { stroke-dashoffset: -90 } }`}</style>
            </svg>
          </div>
        </Reveal>

        {/* Danh sách 5 hành */}
        <div className="grid gap-3 sm:grid-cols-2">
          {ELEMENTS.map((el, i) => (
            <Reveal key={el.key} delay={i * 70}>
              <div
                className="flex items-start gap-4 rounded-xl border border-white/10 bg-surface-container-low/70 p-4 transition-colors hover:border-white/20"
                style={{ borderLeft: `2px solid ${el.color}` }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
                  style={{ background: `${el.color}1f`, color: el.color }}
                >
                  <Icon name={el.icon} className="text-[20px]" />
                </span>
                <div>
                  <p className="font-headline-md text-[19px] text-white">
                    Hành <span style={{ color: el.color }}>{el.name}</span>
                  </p>
                  <p className="mt-0.5 font-body-md text-sm text-on-surface-variant">{el.blurb}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
