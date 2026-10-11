import { del, get, set } from "idb-keyval";
import type { ExtractedEntry } from "../types";

const ENTRIES_KEY = "bluedash.entries";
const IMAGES_KEY = "bluedash.images";

export async function saveEntries(entries: ExtractedEntry[]): Promise<void> {
  await set(ENTRIES_KEY, entries);
}

export async function loadEntries(): Promise<ExtractedEntry[]> {
  return (await get<ExtractedEntry[]>(ENTRIES_KEY)) ?? [];
}

export async function saveImageBlob(id: string, file: File): Promise<void> {
  const images = (await get<Record<string, Blob>>(IMAGES_KEY)) ?? {};
  images[id] = file;
  await set(IMAGES_KEY, images);
}

export async function clearPrivateData(): Promise<void> {
  await del(ENTRIES_KEY);
  await del(IMAGES_KEY);
}
