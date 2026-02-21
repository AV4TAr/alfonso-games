// Main designer state and logic
// Handles state management, undo system, character save/load, library management

import type { Character, CharacterType } from '../../shared/types/character';
import type { DesignerState, Tool } from './types';
import { apiClient } from './api/client';
import {
  createEmptyGrid,
  render,
  updatePreviews,
  setGridSize as setCanvasGridSize,
} from './components/canvas';
import { useTool } from './components/tools';

// State
let state: DesignerState = {
  currentTool: 'pencil',
  primaryColor: '#000000',
  secondaryColor: '#ffffff',
  gridSize: 32,
  pixelData: createEmptyGrid(),
  history: [],
  historyIndex: -1,
  isDrawing: false,
};

let characterLibrary: Character[] = [];

/**
 * Get current designer state
 */
export function getState(): DesignerState {
  return state;
}

/**
 * Set current tool
 */
export function setTool(tool: Tool): void {
  state.currentTool = tool;
}

/**
 * Set primary color
 */
export function setPrimaryColor(color: string): void {
  state.primaryColor = color;
}

/**
 * Set secondary color
 */
export function setSecondaryColor(color: string): void {
  state.secondaryColor = color;
}

/**
 * Swap primary and secondary colors
 */
export function swapColors(): void {
  [state.primaryColor, state.secondaryColor] = [state.secondaryColor, state.primaryColor];
}

/**
 * Set drawing state
 */
export function setDrawing(drawing: boolean): void {
  state.isDrawing = drawing;
}

/**
 * Apply tool to pixel
 */
export function applyTool(x: number, y: number, useSecondary: boolean = false): void {
  const color = useSecondary ? state.secondaryColor : state.primaryColor;
  const pickedColor = useTool(state.currentTool, x, y, state.pixelData, color);

  // If eyedropper, update primary color
  if (pickedColor) {
    state.primaryColor = pickedColor;
  }
}

/**
 * Save current state to history
 */
export function saveHistory(): void {
  // Remove any future history if we're not at the end
  state.history = state.history.slice(0, state.historyIndex + 1);

  // Deep copy pixel data
  state.history.push(JSON.parse(JSON.stringify(state.pixelData)));
  state.historyIndex++;

  // Limit history to 50 steps
  if (state.history.length > 50) {
    state.history.shift();
    state.historyIndex--;
  }
}

/**
 * Undo last action
 */
export function undo(): void {
  if (state.historyIndex > 0) {
    state.historyIndex--;
    state.pixelData = JSON.parse(JSON.stringify(state.history[state.historyIndex]));
    render(state.pixelData);
    updatePreviews(state.pixelData);
  }
}

/**
 * Clear canvas
 */
export function clearCanvas(): boolean {
  if (confirm('Clear the entire canvas?')) {
    state.pixelData = createEmptyGrid();
    render(state.pixelData);
    updatePreviews(state.pixelData);
    saveHistory();
    return true;
  }
  return false;
}

/**
 * Change grid size — warns if canvas has content
 */
export function setGridSize(size: number): void {
  const hasContent = state.pixelData.some((row) => row.some((cell) => cell !== null));
  if (hasContent) {
    if (!confirm(`Changing grid size to ${size}×${size} will clear the canvas. Continue?`)) {
      return;
    }
  }

  state.gridSize = size;
  setCanvasGridSize(size);
  state.pixelData = createEmptyGrid(size);
  state.history = [];
  state.historyIndex = -1;
  render(state.pixelData);
  updatePreviews(state.pixelData);
  saveHistory();

  // Update canvas info label
  const zoomLevel = document.getElementById('zoom-level');
  const canvasTitle = document.querySelector('.canvas-container h3');
  if (zoomLevel) zoomLevel.textContent = `Zoom: ${512 / size}x`;
  if (canvasTitle) canvasTitle.textContent = `Canvas (${size}×${size})`;
}

/**
 * Save character to backend
 */
