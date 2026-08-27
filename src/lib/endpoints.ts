import { apiFetch } from "./api.ts";
import type { HandMetrics } from "./handMetrics.ts";

export type { HandMetrics, FingerMetric, FingerGap, FingerBend, HandPose } from "./handMetrics.ts";

export type ReadingType = "chi-tay" | "not-ruoi";
export type PackageId = ReadingType | "combo";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isAdmin: boolean;
  status: "active" | "locked";
  createdAt: string;
}

export interface Wallet {
  chiTay: number;
  notRuoi: number;
}

export interface PalmLine {
  id: string;
  color: string;
  title: string;
  tag: string;
  description: string;
  /** Polyline overlay — toạ độ chuẩn hoá 0..1 (x phải, y xuống). Rỗng ⇒ dùng đường mẫu. */
  points?: [number, number][];
  /**
   * "manual"   = người dùng tự đồ lại
   * "cv"       = đã bám nếp gấp thật trên ảnh
   * "anchor"   = neo theo điểm mốc MediaPipe (chưa bám được rãnh)
   * "ai"       = Gemini dò từ ảnh
   * "template" = đường mẫu cố định
   */
  source?: "manual" | "cv" | "anchor" | "ai" | "template";
}
export type PalmLineId = "path-life" | "path-head" | "path-heart";

/** Trắc nghiệm người dùng điền trước khi tải ảnh chỉ tay. */
export interface PalmIntake {
  name: string;
  dob: string; // "YYYY-MM-DD"
  gender: "nam" | "nu";
  hand: "trai" | "phai";
  handMoles: number[]; // số vùng (1..10) đã khai; [] = không có
}

export interface BaTrach {
  kua: number;
  gua: string;
  trach: "Đông" | "Tây";
  goodDirections: { name: string; dir: string }[];
  badDirections: { name: string; dir: string }[];
}

export interface PalmMoleReading {
  region: number;
  name: string;
  interpretation: string;
}

export interface PalmSubject {
  name: string;
  age: number;
  gender: "nam" | "nu";
  hand: "trai" | "phai";
}

export interface PalmResult {
  element: string;
  elementIcon: string;
  elementDescription: string;
  lines: PalmLine[];
  /** số đo ngón tay / hình bàn tay (từ MediaPipe, tất định) */
  hand?: HandMetrics;
  /** Bát Trạch từ trắc nghiệm (backend tính) */
  baTrach?: BaTrach | null;
  /** luận giải nốt ruồi trên bàn tay theo vùng người dùng khai */
  moleReadings?: PalmMoleReading[];
  subject?: PalmSubject | null;
}

export interface PalmLineObservation {
  id: PalmLineId;
  present: boolean;
  depth: string;
  length: string;
  features: string[];
  points: [number, number][];
}

/** Lượt 1 của Gemini — mô tả khách quan những gì AI thấy trên ảnh. */
export interface PalmObservation {
  isPalm: boolean;
  clarity: string;
  note: string;
  handShape: string;
  dominantElementHint: string;
  lines: PalmLineObservation[];
  declaredHand?: "trai" | "phai";
  moles?: { region: number; seen: boolean; note: string }[];
}
export interface Mole {
  id: string;
  x: number;
  y: number;
  name: string;
  desc: string;
  icon: string;
}
export interface MoleResult {
  moles: Mole[];
}

export interface Reading {
  id: string;
  type: ReadingType;
  image: string;
  status: "processing" | "done" | "failed";
  engine: "gemini" | "demo";
  summary: string;
  result: PalmResult | MoleResult | null;
  /** Lượt 1 của Gemini — quan sát khách quan (chỉ có ở chỉ tay). */
  observation?: PalmObservation | null;
  /** Trắc nghiệm người dùng điền trước khi tải ảnh (chỉ tay). */
  intake?: PalmIntake | null;
  createdAt: string;
}

export interface ChatCard {
  icon: string;
  iconColor: "wood" | "water" | "fire";
  label: string;
  value: string;
}
export interface ChatMessage {
  id: string;
  threadId: string;
  role: "user" | "assistant";
  content: string;
  cards?: ChatCard[];
  engine?: "gemini" | "demo";
  createdAt: string;
}
export interface ChatThread {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages?: ChatMessage[];
}

