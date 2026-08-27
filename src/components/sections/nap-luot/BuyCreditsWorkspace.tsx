"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import QrCode from "./QrCode";
import { PACKAGES as FALLBACK_PACKAGES } from "./packageData";
import { ApiError } from "@/lib/api";
import { orders, formatVnd, type PackageId, type PaymentInfo } from "@/lib/endpoints";
import { useSession } from "@/components/session/SessionProvider";

type Phase = "select" | "qr" | "success";
const QR_SECONDS = 300;

const ICONS: Record<PackageId, string> = {
  "chi-tay": "pan_tool",
  "not-ruoi": "face_retouching_natural",
  combo: "workspace_premium",
};

function countdown(total: number) {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function BuyCreditsWorkspace() {
  const { isLoggedIn, wallet, setWallet, status } = useSession();
  const [packages, setPackages] = useState(
    FALLBACK_PACKAGES.map((p) => ({ id: p.id, title: p.title, unitLabel: p.unitLabel, unitPrice: p.pricePerUnit })),
  );
  const [phase, setPhase] = useState<Phase>("select");
  const [selectedId, setSelectedId] = useState<PackageId>("combo");
  const [quantity, setQuantity] = useState(1);
  const [orderId, setOrderId] = useState("");
  const [payment, setPayment] = useState<PaymentInfo | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(QR_SECONDS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => packages.find((p) => p.id === selectedId) ?? packages[0],
    [packages, selectedId],
  );
  const total = selected.unitPrice * quantity;

  useEffect(() => {
    orders
      .packages()
      .then((res) => res.packages.length && setPackages(res.packages))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (phase !== "qr" || secondsLeft <= 0) return;
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearInterval(t);
  }, [phase, secondsLeft]);

  if (status === "loading") {
    return <div className="skeleton mx-auto h-96 w-full max-w-3xl rounded-2xl" />;
  }

  if (!isLoggedIn) {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-surface-container-low p-10 text-center">
        <Icon name="lock" className="mb-4 text-4xl text-on-surface-variant" />
        <h2 className="font-headline-md text-headline-md text-white">Cần đăng nhập</h2>
        <p className="mb-8 mt-2 font-body-md text-body-md text-on-surface-variant">
          Đăng nhập bằng Google để nạp lượt xem và lưu lịch sử luận giải.
        </p>
        <Link
          href="/dang-nhap?next=/nap-luot"
          className="press inline-block rounded-sm bg-gold px-6 py-3 font-label-caps text-label-caps text-on-gold"
        >
          Đăng nhập bằng Google
        </Link>
      </div>
    );
  }

  const createOrder = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await orders.create(selectedId, quantity);
      setOrderId(res.order.id);
      setPayment(res.payment);
      setSecondsLeft(QR_SECONDS);
      setPhase("qr");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Không tạo được đơn hàng.");
    } finally {
      setBusy(false);
    }
  };

  const confirmPaid = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await orders.confirm(orderId);
      setWallet(res.wallet);
      setPhase("success");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Xác nhận thất bại.");
    } finally {
      setBusy(false);
    }
  };

  // ── QR ────────────────────────────────────────────────────────────────────
  if (phase === "qr" && payment) {
    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/10 bg-surface-container-low p-6 motion-safe:animate-scale-in sm:p-10">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="font-headline-md text-headline-md text-white">Quét mã để thanh toán</h2>
          <span className="flex items-center gap-1.5 font-data-mono text-data-mono text-gold">
            <Icon name="schedule" className="text-[16px]" />
            {countdown(Math.max(secondsLeft, 0))}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <QrCode seedText={payment.qrSeed} />
          <p className="mt-4 font-data-mono text-[12px] text-on-surface-variant">
            Nội dung CK: <span className="text-on-surface">{payment.transferContent}</span>
          </p>
        </div>

        <div className="mt-8 space-y-3 border-t border-white/10 pt-6 font-body-md text-body-md">
          <Row label="Ngân hàng" value={payment.bank.name} />
          <Row label="Chủ tài khoản" value={payment.bank.accountName} />
          <Row label="Số tài khoản" value={payment.bank.accountNumber} mono />
          <div className="flex items-baseline justify-between pt-2">
            <span className="text-on-surface-variant">Số tiền</span>
            <span className="font-headline-md text-headline-md text-gold">{formatVnd(payment.amount)}</span>
          </div>
        </div>

        {error && <p className="mt-4 text-center font-body-md text-sm text-error">{error}</p>}

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={confirmPaid}
            disabled={busy}
            className="press flex w-full items-center justify-center gap-2 rounded-sm bg-gold py-4 font-label-caps text-label-caps text-on-gold disabled:opacity-60"
          >
            <Icon name={busy ? "progress_activity" : "qr_code_scanner"} className={busy ? "animate-spin" : "text-[18px]"} />
            {busy ? "Đang xác nhận…" : "Tôi đã thanh toán"}
          </button>
          <button
            type="button"
            onClick={() => {
              void orders.cancel(orderId);
              setPhase("select");
            }}
            className="press w-full rounded-sm border border-white/20 py-3 font-label-caps text-label-caps text-on-surface-variant hover:bg-white/5 hover:text-white"
          >
            Huỷ, quay lại chọn gói
          </button>
        </div>
      </div>
    );
  }

  // ── Success ───────────────────────────────────────────────────────────────
  if (phase === "success") {
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-surface-container-low p-10 text-center motion-safe:animate-scale-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-wood/30 bg-wood/10">
          <Icon name="check_circle" className="text-3xl text-wood" />
        </div>
        <h2 className="font-headline-md text-headline-md text-white">Thanh toán thành công</h2>
        <p className="mb-8 mt-2 font-body-md text-body-md text-on-surface-variant">
          Đã cộng {quantity} {selected.unitLabel} ({selected.title}) vào tài khoản của bạn.
        </p>

        <div className="mb-10 flex justify-center gap-10 font-data-mono">
          <div>
            <p className="mb-1 text-[12px] text-on-surface-variant">CHỈ TAY</p>
            <p className="text-headline-md text-gold">{wallet.chiTay}</p>
          </div>
          <div>
            <p className="mb-1 text-[12px] text-on-surface-variant">NỐT RUỒI</p>
            <p className="text-headline-md text-gold">{wallet.notRuoi}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/phan-tich-chi-tay" className="press rounded-sm bg-gold py-3 font-label-caps text-label-caps text-on-gold">
            Xem Chỉ tay ngay
          </Link>
          <Link href="/phan-tich-not-ruoi" className="press rounded-sm border border-white/20 py-3 font-label-caps text-label-caps text-on-surface hover:bg-white/5">
            Xem Nốt ruồi ngay
          </Link>
          <button
            type="button"
            onClick={() => {
              setQuantity(1);
              setPhase("select");
            }}
            className="press py-3 font-label-caps text-label-caps text-on-surface-variant hover:text-gold"
          >
            Mua thêm lượt
          </button>
        </div>
      </div>
    );
  }

  // ── Select ────────────────────────────────────────────────────────────────
  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-gutter grid grid-cols-1 gap-gutter md:grid-cols-3">
        {packages.map((pkg, i) => {
          const active = pkg.id === selectedId;
          return (
            <button
              key={pkg.id}
              type="button"
              onClick={() => setSelectedId(pkg.id)}
              style={{ animationDelay: `${i * 70}ms` }}
              className={`press flex flex-col gap-3 rounded-2xl border p-6 text-left transition-all duration-300 motion-safe:animate-fade-in-up ${
                active
                  ? "border-gold bg-gold/5 shadow-[0_0_24px_rgba(212,175,55,0.12)]"
                  : "border-white/10 bg-surface-container-low hover:border-white/30"
              }`}
            >
              <Icon name={ICONS[pkg.id]} className={`text-2xl ${active ? "text-gold" : "text-on-surface-variant"}`} />
              <h3 className="font-headline-md text-[20px] text-white">{pkg.title}</h3>
              <p className="flex-grow font-body-md text-sm text-on-surface-variant">
                {pkg.id === "combo"
                  ? "1 combo = 1 lượt Chỉ tay + 1 lượt Nốt ruồi, tiết kiệm hơn mua lẻ."
                  : `Luận giải AI cho ${pkg.id === "chi-tay" ? "lòng bàn tay" : "khuôn mặt"} của bạn.`}
              </p>
              <p className="font-data-mono text-data-mono text-gold">
                {formatVnd(pkg.unitPrice)} / {pkg.unitLabel}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex flex-col justify-between gap-6 rounded-2xl border border-white/10 bg-surface-container-low p-6 sm:p-8 md:flex-row md:items-center">
        <div className="flex items-center gap-4">
          <span className="font-label-caps text-label-caps text-on-surface-variant">Số lượng</span>
          <div className="flex items-center rounded-full border border-white/20">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="press flex h-10 w-10 items-center justify-center text-white hover:text-gold"
              aria-label="Giảm"
            >
              <Icon name="remove" className="text-[18px]" />
            </button>
            <span className="w-10 text-center font-data-mono text-data-mono text-white">{quantity}</span>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(20, q + 1))}
              className="press flex h-10 w-10 items-center justify-center text-white hover:text-gold"
              aria-label="Tăng"
            >
              <Icon name="add" className="text-[18px]" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-6">
          <div className="text-right">
            <p className="font-label-caps text-label-caps text-on-surface-variant">Thành tiền</p>
            <p className="font-headline-lg text-headline-lg text-gold">{formatVnd(total)}</p>
          </div>
          <button
            type="button"
            onClick={createOrder}
            disabled={busy}
            className="press flex items-center gap-2 rounded-sm bg-gold px-8 py-4 font-label-caps text-label-caps text-on-gold disabled:opacity-60"
          >
            {busy ? <Icon name="progress_activity" className="animate-spin" /> : "Tiếp tục"}
            {!busy && <Icon name="arrow_forward" className="text-[18px]" />}
          </button>
        </div>
      </div>

      {error && <p className="mt-4 text-center font-body-md text-sm text-error">{error}</p>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between text-on-surface-variant">
      <span>{label}</span>
      <span className={mono ? "font-data-mono text-data-mono text-on-surface" : "text-on-surface"}>{value}</span>
    </div>
  );
}
