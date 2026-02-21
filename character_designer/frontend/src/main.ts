// Main entry point for Character Designer
// Initializes the designer and sets up all event listeners

import '../style.css';
import {
  initCanvas,
  getCanvasElements,
  getPixelPosition,
  render,
  updatePreviews,
} from './components/canvas';
import { initAIChat, showAIChat, updateGridSizeBadge } from './components/ai-chat';
import {
  getState,
  setTool,
  setPrimaryColor,
  swapColors,
  setDrawing,
  applyTool,
  saveHistory,
  undo,
  clearCanvas,
  saveCharacter,
  loadCharacter,
  loadCharacterLibrary,
  exportJSON,
  importJSON,
  setGridSize,
} from './designer';

/**
 * Setup preset color palette
 */
function setupPresetColors(): void {
  const presetColors = [
    '#000000',
    '#ffffff',
    '#ff0000',
    '#00ff00',
    '#0000ff',
    '#ffff00',
    '#ff00ff',
    '#00ffff',
    '#ff8800',
    '#8800ff',
    '#00ff88',
    '#ff0088',
    '#888888',
    '#444444',
    '#cccccc',
    '#8b4513',
    '#2e8b57',
    '#4682b4',
    '#ff6b6b',
    '#4ecdc4',
    '#45b7d1',
    '#96ceb4',
    '#ffeaa7',
    '#dfe6e9',
  ];

  const container = document.getElementById('preset-colors');
  if (!container) return;

  presetColors.forEach((color) => {
    const div = document.createElement('div');
    div.className = 'preset-color';
    div.style.background = color;
    div.title = color;
    div.addEventListener('click', () => {
      setPrimaryColor(color);
      updateColorDisplays();
    });
    container.appendChild(div);
  });
}

/**
 * Sync grid size buttons to match current state
 */
function syncGridSizeButtons(): void {
  const state = getState();
  document.querySelectorAll('.grid-btn').forEach((btn) => {
    const size = parseInt((btn as HTMLElement).dataset.size || '32', 10);
    btn.classList.toggle('active', size === state.gridSize);
  });

  // Update preview labels
  const sz = state.gridSize;
  const label1x = document.getElementById('preview-label-1x');
  const label2x = document.getElementById('preview-label-2x');
  const label4x = document.getElementById('preview-label-4x');
  if (label1x) label1x.textContent = `1x (${sz * 1}px)`;
  if (label2x) label2x.textContent = `2x (${Math.min(sz * 2, 256)}px)`;
  if (label4x) label4x.textContent = `4x (${Math.min(sz * 4, 256)}px)`;
}

/**
 * Setup grid size selector buttons
 */
function setupGridSizeButtons(): void {
  document.querySelectorAll('.grid-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const size = parseInt((btn as HTMLElement).dataset.size || '32', 10);
      setGridSize(size);
      syncGridSizeButtons();
      updateGridSizeBadge();
    });
  });
}

/**
 * Update color display elements
 */
function updateColorDisplays(): void {
  const state = getState();
  const primaryDiv = document.getElementById('primary-color');
  const secondaryDiv = document.getElementById('secondary-color');
  const colorPicker = document.getElementById('color-picker') as HTMLInputElement;

  if (primaryDiv) primaryDiv.style.background = state.primaryColor;
  if (secondaryDiv) secondaryDiv.style.background = state.secondaryColor;
  if (colorPicker) colorPicker.value = state.primaryColor;
}

/**
 * Update tool button active states
 */
function updateToolButtons(): void {
  const state = getState();
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.classList.toggle('active', (btn as HTMLElement).dataset.tool === state.currentTool);
  });
}

/**
 * Handle keyboard shortcuts
 */
function handleKeyboard(e: KeyboardEvent): void {
  // Ignore if typing in input fields
  if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
    return;
  }

  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    undo();
  } else if (e.key === 'p') {
    setTool('pencil');
    updateToolButtons();
  } else if (e.key === 'e') {
    setTool('eraser');
    updateToolButtons();
  } else if (e.key === 'f') {
    setTool('fill');
    updateToolButtons();
  } else if (e.key === 'i') {
    setTool('eyedropper');
    updateToolButtons();
  }
}

/**
 * Setup canvas event listeners
 */
function setupCanvasEvents(): void {
  const { main } = getCanvasElements();
  const state = getState();

  main.addEventListener('mousedown', (e: MouseEvent) => {
    setDrawing(true);
    const pos = getPixelPosition(e, main);
    if (pos) {
      applyTool(pos.x, pos.y, e.button === 2);
      render(state.pixelData);
      updatePreviews(state.pixelData);
      saveHistory();
    }
  });

  main.addEventListener('mousemove', (e: MouseEvent) => {
    const pos = getPixelPosition(e, main);
    if (pos) {
      const coordsDisplay = document.getElementById('pixel-coords');
      if (coordsDisplay) {
        coordsDisplay.textContent = `Pixel: ${pos.x}, ${pos.y}`;
      }

      const currentState = getState();
      if (currentState.isDrawing && currentState.currentTool === 'pencil') {
        applyTool(pos.x, pos.y, e.button === 2);
        render(currentState.pixelData);
        updatePreviews(currentState.pixelData);
      }
    }
  });

  main.addEventListener('mouseup', () => {
    setDrawing(false);
  });

  main.addEventListener('mouseleave', () => {
    setDrawing(false);
  });

  main.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
}

/**
 * Setup tool button events
 */
function setupToolButtons(): void {
  document.querySelectorAll('.tool-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const tool = (btn as HTMLElement).dataset.tool;
      if (tool) {
        setTool(tool as any);
        updateToolButtons();
      }
    });
  });
}

