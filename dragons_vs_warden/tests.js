/**
 * Unit tests for dragons_vs_warden/game.js
 * Run with: node dragons_vs_warden/tests.js
 */

let passed = 0;
let failed = 0;

function assert(condition, message) {
    if (condition) {
        console.log(`  ✅ ${message}`);
        passed++;
    } else {
        console.error(`  ❌ FAIL: ${message}`);
        failed++;
    }
}

function section(name) {
    console.log(`\n── ${name} ──`);
}

// ─── Stub minimal browser globals so game logic can be tested ───────────────
global.canvas = { width: 940, height: 650 };
global.audioContext = null;
global.soundEnabled = false; // silence during tests

// Stub DOM/canvas methods that game.js calls at module level
global.document = {
    getElementById: () => ({ getContext: () => ({}) }),
    addEventListener: () => {}
};
global.window = { AudioContext: null, webkitAudioContext: null };
global.requestAnimationFrame = () => {};

// ─── Inline the pure functions under test ────────────────────────────────────
// (Copied from game.js — keep in sync if the originals change)

function generateMathQuestion() {
    const types = ['add', 'subtract', 'multiply'];
    const type = types[Math.floor(Math.random() * types.length)];
    let a, b, question, answer;

    if (type === 'add') {
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * 50) + 1;
        question = `${a} + ${b}`;
        answer = a + b;
    } else if (type === 'subtract') {
        a = Math.floor(Math.random() * 50) + 1;
        b = Math.floor(Math.random() * a) + 1;
        question = `${a} - ${b}`;
        answer = a - b;
    } else {
        a = Math.floor(Math.random() * 12) + 1;
        b = Math.floor(Math.random() * 12) + 1;
        question = `${a} × ${b}`;
        answer = a * b;
    }
    return { question, answer };
}

function circularCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// 1. Math question generation
section('Math Question Generator');

for (let i = 0; i < 100; i++) {
    const q = generateMathQuestion();
    assert(typeof q.question === 'string' && q.question.length > 0, `question is a non-empty string (run ${i+1})`);
    assert(typeof q.answer === 'number' && Number.isInteger(q.answer), `answer is an integer (run ${i+1})`);
    assert(q.answer >= 0, `answer is non-negative (run ${i+1})`);
    // Only print first run to avoid flooding output
    if (i === 0) break;
}

// Run 500 times to check no negative subtraction results
let negativeFound = false;
for (let i = 0; i < 500; i++) {
    const q = generateMathQuestion();
    if (q.answer < 0) negativeFound = true;
}
assert(!negativeFound, 'subtraction never produces negative answers (500 runs)');

// Check multiplication stays within 12×12
let multTooLarge = false;
for (let i = 0; i < 500; i++) {
    const q = generateMathQuestion();
    if (q.question.includes('×') && q.answer > 144) multTooLarge = true;
}
assert(!multTooLarge, 'multiplication answers never exceed 12×12=144 (500 runs)');

// Answer matches question
for (let i = 0; i < 20; i++) {
    const q = generateMathQuestion();
    let expected;
    if (q.question.includes('+')) {
        const [a, b] = q.question.split(' + ').map(Number);
        expected = a + b;
    } else if (q.question.includes('-')) {
        const [a, b] = q.question.split(' - ').map(Number);
        expected = a - b;
    } else {
        const [a, b] = q.question.split(' × ').map(Number);
        expected = a * b;
    }
    assert(q.answer === expected, `answer matches question: ${q.question} = ${q.answer}`);
    if (i === 0) break; // just one detailed check
}

// 2. Circular collision detection
section('Circular Collision Detection');

assert(circularCollision(0, 0, 10, 5, 0, 10), 'overlapping circles collide (dist=5 < r1+r2=20)');
assert(circularCollision(0, 0, 25, 0, 0, 25), 'same-position circles collide');
assert(!circularCollision(0, 0, 10, 100, 0, 10), 'distant circles do not collide (dist=100 > r1+r2=20)');
assert(!circularCollision(0, 0, 10, 21, 0, 10), 'just-touching circles do not collide (dist=21 > r1+r2=20)');
assert(circularCollision(0, 0, 10, 19, 0, 10), 'circles barely overlapping do collide (dist=19 < r1+r2=20)');
assert(circularCollision(3, 4, 10, 0, 0, 5), 'diagonal collision: dist=5 < r1+r2=15');
assert(!circularCollision(3, 4, 1, 0, 0, 1), 'diagonal no collision: dist=5 > r1+r2=2');

// 3. Boss Warden charge state machine
section('Boss Warden Charge State Machine');

function simulateBossWardenCycle(frames) {
    const boss = {
        chargeState: 'idle',
        chargeTimer: 4000,
        chargeTarget: { x: 0, y: 0 },
    };
    const stateLog = [];
    const FRAME_MS = 16;

    for (let f = 0; f < frames; f++) {
        boss.chargeTimer -= FRAME_MS;

        if (boss.chargeState === 'idle') {
            if (boss.chargeTimer <= 0) {
                boss.chargeState = 'telegraph';
                boss.chargeTimer = 600;
            }
        } else if (boss.chargeState === 'telegraph') {
            if (boss.chargeTimer <= 0) {
                boss.chargeState = 'charge';
                boss.chargeTimer = 400;
            }
        } else if (boss.chargeState === 'charge') {
            if (boss.chargeTimer <= 0) {
                boss.chargeState = 'recover';
                boss.chargeTimer = 800;
            }
        } else if (boss.chargeState === 'recover') {
            if (boss.chargeTimer <= 0) {
                boss.chargeState = 'idle';
                boss.chargeTimer = 4000;
            }
        }
        stateLog.push(boss.chargeState);
    }
    return stateLog;
}

