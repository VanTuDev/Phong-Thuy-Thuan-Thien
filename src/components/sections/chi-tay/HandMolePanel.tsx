"use client";

import Icon from "@/components/ui/Icon";
import type { PalmMoleReading, PalmObservation } from "@/lib/endpoints";

export default function HandMolePanel({
  readings,
  observed,
}: {
  readings: PalmMoleReading[];
  observed?: PalmObservation["moles"];
}) {
  const seenOf = (region: number) => observed?.find((m) => m.region === region)?.seen;

  return (
    <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-5 motion-safe:animate-fade-in-up">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="spa" className="text-[16px] text-gold/70" />
        <h4 className="font-label-caps text-label-caps text-on-surface-variant">
          Nốt ruồi trên bàn tay
        </h4>
      </div>
      <ul className="space-y-3">
        {readings.map((r) => {
          const seen = seenOf(r.region);
          return (
            <li key={r.region} className="rounded-lg border border-white/5 bg-surface-container-lowest/60 p-3.5">
              <div className="mb-1 flex items-center gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold font-data-mono text-[11px] text-on-gold">
                  {r.region}
                </span>
                <span className="font-headline-md text-[16px] text-on-surface">{r.name}</span>
                {seen === false && (
                  <span className="font-data-mono text-[10px] text-outline">· AI chưa thấy rõ trên ảnh</span>
                )}
              </div>
              <p className="font-body-md text-sm text-on-surface-variant">{r.interpretation}</p>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 font-body-md text-[11px] text-outline">
        Luận giải theo cung vị bạn tự khai — mang tính tham khảo, gợi mở.
      </p>
    </div>
  );
}
