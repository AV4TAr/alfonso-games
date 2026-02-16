// Character Designer - Pixel Art Tool
// 32x32 pixel grid editor

const GRID_SIZE = 32;
const PIXEL_SIZE = 16; // Canvas displays at 16x zoom (32*16=512px)

// State
let currentTool = 'pencil';
let primaryColor = '#000000';
let secondaryColor = '#ffffff';
let pixelData = createEmptyGrid();
let history = [];
let historyIndex = -1;
let isDrawing = false;
let characterLibrary = [];

// Canvas elements
const canvas = document.getElementById('pixel-canvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const preview1x = document.getElementById('preview-1x');
const preview2x = document.getElementById('preview-2x');
const preview4x = document.getElementById('preview-4x');

// Initialize
function init() {
    setupPresetColors();
    setupEventListeners();
    loadCharacterLibrary();
    render();
    updatePreviews();
    saveHistory();
}

// Create empty 32x32 grid
function createEmptyGrid() {
    const grid = [];
    for (let y = 0; y < GRID_SIZE; y++) {
        grid[y] = [];
        for (let x = 0; x < GRID_SIZE; x++) {
            grid[y][x] = null; // null = transparent
        }
    }
    return grid;
}

// Setup preset color palette
function setupPresetColors() {
    const presetColors = [
        '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
        '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088',
        '#888888', '#444444', '#cccccc', '#8b4513', '#2e8b57', '#4682b4',
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'
    ];

    const container = document.getElementById('preset-colors');
    presetColors.forEach(color => {
        const div = document.createElement('div');
        div.className = 'preset-color';
        div.style.background = color;
        div.title = color;
        div.addEventListener('click', () => {
            primaryColor = color;
            updateColorDisplays();
        });
        container.appendChild(div);
    });
}

// Setup all event listeners
function setupEventListeners() {
    // Canvas drawing
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);
    canvas.addEventListener('contextmenu', (e) => e.preventDefault());

    // Tool buttons
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentTool = btn.dataset.tool;
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Color picker
    document.getElementById('color-picker').addEventListener('input', (e) => {
        primaryColor = e.target.value;
        updateColorDisplays();
    });

    // Color boxes (swap primary/secondary)
    document.getElementById('primary-color').addEventListener('click', () => {
        [primaryColor, secondaryColor] = [secondaryColor, primaryColor];
        updateColorDisplays();
    });

    // Action buttons
    document.getElementById('clear-btn').addEventListener('click', clearCanvas);
    document.getElementById('save-btn').addEventListener('click', saveCharacter);
    document.getElementById('load-btn').addEventListener('click', showLoadDialog);
    document.getElementById('paste-btn').addEventListener('click', showPasteDialog);
    document.getElementById('export-btn').addEventListener('click', exportCharacter);
    document.getElementById('generate-btn').addEventListener('click', generateStarter);

    // Paste modal buttons
    document.getElementById('paste-import-btn').addEventListener('click', importFromPaste);
    document.getElementById('paste-cancel-btn').addEventListener('click', hidePasteDialog);

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboard);
}

// Handle keyboard shortcuts
function handleKeyboard(e) {
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
    } else if (e.key === 'p') {
        currentTool = 'pencil';
        updateToolButtons();
    } else if (e.key === 'e') {
        currentTool = 'eraser';
        updateToolButtons();
    } else if (e.key === 'f') {
        currentTool = 'fill';
        updateToolButtons();
    } else if (e.key === 'i') {
        currentTool = 'eyedropper';
        updateToolButtons();
    }
}

function updateToolButtons() {
    document.querySelectorAll('.tool-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === currentTool);
    });
}

// Mouse handlers
function handleMouseDown(e) {
    isDrawing = true;
    const pos = getPixelPosition(e);
    if (pos) {
        useTool(pos.x, pos.y, e.button === 2);
        saveHistory();
    }
}

function handleMouseMove(e) {
    const pos = getPixelPosition(e);
    if (pos) {
        document.getElementById('pixel-coords').textContent = `Pixel: ${pos.x}, ${pos.y}`;

        if (isDrawing && currentTool === 'pencil') {
            useTool(pos.x, pos.y, e.button === 2);
        }
    }
}

function handleMouseUp() {
    isDrawing = false;
}

// Get pixel position from mouse event
function getPixelPosition(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);

    if (x >= 0 && x < GRID_SIZE && y >= 0 && y < GRID_SIZE) {
        return { x, y };
    }
    return null;
}

// Use current tool
function useTool(x, y, useSecondary = false) {
    const color = useSecondary ? secondaryColor : primaryColor;

    switch (currentTool) {
        case 'pencil':
            pixelData[y][x] = color;
            break;
        case 'eraser':
            pixelData[y][x] = null;
            break;
        case 'fill':
            floodFill(x, y, color);
            break;
        case 'eyedropper':
            const pickedColor = pixelData[y][x];
            if (pickedColor) {
                primaryColor = pickedColor;
                updateColorDisplays();
            }
            return; // Don't render for eyedropper
    }

    render();
    updatePreviews();
}

