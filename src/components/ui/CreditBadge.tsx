"use client";

import Link from "next/link";
import Icon from "@/components/ui/Icon";
import { useSession, type ReadingType } from "@/components/session/SessionProvider";

export default function CreditBadge({ type }: { type: ReadingType }) {
  const { isLoggedIn, wallet } = useSession();
  const count = type === "chi-tay" ? wallet.chiTay : wallet.notRuoi;

  return (
    <Link
      href="/nap-luot"
      className="inline-flex items-center gap-2 mt-4 border border-gold/30 hover:border-gold/60 hover:bg-gold/5 transition-colors duration-300 rounded-full px-4 py-1.5 font-data-mono text-data-mono text-gold"
    >
      <Icon name="bolt" className="text-[16px]" />
      {isLoggedIn ? `Còn lại ${count} lượt` : "30.000đ / lượt · Nạp lượt xem"}
    </Link>
  );
}
