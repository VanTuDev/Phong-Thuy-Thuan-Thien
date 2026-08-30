"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/ui/Icon";
import { ApiError } from "@/lib/api";
import { admin, formatVnd, type AdminFinance } from "@/lib/endpoints";

const STATUS: Record<string, { label: string; cls: string }> = {
  success: { label: "Thành công", cls: "border-gold/30 text-gold" },
  pending: { label: "Chờ xử lý", cls: "border-white/20 text-on-surface-variant" },
  failed: { label: "Thất bại", cls: "border-error/30 text-error" },
};
const PKG_LABEL: Record<string, string> = { "chi-tay": "Chỉ tay", "not-ruoi": "Nốt ruồi", combo: "Combo" };

export default function FinanceAdmin() {
  const [data, setData] = useState<AdminFinance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    admin
      .finance()
      .then(setData)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Không tải được dữ liệu tài chính."));
  }, []);

  const stats = data
    ? [
        { label: "DOANH THU HÔM NAY", value: formatVnd(data.stats.revenueToday), icon: "payments" },
        { label: "DOANH THU THÁNG NÀY", value: formatVnd(data.stats.revenueMonth), icon: "monitoring" },
        { label: "LƯỢT XEM ĐÃ BÁN", value: data.stats.creditsSold.toLocaleString("vi-VN"), icon: "confirmation_number" },
        { label: "GIAO DỊCH HÔM NAY", value: data.stats.ordersToday.toLocaleString("vi-VN"), icon: "receipt_long" },
      ]
    : [];

  const maxMonthly = data ? Math.max(1, ...data.monthlyRevenue.map((m) => m.amount)) : 1;
  const niceMax = Math.ceil(maxMonthly / 1_000_000) * 1_000_000 || 1;
  const maxPkg = data ? Math.max(1, ...data.byPackage.map((b) => b.amount)) : 1;

  return (
    <>
      <header className="mb-10 pt-8 md:pt-0">
        <p className="mb-2 font-label-caps text-label-caps text-on-surface-variant opacity-60">
          QUẢN TRỊ HỆ THỐNG / PHONG THỦY THUẬN THIÊN
        </p>
        <h2 className="font-display-lg text-headline-lg-mobile text-white md:text-display-lg">Quản lý Tài chính</h2>
      </header>

      {error && (
        <p className="mb-4 flex items-center gap-2 rounded-lg border border-error/30 bg-error-container/10 px-4 py-3 text-sm text-error">
          <Icon name="error" className="text-[16px]" /> {error}
        </p>
      )}

      <section className="mb-gutter grid grid-cols-2 gap-4 xl:grid-cols-4">
        {(data ? stats : Array.from({ length: 4 })).map((s, i) =>
          s ? (
            <div
              key={(s as any).label}
              style={{ animationDelay: `${i * 60}ms` }}
              className="relative overflow-hidden rounded-xl border border-white/10 bg-surface-container-low p-5 motion-safe:animate-fade-in-up"
            >
              <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/5 blur-2xl" />
              <div className="mb-6 flex items-start justify-between">
                <span className="font-label-caps text-label-caps text-on-surface-variant">{(s as any).label}</span>
                <Icon name={(s as any).icon} className="text-gold/60" />
              </div>
              <span className="font-headline-lg text-headline-lg font-bold text-white">{(s as any).value}</span>
            </div>
          ) : (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ),
        )}
      </section>

      {/* Biểu đồ cột doanh thu 12 tháng */}
      <section className="mb-gutter rounded-xl border border-white/10 bg-surface-container-low p-6">
        <h3 className="mb-8 flex items-center gap-3 font-headline-md text-headline-md text-white">
          <Icon name="show_chart" className="text-[20px] text-white/50" />
          Doanh thu 12 tháng gần nhất
        </h3>
        {data ? (
          <div className="overflow-x-auto">
            <div className="flex min-w-[640px] items-end gap-2" style={{ height: 220 }}>
              {data.monthlyRevenue.map((m) => (
                <div key={m.key} className="group relative flex h-full flex-1 items-end justify-center">
                  <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded border border-white/10 bg-surface-container/90 px-2 py-1 font-data-mono text-[11px] text-white opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100"
                    style={{ bottom: `calc(${(m.amount / niceMax) * 100}% + 8px)` }}
                  >
                    {formatVnd(m.amount)}
                  </div>
                  <div
                    className="w-full max-w-7 rounded-t bg-gold/80 transition-colors group-hover:bg-gold"
                    style={{ height: `${Math.max(2, (m.amount / niceMax) * 100)}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex min-w-[640px] gap-2">
              {data.monthlyRevenue.map((m) => (
                <span key={m.key} className="flex-1 text-center font-data-mono text-[11px] text-on-surface-variant">
                  {m.label}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <div className="skeleton h-56 w-full rounded-lg" />
        )}
      </section>

      {/* Doanh thu theo gói */}
      <section className="mb-gutter rounded-xl border border-white/10 bg-surface-container-low p-6">
        <h3 className="mb-6 flex items-center gap-3 font-headline-md text-headline-md text-white">
          <Icon name="bar_chart" className="text-[20px] text-white/50" />
          Doanh thu theo gói (tháng này)
        </h3>
        <div className="space-y-5">
          {(data?.byPackage ?? []).map((b) => (
            <div key={b.packageId}>
              <div className="mb-2 flex items-center justify-between font-body-md text-body-md">
                <span className="text-on-surface">{b.label}</span>
                <span className="font-data-mono text-data-mono text-on-surface-variant">{formatVnd(b.amount)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/5">
                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${(b.amount / maxPkg) * 100}%` }} />
              </div>
            </div>
          ))}
          {!data && <div className="skeleton h-24 w-full rounded" />}
        </div>
      </section>

      {/* Giao dịch */}
      <section className="overflow-hidden rounded-xl border border-white/10 bg-surface-container-low">
        <h3 className="flex items-center gap-3 border-b border-white/10 px-6 py-4 font-headline-md text-headline-md text-white">
          <Icon name="receipt_long" className="text-[20px] text-white/50" />
          Giao dịch gần đây
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 font-label-caps text-label-caps text-on-surface-variant">
                <th className="p-4 font-normal">Mã GD</th>
                <th className="p-4 font-normal">Người dùng</th>
                <th className="hidden p-4 font-normal md:table-cell">Gói</th>
                <th className="p-4 text-right font-normal">Số tiền</th>
                <th className="hidden p-4 font-normal lg:table-cell">Thời gian</th>
                <th className="p-4 text-right font-normal">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="font-body-md text-body-md">
              {(data?.transactions ?? []).map((tx) => (
                <tr key={tx.id} className="border-b border-white/5 last:border-0 hover:bg-white/5">
                  <td className="p-4 font-data-mono text-data-mono text-on-surface-variant">{tx.id}</td>
                  <td className="p-4">
                    <p className="font-medium text-white">{tx.userName}</p>
                    <p className="text-[13px] text-on-surface-variant">{tx.userEmail}</p>
                  </td>
                  <td className="hidden p-4 text-on-surface-variant md:table-cell">
                    {PKG_LABEL[tx.package]} × {tx.quantity}
                  </td>
                  <td className="p-4 text-right font-data-mono text-data-mono text-white">{formatVnd(tx.amount)}</td>
                  <td className="hidden p-4 font-data-mono text-data-mono text-on-surface-variant lg:table-cell">{tx.createdAt}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-label-caps text-[10px] ${STATUS[tx.status]?.cls}`}>
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      {STATUS[tx.status]?.label}
                    </span>
                  </td>
                </tr>
              ))}
              {!data &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-white/5">
                    <td className="p-4" colSpan={6}>
                      <div className="skeleton h-8 w-full rounded" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
