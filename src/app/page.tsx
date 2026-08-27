import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import Hero from "@/components/sections/landing/Hero";
import ServicesGrid from "@/components/sections/landing/ServicesGrid";
import NguHanh from "@/components/sections/landing/NguHanh";
import BrandStory from "@/components/sections/landing/BrandStory";
import AboutUs from "@/components/sections/landing/AboutUs";

export default function LandingPage() {
  return (
    <div className="relative overflow-x-hidden bg-background font-body-md text-on-surface antialiased">
      <div className="qi-grid pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px]" />
      <SiteHeader />
      <main className="min-h-screen pt-16 pb-section-gap md:pt-24">
        <Hero />
        <ServicesGrid />
        <NguHanh />
        <BrandStory />
        <AboutUs />
      </main>
      <SiteFooter />
    </div>
  );
}
