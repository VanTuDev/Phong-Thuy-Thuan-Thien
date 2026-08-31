"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import EngineBadge from "@/components/ui/EngineBadge";
import { mediaUrl } from "@/lib/api";
import { readings, type Reading } from "@/lib/endpoints";
import { useSession } from "@/components/session/SessionProvider";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function HistoryList() {
  const { isLoggedIn, status } = useSession();
  const [items, setItems] = useState<Reading[] | null>(null);
  const [filter, setFilter] = useState<"all" | "chi-tay" | "not-ruoi">("all");

  useEffect(() => {
    if (!isLoggedIn) return;
    readings
      .list()
      .then((res) => setItems(res.readings))
      .catch(() => setItems([]));
  }, [isLoggedIn]);

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <Empty
        icon="lock"
        title="Cần đăng nhập"
        text="Đăng nhập để xem lịch sử các lượt luận giải của bạn."
        cta={{ href: "/dang-nhap?next=/lich-su", label: "Đăng nhập bằng Google" }}
      />
    );
  }

  if (items === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="skeleton h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <Empty
        icon="auto_awesome"
        title="Chưa có lượt xem nào"
        text="Nạp lượt và bắt đầu phân tích Chỉ tay hoặc Nốt ruồi để xem lịch sử tại đây."
        cta={{ href: "/nap-luot", label: "Nạp lượt xem" }}
      />
    );
  }

  const filtered = items.filter((r) => filter === "all" || r.type === filter);

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex gap-2">
        {(["all", "chi-tay", "not-ruoi"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`press rounded-full border px-4 py-1.5 font-label-caps text-label-caps transition-colors ${
              filter === key
                ? "border-gold/60 bg-gold/10 text-gold"
                : "border-white/10 text-on-surface-variant hover:text-white"
            }`}
          >
            {key === "all" ? "Tất cả" : key === "chi-tay" ? "Chỉ tay" : "Nốt ruồi"}
          </button>
        ))}
      </div>

      <div className="space-y-unit">
        {filtered.map((entry, i) => (
          <div
            key={entry.id}
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
            className="flex items-start gap-5 rounded-xl border border-white/10 bg-surface-container-low p-4 sm:p-5 motion-safe:animate-fade-in-up"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Ảnh đã phân tích"
              src={mediaUrl(entry.image)}
              className="h-[72px] w-[72px] shrink-0 rounded-lg border border-white/10 object-cover"
            />
            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <Icon
                  name={entry.type === "chi-tay" ? "pan_tool" : "face_retouching_natural"}
                  className="text-[16px] text-gold"
                />
                <span className="font-label-caps text-label-caps text-gold">
                  {entry.type === "chi-tay" ? "CHỈ TAY" : "NỐT RUỒI"}
                </span>
                <EngineBadge engine={entry.engine} />
                <span className="ml-auto font-data-mono text-[12px] text-outline">
                  {formatDateTime(entry.createdAt)}
                </span>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{entry.summary}</p>
              {entry.intake && (
                <p className="mt-1 font-data-mono text-[11px] text-outline">
                  tay {entry.intake.hand === "trai" ? "trái" : "phải"}
                  {entry.intake.handMoleMode === "search"
                    ? " · AI tự xem"
                    : entry.intake.handMoles.length
                      ? ` · đã đánh dấu ${entry.intake.handMoles.length} điểm`
                      : ""}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Empty({
  icon,
  title,
  text,
  cta,
}: {
  icon: string;
  title: string;
  text: string;
  cta: { href: string; label: string };
}) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface-container-low p-10 text-center">
      <Icon name={icon} className="mb-4 text-4xl text-on-surface-variant" />
      <h2 className="font-headline-md text-headline-md text-white">{title}</h2>
      <p className="mb-8 mt-2 font-body-md text-body-md text-on-surface-variant">{text}</p>
      <Link
        href={cta.href}
        className="press inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 font-label-caps text-label-caps text-on-gold"
      >
        {cta.label}
      </Link>
    </div>
  );
}
