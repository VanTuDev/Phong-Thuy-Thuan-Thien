import { strict as assert } from "node:assert";
import { afterEach, describe, it } from "node:test";
import { apiBase, mediaUrl, ApiError } from "../src/lib/api.ts";
import { formatVnd } from "../src/lib/endpoints.ts";

afterEach(() => {
  delete process.env.NEXT_PUBLIC_API_URL;
  delete process.env.NEXT_PUBLIC_API_PORT;
});

describe("apiBase", () => {
  it("dùng NEXT_PUBLIC_API_URL khi được đặt (bỏ '/' cuối)", () => {
    process.env.NEXT_PUBLIC_API_URL = "https://api.tenmien.com/";
    assert.equal(apiBase(), "https://api.tenmien.com");
  });

  it("không có env + không có window (SSR) → localhost:4000", () => {
    assert.equal(apiBase(), "http://localhost:4000");
  });

  it("tôn trọng NEXT_PUBLIC_API_PORT", () => {
    process.env.NEXT_PUBLIC_API_PORT = "5000";
    assert.equal(apiBase(), "http://localhost:5000");
  });
});

describe("mediaUrl", () => {
  it("ghép đường dẫn tương đối với apiBase", () => {
    process.env.NEXT_PUBLIC_API_URL = "http://192.168.1.2:4000";
    assert.equal(mediaUrl("/uploads/a.png"), "http://192.168.1.2:4000/uploads/a.png");
    assert.equal(mediaUrl("uploads/a.png"), "http://192.168.1.2:4000/uploads/a.png");
  });

  it("giữ nguyên URL tuyệt đối (Cloudinary) và data URL", () => {
    assert.equal(
      mediaUrl("https://res.cloudinary.com/hanb7egm/image/upload/x.png"),
      "https://res.cloudinary.com/hanb7egm/image/upload/x.png",
    );
    assert.equal(mediaUrl("data:image/png;base64,AAAA"), "data:image/png;base64,AAAA");
    assert.equal(mediaUrl("//cdn.example.com/x.png"), "//cdn.example.com/x.png");
  });

  it("rỗng/null → chuỗi rỗng", () => {
    assert.equal(mediaUrl(""), "");
    assert.equal(mediaUrl(null), "");
    assert.equal(mediaUrl(undefined), "");
  });
});

describe("ApiError", () => {
  it("là Error, giữ status + details", () => {
    const e = new ApiError(402, "Hết lượt", { x: 1 });
    assert.ok(e instanceof Error);
    assert.equal(e.name, "ApiError");
    assert.equal(e.status, 402);
    assert.deepEqual(e.details, { x: 1 });
  });
});

describe("formatVnd", () => {
  it("định dạng tiền VNĐ", () => {
    assert.equal(formatVnd(30000), "30.000đ");
    assert.equal(formatVnd(0), "0đ");
    assert.equal(formatVnd(1234567), "1.234.567đ");
  });
});
