"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import EngineBadge from "@/components/ui/EngineBadge";
import SiteHeader from "@/components/layout/SiteHeader";
import { ApiError } from "@/lib/api";
import { chat, type ChatMessage, type ChatThread } from "@/lib/endpoints";
import { useSession } from "@/components/session/SessionProvider";
import { SUGGESTIONS } from "./chatData";

const DISCLAIMER =
  "Năng lượng tuôn chảy theo ý định. Trí tuệ AI là người dẫn đường, không phải định mệnh tuyệt đối.";

export default function ChatWorkspace() {
  const { isLoggedIn, user, status } = useSession();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    chat
      .threads()
      .then((res) => setThreads(res.threads))
      .catch(() => undefined);
  }, [isLoggedIn]);

  const openThread = useCallback(
    async (id: string) => {
      setActiveId(id);
      setDrawerOpen(false);
      setError(null);
      try {
        const res = await chat.thread(id);
        setMessages(res.thread.messages ?? []);
        scrollToEnd();
      } catch {
        setMessages([]);
      }
    },
    [scrollToEnd],
  );

  const newThread = () => {
    setActiveId(null);
    setMessages([]);
    setError(null);
    setDrawerOpen(false);
  };

  const send = async (text: string) => {
    const content = text.trim();
    if (!content || sending) return;
    setInput("");
    setError(null);
    setSending(true);

    const optimistic: ChatMessage = {
      id: `tmp-${Date.now()}`,
      threadId: activeId ?? "new",
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    scrollToEnd();

    try {
      const res = await chat.send(activeId ?? "new", content);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== optimistic.id),
        res.userMessage,
        res.reply,
      ]);
      if (res.threadId !== activeId) {
        setActiveId(res.threadId);
        const list = await chat.threads();
        setThreads(list.threads);
      } else {
        setThreads((prev) =>
          prev
            .map((t) => (t.id === res.threadId ? { ...t, updatedAt: res.reply.createdAt } : t))
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
        );
      }
      scrollToEnd();
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setInput(content);
      setError(err instanceof ApiError ? err.message : "Không gửi được tin nhắn. Thử lại sau.");
    } finally {
      setSending(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="flex h-[100dvh] items-center justify-center bg-background">
        <Icon name="progress_activity" className="animate-spin text-3xl text-gold" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-[100dvh] flex-col bg-background">
        <SiteHeader active="ai-chat" />
        <div className="flex flex-1 items-center justify-center px-margin-mobile pt-24">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-container-low p-10 text-center motion-safe:animate-scale-in">
            <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-gold/30 bg-gold/10">
              <Icon name="forum" className="text-2xl text-gold" />
            </div>
            <h2 className="font-headline-md text-headline-md text-white">Đăng nhập để trò chuyện</h2>
            <p className="mt-2 font-body-md text-body-md text-on-surface-variant">
              Cố vấn AI ghi nhớ từng cuộc trò chuyện của bạn. Đăng nhập để bắt đầu.
            </p>
            <Link
              href="/dang-nhap?next=/co-van"
              className="press mt-6 inline-block rounded-sm bg-gold px-8 py-3 font-label-caps text-label-caps text-on-gold"
            >
              Đăng nhập bằng Google
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <ThreadSidebar
        threads={threads}
        activeId={activeId}
        user={user}
        onOpen={openThread}
        onNew={newThread}
        drawerOpen={drawerOpen}
        onCloseDrawer={() => setDrawerOpen(false)}
      />

      <main className="relative flex min-w-0 flex-1 flex-col">
        <SiteHeader active="ai-chat" sidebarOffset />

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="press tap-target absolute left-3 top-[76px] z-30 flex items-center justify-center rounded-full border border-white/15 bg-surface-container/80 text-white backdrop-blur md:hidden"
          aria-label="Danh sách trò chuyện"
        >
          <Icon name="menu_open" />
        </button>

        <div ref={scrollRef} className="flex flex-1 flex-col items-center overflow-y-auto px-4 pb-40 pt-24 md:px-margin-desktop md:pt-32">
          <div className="w-full max-w-3xl space-y-6">
            {messages.length === 0 ? (
              <WelcomeScreen onPick={send} />
            ) : (
              messages.map((m, i) => <Bubble key={m.id} message={m} index={i} />)
            )}
            {sending && <TypingBubble />}
            {error && (
              <p className="flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/10 px-4 py-3 font-body-md text-sm text-error">
                <Icon name="error" className="text-[16px]" />
                {error}
              </p>
            )}
          </div>
        </div>

        <Composer value={input} onChange={setInput} onSend={() => send(input)} disabled={sending} />
      </main>
    </div>
  );
}

