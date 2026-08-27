import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { creaseResponse, snapLineToCrease } from "../src/lib/palmCrease.ts";
import type { Pt } from "../src/lib/handDetect.ts";

const W = 140;
const H = 90;
const crease = (x: number) => 45 + 9 * Math.sin(x / 13); // rãnh tối cong

function field(withCrease: boolean): Float32Array {
  const g = new Float32Array(W * H).fill(0.62);
  if (withCrease) {
    for (let x = 0; x < W; x++) {
      const yc = crease(x);
      for (let y = 0; y < H; y++) {
        const d = Math.abs(y - yc);
        if (d < 1.4) g[y * W + x] = 0.18;
        else if (d < 2.4) g[y * W + x] = 0.4;
      }
    }
  }
  return g;
}

const straightLine = (): Pt[] =>
  Array.from({ length: 24 }, (_, i) => [8 + (i / 23) * (W - 16), 45] as Pt);

describe("palmCrease · bám rãnh", () => {
  it("creaseResponse nổi rõ ở rãnh tối, thấp ở nền", () => {
    const resp = creaseResponse(field(true), W, H, Math.max(W, H));
    let onLine = 0;
    let onBg = 0;
    for (let x = 20; x < W - 20; x += 7) {
      onLine += resp[Math.round(crease(x)) * W + x];
      onBg += resp[10 * W + x];
    }
    assert.ok(onLine / onBg > 4, `rãnh (${onLine.toFixed(2)}) phải nổi hơn nền (${onBg.toFixed(2)})`);
  });

  it("snapLineToCrease kéo đường thẳng về đúng rãnh cong", () => {
    const resp = creaseResponse(field(true), W, H, Math.max(W, H));
    const { pts, confidence } = snapLineToCrease(resp, W, H, straightLine(), { searchPx: 18 });
    const err =
      pts.reduce((s, [x, y]) => s + Math.abs(y - crease(x)), 0) / pts.length;
    assert.ok(err < 2.5, `sai số trung bình ${err.toFixed(2)}px phải < 2.5`);
    assert.ok(confidence > 0.15, `độ tin cậy ${confidence.toFixed(3)} phải > 0.15`);
  });

  it("ảnh phẳng (không rãnh) → độ tin cậy thấp, đường không chạy lung tung", () => {
    const resp = creaseResponse(field(false), W, H, Math.max(W, H));
    const { pts, confidence } = snapLineToCrease(resp, W, H, straightLine(), { searchPx: 18 });
    assert.ok(confidence < 0.12, `độ tin cậy ${confidence.toFixed(3)} phải thấp`);
    const maxDev = Math.max(...pts.map(([, y]) => Math.abs(y - 45)));
    assert.ok(maxDev < 6, `lệch tối đa ${maxDev.toFixed(1)}px vẫn gần đường neo`);
  });
});
