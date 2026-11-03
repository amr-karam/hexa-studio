// tests/listen.test.js — Behavioral tests for shared/fx-listen.js
// Runtime prerequisites: Node.js >= 18.0.0 (uses built-in fs/path only)
// Usage: node tests/listen.test.js
// No external test framework required. Exits 0 on success, 1 on failure.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function check(cond, label) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.log(`  ✗ ${label}`);
    failed++;
  }
}

// ---------------------------------------------------------------------------
// Minimal WebAudio fake — just enough surface for fx-listen.js
// ---------------------------------------------------------------------------
function makeParam(v) {
  return {
    value: v,
    setValueAtTime() { return this; },
    linearRampToValueAtTime() { return this; },
    cancelScheduledValues() { return this; },
    setTargetAtTime() { return this; },
  };
}

function makeNode(extra) {
  return Object.assign({
    connect() { return this; },
    disconnect() { return this; },
  }, extra || {});
}

function FakeAudioContext() {
  this.state = 'suspended'; // autoplay policy: starts suspended
  this.currentTime = 0;
  this.sampleRate = 44100;
  this.destination = makeNode();
}
FakeAudioContext.prototype.resume = function () {
  this.state = 'running';
  return Promise.resolve();
};
FakeAudioContext.prototype.createGain = function () {
  return makeNode({ gain: makeParam(0) });
};
FakeAudioContext.prototype.createStereoPanner = function () {
  return makeNode({ pan: makeParam(0) });
};
FakeAudioContext.prototype.createBuffer = function (channels, length, rate) {
  return {
    numberOfChannels: channels,
    length: length,
    sampleRate: rate,
    getChannelData() { return new Float32Array(length); },
  };
};
FakeAudioContext.prototype.createBufferSource = function () {
  return makeNode({ buffer: null, loop: false, start() {}, stop() {} });
};
FakeAudioContext.prototype.createBiquadFilter = function () {
  return makeNode({ type: 'lowpass', frequency: makeParam(350), Q: makeParam(1) });
};
FakeAudioContext.prototype.createOscillator = function () {
  return makeNode({ type: 'sine', frequency: makeParam(440), start() {}, stop() {} });
};

