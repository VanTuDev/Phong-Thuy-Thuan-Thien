import type { Metadata, Viewport } from "next";
import { EB_Garamond, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "@/components/session/SessionProvider";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const hankenGrotesk = Hanken_Grotesk({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-hanken-grotesk",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Phong Thủy Thuận Thiên — AI luận giải nhân tướng, Đà Nẵng",
    template: "%s | Phong Thủy Thuận Thiên",
  },
  description:
    "Thấu hiểu vận mệnh qua lăng kính công nghệ AI. Phân tích Ngũ Hành, chỉ tay, nốt ruồi và trò chuyện cùng trợ lý phong thủy Thuận Thiên. Đà Nẵng.",
};

export const viewport: Viewport = {
  themeColor: "#0A0A0A",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`dark ${ebGaramond.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- icon font is intentionally global, loaded once in the root layout */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* suppressHydrationWarning: các tiện ích trình duyệt (Grammarly…) chèn
          data-* vào <body> trước khi React hydrate → cảnh báo giả. */}
      <body className="bg-background text-on-surface font-sans antialiased" suppressHydrationWarning>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
