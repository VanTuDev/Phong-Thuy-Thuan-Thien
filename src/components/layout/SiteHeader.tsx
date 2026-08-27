"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { useSession } from "@/components/session/SessionProvider";

export type SiteNavKey = "ngu-hanh" | "not-ruoi" | "chi-tay" | "ai-chat";

const NAV_ITEMS: { key: SiteNavKey; label: string; href: string; icon: string }[] = [
  { key: "ngu-hanh", label: "Ngũ Hành", href: "/#services", icon: "hub" },
  { key: "chi-tay", label: "Xem Chỉ tay", href: "/phan-tich-chi-tay", icon: "pan_tool" },
  { key: "not-ruoi", label: "Phân tích Nốt ruồi", href: "/phan-tich-not-ruoi", icon: "face_retouching_natural" },
  { key: "ai-chat", label: "Trò chuyện AI", href: "/co-van", icon: "forum" },
];

export default function SiteHeader({
  active,
  sidebarOffset = false,
}: {
  active?: SiteNavKey;
  sidebarOffset?: boolean;
}) {
  const { isLoggedIn, user, wallet, logout } = useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const totalCredits = wallet.chiTay + wallet.notRuoi;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b font-body-md text-body-md transition-all duration-500 ${
        scrolled || drawerOpen
          ? "border-white/10 bg-background/80 backdrop-blur-xl"
          : "border-transparent bg-background/40 backdrop-blur-md"
      } ${sidebarOffset ? "md:left-64" : ""}`}
    >
      <div className="mx-auto flex max-w-container-max items-center justify-between px-margin-mobile py-4 md:px-margin-desktop">
        <Link
          href="/"
          className="font-headline-md text-headline-md font-bold tracking-tighter text-white transition-colors hover:text-gold"
        >
          Modern Sage
        </Link>

        <nav className="hidden md:flex md:items-center md:gap-8">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`relative py-1 transition-colors duration-300 ${
                active === item.key ? "text-gold" : "text-on-surface-variant hover:text-gold"
              }`}
            >
              {item.label}
              <span
                className={`absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-300 ${
                  active === item.key ? "w-full" : "w-0"
                }`}
              />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/nap-luot"
            className="press tap-target flex items-center gap-1.5 rounded-full border border-gold/30 px-3 py-1.5 transition-colors duration-300 hover:border-gold/60 hover:bg-gold/5"
            title="Lượt xem còn lại"
          >
            <Icon name="bolt" className="text-[16px] text-gold" />
            <span className="font-data-mono text-data-mono text-gold">
              {isLoggedIn ? totalCredits : "Mua lượt"}
            </span>
          </Link>

          {!isLoggedIn && (
            <Link
              href="/dang-nhap"
              className="press hidden items-center gap-2 rounded-full border border-white/20 px-4 py-1.5 text-on-surface transition-colors duration-300 hover:border-white/40 hover:text-white sm:flex"
            >
              <Icon name="account_circle" className="text-[18px]" />
              <span className="font-label-caps text-label-caps">Đăng nhập</span>
            </Link>
          )}

          {isLoggedIn && user && (
            <div className="relative hidden sm:block">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                className="press flex items-center gap-2 rounded-full border border-white/10 py-1 pl-1 pr-2 transition-colors duration-300 hover:border-white/30"
                aria-haspopup="menu"
                aria-expanded={menuOpen}
              >
                <Avatar user={user} size={28} />
                <Icon name="expand_more" className="text-[16px] text-on-surface-variant" />
              </button>

              {menuOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-40 cursor-default"
                    aria-label="Đóng menu"
                    onClick={() => setMenuOpen(false)}
                  />
                  <div className="absolute right-0 z-50 mt-3 w-60 rounded-xl border border-white/10 bg-surface-container-low py-2 shadow-2xl motion-safe:animate-fade-in-down">
                    <div className="mb-1 border-b border-white/10 px-4 py-2">
                      <p className="truncate font-medium text-white">{user.name}</p>
                      <p className="truncate text-[13px] text-on-surface-variant">{user.email}</p>
                    </div>
                    <MenuLink href="/lich-su" icon="history" label="Lịch sử lượt xem" />
                    <MenuLink href="/nap-luot" icon="bolt" label="Mua thêm lượt xem" />
                    {user.isAdmin && (
                      <MenuLink
                        href="/admin/quan-ly-nguoi-dung"
                        icon="admin_panel_settings"
                        label="Trang Quản trị"
                        divider
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        logout();
                      }}
                      className="flex w-full items-center gap-3 px-4 py-2 text-left text-on-surface-variant transition-colors hover:bg-white/5 hover:text-gold"
                    >
                      <Icon name="logout" className="text-[18px]" />
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setDrawerOpen((v) => !v)}
            className="press tap-target flex items-center justify-center rounded-full border border-white/15 text-white md:hidden"
            aria-label={drawerOpen ? "Đóng menu" : "Mở menu"}
            aria-expanded={drawerOpen}
          >
            <Icon name={drawerOpen ? "close" : "menu"} />
          </button>
        </div>
      </div>

      {/* Drawer mobile */}
      <div
        className={`fixed inset-0 top-[65px] z-40 md:hidden ${drawerOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!drawerOpen}
      >
        <div
          className={`absolute inset-0 bg-background/60 backdrop-blur-sm transition-opacity duration-300 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        <nav
          className={`absolute inset-x-0 top-0 origin-top border-b border-white/10 bg-surface-container-low p-margin-mobile transition-all duration-300 ${
            drawerOpen ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0"
          }`}
        >
          {isLoggedIn && user && (
            <div className="mb-4 flex items-center gap-3 rounded-xl border border-white/10 bg-surface-container p-3">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <p className="truncate font-medium text-white">{user.name}</p>
                <p className="truncate text-[13px] text-on-surface-variant">{user.email}</p>
              </div>
            </div>
          )}

          <div className="flex flex-col">
            {NAV_ITEMS.map((item, i) => (
              <Link
                key={item.key}
                href={item.href}
                style={{ animationDelay: `${i * 40}ms` }}
                className={`flex items-center gap-4 rounded-lg px-3 py-3.5 transition-colors motion-safe:animate-fade-in-up ${
                  active === item.key ? "text-gold" : "text-on-surface hover:bg-white/5"
                }`}
              >
                <Icon name={item.icon} className="text-[20px]" />
                <span className="font-label-caps text-label-caps">{item.label}</span>
              </Link>
            ))}
          </div>

          <div className="mt-4 flex flex-col gap-2 border-t border-white/10 pt-4">
            {isLoggedIn && user ? (
              <>
                <Link href="/lich-su" className="flex items-center gap-4 rounded-lg px-3 py-3 text-on-surface hover:bg-white/5">
                  <Icon name="history" className="text-[20px]" />
                  <span className="font-label-caps text-label-caps">Lịch sử lượt xem</span>
                </Link>
                {user.isAdmin && (
                  <Link
                    href="/admin/quan-ly-nguoi-dung"
                    className="flex items-center gap-4 rounded-lg px-3 py-3 text-on-surface hover:bg-white/5"
                  >
                    <Icon name="admin_panel_settings" className="text-[20px]" />
                    <span className="font-label-caps text-label-caps">Trang Quản trị</span>
                  </Link>
                )}
                <button
                  type="button"
                  onClick={logout}
                  className="flex items-center gap-4 rounded-lg px-3 py-3 text-left text-on-surface-variant hover:bg-white/5 hover:text-gold"
                >
                  <Icon name="logout" className="text-[20px]" />
                  <span className="font-label-caps text-label-caps">Đăng xuất</span>
                </button>
              </>
            ) : (
              <Link
                href="/dang-nhap"
                className="press flex items-center justify-center gap-2 rounded-sm bg-gold py-3 font-label-caps text-label-caps text-on-gold"
              >
                <Icon name="account_circle" className="text-[18px]" />
                Đăng nhập
              </Link>
            )}
          </div>
        </nav>
      </div>
    </header>
  );
}

function Avatar({ user, size }: { user: { name: string; avatar: string }; size: number }) {
  if (user.avatar) {
    return (
      <Image
        alt={`Ảnh đại diện ${user.name}`}
        src={user.avatar}
        width={size}
        height={size}
        unoptimized={user.avatar.endsWith(".svg")}
        className="rounded-full border border-white/10 object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className="flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-xs font-medium text-white"
      style={{ width: size, height: size }}
    >
      {user.name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function MenuLink({
  href,
  icon,
  label,
  divider,
}: {
  href: string;
  icon: string;
  label: string;
  divider?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2 text-on-surface-variant transition-colors hover:bg-white/5 hover:text-gold ${
        divider ? "mt-1 border-t border-white/10 pt-3" : ""
      }`}
    >
      <Icon name={icon} className="text-[18px]" />
      {label}
    </Link>
  );
}
