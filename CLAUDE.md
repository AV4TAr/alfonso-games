# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**"fonchi"** - Alfonso's Educational Game Collection

This repository contains multiple educational games built by Alfonso (9 years old) with help from Claude Code. Each game is a standalone HTML5 Canvas game, fully frontend, designed to run in Chrome browser.

### Repository Structure
```
fonchi/
├── CLAUDE.md                    # This file
├── character_designer/          # Pixel art tool for creating sprites
│   ├── index.html
│   ├── style.css
│   ├── designer.js
│   └── characters/              # Saved character JSON files
├── dragons_vs_warden/           # Game 1: Dragon vs Wardens
│   ├── index.html
│   ├── style.css
│   ├── game.js
│   └── characters/              # Character sprites for this game
└── [future_game_folders]/       # More games will be added here
    └── characters/              # Each game has its own characters folder
```

**Important**: Each game lives in its own folder. Future games should follow the same structure (index.html, style.css, game.js, characters/).

### Current Games

#### 1. Dragons vs Wardens (`/dragons_vs_warden/`)
A two-level action game where you control a dragon fighting wardens and enemy dragons.

**How to Run:**
```bash
open -a "Google Chrome" /Users/dsapriza/dev/fonchi/dragons_vs_warden/index.html
```

**Game Features:**
- **Level 1**: Fight 5 wardens, then Boss Warden (with crown, spits fire)
- **Level 2**: Fight 5 enemy dragons, then Dragon Boss (purple, with crown, shoots 3 fireballs)
- Continue system with math questions (see below)
- Power-ups every 30 seconds
- Sound effects and particle effects
- Dark theme with glowing effects

**Controls:**
- Arrow keys: Move dragon
- Spacebar: Shoot fireballs
- P: Invisibility power (with cooldown)

### Development Tools

#### Character Designer (`/character_designer/`)
A pixel art editor for creating 32x32 character sprites for games.

**How to Run:**
```bash
open -a "Google Chrome" /Users/dsapriza/dev/fonchi/character_designer/index.html
```

**AI Generation Prompt:**
- Full prompt available at: `character_designer/docs/ai-generation-prompt.md`
- Use with Claude/ChatGPT to generate character JSON files
- Prompt ensures compatibility with Character Designer format

**Key Features:**
- 32x32 pixel grid with 16x zoom
- Tools: Pencil (P), Eraser (E), Fill (F), Eyedropper (I)
- Primary/Secondary color system (left/right click)
- Undo system (Ctrl+Z)
- Character library in localStorage
- JSON export/import
- Version control (v1, v2, v3...)
- Three preview sizes (1x, 2x, 4x)

**Workflow:**
1. Draw character on 32x32 grid
2. Save with name, type (player/enemy/boss), and game name
3. File downloads as `[name]_v[#].json`
4. Manually move JSON to `[game_name]/characters/` folder
5. Load in game using character rendering code (see below)

**Character JSON Format:**
```javascript
{
  "name": "Red Dragon",
  "type": "player",
  "game": "dragons_vs_warden",
  "version": 1,
  "gridSize": 32,
  "pixelData": [
    [null, "#ff0000", "#ff0000", ...],  // 32x32 grid
    [null, null, "#8b0000", ...],       // null = transparent
    ...                                  // hex colors for pixels
  ]
}
```

**Integrating Characters into Games:**
```javascript
// Load character JSON file
function loadCharacter(path) {
  return fetch(path).then(r => r.json());
}

// Render character on canvas
function renderCharacter(ctx, pixelData, x, y, scale = 1) {
  const gridSize = pixelData.length;
  for (let py = 0; py < gridSize; py++) {
    for (let px = 0; px < gridSize; px++) {
      const color = pixelData[py][px];
      if (color) {  // Skip null (transparent)
        ctx.fillStyle = color;
        ctx.fillRect(x + px * scale, y + py * scale, scale, scale);
      }
    }
  }
}

// Example usage in game
loadCharacter('characters/red_dragon_v1.json').then(char => {
  // Store character data
  playerSprite = char.pixelData;

  // In draw loop
  renderCharacter(ctx, playerSprite, player.x, player.y, 2);
});
```

## CRITICAL PATTERN: Continue System (Reuse in ALL Games)

**This is a key educational feature that should be used in all future games.**

### How It Works
When player dies (`lives <= 0`):
1. Instead of immediate game over, show a challenge question
2. Player has **3 attempts** to answer correctly
3. **Correct answer** = restore health + continue from same level
4. **Wrong answer** = try again with new question, decrement attempts
5. After 3 failed attempts = game over

### Current Implementation: Math Questions

**Age Level**: 9 years old

**Question Types:**
- **Addition**: 1-50 + 1-50 (e.g., "23 + 17")
- **Subtraction**: Positive results only (e.g., "45 - 12")
- **Multiplication**: Up to 12×12 (e.g., "7 × 8")

### Code Structure

**State Variables:**
```javascript
let continueAttempts = 3;
let currentMathQuestion = null;  // { question: "7 × 8", answer: 56 }
```

**Key Functions:**
```javascript
function generateMathQuestion() {
  // Returns: { question: string, answer: number }
  // Generates age-appropriate math problems
}

function showMathQuestion() {
  // Display question UI, reset input
}

function checkMathAnswer() {
  // Validate answer
  // Handle correct: restore health, continue game
  // Handle wrong: decrement attempts, new question
  // Handle no attempts: game over
}

function continueGame() {
  // Restore player health
  // Resume game loop
  // Reset continueAttempts to 3
}
```

