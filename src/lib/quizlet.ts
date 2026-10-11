import { ExistingQuizletTerm, ExtractedEntry, QUIZLET_SET_TITLE } from "../types";

export function parseExistingTerms(raw: string): ExistingQuizletTerm[] {
  return raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [term = "", definition = ""] = line.split(/\t|,/);
      return { term: term.trim(), definition: definition.trim() };
    })
    .filter((item) => item.term);
}

export function filterNewEntries(entries: ExtractedEntry[], existing: ExistingQuizletTerm[]): ExtractedEntry[] {
  const existingTerms = new Set(existing.map((item) => item.term.toLocaleLowerCase("en-US")));
  const emitted = new Set<string>();
  return entries.filter((entry) => {
    const key = entry.term.toLocaleLowerCase("en-US");
    if (entry.duplicateOf || existingTerms.has(key) || emitted.has(key)) return false;
    emitted.add(key);
    return true;
  });
}

export function toQuizletTsv(entries: ExtractedEntry[]): string {
  return entries
    .map((entry) => `${sanitizeCell(entry.term)}\t${sanitizeCell(entry.definition)}`)
    .join("\n");
}

export function quizletImportInstructions(): string {
  return `Quizlet set basligi: ${QUIZLET_SET_TITLE}. Dogrudan public Quizlet API ile otomatik ekleme dogrulanamadigi icin TSV metnini Quizlet'in Import aracina yapistirin; mevcut sette duzenleme ekraninda Import secenegini kullanarak ayni sete ekleyin.`;
}

function sanitizeCell(value: string): string {
  return value.replace(/\t/g, " ").replace(/\r?\n/g, " ").trim();
}
