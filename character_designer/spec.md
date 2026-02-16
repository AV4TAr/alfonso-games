# Character Designer - Technical Specification

## Overview

A browser-based pixel art editor for creating 32x32 character sprites for Alfonso's game collection.

## Technical Stack

- **HTML5 Canvas** - Drawing and preview
- **Vanilla JavaScript** - All functionality (no dependencies)
- **CSS3 Grid** - Layout
- **LocalStorage** - Character library persistence

## Grid Specifications

### Main Canvas
- Size: 32x32 pixels (character grid)
- Display: 512x512 pixels (16x zoom)
- Rendering: `ctx.imageSmoothingEnabled = false` (crisp pixels)

### Pixel Data Structure
```javascript
pixelData = [
  [null, '#ff0000', null, ...],  // Row 0 (32 columns)
  [null, null, '#00ff00', ...],  // Row 1
  ...                             // 32 rows total
]
```
- 2D array: `pixelData[y][x]`
- Values: Hex color string or `null` (transparent)

## Tools

### 1. Pencil
- **Shortcut**: P
- **Function**: Set pixel to primary/secondary color
- **Behavior**: Continuous drawing when mouse held
- **Left click**: Primary color
- **Right click**: Secondary color

### 2. Eraser
- **Shortcut**: E
- **Function**: Set pixel to `null` (transparent)
- **Behavior**: Removes pixel color

### 3. Fill Bucket
- **Shortcut**: F
- **Function**: Flood fill connected pixels
- **Algorithm**: Stack-based flood fill
```javascript
floodFill(startX, startY, fillColor) {
  // Fills all connected pixels of same color
  // Uses 4-directional connectivity
  // Iterative (no recursion)
}
```

### 4. Eyedropper
- **Shortcut**: I
- **Function**: Pick color from pixel
- **Sets**: Primary color to selected pixel color
- **Ignores**: Transparent pixels

## Color System

### Primary & Secondary Colors
- **Primary**: Left click / main color
- **Secondary**: Right click / alternate color
- **Swap**: Click color display boxes

### Preset Palette
24 preset colors:
```javascript
presetColors = [
  '#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff', '#ffff00',
  '#ff00ff', '#00ffff', '#ff8800', '#8800ff', '#00ff88', '#ff0088',
  '#888888', '#444444', '#cccccc', '#8b4513', '#2e8b57', '#4682b4',
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#ffeaa7', '#dfe6e9'
]
```

### Custom Color
- HTML5 color picker input
- Any hex color supported
- Updates primary color

## History System (Undo)

### Implementation
```javascript
history = [grid1, grid2, grid3, ...]
historyIndex = 2  // Current position
```

### Behavior
- **Limit**: 50 steps
- **Storage**: Deep copy of pixel data (JSON.parse/stringify)
- **Undo**: `Ctrl+Z` or programmatic
- **Save points**: After each tool action

### Edge Cases
- Can't undo past first state
- New actions clear future history
- Old history pruned when limit reached

## Preview System

### Three Preview Canvases
1. **1x** - 32x32px (actual size)
2. **2x** - 64x64px (double size)
3. **4x** - 128x128px (quad size)

### Rendering
```javascript
renderPreview(canvas, scale) {
  // Render each pixel at scale factor
  // pixelData[y][x] → rect(x*scale, y*scale, scale, scale)
}
```

### Update Trigger
- After every pixel change
- After load/generate
- After undo

## Character Data Format

### JSON Structure
```json
{
  "name": "Dragon",
  "type": "player",
  "game": "dragons_vs_warden",
  "version": 1,
  "created": "2024-02-16T12:30:00.000Z",
  "gridSize": 32,
  "pixelData": [
    [null, null, "#ff0000", ...],
    ...
  ]
}
```

### Character Types
- `player` - Player-controlled characters
- `enemy` - Regular enemies
- `boss` - Boss enemies

### Version Control
- Auto-increments for same name + game
- Format: `character_name_v1.json`, `v2.json`, etc.
- Prevents overwriting

## Save/Load System

### Save Flow
1. User fills character info (name, type, game)
2. Click "Save Character"
3. Generate version number
4. Create JSON object
5. Download as file
6. Add to library (localStorage)
7. Update UI list

### Download
```javascript
downloadCharacter(character) {
  // Creates blob from JSON
  // Triggers browser download
  // Filename: [name]_v[version].json
}
```

### Load Flow
1. User clicks "Load Character"
2. File input opens
3. User selects .json file
4. Parse JSON
5. Validate grid size
6. Load pixel data
7. Update editor

