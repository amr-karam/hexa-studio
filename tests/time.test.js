// tests/time.test.js — Smoke tests for shared/fx-time.js
// Runtime prerequisites: Node.js >= 18.0.0 (uses built-in assert module only)
// Usage: node tests/time.test.js
// No external test framework required. No DOM needed — stubs window/document/gsap.

import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function ok(cond, name) {
  if (cond) { console.log('  ✓ ' + name); passed++; }
  else { console.log('  ✗ ' + name); failed++; }
}
function eq(a, b, name) { try { assert.strictEqual(a, b); ok(true, name); } catch (e) { ok(false, name + ' (' + e.message + ')'); } }

const DEFAULT_RIG = {
  exposure: 1, saturation: 1, tint: 0,
  fadeCol: [0.937, 0.922, 0.886],
  paperCol: [0.937, 0.922, 0.886],
  grain: 0.022,
};

// ---------------------------------------------------------------------------
// Build a minimal sandbox so fx-time.js can run headless.
// ---------------------------------------------------------------------------
function makeSandbox(reducedMotion) {
  let rigParam = JSON.parse(JSON.stringify(DEFAULT_RIG));
  const fakeWindow = {};
  const fakeDocument = {
    readyState: 'complete',
    documentElement: { dataset: {} },
    querySelector: function () { return null; },
    createElement: function () {
      const el = {
        id: null, type: null, className: '', textContent: '',
        attributes: {}, style: {},
        setAttribute: function (k, v) { this.attributes[k] = String(v); },
        addEventListener: function () {},
      };
      return el;
    },
    getElementById: function () { return null; },
  };
  const localStorageStore = {};
  const fakeLocalStorage = {
    getItem: function (k) { return localStorageStore[k] === undefined ? null : localStorageStore[k]; },
    setItem: function (k, v) { localStorageStore[k] = String(v); },
  };
  const fakeMatchMedia = function () { return { matches: reducedMotion }; };
  const gsapCalls = [];
  const fakeGsap = {
    to: function (target, vars) {
      gsapCalls.push({ target: target, vars: vars });
      return { kill: function () {} };
    },
  };
  return {
    fakeWindow, fakeDocument, fakeLocalStorage, fakeMatchMedia, fakeGsap,
    get rigParam() { return rigParam; },
    set rigParam(v) { rigParam = v; },
    get gsapCalls() { return gsapCalls; },
    get localStorageStore() { return localStorageStore; },
    set __rig(v) { fakeWindow.__rig = v; },
    get __rig() { return fakeWindow.__rig; },
    get dataset() { return fakeDocument.documentElement.dataset; },
  };
}

const timeSrc = fs.readFileSync(path.join(ROOT, 'shared', 'fx-time.js'), 'utf-8');

function runModule(sandbox) {
  const run = new Function(
    'window', 'document', 'localStorage', 'matchMedia', 'gsap',
    timeSrc + '\nreturn window.FX.Time;'
  );
  return run(
    sandbox.fakeWindow, sandbox.fakeDocument, sandbox.fakeLocalStorage,
    sandbox.fakeMatchMedia, sandbox.fakeGsap
  );
}

// ---------------------------------------------------------------------------
// Case 1: API shape exists after running the module.
// ---------------------------------------------------------------------------
try {
  const s = makeSandbox(false);
  const FX = runModule(s);
  ok(FX && FX.create, 'FX.Time.create factory exists');
  ok(typeof FX.create === 'function', 'FX.Time.create is a function');
} catch (err) {
  console.log('  ✗ FX.Time module failed to load — ' + err.message);
  failed++;
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Case 2: day snapshot captured at install (exposure defaults to 1).
// ---------------------------------------------------------------------------
(async function () {
  const s = makeSandbox(false);
  s.__rig = { P: s.rigParam };
  const FX = runModule(s);
  const lane = FX.create();
  await lane.install(); // waits for __rig + applies stored state instantly

  ok(lane.mode() === 'day', 'initial mode is day');
  ok(lane.day() && lane.day().exposure === 1, 'day snapshot captured exposure=1');
  eq(s.rigParam.exposure, 1, 'rig exposure untouched on day init (instant)');
  eq(s.dataset.timeofday, 'day', 'dataset.timeofday=day');
  eq(s.localStorageStore.timeofday, 'day', 'persistence: timeofday=day');
})();

// ---------------------------------------------------------------------------
// Case 3: toggling changes exposure target via gsap (normal motion).
// ---------------------------------------------------------------------------
(async function () {
  const s = makeSandbox(false);
  s.__rig = { P: s.rigParam };
  const FX = runModule(s);
  const lane = FX.create();
  await lane.install();

  lane.toggle(); // day -> night
  ok(lane.mode() === 'night', 'toggle: mode becomes night');
  // find the tween that targets the rig (numeric keys) — color tweens come after
  const rigTween = s.gsapCalls.find(function (c) { return c.target === s.rigParam; });
  ok(rigTween && rigTween.target === s.rigParam, 'tween targets rig.P');
  eq(rigTween && rigTween.vars.exposure, 0.55, 'tween sets exposure to 0.55 (night)');
  eq(rigTween && rigTween.vars.duration, 1.6, 'tween duration ~1.6s');
  eq(rigTween && rigTween.vars.ease, 'power2.inOut', 'tween ease power2.inOut');
  eq(rigTween && rigTween.vars.overwrite, true, 'tween overwrite:true');
})();

// ---------------------------------------------------------------------------
// Case 4: reduced-motion applies instantly (call twice).
// ---------------------------------------------------------------------------
(async function () {
  const s = makeSandbox(true);
  s.__rig = { P: s.rigParam };
  const FX = runModule(s);
  const lane = FX.create();
  await lane.install();

  lane.toggle(); // day -> night instant
  eq(s.gsapCalls.length, 0, 'reduced motion: no gsap tween created');
  eq(s.rigParam.exposure, 0.55, 'reduced motion: exposure applied instantly = 0.55');

  lane.toggle(); // night -> day instant
  eq(s.rigParam.exposure, 1, 'reduced motion: back to day exposure = 1 instantly');
  ok(lane.mode() === 'day', 'mode back to day');
})();

// ---------------------------------------------------------------------------
// Case 5: null-guarded — never throws when rig missing.
// ---------------------------------------------------------------------------
(async function () {
  const s = makeSandbox(false);
  s.__rig = undefined;
  const FX = runModule(s);
  const lane = FX.create();
  try {
    lane.toggle();   // rig missing — should not throw
    lane.setMode('night'); // rig missing — should not throw
    ok(true, 'null-guarded: toggle/setMode with missing __rig does not throw');
  } catch (err) {
    ok(false, 'null-guarded: threw — ' + err.message);
  }
})();

// ---------------------------------------------------------------------------
// Wait for async IIFEs to flush, then report results.
// ---------------------------------------------------------------------------
setTimeout(function () {
  console.log('\n  Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failed > 0) process.exit(1);
}, 400);
