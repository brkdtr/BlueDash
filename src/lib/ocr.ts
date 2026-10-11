import { createWorker } from "tesseract.js";
import type { OcrToken } from "../types";

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
  line?: { id?: string };
}

export async function runOcr(file: File, pageId: string): Promise<OcrToken[]> {
  const worker = await createWorker("eng+tur");
  try {
    const result = await worker.recognize(file);
    const words = ((result.data as unknown as { words?: TesseractWord[] }).words ?? []).filter((word) =>
      word.text.trim()
    );
    return words.map((word, index) => ({
      id: `${pageId}-word-${index}`,
      pageId,
      text: word.text.trim(),
      confidence: word.confidence,
      box: {
        x: word.bbox.x0,
        y: word.bbox.y0,
        width: word.bbox.x1 - word.bbox.x0,
        height: word.bbox.y1 - word.bbox.y0
      },
      lineId: word.line?.id
    }));
  } finally {
    await worker.terminate();
  }
}
