import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import BuyCreditsWorkspace from "@/components/sections/nap-luot/BuyCreditsWorkspace";

export const metadata: Metadata = {
  title: "Nạp lượt xem",
};

export default function NapLuotPage() {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-gold/20 selection:text-gold">
      <SiteHeader />
      <main className="z-10 mx-auto w-full max-w-container-max flex-grow px-margin-mobile pb-section-gap pt-28 md:px-margin-desktop md:pt-36">
        <div className="mx-auto mb-14 max-w-2xl text-center motion-safe:animate-fade-in-up">
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-gold mb-4 font-light tracking-tight">
            Nạp lượt xem
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-light">
            Chọn gói lượt xem, quét mã để thanh toán và bắt đầu luận giải cùng Modern Sage.
          </p>
        </div>
        <BuyCreditsWorkspace />
      </main>
      <SiteFooter />
    </div>
  );
}
