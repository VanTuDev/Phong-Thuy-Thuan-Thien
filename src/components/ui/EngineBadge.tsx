import Icon from "@/components/ui/Icon";

/**
 * Nhãn nhỏ cho biết kết quả đến từ Gemini thật hay dữ liệu mẫu (demo mode).
 * Minh bạch với người dùng khi hệ thống chưa gắn API key.
 */
export default function EngineBadge({ engine }: { engine: "gemini" | "demo" }) {
  const gemini = engine === "gemini";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-label-caps text-[10px] ${
        gemini ? "border-gold/30 text-gold" : "border-white/15 text-on-surface-variant"
      }`}
      title={gemini ? "Luận giải bởi Google Gemini" : "Dữ liệu mẫu — chưa cấu hình GEMINI_API_KEY"}
    >
      <Icon name={gemini ? "auto_awesome" : "science"} className="text-[12px]" />
      {gemini ? "Gemini" : "Demo"}
    </span>
  );
}