// Flood fill algorithm
function floodFill(startX, startY, fillColor) {
    const targetColor = pixelData[startY][startX];

    if (targetColor === fillColor) return;

    const stack = [[startX, startY]];
    const visited = new Set();

    while (stack.length > 0) {
        const [x, y] = stack.pop();
        const key = `${x},${y}`;

        if (visited.has(key)) continue;
        if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) continue;
        if (pixelData[y][x] !== targetColor) continue;

        visited.add(key);
        pixelData[y][x] = fillColor;

        stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }
}

// Render canvas
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
        ctx.beginPath();
        ctx.moveTo(i * PIXEL_SIZE, 0);
        ctx.lineTo(i * PIXEL_SIZE, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * PIXEL_SIZE);
        ctx.lineTo(canvas.width, i * PIXEL_SIZE);
        ctx.stroke();
    }

    // Draw pixels
    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (pixelData[y][x]) {
                ctx.fillStyle = pixelData[y][x];
                ctx.fillRect(x * PIXEL_SIZE, y * PIXEL_SIZE, PIXEL_SIZE, PIXEL_SIZE);
            }
        }
    }
}

// Update preview canvases
function updatePreviews() {
    renderPreview(preview1x, 1);
    renderPreview(preview2x, 2);
    renderPreview(preview4x, 4);
}

function renderPreview(canvas, scale) {
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
            if (pixelData[y][x]) {
                ctx.fillStyle = pixelData[y][x];
                ctx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
    }
}

// History (undo/redo)
function saveHistory() {
    // Remove any future history if we're not at the end
    history = history.slice(0, historyIndex + 1);

    // Deep copy pixel data
    history.push(JSON.parse(JSON.stringify(pixelData)));
    historyIndex++;

    // Limit history to 50 steps
    if (history.length > 50) {
        history.shift();
        historyIndex--;
    }
}

function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        pixelData = JSON.parse(JSON.stringify(history[historyIndex]));
        render();
        updatePreviews();
    }
}

// Clear canvas
function clearCanvas() {
    if (confirm('Clear the entire canvas?')) {
        pixelData = createEmptyGrid();
        render();
        updatePreviews();
        saveHistory();
    }
}

// Save character
function saveCharacter() {
    const name = document.getElementById('char-name').value || 'Unnamed';
    const type = document.getElementById('char-type').value;
    const game = document.getElementById('char-game').value;

    // Generate version number
    const existing = characterLibrary.filter(c =>
        c.name === name && c.game === game
    );
    const version = existing.length + 1;

    const character = {
        name,
        type,
        game,
        version,
        pixelData: pixelData,
        created: new Date().toISOString(),
        gridSize: GRID_SIZE
    };

    characterLibrary.push(character);
    saveToLocalStorage();
    updateCharacterList();

    // Download as file
    downloadCharacter(character);

    alert(`Character saved as ${name}_v${version}!`);
}

// Download character as JSON file
function downloadCharacter(character) {
    const filename = `${character.game}/${character.name.toLowerCase().replace(/\s+/g, '_')}_v${character.version}.json`;
    const json = JSON.stringify(character, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename.split('/').pop();
    a.click();

    alert(`Download ${a.download} and save it to:\n${filename}`);
}

// Export character data
function exportCharacter() {
    const name = document.getElementById('char-name').value || 'Unnamed';
    const character = {
        name,
        gridSize: GRID_SIZE,
        pixelData: pixelData
    };

    const json = JSON.stringify(character, null, 2);

    // Copy to clipboard
    navigator.clipboard.writeText(json).then(() => {
        alert('Character JSON copied to clipboard!');
    });

    // Also show in console
    console.log('Character Data:', json);
}

// Load character
function showLoadDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const character = JSON.parse(event.target.result);
                loadCharacter(character);
            } catch (err) {
                alert('Error loading character: ' + err.message);
            }
        };
        reader.readAsText(file);
    };
    input.click();
}

function loadCharacter(character) {
    if (character.gridSize !== GRID_SIZE) {
        alert(`Warning: Character is ${character.gridSize}x${character.gridSize}, expected ${GRID_SIZE}x${GRID_SIZE}`);
        return;
    }

    pixelData = character.pixelData;
    document.getElementById('char-name').value = character.name || '';
    document.getElementById('char-type').value = character.type || 'player';
    document.getElementById('char-game').value = character.game || 'dragons_vs_warden';

    render();
    updatePreviews();
    saveHistory();
}

// Paste JSON dialog
function showPasteDialog() {
    document.getElementById('paste-modal').classList.remove('hidden');
    document.getElementById('json-input').value = '';
    document.getElementById('json-input').focus();
}

function hidePasteDialog() {
    document.getElementById('paste-modal').classList.add('hidden');
}

function importFromPaste() {
    const jsonText = document.getElementById('json-input').value.trim();

    if (!jsonText) {
        alert('Please paste JSON data first!');
        return;
    }

    try {
        const character = JSON.parse(jsonText);
        loadCharacter(character);
        hidePasteDialog();
        alert(`Character "${character.name}" loaded successfully!`);
    } catch (err) {
        alert('Error parsing JSON: ' + err.message + '\n\nMake sure you copied the entire JSON correctly.');
    }
}