### File Organization
```
[game_name]/characters/
├── player_dragon_v1.json
├── player_dragon_v2.json
├── enemy_warden_v1.json
├── boss_skeleton_v1.json
└── ...
```

## Character Library

### Storage
- **Method**: Browser localStorage
- **Key**: `characterLibrary`
- **Format**: JSON array of characters

### Features
- Persists between sessions
- Click to load into editor
- Shows thumbnail preview
- Displays name, version, type, game

### Thumbnail Rendering
```javascript
// Renders 48x48 preview
// Scale: 1.5x (32 * 1.5 = 48)
for (let y = 0; y < 32; y++) {
  for (let x = 0; x < 32; x++) {
    ctx.fillRect(x * 1.5, y * 1.5, 1.5, 1.5);
  }
}
```

## Generate Starter Characters

### Dragon (Player)
- Red/orange dragon sprite
- Wings on sides
- Yellow eyes
- Tail

### Warden (Enemy)
- Teal body
- Cyan glowing horns
- Simple humanoid shape
- Arms extended

### Skeleton (Boss)
- White bones
- Skull with eye sockets
- Ribcage visible
- Spine, arms, legs

### Algorithm
```javascript
generateDragon() {
  // Hardcoded pixel coordinates
  // Creates simple but recognizable sprite
  // Uses themed colors
}
```

## Export System

### JSON Export
- Copies to clipboard
- Logs to console
- Minimal format (name, gridSize, pixelData)
- For programmatic use

### File Download
- Full metadata included
- Versioned filename
- Ready for game integration

## UI Layout

### Three-Column Grid
```css
grid-template-columns: 280px 1fr 300px;
```

1. **Left Panel** (280px)
   - Tools
   - Color palette
   - Character info
   - Actions

2. **Center Panel** (flexible)
   - Main canvas
   - Coordinate display
   - Zoom level

3. **Right Panel** (300px)
   - Preview windows
   - Character library
   - Help text

### Responsive
- Collapses to single column on small screens
- Panels become side-by-side rows

## Event Handling

### Mouse Events
```javascript
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);
canvas.addEventListener('mouseleave', handleMouseUp);
canvas.addEventListener('contextmenu', e => e.preventDefault());
```

### Drawing State
```javascript
isDrawing = false  // Track if mouse is pressed
// Prevents drawing when just moving mouse
```

### Right Click
- Prevented default context menu
- Uses secondary color
- Works with all tools

## Pixel Position Calculation

```javascript
getPixelPosition(e) {
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) / PIXEL_SIZE);
  const y = Math.floor((e.clientY - rect.top) / PIXEL_SIZE);
  // PIXEL_SIZE = 16 (zoom level)
  // Returns { x, y } or null if out of bounds
}
```

## Performance Considerations

### Render Optimization
- Only re-render on changes
- Separate preview updates
- No continuous rendering (no requestAnimationFrame loop)

### Memory
- History limited to 50 states
- Each state: ~1KB (32x32x color string)
- Total history: ~50KB max

### LocalStorage
- No size limit enforced
- Characters: ~5KB each
- Typical capacity: 100+ characters

## Browser Compatibility

**Target**: Google Chrome (latest)

**Required APIs**:
- Canvas 2D
- File API (FileReader)
- Clipboard API (navigator.clipboard)
- LocalStorage
- CSS Grid

## Integration with Games

### Loading Character in Game
```javascript
// Load JSON file
fetch('characters/dragon_v1.json')
  .then(r => r.json())
  .then(char => {
    // Render character
    renderCharacter(ctx, char.pixelData, x, y, scale);
  });

function renderCharacter(ctx, pixelData, x, y, scale) {
  for (let py = 0; py < 32; py++) {
    for (let px = 0; px < 32; px++) {
      if (pixelData[py][px]) {
        ctx.fillStyle = pixelData[py][px];
        ctx.fillRect(
          x + px * scale,
          y + py * scale,
          scale, scale
        );
      }
    }
  }
}
```

## Future Enhancements (Not Implemented)

- Animation frames
- Layer system
- Copy/paste regions
- Flip/rotate tools
- Onion skinning (for animation)
- Export as PNG
- Import from PNG
- Collaborative editing

## File Structure

```
character_designer/
├── index.html       # UI structure
├── style.css        # Styling (grid layout)
├── designer.js      # All functionality (~700 lines)
├── README.md        # User guide
└── spec.md          # This file
```

---

## Credits

- **Created for**: Alfonso's Games
- **Developer**: Claude Code
- **Version**: 1.0.0
- **Date**: February 2024
