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

/**
 * Cùng bàn tay nhưng NGÓN TRỎ + NGÓN ÚT xoè rộng — xoay CẢ đốt gần gốc (PIP)
 * ra khỏi trục ngón (không chỉ đẩy đầu ngón/DIP/TIP), vì đó mới là toác THẬT ở
 * khớp MCP (khác với ngón chỉ cong ở đốt xa, vốn KHÔNG phải toác).
 */
function spreadHand(): Pt[] {
  const lm = closedHand();
  lm[6] = [0.32, 0.42]; // index PIP xoay ra xa middle
  lm[7] = [0.27, 0.32];
  lm[8] = [0.22, 0.24];
  lm[18] = [0.78, 0.5]; // pinky PIP xoay ra xa ring
  lm[19] = [0.85, 0.42];
  lm[20] = [0.92, 0.35];
  return lm;
}

/** Ngón út CONG QUẶP vào ngón áp út (chiều ngược spreadHand — adduction thật). */
function pinkyCurledHand(): Pt[] {
  const lm = closedHand();
  lm[18] = [0.63, 0.48];
  lm[19] = [0.6, 0.4];
  lm[20] = [0.58, 0.33];
  return lm;
}

/** Ngón cái xoè RỘNG hẳn ra khỏi bàn tay (webspace lớn). */
function thumbWideHand(): Pt[] {
  const lm = closedHand();
  lm[1] = [0.42, 0.85];
  lm[2] = [0.55, 0.8];
  lm[3] = [0.7, 0.7];
  lm[4] = [0.85, 0.58];
  return lm;
}

/** Ngón cái khép SÁT vào lòng bàn tay (webspace hẹp). */
function thumbNarrowHand(): Pt[] {
  const lm = closedHand();
  lm[1] = [0.44, 0.78];
  lm[2] = [0.42, 0.68];
  lm[3] = [0.4, 0.58];
  lm[4] = [0.38, 0.48];
  return lm;
}

/**
 * Áp út–Út: KHÉP ở gốc (MCP/PIP giữ nguyên) nhưng ngón út CONG TOÁC ra xa dần
 * về phía đầu móng (chỉ DIP/TIP lệch) — kho tri thức tướng tay gọi đây là
 * "càng về phần móng tay càng hở", KHÁC với hở ngay từ gốc.
 */
function pinkyWidenTowardTipHand(): Pt[] {
  const lm = closedHand();
  lm[19] = [0.74, 0.42];
  lm[20] = [0.8, 0.34];
  return lm;
}

/** Áp út–Út: HỞ ở gốc nhưng khép dần lại về phía đầu móng. */
function pinkyNarrowTowardTipHand(): Pt[] {
  const lm = closedHand();
  lm[17] = [0.72, 0.6];
  lm[18] = [0.76, 0.5];
  lm[19] = [0.7, 0.4];
  lm[20] = [0.63, 0.3];
  return lm;
}

/**
 * Ngón út CHỈ CO/GẬP vào lòng bàn tay (đầu móng quay ngược lại phía cổ tay) —
 * KHÔNG hề lệch ngang. Bẫy: nếu chỉ so góc gốc với góc đầu móng mà không lọc
 * ngón còn duỗi hay không, phép đo cũ sẽ báo NHẦM "khép dần"/"toác dần" dù
 * thực tế chỉ là ngón đang co lại (vd ảnh chụp chưa xoè hết bàn tay).
 */
