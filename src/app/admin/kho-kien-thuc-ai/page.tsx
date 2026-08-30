import type { Metadata } from "next";
import AdminShell from "@/components/layout/AdminShell";
import KnowledgeWorkspace from "@/components/sections/kho-kien-thuc-ai/KnowledgeWorkspace";

export const metadata: Metadata = { title: "Kho Kiến thức AI" };

export default function KhoKienThucAiPage() {
  return (
    <AdminShell active="du-lieu-ai" title="Dữ liệu AI">
      <header className="mb-gutter pt-8 md:pt-0">
        <h1 className="mb-2 font-display-lg text-headline-lg-mobile text-white md:text-display-lg">Kho Kiến thức AI</h1>
        <p className="max-w-2xl font-body-md text-body-md text-on-surface-variant">
          Bổ sung tri thức Phong Thủy chuyên sâu. Đây là <b>cơ sở luận giải nội bộ</b> — mỗi lần luận
          giải Chỉ tay / Nốt ruồi và khi hỏi thêm, AI dùng nó làm nền nhưng <b>diễn đạt lại bằng lời
          khác</b>, áp vào từng trường hợp: người dùng hiểu được ý nghĩa nhưng <b>không thấy và không
          suy ngược ra nội dung gốc</b>. AI không trích nguyên văn, không nhắc tới việc có tài liệu.
          Chỗ nào chưa có cơ sở → trả lời &ldquo;cần xem trực tiếp, nhắn Zalo&rdquo;. Hiện chỉ trích
          được <b>văn bản</b> từ ghi chú nhập tay và tệp .txt / .md / .docx — PDF và ảnh chưa đọc được.
        </p>
      </header>
      <KnowledgeWorkspace />
    </AdminShell>
  );
}
