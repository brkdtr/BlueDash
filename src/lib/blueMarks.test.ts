import { describe, expect, it } from "vitest";
import { classifyMark, detectBlueMarksFromImageData, isBluePixel } from "./blueMarks";

function imageWithBlueLine(): ImageData {
  const width = 80;
  const height = 40;
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255; data[i + 1] = 255; data[i + 2] = 255; data[i + 3] = 255;
  }
  for (let x = 12; x < 62; x += 1) {
    for (let y = 27; y < 30; y += 1) {
      const i = (y * width + x) * 4;
      data[i] = 20; data[i + 1] = 80; data[i + 2] = 230; data[i + 3] = 255;
    }
  }
  return { data, width, height } as ImageData;
}

describe("blue mark detection", () => {
  it("detects blue pixels without accepting gray text", () => {
    expect(isBluePixel(20, 80, 230)).toBe(true);
    expect(isBluePixel(70, 70, 76)).toBe(false);
  });

  it("classifies long low marks as underlines", () => {
    expect(classifyMark({ x: 0, y: 0, width: 90, height: 8 }, 140)).toBe("underline");
  });

  it("finds connected blue underline components", () => {
    const marks = detectBlueMarksFromImageData(imageWithBlueLine(), "p1");
    expect(marks).toHaveLength(1);
    expect(marks[0].kind).toBe("underline");
  });
});
