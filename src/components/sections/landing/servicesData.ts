export interface Service {
  title: string;
  description: string;
  cta: string;
  href: string;
  image: string;
  priceLabel?: string;
}

export const SERVICES: Service[] = [
  {
    title: "Phân tích Nốt ruồi",
    description:
      "Quét và phân tích vị trí nốt ruồi trên khuôn mặt và cơ thể bằng AI, giải mã ý nghĩa tướng số chi tiết.",
    cta: "KHÁM PHÁ",
    href: "/phan-tich-not-ruoi",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC48DTgXLlmreh_nmxloamYkob2yjr0IxwNd0o-IIx98ztSYWN9z9Hh-KTU8WN_VDFgfiF3zB9AjrAv8lZJMLrgaQNw-t3npmOGbS9kNraKpDifYnWSj0sBU9WCPSTflwmfDzQCmi1iqiod9iCrhjkwQ_Mj2s-5z-G_RuaxRkVKOyRBX4VC_Y9zv9s2B4FcthlcltzY2PDwQ2SfGq1lOmejA4bOLG7TOINQIAnHDbeT8Ii1FToOb1--OA",
    priceLabel: "30.000đ / lượt",
  },
  {
    title: "Xem Chỉ tay",
    description:
      "Nhận diện các đường chỉ tay thông qua Computer Vision, phân tích các khía cạnh sự nghiệp, tình duyên và sức khỏe.",
    cta: "KHÁM PHÁ",
    href: "/phan-tich-chi-tay",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbuu8V4VcfUQuNUJ1daJUa_cMFRBqv59Zcr3ggvv4HXrBOMJ-qMcu0JH3cbx9mfKIFgEMBMpzfnLWFzQbv9z981JWdQL8ZvcQlxr6ysMyTX44BajWfQCOhiLXZ8ZyvRgAMmBd5NQzcyew3SQV0AaHvDvxx5I9P2ZPCMC03gperCg97HRGNYpN_RoyDumWw10w5gBNA7cIhRP9aMbKoOQJ2qdtOhkpcwzAt2yVLRvr9rd1mW1N6V0caHg",
    priceLabel: "30.000đ / lượt",
  },
  {
    title: "Combo Chỉ tay + Nốt ruồi",
    description:
      "Nạp 1 combo, dùng được cả 2 tính năng: 1 lượt Chỉ tay và 1 lượt Nốt ruồi — tiết kiệm hơn mua lẻ.",
    cta: "NẠP COMBO",
    href: "/nap-luot",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDbuu8V4VcfUQuNUJ1daJUa_cMFRBqv59Zcr3ggvv4HXrBOMJ-qMcu0JH3cbx9mfKIFgEMBMpzfnLWFzQbv9z981JWdQL8ZvcQlxr6ysMyTX44BajWfQCOhiLXZ8ZyvRgAMmBd5NQzcyew3SQV0AaHvDvxx5I9P2ZPCMC03gperCg97HRGNYpN_RoyDumWw10w5gBNA7cIhRP9aMbKoOQJ2qdtOhkpcwzAt2yVLRvr9rd1mW1N6V0caHg",
    priceLabel: "40.000đ / combo",
  },
  {
    title: "Trò chuyện AI",
    description:
      "Tương tác trực tiếp với trợ lý ảo Gemini được huấn luyện chuyên sâu về kiến thức phong thủy và kinh dịch.",
    cta: "BẮT ĐẦU TRÒ CHUYỆN",
    href: "/co-van",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCD0xwivi44zfqh1mPAx1VpQJuZoCqYwqxK0--Fjnx74tzpnZiZ-lfPRATfeHiyCikCUktUVPXGwebTW_ISrf6MB5wGlOeW4bJd2UQvYIOlE6bxmpDgmk8xnk-FBnMvXxXV55nAetKJpNljrIgfW10Lz7dRayCRJWBus9lK-BizbeQYwvC9i6njCey4e1Qtg9N_9kYsKXK0M29e4i8cFCHjh9yNQaoTfsrtt0bCoETRTVklJ3t-VnXPOA",
  },
];
