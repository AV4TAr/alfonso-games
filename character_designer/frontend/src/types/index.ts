export type Tool = 'pencil' | 'eraser' | 'fill' | 'eyedropper';

export interface PixelGrid {
  data: (string | null)[][];
  size: number;
}

export interface DesignerState {
  currentTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  gridSize: number;
  pixelData: (string | null)[][];
  history: (string | null)[][][];
  historyIndex: number;
  isDrawing: boolean;
}
