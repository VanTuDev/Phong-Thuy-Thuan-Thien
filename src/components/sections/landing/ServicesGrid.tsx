import Image from "next/image";
import Link from "next/link";
import Reveal from "@/components/ui/Reveal";
import { SERVICES } from "./servicesData";

export default function ServicesGrid() {
  return (
    <section
      id="services"
      className="mx-auto mb-24 md:mb-32 w-full max-w-container-max scroll-mt-24 px-margin-mobile md:px-margin-desktop"
    >
      <Reveal className="mb-16 text-center">
        <h2 className="mb-4 font-headline-lg text-headline-lg-mobile text-white md:text-headline-lg">Các Dịch Vụ Chính</h2>
        <div className="mx-auto h-px w-12 bg-gold opacity-50" />
      </Reveal>

      <div className="grid grid-cols-1 gap-gutter sm:grid-cols-2 xl:grid-cols-4">
        {SERVICES.map((service, i) => (
          <Reveal key={service.title} delay={i * 90}>
            <Link
              href={service.href}
              className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gold/20 bg-surface-container-low/60 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-gold/50 hover:bg-surface-container-low"
            >
              <div className="relative h-44 w-full overflow-hidden">
                <Image
                  alt={service.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  src={service.image}
                  width={480}
                  height={192}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-container-low to-transparent" />
                {service.priceLabel && (
                  <span className="absolute right-3 top-3 rounded-full border border-gold/30 bg-background/80 px-2.5 py-1 font-data-mono text-[11px] text-gold backdrop-blur-md">
                    {service.priceLabel}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="mb-3 font-headline-md text-headline-md text-white">{service.title}</h3>
                <p className="flex-1 font-body-md text-body-md text-on-surface-variant">{service.description}</p>
                <span className="mt-6 inline-flex items-center gap-1 border-b border-gold/50 pb-1 font-label-caps text-label-caps text-gold transition-all group-hover:gap-2 group-hover:border-gold">
                  {service.cta}
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </span>
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
