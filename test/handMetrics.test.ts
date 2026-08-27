import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { computeHandMetrics } from "../src/lib/handMetrics.ts";
import type { Pt } from "../src/lib/handDetect.ts";

/** Bàn tay phải, ngón khép, ngón giữa dài nhất, ngón út ngắn. */
function closedHand(): Pt[] {
  return [
    [0.5, 0.9],
    [0.37, 0.82],
    [0.3, 0.74],
    [0.25, 0.66],
    [0.21, 0.6],
    [0.4, 0.55],
    [0.39, 0.42],
    [0.385, 0.33],
    [0.38, 0.25],
    [0.5, 0.53],
    [0.5, 0.39],
    [0.5, 0.29],
    [0.5, 0.2],
    [0.59, 0.55],
    [0.6, 0.42],
    [0.605, 0.33],
    [0.61, 0.25],
    [0.67, 0.6],
    [0.69, 0.5],
    [0.7, 0.44],
    [0.71, 0.38],
  ];
}

/** Cùng bàn tay nhưng xoè rộng các ngón. */
function spreadHand(): Pt[] {
  const lm = closedHand();
  lm[8] = [0.22, 0.27]; // index tip ra ngoài
  lm[7] = [0.3, 0.35];
  lm[12] = [0.49, 0.2]; // middle gần thẳng
  lm[16] = [0.72, 0.26]; // ring tip ra ngoài
  lm[15] = [0.67, 0.35];
  lm[20] = [0.88, 0.42]; // pinky tip ra xa
  lm[19] = [0.8, 0.5];
  return lm;
}

describe("handMetrics", () => {
  it("ngón giữa dài nhất, ngón út ngắn nhất", () => {
    const m = computeHandMetrics(closedHand());
    assert.equal(m.longest, "Ngón giữa");
    assert.equal(m.shortest, "Ngón út");
    const pinky = m.fingers.find((f) => f.id === "pinky")!;
    assert.equal(pinky.relative, "ngắn");
    assert.equal(pinky.rank, 4);
    assert.equal(m.fingers.find((f) => f.id === "middle")!.rank, 1);
  });

  it("chiều dài chuẩn hoá + digitRatio hợp lệ", () => {
    const m = computeHandMetrics(closedHand());
    for (const f of m.fingers) assert.ok(f.length > 0.15 && f.length < 1.2, `${f.label} ${f.length}`);
    assert.ok(m.digitRatio > 0.5 && m.digitRatio < 1.5);
  });

  it("bàn tay khép → mọi khe 'khép'; xoè → có khe 'hở rộng'", () => {
    const closed = computeHandMetrics(closedHand());
    assert.ok(closed.gaps.every((g) => g.openness === "khép"));

    const spread = computeHandMetrics(spreadHand());
    assert.ok(spread.gaps.some((g) => g.openness === "hở rộng"));
    assert.ok(spread.widestGap.length > 0);
  });

  it("nguyên tố suy từ hình bàn tay + độ dài ngón", () => {
    const m = computeHandMetrics(closedHand());
    assert.ok(["Thổ", "Khí", "Hỏa", "Thủy"].includes(m.element));
    assert.equal(m.elementIcon, { Thổ: "landscape", Khí: "air", Hỏa: "local_fire_department", Thủy: "water_drop" }[m.element]);
    assert.ok(["vuông", "chữ nhật"].includes(m.palmShape));
  });

  it("notes không rỗng, có góc ngón cái", () => {
    const m = computeHandMetrics(closedHand());
    assert.ok(m.notes.length >= 3);
    assert.ok(m.notes.some((n) => n.includes("ngón cái")));
    assert.ok(m.thumbAngleDeg > 0 && m.thumbAngleDeg < 180);
  });
});
