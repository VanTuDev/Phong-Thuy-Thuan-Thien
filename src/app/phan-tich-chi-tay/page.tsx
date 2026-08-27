import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PalmScanWorkspace from "@/components/sections/chi-tay/PalmScanWorkspace";
import CreditBadge from "@/components/ui/CreditBadge";
import Bagua from "@/components/ui/Bagua";

export const metadata: Metadata = {
  title: "Phân tích Chỉ tay",
};

export default function PhanTichChiTayPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-body-md text-on-surface antialiased">
      <SiteHeader active="chi-tay" />
      <main className="relative mx-auto flex w-full max-w-container-max flex-grow flex-col px-margin-mobile pb-section-gap pt-28 md:px-margin-desktop md:pt-36">
        <Bagua className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 text-gold/[0.06]" />
        <div className="relative z-[1] mx-auto mb-14 max-w-2xl text-center motion-safe:animate-fade-in-up">
          <h1 className="mb-4 font-display-lg text-headline-lg-mobile font-light tracking-tight text-gold md:text-display-lg">
            Phân tích Chỉ tay
          </h1>
          <p className="font-body-lg text-body-lg font-light text-on-surface-variant">
            Tải lên ảnh lòng bàn tay rõ nét để AI lần theo những đường chỉ về Sinh đạo, Trí đạo và Tâm
            đạo, cùng nguyên tố bàn tay của bạn.
          </p>
          <CreditBadge type="chi-tay" />
        </div>

        <div className="relative z-[1] grid min-h-[520px] w-full grid-cols-1 gap-gutter lg:grid-cols-12">
          <PalmScanWorkspace />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
