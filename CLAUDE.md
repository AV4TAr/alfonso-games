# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

**"fonchi"** - Alfonso's Educational Game Collection

This repository contains multiple educational games built by Alfonso (9 years old) with help from Claude Code. Each game is a standalone HTML5 Canvas game, fully frontend, designed to run in Chrome browser.

### Repository Structure
```
fonchi/
├── CLAUDE.md                    # This file
├── dragons_vs_warden/           # Game 1: Dragon vs Wardens
│   ├── index.html
│   ├── style.css
│   └── game.js
└── [future_game_folders]/       # More games will be added here
```

**Important**: Each game lives in its own folder. Future games should follow the same structure (index.html, style.css, game.js).

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

## Testing Requirements (MANDATORY)

**IMPORTANT RULE**: After every code change, Claude MUST:
1. **Open the game in Chrome** using browser automation tools and visually verify the change works
2. **Run unit tests** to confirm no regressions

### Browser Testing
After every change, open the game in Chrome and manually verify:
- The changed feature works as expected
- Existing features are not broken
- Use cheat codes to jump to the relevant level quickly

### Unit Tests
Every game must have a `tests.js` file with unit tests for:
- Game logic functions (collision detection, math questions, score updates)
- Boss/enemy behavior state machines
- Any new mechanic added

Run tests with:
```bash
node dragons_vs_warden/tests.js
```

Tests should use Node.js (no test framework needed — simple assertions with `console.assert` or a tiny helper).

---

## Development Workflow

### Running Games
No build process needed. Simply:
1. Edit HTML/CSS/JS files
2. Reload browser (F5 or Cmd+R)
3. **Always test in Chrome after changes** (see Testing Requirements above)

### Creating New Games

1. **Create new folder** in repository root (e.g., `space_shooter/`)
2. **Copy template files** from existing game or create new:
   - `index.html` - Game canvas, HUD, overlays
   - `style.css` - Styling
   - `game.js` - Game logic
3. **Implement continue system** with educational questions
4. **Keep it simple**: Arrow keys + 1-2 action keys
5. **Add visual/audio feedback**: Particles, sounds, screen shake
6. **Test in Chrome**

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
- Emoji work great for icons (🐉🔥👻⚡)
- Particle effects make impacts feel satisfying
- Health bars show progress clearly
- Glowing effects for special items

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

## Settings Must Be Persisted in localStorage (MANDATORY)

**IMPORTANT RULE**: Any game that has a settings menu **must** save all settings to `localStorage` so they survive page reloads.

### Pattern to follow

```javascript
// Load on startup (at the top of game.js with other state variables)
let mySetting = localStorage.getItem('setting_mySetting') === 'true';

// Save when changed
function toggleMySetting(enabled) {
    mySetting = enabled;
    localStorage.setItem('setting_mySetting', enabled);
}
```

```javascript
// Sync checkbox to saved value on page load (in DOMContentLoaded in index.html)
document.getElementById('setting-my-setting').checked = mySetting;
```

### Key naming convention
Use the prefix `setting_` followed by the camelCase setting name (e.g. `setting_directionalShooting`, `setting_soundEnabled`).

---

## Cheat Code System (Use in ALL Games)

Every game should have a hidden cheat code system on the start/instructions screen so Alfonso can jump to any level to test it.

### How It Works
1. A tiny faint `🔮` icon sits in the bottom-right corner of the instructions panel (opacity ~0.12 — barely visible)
2. Clicking it reveals a hidden text input field (styled with purple glow, monospace font)
3. Player types a secret code + presses Enter
4. **Correct code** → flash overlay + rising chime sound + message "⚡ CHEAT ACTIVATED ⚡ — Level X" → game starts at that level
5. **Wrong code** → input flashes red and clears

### Code Structure (copy this pattern for every game)
```javascript
const CHEAT_CODES = {
    'CODEWORD': levelNumber,   // e.g. 'DRAGON': 2
};

const CHEAT_LEVEL_NAMES = {
    2: 'Level 2 — Description',
};

function activateCheatZone() { /* show input + focus */ }
function checkCheatCode()    { /* validate, trigger effect or flash red */ }
function triggerCheatEffect(level) { /* sound + flash + startAtLevel */ }
function startAtLevel(level) { /* skip to that level */ }
```

### Naming Convention for Codes
- Use a word that fits the theme of the level (e.g., the enemy type)
- Keep it short, memorable, and in English

### Important
- Always test cheat codes work before shipping
- Document codes in the game's CLAUDE.md section so they are never lost

## Claude's Role: Experienced Game Designer

**IMPORTANT RULE**: When Alfonso asks to build a new level, new game, or add a major feature, **NEVER jump straight into coding**. Act as an experienced game designer and ask questions first.

### Questions to ask before building a new level:
- What kind of enemies do you imagine? (flying? shooting? chasing you?)
- What makes this level feel different from the ones before?
- Should the level be harder, or have a completely different style/mood?
- Any special mechanic you want? (new weapon, new power, new movement?)
- What's the theme/story? (what place is the player going to?)

### Questions to ask before building a new game:
- What is the player doing? (shooting, running, puzzle, collecting?)
- Who is the main character and who are the enemies?
- How do you move? (arrow keys, mouse, WASD?)
- What does winning look like? What does losing look like?
- What's one thing that makes this game special or fun?

### Why this matters:
Alfonso is learning game design, not just playing games. Asking questions helps him **think like a designer** and makes the final game **his vision**, not a random guess. Always adapt questions to the specific game he's working on.

## Keeping the Home Page Updated

**IMPORTANT RULE**: Whenever a game change is relevant to what players see before starting (new levels, new controls, new characters), **always update the arcade home page** (`/index.html` at the repo root) to reflect it.

Examples of changes that require a home page update:
- New level added → update level count or description on the game card
- New controls → update controls listed on the card
- New game added → add a new game card to the home page
- Game renamed → update the title on the card

## Deploying / Launching

When Alfonso says **"launch"** or **"deploy"**:
1. Ask: *"Do you also want to update alfonso.sapriza.com with these changes?"*
2. If yes → merge to main, commit, and push (GitHub Actions will auto-deploy)
3. If no → just commit and push the current branch

**Never push to main or merge without Alfonso confirming.**

## Notes
- Repository name: "fonchi" (Alfonso's games)
- Primary builder: Alfonso (9 years old)
- Helper: Claude Code
- Target platform: Chrome browser
- Purpose: Educational game development + learning
- All games should be fun, educational, and age-appropriate
- Live site: alfonso.sapriza.com (auto-deploys via GitHub Actions on push to main)
