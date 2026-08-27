import type { PackageId } from "@/components/session/SessionProvider";

export interface CreditPackage {
  id: PackageId;
  title: string;
  description: string;
  unitLabel: string;
  pricePerUnit: number;
  icon: string;
}

export const PACKAGES: CreditPackage[] = [
  {
    id: "chi-tay",
    title: "Lượt xem Chỉ tay",
    description: "Luận giải Sinh đạo, Trí đạo, Tâm đạo từ ảnh lòng bàn tay.",
    unitLabel: "lượt",
    pricePerUnit: 30000,
    icon: "pan_tool",
  },
  {
    id: "not-ruoi",
    title: "Lượt xem Nốt ruồi",
    description: "Định vị nốt ruồi trên mặt và luận giải theo cung vị tướng số.",
    unitLabel: "lượt",
    pricePerUnit: 30000,
    icon: "face_retouching_natural",
  },
  {
    id: "combo",
    title: "Combo Chỉ tay + Nốt ruồi",
    description: "1 combo = 1 lượt Chỉ tay + 1 lượt Nốt ruồi, tiết kiệm hơn mua lẻ.",
    unitLabel: "combo",
    pricePerUnit: 40000,
    icon: "workspace_premium",
  },
];

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
