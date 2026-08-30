import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Bagua from "@/components/ui/Bagua";

export default function Hero() {
  return (
    <section className="relative mx-auto flex min-h-[calc(100dvh-140px)] w-full max-w-container-max flex-col items-center justify-center gap-gutter overflow-hidden px-margin-mobile py-8 md:min-h-[calc(100dvh-96px)] md:flex-row md:py-16 md:px-margin-desktop">
      {/* nền: trường sao + hào quang vàng */}
      <div className="starfield pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[560px] w-[560px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/[0.09] blur-[130px]" />

      <div className="z-10 flex w-full flex-col items-start space-y-6 md:w-1/2 md:space-y-7 motion-safe:animate-fade-in-up">
        <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-gold/20 bg-gold/[0.04] px-3 py-1 font-label-caps text-label-caps text-gold/80">
          <span className="h-1.5 w-1.5 rounded-full bg-gold motion-safe:animate-pulse" />
          Phong thủy · Nhân tướng · AI
        </span>
        <h1 className="font-display-lg text-[34px] leading-[1.15] tracking-tight text-white sm:text-[40px] md:text-display-lg">
          Thấu hiểu vận mệnh qua lăng kính <span className="text-gold-sheen">công nghệ AI</span>
        </h1>
        <p className="max-w-lg font-body-lg text-body-lg text-on-surface-variant">
          Tri thức phương Đông ngàn năm — Ngũ Hành và nhân tướng học — được đọc lại
          bằng thị giác máy tính và mô hình ngôn ngữ. Bắt đầu từ một tấm ảnh.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/phan-tich-chi-tay"
            className="press flex items-center justify-center gap-2 rounded-sm border border-transparent bg-gold px-7 py-3.5 font-label-caps text-label-caps text-on-gold transition-all duration-500 hover:border-gold hover:bg-surface-variant hover:text-gold"
          >
            <Icon name="auto_awesome" className="text-[18px]" />
            Bắt đầu phân tích
          </Link>
          <Link
            href="/#services"
            className="glass-panel press flex items-center justify-center gap-2 rounded-sm border border-white/20 px-7 py-3.5 font-label-caps text-label-caps text-white transition-all duration-300 hover:bg-white/5 hover:text-gold"
          >
            Khám phá dịch vụ
          </Link>
        </div>

        <dl className="flex gap-8 pt-2 font-body-md">
          {[
            ["3", "đường chỉ tay chính"],
            ["8", "quẻ Bát Quái"],
            ["5", "hành tương sinh"],
          ].map(([n, l]) => (
            <div key={l}>
              <dt className="font-display-lg text-[26px] text-gold">{n}</dt>
              <dd className="text-xs text-on-surface-variant">{l}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* La bàn Bát Quái ôm ảnh Âm–Dương */}
      <div className="relative flex w-full items-center justify-center md:w-1/2">
        <div className="relative aspect-square w-[300px] sm:w-[380px] md:w-[460px] motion-safe:animate-fade-in">
          <Bagua className="absolute inset-0 h-full w-full text-gold/70" yinYang={false} />
          <div className="absolute inset-[18%] overflow-hidden rounded-full border border-gold/20 motion-safe:animate-float">
            <Image
              className="h-full w-full object-cover opacity-80 mix-blend-screen"
              alt="Âm Dương phát sáng giữa hư không"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBt5fsKiWP5ArIjen1ICD7NUWCnDnGi1FhJ9Jsa74N0Rr3mGBHown0GJwtCp9BBEgRMIive6dAsWSbFXmsMgVSzkSU1eZXnyzMamHiHgXvoJUkn-KwjBMBdAJst0HQ-UbY2k9ueUQkBrZD8UMKRUkYY4hRsKLPAmD_yCiIIpd07aR2bggqsLjr2p-zninS-bkwbZQuRwhY0s12b2PUFxIpMOPwaJVbfhXTSQHH-uAc8mKmMa-x8vp5yNg"
              width={640}
              height={640}
              priority
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-background/40 via-transparent to-gold/10" />
          </div>
        </div>
      </div>

      <Link
        href="/#services"
        aria-label="Cuộn xuống"
        className="absolute bottom-5 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-1 text-on-surface-variant transition-colors hover:text-gold md:flex"
      >
        <span className="font-label-caps text-[10px] tracking-[0.2em]">CUỘN XUỐNG</span>
        <Icon name="keyboard_arrow_down" className="motion-safe:animate-bounce" />
      </Link>
    </section>
  );
}
