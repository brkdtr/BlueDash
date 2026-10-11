export const QUIZLET_SET_TITLE = "2027 YDS";

export type MarkKind = "underline" | "circle" | "scribble" | "unknown";
export type Confidence = "high" | "medium" | "low";

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OcrToken {
  id: string;
  text: string;
  box: Box;
  confidence: number;
  pageId: string;
  lineId?: string;
}

export interface BlueMark {
  id: string;
  box: Box;
  kind: MarkKind;
  score: number;
  pageId: string;
}

export interface ExtractedEntry {
  id: string;
  term: string;
  definition: string;
  pageId: string;
  sourceImageName: string;
  markKind: MarkKind;
  confidence: Confidence;
  needsReview: boolean;
  duplicateOf?: string;
  notes: string;
}

export interface ExistingQuizletTerm {
  term: string;
  definition: string;
}
