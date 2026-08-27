import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import HistoryList from "@/components/sections/lich-su/HistoryList";

export const metadata: Metadata = {
  title: "Lịch sử lượt xem",
};

export default function LichSuPage() {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden selection:bg-gold/20 selection:text-gold">
      <SiteHeader />
      <main className="z-10 mx-auto w-full max-w-container-max flex-grow px-margin-mobile pb-section-gap pt-28 md:px-margin-desktop md:pt-36">
        <div className="mx-auto mb-14 max-w-2xl text-center motion-safe:animate-fade-in-up">
          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-gold mb-4 font-light tracking-tight">
            Lịch sử lượt xem
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant font-light">
            Toàn bộ ảnh đã tải lên và luận giải AI của bạn được lưu lại tại đây.
          </p>
        </div>
        <HistoryList />
      </main>
      <SiteFooter />
    </div>
  );
}
