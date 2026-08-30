"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Icon from "@/components/ui/Icon";
import { ApiError } from "@/lib/api";
import { admin, formatVnd, type AdminUserRow, type AdminUserStats } from "@/lib/endpoints";
import { useSession } from "@/components/session/SessionProvider";

export default function UsersAdmin() {
  const { user: me } = useSession();
  const [rows, setRows] = useState<AdminUserRow[] | null>(null);
  const [stats, setStats] = useState<AdminUserStats | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await admin.users({ q: q || undefined, status: statusFilter || undefined });
      setRows(res.users);
      setStats(res.stats);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tải được danh sách người dùng.");
      setRows([]);
    }
  }, [q, statusFilter]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const toggleLock = async (row: AdminUserRow) => {
    setPendingId(row.id);
    try {
      await admin.updateUser(row.id, { status: row.status === "locked" ? "active" : "locked" });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Thao tác thất bại.");
    } finally {
      setPendingId(null);
    }
  };

  const grantCredit = async (row: AdminUserRow, kind: "chiTay" | "notRuoi") => {
    setPendingId(row.id);
    try {
      await admin.updateUser(row.id, kind === "chiTay" ? { addChiTay: 1 } : { addNotRuoi: 1 });
      await load();
    } catch {
      /* noop */
    } finally {
      setPendingId(null);
    }
  };

  const toggleAdmin = async (row: AdminUserRow) => {
    const grant = !row.isAdmin;
    const ok = window.confirm(
      grant
        ? `Cấp quyền QUẢN TRỊ cho "${row.name}" (${row.email})?\nHọ sẽ truy cập được toàn bộ trang quản trị.`
        : `Thu hồi quyền quản trị của "${row.name}"?`,
    );
    if (!ok) return;
    setPendingId(row.id);
    try {
      await admin.updateUser(row.id, { isAdmin: grant });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không đổi được quyền quản trị.");
    } finally {
      setPendingId(null);
    }
  };

  const statCards = stats
    ? [
        { label: "TỔNG NGƯỜI DÙNG", value: stats.total, icon: "groups" },
        { label: "QUẢN TRỊ VIÊN", value: stats.admins, icon: "shield_person" },
        { label: "ĐANG HOẠT ĐỘNG", value: stats.active, icon: "monitoring" },
        { label: "HOẠT ĐỘNG 24H QUA", value: stats.activeRecently, icon: "bolt" },
      ]
    : [];

  return (
    <>
      <header className="mb-10 pt-8 md:pt-0">
        <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant opacity-60">
          QUẢN TRỊ HỆ THỐNG / PHONG THỦY THUẬN THIÊN
        </p>
        <h2 className="font-display-lg text-headline-lg-mobile text-white md:text-display-lg">Quản lý Người dùng</h2>
      </header>

      <section className="mb-12 grid grid-cols-2 gap-4 xl:grid-cols-4">
        {(stats ? statCards : Array.from({ length: 4 })).map((s, i) =>
          s ? (
            <div
              key={(s as { label: string }).label}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-container-low p-5 motion-safe:animate-fade-in-up"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="mb-6 flex items-start justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant">{(s as any).label}</span>
                <Icon name={(s as any).icon} className="text-white/40" />
              </div>
              <span className="font-headline-lg text-headline-lg font-bold text-white">
                {(s as any).value.toLocaleString("vi-VN")}
              </span>
            </div>
          ) : (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ),
        )}
      </section>

      <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative w-full md:w-96">
          <Icon name="search" className="absolute left-0 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm theo tên, email, ID…"
            className="w-full border-0 border-b border-white/20 bg-transparent py-2 pl-8 font-body-md text-body-md text-white outline-none transition-colors focus:border-gold placeholder:text-on-surface-variant/60"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="cursor-pointer border-0 border-b border-white/20 bg-surface-dim py-2 pr-8 font-body-md text-body-md text-white outline-none focus:border-gold"
        >
          <option value="">Trạng thái (Tất cả)</option>
          <option value="active">Hoạt động</option>
          <option value="locked">Bị khóa</option>
        </select>
      </section>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/10 px-4 py-3 text-sm text-error">
          <Icon name="error" className="text-[16px]" />
          {error}
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-white/10 bg-surface-container-low">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 font-label-caps text-label-caps text-on-surface-variant">
                <th className="p-4 font-normal">Người dùng</th>
                <th className="p-4 text-right font-normal">Ví (CT / NR)</th>
                <th className="hidden p-4 text-right font-normal md:table-cell">Đã nạp</th>
                <th className="hidden p-4 text-right font-normal lg:table-cell">Lượt đã dùng</th>
                <th className="p-4 font-normal">Trạng thái</th>
                <th className="p-4 text-right font-normal">Hành động</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {rows === null &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-4" colSpan={6}>
                      <div className="skeleton h-8 w-full rounded" />
                    </td>
                  </tr>
                ))}
              {rows?.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-on-surface-variant">
                    Không có người dùng nào khớp.
                  </td>
                </tr>
              )}
              {rows?.map((u) => {
                const locked = u.status === "locked";
                return (
                  <tr key={u.id} className={`border-b border-white/5 transition-colors last:border-0 hover:bg-white/5 ${locked ? "opacity-60 hover:opacity-100" : ""}`}>
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {u.avatar ? (
                          <Image
                            alt={u.name}
                            src={u.avatar}
                            width={32}
                            height={32}
                            unoptimized={u.avatar.endsWith(".svg")}
                            className={`h-8 w-8 rounded-full border border-white/10 object-cover ${locked ? "grayscale" : ""}`}
                          />
                        ) : (
                          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs text-white">
                            {u.name.slice(0, 1)}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className={`font-medium text-white ${locked ? "line-through decoration-white/30" : ""}`}>
                            {u.name}
                            {u.isAdmin && <span className="ml-2 rounded bg-gold/15 px-1.5 py-0.5 text-[10px] text-gold">ADMIN</span>}
                          </p>
                          <p className="truncate text-[13px] text-on-surface-variant">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-data-mono text-data-mono text-on-surface-variant">
                      {u.wallet.chiTay} / {u.wallet.notRuoi}
                    </td>
                    <td className="hidden p-4 text-right font-data-mono text-data-mono text-on-surface md:table-cell">
                      {formatVnd(u.totalTopUp)}
                    </td>
                    <td className="hidden p-4 text-right font-data-mono text-data-mono text-on-surface-variant lg:table-cell">
                      {u.readingCount}
                    </td>
                    <td className="p-4">
                      {locked ? (
                        <span className="flex items-center gap-2 text-on-surface-variant">
                          <Icon name="lock" className="text-[16px]" /> Bị khóa
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full bg-wood" /> Hoạt động
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => toggleAdmin(u)}
                          disabled={pendingId === u.id || u.id === me?.id}
                          title={
                            u.id === me?.id
                              ? "Không thể tự đổi quyền của mình"
                              : u.isAdmin
                                ? "Thu hồi quyền quản trị"
                                : "Cấp quyền quản trị"
                          }
                          className={`press rounded p-1.5 transition-colors disabled:opacity-30 ${
                            u.isAdmin
                              ? "text-gold hover:text-error"
                              : "text-on-surface-variant hover:text-gold"
                          }`}
                        >
                          <Icon
                            name={u.isAdmin ? "shield_person" : "add_moderator"}
                            filled={u.isAdmin}
                            className="text-[18px]"
                          />
                        </button>
                        <button
                          type="button"
                          onClick={() => grantCredit(u, "chiTay")}
                          disabled={pendingId === u.id}
                          title="Tặng 1 lượt Chỉ tay"
                          className="press rounded p-1.5 text-on-surface-variant transition-colors hover:text-gold disabled:opacity-40"
                        >
                          <Icon name="pan_tool" className="text-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => grantCredit(u, "notRuoi")}
                          disabled={pendingId === u.id}
                          title="Tặng 1 lượt Nốt ruồi"
                          className="press rounded p-1.5 text-on-surface-variant transition-colors hover:text-gold disabled:opacity-40"
                        >
                          <Icon name="face_retouching_natural" className="text-[18px]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleLock(u)}
                          disabled={pendingId === u.id}
                          title={locked ? "Mở khóa" : "Khóa tài khoản"}
                          className={`press rounded p-1.5 transition-colors disabled:opacity-40 ${
                            locked ? "text-on-surface-variant hover:text-wood" : "text-on-surface-variant hover:text-error"
                          }`}
                        >
                          <Icon name={pendingId === u.id ? "progress_activity" : locked ? "lock_open" : "lock"} className={`text-[18px] ${pendingId === u.id ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows && (
          <div className="border-t border-white/10 bg-white/5 p-4 font-data-mono text-data-mono text-on-surface-variant">
            {rows.length} người dùng
          </div>
        )}
      </section>
    </>
  );
}
