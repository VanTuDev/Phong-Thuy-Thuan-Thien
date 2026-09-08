/**
 * Giết tiến trình đang giữ cổng dev của Next (mặc định 3000).
 *   node scripts/kill-port.mjs        # cổng 3000
 *   node scripts/kill-port.mjs 3001   # cổng tự chọn
 *
 * Dùng khi `pnpm dev` báo cổng đang bị chiếm do tiến trình Next cũ còn sót.
 */
import { execFileSync } from "node:child_process";

const arg = process.argv.find((a) => /^\d{2,5}$/.test(a));
const port = arg ? Number(arg) : Number(process.env.PORT) || 3000;
const IS_WIN = process.platform === "win32";

function pidsOnPort(p) {
  try {
    if (IS_WIN) {
      const out = execFileSync("netstat", ["-ano", "-p", "tcp"], { encoding: "utf8" });
      const set = new Set();
      for (const line of out.split("\n")) {
        const m = line.match(/:(\d+)\s+\S+\s+LISTENING\s+(\d+)/i);
        if (m && Number(m[1]) === p) set.add(m[2]);
      }
      return [...set];
    }
    return execFileSync("lsof", ["-ti", `tcp:${p}`, "-sTCP:LISTEN"], { encoding: "utf8" })
      .split("\n").map((s) => s.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

const pids = pidsOnPort(port);
if (!pids.length) {
  console.log(`  Không có tiến trình nào trên cổng ${port}.`);
} else {
  for (const pid of pids) {
    try {
      if (IS_WIN) execFileSync("taskkill", ["/f", "/t", "/pid", pid], { stdio: "ignore" });
      else process.kill(Number(pid), "SIGKILL");
      console.log(`  Cổng ${port}: đã giết PID ${pid}`);
    } catch (err) {
      console.warn(`  Cổng ${port}: không giết được PID ${pid} — ${err.message}`);
    }
  }
}
