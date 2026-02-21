// Drawing tools module
// Handles pencil, eraser, fill bucket, and eyedropper tools

import type { Tool } from '../types';
import { getGridSize } from './canvas';

/**
 * Use the current tool on a pixel
 * @returns The new color (for eyedropper) or undefined
 */
export function useTool(
  tool: Tool,
  x: number,
  y: number,
  pixelData: (string | null)[][],
  color: string
): string | undefined {
  switch (tool) {
    case 'pencil':
      pixelData[y][x] = color;
      break;

    case 'eraser':
      pixelData[y][x] = null;
      break;

    case 'fill':
      floodFill(x, y, pixelData, color);
      break;

    case 'eyedropper':
      const pickedColor = pixelData[y][x];
      return pickedColor || undefined;
  }

  return undefined;
}

/**
 * Flood fill algorithm
 */
export function floodFill(
  startX: number,
  startY: number,
  pixelData: (string | null)[][],
  fillColor: string
): void {
  const GRID_SIZE = getGridSize();
  const targetColor = pixelData[startY][startX];

  // If target color is the same as fill color, nothing to do
  if (targetColor === fillColor) return;

  const stack: [number, number][] = [[startX, startY]];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
    if (pixelData[y][x] !== targetColor) continue;

    visited.add(key);
    pixelData[y][x] = fillColor;

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }
}
