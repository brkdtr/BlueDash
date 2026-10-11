import type { BlueMark, Box, MarkKind } from "../types";

interface Component {
  pixels: number;
  box: Box;
  fillRatio: number;
}

export function isBluePixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const saturation = max === 0 ? 0 : (max - min) / max;
  return b > 85 && b > r * 1.18 && b > g * 1.08 && saturation > 0.22;
}

export function classifyMark(box: Box, pixels: number): MarkKind {
  const aspect = box.width / Math.max(1, box.height);
  const fill = pixels / Math.max(1, box.width * box.height);
  if (aspect > 3.2 && box.height < 32) return "underline";
  if (aspect > 0.65 && aspect < 1.9 && fill < 0.45) return "circle";
  if (fill >= 0.22 || box.height >= 32) return "scribble";
  return "unknown";
}

export function detectBlueMarksFromImageData(image: ImageData, pageId: string): BlueMark[] {
  const { width, height, data } = image;
  const mask = new Uint8Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4;
      if (isBluePixel(data[i], data[i + 1], data[i + 2])) mask[y * width + x] = 1;
    }
  }

  const visited = new Uint8Array(width * height);
  const components: Component[] = [];
  const queue: number[] = [];
  for (let start = 0; start < mask.length; start += 1) {
    if (!mask[start] || visited[start]) continue;
    let minX = width;
    let minY = height;
    let maxX = 0;
    let maxY = 0;
    let pixels = 0;
    visited[start] = 1;
    queue.push(start);
    while (queue.length) {
      const current = queue.pop()!;
      const x = current % width;
      const y = Math.floor(current / width);
      pixels += 1;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      const neighbors = [current - 1, current + 1, current - width, current + width];
      for (const next of neighbors) {
        if (next < 0 || next >= mask.length || visited[next] || !mask[next]) continue;
        const nx = next % width;
        if (Math.abs(nx - x) > 1) continue;
        visited[next] = 1;
        queue.push(next);
      }
    }
    const box = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
    if (pixels >= 18 && box.width >= 6 && box.height >= 3) {
      components.push({ pixels, box, fillRatio: pixels / Math.max(1, box.width * box.height) });
    }
  }

  return components.map((component, index) => ({
    id: `${pageId}-mark-${index}`,
    pageId,
    box: component.box,
    kind: classifyMark(component.box, component.pixels),
    score: Math.min(1, component.fillRatio * 2.5)
  }));
}
