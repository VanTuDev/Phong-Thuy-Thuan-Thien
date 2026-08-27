import type { Metadata } from "next";
import ChatWorkspace from "@/components/sections/co-van/ChatWorkspace";

export const metadata: Metadata = {
  title: "Cố vấn AI",
};

export default function CoVanPage() {
  return <ChatWorkspace />;
}
