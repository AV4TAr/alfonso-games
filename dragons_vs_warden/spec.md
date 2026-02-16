# Dragon vs Wardens - Technical Specification

## Overview

A 3-level browser-based action game built with HTML5 Canvas and vanilla JavaScript. Player controls a dragon fighting through waves of enemies with increasing difficulty.

## Technical Stack

- **HTML5 Canvas** - Rendering
- **Vanilla JavaScript** - Game logic (no frameworks)
- **CSS3** - UI styling
- **Web Audio API** - Procedural sound generation

## Game Parameters

### Canvas
- Size: 1000x700 pixels
- Background: Dark gradient (#1a1a2e)
- Frame rate: 60 FPS (requestAnimationFrame)

### Player (Dragon)
```javascript
{
  width: 80,
  height: 70,
  speed: 5,
  lives: 10,
  fireballDamage: 1,
  bigFireballDamage: 5,
  bigFireballInterval: 5000ms
}
```

### Player Abilities
1. **Movement**: All 8 directions (arrow keys)
2. **Shoot Fireballs**: Spacebar (cooldown: none)
3. **Invisibility**: P key (duration: 3000ms, cooldown: 10000ms)
4. **Big Fireballs**: Automatic every 5 seconds (5x damage)

## Level Design

### Level 1: Wardens

**Regular Wardens (5 total)**
```javascript
wardenTypes = [
  { color: '#0a3d3d', health: 10, speed: 1.5, points: 10 },  // Normal
  { color: '#4a0a4a', health: 10, speed: 2.5, points: 15 },  // Fast
  { color: '#4a1a0a', health: 10, speed: 1.0, points: 20 },  // Tank
  { color: '#0a1a4a', health: 10, speed: 3.0, points: 25 }   // Speedy
]
```

**Boss Warden**
```javascript
{
  health: 25,
  maxHealth: 25,
  speed: 0.8,
  width: 150,
  height: 210,
  color: '#ff0000',
  points: 100,
  fireSpitCooldown: 2000ms,
  hasCrown: true
}
```

**Spawn Pattern**: One warden every 2 seconds until 5 spawned. Boss appears after killing all 5.

**Boss Abilities**:
- Spits fire every 2 seconds (1 damage)
- Larger hitbox (3x size)
- Red color with golden crown

**Win Condition**: Defeat Boss Warden → Door to Level 2 appears

---

### Level 2: Enemy Dragons

**Regular Enemy Dragons (5 total)**
```javascript
{
  health: 15,
  maxHealth: 15,
  speed: 2.0,
  width: 70,
  height: 60,
  color: '#2ecc71',  // Green
  points: 30,
  fireSpitCooldown: 3000ms
}
```

**Dragon Boss**
```javascript
{
  health: 30,
  maxHealth: 30,
  speed: 1.5,
  width: 200,
  height: 180,
  color: '#8b00ff',  // Purple
  points: 200,
  fireSpitCooldown: 2000ms,
  hasCrown: true,
  shootsTripleFireballs: true
}
```

**Spawn Pattern**: One dragon every 2.5 seconds until 5 spawned. Boss appears after killing all 5.

**Boss Abilities**:
- Shoots 3 fireballs at once (spread pattern)
- Faster fire rate (2 seconds vs 3 seconds)
- Purple color with golden crown

**Win Condition**: Defeat Dragon Boss → Door to Level 3 appears

---

### Level 3: Skeleton Warriors

**Regular Skeletons (7 total)**
```javascript
{
  health: 7,
  maxHealth: 7,
  speed: 2.5,
  width: 60,
  height: 70,
  color: '#e0e0e0',  // Light gray
  points: 20,
  throwCooldown: 3000ms,
  dodgeChance: 0.30  // 30% chance to dodge fireballs
}
```

**Skeleton King Boss**
```javascript
{
  health: 40,
  maxHealth: 40,
  speed: 1.2,
  width: 150,
  height: 210,
  color: '#ffffff',  // White
  points: 250,
  throwCooldown: 2000ms,
  hasCrown: true,
  throwsSkulls: true,
  summonsHelpers: true
}
```

**Spawn Pattern**: One skeleton every 2 seconds until 7 spawned. Boss appears after killing all 7.

**Boss Abilities**:
- Throws 3 skulls at once (2 damage each)
- At 50% health (20 HP), summons 2 mini-skeletons
- Golden crown with red jewels
- Faster throw rate

**Mini-Skeletons (Summoned by Boss)**
```javascript
{
  health: 5,
  maxHealth: 5,
  speed: 3.0,
  width: 50,
  height: 60,
  color: '#d0d0d0',
  points: 15
}
```

**Win Condition**: Defeat Skeleton King → Door to Level 4 appears (Level 4 not yet implemented)

---

## Enemy Projectiles

### Warden/Dragon Fire
```javascript
{
  radius: 10,  // 15 for boss
  speed: 3,    // 4 for boss
  damage: 1,
  color: '#ff6600' gradient
}
```

### Skeleton Bones
```javascript
{
  width: 20,
  height: 8,
  speed: 4,
  damage: 1,
  type: 'bone',
  rotation: animated
}
```

### Skeleton King Skulls
```javascript
{
  width: 25,
  height: 25,
  speed: 3.5,
  damage: 2,
  type: 'skull',
  rotation: animated,
  count: 3  // Shoots 3 at once
}
```

---

## Power-Up System

**Spawn Frequency**: Every 30 seconds

**Power-Up Types**:

1. **Invisibility** 👻
   - Duration: 5000ms
   - Effect: Cannot be hit by enemies
   - Visual: Player alpha = 0.3

2. **Speed Boost** ⚡
   - Duration: 5000ms
   - Effect: speed = 8 (from 5)
   - Visual: Speed particles

3. **Shield** 🛡️
   - Duration: 5000ms
   - Effect: Lives protected (damage prevented)
   - Visual: Shield glow

4. **Multi-Shot** ✨
   - Duration: 10000ms
   - Effect: Shoots 3 fireballs instead of 1
   - Visual: Triple fireball spread

**Collision**: Circle collision with 40px radius

---

## Continue System (Educational Feature)

### Flow
1. Player dies (lives = 0)
2. Show math question overlay
3. Player has 3 attempts to answer
4. Correct answer → restore lives to 10, continue game
5. Wrong answer → decrement attempts, new question
6. 3 failed attempts → game over

### Math Question Generation
```javascript
// Addition: 1-50 + 1-50
num1 = random(1, 50)
num2 = random(1, 50)
answer = num1 + num2

// Subtraction: positive results only
num1 = random(20, 70)
num2 = random(1, num1 - 1)
answer = num1 - num2

// Multiplication: up to 12×12
num1 = random(1, 12)
num2 = random(1, 12)
answer = num1 × num2
```

### State Variables
```javascript
continueAttempts = 3
currentMathQuestion = { question: "7 × 8", answer: 56 }
```

### UI Elements
- Question display (48px gold text)
- Number input field
- Submit button
- Feedback text (correct/wrong)
- Attempts remaining counter

---

## Collision Detection

### Circular Collision (Fireballs, Power-ups)
```javascript
dist = sqrt((obj1.x - obj2.x)² + (obj1.y - obj2.y)²)
if (dist < radius1 + radius2) {
  // Collision detected
}
```

### Rectangular Collision (Doors)
```javascript
if (dragon.x + dragon.width > door.x &&
    dragon.x < door.x + door.width &&
    dragon.y + dragon.height > door.y &&
    dragon.y < door.y + door.height) {
  // Collision detected
}
```

---

## Visual Effects

### Particle System
```javascript
createParticles(x, y, color, count) {
  // Creates count particles at x,y
  // Particles have random velocity
  // Life: 60 frames (1 second at 60fps)
  // Alpha fades based on remaining life
}
```

**Particle Usage**:
- Hit effects: 5 particles
- Kill effects: 20 particles
- Boss defeat: 100 particles
- Power-up collection: 15 particles

### Drawing

**Enemy Health Bars**
- Position: Above enemy (y - 10)
- Width: Enemy width
- Height: 5px
- Colors: Green (>50%), Yellow (>25%), Red (<25%)

**Doors**
- Wooden frame (#654321)
- Portal effect (animated gradient)
- Pulsing glow (sin wave)
- Level number text above

**Crowns (Bosses)**
- Gold base (#ffd700)
- Colored jewels (red/purple depending on boss)
- Positioned above boss head

---

## Audio System

### Web Audio API Implementation
```javascript
function playSound(frequency, duration, type) {
  oscillator = audioContext.createOscillator()
  gainNode = audioContext.createGain()

  oscillator.frequency.value = frequency
  oscillator.type = type  // 'sine', 'square', 'sawtooth', 'triangle'

  gainNode.gain.setValueAtTime(0.1, now)
  gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration)

  oscillator.start(now)
  oscillator.stop(now + duration)
}
```

### Sound Effects
- **Shoot**: 200Hz, 0.1s, square
- **Hit**: 150Hz, 0.2s, sawtooth
- **Damage**: 100Hz, 0.3s, triangle
- **Kill**: 50Hz, 0.5s, sine
- **Power-up**: 400Hz, 0.3s, sine

---

## Game Loop

### Update Phase (60 FPS)
1. Update player position
2. Update all fireballs
3. Update all enemies (wardens/dragons/skeletons)
4. Update all enemy projectiles
5. Update particles
6. Update power-ups
7. Check all collisions

### Draw Phase
1. Clear canvas
2. Draw door (if exists)
3. Draw power-ups
4. Draw enemies
5. Draw skeletons
6. Draw fireballs
7. Draw enemy projectiles
8. Draw player
9. Draw particles
10. Update HUD

### HUD Elements
- Lives counter (top left)
- Score counter (top center)
- Level + power status (top right)

---

## Level Progression Flow

```
Start Game
    ↓
Level 1: Fight 5 Wardens
    ↓
Boss Warden appears
    ↓
Defeat Boss → Door spawns
    ↓
Enter Door → Level 2
    ↓
Level 2: Fight 5 Enemy Dragons
    ↓
Dragon Boss appears
    ↓
Defeat Boss → Door spawns
    ↓
Enter Door → Level 3
    ↓
Level 3: Fight 7 Skeletons
    ↓
Skeleton King appears
    ↓
Defeat Boss → Door spawns
    ↓
Enter Door → Level 4 (not yet implemented)
```

---

## File Structure

```
dragons_vs_warden/
├── index.html          # Game container, canvas, UI overlays
├── style.css           # Dark theme styling, HUD, modals
├── game.js             # All game logic (1700+ lines)
├── README.md           # Player-facing documentation
└── spec.md             # This file - technical specification
```

---

## Code Organization

### State Variables
- Game state (running, score, lives, level)
- Enemy counters (killed, spawned, boss flags)
- Continue system (attempts, current question)

### Arrays
- `fireballs[]` - Player projectiles
- `wardens[]` - Level 1 enemies
- `enemyDragons[]` - Level 2 enemies
- `skeletons[]` - Level 3 enemies
- `enemyProjectiles[]` - Bones and skulls
- `enemyFire[]` - Fire from wardens/dragons
- `particles[]` - Visual effects
- `powerUps[]` - Collectible power-ups

### Main Functions
- `gameLoop()` - Main update/draw loop
- `updateX()` / `drawX()` - For each entity type
- `spawnX()` - Enemy spawning logic
- `enterLevelX()` - Level transition
- `checkMathAnswer()` - Continue system
- `createParticles()` - Visual effects

---

## Performance Considerations

- Particle limit: No hard limit (culled by lifetime)
- Enemy limit: Max 10 on screen at once (7 skeletons + 2 helpers + 1 boss)
- Projectile limit: No hard limit (auto-removed when off-screen)
- Canvas cleared each frame (no trails)

---

## Browser Compatibility

**Target**: Google Chrome (latest)
**Required APIs**:
- Canvas 2D
- Web Audio API
- requestAnimationFrame
- ES6 JavaScript

---

## Future Expansion

### Level 4 (Planned)
Options under consideration:
- Lava Monsters (splitting enemies)
- Shadow Ninjas (teleporting)
- Robot Army (shields)

### Level 5 (Planned)
Final boss battle

### Continue System Expansion
- Spelling questions
- Reading comprehension
- Science facts
- Geography

---

## Educational Value

**Math Practice**: Addition, subtraction, multiplication (age 9 level)
**Problem Solving**: Strategy for enemy patterns
**Hand-Eye Coordination**: Movement and shooting
**Pattern Recognition**: Enemy behaviors and timing

---

## Credits

- **Game Designer**: Alfonso (9 years old)
- **Developer**: Alfonso with Claude Code assistance
- **Date Created**: February 2024
- **Version**: 1.0.0
- **Repository**: github.com/AV4TAr/alfonso-games
