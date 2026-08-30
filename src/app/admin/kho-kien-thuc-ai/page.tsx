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
          Bổ sung tri thức Phong Thủy chuyên sâu. Nội dung ở đây là <b>nguồn chính</b> — mỗi lần luận
          giải Chỉ tay / Nốt ruồi và khi trò chuyện với Cố vấn AI, Gemini bám sát tri thức này (kiểu
          RAG), không bịa. Nốt ruồi nào chưa có trong kho sẽ được trả lời &ldquo;chưa có dữ liệu, xem
          qua Zalo&rdquo;. Hiện chỉ trích được <b>văn bản</b> từ ghi chú nhập tay và tệp .txt / .md /
          .docx — PDF và ảnh chưa được đọc nội dung.
        </p>
      </header>
      <KnowledgeWorkspace />
    </AdminShell>
  );
}