export interface Order {
  id: string;
  code: string;
  packageId: PackageId;
  quantity: number;
  unitPrice: number;
  amount: number;
  method: string;
  status: "pending" | "success" | "failed";
  createdAt: string;
  paidAt: string | null;
}
export interface PaymentInfo {
  bank: { name: string; accountName: string; accountNumber: string };
  transferContent: string;
  amount: number;
  qrSeed: string;
}

// ── Auth ────────────────────────────────────────────────────────────────────
export const auth = {
  google: (payload: { credential?: string; demoUser?: Partial<SessionUser> }) =>
    apiFetch<{ token: string; user: SessionUser; wallet: Wallet; demoMode: boolean; isGuest: boolean }>(
      "/auth/google",
      { body: payload, anon: true },
    ),
  /** Đăng nhập khách (không qua Google) — chỉ hoạt động khi backend bật GUEST_LOGIN. */
  guest: (name?: string) =>
    apiFetch<{ token: string; user: SessionUser; wallet: Wallet; demoMode: boolean; isGuest: boolean }>(
      "/auth/google",
      { body: { guest: true, demoUser: name ? { name } : undefined }, anon: true },
    ),
  me: () => apiFetch<{ user: SessionUser; wallet: Wallet }>("/auth/me"),
  logout: () => apiFetch("/auth/logout", { method: "POST", body: {} }).catch(() => undefined),
};

// ── Wallet ──────────────────────────────────────────────────────────────────
export const wallet = {
  get: () => apiFetch<{ wallet: Wallet; total: number }>("/wallet"),
};

// ── Readings ────────────────────────────────────────────────────────────────
export interface PalmHint {
  /** 21 điểm mốc bàn tay MediaPipe (chuẩn hoá 0..1) */
  landmarks?: [number, number][];
  /** 3 đường chỉ tay đã neo/bám theo ảnh: { "path-life": [...], ... } */
  anchors?: Record<string, [number, number][]>;
  /** id các đường đã bám được nếp gấp thật */
  creaseTraced?: string[];
  /** id các đường người dùng tự đồ lại (→ badge "Bạn vẽ", bỏ qua gate ảnh) */
  userDrawn?: string[];
  /** số đo ngón tay / hình bàn tay */
  metrics?: HandMetrics;
  /** trắc nghiệm người dùng điền trước khi tải ảnh */
  intake?: PalmIntake;
}

export const readings = {
  palm: (image: string, hint?: PalmHint) =>
    apiFetch<{ reading: Reading; remaining: number }>("/readings/palm", {
      body: { image, ...(hint ?? {}) },
    }),
  mole: (image: string) =>
    apiFetch<{ reading: Reading; remaining: number }>("/readings/mole", { body: { image } }),
  list: (type?: ReadingType) =>
    apiFetch<{ readings: Reading[] }>(`/readings${type ? `?type=${type}` : ""}`),
};

// ── Chat ────────────────────────────────────────────────────────────────────
export const chat = {
  threads: () => apiFetch<{ threads: ChatThread[] }>("/chat/threads"),
  thread: (id: string) => apiFetch<{ thread: ChatThread }>(`/chat/threads/${id}`),
  send: (threadId: string, content: string) =>
    apiFetch<{ threadId: string; userMessage: ChatMessage; reply: ChatMessage }>(
      `/chat/threads/${threadId}/messages`,
      { body: { content } },
    ),
  remove: (id: string) => apiFetch(`/chat/threads/${id}`, { method: "DELETE" }),
};

// ── Orders ──────────────────────────────────────────────────────────────────
export const orders = {
  packages: () =>
    apiFetch<{
      packages: { id: PackageId; title: string; unitLabel: string; unitPrice: number }[];
      bank: PaymentInfo["bank"];
    }>("/packages", { anon: true }),
  create: (packageId: PackageId, quantity: number) =>
    apiFetch<{ order: Order; payment: PaymentInfo }>("/orders", { body: { packageId, quantity } }),
  confirm: (id: string) =>
    apiFetch<{ order: Order; wallet: Wallet }>(`/orders/${id}/confirm`, { method: "POST", body: {} }),
  cancel: (id: string) => apiFetch<{ order: Order }>(`/orders/${id}/cancel`, { method: "POST", body: {} }),
  list: () => apiFetch<{ orders: Order[] }>("/orders"),
};

