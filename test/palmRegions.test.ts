import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { handLabel, moleHand, sanitizePositions, HAND_MOLE_ZONES } from "../src/lib/palmRegions.ts";
import { FACE_MOLE_COUNT, faceMoleArea } from "../src/lib/faceMolePositions.ts";

describe("palmRegions / mole positions", () => {
  it("nam xem tay trái, nữ xem tay phải", () => {
    assert.equal(moleHand("nam"), "trai");
    assert.equal(moleHand("nu"), "phai");
    assert.equal(handLabel("trai"), "trái");
    assert.equal(handLabel("phai"), "phải");
  });

  it("sơ đồ mặt 78 vị trí (đủ mô tả), tay 50 ô", () => {
    assert.equal(FACE_MOLE_COUNT, 78);
    assert.equal(HAND_MOLE_ZONES, 50);
    for (let n = 1; n <= 78; n++) assert.ok(faceMoleArea(n).length > 3, `thiếu mô tả vị trí ${n}`);
  });

  it("sanitizePositions: lọc ngoài khoảng, khử trùng, sắp tăng", () => {
    assert.deepEqual(sanitizePositions([5, 5, 2, 999, 0, -1, 78], 78), [2, 5, 78]);
    assert.deepEqual(sanitizePositions([51, 50, 1], 50), [1, 50]);
    assert.deepEqual(sanitizePositions([], 78), []);
    assert.deepEqual(sanitizePositions([3.9, 3.1], 50), [3]);
  });
});
