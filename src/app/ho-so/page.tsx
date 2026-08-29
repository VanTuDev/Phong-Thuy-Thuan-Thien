import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ProfileWorkspace from "@/components/sections/ho-so/ProfileWorkspace";

export const metadata: Metadata = {
  title: "Hồ sơ",
};

export default function HoSoPage() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden bg-background font-body-md text-on-surface antialiased selection:bg-gold/20 selection:text-gold">
      <SiteHeader />
      <main className="z-10 mx-auto w-full max-w-container-max flex-grow px-margin-mobile pb-section-gap pt-28 md:px-margin-desktop md:pt-36">
        <div className="mx-auto mb-14 max-w-2xl text-center motion-safe:animate-fade-in-up">
          <h1 className="mb-4 font-display-lg text-headline-lg-mobile font-light tracking-tight text-gold md:text-display-lg">
            Hồ sơ của bạn
          </h1>
          <p className="font-body-lg text-body-lg font-light text-on-surface-variant">
            Cập nhật tên hiển thị, ảnh đại diện và xem nhanh ví lượt cùng lịch sử luận giải.
          </p>
        </div>
        <ProfileWorkspace />
      </main>
      <SiteFooter />
    </div>
  );
}
