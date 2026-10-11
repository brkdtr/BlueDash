import { detectBlueMarksFromImageData } from "./blueMarks";
import { normalizeImageFile } from "./imageFormats";
import { matchMarksToEntries } from "./matcher";
import { runOcr } from "./ocr";
import { saveImageBlob } from "./storage";
import type { ExtractedEntry } from "../types";

export async function processPage(file: File): Promise<ExtractedEntry[]> {
  const pageId = crypto.randomUUID();
  const normalizedFile = await normalizeImageFile(file);
  await saveImageBlob(pageId, normalizedFile);
  const [imageData, tokens] = await Promise.all([fileToImageData(normalizedFile), runOcr(normalizedFile, pageId)]);
  const marks = detectBlueMarksFromImageData(imageData, pageId);
  return matchMarksToEntries(marks, tokens, file.name);
}

export async function fileToImageData(file: File): Promise<ImageData> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(
      "Fotograf tarayici tarafindan okunamadi. HEIC ise BlueDash otomatik JPEG'e cevirmeyi dener; hata surerse iPhone'da Ayarlar > Kamera > Bicimler > En Uyumlu secenegiyle yeniden cekin veya fotografi JPEG olarak paylasin."
    );
  }
  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("Canvas olusturulamadi.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return context.getImageData(0, 0, canvas.width, canvas.height);
}