// ── Knowledge (admin) ───────────────────────────────────────────────────────
export type KnowledgeType = "PDF" | "Docx" | "Text" | "Image";
export interface KnowledgeDoc {
  id: string;
  category: ReadingType;
  name: string;
  icon: string;
  type: KnowledgeType;
  size: string;
  sizeBytes: number;
  status: "processing" | "trained";
  source: "upload" | "inline";
  fileUrl: string | null;
  mimeType: string | null;
  hasText: boolean;
  /** chỉ có khi lấy 1 tài liệu (GET /knowledge/:id) */
  text?: string;
  updatedAt: string;
  createdAt: string;
}
export const knowledge = {
  list: (category?: ReadingType) =>
    apiFetch<{ documents: KnowledgeDoc[] }>(`/knowledge${category ? `?category=${category}` : ""}`),
  get: (id: string) => apiFetch<{ document: KnowledgeDoc }>(`/knowledge/${id}`),
  addText: (category: ReadingType, text: string, name?: string) =>
    apiFetch<{ document: KnowledgeDoc }>("/knowledge", { body: { category, text, name } }),
  addFile: (category: ReadingType, filename: string, fileBase64: string) =>
    apiFetch<{ document: KnowledgeDoc }>("/knowledge", { body: { category, filename, fileBase64 } }),
  update: (id: string, patch: { name?: string; text?: string; category?: ReadingType }) =>
    apiFetch<{ document: KnowledgeDoc }>(`/knowledge/${id}`, { method: "PATCH", body: patch }),
  remove: (id: string) => apiFetch(`/knowledge/${id}`, { method: "DELETE" }),
};

// ── Admin ───────────────────────────────────────────────────────────────────
export const admin = {
  users: (params: { q?: string; status?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.status) qs.set("status", params.status);
    const suffix = qs.toString() ? `?${qs}` : "";
    return apiFetch<{ users: AdminUserRow[]; stats: AdminUserStats }>(`/admin/users${suffix}`);
  },
  updateUser: (
    id: string,
    patch: { status?: "active" | "locked"; isAdmin?: boolean; addChiTay?: number; addNotRuoi?: number },
  ) => apiFetch<{ user: SessionUser; wallet: Wallet }>(`/admin/users/${id}`, { method: "PATCH", body: patch }),
  finance: () => apiFetch<AdminFinance>("/admin/finance"),
  readingLogs: (type?: ReadingType) =>
    apiFetch<{ logs: AdminReadingLog[] }>(`/admin/reading-logs${type ? `?type=${type}` : ""}`),
};

export interface AdminUserRow extends SessionUser {
  wallet: Wallet;
  paymentCount: number;
  totalTopUp: number;
  readingCount: number;
}
export interface AdminUserStats {
  total: number;
  newToday: number;
  active: number;
  locked: number;
  activeRecently: number;
}
export interface AdminFinance {
  stats: { revenueToday: number; revenueMonth: number; creditsSold: number; ordersToday: number };
  monthlyRevenue: { key: string; label: string; amount: number }[];
  byPackage: { label: string; packageId: PackageId; amount: number }[];
  transactions: {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    avatar: string | null;
    package: PackageId;
    quantity: number;
    amount: number;
    method: string;
    status: "pending" | "success" | "failed";
    createdAt: string;
  }[];
}
export interface AdminReadingLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  avatar: string | null;
  type: ReadingType;
  image: string;
  engine: "gemini" | "demo";
  status: string;
  aiVerdict: string;
  summary: string;
  observation?: PalmObservation | null;
  intake?: PalmIntake | null;
  createdAt: string;
}

export function formatVnd(amount: number): string {
  return `${amount.toLocaleString("vi-VN")}đ`;
}
