/** @type {import('next').NextConfig} */

const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
let apiPattern = null;
try {
  if (apiUrl) {
    const u = new URL(apiUrl);
    apiPattern = { protocol: u.protocol.replace(":", ""), hostname: u.hostname, ...(u.port ? { port: u.port } : {}) };
  }
} catch {
  /* bỏ qua */
}

// ── In cấu hình khi chạy dev / build (chỉ 1 lần) ────────────────────────────
if (!globalThis.__msConfigLogged) {
  globalThis.__msConfigLogged = true;
  const gid = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const row = (label, ok, detail) => `  [${ok ? "OK" : "! "}] ${label.padEnd(12)} ${detail}`;
  console.log(
    "\n  Frontend -- cau hinh (.env.local)\n" +
      row(
        "API backend",
        true,
        apiUrl || "tu suy ra <host dang mo>:" + (process.env.NEXT_PUBLIC_API_PORT || "4000"),
      ) +
      "\n" +
      row(
        "Dang nhap",
        !!gid,
        gid ? "Google | ..." + gid.slice(-26) : "chua co NEXT_PUBLIC_GOOGLE_CLIENT_ID -> nut demo",
      ) +
      "\n",
  );
}

const nextConfig = {
  reactStrictMode: true,
  images: {
    // Avatar mặc định của Dicebear là SVG.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "*.googleusercontent.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "127.0.0.1" },
      // LAN (mở bằng điện thoại cùng Wi-Fi)
      { protocol: "http", hostname: "192.168.*.*" },
      { protocol: "http", hostname: "10.*.*.*" },
      ...(apiPattern ? [apiPattern] : []),
    ],
  },
};

export default nextConfig;
