// Canvas rendering module
// Handles grid rendering, preview rendering, and pixel coordinate tracking

let gridSize = 32;

// Helper to resolve pixel value to color (supports both formats)
function resolvePixelColor(
  value: string | null | number,
  palette?: string[]
): string | null {
  // New palette format: number indices
  if (typeof value === 'number') {
    if (value === 0) return null; // 0 = transparent
    if (palette && palette[value - 1]) {
      return palette[value - 1]; // 1 = first color, 2 = second, etc.
    }
    return null; // Invalid index
  }
  // Old format: hex string or null
  return value;
}

interface CanvasElements {
  main: HTMLCanvasElement;
  mainCtx: CanvasRenderingContext2D;
  preview1x: HTMLCanvasElement;
  preview2x: HTMLCanvasElement;
  preview4x: HTMLCanvasElement;
}

let elements: CanvasElements | null = null;

/**
 * Initialize canvas elements
 */
export function initCanvas(): CanvasElements {
  const main = document.getElementById('pixel-canvas') as HTMLCanvasElement;
  const mainCtx = main.getContext('2d')!;
  mainCtx.imageSmoothingEnabled = false;

  const preview1x = document.getElementById('preview-1x') as HTMLCanvasElement;
  const preview2x = document.getElementById('preview-2x') as HTMLCanvasElement;
  const preview4x = document.getElementById('preview-4x') as HTMLCanvasElement;

  elements = { main, mainCtx, preview1x, preview2x, preview4x };
  return elements;
}

/**
 * Get canvas elements (must call initCanvas first)
 */
export function getCanvasElements(): CanvasElements {
  if (!elements) {
    throw new Error('Canvas not initialized. Call initCanvas() first.');
  }
  return elements;
}

/**
 * Set grid size (called when user changes size)
 */
export function setGridSize(size: number): void {
  gridSize = size;
}

/**
 * Get current grid size
 */
export function getGridSize(): number {
  return gridSize;
}

/**
 * Get pixel size (512px canvas / gridSize)
 */
export function getPixelSize(): number {
  return 512 / gridSize;
}

/**
 * Create empty grid of given size (defaults to current gridSize)
 */
export function createEmptyGrid(size?: number): (string | null)[][] {
  const sz = size ?? gridSize;
  const grid: (string | null)[][] = [];
  for (let y = 0; y < sz; y++) {
    grid[y] = [];
    for (let x = 0; x < sz; x++) {
      grid[y][x] = null; // null = transparent
    }
  }
  return grid;
}

/**
 * Get pixel position from mouse event
 */
export function getPixelPosition(
  e: MouseEvent,
  canvas: HTMLCanvasElement
): { x: number; y: number } | null {
  const pixelSize = getPixelSize();
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / pixelSize);
  const y = Math.floor((e.clientY - rect.top) / pixelSize);

  if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
    return { x, y };
  }
  return null;
}

/**
 * Render main canvas with grid and pixels
 */
export function render(pixelData: (string | null)[][] | number[][], palette?: string[]): void {
  const { mainCtx, main } = getCanvasElements();
  const pixelSize = getPixelSize();

  mainCtx.clearRect(0, 0, main.width, main.height);

  // Draw grid
  mainCtx.strokeStyle = '#e0e0e0';
  mainCtx.lineWidth = 1;
  for (let i = 0; i <= gridSize; i++) {
    mainCtx.beginPath();
    mainCtx.moveTo(i * pixelSize, 0);
    mainCtx.lineTo(i * pixelSize, main.height);
    mainCtx.stroke();

    mainCtx.beginPath();
    mainCtx.moveTo(0, i * pixelSize);
    mainCtx.lineTo(main.width, i * pixelSize);
    mainCtx.stroke();
  }

  // Draw pixels
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = resolvePixelColor(pixelData[y][x], palette);
      if (color) {
        mainCtx.fillStyle = color;
        mainCtx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
      }
    }
  }
}

/**
 * Render a preview canvas at specific scale
 */
function renderPreview(
  canvas: HTMLCanvasElement,
  pixelData: (string | null)[][] | number[][],
  scale: number,
  palette?: string[]
): void {
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const color = resolvePixelColor(pixelData[y][x], palette);
      if (color) {
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

/**
 * Update all preview canvases (dynamically sized based on gridSize)
 */
export function updatePreviews(pixelData: (string | null)[][] | number[][], palette?: string[]): void {
  const { preview1x, preview2x, preview4x } = getCanvasElements();

  // Set preview canvas dimensions dynamically, capped at 256px
  const sz = gridSize;
  preview1x.width = Math.min(sz * 1, 256);
  preview1x.height = Math.min(sz * 1, 256);
  preview2x.width = Math.min(sz * 2, 256);
  preview2x.height = Math.min(sz * 2, 256);
  preview4x.width = Math.min(sz * 4, 256);
  preview4x.height = Math.min(sz * 4, 256);

  renderPreview(preview1x, pixelData, 1, palette);
  renderPreview(preview2x, pixelData, 2, palette);
  renderPreview(preview4x, pixelData, 4, palette);
}