function pinkyCurledInwardHand(): Pt[] {
  const lm = closedHand();
  lm[19] = [0.685, 0.55];
  lm[20] = [0.66, 0.62];
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
    assert.equal(closed.pinkyCurl, "thẳng");

    const spread = computeHandMetrics(spreadHand());
    assert.ok(spread.gaps.some((g) => g.openness === "hở rộng"));
    assert.ok(spread.widestGap.length > 0);
  });

  it("ngón út CONG QUẶP vào ngón áp út → gap 'Áp út – Út' âm, openness 'cong vào'", () => {
    const m = computeHandMetrics(pinkyCurledHand());
    const ringPinky = m.gaps.find((g) => g.label === "Áp út – Út")!;
    assert.ok(ringPinky.angleDeg < 0, `expected âm, got ${ringPinky.angleDeg}`);
    assert.equal(ringPinky.openness, "cong vào");
    assert.equal(m.pinkyCurl, "cong vào áp út");
    assert.equal(m.pinkyCurlDeg, ringPinky.angleDeg);
    assert.ok(m.notes.some((n) => n.includes("quặp")));
  });

  it("KHÔNG hiệu chỉnh tỉ lệ ảnh dọc (điện thoại 9:16) → hiểu SAI 'khép' thành 'vừa'; có imageSize → đúng lại", () => {
    // MediaPipe chuẩn hoá x theo BỀ RỘNG, y theo BỀ CAO ĐỘC LẬP nhau — ảnh dọc
    // (width < height, rất phổ biến khi chụp bằng điện thoại) làm khoảng cách
    // ngang bị THỔI PHỒNG nếu không quy đổi lại, biến ngón khép thật thành "hở" giả.
    const closed = closedHand();
    const aspect = 9 / 16;
    const wristX = closed[0][0];
    const distorted: Pt[] = closed.map(([x, y]) => [wristX + (x - wristX) / aspect, y]);

    const wrong = computeHandMetrics(distorted); // thiếu imageSize → SAI
    assert.ok(
      wrong.gaps.every((g) => g.openness === "khép") === false,
      "kỳ vọng KHÔNG hiệu chỉnh sẽ đọc sai (không còn toàn 'khép')",
    );

    const fixed = computeHandMetrics(distorted, { width: 9, height: 16 }); // có hiệu chỉnh → đúng lại
    assert.ok(fixed.gaps.every((g) => g.openness === "khép"));
    assert.equal(fixed.pinkyCurl, "thẳng");
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

  it("khép ở gốc nhưng toác dần ra đầu móng → trend 'toác dần' dù openness vẫn 'khép'", () => {
    const m = computeHandMetrics(pinkyWidenTowardTipHand());
    const g = m.gaps.find((x) => x.label === "Áp út – Út")!;
    assert.equal(g.openness, "khép"); // gốc không đổi
    assert.equal(g.trend, "toác dần"); // nhưng đầu móng toác ra rõ
  });

  it("hở ở gốc nhưng khép dần lại về đầu móng → trend 'khép dần'", () => {
    const m = computeHandMetrics(pinkyNarrowTowardTipHand());
    const g = m.gaps.find((x) => x.label === "Áp út – Út")!;
    assert.equal(g.openness, "hở rộng");
    assert.equal(g.trend, "khép dần");
  });

  it("bàn tay thẳng đều (không toác/khép dọc ngón) → mọi trend 'đều'", () => {
    const m = computeHandMetrics(closedHand());
    assert.ok(m.gaps.every((g) => g.trend === "đều"));
  });

  it("ngón CO/GẬP vào lòng bàn tay (không lệch ngang) → trend VẪN 'đều', không báo nhầm", () => {
    const m = computeHandMetrics(pinkyCurledInwardHand());
    const g = m.gaps.find((x) => x.label === "Áp út – Út")!;
    assert.equal(g.openness, "khép"); // góc gốc không đổi — đúng
    assert.equal(g.trend, "đều"); // KHÔNG được báo "khép dần" chỉ vì ngón co lại
  });

  it("ngón út CO/GẬP (chưa xoè hết) → pinkyReach về mặc định an toàn, KHÔNG báo nhầm 'ngắn'", () => {
    const m = computeHandMetrics(pinkyCurledInwardHand());
    assert.equal(m.pinkyReach, "tới khớp giữa");
  });

  it("ngón cái xoè rộng → thumbOpenness 'rộng'; khép sát → 'hẹp'", () => {
    const wide = computeHandMetrics(thumbWideHand());
    assert.equal(wide.thumbOpenness, "rộng");

    const narrow = computeHandMetrics(thumbNarrowHand());
    assert.equal(narrow.thumbOpenness, "hẹp");

    const normal = computeHandMetrics(closedHand());
    assert.equal(normal.thumbOpenness, "vừa");
  });
});
