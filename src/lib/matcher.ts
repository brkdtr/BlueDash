import type { BlueMark, Confidence, ExtractedEntry, OcrToken } from "../types";
import { center, expandBox, intersectionArea } from "./geometry";

const englishWord = /^[A-Za-z][A-Za-z'’-]{1,}$/;
const turkishSignals = /[çğıöşüÇĞİÖŞÜ]|^(bir|ve|veya|ile|olarak|etmek|olmak|anlam|karşılık)$/i;

function normalizeWord(value: string): string {
  return value.replace(/^[^A-Za-zÇĞİÖŞÜçğıöşü]+|[^A-Za-zÇĞİÖŞÜçğıöşü]+$/g, "").trim();
}

function confidenceFor(token: OcrToken, hasDefinition: boolean, overlapRatio: number): Confidence {
  if (token.confidence >= 75 && hasDefinition && overlapRatio > 0.18) return "high";
  if (token.confidence >= 55 && overlapRatio > 0.08) return "medium";
  return "low";
}

export function matchMarksToEntries(
  marks: BlueMark[],
  tokens: OcrToken[],
  sourceImageName: string
): ExtractedEntry[] {
  const entries: ExtractedEntry[] = [];
  for (const mark of marks) {
    const searchBox =
      mark.kind === "underline"
        ? expandBox({ ...mark.box, y: mark.box.y - mark.box.height * 2 }, 10, 18)
        : expandBox(mark.box, 10, 8);
    const candidates = tokens
      .filter((token) => englishWord.test(normalizeWord(token.text)))
      .map((token) => {
        const overlap = intersectionArea(searchBox, token.box);
        const distance = Math.abs(center(token.box).y - center(mark.box).y) + Math.abs(center(token.box).x - center(mark.box).x) / 6;
        return { token, overlap, score: overlap > 0 ? overlap / Math.max(1, token.box.width * token.box.height) : -distance / 500 };
      })
      .sort((a, b) => b.score - a.score);

    const best = candidates[0];
    if (!best || best.score < -0.4) continue;
    const term = normalizeWord(best.token.text);
    const definition = findDefinition(best.token, tokens);
    const confidence = confidenceFor(best.token, Boolean(definition), Math.max(0, best.score));
    entries.push({
      id: `${mark.id}-${best.token.id}`,
      term,
      definition,
      pageId: mark.pageId,
      sourceImageName,
      markKind: mark.kind,
      confidence,
      needsReview: confidence !== "high",
      notes: definition ? "" : "Turkce karsilik guvenle bulunamadi."
    });
  }
  return mergeDuplicates(entries);
}

export function findDefinition(termToken: OcrToken, tokens: OcrToken[]): string {
  const sameLine = tokens
    .filter((token) => token.pageId === termToken.pageId && token.id !== termToken.id)
    .filter((token) => Math.abs(center(token.box).y - center(termToken.box).y) < Math.max(18, termToken.box.height * 0.85))
    .filter((token) => token.box.x > termToken.box.x + termToken.box.width)
    .sort((a, b) => a.box.x - b.box.x);
  const definitionTokens = sameLine
    .map((token) => normalizeWord(token.text))
    .filter((word) => word.length > 0)
    .filter((word, index) => index < 3 || !englishWord.test(word) || turkishSignals.test(word));
  return definitionTokens.slice(0, 8).join(" ");
}

export function mergeDuplicates(entries: ExtractedEntry[]): ExtractedEntry[] {
  const seen = new Map<string, ExtractedEntry>();
  return entries.map((entry) => {
    const key = entry.term.toLocaleLowerCase("en-US");
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, entry);
      return entry;
    }
    return { ...entry, duplicateOf: existing.id, needsReview: true, notes: "Ayni kelime daha once bulundu." };
  });
}
