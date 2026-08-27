import Bagua from "@/components/ui/Bagua";
import Reveal from "@/components/ui/Reveal";

export default function BrandStory() {
  return (
    <section className="mx-auto mb-24 w-full max-w-container-max px-margin-mobile md:mb-32 md:px-margin-desktop">
      <div className="flex flex-col items-center gap-12 md:flex-row md:gap-gutter">
        <Reveal className="w-full md:w-1/2">
          <p className="mb-3 font-label-caps text-label-caps tracking-[0.3em] text-gold/70">
            CÂU CHUYỆN THƯƠNG HIỆU
          </p>
          <h2 className="mb-6 font-headline-lg text-headline-lg-mobile text-white md:text-headline-lg">
            Nơi hiền triết cổ xưa gặp trí tuệ nhân tạo
          </h2>
          <p className="mb-4 font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
            Zenith Qi ra đời từ khát vọng kết nối giá trị ngàn năm của triết học phương Đông với sức
            mạnh của AI hiện đại. Vũ trụ vận hành theo những quy luật ẩn giấu — và công nghệ là chiếc
            chìa khóa để giải mã.
          </p>
          <p className="font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
            Từ đường chỉ trên lòng bàn tay đến vị trí một nốt ruồi, mỗi dấu ấn đều kể một câu chuyện
            về bản ngã. Kết hợp thị giác máy tính và học sâu, chúng tôi mang đến góc nhìn mới mẻ,
            chính xác và đầy tính nghệ thuật.
          </p>
        </Reveal>

        <Reveal className="flex w-full justify-center md:w-1/2" delay={150}>
          <div className="relative aspect-square w-64 sm:w-80">
            <Bagua className="h-full w-full text-gold" yinYang />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