/**
 * Setup color picker events
 */
function setupColorPicker(): void {
  const colorPicker = document.getElementById('color-picker') as HTMLInputElement;
  colorPicker?.addEventListener('input', (e) => {
    setPrimaryColor((e.target as HTMLInputElement).value);
    updateColorDisplays();
  });

  const primaryDiv = document.getElementById('primary-color');
  primaryDiv?.addEventListener('click', () => {
    swapColors();
    updateColorDisplays();
  });
}

/**
 * Setup action buttons
 */
function setupActionButtons(): void {
  document.getElementById('clear-btn')?.addEventListener('click', clearCanvas);
  document.getElementById('save-btn')?.addEventListener('click', saveCharacter);
  document.getElementById('load-btn')?.addEventListener('click', showLoadDialog);
  document.getElementById('paste-btn')?.addEventListener('click', showPasteDialog);
  document.getElementById('export-btn')?.addEventListener('click', exportJSON);
  document.getElementById('ai-generate-btn')?.addEventListener('click', showAIChat);
  document.getElementById('show-prompt-btn')?.addEventListener('click', showPromptDialog);
}

/**
 * Show load character dialog
 */
function showLoadDialog(): void {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const character = JSON.parse(event.target?.result as string);
        loadCharacter(character);
        syncGridSizeButtons();
        alert(`Character "${character.name}" loaded successfully!`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        alert(`Error loading character: ${errorMessage}`);
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

/**
 * Show paste JSON dialog
 */
function showPasteDialog(): void {
  const modal = document.getElementById('paste-modal');
  const input = document.getElementById('json-input') as HTMLTextAreaElement;

  modal?.classList.remove('hidden');
  if (input) {
    input.value = '';
    input.focus();
  }
}

/**
 * Hide paste JSON dialog
 */
function hidePasteDialog(): void {
  document.getElementById('paste-modal')?.classList.add('hidden');
}

/**
 * Import from paste dialog
 */
function importFromPaste(): void {
  const input = document.getElementById('json-input') as HTMLTextAreaElement;
  const jsonText = input?.value.trim();

  if (!jsonText) {
    alert('Please paste JSON data first!');
    return;
  }

  try {
    importJSON(jsonText);
    syncGridSizeButtons();
    hidePasteDialog();
    const character = JSON.parse(jsonText);
    alert(`Character "${character.name}" loaded successfully!`);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    alert(`Error parsing JSON: ${errorMessage}\n\nMake sure you copied the entire JSON correctly.`);
  }
}

/**
 * Setup paste modal buttons
 */
function setupPasteModal(): void {
  document.getElementById('paste-import-btn')?.addEventListener('click', importFromPaste);
  document.getElementById('paste-cancel-btn')?.addEventListener('click', hidePasteDialog);
}

/**
 * Show AI prompt dialog
 */
async function showPromptDialog(): Promise<void> {
  const modal = document.getElementById('prompt-modal');
  const textarea = document.getElementById('prompt-text') as HTMLTextAreaElement;

  modal?.classList.remove('hidden');

  // Load the prompt from backend
  try {
    const response = await fetch('http://localhost:5174/api/ai/prompt');
    const data = await response.json();

    if (data.prompt && textarea) {
      textarea.value = data.prompt;
    }
  } catch (error) {
    console.error('Failed to load prompt:', error);
    if (textarea) {
      textarea.value = 'Error loading prompt. Please try again.';
    }
  }
}

/**
 * Hide AI prompt dialog
 */
function hidePromptDialog(): void {
  document.getElementById('prompt-modal')?.classList.add('hidden');
  // Hide copy feedback
  document.getElementById('copy-feedback')?.classList.add('hidden');
}

/**
 * Copy prompt to clipboard
 */
async function copyPromptToClipboard(): Promise<void> {
  const textarea = document.getElementById('prompt-text') as HTMLTextAreaElement;
  const feedback = document.getElementById('copy-feedback');

  if (!textarea) return;

  try {
    await navigator.clipboard.writeText(textarea.value);

    // Show feedback
    feedback?.classList.remove('hidden');
    setTimeout(() => {
      feedback?.classList.add('hidden');
    }, 2000);
  } catch (error) {
    console.error('Failed to copy:', error);
    alert('Failed to copy to clipboard. Please select and copy manually.');
  }
}

/**
 * Setup prompt modal buttons
 */
function setupPromptModal(): void {
  document.getElementById('copy-prompt-btn')?.addEventListener('click', copyPromptToClipboard);
  document.getElementById('prompt-cancel-btn')?.addEventListener('click', hidePromptDialog);
  document.getElementById('prompt-close-btn')?.addEventListener('click', hidePromptDialog);
}

/**
 * Initialize the designer
 */
async function init(): Promise<void> {
  // Initialize canvas
  initCanvas();

  // Initialize AI chat
  initAIChat((character) => {
    loadCharacter(character);
    syncGridSizeButtons();
  });

  // Setup UI
  setupPresetColors();
  setupGridSizeButtons();
  setupCanvasEvents();
  setupToolButtons();
  setupColorPicker();
  setupActionButtons();
  setupPasteModal();
  setupPromptModal();

  // Setup keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);

  // Initial render
  const state = getState();
  render(state.pixelData);
  updatePreviews(state.pixelData);
  saveHistory();

  // Update displays
  updateColorDisplays();
  updateToolButtons();
  syncGridSizeButtons();

  // Load character library
  await loadCharacterLibrary();
}

// Start the app
init().catch((error) => {
  console.error('Failed to initialize designer:', error);
  alert('Failed to initialize Character Designer. Check console for details.');
});