function ThreadSidebar({
  threads,
  activeId,
  user,
  onOpen,
  onNew,
  drawerOpen,
  onCloseDrawer,
}: {
  threads: ChatThread[];
  activeId: string | null;
  user: { name: string; avatar: string } | null;
  onOpen: (id: string) => void;
  onNew: () => void;
  drawerOpen: boolean;
  onCloseDrawer: () => void;
}) {
  const body = (
    <>
      <div className="mb-6">
        <h1 className="font-headline-md text-headline-md text-gold">Cố vấn</h1>
        <p className="mt-1 text-sm text-on-surface-variant">Cố vấn Thuận Thiên</p>
      </div>
      <button
        type="button"
        onClick={onNew}
        className="press mb-6 flex w-full items-center justify-center gap-2 rounded-lg bg-gold py-3 font-label-caps text-label-caps text-on-gold"
      >
        <Icon name="add" className="text-sm" />
        Phân tích mới
      </button>
      <div className="flex-1 space-y-1 overflow-y-auto">
        {threads.length === 0 && (
          <p className="px-3 py-2 font-body-md text-sm text-outline">Chưa có cuộc trò chuyện nào.</p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => onOpen(t.id)}
            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
              t.id === activeId ? "bg-surface-variant/40 text-gold" : "text-on-surface-variant hover:bg-surface-variant/30"
            }`}
          >
            <Icon name="chat_bubble" className="shrink-0 text-[16px]" />
            <span className="truncate font-body-md text-sm">{t.title}</span>
          </button>
        ))}
      </div>
      {user && (
        <div className="mt-auto flex items-center gap-3 border-t border-white/5 pt-4">
          {user.avatar ? (
            <Image
              alt={`Ảnh đại diện ${user.name}`}
              src={user.avatar}
              width={40}
              height={40}
              unoptimized={user.avatar.endsWith(".svg")}
              className="h-10 w-10 rounded-full border border-white/10 object-cover"
            />
          ) : (
            <span className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
              {user.name.slice(0, 1)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-label-caps text-label-caps text-gold">{user.name}</p>
            <p className="text-xs text-on-surface-variant">Đã căn chỉnh</p>
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <aside className="hidden h-[100dvh] w-64 shrink-0 flex-col border-r border-white/5 bg-surface-container-low p-gutter md:flex">
        {body}
      </aside>

      {/* drawer mobile */}
      <div className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={onCloseDrawer}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[82%] max-w-xs flex-col border-r border-white/10 bg-surface-container-low p-gutter transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {body}
        </aside>
      </div>
    </>
  );
}

function WelcomeScreen({ onPick }: { onPick: (prompt: string) => void }) {
  return (
    <div className="flex flex-col items-center space-y-6 pb-6 pt-4 text-center motion-safe:animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/10 bg-surface-container-low">
        <Icon name="spa" weight={300} className="text-3xl text-gold" />
      </div>
      <div>
        <h2 className="font-headline-lg text-headline-lg text-white">Hôm nay tôi có thể trợ giúp gì cho bạn?</h2>
        <p className="mx-auto mt-2 max-w-lg font-body-lg text-body-lg text-on-surface-variant">
          Tham vấn trí tuệ cổ xưa qua tính toán hiện đại — về phương hướng, Ngũ Hành và sự cân bằng
          không gian.
        </p>
      </div>
      <div className="grid w-full gap-3 sm:grid-cols-2">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={s.title}
            type="button"
            onClick={() => onPick(s.prompt)}
            style={{ animationDelay: `${i * 70}ms` }}
            className="press group flex items-start gap-3 rounded-xl border border-white/10 bg-surface-container-low p-4 text-left transition-colors hover:border-gold/40 motion-safe:animate-fade-in-up"
          >
            <Icon name={s.icon} className="mt-0.5 text-[20px] text-gold/70 transition-colors group-hover:text-gold" />
            <span>
              <span className="block font-label-caps text-label-caps text-white">{s.title}</span>
              <span className="mt-1 block font-body-md text-sm text-on-surface-variant line-clamp-2">
                {s.prompt}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ message, index }: { message: ChatMessage; index: number }) {
  const isUser = message.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end motion-safe:animate-fade-in-up" style={{ animationDelay: `${Math.min(index, 6) * 30}ms` }}>
        <div className="max-w-[85%] rounded-2xl rounded-tr-sm border border-white/5 bg-surface-container-highest px-5 py-3.5 font-body-md text-body-md text-on-surface">
          {message.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 motion-safe:animate-fade-in-up">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-highest">
        <Icon name="spa" className="text-sm text-gold" />
      </div>
      <div className="max-w-[90%] space-y-4 rounded-2xl rounded-tl-sm border border-white/10 bg-surface-container-low px-5 py-4">
        <p className="whitespace-pre-line font-body-md text-body-md leading-relaxed text-on-surface">
          {message.content}
        </p>
        {message.cards && message.cards.length > 0 && (
          <div className="grid gap-3 sm:grid-cols-2">
            {message.cards.map((card) => (
              <div key={card.label} className="rounded-lg border border-white/5 bg-surface-variant/30 p-3">
                <div className="mb-1.5 flex items-center gap-2">
                  <Icon
                    name={card.icon}
                    className={`text-sm ${
                      card.iconColor === "wood" ? "text-wood" : card.iconColor === "water" ? "text-water" : "text-fire"
                    }`}
                  />
                  <span className="font-label-caps text-label-caps text-on-surface-variant">{card.label}</span>
                </div>
                <p className="font-medium text-gold">{card.value}</p>
              </div>
            ))}
          </div>
        )}
        {message.engine && (
          <div className="pt-1">
            <EngineBadge engine={message.engine} />
          </div>
        )}
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-surface-container-highest">
        <Icon name="spa" className="text-sm text-gold" />
      </div>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm border border-white/10 bg-surface-container-low px-5 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 rounded-full bg-gold/70 motion-safe:animate-dot-bounce"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
    </div>
  );
}

function Composer({
  value,
  onChange,
  onSend,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  return (
    <div className="glass-panel absolute bottom-0 z-30 w-full border-t border-white/10 px-4 py-4 md:px-margin-desktop">
      <div className="mx-auto max-w-3xl">
        <div className="chat-input-focus flex items-end gap-2 rounded-xl border border-white/10 bg-surface-container px-3 py-2 transition-all duration-300">
          <textarea
            ref={ref}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            rows={1}
            placeholder="Tìm kiếm sự chỉ dẫn…"
            className="max-h-40 min-h-[40px] w-full resize-none bg-transparent py-2 font-body-md text-white outline-none placeholder:text-on-surface-variant/50"
          />
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold text-on-gold transition-opacity disabled:opacity-40"
            aria-label="Gửi"
          >
            <Icon name={disabled ? "progress_activity" : "send"} filled className={disabled ? "animate-spin" : ""} />
          </button>
        </div>
        <p className="mt-2 text-center font-label-caps text-[10px] text-on-surface-variant/60">{DISCLAIMER}</p>
      </div>
    </div>
  );
}
