import Link from "next/link";
import Icon from "@/components/ui/Icon";
import Bagua from "@/components/ui/Bagua";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Dịch vụ",
    links: [
      { label: "Phân tích Chỉ tay", href: "/phan-tich-chi-tay" },
      { label: "Phân tích Nốt ruồi", href: "/phan-tich-not-ruoi" },
      { label: "Cố vấn AI", href: "/co-van" },
      { label: "Nạp lượt xem", href: "/nap-luot" },
    ],
  },
  {
    title: "Tài khoản",
    links: [
      { label: "Đăng nhập", href: "/dang-nhap" },
      { label: "Lịch sử lượt xem", href: "/lich-su" },
    ],
  },
  {
    title: "Tri thức",
    links: [
      { label: "Ngũ Hành tương sinh", href: "/#services" },
      { label: "Câu chuyện thương hiệu", href: "/#services" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="relative mt-auto border-t border-white/10 bg-background">
      <div className="tho-pattern pointer-events-none absolute inset-0 opacity-60" />
      <div className="relative mx-auto max-w-container-max px-margin-mobile py-16 md:px-margin-desktop">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Bagua className="h-10 w-10 text-gold" spin={false} />
              <span className="font-headline-md text-headline-md font-bold text-white">Phong Thủy Thuận Thiên</span>
            </div>
            <p className="max-w-xs font-body-md text-sm text-on-surface-variant">
              Thấu hiểu vận mệnh qua lăng kính công nghệ AI. Trí tuệ AI là người dẫn đường, không phải
              định mệnh tuyệt đối.
            </p>
            <div className="mt-5 flex gap-3 text-gold">
              <a className="rounded-full border border-white/10 p-2 transition-colors hover:border-gold/50 hover:text-white" href="mailto:lienhe@phongthuythuanthien.vn" aria-label="Email">
                <Icon name="mail" className="text-[18px]" />
              </a>
              <a className="rounded-full border border-white/10 p-2 transition-colors hover:border-gold/50 hover:text-white" href="tel:+84" aria-label="Điện thoại">
                <Icon name="phone" className="text-[18px]" />
              </a>
              <span className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-2 font-body-md text-xs text-on-surface-variant" aria-hidden>
                <Icon name="location_on" className="text-[16px]" />
                Đà Nẵng
              </span>
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-label-caps text-label-caps text-on-surface-variant">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="font-body-md text-sm text-on-surface-variant transition-colors hover:text-gold"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 sm:flex-row">
          <p className="font-body-md text-xs text-on-surface-variant opacity-70">
            © {new Date().getFullYear()} Phong Thủy Thuận Thiên · Đà Nẵng. Mọi con đường đều hướng tới sự cân bằng.
          </p>
          <div className="flex gap-5 font-body-md text-xs text-on-surface-variant">
            <a href="#" className="transition-colors hover:text-white">Triết lý</a>
            <a href="#" className="transition-colors hover:text-white">Bảo mật</a>
            <a href="#" className="transition-colors hover:text-white">Đạo đức</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
