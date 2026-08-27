import type { Metadata } from "next";
import AdminShell from "@/components/layout/AdminShell";
import FinanceAdmin from "@/components/sections/quan-ly-tai-chinh/FinanceAdmin";

export const metadata: Metadata = { title: "Quản lý Tài chính" };

export default function QuanLyTaiChinhPage() {
  return (
    <AdminShell active="tai-chinh" title="Tài chính">
      <FinanceAdmin />
    </AdminShell>
  );
}
