"use client";

import Icon from "@/components/ui/Icon";
import type { BaTrach, PalmSubject } from "@/lib/endpoints";

export default function BaTrachPanel({
  baTrach,
  subject,
}: {
  baTrach: BaTrach;
  subject: PalmSubject | null;
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-5 motion-safe:animate-fade-in-up">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="explore" className="text-[16px] text-gold/70" />
        <h4 className="font-label-caps text-label-caps text-on-surface-variant">Bát Trạch của bạn</h4>
      </div>

      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-headline-md text-[20px] text-gold">
          Quái số {baTrach.kua} · {baTrach.gua}
        </span>
        <span className="font-body-md text-sm text-on-surface-variant">
          {baTrach.trach} tứ trạch
          {subject ? ` · ${subject.gender === "nam" ? "Nam" : "Nữ"} · ${subject.age} tuổi` : ""}
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <DirList label="Hướng hợp mệnh" tone="good" items={baTrach.goodDirections} />
        <DirList label="Hướng cần tránh" tone="bad" items={baTrach.badDirections} />
      </div>
    </div>
  );
}

function DirList({
  label,
  tone,
  items,
}: {
  label: string;
  tone: "good" | "bad";
  items: { name: string; dir: string }[];
}) {
  return (
    <div>
      <p className="mb-1.5 font-data-mono text-[10px] uppercase tracking-wide text-outline">{label}</p>
      <ul className="space-y-1">
        {items.map((d) => (
          <li
            key={d.name}
            className={`flex items-center justify-between rounded-md border px-2.5 py-1.5 font-body-md text-sm ${
              tone === "good"
                ? "border-wood/25 bg-wood/[0.07] text-on-surface"
                : "border-white/10 bg-surface-container-lowest/60 text-on-surface-variant"
            }`}
          >
            <span>{d.name}</span>
            <span className="font-data-mono text-[12px]">{d.dir}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