export async function saveCharacter(): Promise<void> {
  const nameInput = document.getElementById('char-name') as HTMLInputElement;
  const typeSelect = document.getElementById('char-type') as HTMLSelectElement;
  const gameInput = document.getElementById('char-game') as HTMLInputElement;

  const name = nameInput.value.trim() || 'Unnamed';
  const type = typeSelect.value as CharacterType;
  const game = gameInput.value.trim() || 'dragons_vs_warden';

  try {
    // Create character on backend
    const character: Omit<Character, 'id'> = {
      name,
      type,
      game,
      version: 1, // Backend will auto-increment
      pixelData: state.pixelData,
      created: new Date().toISOString(),
      gridSize: state.gridSize,
    };

    const savedCharacter = await apiClient.createCharacter(character);

    // Reload library
    await loadCharacterLibrary();

    // Download as file
    downloadCharacter(savedCharacter);

    alert(`Character saved as ${savedCharacter.name} v${savedCharacter.version}!`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    alert(`Failed to save character: ${errorMessage}`);
  }
}

/**
 * Download character as JSON file
 */
function downloadCharacter(character: Character): void {
  const filename = `${character.name.toLowerCase().replace(/\s+/g, '_')}_v${character.version}.json`;
  const json = JSON.stringify(character, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}

/**
 * Load character into canvas — auto-switches grid size to match character
 */
export function loadCharacter(character: Character): void {
  const charGridSize = character.gridSize || 32;

  // Auto-switch grid size to match the character (no rejection)
  if (charGridSize !== state.gridSize) {
    state.gridSize = charGridSize;
    setCanvasGridSize(charGridSize);

    // Update canvas info labels
    const zoomLevel = document.getElementById('zoom-level');
    const canvasTitle = document.querySelector('.canvas-container h3');
    if (zoomLevel) zoomLevel.textContent = `Zoom: ${512 / charGridSize}x`;
    if (canvasTitle) canvasTitle.textContent = `Canvas (${charGridSize}×${charGridSize})`;
  }

  state.pixelData = character.pixelData as (string | null)[][];

  // Update form fields
  const nameInput = document.getElementById('char-name') as HTMLInputElement;
  const typeSelect = document.getElementById('char-type') as HTMLSelectElement;
  const gameInput = document.getElementById('char-game') as HTMLInputElement;

  nameInput.value = character.name || '';
  typeSelect.value = character.type || 'player';
  gameInput.value = character.game || 'dragons_vs_warden';

  render(state.pixelData);
  updatePreviews(state.pixelData);
  saveHistory();
}

/**
 * Load character library from backend
 */
export async function loadCharacterLibrary(): Promise<void> {
  try {
    characterLibrary = await apiClient.getCharacters();
    updateCharacterList();
  } catch (error) {
    console.error('Failed to load character library:', error);
    // Show empty library with error message
    const container = document.getElementById('character-list');
    if (container) {
      container.innerHTML =
        '<p class="placeholder">Failed to load characters from server.<br>Make sure the backend is running.</p>';
    }
  }
}

/**
 * Update character list display
 */
function updateCharacterList(): void {
  const container = document.getElementById('character-list');
  if (!container) return;

  container.innerHTML = '';

  if (characterLibrary.length === 0) {
    container.innerHTML =
      '<p class="placeholder">No characters saved yet.<br>Save a character to see it here!</p>';
    return;
  }

  characterLibrary.forEach((char) => {
    const item = document.createElement('div');
    item.className = 'character-item';

    const canvas = document.createElement('canvas');
    canvas.width = 48;
    canvas.height = 48;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Render character preview using the character's own grid size
    const charSize = char.gridSize || 32;
    const scale = 48 / charSize;
    for (let y = 0; y < charSize; y++) {
      for (let x = 0; x < charSize; x++) {
        const cell = char.pixelData[y][x];
        // Support both hex string format and palette index format
        if (typeof cell === 'string' && cell) {
          ctx.fillStyle = cell;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        } else if (typeof cell === 'number' && cell > 0 && char.palette) {
          const color = char.palette[cell - 1];
          if (color) {
            ctx.fillStyle = color;
            ctx.fillRect(x * scale, y * scale, scale, scale);
          }
        }
      }
    }

    const info = document.createElement('div');
    info.className = 'character-item-info';
    info.innerHTML = `
      <div class="character-item-name">${char.name} v${char.version}</div>
      <div class="character-item-meta">${char.type} • ${char.game}</div>
    `;

    item.appendChild(canvas);
    item.appendChild(info);
    item.addEventListener('click', () => loadCharacter(char));

    container.appendChild(item);
  });
}

/**
 * Export character JSON to clipboard
 */
export function exportJSON(): void {
  const nameInput = document.getElementById('char-name') as HTMLInputElement;
  const name = nameInput.value.trim() || 'Unnamed';

  const character = {
    name,
    gridSize: state.gridSize,
    pixelData: state.pixelData,
  };

  const json = JSON.stringify(character, null, 2);

  // Copy to clipboard
  navigator.clipboard.writeText(json).then(() => {
    alert('Character JSON copied to clipboard!');
  });

  // Also show in console
  console.log('Character Data:', json);
}

/**
 * Import character from JSON
 */
export function importJSON(jsonText: string): void {
  try {
    const character = JSON.parse(jsonText);
    loadCharacter(character);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid JSON';
    throw new Error(`Failed to parse JSON: ${errorMessage}`);
  }
}

/**
 * Get character library
 */
export function getCharacterLibrary(): Character[] {
  return characterLibrary;
}
