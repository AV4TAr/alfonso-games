const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 1000;
canvas.height = 700;

// Game state
let gameRunning = false;
let score = 0;
let lives = 10;
let wardensKilled = 0;
let bossSpawned = false;
let wardensSpawned = 0;
let maxWardens = 5;
let currentLevel = 1;
let door = null;
let bossDefeated = false;
let enemyDragonsKilled = 0;
let dragonBossSpawned = false;
let skeletonsKilled = 0;
let skeletonBossSpawned = false;
let wizardsKilled = 0;
let wizardBossSpawned = false;
let eelsKilled = 0;
let jellyfishBossSpawned = false;
let continueAttempts = 3;
let currentMathQuestion = null;
let directionalShooting = localStorage.getItem('setting_directionalShooting') === 'true';

// Player (Dragon)
const dragon = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 80,
    height: 70,
    speed: 5,
    dx: 0,
    dy: 0,
    invisible: false,
    invisibleTimer: 0,
    invisibleDuration: 3000, // 3 seconds
    invisibleCooldown: 0,
    bigFireballTimer: 0,
    doubleBullets: false,
    aimDir: { dx: 0, dy: -1 }  // default: upward
};

// Arrays
const fireballs = [];
const wardens = [];
const enemyDragons = [];
const skeletons = [];
const wizards = [];
const eels = [];
const enemyProjectiles = []; // bones, skulls, magic bolts, and electric bolts
const particles = [];
const powerUps = [];
const enemyFire = [];

// Keys
const keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    ' ': false,
    n: false
};

let gamePaused = false;

// Warden types
const wardenTypes = [
    { color: '#0a3d3d', health: 10, speed: 1.5, points: 10, name: 'Normal' },
    { color: '#4a0a4a', health: 10, speed: 2.5, points: 15, name: 'Fast' },
    { color: '#4a1a0a', health: 10, speed: 1, points: 20, name: 'Tank' },
    { color: '#0a1a4a', health: 10, speed: 3, points: 25, name: 'Speedy' }
];

// Audio context for sound effects
let audioContext;
let soundEnabled = true;

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        soundEnabled = false;
    }
}

