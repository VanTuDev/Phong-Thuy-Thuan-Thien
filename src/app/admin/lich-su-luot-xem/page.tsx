import type { Metadata } from "next";
import AdminShell from "@/components/layout/AdminShell";
import ReadingLogReview from "@/components/sections/lich-su-luot-xem/ReadingLogReview";

export const metadata: Metadata = { title: "Lượt phán AI" };

export default function LichSuLuotXemPage() {
  return (
    <AdminShell active="luot-xem" title="Lượt phán AI">
      <ReadingLogReview />
    </AdminShell>
  );
}
