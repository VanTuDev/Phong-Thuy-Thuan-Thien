"use client";

import Icon from "@/components/ui/Icon";
import type { HandMetrics } from "@/lib/endpoints";

const BAR_COLOR: Record<string, string> = {
  thumb: "#9E9E9E",
  index: "#448AFF",
  middle: "#D4AF37",
  ring: "#FF5252",
  pinky: "#4CAF50",
};

export default function PalmMetricsPanel({
  metrics,
  defaultOpen = false,
}: {
  metrics: HandMetrics;
  defaultOpen?: boolean;
}) {
  const four = metrics.fingers.filter((f) => f.id !== "thumb");
  const maxLen = Math.max(...metrics.fingers.map((f) => f.length), 0.001);

  return (
    <details
      open={defaultOpen}
      className="group rounded-xl border border-white/5 bg-surface-container-lowest/60 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4">
        <span className="flex items-center gap-2">
          <Icon name="straighten" className="text-[16px] text-gold/60" />
          <span className="font-label-caps text-label-caps text-on-surface-variant">Số đo bàn tay</span>
        </span>
        <span className="flex items-center gap-2">
          <span className="font-data-mono text-[11px] text-outline">
            dài nhất: {metrics.longest.replace("Ngón ", "")}
          </span>
          <Icon
            name="expand_more"
            className="text-[18px] text-outline transition-transform group-open:rotate-180"
          />
        </span>
      </summary>

      <div className="space-y-4 border-t border-white/5 px-4 pb-4 pt-3">
        {/* Thanh chiều dài ngón */}
        <div className="space-y-1.5">
          {metrics.fingers.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <span className="w-20 shrink-0 font-body-md text-xs text-on-surface-variant">{f.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, (f.length / maxLen) * 100)}%`,
                    background: BAR_COLOR[f.id] ?? "#888",
                  }}
                />
              </div>
              {f.relative && (
                <span
                  className={`w-9 shrink-0 text-right font-data-mono text-[10px] ${
                    f.relative === "dài"
                      ? "text-wood"
                      : f.relative === "ngắn"
                        ? "text-error/80"
                        : "text-outline"
                  }`}
                >
                  {f.relative}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Độ hở giữa các ngón */}
        <div>
          <p className="mb-1.5 font-data-mono text-[10px] uppercase tracking-wide text-outline">
            Độ hở giữa các ngón
          </p>
          <div className="flex flex-wrap gap-1.5">
            {metrics.gaps.map((g) => (
              <span
                key={g.label}
                className={`rounded-full border px-2 py-0.5 font-data-mono text-[11px] ${
                  g.openness === "hở rộng"
                    ? "border-gold/40 bg-gold/10 text-gold/90"
                    : g.openness === "vừa"
                      ? "border-white/15 text-on-surface-variant"
                      : "border-white/10 text-outline"
                }`}
              >
                {g.label}: {g.openness} (~{Math.round(g.angleDeg)}°)
              </span>
            ))}
          </div>
        </div>

        {/* Tư thế bàn tay */}
        {metrics.pose && (
          <div>
            <p className="mb-1.5 font-data-mono text-[10px] uppercase tracking-wide text-outline">
              Tư thế bàn tay
            </p>
            <div className="mb-2 flex flex-wrap gap-1.5">
              {metrics.pose.fingerBends.map((b) => (
                <span
                  key={b.id}
                  className={`rounded-full border px-2 py-0.5 font-data-mono text-[11px] ${
                    b.state === "cong nhiều"
                      ? "border-error/40 bg-error/10 text-error/90"
                      : b.state === "hơi cong"
                        ? "border-gold/30 bg-gold/10 text-gold/90"
                        : "border-white/10 text-outline"
                  }`}
                >
                  {b.label.replace("Ngón ", "")}: {b.state}
                  {b.state !== "thẳng" && ` (~${Math.round(b.curveDeg)}°)`}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Field label="Nghiêng" value={`~${Math.round(metrics.pose.tiltDeg)}°`} />
              <Field label="Phối cảnh" value={metrics.pose.roll} />
              <Field label="Lòng bàn tay" value={metrics.pose.cupping} />
            </div>
            {metrics.pose.quality !== "tốt" && (
              <p className="mt-1.5 flex items-start gap-1.5 font-body-md text-[11px] text-gold/80">
                <Icon name="info" className="mt-0.5 text-[13px]" />
                Ảnh chưa lý tưởng ({metrics.pose.quality}) — số đo có thể lệch, chụp lại bàn tay xoè
                phẳng sẽ chính xác hơn.
              </p>
            )}
          </div>
        )}

        {/* Tóm tắt */}
        <div className="grid grid-cols-2 gap-2">
          <Field label="Hình bàn tay" value={`${metrics.palmShape} (${metrics.palmRatio})`} />
          <Field label="Độ dài ngón" value={metrics.fingerToPalm} />
          <Field label="Ngón út với tới" value={metrics.pinkyReach} />
          <Field label="Góc ngón cái" value={`~${Math.round(metrics.thumbAngleDeg)}°`} />
        </div>

        {metrics.notes.length > 0 && (
          <ul className="space-y-1">
            {metrics.notes.map((n, i) => (
              <li key={i} className="flex gap-2 font-body-md text-xs text-on-surface-variant">
                <Icon name="chevron_right" className="mt-0.5 shrink-0 text-[13px] text-gold/50" />
                {n}
              </li>
            ))}
          </ul>
        )}
        <p className="font-body-md text-[11px] text-outline">
          Số đo tính trực tiếp từ 21 điểm mốc bàn tay — không do AI đoán. {four.length} ngón được đo.
        </p>
      </div>
    </details>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-data-mono text-[10px] uppercase tracking-wide text-outline">{label}</p>
      <p className="font-body-md text-sm text-on-surface">{value || "—"}</p>
    </div>
  );
}
