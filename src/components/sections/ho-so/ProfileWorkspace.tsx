"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { ApiError } from "@/lib/api";
import { readings, type Reading } from "@/lib/endpoints";
import { useSession } from "@/components/session/SessionProvider";

type SaveState = "idle" | "saving" | "saved" | "error";

const FIELD =
  "w-full rounded-lg border border-white/15 bg-surface-container-lowest/70 px-3.5 py-2.5 font-body-md text-body-md text-on-surface outline-none transition-colors focus:border-gold/60 disabled:opacity-60";

function formatJoined(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const isValidAvatar = (v: string) => v === "" || /^https?:\/\/.+/i.test(v.trim());

export default function ProfileWorkspace() {
  const { status, isLoggedIn, user, wallet, updateProfile, logout } = useSession();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<Reading[] | null>(null);

  // Nạp giá trị hồ sơ hiện tại khi user sẵn sàng
  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    if (!isLoggedIn) return;
    readings
      .list()
      .then((res) => setItems(res.readings))
      .catch(() => setItems([]));
  }, [isLoggedIn]);

  const trimmedName = name.trim();
  const dirty = !!user && (trimmedName !== user.name || avatar.trim() !== (user.avatar || ""));
  const canSave = dirty && trimmedName.length >= 1 && trimmedName.length <= 80 && isValidAvatar(avatar);

  const readingCount = items?.length ?? null;
  const previewAvatar = isValidAvatar(avatar) ? avatar.trim() : user?.avatar || "";

  const initial = useMemo(() => (user?.name || "?").slice(0, 1).toUpperCase(), [user?.name]);

  const save = async () => {
    if (!canSave || !user) return;
    setSaveState("saving");
    setError(null);
    try {
      await updateProfile({ name: trimmedName, avatar: avatar.trim() });
      setSaveState("saved");
      window.setTimeout(() => setSaveState("idle"), 2500);
    } catch (err) {
      setSaveState("error");
      setError(err instanceof ApiError ? err.message : "Lưu hồ sơ thất bại. Vui lòng thử lại.");
    }
  };

  if (status === "loading") {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="skeleton h-64 w-full rounded-2xl" />
        <div className="skeleton h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!isLoggedIn || !user) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-surface-container-low p-10 text-center">
        <Icon name="lock" className="mb-4 text-4xl text-on-surface-variant" />
        <h2 className="font-headline-md text-headline-md text-white">Cần đăng nhập</h2>
        <p className="mb-8 mt-2 font-body-md text-body-md text-on-surface-variant">
          Đăng nhập để xem và chỉnh sửa hồ sơ của bạn.
        </p>
        <Link
          href="/dang-nhap?next=/ho-so"
          className="press inline-flex items-center gap-2 rounded-sm bg-gold px-6 py-3 font-label-caps text-label-caps text-on-gold"
        >
          Đăng nhập bằng Google
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-gutter">
      {/* ── Thông tin cá nhân ─────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8">
        <div className="mb-6 flex items-center gap-2">
          <Icon name="badge" className="text-[18px] text-gold/70" />
          <h2 className="font-label-caps text-label-caps text-on-surface-variant">Thông tin cá nhân</h2>
        </div>

        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="flex flex-col items-center gap-3">
            {previewAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element -- URL do người dùng nhập, preview trực tiếp
              <img
                alt={`Ảnh đại diện ${user.name}`}
                src={previewAvatar}
                className="h-24 w-24 rounded-full border border-white/10 object-cover"
              />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full border border-white/10 bg-white/5 font-headline-lg text-2xl text-white">
                {initial}
              </span>
            )}
            {user.isAdmin && (
              <span className="rounded bg-gold/15 px-2 py-0.5 font-data-mono text-[10px] text-gold">ADMIN</span>
            )}
          </div>

          <div className="flex-1 space-y-4">
            <label className="block">
              <span className="mb-1.5 block font-label-caps text-label-caps text-on-surface-variant">Tên hiển thị</span>
              <input
                className={FIELD}
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={80}
                placeholder="Nguyễn Văn A"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block font-label-caps text-label-caps text-on-surface-variant">
                Ảnh đại diện (URL)
              </span>
              <input
                className={FIELD}
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://…"
                inputMode="url"
              />
              {!isValidAvatar(avatar) && (
                <span className="mt-1 block font-body-md text-xs text-error">
                  Phải là đường dẫn bắt đầu bằng http:// hoặc https:// (để trống để bỏ ảnh).
                </span>
              )}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" value={user.email} />
              <Field label="Thành viên từ" value={formatJoined(user.createdAt)} />
            </div>
          </div>
        </div>

        {error && (
          <p className="mt-4 flex items-start gap-2 font-body-md text-sm text-error">
            <Icon name="error" className="mt-0.5 shrink-0 text-[16px]" />
            {error}
          </p>
        )}

        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={!canSave || saveState === "saving"}
            className="press flex items-center gap-2 rounded-sm bg-gold px-6 py-2.5 font-label-caps text-label-caps text-on-gold transition-shadow hover:shadow-[0_0_20px_rgba(212,175,55,0.3)] disabled:opacity-40 disabled:hover:shadow-none"
          >
            {saveState === "saving" ? (
              <>
                <Icon name="progress_activity" className="animate-spin text-[16px]" /> Đang lưu…
              </>
            ) : saveState === "saved" ? (
              <>
                <Icon name="check" className="text-[16px]" /> Đã lưu
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </button>
          {dirty && saveState !== "saving" && (
            <button
              type="button"
              onClick={() => {
                setName(user.name);
                setAvatar(user.avatar || "");
                setSaveState("idle");
                setError(null);
              }}
              className="press rounded-sm px-3 py-2.5 font-label-caps text-label-caps text-on-surface-variant hover:text-white"
            >
              Hoàn tác
            </button>
          )}
        </div>
      </section>

      {/* ── Ví lượt xem ───────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="account_balance_wallet" className="text-[18px] text-gold/70" />
            <h2 className="font-label-caps text-label-caps text-on-surface-variant">Ví lượt xem</h2>
          </div>
          <Link
            href="/nap-luot"
            className="press flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 font-data-mono text-[12px] text-gold hover:border-gold/60 hover:bg-gold/5"
          >
            <Icon name="add" className="text-[14px]" />
            Nạp lượt
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat icon="pan_tool" label="Chỉ tay" value={wallet.chiTay} />
          <Stat icon="face_retouching_natural" label="Nốt ruồi" value={wallet.notRuoi} />
        </div>
      </section>

      {/* ── Hoạt động ─────────────────────────────────────────────────── */}
      <section className="rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="insights" className="text-[18px] text-gold/70" />
            <h2 className="font-label-caps text-label-caps text-on-surface-variant">Hoạt động</h2>
          </div>
          <Link
            href="/lich-su"
            className="press flex items-center gap-1.5 font-label-caps text-label-caps text-on-surface-variant hover:text-gold"
          >
            <Icon name="history" className="text-[16px]" />
            Xem lịch sử
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Stat
            icon="auto_awesome"
            label="Lượt đã luận giải"
            value={readingCount === null ? "…" : readingCount}
          />
          <Stat icon="bolt" label="Lượt còn lại" value={wallet.chiTay + wallet.notRuoi} />
        </div>
      </section>

      <button
        type="button"
        onClick={logout}
        className="press flex w-full items-center justify-center gap-2 rounded-sm border border-white/15 py-3 font-label-caps text-label-caps text-on-surface-variant hover:border-error/40 hover:text-error"
      >
        <Icon name="logout" className="text-[16px]" />
        Đăng xuất
      </button>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="font-data-mono text-[10px] uppercase tracking-wide text-outline">{label}</p>
      <p className="truncate font-body-md text-sm text-on-surface">{value || "—"}</p>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/5 bg-surface-container-lowest/60 p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-gold">
        <Icon name={icon} className="text-[18px]" />
      </span>
      <div>
        <p className="font-headline-lg text-[24px] leading-none text-white">{value}</p>
        <p className="mt-1 font-body-md text-xs text-on-surface-variant">{label}</p>
      </div>
    </div>
  );
}
