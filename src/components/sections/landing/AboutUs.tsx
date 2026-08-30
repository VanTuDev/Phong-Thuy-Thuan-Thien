import Icon from "@/components/ui/Icon";
import Reveal from "@/components/ui/Reveal";

const PRINCIPLES = [
  {
    icon: "visibility",
    title: "Minh bạch",
    text: "Mỗi luận giải ghi rõ nguồn: Gemini thật hay dữ liệu mẫu. Không phán quyết, chỉ gợi mở.",
  },
  {
    icon: "menu_book",
    title: "Trung thành với cổ học",
    text: "Bát Trạch, Ngũ Hành, nhân tướng — giữ đúng quy tắc, không bịa thêm cho ly kỳ.",
  },
  {
    icon: "lock",
    title: "Tôn trọng riêng tư",
    text: "Ảnh của bạn chỉ dùng để luận giải và lưu trong lịch sử của chính bạn.",
  },
];

export default function AboutUs() {
  return (
    <section className="mx-auto mb-24 md:mb-32 w-full max-w-container-max px-margin-mobile text-center md:px-margin-desktop">
      <Reveal>
        <p className="mb-3 font-label-caps text-label-caps tracking-[0.3em] text-gold/70">VỀ CHÚNG TÔI</p>
        <h2 className="font-headline-lg text-headline-lg-mobile text-white md:text-headline-lg">
          Công cụ để hiểu mình, không phải để sợ hãi
        </h2>
        <p className="mx-auto mt-4 max-w-3xl font-body-lg text-body-lg leading-relaxed text-on-surface-variant">
          Phong Thủy Thuận Thiên phát triển các công cụ phân tích tiên tiến, không chỉ cung cấp thông tin mà còn
          truyền cảm hứng — giúp bạn định hướng cuộc sống và khai phá tiềm năng của chính mình.
        </p>
      </Reveal>

      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.title} delay={i * 80}>
            <div className="h-full rounded-2xl border border-white/10 bg-surface-container-low/60 p-7 text-left transition-colors hover:border-gold/30">
              <span className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-gold/25 bg-gold/[0.06] text-gold">
                <Icon name={p.icon} className="text-[20px]" />
              </span>
              <h3 className="mb-2 font-headline-md text-[20px] text-white">{p.title}</h3>
              <p className="font-body-md text-sm text-on-surface-variant">{p.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
