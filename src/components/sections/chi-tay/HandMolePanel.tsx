"use client";

import Icon from "@/components/ui/Icon";
import type { PalmMoleReading } from "@/lib/endpoints";

/**
 * Luận thêm theo TỪNG VÙNG lòng bàn tay (gia đạo / đất đai – nhà cửa / tình duyên…).
 * KHÔNG nhắc tới "nốt ruồi" — toàn bộ là luận tướng tay theo vùng.
 */
export default function HandMolePanel({ readings }: { readings: PalmMoleReading[] }) {
  return (
    <div className="rounded-xl border border-white/5 bg-surface-container-lowest p-5 motion-safe:animate-fade-in-up">
      <div className="mb-3 flex items-center gap-2">
        <Icon name="insights" className="text-[16px] text-gold/70" />
        <h4 className="font-label-caps text-label-caps text-on-surface-variant">
          Luận thêm từ lòng bàn tay
        </h4>
      </div>
      <ul className="space-y-3">
        {readings.map((r) => (
          <li
            key={r.region}
            className="rounded-lg border border-white/5 bg-surface-container-lowest/60 p-3.5"
          >
            <div className="mb-1 flex items-center gap-2">
              <Icon name="place" className="shrink-0 text-[14px] text-gold/50" />
              <span className="font-headline-md text-[16px] text-on-surface">{r.name}</span>
            </div>
            <p className="font-body-md text-sm text-on-surface-variant">{r.interpretation}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 font-body-md text-[11px] text-outline">
        Theo tướng học — mang tính tham khảo, gợi mở.
      </p>
    </div>
  );
}
