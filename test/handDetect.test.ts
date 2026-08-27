import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import {
  catmullRom,
  computeAnchors,
  countExtendedFingers,
  fingerCurled,
  handBBox,
  resamplePolyline,
  type Pt,
} from "../src/lib/handDetect.ts";

/** Bàn tay phải mở, lòng bàn tay hướng máy ảnh, ngón hướng lên (y nhỏ ở trên). */
function openRightHand(): Pt[] {
  return [
    [0.5, 0.9], // 0 wrist
    [0.37, 0.82], // 1 thumb_cmc
    [0.3, 0.74], // 2 thumb_mcp
    [0.25, 0.66], // 3 thumb_ip
    [0.21, 0.6], // 4 thumb_tip
    [0.4, 0.55], // 5 index_mcp
    [0.39, 0.42], // 6 index_pip
    [0.385, 0.33], // 7 index_dip
    [0.38, 0.25], // 8 index_tip
    [0.5, 0.53], // 9 middle_mcp
    [0.5, 0.39], // 10
    [0.5, 0.29], // 11
    [0.5, 0.2], // 12 middle_tip
    [0.59, 0.55], // 13 ring_mcp
    [0.6, 0.42], // 14
    [0.605, 0.33], // 15
    [0.61, 0.25], // 16 ring_tip
    [0.67, 0.6], // 17 pinky_mcp
    [0.69, 0.5], // 18
    [0.7, 0.44], // 19
    [0.71, 0.38], // 20 pinky_tip
  ];
}

/** Cùng bàn tay nhưng 3 ngón co lại (đầu ngón kéo về gần cổ tay). */
function fistish(): Pt[] {
  const lm = openRightHand();
  lm[8] = [0.42, 0.62]; // index_tip
  lm[12] = [0.5, 0.6]; // middle_tip
  lm[16] = [0.58, 0.62]; // ring_tip
  return lm;
}

const avgY = (pts: Pt[]) => pts.reduce((s, p) => s + p[1], 0) / pts.length;

describe("handDetect · hình học", () => {
  it("handBBox bao trọn các điểm", () => {
    const b = handBBox(openRightHand());
    assert.ok(b.x >= 0.2 && b.x <= 0.22);
    assert.ok(b.w > 0.45 && b.w < 0.55);
    assert.ok(b.h > 0.65 && b.h < 0.75);
  });

  it("countExtendedFingers: 4 khi xoè, ít hơn khi co", () => {
    assert.equal(countExtendedFingers(openRightHand()), 4);
    assert.ok(countExtendedFingers(fistish()) <= 1);
  });

  it("fingerCurled nhận ra ngón co", () => {
    assert.equal(fingerCurled(openRightHand(), 8, 6), false);
    assert.equal(fingerCurled(fistish(), 8, 6), true);
  });

  it("resamplePolyline: đúng số điểm, giữ đầu/cuối, cách đều", () => {
    const out = resamplePolyline(
      [
        [0, 0],
        [0, 10],
      ],
      6,
    );
    assert.equal(out.length, 6);
    assert.deepEqual(out[0], [0, 0]);
    assert.deepEqual(out[5], [0, 10]);
    assert.ok(Math.abs(out[3][1] - 6) < 0.01);
  });

  it("catmullRom đi qua điểm đầu và cuối", () => {
    const out = catmullRom(
      [
        [0, 0],
        [1, 1],
        [2, 0],
      ],
      4,
    );
    assert.equal(out.length, 2 * 4 + 1);
    assert.deepEqual(out[0], [0, 0]);
    assert.deepEqual(out[out.length - 1], [2, 0]);
  });

  it("computeAnchors: 3 đường, mọi điểm trong [0,1]", () => {
    const a = computeAnchors(openRightHand());
    for (const id of ["path-life", "path-head", "path-heart"] as const) {
      assert.ok(a[id].length >= 6, `${id} đủ điểm`);
      for (const [x, y] of a[id]) {
        assert.ok(x >= 0 && x <= 1 && y >= 0 && y <= 1, `${id} điểm trong khung`);
      }
    }
  });

  it("Tâm đạo cao hơn Trí đạo; Sinh đạo thấp nhất", () => {
    const a = computeAnchors(openRightHand());
    assert.ok(avgY(a["path-heart"]) < avgY(a["path-head"]), "tâm đạo (y nhỏ) cao hơn trí đạo");
    assert.ok(avgY(a["path-head"]) < avgY(a["path-life"]), "trí đạo cao hơn phần cuối sinh đạo");
  });

  it("Sinh đạo vòng cung ôm về phía ngón cái (bụng đường lệch khỏi hai đầu)", () => {
    const life = computeAnchors(openRightHand())["path-life"];
    const mid = life[Math.floor(life.length / 2)];
    // r hướng về ngón cái = phía x nhỏ ở bàn tay này → bụng đường có x nhỏ hơn hai đầu
    assert.ok(mid[0] < life[0][0], "bụng lệch khỏi điểm đầu");
    assert.ok(mid[0] < life[life.length - 1][0], "bụng lệch khỏi điểm cuối");
  });
});
