/**
 * Chuẩn bị tài nguyên MediaPipe Hands cho tính năng dò chỉ tay (client-side).
 *
 * - Copy các file WASM từ node_modules/@mediapipe/tasks-vision/wasm → public/mediapipe/wasm
 * - Tải model hand_landmarker.task (~7.5MB) về public/mediapipe nếu chưa có
 *
 * Chạy tự động qua "predev" / "prebuild". Idempotent: có file rồi thì bỏ qua.
 * KHÔNG commit thư mục public/mediapipe (đã .gitignore) — chạy lại script là có.
 */
import { createWriteStream } from "node:fs";
import { copyFile, mkdir, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const wasmSrcDir = join(root, "node_modules", "@mediapipe", "tasks-vision", "wasm");
const outDir = join(root, "public", "mediapipe");
const wasmOutDir = join(outDir, "wasm");

const WASM_FILES = [
  "vision_wasm_internal.js",
  "vision_wasm_internal.wasm",
  "vision_wasm_nosimd_internal.js",
  "vision_wasm_nosimd_internal.wasm",
];

const MODEL_NAME = "hand_landmarker.task";
const MODEL_MIN_BYTES = 5_000_000; // ~7.5MB thực tế; chặn file tải hỏng/nửa chừng
const MODEL_URLS = [
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
  "https://cdn.jsdelivr.net/npm/@mediapipe/hand_landmarker@latest/hand_landmarker.task",
];

async function exists(p, minBytes = 1) {
  try {
    return (await stat(p)).size >= minBytes;
  } catch {
    return false;
  }
}

async function copyWasm() {
  if (!(await exists(join(wasmSrcDir, WASM_FILES[0])))) {
    console.warn(
      "[mediapipe] Không thấy @mediapipe/tasks-vision trong node_modules — chạy `pnpm install` trước.",
    );
    return false;
  }
  await mkdir(wasmOutDir, { recursive: true });
  let copied = 0;
  for (const f of WASM_FILES) {
    const dest = join(wasmOutDir, f);
    if (await exists(dest)) continue;
    try {
      await copyFile(join(wasmSrcDir, f), dest);
      copied++;
    } catch (err) {
      console.warn(`[mediapipe] Không copy được ${f}: ${err.message}`);
    }
  }
  if (copied) console.log(`[mediapipe] Đã copy ${copied} file WASM → public/mediapipe/wasm`);
  return true;
}

async function downloadModel() {
  const dest = join(outDir, MODEL_NAME);
  if (await exists(dest, MODEL_MIN_BYTES)) return true;
  await mkdir(outDir, { recursive: true });
  for (const url of MODEL_URLS) {
    try {
      console.log(`[mediapipe] Tải model: ${url}`);
      const res = await fetch(url, { signal: AbortSignal.timeout(120_000) });
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);
      await pipeline(Readable.fromWeb(res.body), createWriteStream(dest));
      if (await exists(dest, MODEL_MIN_BYTES)) {
        console.log(`[mediapipe] Đã lưu ${MODEL_NAME}`);
        return true;
      }
      throw new Error("file tải về quá nhỏ");
    } catch (err) {
      console.warn(`[mediapipe] Lỗi tải (${url}): ${err.message}`);
    }
  }
  console.warn(
    `\n[mediapipe] KHÔNG tải được model. Tính năng dò chỉ tay sẽ báo lỗi cấu hình.\n` +
      `  Tải thủ công rồi đặt vào: ${dest}\n` +
      `  Nguồn: ${MODEL_URLS[0]}\n`,
  );
  return false;
}

const okWasm = await copyWasm();
const okModel = await downloadModel();
if (!okWasm || !okModel) {
  // Không chặn dev/build — chỉ cảnh báo.
  console.warn("[mediapipe] Thiếu tài nguyên — /phan-tich-chi-tay sẽ hiển thị hướng dẫn cấu hình.");
}
