import type { Box } from "../types";

export function intersects(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
}

export function area(box: Box): number {
  return Math.max(0, box.width) * Math.max(0, box.height);
}

export function intersectionArea(a: Box, b: Box): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  return area({ x: x1, y: y1, width: x2 - x1, height: y2 - y1 });
}

export function expandBox(box: Box, amountX: number, amountY = amountX): Box {
  return {
    x: box.x - amountX,
    y: box.y - amountY,
    width: box.width + amountX * 2,
    height: box.height + amountY * 2
  };
}

export function center(box: Box): { x: number; y: number } {
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}