// Generate starter character
function generateStarter() {
    const type = document.getElementById('char-type').value;

    switch (type) {
        case 'player':
            generateDragon();
            break;
        case 'enemy':
            generateWarden();
            break;
        case 'boss':
            generateSkeleton();
            break;
    }

    document.getElementById('char-name').value = `Generated ${type.charAt(0).toUpperCase() + type.slice(1)}`;
    render();
    updatePreviews();
    saveHistory();
}

// Generate simple dragon
function generateDragon() {
    pixelData = createEmptyGrid();

    const dragon = '#ff4757';
    const wing = '#ff6348';
    const eye = '#ffff00';

    // Head
    for (let x = 18; x < 24; x++) {
        for (let y = 12; y < 18; y++) {
            pixelData[y][x] = dragon;
        }
    }

    // Body
    for (let x = 14; x < 22; x++) {
        for (let y = 16; y < 22; y++) {
            pixelData[y][x] = dragon;
        }
    }

    // Wings
    for (let x = 8; x < 14; x++) {
        for (let y = 14; y < 20; y++) {
            pixelData[y][x] = wing;
        }
    }
    for (let x = 22; x < 28; x++) {
        for (let y = 14; y < 20; y++) {
            pixelData[y][x] = wing;
        }
    }

    // Eye
    pixelData[14][20] = eye;
    pixelData[14][21] = eye;

    // Tail
    for (let i = 0; i < 4; i++) {
        pixelData[22 + i][16 - i] = dragon;
    }
}

// Generate simple warden
function generateWarden() {
    pixelData = createEmptyGrid();

    const body = '#0a3d3d';
    const glow = '#00ffff';

    // Body
    for (let x = 14; x < 22; x++) {
        for (let y = 14; y < 24; y++) {
            pixelData[y][x] = body;
        }
    }

    // Head
    for (let x = 16; x < 20; x++) {
        for (let y = 10; y < 14; y++) {
            pixelData[y][x] = body;
        }
    }

    // Glowing horns
    pixelData[8][16] = glow;
    pixelData[9][16] = glow;
    pixelData[8][19] = glow;
    pixelData[9][19] = glow;

    // Arms
    for (let y = 16; y < 20; y++) {
        pixelData[y][12] = body;
        pixelData[y][23] = body;
    }
}

// Generate simple skeleton
function generateSkeleton() {
    pixelData = createEmptyGrid();

    const bone = '#ffffff';

    // Skull
    for (let x = 15; x < 21; x++) {
        for (let y = 10; y < 16; y++) {
            pixelData[y][x] = bone;
        }
    }

    // Eye sockets (black)
    pixelData[12][16] = '#000000';
    pixelData[12][17] = '#000000';
    pixelData[12][19] = '#000000';
    pixelData[12][20] = '#000000';

    // Spine
    for (let y = 16; y < 26; y++) {
        pixelData[y][18] = bone;
    }

    // Ribs
    for (let i = 0; i < 3; i++) {
        const y = 18 + i * 2;
        for (let x = 15; x < 22; x++) {
            if (x !== 18) pixelData[y][x] = bone;
        }
    }

    // Arms
    for (let y = 18; y < 22; y++) {
        pixelData[y][14] = bone;
        pixelData[y][22] = bone;
    }

    // Legs
    for (let y = 26; y < 30; y++) {
        pixelData[y][16] = bone;
        pixelData[y][20] = bone;
    }
}

// Update color displays
function updateColorDisplays() {
    document.getElementById('primary-color').style.background = primaryColor;
    document.getElementById('secondary-color').style.background = secondaryColor;
    document.getElementById('color-picker').value = primaryColor;
}

// Character library management
function saveToLocalStorage() {
    localStorage.setItem('characterLibrary', JSON.stringify(characterLibrary));
}

function loadCharacterLibrary() {
    const saved = localStorage.getItem('characterLibrary');
    if (saved) {
        characterLibrary = JSON.parse(saved);
        updateCharacterList();
    }
}

function updateCharacterList() {
    const container = document.getElementById('character-list');
    container.innerHTML = '';

    if (characterLibrary.length === 0) {
        container.innerHTML = '<p class="placeholder">No characters loaded yet.<br>Save a character to see it here!</p>';
        return;
    }

    characterLibrary.forEach((char, index) => {
        const item = document.createElement('div');
        item.className = 'character-item';

        const canvas = document.createElement('canvas');
        canvas.width = 48;
        canvas.height = 48;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = false;

        // Render character preview
        for (let y = 0; y < GRID_SIZE; y++) {
            for (let x = 0; x < GRID_SIZE; x++) {
                if (char.pixelData[y][x]) {
                    ctx.fillStyle = char.pixelData[y][x];
                    ctx.fillRect(x * 1.5, y * 1.5, 1.5, 1.5);
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

// Initialize app
init();