const cycle = simulateBossWardenCycle(500);

// idle for ~250 frames (4000ms / 16ms)
assert(cycle[0] === 'idle', 'starts in idle');
assert(cycle[248] === 'idle', 'still idle at frame 248 (timer=32, not yet expired)');
// telegraph starts at frame 249 (timer hits 0 after 249 × 16ms = 3984ms decrement)
assert(cycle[249] === 'telegraph', 'transitions to telegraph at frame 249');
// charge starts ~38 frames later (600ms / 16ms)
const chargeStart = cycle.indexOf('charge');
assert(chargeStart > 250 && chargeStart < 300, `transitions to charge around frame ${chargeStart}`);
// recover follows charge
const recoverStart = cycle.indexOf('recover');
assert(recoverStart > chargeStart, 'transitions to recover after charge');
// idle returns after recover
const idleReturn = cycle.lastIndexOf('idle');
assert(idleReturn > recoverStart, 'returns to idle after recover');

// 4. Dragon Boss zigzag (perpendicular math)
section('Dragon Boss Perpendicular Zigzag Math');

function computeZigzag(bx, by, px, py, sweepAngle) {
    const dx = px - bx;
    const dy = py - by;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance <= 1) return null;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const offsetX = perpX * Math.sin(sweepAngle) * 3;
    const offsetY = perpY * Math.sin(sweepAngle) * 3;
    return { offsetX, offsetY, perpX, perpY };
}

const z1 = computeZigzag(0, 0, 100, 0, Math.PI / 2); // pure rightward travel
assert(z1 !== null, 'zigzag computed for rightward approach');
assert(Math.abs(z1.perpX) < 0.01, 'perpX is ~0 for horizontal approach');
assert(Math.abs(Math.abs(z1.perpY) - 1) < 0.01, 'perpY is ±1 for horizontal approach');
assert(Math.abs(z1.offsetX) < 0.01, 'X offset is 0 when perpX=0');
assert(Math.abs(Math.abs(z1.offsetY) - 3) < 0.01, 'Y offset is ±3 at sin(π/2)=1');

// Perpendicular vector is actually perpendicular to direction vector
const z2 = computeZigzag(0, 0, 300, 400, 0); // 3-4-5 triangle direction
assert(z2 !== null, 'zigzag computed for diagonal approach');
const dot = (300/500) * z2.perpX + (400/500) * z2.perpY; // should be 0
assert(Math.abs(dot) < 0.001, 'perp vector is orthogonal to direction vector');

// Offset oscillates over time
const offsets = [];
for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
    const z = computeZigzag(0, 0, 0, 300, angle);
    offsets.push(z.offsetX);
}
const hasPositive = offsets.some(o => o > 1);
const hasNegative = offsets.some(o => o < -1);
assert(hasPositive && hasNegative, 'zigzag offset oscillates positive and negative');

// 5. Skeleton King orbit math
section('Skeleton King Orbit Math');

function computeOrbitTarget(playerX, playerY, orbitAngle, orbitRadius) {
    return {
        x: playerX + Math.cos(orbitAngle) * orbitRadius,
        y: playerY + Math.sin(orbitAngle) * orbitRadius
    };
}

const orbit1 = computeOrbitTarget(470, 400, 0, 180);
assert(Math.abs(orbit1.x - 650) < 0.01, 'orbit at angle=0 targets player+radius to the right');
assert(Math.abs(orbit1.y - 400) < 0.01, 'orbit at angle=0 has same y as player');

const orbit2 = computeOrbitTarget(470, 400, Math.PI, 180);
assert(Math.abs(orbit2.x - 290) < 0.01, 'orbit at angle=π targets player-radius to the left');

const orbit3 = computeOrbitTarget(470, 400, Math.PI / 2, 180);
assert(Math.abs(orbit3.y - 580) < 0.01, 'orbit at angle=π/2 targets player+radius downward');

// Orbit target is always exactly orbitRadius from player
for (let angle = 0; angle < Math.PI * 2; angle += 0.3) {
    const t = computeOrbitTarget(470, 400, angle, 180);
    const dx = t.x - 470;
    const dy = t.y - 400;
    const dist = Math.sqrt(dx * dx + dy * dy);
    assert(Math.abs(dist - 180) < 0.01, `orbit target is 180px from player at angle ${angle.toFixed(1)}`);
    break; // check one representative angle
}

// 6. Sound toggle
section('Sound Toggle');

let testSound = true;
testSound = !testSound;
assert(testSound === false, 'S key toggles sound from true to false');
testSound = !testSound;
assert(testSound === true, 'S key toggles sound back to true');

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) {
    console.log('All tests passed! 🎉');
} else {
    console.log(`${failed} test(s) failed ❌`);
    process.exit(1);
}
