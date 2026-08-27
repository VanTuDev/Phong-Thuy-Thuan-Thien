/**
 * Client gọi Backend-Thuan-Thien. Tất cả request đi qua `apiFetch`, tự đính kèm
 * Bearer token (lưu ở localStorage) và chuẩn hoá lỗi thành `ApiError`.
 */

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

/**
 * URL backend:
 *  1. `NEXT_PUBLIC_API_URL` nếu được đặt (production / cấu hình cứng)
 *  2. Nếu không: suy ra từ host đang truy cập — `<protocol>//<hostname>:<port>`.
 *     Nhờ vậy mở bằng điện thoại cùng Wi-Fi (http://192.168.1.2:3000) vẫn gọi
 *     đúng API (http://192.168.1.2:4000) mà không cần sửa gì.
 */
export function apiBase(): string {
  const env = process.env.NEXT_PUBLIC_API_URL;
  if (env) return env.replace(/\/$/, "");
  const port = process.env.NEXT_PUBLIC_API_PORT || "4000";
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:${port}`;
  }
  return `http://localhost:${port}`;
}

const TOKEN_KEY = "zenith-qi-token-v1";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* private mode */
  }
}

/** Chuyển đường dẫn media của backend (`/uploads/..`) thành URL đầy đủ. */
export function mediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
  return `${apiBase()}${path.startsWith("/") ? "" : "/"}${path}`;
}

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Bỏ token (cho endpoint công khai) */
  anon?: boolean;
  signal?: AbortSignal;
}

export async function apiFetch<T = unknown>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  const token = opts.anon ? null : getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${apiBase()}${path}`, {
      method: opts.method ?? (opts.body !== undefined ? "POST" : "GET"),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    });
  } catch {
    throw new ApiError(0, "Không kết nối được tới máy chủ. Kiểm tra Backend-Thuan-Thien đã chạy chưa.");
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const errObj = (data ?? {}) as { error?: unknown; details?: unknown };
    const message = typeof errObj.error === "string" && errObj.error ? errObj.error : `Lỗi ${res.status}`;
    throw new ApiError(res.status, message, errObj.details);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Ping /health — dùng để biết backend có sống không (bật/tắt chế độ offline). */
export async function pingHealth(signal?: AbortSignal): Promise<{
  ok: boolean;
  aiDemoMode: boolean;
  authDemoMode: boolean;
  guestLogin: boolean;
} | null> {
  try {
    return await apiFetch("/health", { anon: true, signal });
  } catch {
    return null;
  }
}
