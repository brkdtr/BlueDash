import { describe, expect, it } from "vitest";
import { filterNewEntries, parseExistingTerms, toQuizletTsv } from "./quizlet";
import type { ExtractedEntry } from "../types";

const entry = (term: string): ExtractedEntry => ({
  id: term,
  term,
  definition: "anlam",
  pageId: "p",
  sourceImageName: "x",
  markKind: "unknown",
  confidence: "high",
  needsReview: false,
  notes: ""
});

describe("quizlet export", () => {
  it("parses existing TSV terms", () => {
    expect(parseExistingTerms("aim\tamac\nbook\tkitap")).toHaveLength(2);
  });

  it("excludes existing and duplicate terms", () => {
    expect(filterNewEntries([entry("aim"), entry("Book")], [{ term: "book", definition: "kitap" }]).map((item) => item.term)).toEqual(["aim"]);
  });

  it("creates UTF-8 TSV without embedded tabs", () => {
    expect(toQuizletTsv([{ ...entry("look\tup"), definition: "aramak\nbakmak" }])).toBe("look up\taramak bakmak");
  });
});