**HTML Structure:**
```html
<div id="math-question" class="hidden">
  <h1>Continue? 🧮</h1>
  <p>Solve this math problem to restore your health!</p>
  <div id="math-problem-display">
    <span id="math-problem">5 + 3</span> = ?
  </div>
  <input type="number" id="math-answer" placeholder="Your answer">
  <button onclick="checkMathAnswer()">Submit Answer</button>
  <p id="math-feedback"></p>
  <p>Attempts left: <span id="math-attempts">3</span></p>
</div>
```

### Future Expansion Ideas

The continue system can be expanded to different question types:
- **Spelling**: Type the correct spelling of a word
- **Reading comprehension**: Short paragraph + question
- **Science**: Simple science facts (planets, animals, etc.)
- **History**: Historical events, dates, figures
- **Logic puzzles**: Pattern recognition, sequences
- **Geography**: Countries, capitals, landmarks

**Implementation Note**: Create similar functions like `generateSpellingQuestion()`, `generateScienceQuestion()`, etc. Each returns `{ question, answer }` format.

## Game Development Patterns

### Tech Stack
- **HTML5 Canvas** for rendering
- **Vanilla JavaScript** (no frameworks)
- **CSS3** for UI styling
- **Web Audio API** for sounds

### Standard Game Structure

```javascript
// Game state variables
let gameRunning = false;
let score = 0;
let lives = 10;
let currentLevel = 1;

// Game entities
const player = { x, y, width, height, speed, ... };
const enemies = [];
const projectiles = [];
const particles = [];
const powerUps = [];

// Core game loop
function gameLoop() {
  if (!gameRunning) return;

  // Update phase
  updatePlayer();
  updateEnemies();
  updateProjectiles();
  updateParticles();
  updatePowerUps();

  // Collision detection
  checkCollisions();

  // Draw phase
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawPlayer();
  drawEnemies();
  drawProjectiles();
  drawParticles();
  drawPowerUps();

  // Update UI
  updateHUD();

  requestAnimationFrame(gameLoop);
}
```

### Common Code Patterns

**Collision Detection (Circular):**
```javascript
const dist = Math.sqrt(
  Math.pow(obj1.x - obj2.x, 2) +
  Math.pow(obj1.y - obj2.y, 2)
);
if (dist < radius1 + radius2) {
  // Collision occurred
}
```

**Particle Effects:**
```javascript
function createParticles(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 5,
      vy: (Math.random() - 0.5) * 5,
      life: 60,
      color
    });
  }
}
```

**Enemy/Boss Pattern:**
```javascript
const enemy = {
  x, y, width, height,
  health, maxHealth,
  speed, color, points,
  attackCooldown,
  isBoss: false
};
```

**Sound Effects (Procedural):**
```javascript
function playSound(frequency, duration, type = 'sine') {
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  oscillator.frequency.value = frequency;
  oscillator.type = type;
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + duration);
}
```

## Development Workflow

### Running Games
No build process needed. Simply:
1. Edit HTML/CSS/JS files
2. Reload browser (F5 or Cmd+R)
3. Test and iterate

### Creating New Games

1. **Create new folder** in repository root (e.g., `space_shooter/`)
2. **Create characters first** using Character Designer:
   - Open Character Designer in Chrome
   - Draw player, enemies, bosses (32x32 pixels)
   - Save each as JSON (specify game name)
   - Create `characters/` folder in your game folder
   - Move downloaded JSON files there
3. **Copy template files** from existing game or create new:
   - `index.html` - Game canvas, HUD, overlays
   - `style.css` - Styling
   - `game.js` - Game logic
4. **Integrate character sprites** using character rendering code (see Development Tools section)
5. **Implement continue system** with educational questions
6. **Keep it simple**: Arrow keys + 1-2 action keys
7. **Add visual/audio feedback**: Particles, sounds, screen shake
8. **Test in Chrome**

### Git Workflow
```bash
# After making changes
git add .
git commit -m "Descriptive message about changes"
git push
```

## Design Guidelines for Alfonso's Games

### Controls
- Keep controls simple (arrow keys + spacebar + 1-2 special keys)
- Display controls clearly in instructions screen
- Test that all controls feel responsive

### Difficulty
- Start easy, increase gradually
- Use levels or waves for progression
- Bosses should be challenging but beatable
- Continue system provides second chances

### Visual Design
- Use bright, contrasting colors
- **Use Character Designer for sprites** - Pixel art characters look professional
- Emoji work great for icons (🐉🔥👻⚡)
- Particle effects make impacts feel satisfying
- Health bars show progress clearly
- Glowing effects for special items
- 32x32 sprites scale well (2x = 64px, 3x = 96px, etc.)

### Audio
- Different sounds for different actions
- Keep volumes low (0.1 gain) to avoid ear fatigue
- Use procedural Web Audio for simplicity

### Educational Integration
- Continue system keeps gameplay educational
- Questions should be age-appropriate (9 years old)
- 3 attempts provides learning opportunity
- Positive feedback for correct answers

## Publishing (Future)

When ready to publish:
1. Add a main `index.html` at root that links to all games
2. Consider adding game thumbnails/screenshots
3. Test all games in clean browser (no cache)
4. Consider GitHub Pages for free hosting

## Notes
- Repository name: "fonchi" (Alfonso's games)
- Primary builder: Alfonso (9 years old)
- Helper: Claude Code
- Target platform: Chrome browser
- Purpose: Educational game development + learning
- All games should be fun, educational, and age-appropriate
- **Character Designer** is a development tool, not a game - use it to create sprites for games
- Character JSON files in `character_designer/characters/` are the source library
- Copy character JSON files to individual game folders as needed
