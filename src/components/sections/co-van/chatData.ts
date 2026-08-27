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
      "Tôi sinh năm 1994, nam. Tôi đang bố trí lại bàn làm việc tại nhà để tăng tập trung và thăng tiến. Bàn nên quay về hướng nào?",
  },
  {
    icon: "home",
    title: "Hướng nhà theo Quái số",
    prompt: "Cách tính Quái số và xác định tôi thuộc Đông hay Tây Tứ Trạch?",
  },
  {
    icon: "local_fire_department",
    title: "Bố trí bếp",
    prompt: "Nguyên tắc đặt bếp theo Bát Trạch là gì? 'Tọa hung hướng cát' nghĩa là sao?",
  },
  {
    icon: "bed",
    title: "Phòng ngủ hài hòa",
    prompt: "Kê giường và bố trí phòng ngủ thế nào để giấc ngủ an và năng lượng tốt?",
  },
];
