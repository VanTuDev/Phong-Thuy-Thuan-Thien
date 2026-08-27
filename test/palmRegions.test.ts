import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { handLabel, moleHand, PALM_REGIONS } from "../src/lib/palmRegions.ts";

describe("palmRegions", () => {
  it("nam xem tay trái, nữ xem tay phải", () => {
    assert.equal(moleHand("nam"), "trai");
    assert.equal(moleHand("nu"), "phai");
    assert.equal(handLabel("trai"), "trái");
    assert.equal(handLabel("phai"), "phải");
  });

  it("có đúng 10 vùng, số n = 1..10 duy nhất, toạ độ trong [0,1]", () => {
    assert.equal(PALM_REGIONS.length, 10);
    const ns = PALM_REGIONS.map((r) => r.n).sort((a, b) => a - b);
    assert.deepEqual(ns, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    for (const r of PALM_REGIONS) {
      assert.ok(r.name && r.meaning && r.key, `vùng ${r.n} thiếu nhãn`);
      assert.ok(r.at[0] >= 0 && r.at[0] <= 1 && r.at[1] >= 0 && r.at[1] <= 1);
    }
  });
});
