export interface Suggestion {
  icon: string;
  title: string;
  prompt: string;
}

/** Gợi ý câu hỏi hiển thị ở màn hình chào của /co-van. */
export const SUGGESTIONS: Suggestion[] = [
  {
    icon: "desk",
    title: "Hướng bàn làm việc",
    prompt:
      "Tôi đang bố trí lại bàn làm việc tại nhà để tăng tập trung và thăng tiến. Nên đặt bàn và chỗ ngồi thế nào?",
  },
  {
    icon: "spa",
    title: "Ngũ Hành tương sinh",
    prompt: "Người mệnh Mộc nên chọn màu sắc và vật liệu nào trong nhà để tương sinh, tránh tương khắc?",
  },
  {
    icon: "local_fire_department",
    title: "Bố trí bếp",
    prompt: "Nguyên tắc đặt bếp trong nhà là gì để giữ vệ sinh, an toàn và hài hòa không gian?",
  },
  {
    icon: "bed",
    title: "Phòng ngủ hài hòa",
    prompt: "Kê giường và bố trí phòng ngủ thế nào để giấc ngủ an và năng lượng tốt?",
  },
];
