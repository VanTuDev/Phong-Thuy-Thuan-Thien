import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  handLabel,
  moleHand,
  sanitizePositions,
  FACE_MOLE_POSITIONS,
  HAND_MOLE_ZONES,
} from "../src/lib/palmRegions.ts";

describe("palmRegions / mole positions", () => {
  it("nam xem tay trái, nữ xem tay phải", () => {
    assert.equal(moleHand("nam"), "trai");
    assert.equal(moleHand("nu"), "phai");
    assert.equal(handLabel("trai"), "trái");
    assert.equal(handLabel("phai"), "phải");
  });

  it("sơ đồ mặt 78 vị trí, tay 50 ô", () => {
    assert.equal(FACE_MOLE_POSITIONS, 78);
    assert.equal(HAND_MOLE_ZONES, 50);
  });

  it("sanitizePositions: lọc ngoài khoảng, khử trùng, sắp tăng", () => {
    assert.deepEqual(sanitizePositions([5, 5, 2, 999, 0, -1, 78], 78), [2, 5, 78]);
    assert.deepEqual(sanitizePositions([51, 50, 1], 50), [1, 50]);
    assert.deepEqual(sanitizePositions([], 78), []);
    assert.deepEqual(sanitizePositions([3.9, 3.1], 50), [3]);
  });
});
