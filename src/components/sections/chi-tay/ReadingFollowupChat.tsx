"use client";

import { useRef, useState } from "react";
import Icon from "@/components/ui/Icon";
import { ApiError } from "@/lib/api";
import { readings, MAX_READING_FOLLOWUPS, type Reading } from "@/lib/endpoints";

/**
 * Hỏi thêm sau khi có kết quả luận giải — tối đa 2 câu hỏi.
 * AI chỉ dùng bản luận giải + kho tri thức admin. Không tốn lượt xem.
 */
export default function ReadingFollowupChat({
  reading,
  onUpdated,
}: {
  reading: Reading;
  onUpdated: (r: Reading) => void;
}) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const thread = reading.followups ?? [];
  const asked = thread.filter((f) => f.role === "user").length;
  const remaining = MAX_READING_FOLLOWUPS - asked;
  const canAsk = remaining > 0 && !sending;

  const send = async () => {
    const message = draft.trim();
    if (message.length < 2 || !canAsk) return;
    setSending(true);
    setError(null);
    try {
      const res = await readings.chat(reading.id, message);
      onUpdated(res.reading);
      setDraft("");
      requestAnimationFrame(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không gửi được câu hỏi. Thử lại sau.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="rounded-xl border border-white/10 bg-surface-container-lowest/60 p-5 motion-safe:animate-fade-in-up">
      <div className="mb-1 flex items-center gap-2">
        <Icon name="forum" className="text-[18px] text-gold/70" />
        <h3 className="font-label-caps text-label-caps text-on-surface-variant">
          Hỏi thêm Thuận Thiên
        </h3>
        <span className="ml-auto font-data-mono text-[11px] text-outline">
          {remaining}/{MAX_READING_FOLLOWUPS} câu còn lại
        </span>
      </div>
      <p className="mb-3 font-body-md text-xs text-outline">
        AI trả lời dựa trên chính bản luận giải này và kho tri thức của chuyên gia. Tối đa{" "}
        {MAX_READING_FOLLOWUPS} câu hỏi, không tốn lượt xem.
        {reading.type === "chi-tay" && (
          <>
            {" "}
            Có nốt ruồi mà ảnh chưa hiện rõ? Nhắn kèm vị trí (ví dụ &ldquo;gần gốc ngón út&rdquo;) — Thuận
            Thiên sẽ soi lại ảnh bàn tay của bạn.
          </>
        )}
      </p>

      {thread.length > 0 && (
        <div className="mb-3 space-y-2.5">
          {thread.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <p
                className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2 font-body-md text-sm ${
                  m.role === "user"
                    ? "rounded-br-sm bg-gold/15 text-on-surface"
                    : "rounded-bl-sm border border-white/10 bg-surface-container text-on-surface-variant"
                }`}
              >
                {m.content}
              </p>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {sending && (
        <p className="mb-3 flex items-center gap-2 font-body-md text-xs text-on-surface-variant">
          <Icon name="progress_activity" className="animate-spin text-[14px] text-gold" />
          Thuận Thiên đang trả lời…
        </p>
      )}

      {error && (
        <p className="mb-2 flex items-center gap-1.5 font-body-md text-xs text-error">
          <Icon name="error" className="text-[13px]" /> {error}
        </p>
      )}

      {remaining > 0 ? (
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={2}
            maxLength={500}
            placeholder={
              reading.type === "chi-tay"
                ? "Ví dụ: Tôi có nốt ruồi ở gần gốc ngón út, nó nói lên điều gì?"
                : "Ví dụ: Nốt ruồi ở cung này còn ý nghĩa nào khác không?"
            }
            disabled={!canAsk}
            className="min-h-[44px] flex-1 resize-none rounded-lg border border-white/15 bg-surface-container-lowest/70 px-3 py-2 font-body-md text-sm text-on-surface outline-none transition-colors focus:border-gold/60 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={() => void send()}
            disabled={draft.trim().length < 2 || !canAsk}
            className="press flex h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-lg bg-gold px-4 font-label-caps text-label-caps text-on-gold disabled:opacity-40"
          >
            <Icon name="send" className="text-[16px]" />
          </button>
        </div>
      ) : (
        <p className="flex items-start gap-1.5 rounded-lg border border-gold/20 bg-gold/[0.05] px-3 py-2.5 font-body-md text-xs text-on-surface-variant">
          <Icon name="info" className="mt-px shrink-0 text-[13px] text-gold/60" />
          Bạn đã dùng hết {MAX_READING_FOLLOWUPS} câu hỏi cho lần luận giải này. Cần trao đổi sâu hơn,
          hãy nhắn kênh Zalo của Phong Thủy Thuận Thiên.
        </p>
      )}
    </div>
  );
}
