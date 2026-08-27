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
          Bổ sung tri thức Phong Thủy chuyên sâu. Nội dung ở đây được đưa vào ngữ cảnh cho Gemini mỗi
          lần luận giải Chỉ tay / Nốt ruồi và khi trò chuyện với Cố vấn AI.
        </p>
      </header>
      <KnowledgeWorkspace />
    </AdminShell>
  );
}
