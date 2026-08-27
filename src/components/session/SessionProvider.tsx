"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ApiError, pingHealth, setToken } from "@/lib/api";
import { auth, wallet as walletApi, type SessionUser, type Wallet } from "@/lib/endpoints";

export type { SessionUser, Wallet } from "@/lib/endpoints";
export type ReadingType = "chi-tay" | "not-ruoi";
export type PackageId = ReadingType | "combo";

type Status = "loading" | "anon" | "authed";

interface SessionContextValue {
  status: Status;
  user: SessionUser | null;
  wallet: Wallet;
  isLoggedIn: boolean;
  /** Backend có online không (null = chưa kiểm tra) */
  online: boolean | null;
  /** Backend đang chạy chế độ đăng nhập demo (chưa cấu hình Google OAuth) — chỉ để hiển thị */
  authDemoMode: boolean;
  /** Backend cho phép "Đăng nhập khách" (không qua Google) */
  guestLoginEnabled: boolean;
  aiDemoMode: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  /** Đăng nhập khách — dùng khi truy cập qua IP LAN không đăng nhập Google được */
  loginAsGuest: (name?: string) => Promise<void>;
  logout: () => void;
  refreshWallet: () => Promise<void>;
  /** Cập nhật ví tại chỗ sau khi mua / dùng lượt (tránh gọi lại API) */
  setWallet: (next: Wallet) => void;
}

const DEFAULT_WALLET: Wallet = { chiTay: 0, notRuoi: 0 };
const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<SessionUser | null>(null);
  const [walletState, setWalletState] = useState<Wallet>(DEFAULT_WALLET);
  const [online, setOnline] = useState<boolean | null>(null);
  const [authDemoMode, setAuthDemoMode] = useState(true);
  const [guestLoginEnabled, setGuestLoginEnabled] = useState(false);
  const [aiDemoMode, setAiDemoMode] = useState(true);
  const bootstrapped = useRef(false);

  const applySession = useCallback((u: SessionUser, w: Wallet, token?: string) => {
    if (token) setToken(token);
    setUser(u);
    setWalletState(w);
    setStatus("authed");
  }, []);

  const logout = useCallback(() => {
    void auth.logout();
    setToken(null);
    setUser(null);
    setWalletState(DEFAULT_WALLET);
    setStatus("anon");
  }, []);

  // Khởi động: kiểm tra backend + khôi phục phiên từ token
  useEffect(() => {
    if (bootstrapped.current) return;
    bootstrapped.current = true;
    const controller = new AbortController();

    (async () => {
      const health = await pingHealth(controller.signal);
      setOnline(Boolean(health));
      if (health) {
        setAuthDemoMode(health.authDemoMode);
        setGuestLoginEnabled(Boolean(health.guestLogin) || health.authDemoMode);
        setAiDemoMode(health.aiDemoMode);
      }

      try {
        const me = await auth.me();
        applySession(me.user, me.wallet);
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) setToken(null);
        setStatus("anon");
      }
    })();

    return () => controller.abort();
  }, [applySession]);

  const loginWithGoogle = useCallback(
    async (credential: string) => {
      const res = await auth.google({ credential });
      applySession(res.user, res.wallet, res.token);
    },
    [applySession],
  );

  const loginAsGuest = useCallback(
    async (name?: string) => {
      const res = await auth.guest(name?.trim() || undefined);
      applySession(res.user, res.wallet, res.token);
    },
    [applySession],
  );

  const refreshWallet = useCallback(async () => {
    try {
      const res = await walletApi.get();
      setWalletState(res.wallet);
    } catch {
      /* giữ nguyên nếu lỗi */
    }
  }, []);

  const value = useMemo<SessionContextValue>(
    () => ({
      status,
      user,
      wallet: walletState,
      isLoggedIn: status === "authed" && user !== null,
      online,
      authDemoMode,
      guestLoginEnabled,
      aiDemoMode,
      loginWithGoogle,
      loginAsGuest,
      logout,
      refreshWallet,
      setWallet: setWalletState,
    }),
    [
      status,
      user,
      walletState,
      online,
      authDemoMode,
      guestLoginEnabled,
      aiDemoMode,
      loginWithGoogle,
      loginAsGuest,
      logout,
      refreshWallet,
    ],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession phải được dùng bên trong SessionProvider");
  return ctx;
}