// ---------------------------------------------------------------------------
// DOM / storage stubs (headless: no window.__rig yet — the required case)
// ---------------------------------------------------------------------------
const store = {};
const localStorageStub = {
  getItem(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
  setItem(k, v) { store[k] = String(v); },
  removeItem(k) { delete store[k]; },
};

let ariaHidden = 'true'; // #file dossier starts closed
const fileEl = {
  getAttribute(name) { return name === 'aria-hidden' ? ariaHidden : null; },
};
const documentStub = {
  getElementById(id) { return id === 'file' ? fileEl : null; },
  // no querySelector/createElement on purpose: mountButton must guard
};

const winHandlers = {}; // captured gesture listeners, fired manually below
const windowStub = {
  FX: {},
  addEventListener(type, fn) { winHandlers[type] = fn; },
  removeEventListener(type, fn) { if (winHandlers[type] === fn) delete winHandlers[type]; },
};

const matchMediaStub = function () { return { matches: false }; };

// ---------------------------------------------------------------------------
// Load the module exactly the way the browser would (classic script, globals
// provided as Function parameters) and run the assertions.
// ---------------------------------------------------------------------------
let FX = null;
try {
  const listenSrc = fs.readFileSync(path.join(ROOT, 'shared', 'fx-listen.js'), 'utf-8');
  const run = new Function(
    'window', 'document', 'localStorage', 'matchMedia', 'AudioContext',
    listenSrc + '\nreturn window.FX;'
  );
  FX = run(windowStub, documentStub, localStorageStub, matchMediaStub, FakeAudioContext);

  // Case 1: API shape — statics on FX.Listen
  check(
    FX.Listen && ['create', 'seed', 'toneParams'].every((m) => typeof FX.Listen[m] === 'function'),
    'FX.Listen exposes create/seed/toneParams'
  );

  const lane = FX.Listen.create({ autoStart: false }); // no poll timer in tests
  check(
    ['enable', 'disable', 'toggle', 'isEnabled', 'poll', 'start', 'destroy', 'stats']
      .every((m) => typeof lane[m] === 'function'),
    'instance exposes enable/disable/toggle/isEnabled/poll/start/destroy/stats'
  );

  // Case 2: headless — missing window.__rig must be an idle no-op, no throw
  let threw = false;
  let st = null;
  try {
    lane.poll();
    st = lane.stats();
  } catch (err) {
    threw = true;
  }
  check(!threw, 'create()/poll() work headless with missing __rig (no throw)');
  check(st && st.key === null, 'idle stats report no active key');
  check(st && st.running === false && st.target === 0, 'idle: context suspended, master at 0');

  // Case 3: enabling persists to localStorage('sound')
  lane.disable();
  check(store.sound === 'off' && lane.isEnabled() === false, "disable() persists localStorage 'sound'=off");
  lane.enable();
  check(store.sound === 'on' && lane.isEnabled() === true, "enable() persists localStorage 'sound'=on");
  const lane2 = FX.Listen.create({ autoStart: false });
  check(lane2.isEnabled() === true, 'fresh instance reads persisted preference');
  lane2.destroy();

  // Case 4: seed determinism — same key => same seed, different keys differ
  check(FX.Listen.seed(3) === FX.Listen.seed(3), 'seed(3) is deterministic');
  check(FX.Listen.seed('lens') === FX.Listen.seed('lens'), "seed('lens') is deterministic");
  check(FX.Listen.seed(3) !== FX.Listen.seed(4), 'different keys produce different seeds');
  const s = FX.Listen.seed(7);
  check(Number.isInteger(s) && s >= 0 && s <= 0xffffffff, 'seed returns a uint32');

  // Case 5: tone params are a pure function of the key (hum within 55-80Hz)
  const t1 = FX.Listen.toneParams(5);
  const t2 = FX.Listen.toneParams(5);
  check(t1.cutoff === t2.cutoff && t1.q === t2.q && t1.hum === t2.hum && t1.angle === t2.angle,
    'toneParams(5) is deterministic');
  check(t1.hum >= 55 && t1.hum <= 80, 'seeded hum lives in 55-80Hz');

  // Case 6: with a rig present — stop tracking, gesture resume, ducking, pan
  const rigState = { key: 4, phase: 'hold', yaw: 0.5 };
  windowStub.__rig = {
    sD: 12,
    camera: { rotation: { y: rigState.yaw } },
    mapScroll() {
      return { idx: 0, key: rigState.key, phase: rigState.phase, f: 0, to: 1 };
    },
  };
  lane.poll();
  check(lane.stats().key === 4, 'poll picks up stop key from __rig.mapScroll');
  check(lane.stats().running === false && lane.stats().target === 0,
    'still silent before a user gesture (context suspended)');

  // first real gesture -> resume (autoplay policy)
  if (typeof winHandlers.pointerdown === 'function') winHandlers.pointerdown();
  lane.poll();
  const lvl = 0.6; // DEFAULTS.level
  check(lane.stats().running === true, 'pointerdown gesture resumes the AudioContext');
  check(Math.abs(lane.stats().target - lvl) < 1e-9,
    'audible at full level while hold + dossier closed');

  ariaHidden = 'false'; // dossier open -> master ducks to 0.15
  lane.poll();
  check(Math.abs(lane.stats().target - 0.15) < 1e-9, 'dossier open ducks master to 0.15');

  ariaHidden = 'true';
  rigState.phase = 'go'; // transition swing -> half level
  lane.poll();
  check(Math.abs(lane.stats().target - lvl * 0.5) < 1e-9,
    "'go' phase ducks master to 0.5x of target");

  rigState.phase = 'hold';
  lane.poll();
  const expectPan = Math.sin(rigState.yaw - FX.Listen.toneParams(4).angle);
  check(Math.abs(lane.stats().pan - expectPan) < 1e-12,
    'pan = sin(cameraYaw - per-stop seedAngle)');

  rigState.key = 7; // stop change -> crossfade to a new tone
  lane.poll();
  check(lane.stats().key === 7, 'stop change swaps the active tone');

  lane.disable();
  lane.poll();
  check(lane.stats().target === 0, 'disabled -> master hard-muted');
  lane.enable();

  lane.destroy();
} catch (err) {
  console.log(`  ✗ FX.Listen tests failed to execute — ${err.message}`);
  failed++;
} finally {
  // Always tear down: the default instance self-starts a 250ms interval and
  // gesture listeners, which would otherwise keep the Node process alive.
  try { if (FX && FX.Listen) FX.Listen.destroy(); } catch (e) { /* noop */ }
}

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
