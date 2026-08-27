"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import EngineBadge from "@/components/ui/EngineBadge";
import { ApiError, mediaUrl } from "@/lib/api";
import { admin, type AdminReadingLog, type ReadingType } from "@/lib/endpoints";

const LINE_LABEL: Record<string, string> = {
  "path-life": "Sinh đạo",
  "path-head": "Trí đạo",
  "path-heart": "Tâm đạo",
};

function ObsCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-data-mono text-[10px] uppercase tracking-wide text-outline">{label}</p>
      <p className="font-body-md text-sm text-on-surface">{value || "không rõ"}</p>
    </div>
  );
}

export default function ReadingLogReview() {
  const [logs, setLogs] = useState<AdminReadingLog[] | null>(null);
  const [filter, setFilter] = useState<"all" | ReadingType>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    admin
      .readingLogs(filter === "all" ? undefined : filter)
      .then((res) => {
        setLogs(res.logs);
        setSelectedId((cur) => cur ?? res.logs[0]?.id ?? null);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Không tải được nhật ký."));
  }, [filter]);

  const selected = logs?.find((l) => l.id === selectedId) ?? logs?.[0] ?? null;

  return (
    <>
      <header className="mb-10 pt-8 md:pt-0">
        <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant opacity-60">
          QUẢN TRỊ HỆ THỐNG / ZENITH QI
        </p>
        <h2 className="mb-3 font-display-lg text-headline-lg-mobile text-white md:text-display-lg">Lượt phán AI</h2>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Xem lại từng lượt phân tích: ảnh người dùng đã tải lên và nội dung AI đã luận giải.
        </p>
      </header>

      <div className="mb-6 flex gap-2">
        {(["all", "chi-tay", "not-ruoi"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setFilter(key);
              setSelectedId(null);
            }}
            className={`press rounded-full border px-4 py-1.5 font-label-caps text-label-caps transition-colors ${
              filter === key ? "border-gold/60 bg-gold/10 text-gold" : "border-white/10 text-on-surface-variant hover:text-white"
            }`}
          >
            {key === "all" ? "Tất cả" : key === "chi-tay" ? "Chỉ tay" : "Nốt ruồi"}
          </button>
        ))}
      </div>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/10 px-4 py-3 text-sm text-error">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}

      <section className="grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
        <div className="overflow-hidden rounded-xl border border-white/10 bg-surface-container-low lg:col-span-5">
          <div className="border-b border-white/10 px-5 py-4">
            <h3 className="font-headline-md text-headline-md text-white">Nhật ký luận giải AI</h3>
          </div>
          <div className="max-h-[640px] divide-y divide-white/5 overflow-y-auto">
            {logs === null &&
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton m-3 h-14 rounded-lg" />)}
            {logs?.length === 0 && (
              <p className="p-6 text-center font-body-md text-sm text-on-surface-variant">
                Chưa có lượt luận giải nào. Người dùng chạy phân tích Chỉ tay / Nốt ruồi để xuất hiện ở đây.
              </p>
            )}
            {logs?.map((log) => {
              const active = log.id === selected?.id;
              return (
                <button
                  key={log.id}
                  type="button"
                  onClick={() => setSelectedId(log.id)}
                  className={`flex w-full items-center gap-4 border-l-2 px-5 py-4 text-left transition-colors ${
                    active ? "border-gold bg-gold/5" : "border-transparent hover:bg-white/5"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={mediaUrl(log.image)}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full border border-white/10 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-medium ${active ? "text-gold" : "text-white"}`}>{log.userName}</p>
                    <p className="flex items-center gap-1.5 text-[13px] text-on-surface-variant">
                      <Icon name={log.type === "chi-tay" ? "pan_tool" : "face_retouching_natural"} className="text-[14px]" />
                      {log.type === "chi-tay" ? "Chỉ tay" : "Nốt ruồi"}
                    </p>
                  </div>
                  <span className="shrink-0 font-data-mono text-[11px] text-outline">
                    {log.createdAt.split(" ")[1] ?? ""}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="rounded-xl border border-white/10 bg-surface-container-low p-6 motion-safe:animate-fade-in md:p-8 lg:col-span-7">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 flex items-center gap-2 font-label-caps text-label-caps text-gold">
                  {selected.id} · {selected.type === "chi-tay" ? "PHÂN TÍCH CHỈ TAY" : "PHÂN TÍCH NỐT RUỒI"}
                  <EngineBadge engine={selected.engine} />
                </p>
                <h3 className="font-headline-md text-headline-md text-white">{selected.userName}</h3>
                <p className="text-sm text-on-surface-variant">{selected.userEmail}</p>
              </div>
              <span className="font-data-mono text-data-mono text-on-surface-variant">{selected.createdAt}</span>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-[200px_1fr]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={mediaUrl(selected.image)}
                alt={`Ảnh đã tải lên cho ${selected.id}`}
                className="h-[200px] w-full rounded-lg border border-white/10 object-cover grayscale sm:w-[200px]"
              />
              <div>
                <h4 className="mb-3 flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
                  <Icon name="smart_toy" className="text-[16px] text-gold/70" />
                  AI ĐÃ LUẬN GIẢI
                </h4>
                <p className="font-body-md text-body-md leading-relaxed text-on-surface">{selected.aiVerdict}</p>
              </div>
            </div>

            {selected.intake && (
              <div className="mt-6 rounded-lg border border-white/10 bg-surface-container-lowest/60 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
                  <Icon name="assignment_ind" className="text-[16px] text-gold/70" />
                  NGƯỜI XEM TỰ KHAI
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <ObsCell label="Họ tên" value={selected.intake.name} />
                  <ObsCell label="Ngày sinh" value={selected.intake.dob} />
                  <ObsCell
                    label="Giới tính · tay"
                    value={`${selected.intake.gender === "nam" ? "Nam" : "Nữ"} · ${
                      selected.intake.hand === "trai" ? "trái" : "phải"
                    }`}
                  />
                </div>
                <p className="mt-2 font-body-md text-xs text-outline">
                  Nốt ruồi khai:{" "}
                  {selected.intake.handMoles.length
                    ? `vùng ${selected.intake.handMoles.join(", ")}`
                    : "không có"}
                </p>
              </div>
            )}

            {selected.observation && (
              <div className="mt-6 rounded-lg border border-white/10 bg-surface-container-lowest/60 p-4">
                <h4 className="mb-3 flex items-center gap-2 font-label-caps text-label-caps text-on-surface-variant">
                  <Icon name="visibility" className="text-[16px] text-gold/70" />
                  AI ĐÃ QUAN SÁT (lượt 1)
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
                  <ObsCell label="Dáng tay" value={selected.observation.handShape} />
                  <ObsCell label="Độ rõ" value={selected.observation.clarity} />
                  <ObsCell
                    label="Thiên hướng"
                    value={selected.observation.dominantElementHint}
                  />
                </div>
                {selected.observation.note && (
                  <p className="mt-2 font-body-md text-xs text-outline">{selected.observation.note}</p>
                )}
                <ul className="mt-3 space-y-1.5">
                  {selected.observation.lines.map((l) => (
                    <li key={l.id} className="font-body-md text-xs text-on-surface-variant">
                      <span className="text-on-surface">{LINE_LABEL[l.id] ?? l.id}</span>{" "}
                      — {l.present ? "thấy rõ" : "khó thấy"} · sâu: {l.depth} · dài: {l.length}
                      {l.features.length > 0 && <> · {l.features.join(", ")}</>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}
