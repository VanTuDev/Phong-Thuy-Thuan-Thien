import { Suspense } from "react";
import type { Metadata } from "next";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import GoogleLoginCard from "@/components/sections/dang-nhap/GoogleLoginCard";

export const metadata: Metadata = {
  title: "Đăng nhập",
};

export default function DangNhapPage() {
  return (
    <div className="bg-background text-on-surface font-body-md antialiased min-h-screen flex flex-col relative overflow-x-hidden">
      <SiteHeader />
      <main className="flex-grow z-10 pt-[100px] pb-section-gap flex items-center justify-center px-margin-mobile md:px-margin-desktop w-full">
        <Suspense
          fallback={
            <div className="skeleton h-[520px] w-full max-w-md rounded-2xl" aria-hidden />
          }
        >
          <GoogleLoginCard />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
