import { describe, expect, it, vi } from "vitest";
import { hasHeicSignature, isHeicFile, normalizeImageFile } from "./imageFormats";

vi.mock("heic2any", () => ({
  default: vi.fn(async () => new Blob(["jpg"], { type: "image/jpeg" }))
}));

describe("image format normalization", () => {
  it("detects iPhone HEIC and HEIF files by type or extension", () => {
    expect(isHeicFile(new File(["x"], "photo.HEIC", { type: "" }))).toBe(true);
    expect(isHeicFile(new File(["x"], "photo.jpg", { type: "image/heif" }))).toBe(true);
    expect(isHeicFile(new File(["x"], "photo.jpg", { type: "image/jpeg" }))).toBe(false);
  });

  it("converts HEIC files to JPEG files before processing", async () => {
    const converted = await normalizeImageFile(new File(["x"], "page.heic", { type: "image/heic" }));
    expect(converted.name).toBe("page.jpg");
    expect(converted.type).toBe("image/jpeg");
  });

  it("detects HEIC files by binary signature when name and type are missing", async () => {
    const bytes = new Uint8Array([0, 0, 0, 24, 102, 116, 121, 112, 104, 101, 105, 99, 0, 0, 0, 0]);
    expect(await hasHeicSignature(new File([bytes], "camera-upload", { type: "" }))).toBe(true);
  });
});