// Sound effects
function playSound(frequency, duration, type = 'sine') {
    if (!soundEnabled || !audioContext) return;

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

function shootSound() {
    playSound(200, 0.1, 'square');
}

function hitSound() {
    playSound(150, 0.2, 'sawtooth');
}

function damageSound() {
    playSound(100, 0.3, 'triangle');
}

function killSound() {
    playSound(50, 0.5, 'sine');
}

function powerSound() {
    playSound(400, 0.3, 'sine');
}

// Event listeners
document.addEventListener('keydown', (e) => {
    // Pause works regardless of keys map
    if (e.key === 'p') {
        e.preventDefault();
        togglePause();
    }

    if (e.key === 's') {
        soundEnabled = !soundEnabled;
    }

    if (e.key in keys) {
        keys[e.key] = true;

        if (e.key === ' ' && gameRunning) {
            e.preventDefault();
            shootFireball();
        }

        if (e.key === 'n' && gameRunning) {
            e.preventDefault();
            activateInvisibility();
        }
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key in keys) {
        keys[e.key] = false;
    }
});

// ===== CHEAT CODE SYSTEM =====

const CHEAT_CODES = {
    'DRAGON': 2,
    'SKULL':  3,
    'WIZARD': 4,
    'EEL':    5
};

const CHEAT_LEVEL_NAMES = {
    2: 'Level 2 — Enemy Dragons 🐉',
    3: 'Level 3 — Skeletons 💀',
    4: 'Level 4 — Dark Wizards 🔮',
    5: 'Level 5 — Electric Eels ⚡'
};

function activateCheatZone() {
    const input = document.getElementById('cheat-input');
    input.classList.remove('hidden');
    input.focus();
}

function checkCheatCode() {
    const input = document.getElementById('cheat-input');
    const code = input.value.trim().toUpperCase();

    if (CHEAT_CODES[code] !== undefined) {
        const level = CHEAT_CODES[code];
        input.classList.add('hidden');
        triggerCheatEffect(level);
    } else {
        // Wrong code — flash red and clear
        input.classList.add('wrong');
        input.value = '';
        setTimeout(() => input.classList.remove('wrong'), 800);
    }
}

function triggerCheatEffect(level) {
    initAudio();
    // Rising chime sound
    playSound(600, 0.12, 'sine');
    setTimeout(() => playSound(800, 0.12, 'sine'), 140);
    setTimeout(() => playSound(1000, 0.12, 'sine'), 280);
    setTimeout(() => playSound(1300, 0.3, 'sine'), 420);

    // Show flash overlay
    const flash = document.getElementById('cheat-flash');
    const msg = document.getElementById('cheat-message');
    msg.innerHTML = `⚡ CHEAT ACTIVATED ⚡<br>${CHEAT_LEVEL_NAMES[level]}`;
    flash.classList.remove('hidden');

    setTimeout(() => {
        flash.classList.add('hidden');
        startAtLevel(level);
    }, 1800);
}

function startAtLevel(level) {
    document.getElementById('instructions').classList.add('hidden');
    gameRunning = true;
    initAudio();
    spawnPowerUps();

    if (level === 2) enterLevel2();
    else if (level === 3) enterLevel3();
    else if (level === 4) enterLevel4();
    else if (level === 5) enterLevel5();
    else spawnWardens();

    gameLoop();
}

// ===========================

function startGame() {
    document.getElementById('instructions').classList.add('hidden');
    gameRunning = true;
    initAudio();
    spawnWardens();
    spawnPowerUps();
    gameLoop();
}

// Dragon movement
function updateDragon() {
    dragon.dx = 0;
    dragon.dy = 0;

    if (keys.ArrowLeft) dragon.dx = -dragon.speed;
    if (keys.ArrowRight) dragon.dx = dragon.speed;
    if (keys.ArrowUp) dragon.dy = -dragon.speed;
    if (keys.ArrowDown) dragon.dy = dragon.speed;

    if (dragon.dx !== 0 || dragon.dy !== 0) {
        const len = Math.sqrt(dragon.dx * dragon.dx + dragon.dy * dragon.dy);
        dragon.aimDir.dx = dragon.dx / len;
        dragon.aimDir.dy = dragon.dy / len;
    }

    dragon.x += dragon.dx;
    dragon.y += dragon.dy;

    // Boundaries
    if (dragon.x < 0) dragon.x = 0;
    if (dragon.x + dragon.width > canvas.width) dragon.x = canvas.width - dragon.width;
    if (dragon.y < 0) dragon.y = 0;
    if (dragon.y + dragon.height > canvas.height) dragon.y = canvas.height - dragon.height;

    // Update invisibility
    if (dragon.invisible) {
        dragon.invisibleTimer -= 16;
        if (dragon.invisibleTimer <= 0) {
            dragon.invisible = false;
        }
    }

    if (dragon.invisibleCooldown > 0) {
        dragon.invisibleCooldown -= 16;
    }

    // Big fireball timer
    dragon.bigFireballTimer += 16;
}

function drawDragon() {
    ctx.save();

    if (dragon.invisible) {
        ctx.globalAlpha = 0.3;
    }

    const centerX = dragon.x + dragon.width / 2;
    const centerY = dragon.y + dragon.height / 2;

    // Wings (spread out)
    ctx.fillStyle = '#c44569';
    // Left wing
    ctx.beginPath();
    ctx.ellipse(dragon.x + 10, dragon.y + 25, 25, 35, -0.3, 0, Math.PI * 2);
    ctx.fill();
    // Right wing
    ctx.beginPath();
    ctx.ellipse(dragon.x + 70, dragon.y + 25, 25, 35, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Tail
    ctx.fillStyle = '#e55039';
    ctx.beginPath();
    ctx.moveTo(centerX, dragon.y + 50);
    ctx.quadraticCurveTo(centerX - 15, dragon.y + 65, centerX - 10, dragon.y + 75);
    ctx.quadraticCurveTo(centerX - 5, dragon.y + 70, centerX, dragon.y + 55);
    ctx.fill();

    // Body
    ctx.fillStyle = '#eb2f06';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 30, 25, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    ctx.fillStyle = '#e55039';
    ctx.beginPath();
    ctx.ellipse(centerX + 15, dragon.y + 20, 15, 18, 0.3, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#fa983a';
    ctx.beginPath();
    ctx.ellipse(centerX + 28, dragon.y + 12, 18, 15, 0, 0, Math.PI * 2);
    ctx.fill();

    // Snout
    ctx.fillStyle = '#e58e26';
    ctx.beginPath();
    ctx.ellipse(centerX + 40, dragon.y + 14, 10, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Nostril
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX + 45, dragon.y + 14, 2, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(centerX + 32, dragon.y + 10, 5, 0, Math.PI * 2);
    ctx.fill();
    // Pupil
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(centerX + 34, dragon.y + 10, 2, 0, Math.PI * 2);
    ctx.fill();

    // Horns
    ctx.fillStyle = '#8b4513';
    ctx.beginPath();
    ctx.moveTo(centerX + 20, dragon.y + 5);
    ctx.lineTo(centerX + 18, dragon.y - 8);
    ctx.lineTo(centerX + 24, dragon.y + 8);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX + 32, dragon.y + 2);
    ctx.lineTo(centerX + 32, dragon.y - 10);
    ctx.lineTo(centerX + 36, dragon.y + 5);
    ctx.fill();

    // Spikes on back
    ctx.fillStyle = '#d63031';
    for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(centerX - 10 + i * 12, centerY - 8);
        ctx.lineTo(centerX - 8 + i * 12, centerY - 18);
        ctx.lineTo(centerX - 6 + i * 12, centerY - 8);
        ctx.fill();
    }

    // Legs
    ctx.fillStyle = '#e55039';
    ctx.fillRect(centerX - 15, centerY + 15, 8, 15);
    ctx.fillRect(centerX + 7, centerY + 15, 8, 15);

    // Claws
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(centerX - 15, centerY + 28, 8, 3);
    ctx.fillRect(centerX + 7, centerY + 28, 8, 3);

    ctx.restore();
}

// Fireballs
function shootFireball() {
    const isBig = dragon.bigFireballTimer > 5000; // Big fireball every 5 seconds
    let spawnX, spawnY, dx, dy;

    if (directionalShooting) {
        const cx = dragon.x + dragon.width / 2;
        const cy = dragon.y + dragon.height / 2;
        spawnX = cx + dragon.aimDir.dx * 45;
        spawnY = cy + dragon.aimDir.dy * 45;
        dx = dragon.aimDir.dx;
        dy = dragon.aimDir.dy;
    } else {
        spawnX = dragon.x + dragon.width / 2;
        spawnY = dragon.y;
        dx = 0;
        dy = -1;
    }

    fireballs.push({ x: spawnX, y: spawnY, dx, dy, radius: isBig ? 15 : 8, speed: 8, damage: isBig ? 5 : 1, isBig });

    if (isBig) dragon.bigFireballTimer = 0;
    shootSound();
}

function toggleDirectionalShooting(enabled) {
    directionalShooting = enabled;
    localStorage.setItem('setting_directionalShooting', enabled);
    if (!enabled) dragon.aimDir = { dx: 0, dy: -1 };
}

function updateFireballs() {
    for (let i = fireballs.length - 1; i >= 0; i--) {
        const fb = fireballs[i];
        fb.x += fb.dx * fb.speed;
        fb.y += fb.dy * fb.speed;
        if (fb.x < -20 || fb.x > canvas.width + 20 ||
            fb.y < -20 || fb.y > canvas.height + 20) {
            fireballs.splice(i, 1);
        }
    }
}

function drawFireballs() {
    fireballs.forEach(fireball => {
        // Glow effect
        const gradient = ctx.createRadialGradient(
            fireball.x, fireball.y, 0,
            fireball.x, fireball.y, fireball.radius
        );
        gradient.addColorStop(0, fireball.isBig ? '#ffff00' : '#ff6b35');
        gradient.addColorStop(0.5, fireball.isBig ? '#ff8c00' : '#ff4757');
        gradient.addColorStop(1, fireball.isBig ? '#ff0000' : 'rgba(255, 71, 87, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fireball.x, fireball.y, fireball.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}

// Wardens
function spawnWardens() {
    setInterval(() => {
        if (!gameRunning || currentLevel !== 1) return; // Only spawn wardens in level 1

        // Check if boss should spawn (after killing 5 wardens)
        if (wardensKilled >= 5 && !bossSpawned) {
            spawnBossWarden();
            bossSpawned = true;
            return;
        }

        // Stop spawning regular wardens after max
        if (wardensSpawned >= maxWardens) return;

        const type = wardenTypes[Math.floor(Math.random() * wardenTypes.length)];
        const warden = {
            x: Math.random() * (canvas.width - 50),
            y: -70, // Spawn from top of screen
            width: 50,
            height: 70,
            health: type.health,
            maxHealth: type.health,
            speed: type.speed,
            color: type.color,
            points: type.points,
            punchCooldown: 0,
            isBoss: false,
            fireSpitCooldown: 0
        };

        wardens.push(warden);
        wardensSpawned++;
    }, 2000);
}

function spawnBossWarden() {
    const boss = {
        x: canvas.width / 2 - 75,
        y: -140,
        width: 150, // 3x bigger
        height: 210,
        health: 25,
        maxHealth: 25,
        speed: 0.8,
        color: '#ff0000', // Red boss
        points: 100,
        punchCooldown: 0,
        isBoss: true,
        fireSpitCooldown: 0,
        chargeState: 'idle',
        chargeTimer: 4000,
        chargeTarget: { x: 0, y: 0 }
    };

    wardens.push(boss);
    damageSound(); // Boss arrival sound
}

function updateWardens() {
    for (let i = wardens.length - 1; i >= 0; i--) {
        const warden = wardens[i];

        // Move towards dragon
        const dx = dragon.x - warden.x;
        const dy = dragon.y - warden.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (warden.isBoss) {
            // Boss Warden: Charge & Recover pattern
            warden.chargeTimer -= 16;
            if (warden.chargeState === 'idle') {
                if (distance > 50) {
                    warden.x += (dx / distance) * warden.speed;
                    warden.y += (dy / distance) * warden.speed;
                } else if (warden.punchCooldown <= 0 && !dragon.invisible) {
                    lives--;
                    warden.punchCooldown = 1000;
                    damageSound();
                    updateLives();
                    createParticles(dragon.x, dragon.y, '#ff4757', 10);
                    if (lives <= 0) gameOver();
                }
                if (warden.chargeTimer <= 0) {
                    warden.chargeState = 'telegraph';
                    warden.chargeTimer = 600;
                }
            } else if (warden.chargeState === 'telegraph') {
                // Slow creep — visual warning before dash
                if (distance > 50) {
                    warden.x += (dx / distance) * 0.3;
                    warden.y += (dy / distance) * 0.3;
                }
                if (warden.chargeTimer <= 0) {
                    warden.chargeTarget = { x: dragon.x, y: dragon.y };
                    warden.chargeState = 'charge';
                    warden.chargeTimer = 400;
                }
            } else if (warden.chargeState === 'charge') {
                // Dash toward locked target position
                const cdx = warden.chargeTarget.x - warden.x;
                const cdy = warden.chargeTarget.y - warden.y;
                const cdist = Math.sqrt(cdx * cdx + cdy * cdy);
                if (cdist > 5) {
                    warden.x += (cdx / cdist) * 10;
                    warden.y += (cdy / cdist) * 10;
                }
                if (distance < 60 && warden.punchCooldown <= 0 && !dragon.invisible) {
                    lives--;
                    warden.punchCooldown = 1000;
                    damageSound();
                    updateLives();
                    createParticles(dragon.x, dragon.y, '#ff4757', 15);
                    if (lives <= 0) gameOver();
                }
                if (warden.chargeTimer <= 0) {
                    warden.chargeState = 'recover';
                    warden.chargeTimer = 800;
                }
            } else if (warden.chargeState === 'recover') {
                // Stop and recover
                if (warden.chargeTimer <= 0) {
                    warden.chargeState = 'idle';
                    warden.chargeTimer = 4000;
                }
            }
        } else {
            // Regular wardens: walk straight at player
            if (distance > 50) {
                warden.x += (dx / distance) * warden.speed;
                warden.y += (dy / distance) * warden.speed;
            } else if (warden.punchCooldown <= 0 && !dragon.invisible) {
                lives--;
                warden.punchCooldown = 1000;
                damageSound();
                updateLives();
                createParticles(dragon.x, dragon.y, '#ff4757', 10);
                if (lives <= 0) gameOver();
            }
        }

        warden.punchCooldown -= 16;

        // Boss fire spitting
        if (warden.isBoss) {
            warden.fireSpitCooldown -= 16;
            if (warden.fireSpitCooldown <= 0) {
                spitFire(warden);
                warden.fireSpitCooldown = 2000; // Spit fire every 2 seconds
            }
        }

        // Check collision with fireballs
        for (let j = fireballs.length - 1; j >= 0; j--) {
            const fireball = fireballs[j];
            const dist = Math.sqrt(
                Math.pow(fireball.x - (warden.x + warden.width / 2), 2) +
                Math.pow(fireball.y - (warden.y + warden.height / 2), 2)
            );

            if (dist < fireball.radius + 25) {
                warden.health -= fireball.damage;
                fireballs.splice(j, 1);
                hitSound();
                createParticles(warden.x + 25, warden.y + 35, warden.color, 5);

                if (warden.health <= 0) {
                    score += warden.points;
                    wardensKilled++;
                    updateScore();
                    killSound();
                    createParticles(warden.x + warden.width/2, warden.y + warden.height/2, warden.color, 20);

                    if (warden.isBoss) {
                        bossDefeated = true;
                        createParticles(warden.x + warden.width/2, warden.y + warden.height/2, '#ff0000', 50);

                        // Spawn door
                        door = {
                            x: canvas.width / 2 - 40,
                            y: canvas.height / 2 - 60,
                            width: 80,
                            height: 120
                        };
                    }

                    wardens.splice(i, 1);
                }
                break;
            }
        }
    }
}

function drawWardens() {
    wardens.forEach(warden => {
        const scale = warden.isBoss ? 3 : 1;
        const centerX = warden.x + warden.width / 2;
        const baseSize = warden.isBoss ? 50 : 25;

        // Shadow/body
        ctx.fillStyle = warden.color;
        ctx.fillRect(warden.x, warden.y, warden.width, warden.height);

        // Head
        ctx.fillStyle = warden.color;
        ctx.beginPath();
        ctx.arc(centerX, warden.y + 15 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Horns (cyan glow like Minecraft warden)
        ctx.fillStyle = warden.isBoss ? '#ff00ff' : '#00ffff';
        ctx.beginPath();
        ctx.arc(centerX - 10 * scale, warden.y + 5 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 10 * scale, warden.y + 5 * scale, 5 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Crown for boss
        if (warden.isBoss) {
            const crownY = warden.y - 40;

            // Crown base
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(centerX - 30, crownY + 20);
            ctx.lineTo(centerX - 25, crownY);
            ctx.lineTo(centerX - 15, crownY + 15);
            ctx.lineTo(centerX, crownY - 5);
            ctx.lineTo(centerX + 15, crownY + 15);
            ctx.lineTo(centerX + 25, crownY);
            ctx.lineTo(centerX + 30, crownY + 20);
            ctx.closePath();
            ctx.fill();

            // Crown jewels
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(centerX - 25, crownY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX, crownY - 5, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 25, crownY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Crown shine
            ctx.fillStyle = '#ffff99';
            ctx.beginPath();
            ctx.arc(centerX - 20, crownY + 5, 3, 0, Math.PI * 2);
            ctx.fill();

            // Boss label
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('BOSS', centerX, warden.y - 50);
        }

        // Health bar
        const healthPercent = warden.health / warden.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(warden.x, warden.y - 10, warden.width, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(warden.x, warden.y - 10, warden.width * healthPercent, 5);
    });
}

// Boss fire spitting
function spitFire(warden) {
    const centerX = warden.x + warden.width / 2;
    const centerY = warden.y + warden.height / 2;

    enemyFire.push({
        x: centerX,
        y: centerY,
        radius: 12,
        speed: 4,
        dx: (dragon.x - centerX) / 100,
        dy: (dragon.y - centerY) / 100
    });

    shootSound();
}

function updateEnemyFire() {
    for (let i = enemyFire.length - 1; i >= 0; i--) {
        const fire = enemyFire[i];
        fire.x += fire.dx * fire.speed * 10;
        fire.y += fire.dy * fire.speed * 10;

        // Remove if off screen
        if (fire.x < 0 || fire.x > canvas.width || fire.y < 0 || fire.y > canvas.height) {
            enemyFire.splice(i, 1);
            continue;
        }

        // Check collision with dragon
        if (!dragon.invisible) {
            const dist = Math.sqrt(
                Math.pow(fire.x - (dragon.x + dragon.width / 2), 2) +
                Math.pow(fire.y - (dragon.y + dragon.height / 2), 2)
            );

            if (dist < fire.radius + 25) {
                lives--;
                updateLives();
                damageSound();
                createParticles(dragon.x + dragon.width/2, dragon.y + dragon.height/2, '#ff6b35', 15);
                enemyFire.splice(i, 1);

                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    }
}

function drawEnemyFire() {
    enemyFire.forEach(fire => {
        const gradient = ctx.createRadialGradient(
            fire.x, fire.y, 0,
            fire.x, fire.y, fire.radius
        );
        gradient.addColorStop(0, '#ffff00');
        gradient.addColorStop(0.5, '#ff6600');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.radius, 0, Math.PI * 2);
        ctx.fill();
    });
}


// Door
function drawDoor() {
    if (door) {
        // Glow effect
        const pulse = Math.sin(Date.now() * 0.005) * 10 + 30;
        const gradient = ctx.createRadialGradient(
            door.x + 40, door.y + 60, 0,
            door.x + 40, door.y + 60, pulse
        );
        gradient.addColorStop(0, 'rgba(0, 255, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(door.x + 40, door.y + 60, pulse, 0, Math.PI * 2);
        ctx.fill();

        // Door frame
        ctx.fillStyle = '#654321';
        ctx.fillRect(door.x, door.y, door.width, door.height);

        // Door
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(door.x + 10, door.y + 10, door.width - 20, door.height - 10);

        // Door knob
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(door.x + 60, door.y + 60, 5, 0, Math.PI * 2);
        ctx.fill();

        // Portal effect inside
        const time = Date.now() * 0.003;
        const portalGradient = ctx.createRadialGradient(
            door.x + 40, door.y + 60, 10,
            door.x + 40, door.y + 60, 30
        );
        portalGradient.addColorStop(0, '#00ffff');
        portalGradient.addColorStop(0.5, '#0080ff');
        portalGradient.addColorStop(1, '#000080');
        ctx.fillStyle = portalGradient;
        ctx.beginPath();
        ctx.ellipse(door.x + 40, door.y + 60, 25, 40, time, 0, Math.PI * 2);
        ctx.fill();

        // Text - show next level number
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`LEVEL ${currentLevel + 1}`, door.x + 40, door.y - 10);

        // Check collision with dragon
        if (dragon.x + dragon.width > door.x &&
            dragon.x < door.x + door.width &&
            dragon.y + dragon.height > door.y &&
            dragon.y < door.y + door.height) {

            // Go to next level
            if (currentLevel === 1) {
                enterLevel2();
            } else if (currentLevel === 2) {
                enterLevel3();
            } else if (currentLevel === 3) {
                enterLevel4();
            } else if (currentLevel === 4) {
                enterLevel5();
            }
        }
    }
}

// Level 2 - Fight dragons
function enterLevel2() {
    currentLevel = 2;
    door = null;
    wardensKilled = 0;
    wardensSpawned = 0;
    bossSpawned = false;
    bossDefeated = false;
    enemyDragonsKilled = 0;
    dragonBossSpawned = false;

    // Clear existing enemies
    wardens.length = 0;
    enemyFire.length = 0;

    // Start spawning enemy dragons
    spawnEnemyDragons();
    powerSound();
}

// Enemy Dragons for Level 2
function spawnEnemyDragons() {
    let dragonsSpawned = 0;
    const maxDragons = 5;

    const spawnInterval = setInterval(() => {
        if (!gameRunning || currentLevel !== 2) {
            clearInterval(spawnInterval);
            return;
        }
        if (dragonsSpawned >= maxDragons) {
            clearInterval(spawnInterval);
            return;
        }

        const enemyDragon = {
            x: Math.random() * (canvas.width - 80),
            y: -70,
            width: 70,
            height: 60,
            health: 15,
            maxHealth: 15,
            speed: 2,
            color: '#00ff00', // Green dragons
            points: 30,
            attackCooldown: 0,
            fireSpitCooldown: 0
        };

        enemyDragons.push(enemyDragon);
        dragonsSpawned++;
    }, 2500);
}

function updateEnemyDragons() {
    for (let i = enemyDragons.length - 1; i >= 0; i--) {
        const eDragon = enemyDragons[i];

        // Move towards player dragon
        const dx = dragon.x - eDragon.x;
        const dy = dragon.y - eDragon.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (eDragon.isDragonBoss && distance > 1) {
            // Dragon Boss: Swooping Zigzag
            eDragon.sweepAngle += 0.05;
            const perpX = -dy / distance;
            const perpY = dx / distance;
            if (distance > 60) {
                eDragon.x += (dx / distance) * eDragon.speed + perpX * Math.sin(eDragon.sweepAngle) * 3;
                eDragon.y += (dy / distance) * eDragon.speed + perpY * Math.sin(eDragon.sweepAngle) * 3;
            } else if (eDragon.attackCooldown <= 0 && !dragon.invisible) {
                lives--;
                eDragon.attackCooldown = 1500;
                damageSound();
                updateLives();
                createParticles(dragon.x, dragon.y, '#ff4757', 10);
                if (lives <= 0) gameOver();
            }
        } else {
            if (distance > 60) {
                eDragon.x += (dx / distance) * eDragon.speed;
                eDragon.y += (dy / distance) * eDragon.speed;
            } else {
                // Attack if close
                if (eDragon.attackCooldown <= 0 && !dragon.invisible) {
                    lives--;
                    eDragon.attackCooldown = 1500;
                    damageSound();
                    updateLives();
                    createParticles(dragon.x, dragon.y, '#ff4757', 10);

                    if (lives <= 0) {
                        gameOver();
                    }
                }
            }
        }

        eDragon.attackCooldown -= 16;

        // Spit fire
        eDragon.fireSpitCooldown -= 16;
        if (eDragon.fireSpitCooldown <= 0) {
            spitFireFromEnemyDragon(eDragon);
            eDragon.fireSpitCooldown = eDragon.isDragonBoss ? 2000 : 3000;
        }

        // Check collision with player fireballs
        for (let j = fireballs.length - 1; j >= 0; j--) {
            const fireball = fireballs[j];
            const dist = Math.sqrt(
                Math.pow(fireball.x - (eDragon.x + eDragon.width / 2), 2) +
                Math.pow(fireball.y - (eDragon.y + eDragon.height / 2), 2)
            );

            if (dist < fireball.radius + 30) {
                eDragon.health -= fireball.damage;
                fireballs.splice(j, 1);
                hitSound();
                createParticles(eDragon.x + 35, eDragon.y + 30, eDragon.color, 5);

                if (eDragon.health <= 0) {
                    score += eDragon.points;
                    updateScore();
                    killSound();
                    createParticles(eDragon.x + 35, eDragon.y + 30, eDragon.color, 20);

                    if (eDragon.isDragonBoss) {
                        // Dragon boss defeated - spawn door to Level 3!
                        createParticles(eDragon.x + eDragon.width/2, eDragon.y + eDragon.height/2, '#ffd700', 100);
                        enemyDragons.splice(i, 1);

                        // Spawn door to Level 3
                        door = {
                            x: canvas.width / 2 - 40,
                            y: canvas.height / 2 - 60,
                            width: 80,
                            height: 120
                        };
                    } else {
                        enemyDragonsKilled++;
                        enemyDragons.splice(i, 1);

                        // Spawn dragon boss after killing 5 dragons
                        if (enemyDragonsKilled >= 5 && !dragonBossSpawned) {
                            setTimeout(() => {
                                spawnDragonBoss();
                            }, 2000);
                        }
                    }
                }
                break;
            }
        }
    }
}

function drawEnemyDragons() {
    enemyDragons.forEach(eDragon => {
        const centerX = eDragon.x + eDragon.width / 2;
        const centerY = eDragon.y + eDragon.height / 2;
        const isBoss = eDragon.isDragonBoss;
        const scale = isBoss ? 2.5 : 1;

        // Dragon color
        const mainColor = isBoss ? '#8b00ff' : '#2ecc71';
        const darkColor = isBoss ? '#6a00cc' : '#27ae60';
        const wingColor = isBoss ? '#9d4edd' : '#1abc9c';

        // Body
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, 25 * scale, 20 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.ellipse(centerX + 20 * scale, centerY - 10 * scale, 15 * scale, 12 * scale, 0, 0, Math.PI * 2);
        ctx.fill();

        // Eye
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(centerX + 25 * scale, centerY - 12 * scale, 4 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        ctx.fillStyle = wingColor;
        ctx.beginPath();
        ctx.ellipse(centerX - 10 * scale, centerY, 15 * scale, 20 * scale, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(centerX + 10 * scale, centerY, 15 * scale, 20 * scale, 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Crown for dragon boss
        if (isBoss) {
            const crownY = eDragon.y - 60;

            // Crown base
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(centerX - 50, crownY + 30);
            ctx.lineTo(centerX - 40, crownY);
            ctx.lineTo(centerX - 20, crownY + 20);
            ctx.lineTo(centerX, crownY - 10);
            ctx.lineTo(centerX + 20, crownY + 20);
            ctx.lineTo(centerX + 40, crownY);
            ctx.lineTo(centerX + 50, crownY + 30);
            ctx.closePath();
            ctx.fill();

            // Crown jewels
            ctx.fillStyle = '#8b00ff';
            ctx.beginPath();
            ctx.arc(centerX - 40, crownY, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX, crownY - 10, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 40, crownY, 6, 0, Math.PI * 2);
            ctx.fill();

            // Boss label
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('DRAGON BOSS', centerX, eDragon.y - 70);
        }

        // Health bar
        const healthPercent = eDragon.health / eDragon.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(eDragon.x, eDragon.y - 10, eDragon.width, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(eDragon.x, eDragon.y - 10, eDragon.width * healthPercent, 5);
    });
}

function spitFireFromEnemyDragon(eDragon) {
    const centerX = eDragon.x + eDragon.width / 2;
    const centerY = eDragon.y + eDragon.height / 2;

    enemyFire.push({
        x: centerX,
        y: centerY,
        radius: eDragon.isDragonBoss ? 15 : 10,
        speed: eDragon.isDragonBoss ? 4 : 3,
        dx: (dragon.x - centerX) / 100,
        dy: (dragon.y - centerY) / 100
    });

    // Dragon boss shoots 3 fireballs
    if (eDragon.isDragonBoss) {
        enemyFire.push({
            x: centerX,
            y: centerY,
            radius: 15,
            speed: 4,
            dx: (dragon.x - centerX - 50) / 100,
            dy: (dragon.y - centerY) / 100
        });
        enemyFire.push({
            x: centerX,
            y: centerY,
            radius: 15,
            speed: 4,
            dx: (dragon.x - centerX + 50) / 100,
            dy: (dragon.y - centerY) / 100
        });
    }

    shootSound();
}

// Dragon Boss for Level 2
function spawnDragonBoss() {
    dragonBossSpawned = true;

    const dragonBoss = {
        x: canvas.width / 2 - 100,
        y: -150,
        width: 200,
        height: 180,
        health: 30,
        maxHealth: 30,
        speed: 1.5,
        color: '#8b00ff', // Purple dragon boss
        points: 200,
        attackCooldown: 0,
        fireSpitCooldown: 0,
        isDragonBoss: true,
        sweepAngle: 0
    };

    enemyDragons.push(dragonBoss);
    damageSound();
}

// ===== LEVEL 3: SKELETON WARRIORS =====

function enterLevel3() {
    currentLevel = 3;
    door = null;
    wardensKilled = 0;
    wardensSpawned = 0;
    bossSpawned = false;
    bossDefeated = false;
    enemyDragonsKilled = 0;
    dragonBossSpawned = false;
    skeletonsKilled = 0;
    skeletonBossSpawned = false;

    // Clear existing enemies
    wardens.length = 0;
    enemyDragons.length = 0;
    enemyFire.length = 0;
    enemyProjectiles.length = 0;

    // Start spawning skeletons
    spawnSkeletons();
    powerSound();
}

// Skeleton spawning for Level 3
function spawnSkeletons() {
    let skeletonsSpawned = 0;
    const maxSkeletons = 7;

    const spawnInterval = setInterval(() => {
        if (!gameRunning || currentLevel !== 3) {
            clearInterval(spawnInterval);
            return;
        }

        if (skeletonsSpawned >= maxSkeletons) {
            clearInterval(spawnInterval);
            return;
        }

        const skeleton = {
            x: Math.random() * (canvas.width - 60),
            y: -70,
            width: 60,
            height: 70,
            health: 7,
            maxHealth: 7,
            speed: 2.5,
            color: '#e0e0e0', // Light gray
            points: 20,
            attackCooldown: 0,
            throwCooldown: 0,
            isSkeletonBoss: false
        };

        skeletons.push(skeleton);
        skeletonsSpawned++;
    }, 2000);
}

// Skeleton King Boss
function spawnSkeletonKing() {
    skeletonBossSpawned = true;

    const skeletonKing = {
        x: canvas.width / 2 - 75,
        y: -140,
        width: 150,
        height: 210,
        health: 40,
        maxHealth: 40,
        speed: 1.2,
        color: '#ffffff', // White
        points: 250,
        attackCooldown: 0,
        throwCooldown: 0,
        isSkeletonBoss: true,
        hasSummonedHelpers: false,
        orbitAngle: 0,
        closingIn: false,
        closeInTimer: 5000
    };

    skeletons.push(skeletonKing);
    damageSound();
}

// Update skeletons
function updateSkeletons() {
    for (let i = skeletons.length - 1; i >= 0; i--) {
        const skeleton = skeletons[i];

        // Move towards player
        const dx = dragon.x - skeleton.x;
        const dy = dragon.y - skeleton.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (skeleton.isSkeletonBoss && distance > 1) {
            // Skeleton King: Circle & Close
            const orbitRadius = 180;
            skeleton.closeInTimer -= 16;
            if (!skeleton.closingIn) {
                // Orbit around the player
                skeleton.orbitAngle += 0.02;
                const targetX = dragon.x + Math.cos(skeleton.orbitAngle) * orbitRadius;
                const targetY = dragon.y + Math.sin(skeleton.orbitAngle) * orbitRadius;
                const odx = targetX - skeleton.x;
                const ody = targetY - skeleton.y;
                const odist = Math.sqrt(odx * odx + ody * ody);
                if (odist > 5) {
                    skeleton.x += (odx / odist) * 2.5;
                    skeleton.y += (ody / odist) * 2.5;
                }
                if (skeleton.closeInTimer <= 0) {
                    skeleton.closingIn = true;
                    skeleton.closeInTimer = 1500;
                }
            } else {
                // Charge straight in for 1.5s then retreat back to orbit
                if (distance > 50) {
                    skeleton.x += (dx / distance) * 4;
                    skeleton.y += (dy / distance) * 4;
                } else if (skeleton.attackCooldown <= 0 && !dragon.invisible) {
                    lives--;
                    skeleton.attackCooldown = 1500;
                    damageSound();
                    updateLives();
                    createParticles(dragon.x, dragon.y, '#ff4757', 10);
                    if (lives <= 0) gameOver();
                }
                if (skeleton.closeInTimer <= 0) {
                    skeleton.closingIn = false;
                    skeleton.closeInTimer = 5000;
                }
            }
        } else {
            if (distance > 60) {
                skeleton.x += (dx / distance) * skeleton.speed;
                skeleton.y += (dy / distance) * skeleton.speed;
            } else {
                // Melee attack if close
                if (skeleton.attackCooldown <= 0 && !dragon.invisible) {
                    lives--;
                    skeleton.attackCooldown = 1500;
                    damageSound();
                    updateLives();
                    createParticles(dragon.x, dragon.y, '#ff4757', 10);

                    if (lives <= 0) {
                        gameOver();
                    }
                }
            }
        }

        skeleton.attackCooldown -= 16;

        // Throw bones/skulls
        skeleton.throwCooldown -= 16;
        if (skeleton.throwCooldown <= 0) {
            if (skeleton.isSkeletonBoss) {
                throwSkull(skeleton); // Boss throws skulls
            } else {
                throwBone(skeleton); // Regular skeletons throw bones
            }
            skeleton.throwCooldown = skeleton.isSkeletonBoss ? 2000 : 3000;
        }

        // Skeleton King summons helpers at 50% health
        if (skeleton.isSkeletonBoss && skeleton.health <= 20 && !skeleton.hasSummonedHelpers) {
            skeleton.hasSummonedHelpers = true;
            summonMiniSkeletons();
        }

        // Check collision with player fireballs
        for (let j = fireballs.length - 1; j >= 0; j--) {
            const fireball = fireballs[j];
            const dist = Math.sqrt(
                Math.pow(fireball.x - (skeleton.x + skeleton.width / 2), 2) +
                Math.pow(fireball.y - (skeleton.y + skeleton.height / 2), 2)
            );

            if (dist < fireball.radius + 30) {
                // 30% chance for regular skeletons to dodge
                if (!skeleton.isSkeletonBoss && Math.random() < 0.3) {
                    // Dodged! Visual feedback
                    createParticles(skeleton.x + 30, skeleton.y + 35, '#ffffff', 5);
                    powerSound();
                    fireballs.splice(j, 1);
                    break;
                }

                skeleton.health -= fireball.damage;
                fireballs.splice(j, 1);
                hitSound();
                createParticles(skeleton.x + skeleton.width/2, skeleton.y + skeleton.height/2, skeleton.color, 5);

                if (skeleton.health <= 0) {
                    score += skeleton.points;
                    updateScore();
                    killSound();
                    createParticles(skeleton.x + skeleton.width/2, skeleton.y + skeleton.height/2, skeleton.color, 20);

                    if (skeleton.isSkeletonBoss) {
                        // Skeleton King defeated - spawn door to Level 4!
                        createParticles(skeleton.x + skeleton.width/2, skeleton.y + skeleton.height/2, '#ffd700', 100);
                        skeletons.splice(i, 1);

                        // Spawn magical door to Level 4
                        door = {
                            x: canvas.width / 2 - 40,
                            y: canvas.height / 2 - 60,
                            width: 80,
                            height: 120
                        };
                    } else {
                        skeletonsKilled++;
                        skeletons.splice(i, 1);

                        // Spawn Skeleton King after killing 7 skeletons
                        if (skeletonsKilled >= 7 && !skeletonBossSpawned) {
                            setTimeout(() => {
                                spawnSkeletonKing();
                            }, 2000);
                        }
                    }
                }
                break;
            }
        }
    }
}

// Throw bone (regular skeletons)
function throwBone(skeleton) {
    const centerX = skeleton.x + skeleton.width / 2;
    const centerY = skeleton.y + skeleton.height / 2;

    enemyProjectiles.push({
        x: centerX,
        y: centerY,
        width: 20,
        height: 8,
        speed: 4,
        damage: 1,
        dx: (dragon.x - centerX) / 100,
        dy: (dragon.y - centerY) / 100,
        type: 'bone',
        rotation: 0
    });

    shootSound();
}

// Throw skull (Skeleton King)
function throwSkull(skeleton) {
    const centerX = skeleton.x + skeleton.width / 2;
    const centerY = skeleton.y + skeleton.height / 2;

    // Boss throws 3 skulls
    for (let i = -1; i <= 1; i++) {
        enemyProjectiles.push({
            x: centerX,
            y: centerY,
            width: 25,
            height: 25,
            speed: 3.5,
            damage: 2,
            dx: (dragon.x + i * 100 - centerX) / 100,
            dy: (dragon.y - centerY) / 100,
            type: 'skull',
            rotation: 0
        });
    }

    shootSound();
}

// Summon mini skeletons (when Skeleton King at 50% health)
function summonMiniSkeletons() {
    for (let i = 0; i < 2; i++) {
        const miniSkeleton = {
            x: Math.random() * (canvas.width - 60),
            y: -70,
            width: 50,
            height: 60,
            health: 5,
            maxHealth: 5,
            speed: 3,
            color: '#d0d0d0',
            points: 15,
            attackCooldown: 0,
            throwCooldown: Math.random() * 2000,
            isSkeletonBoss: false
        };
        skeletons.push(miniSkeleton);
    }
    powerSound();
}

// ===== LEVEL 4: DARK WIZARDS =====

function enterLevel4() {
    currentLevel = 4;
    door = null;
    wardensKilled = 0;
    wardensSpawned = 0;
    bossSpawned = false;
    bossDefeated = false;
    enemyDragonsKilled = 0;
    dragonBossSpawned = false;
    skeletonsKilled = 0;
    skeletonBossSpawned = false;
    wizardsKilled = 0;
    wizardBossSpawned = false;

    // Clear existing enemies
    wardens.length = 0;
    enemyDragons.length = 0;
    skeletons.length = 0;
    enemyFire.length = 0;
    enemyProjectiles.length = 0;

    spawnWizards();
    powerSound();
}

function spawnWizards() {
    let wizardsSpawned = 0;
    const maxWizards = 8;

    const spawnInterval = setInterval(() => {
        if (!gameRunning || currentLevel !== 4) {
            clearInterval(spawnInterval);
            return;
        }
        if (wizardsSpawned >= maxWizards) {
            clearInterval(spawnInterval);
            return;
        }

        const wizard = {
            x: Math.random() * (canvas.width - 60),
            y: -80,
            width: 55,
            height: 80,
            health: 8,
            maxHealth: 8,
            speed: 1.8,
            color: '#9b00ff',
            points: 35,
            attackCooldown: 0,
            boltCooldown: Math.random() * 2000,
            teleportCooldown: Math.random() * 5000 + 4000,
            isWizardBoss: false
        };

        wizards.push(wizard);
        wizardsSpawned++;
    }, 1800);
}

function spawnDarkWizard() {
    wizardBossSpawned = true;

    const darkWizard = {
        x: canvas.width / 2 - 60,
        y: -160,
        width: 120,
        height: 160,
        health: 50,
        maxHealth: 50,
        speed: 1.0,
        color: '#4b0082',
        points: 300,
        attackCooldown: 0,
        boltCooldown: 0,
        teleportCooldown: 8000,
        isWizardBoss: true,
        hasSummonedHelpers: false,
        strafeAngle: 0
    };

    wizards.push(darkWizard);
    damageSound();
}

function updateWizards() {
    for (let i = wizards.length - 1; i >= 0; i--) {
        const wizard = wizards[i];

        // Move towards player
        const dx = dragon.x - wizard.x;
        const dy = dragon.y - wizard.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Wizards keep their distance and cast spells
        const preferredDistance = wizard.isWizardBoss ? 200 : 160;
        if (wizard.isWizardBoss && distance > 1) {
            // Dark Wizard: strafe while maintaining distance
            wizard.strafeAngle += 0.03;
            const perpX = -dy / distance;
            const perpY = dx / distance;
            if (distance > preferredDistance + 20) {
                wizard.x += (dx / distance) * wizard.speed;
                wizard.y += (dy / distance) * wizard.speed;
            } else if (distance < preferredDistance - 40) {
                wizard.x -= (dx / distance) * wizard.speed;
                wizard.y -= (dy / distance) * wizard.speed;
            } else {
                // Strafe sideways while holding range
                wizard.x += perpX * Math.sin(wizard.strafeAngle) * 2.5;
                wizard.y += perpY * Math.sin(wizard.strafeAngle) * 2.5;
            }
        } else {
            if (distance > preferredDistance) {
                wizard.x += (dx / distance) * wizard.speed;
                wizard.y += (dy / distance) * wizard.speed;
            } else if (distance < preferredDistance - 40) {
                wizard.x -= (dx / distance) * wizard.speed;
                wizard.y -= (dy / distance) * wizard.speed;
            }
        }

        // Melee if very close
        wizard.attackCooldown -= 16;
        if (distance < 60 && wizard.attackCooldown <= 0 && !dragon.invisible) {
            lives--;
            wizard.attackCooldown = 1500;
            damageSound();
            updateLives();
            createParticles(dragon.x, dragon.y, '#aa00ff', 10);
            if (lives <= 0) gameOver();
        }

        // Cast magic bolts
        wizard.boltCooldown -= 16;
        if (wizard.boltCooldown <= 0) {
            castMagicBolt(wizard);
            wizard.boltCooldown = wizard.isWizardBoss ? 1800 : 2800;
        }

        // Teleport
        wizard.teleportCooldown -= 16;
        if (wizard.teleportCooldown <= 0) {
            createParticles(wizard.x + wizard.width/2, wizard.y + wizard.height/2, '#9b00ff', 15);
            wizard.x = Math.random() * (canvas.width - wizard.width - 40) + 20;
            wizard.y = Math.random() * (canvas.height / 2 - 40) + 20;
            createParticles(wizard.x + wizard.width/2, wizard.y + wizard.height/2, '#9b00ff', 15);
            wizard.teleportCooldown = wizard.isWizardBoss
                ? Math.random() * 2000 + 8000
                : Math.random() * 3000 + 4000;
            powerSound();
        }

        // Dark Wizard summons helpers at 50% health
        if (wizard.isWizardBoss && wizard.health <= 25 && !wizard.hasSummonedHelpers) {
            wizard.hasSummonedHelpers = true;
            summonMiniWizards();
        }

        // Check collision with fireballs
        for (let j = fireballs.length - 1; j >= 0; j--) {
            const fireball = fireballs[j];
            const dist = Math.sqrt(
                Math.pow(fireball.x - (wizard.x + wizard.width / 2), 2) +
                Math.pow(fireball.y - (wizard.y + wizard.height / 2), 2)
            );

            if (dist < fireball.radius + 28) {
                // 20% chance for regular wizards to blink-dodge
                if (!wizard.isWizardBoss && Math.random() < 0.2) {
                    createParticles(wizard.x + 27, wizard.y + 40, '#9b00ff', 5);
                    powerSound();
                    fireballs.splice(j, 1);
                    break;
                }

                wizard.health -= fireball.damage;
                fireballs.splice(j, 1);
                hitSound();
                createParticles(wizard.x + wizard.width/2, wizard.y + wizard.height/2, '#9b00ff', 5);

                if (wizard.health <= 0) {
                    score += wizard.points;
                    updateScore();
                    killSound();
                    createParticles(wizard.x + wizard.width/2, wizard.y + wizard.height/2, '#ff00ff', 25);

                    if (wizard.isWizardBoss) {
                        // Dark Wizard defeated — spawn door to Level 5!
                        createParticles(wizard.x + wizard.width/2, wizard.y + wizard.height/2, '#ffd700', 150);
                        wizards.splice(i, 1);
                        door = {
                            x: canvas.width / 2 - 40,
                            y: canvas.height / 2 - 60,
                            width: 80,
                            height: 120
                        };
                    } else {
                        wizardsKilled++;
                        wizards.splice(i, 1);

                        if (wizardsKilled >= 8 && !wizardBossSpawned) {
                            setTimeout(() => { spawnDarkWizard(); }, 2000);
                        }
                    }
                }
                break;
            }
        }
    }
}

function castMagicBolt(wizard) {
    const centerX = wizard.x + wizard.width / 2;
    const centerY = wizard.y + wizard.height / 2;

    if (wizard.isWizardBoss) {
        // Boss fires 5 bolts in a spread
        for (let i = -2; i <= 2; i++) {
            enemyProjectiles.push({
                x: centerX,
                y: centerY,
                width: 20,
                height: 20,
                speed: 4,
                damage: 2,
                dx: (dragon.x + i * 80 - centerX) / 100,
                dy: (dragon.y - centerY) / 100,
                type: 'magicBolt',
                isBoss: true,
                rotation: 0
            });
        }
    } else {
        // Regular wizards fire 1 aimed bolt
        enemyProjectiles.push({
            x: centerX,
            y: centerY,
            width: 14,
            height: 14,
            speed: 5,
            damage: 1,
            dx: (dragon.x - centerX) / 100,
            dy: (dragon.y - centerY) / 100,
            type: 'magicBolt',
            isBoss: false,
            rotation: 0
        });
    }
    shootSound();
}

function summonMiniWizards() {
    for (let i = 0; i < 3; i++) {
        const miniWizard = {
            x: Math.random() * (canvas.width - 50),
            y: -80,
            width: 45,
            height: 65,
            health: 5,
            maxHealth: 5,
            speed: 2.5,
            color: '#cc44ff',
            points: 20,
            attackCooldown: 0,
            boltCooldown: Math.random() * 1500,
            teleportCooldown: Math.random() * 3000 + 3000,
            isWizardBoss: false
        };
        wizards.push(miniWizard);
    }
    powerSound();
}

function drawWizards() {
    wizards.forEach(wizard => {
        const cx = wizard.x + wizard.width / 2;
        const cy = wizard.y;
        const isBoss = wizard.isWizardBoss;
        const s = isBoss ? 1 : 0.7; // scale factor

        // Robe body
        ctx.fillStyle = wizard.color;
        ctx.beginPath();
        ctx.moveTo(cx - 28 * s, cy + 80 * s);
        ctx.lineTo(cx - 20 * s, cy + 30 * s);
        ctx.lineTo(cx + 20 * s, cy + 30 * s);
        ctx.lineTo(cx + 28 * s, cy + 80 * s);
        ctx.closePath();
        ctx.fill();

        // Head
        ctx.fillStyle = '#f4c98c';
        ctx.beginPath();
        ctx.arc(cx, cy + 20 * s, 14 * s, 0, Math.PI * 2);
        ctx.fill();

        // Eyes (glowing purple)
        ctx.fillStyle = '#cc00ff';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#cc00ff';
        ctx.beginPath();
        ctx.arc(cx - 5 * s, cy + 18 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 5 * s, cy + 18 * s, 3 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Wizard hat
        ctx.fillStyle = isBoss ? '#1a0040' : '#2a0060';
        ctx.beginPath();
        ctx.moveTo(cx - 20 * s, cy + 8 * s);
        ctx.lineTo(cx + 20 * s, cy + 8 * s);
        ctx.lineTo(cx, cy - 35 * s);
        ctx.closePath();
        ctx.fill();

        // Hat brim
        ctx.fillStyle = isBoss ? '#2a0060' : '#3a0080';
        ctx.fillRect(cx - 22 * s, cy + 6 * s, 44 * s, 6 * s);

        // Hat star
        ctx.fillStyle = '#ffd700';
        ctx.font = `${Math.round(12 * s)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('★', cx, cy - 5 * s);

        // Staff
        ctx.strokeStyle = '#8b4513';
        ctx.lineWidth = 3 * s;
        ctx.beginPath();
        ctx.moveTo(cx + 18 * s, cy + 30 * s);
        ctx.lineTo(cx + 22 * s, cy + 80 * s);
        ctx.stroke();

        // Staff orb
        ctx.fillStyle = '#cc00ff';
        ctx.shadowBlur = 12;
        ctx.shadowColor = '#cc00ff';
        ctx.beginPath();
        ctx.arc(cx + 18 * s, cy + 25 * s, 8 * s, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Health bar
        const barW = wizard.width + 10;
        const barX = wizard.x - 5;
        const barY = wizard.y - 12;
        ctx.fillStyle = '#333';
        ctx.fillRect(barX, barY, barW, 6);
        ctx.fillStyle = isBoss ? '#ff00ff' : '#9b00ff';
        ctx.fillRect(barX, barY, barW * (wizard.health / wizard.maxHealth), 6);

        // Crown for Dark Wizard boss
        if (isBoss) {
            const crownY = cy - 40;
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(cx - 20, crownY + 15);
            ctx.lineTo(cx - 15, crownY);
            ctx.lineTo(cx - 7, crownY + 10);
            ctx.lineTo(cx, crownY - 8);
            ctx.lineTo(cx + 7, crownY + 10);
            ctx.lineTo(cx + 15, crownY);
            ctx.lineTo(cx + 20, crownY + 15);
            ctx.closePath();
            ctx.fill();
        }
    });
}

// ===== LEVEL 5: ELECTRIC EELS =====

function enterLevel5() {
    currentLevel = 5;
    door = null;
    wardensKilled = 0; wardensSpawned = 0;
    bossSpawned = false; bossDefeated = false;
    enemyDragonsKilled = 0; dragonBossSpawned = false;
    skeletonsKilled = 0; skeletonBossSpawned = false;
    wizardsKilled = 0; wizardBossSpawned = false;
    eelsKilled = 0; jellyfishBossSpawned = false;

    wardens.length = 0;
    enemyDragons.length = 0;
    skeletons.length = 0;
    wizards.length = 0;
    eels.length = 0;
    enemyFire.length = 0;
    enemyProjectiles.length = 0;

    spawnEels();
    powerSound();
}

function spawnEels() {
    let eelsSpawned = 0;
    const maxEels = 8;

    const spawnInterval = setInterval(() => {
        if (!gameRunning || currentLevel !== 5) { clearInterval(spawnInterval); return; }
        if (eelsSpawned >= maxEels) { clearInterval(spawnInterval); return; }

        // Eels enter from the sides
        const fromLeft = Math.random() < 0.5;
        const eel = {
            x: fromLeft ? -90 : canvas.width + 90,
            y: Math.random() * (canvas.height - 100) + 50,
            width: 90,
            height: 22,
            health: 6,
            maxHealth: 6,
            speed: 0.9,
            points: 40,
            boltCooldown: Math.random() * 2000 + 1500,
            hasBeenHit: false,
            zigzagTimer: 0,
            zigzagTargetX: 0,
            zigzagTargetY: 0,
            angle: Math.random() * Math.PI * 2,
            isJellyfishBoss: false
        };

        eels.push(eel);
        eelsSpawned++;
    }, 2000);
}

function spawnJellyfish() {
    jellyfishBossSpawned = true;

    const jellyfish = {
        x: canvas.width / 2 - 70,
        y: -160,
        width: 140,
        height: 130,
        health: 60,
        maxHealth: 60,
        speed: 0.7,
        points: 350,
        boltCooldown: 0,
        hasBeenHit: false,
        zigzagTimer: 0,
        zigzagTargetX: 0,
        zigzagTargetY: 0,
        pulseTimer: 0,
        angle: 0,
        isJellyfishBoss: true
    };

    eels.push(jellyfish);
    damageSound();
}

function updateEels() {
    for (let i = eels.length - 1; i >= 0; i--) {
        const eel = eels[i];

        eel.angle += 0.05;
        if (eel.isJellyfishBoss) eel.pulseTimer += 0.05;

        const dx = (dragon.x + dragon.width / 2) - (eel.x + eel.width / 2);
        const dy = (dragon.y + dragon.height / 2) - (eel.y + eel.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (eel.zigzagTimer > 0) {
            // Zigzag away from fire — fast burst to random spot
            const zdx = eel.zigzagTargetX - eel.x;
            const zdy = eel.zigzagTargetY - eel.y;
            const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
            if (zdist > 10) {
                const spd = eel.isJellyfishBoss ? 3.5 : 5;
                eel.x += (zdx / zdist) * spd;
                eel.y += (zdy / zdist) * spd;
            }
            eel.zigzagTimer -= 16;
        } else {
            // Normal: orbit at preferred distance, never get too close
            const preferred = eel.isJellyfishBoss ? 260 : 210;
            if (distance > preferred + 20) {
                eel.x += (dx / distance) * eel.speed;
                eel.y += (dy / distance) * eel.speed;
            } else if (distance < preferred - 20) {
                eel.x -= (dx / distance) * eel.speed;
                eel.y -= (dy / distance) * eel.speed;
            } else {
                // Orbit slowly around the dragon
                const perpX = -dy / distance;
                const perpY = dx / distance;
                eel.x += perpX * eel.speed * 0.6;
                eel.y += perpY * eel.speed * 0.6;
            }
        }

        // Shoot electricity
        eel.boltCooldown -= 16;
        if (eel.boltCooldown <= 0) {
            shootElectricBolt(eel);
            eel.boltCooldown = eel.isJellyfishBoss ? 1500 : 3000;
        }

        // Check fireball collision
        for (let j = fireballs.length - 1; j >= 0; j--) {
            const fireball = fireballs[j];
            const dist = Math.sqrt(
                Math.pow(fireball.x - (eel.x + eel.width / 2), 2) +
                Math.pow(fireball.y - (eel.y + eel.height / 2), 2)
            );

            if (dist < fireball.radius + (eel.isJellyfishBoss ? 60 : 22)) {
                eel.health -= fireball.damage;
                fireballs.splice(j, 1);
                hitSound();
                createParticles(eel.x + eel.width / 2, eel.y + eel.height / 2, '#00ffff', 6);

                // First hit: zigzag away immediately, then back to normal
                if (!eel.hasBeenHit) {
                    eel.hasBeenHit = true;
                    const angle = Math.random() * Math.PI * 2;
                    const dist2 = 160 + Math.random() * 120;
                    eel.zigzagTargetX = Math.max(60, Math.min(canvas.width - 60, eel.x + Math.cos(angle) * dist2));
                    eel.zigzagTargetY = Math.max(60, Math.min(canvas.height - 60, eel.y + Math.sin(angle) * dist2));
                    eel.zigzagTimer = 700;
                }

                if (eel.health <= 0) {
                    score += eel.points;
                    updateScore();
                    killSound();
                    createParticles(eel.x + eel.width / 2, eel.y + eel.height / 2, '#00ffff', 25);

                    if (eel.isJellyfishBoss) {
                        createParticles(eel.x + eel.width / 2, eel.y + eel.height / 2, '#ffd700', 150);
                        eels.splice(i, 1);
                        setTimeout(() => { victory(); }, 1500);
                    } else {
                        eelsKilled++;
                        eels.splice(i, 1);
                        if (eelsKilled >= 8 && !jellyfishBossSpawned) {
                            setTimeout(() => { spawnJellyfish(); }, 2000);
                        }
                    }
                }
                break;
            }
        }
    }
}

function shootElectricBolt(eel) {
    const cx = eel.x + eel.width / 2;
    const cy = eel.y + eel.height / 2;

    if (eel.isJellyfishBoss) {
        // Boss fires 4 spread bolts
        for (let i = -1; i <= 2; i++) {
            enemyProjectiles.push({
                x: cx, y: cy,
                speed: 4.5, damage: 2,
                dx: (dragon.x + i * 60 - cx) / 100,
                dy: (dragon.y - cy) / 100,
                type: 'electricBolt', isBoss: true, rotation: 0
            });
        }
    } else {
        enemyProjectiles.push({
            x: cx, y: cy,
            speed: 4, damage: 1,
            dx: (dragon.x - cx) / 100,
            dy: (dragon.y - cy) / 100,
            type: 'electricBolt', isBoss: false, rotation: 0
        });
    }
    shootSound();
}

function drawEels() {
    if (currentLevel === 5) {
        // Underwater blue tint overlay
        ctx.fillStyle = 'rgba(0, 30, 80, 0.35)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Floating bubbles effect
        if (Math.random() < 0.4) {
            createParticles(
                Math.random() * canvas.width,
                canvas.height,
                'rgba(100, 200, 255, 0.6)',
                1
            );
        }
    }

    eels.forEach(eel => {
        if (eel.isJellyfishBoss) {
            drawJellyfish(eel);
        } else {
            drawEel(eel);
        }
    });
}

function drawEel(eel) {
    const cx = eel.x + eel.width / 2;
    const cy = eel.y + eel.height / 2;
    const t = eel.angle;

    ctx.save();
    ctx.shadowBlur = 14;
    ctx.shadowColor = '#00ffcc';

    // Body — wavy segments
    ctx.strokeStyle = eel.hasBeenHit ? '#00ffaa' : '#00cc88';
    ctx.lineWidth = 11;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    for (let s = 1; s <= 6; s++) {
        ctx.lineTo(cx - s * 13, cy + Math.sin(t + s * 0.9) * 9);
    }
    ctx.stroke();

    // Head
    ctx.fillStyle = '#00aa66';
    ctx.beginPath();
    ctx.arc(cx, cy, 13, 0, Math.PI * 2);
    ctx.fill();

    // Eye
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx + 6, cy - 4, 2, 0, Math.PI * 2);
    ctx.fill();

    // Random spark
    if (Math.random() < 0.25) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 8;
        const sx = cx + (Math.random() - 0.5) * 50;
        const sy = cy + (Math.random() - 0.5) * 15;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (Math.random() - 0.5) * 14, sy + (Math.random() - 0.5) * 14);
        ctx.stroke();
    }

    // Health bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#333';
    ctx.fillRect(eel.x - 5, eel.y - 18, eel.width + 10, 5);
    ctx.fillStyle = '#00ffcc';
    ctx.fillRect(eel.x - 5, eel.y - 18, (eel.width + 10) * (eel.health / eel.maxHealth), 5);

    ctx.restore();
}

function drawJellyfish(jelly) {
    const cx = jelly.x + jelly.width / 2;
    const cy = jelly.y + jelly.height / 2;
    const pulse = Math.sin(jelly.pulseTimer) * 8;

    ctx.save();
    ctx.shadowBlur = 25;
    ctx.shadowColor = '#00ffff';

    // Bell dome (pulsing)
    const bw = 65 + pulse;
    const bh = 50 + pulse * 0.5;
    ctx.fillStyle = 'rgba(0, 180, 255, 0.7)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 20, bw, bh, 0, Math.PI, 0);
    ctx.fill();

    // Inner glow
    ctx.fillStyle = 'rgba(150, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(cx, cy - 28, bw * 0.55, bh * 0.55, 0, Math.PI, 0);
    ctx.fill();

    // Tentacles
    for (let t = 0; t < 6; t++) {
        const tx = cx - bw * 0.8 + (t / 5) * bw * 1.6;
        const wave = Math.sin(jelly.pulseTimer + t * 0.8) * 20;
        ctx.strokeStyle = 'rgba(0, 200, 255, 0.8)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(tx, cy + 20);
        ctx.bezierCurveTo(tx + wave, cy + 50, tx - wave, cy + 80, tx + wave * 0.5, cy + 115);
        ctx.stroke();

        // Electric sparks on tentacles
        if (Math.random() < 0.2) {
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 1.5;
            ctx.shadowColor = '#ffff00';
            ctx.beginPath();
            ctx.moveTo(tx + wave, cy + 55);
            ctx.lineTo(tx + wave + (Math.random() - 0.5) * 18, cy + 65);
            ctx.stroke();
        }
    }

    // Eyes
    ctx.shadowColor = '#ffff00';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffff00';
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 30, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.shadowBlur = 0;
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 30, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 20, cy - 30, 3, 0, Math.PI * 2);
    ctx.fill();

    // Crown
    const crownY = cy - 75 - pulse * 0.3;
    ctx.fillStyle = '#ffd700';
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(cx - 25, crownY + 15);
    ctx.lineTo(cx - 18, crownY);
    ctx.lineTo(cx - 9, crownY + 11);
    ctx.lineTo(cx, crownY - 8);
    ctx.lineTo(cx + 9, crownY + 11);
    ctx.lineTo(cx + 18, crownY);
    ctx.lineTo(cx + 25, crownY + 15);
    ctx.closePath();
    ctx.fill();

    // Health bar
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#333';
    ctx.fillRect(jelly.x - 5, jelly.y - 20, jelly.width + 10, 7);
    ctx.fillStyle = '#00ffff';
    ctx.fillRect(jelly.x - 5, jelly.y - 20, (jelly.width + 10) * (jelly.health / jelly.maxHealth), 7);

    ctx.restore();
}

// Update enemy projectiles (bones, skulls, magic bolts, and electric bolts)
function updateEnemyProjectiles() {
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
        const proj = enemyProjectiles[i];

        // Move projectile
        proj.x += proj.dx * proj.speed * 10;
        proj.y += proj.dy * proj.speed * 10;
        proj.rotation += 0.1;

        // Remove if off screen
        if (proj.x < -50 || proj.x > canvas.width + 50 || proj.y < -50 || proj.y > canvas.height + 50) {
            enemyProjectiles.splice(i, 1);
            continue;
        }

        // Check collision with player
        if (!dragon.invisible) {
            const dist = Math.sqrt(
                Math.pow(proj.x - (dragon.x + dragon.width / 2), 2) +
                Math.pow(proj.y - (dragon.y + dragon.height / 2), 2)
            );

            if (dist < 30) {
                lives -= proj.damage;
                updateLives();
                damageSound();
                createParticles(dragon.x + dragon.width/2, dragon.y + dragon.height/2, '#ffffff', 10);
                enemyProjectiles.splice(i, 1);

                if (lives <= 0) {
                    gameOver();
                }
            }
        }
    }
}

// Draw skeletons
function drawSkeletons() {
    skeletons.forEach(skeleton => {
        const centerX = skeleton.x + skeleton.width / 2;
        const centerY = skeleton.y + skeleton.height / 2;
        const isBoss = skeleton.isSkeletonBoss;
        const scale = isBoss ? 1 : 1;

        // Skeleton body (simple stick figure style)
        ctx.strokeStyle = skeleton.color;
        ctx.lineWidth = isBoss ? 6 : 4;

        // Head (skull)
        ctx.fillStyle = skeleton.color;
        ctx.beginPath();
        ctx.arc(centerX, skeleton.y + 15 * scale, 15 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Eye sockets (dark)
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(centerX - 6 * scale, skeleton.y + 12 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(centerX + 6 * scale, skeleton.y + 12 * scale, 3 * scale, 0, Math.PI * 2);
        ctx.fill();

        // Body (ribcage)
        ctx.strokeStyle = skeleton.color;
        ctx.beginPath();
        ctx.moveTo(centerX, skeleton.y + 30 * scale);
        ctx.lineTo(centerX, skeleton.y + 60 * scale);
        ctx.stroke();

        // Ribs
        for (let i = 0; i < 3; i++) {
            const ribY = skeleton.y + (35 + i * 8) * scale;
            ctx.beginPath();
            ctx.moveTo(centerX - 10 * scale, ribY);
            ctx.lineTo(centerX + 10 * scale, ribY);
            ctx.stroke();
        }

        // Arms
        ctx.beginPath();
        ctx.moveTo(centerX - 15 * scale, skeleton.y + 35 * scale);
        ctx.lineTo(centerX - 25 * scale, skeleton.y + 50 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX + 15 * scale, skeleton.y + 35 * scale);
        ctx.lineTo(centerX + 25 * scale, skeleton.y + 50 * scale);
        ctx.stroke();

        // Legs
        ctx.beginPath();
        ctx.moveTo(centerX, skeleton.y + 60 * scale);
        ctx.lineTo(centerX - 10 * scale, skeleton.y + 80 * scale);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(centerX, skeleton.y + 60 * scale);
        ctx.lineTo(centerX + 10 * scale, skeleton.y + 80 * scale);
        ctx.stroke();

        // Crown for Skeleton King
        if (isBoss) {
            const crownY = skeleton.y - 10;

            // Crown base
            ctx.fillStyle = '#ffd700';
            ctx.beginPath();
            ctx.moveTo(centerX - 25, crownY + 20);
            ctx.lineTo(centerX - 20, crownY);
            ctx.lineTo(centerX - 10, crownY + 15);
            ctx.lineTo(centerX, crownY - 5);
            ctx.lineTo(centerX + 10, crownY + 15);
            ctx.lineTo(centerX + 20, crownY);
            ctx.lineTo(centerX + 25, crownY + 20);
            ctx.closePath();
            ctx.fill();

            // Crown jewels
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(centerX - 20, crownY, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX, crownY - 5, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(centerX + 20, crownY, 4, 0, Math.PI * 2);
            ctx.fill();

            // Boss label
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('SKELETON KING', centerX, skeleton.y - 30);
        }

        // Health bar
        const healthPercent = skeleton.health / skeleton.maxHealth;
        ctx.fillStyle = '#333';
        ctx.fillRect(skeleton.x, skeleton.y - 10, skeleton.width, 5);
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(skeleton.x, skeleton.y - 10, skeleton.width * healthPercent, 5);
    });
}

// Draw enemy projectiles (bones and skulls)
function drawEnemyProjectiles() {
    enemyProjectiles.forEach(proj => {
        ctx.save();
        ctx.translate(proj.x, proj.y);
        ctx.rotate(proj.rotation);

        if (proj.type === 'bone') {
            // Draw bone
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(-10, -4, 20, 8);
            ctx.beginPath();
            ctx.arc(-10, 0, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(10, 0, 5, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'skull') {
            // Draw skull
            ctx.fillStyle = '#e0e0e0';
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.fill();

            // Eye sockets
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.arc(-5, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(5, -2, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (proj.type === 'electricBolt') {
            // Draw electric bolt (jagged lightning shape)
            const color = proj.isBoss ? '#ffff00' : '#00ffff';
            ctx.shadowBlur = 14;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(-7, -3);
            ctx.lineTo(0, -9);
            ctx.lineTo(2, -1);
            ctx.lineTo(8, -6);
            ctx.lineTo(4, 4);
            ctx.lineTo(8, 4);
            ctx.lineTo(0, 10);
            ctx.lineTo(-2, 1);
            ctx.lineTo(-8, 6);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (proj.type === 'magicBolt') {
            // Draw magic bolt (glowing star)
            const color = proj.isBoss ? '#ff00ff' : '#aa00ff';
            ctx.shadowBlur = 12;
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(0, 0, proj.isBoss ? 10 : 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, proj.isBoss ? 4 : 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        ctx.restore();
    });
}

// Particles
function createParticles(x, y, color, count) {
    for (let i = 0; i < count; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            life: 60,
            color: color
        });
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        if (p.life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawParticles() {
    particles.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 60;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    });
}

// Power-ups
function spawnPowerUps() {
    setInterval(() => {
        if (!gameRunning) return;

        const powerUpTypes = [
            { type: 'invisible', color: '#00d4ff', symbol: '👻', effect: 'Invisibility' },
            { type: 'speed', color: '#00ff00', symbol: '⚡', effect: 'Speed Boost' },
            { type: 'shield', color: '#ffd700', symbol: '🛡️', effect: 'Shield' },
            { type: 'multishot', color: '#ff00ff', symbol: '✨', effect: 'Multi-Shot' }
        ];

        const randomType = powerUpTypes[Math.floor(Math.random() * powerUpTypes.length)];

        powerUps.push({
            x: Math.random() * (canvas.width - 40) + 20,
            y: Math.random() * (canvas.height - 40) + 20,
            width: 40,
            height: 40,
            type: randomType.type,
            color: randomType.color,
            symbol: randomType.symbol,
            effect: randomType.effect,
            life: 10000 // Disappears after 10 seconds
        });

        powerSound();
    }, 30000); // Spawn every 30 seconds
}

function updatePowerUps() {
    for (let i = powerUps.length - 1; i >= 0; i--) {
        const powerUp = powerUps[i];
        powerUp.life -= 16;

        // Check collision with dragon
        if (Math.abs(dragon.x + dragon.width / 2 - (powerUp.x + powerUp.width / 2)) < 40 &&
            Math.abs(dragon.y + dragon.height / 2 - (powerUp.y + powerUp.height / 2)) < 40) {

            // Apply power-up effect
            applyPowerUp(powerUp.type);
            powerUps.splice(i, 1);
            powerSound();
            createParticles(powerUp.x + 20, powerUp.y + 20, powerUp.color, 15);
        } else if (powerUp.life <= 0) {
            powerUps.splice(i, 1);
        }
    }
}

function drawPowerUps() {
    powerUps.forEach(powerUp => {
        // Glow effect
        const pulse = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;

        // Background circle
        const gradient = ctx.createRadialGradient(
            powerUp.x + 20, powerUp.y + 20, 5,
            powerUp.x + 20, powerUp.y + 20, 25
        );
        gradient.addColorStop(0, powerUp.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(powerUp.x + 20, powerUp.y + 20, 25, 0, Math.PI * 2);
        ctx.fill();

        // Symbol
        ctx.globalAlpha = 1;
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(powerUp.symbol, powerUp.x + 20, powerUp.y + 20);

        ctx.restore();
    });
}

function applyPowerUp(type) {
    switch (type) {
        case 'invisible':
            dragon.invisible = true;
            dragon.invisibleTimer = 5000; // 5 seconds
            break;
        case 'speed':
            const originalSpeed = dragon.speed;
            dragon.speed = 8;
            setTimeout(() => {
                dragon.speed = originalSpeed;
            }, 5000);
            break;
        case 'shield':
            const tempLives = lives;
            setTimeout(() => {
                if (lives < tempLives) {
                    lives = tempLives; // Restore lost life during shield
                    updateLives();
                }
            }, 5000);
            break;
        case 'multishot':
            // Enable triple shot for 10 seconds
            const originalShoot = shootFireball;
            window.shootFireball = function() {
                originalShoot.call(this);
                if (directionalShooting) {
                    // Fan out perpendicular to aim direction
                    const perpDx = -dragon.aimDir.dy;
                    const perpDy =  dragon.aimDir.dx;
                    const cx = dragon.x + dragon.width / 2;
                    const cy = dragon.y + dragon.height / 2;
                    fireballs.push({ x: cx + perpDx * 18 + dragon.aimDir.dx * 45, y: cy + perpDy * 18 + dragon.aimDir.dy * 45, dx: dragon.aimDir.dx, dy: dragon.aimDir.dy, radius: 8, speed: 8, damage: 1, isBig: false });
                    fireballs.push({ x: cx - perpDx * 18 + dragon.aimDir.dx * 45, y: cy - perpDy * 18 + dragon.aimDir.dy * 45, dx: dragon.aimDir.dx, dy: dragon.aimDir.dy, radius: 8, speed: 8, damage: 1, isBig: false });
                } else {
                    // Classic: two extra upward fireballs offset left/right
                    fireballs.push({ x: dragon.x + dragon.width / 2 - 15, y: dragon.y, dx: 0, dy: -1, radius: 8, speed: 8, damage: 1, isBig: false });
                    fireballs.push({ x: dragon.x + dragon.width / 2 + 15, y: dragon.y, dx: 0, dy: -1, radius: 8, speed: 8, damage: 1, isBig: false });
                }
            };
            setTimeout(() => {
                window.shootFireball = originalShoot;
            }, 10000);
            break;
    }
}

// Pause
function togglePause() {
    if (!gameRunning && !gamePaused) return; // don't pause on game over screen
    gamePaused = !gamePaused;
    if (!gamePaused) {
        gameLoop(); // resume
    }
}

// Invisibility
function activateInvisibility() {
    if (dragon.invisibleCooldown <= 0) {
        dragon.invisible = true;
        dragon.invisibleTimer = dragon.invisibleDuration;
        dragon.invisibleCooldown = 10000; // 10 second cooldown
        powerSound();
    }
}

// UI Updates
function updateLives() {
    document.getElementById('lives-count').textContent = lives;
}

function updateScore() {
    document.getElementById('score-count').textContent = score;
}

function updatePowerStatus() {
    const statusEl = document.getElementById('power-status');

    let status = `Level ${currentLevel} | `;

    if (dragon.invisible) {
        status += '👻 INVISIBLE';
    } else if (dragon.invisibleCooldown > 0) {
        status += `N cooldown: ${Math.ceil(dragon.invisibleCooldown / 1000)}s`;
    } else {
        status += 'N: Ready! | P: Pause';
    }

    statusEl.textContent = status;
}

function gameOver() {
    gameRunning = false;

    // Show continue option with math question
    if (continueAttempts > 0) {
        showMathQuestion();
    } else {
        // No more continues - final game over
        document.getElementById('final-score').textContent = score;
        document.getElementById('game-over').classList.remove('hidden');
    }
}

// Math Question System
function generateMathQuestion() {
    const operations = ['+', '-', '×'];
    const operation = operations[Math.floor(Math.random() * operations.length)];

    let num1, num2, answer;

    if (operation === '+') {
        // Addition: numbers between 1-50
        num1 = Math.floor(Math.random() * 50) + 1;
        num2 = Math.floor(Math.random() * 50) + 1;
        answer = num1 + num2;
    } else if (operation === '-') {
        // Subtraction: make sure result is positive
        num1 = Math.floor(Math.random() * 50) + 20;
        num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
        answer = num1 - num2;
    } else {
        // Multiplication: single digit or up to 12
        num1 = Math.floor(Math.random() * 12) + 1;
        num2 = Math.floor(Math.random() * 12) + 1;
        answer = num1 * num2;
    }

    return {
        question: `${num1} ${operation} ${num2}`,
        answer: answer
    };
}

function showMathQuestion() {
    currentMathQuestion = generateMathQuestion();

    const mathDiv = document.getElementById('math-question');
    document.getElementById('math-problem').textContent = currentMathQuestion.question;
    document.getElementById('math-attempts').textContent = continueAttempts;
    document.getElementById('math-answer').value = '';
    document.getElementById('math-feedback').textContent = '';
    mathDiv.classList.remove('hidden');

    // Focus on input
    setTimeout(() => {
        document.getElementById('math-answer').focus();
    }, 100);
}

function checkMathAnswer() {
    const userAnswer = parseInt(document.getElementById('math-answer').value);
    const feedback = document.getElementById('math-feedback');

    if (isNaN(userAnswer)) {
        feedback.textContent = 'Please enter a number!';
        feedback.style.color = '#ff4757';
        return;
    }

    if (userAnswer === currentMathQuestion.answer) {
        // Correct answer!
        feedback.textContent = '✅ Correct! Restoring health...';
        feedback.style.color = '#00ff00';
        powerSound();

        setTimeout(() => {
            document.getElementById('math-question').classList.add('hidden');
            continueGame();
        }, 1500);
    } else {
        // Wrong answer
        continueAttempts--;

        if (continueAttempts > 0) {
            feedback.textContent = `❌ Wrong! Try again. ${continueAttempts} attempts left.`;
            feedback.style.color = '#ff4757';
            document.getElementById('math-attempts').textContent = continueAttempts;
            document.getElementById('math-answer').value = '';

            // Generate new question
            currentMathQuestion = generateMathQuestion();
            document.getElementById('math-problem').textContent = currentMathQuestion.question;
        } else {
            // No more attempts
            feedback.textContent = '❌ No more attempts! Game Over!';
            feedback.style.color = '#ff0000';
            damageSound();

            setTimeout(() => {
                document.getElementById('math-question').classList.add('hidden');
                document.getElementById('final-score').textContent = score;
                document.getElementById('game-over').classList.remove('hidden');
            }, 2000);
        }
    }
}

function continueGame() {
    lives = 10; // Restore health
    updateLives();
    gameRunning = true;
    continueAttempts = 3; // Reset attempts for next death
    gameLoop();
}

function victory() {
    gameRunning = false;
    document.getElementById('victory-score').textContent = score;
    document.getElementById('victory').classList.remove('hidden');
}

// Game loop
function gameLoop() {
    if (!gameRunning) return;
    if (gamePaused) {
        // Draw pause overlay and stop the loop
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 64px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⏸ PAUSED', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '28px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Press P to continue', canvas.width / 2, canvas.height / 2 + 40);
        return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    updateDragon();
    updateFireballs();
    updateWardens();
    updateEnemyDragons();
    updateSkeletons();
    updateWizards();
    updateEels();
    updateParticles();
    updatePowerUps();
    updateEnemyFire();
    updateEnemyProjectiles();

    drawDoor();
    drawPowerUps();
    drawWardens();
    drawEnemyDragons();
    drawSkeletons();
    drawWizards();
    drawEels();
    drawFireballs();
    drawEnemyFire();
    drawEnemyProjectiles();
    drawDragon();
    drawParticles();

    updatePowerStatus();

    requestAnimationFrame(gameLoop);
}
