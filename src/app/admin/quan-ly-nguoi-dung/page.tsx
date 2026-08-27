import type { Metadata } from "next";
import AdminShell from "@/components/layout/AdminShell";
import UsersAdmin from "@/components/sections/quan-ly-nguoi-dung/UsersAdmin";

export const metadata: Metadata = { title: "Quản lý Người dùng" };

export default function QuanLyNguoiDungPage() {
  return (
    <AdminShell active="nguoi-dung" title="Người dùng">
      <UsersAdmin />
    </AdminShell>
  );
}
