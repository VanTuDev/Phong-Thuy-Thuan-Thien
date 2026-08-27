import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { computeHandPose } from "../src/lib/handPose.ts";
import { computeHandMetrics } from "../src/lib/handMetrics.ts";
import type { Pt } from "../src/lib/handDetect.ts";

/** Bàn tay xoè phẳng, chính diện, ngón duỗi thẳng, tips fan rộng hơn hàng khớp. */
function flatHand(): Pt[] {
  return [
    [0.5, 0.95], // 0 wrist
    [0.35, 0.85], [0.28, 0.78], [0.24, 0.72], [0.2, 0.66], // thumb 1..4
    [0.4, 0.6], [0.39, 0.45], [0.385, 0.33], [0.38, 0.22], // index 5..8
    [0.5, 0.58], [0.5, 0.42], [0.5, 0.28], [0.5, 0.16], // middle 9..12
    [0.6, 0.6], [0.61, 0.45], [0.615, 0.33], [0.62, 0.22], // ring 13..16
    [0.68, 0.64], [0.7, 0.52], [0.71, 0.43], [0.72, 0.34], // pinky 17..20
  ];
}

/** Các ngón co gập về phía lòng bàn tay. */
function curledHand(): Pt[] {
  const lm = flatHand();
  lm[6] = [0.39, 0.45]; lm[7] = [0.42, 0.4]; lm[8] = [0.46, 0.5];
  lm[10] = [0.5, 0.42]; lm[11] = [0.52, 0.38]; lm[12] = [0.53, 0.5];
  lm[14] = [0.61, 0.45]; lm[15] = [0.6, 0.4]; lm[16] = [0.57, 0.52];
  lm[18] = [0.7, 0.52]; lm[19] = [0.69, 0.47]; lm[20] = [0.66, 0.55];
  return lm;
}

/** Bàn tay xoay quanh trục dọc → bề ngang lòng bàn tay bị nén. */
function skewHand(): Pt[] {
  const lm = flatHand();
  lm[5] = [0.46, 0.6];
  lm[17] = [0.56, 0.64];
  return lm;
}

describe("handPose", () => {
  it("bàn tay phẳng → ngón thẳng, chính diện, chất lượng tốt/khá", () => {
    const p = computeHandPose(flatHand());
    assert.ok(p.fingerBends.every((b) => b.state === "thẳng"), JSON.stringify(p.fingerBends));
    assert.equal(p.cupping, "phẳng");
    assert.equal(p.roll, "chính diện");
    assert.ok(["tốt", "khá"].includes(p.quality));
    assert.ok(p.tiltDeg < 10);
  });

  it("ngón co → ≥2 ngón 'cong nhiều', chất lượng kém, có cảnh báo", () => {
    const p = computeHandPose(curledHand());
    assert.ok(p.fingerBends.filter((b) => b.state === "cong nhiều").length >= 2);
    assert.equal(p.quality, "kém");
    assert.ok(p.issues.length > 0);
    assert.ok(p.notes.length > 0);
  });

  it("bàn tay bị nén ngang → phối cảnh không còn 'chính diện'", () => {
    const p = computeHandPose(skewHand());
    assert.notEqual(p.roll, "chính diện");
  });

  it("computeHandMetrics gắn pose + nối notes tư thế", () => {
    const m = computeHandMetrics(flatHand());
    assert.ok(m.pose);
    assert.equal(m.pose.fingerBends.length, 4);
    assert.ok(m.notes.some((n) => /máy ảnh|ngón|khum/i.test(n)));
  });
});
