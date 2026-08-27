"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useSession } from "@/components/session/SessionProvider";

export type AdminNavKey = "tong-quan" | "nguoi-dung" | "du-lieu-ai" | "luot-xem" | "tai-chinh";

const NAV_ITEMS: { key: AdminNavKey; label: string; icon: string; href: string }[] = [
  { key: "nguoi-dung", label: "Người dùng", icon: "group", href: "/admin/quan-ly-nguoi-dung" },
  { key: "du-lieu-ai", label: "Dữ liệu AI", icon: "psychology", href: "/admin/kho-kien-thuc-ai" },
  { key: "luot-xem", label: "Lượt phán AI", icon: "history_edu", href: "/admin/lich-su-luot-xem" },
  { key: "tai-chinh", label: "Tài chính", icon: "payments", href: "/admin/quan-ly-tai-chinh" },
];

export default function AdminShell({
  active,
  title,
  children,
}: {
  active: AdminNavKey;
  title: string;
  children: ReactNode;
}) {
  const { status, user, logout } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => setDrawerOpen(false), [pathname]);

  useEffect(() => {
    if (status === "anon") router.replace(`/dang-nhap?next=${encodeURIComponent(pathname)}`);
    else if (status === "authed" && user && !user.isAdmin) router.replace("/");
  }, [status, user, router, pathname]);

  if (status !== "authed" || !user?.isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Icon name="progress_activity" className="animate-spin text-3xl text-gold" />
      </div>
    );
  }

  const nav = (
    <>
      <div className="mb-8 flex items-center gap-4 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-gold/10">
          <Icon name="spa" className="text-gold" />
        </div>
        <div>
          <h1 className="font-headline-md text-headline-md text-white">Zenith Qi</h1>
          <p className="font-label-caps text-label-caps text-on-surface-variant opacity-70">Quản trị hệ thống</p>
        </div>
      </div>

      <div className="flex flex-1 flex-col">
        {NAV_ITEMS.map((item) => {
          const isActive = item.key === active;
          return (
            <Link
              key={item.key}
              href={item.href}
              className={`group flex items-center gap-4 px-6 py-4 transition-all duration-300 ${
                isActive
                  ? "border-r-2 border-gold bg-surface-container-high/30 text-gold"
                  : "text-on-surface-variant hover:bg-surface-variant/40 hover:text-gold"
              }`}
            >
              <Icon name={item.icon} filled={isActive} className={isActive ? "" : "transition-transform group-hover:scale-110"} />
              <span className="font-label-caps text-label-caps">{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div className="mt-auto flex flex-col border-t border-white/5 pt-4">
        <Link href="/" className="flex items-center gap-4 px-6 py-3 text-on-surface-variant transition-colors hover:bg-surface-variant/40 hover:text-gold">
          <Icon name="arrow_back" className="text-[18px]" />
          <span className="font-label-caps text-label-caps">Về trang người dùng</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-4 px-6 py-3 text-left text-on-surface-variant transition-colors hover:bg-surface-variant/40 hover:text-gold"
        >
          <Icon name="logout" className="text-[18px]" />
          <span className="font-label-caps text-label-caps">Đăng xuất</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-on-surface">
      <aside className="sticky left-0 top-0 z-40 hidden h-screen w-64 shrink-0 flex-col border-r border-white/5 bg-surface-dim py-8 md:flex">
        {nav}
      </aside>

      {/* top bar mobile */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex h-16 w-full items-center justify-between border-b border-white/10 bg-surface/80 px-margin-mobile backdrop-blur-xl md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="press tap-target flex items-center gap-3 text-gold"
          aria-label="Mở menu quản trị"
        >
          <Icon name="menu" />
          <span className="font-headline-md text-headline-md font-bold">{title}</span>
        </button>
        <Link href="/" className="text-on-surface-variant">
          <Icon name="home" />
        </Link>
      </nav>

      <div className={`fixed inset-0 z-50 md:hidden ${drawerOpen ? "" : "pointer-events-none"}`}>
        <div
          className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity ${drawerOpen ? "opacity-100" : "opacity-0"}`}
          onClick={() => setDrawerOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 flex h-full w-[80%] max-w-xs flex-col border-r border-white/10 bg-surface-dim py-8 transition-transform duration-300 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {nav}
        </aside>
      </div>

      <main className="flex min-w-0 flex-1 flex-col px-margin-mobile pb-32 pt-24 md:px-margin-desktop md:pt-12">
        {children}
      </main>
    </div>
  );
}
