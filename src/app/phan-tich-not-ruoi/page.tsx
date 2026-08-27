import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import MoleScanWorkspace from "@/components/sections/not-ruoi/MoleScanWorkspace";
import CreditBadge from "@/components/ui/CreditBadge";
import Bagua from "@/components/ui/Bagua";

export const metadata: Metadata = {
  title: "Phân tích Nốt ruồi",
};

export default function PhanTichNotRuoiPage() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-background font-body-md text-on-surface">
      <SiteHeader active="not-ruoi" />
      <main className="relative mx-auto w-full max-w-container-max flex-grow px-margin-mobile pb-section-gap pt-28 md:px-margin-desktop md:pt-36">
        <Bagua className="pointer-events-none absolute left-1/2 top-16 h-[420px] w-[420px] -translate-x-1/2 text-gold/[0.06]" />
        <div className="relative z-[1] mx-auto mb-14 max-w-2xl text-center motion-safe:animate-fade-in-up">
          <h1 className="mb-4 font-display-lg text-headline-lg-mobile text-gold md:text-display-lg">Phân tích Nốt ruồi</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            Tải ảnh khuôn mặt để AI định vị các nốt ruồi và giải mã ý nghĩa phong thủy theo cung vị
            tướng số.
          </p>
          <CreditBadge type="not-ruoi" />
        </div>
        <div className="relative z-[1] grid grid-cols-1 items-start gap-gutter lg:grid-cols-12">
          <MoleScanWorkspace />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
