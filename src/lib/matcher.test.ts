import { describe, expect, it } from "vitest";
import type { BlueMark, OcrToken } from "../types";
import { findDefinition, matchMarksToEntries, mergeDuplicates } from "./matcher";

const tokens: OcrToken[] = [
  { id: "w1", pageId: "p1", text: "accurate", confidence: 91, box: { x: 20, y: 20, width: 70, height: 18 } },
  { id: "w2", pageId: "p1", text: "dogru", confidence: 88, box: { x: 110, y: 20, width: 44, height: 18 } },
  { id: "w3", pageId: "p1", text: "random", confidence: 88, box: { x: 20, y: 80, width: 60, height: 18 } }
];

describe("matcher", () => {
  it("reads Turkish definition from the same line on the right", () => {
    expect(findDefinition(tokens[0], tokens)).toBe("dogru");
  });

  it("matches a blue underline to the OCR token above it", () => {
    const marks: BlueMark[] = [{ id: "m1", pageId: "p1", kind: "underline", score: 1, box: { x: 18, y: 39, width: 76, height: 4 } }];
    const entries = matchMarksToEntries(marks, tokens, "sample.png");
    expect(entries[0].term).toBe("accurate");
    expect(entries[0].definition).toBe("dogru");
    expect(entries[0].needsReview).toBe(false);
  });

  it("marks repeated terms for review", () => {
    const merged = mergeDuplicates([
      { id: "1", term: "aim", definition: "amac", pageId: "p", sourceImageName: "a", markKind: "circle", confidence: "high", needsReview: false, notes: "" },
      { id: "2", term: "Aim", definition: "amac", pageId: "p", sourceImageName: "a", markKind: "circle", confidence: "high", needsReview: false, notes: "" }
    ]);
    expect(merged[1].duplicateOf).toBe("1");
    expect(merged[1].needsReview).toBe(true);
  });
});
