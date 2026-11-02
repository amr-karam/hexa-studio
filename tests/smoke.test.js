// tests/smoke.test.js — Smoke tests for hexa-studio
// Runtime prerequisites: Node.js >= 18.0.0 (uses built-in assert, fs, path modules only)
// Usage: npm test
// No external test framework required.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const REQUIRED_FILES = [
  'index.html',
  'scene.js',
  'staging.js',
  'gate.js',
  'hero-options.js',
  'light-options.js',
  'theme.css',
  'publish.css',
  'README.md',
  'IDEA.md',
  'render.yaml',
  '.gitignore',
  'package.json',
  'dev-server.js',
  '404.html',
  'favicon.svg',
  'robots.txt',
  'sitemap.xml',
];

let passed = 0;
let failed = 0;

for (const file of REQUIRED_FILES) {
  const filePath = path.join(ROOT, file);
  if (fs.existsSync(filePath)) {
    console.log(`  ✓ ${file}`);
    passed++;
  } else {
    console.log(`  ✗ ${file} — MISSING`);
    failed++;
  }
}

// Check index.html references
const indexHtml = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf-8');
const requiredRefs = ['scene.js', 'staging.js', 'gate.js', 'theme.css'];
for (const ref of requiredRefs) {
  if (indexHtml.includes(ref)) {
    console.log(`  ✓ index.html references ${ref}`);
    passed++;
  } else {
    console.log(`  ✗ index.html missing reference to ${ref}`);
    failed++;
  }
}

// Check render.yaml validity
const renderYaml = fs.readFileSync(path.join(ROOT, 'render.yaml'), 'utf-8');
if (renderYaml.includes('static') || renderYaml.includes('web')) {
  console.log('  ✓ render.yaml contains service type');
  passed++;
} else {
  console.log('  ✗ render.yaml missing service type');
  failed++;
}

// ---------------------------------------------------------------------------
// FX.JIT — behavioral tests against shared/fx-jit.js (DOM stubbed)
// ---------------------------------------------------------------------------
try {
  const jitSrc = fs.readFileSync(path.join(ROOT, 'shared', 'fx-jit.js'), 'utf-8');

  function makeFakeVideo() { return { _media: true, paused: true, load() { this._reloaded = true; }, pause() { this.paused = true; }, remove() { this._removed = true; } }; }
  const mindEls = [];

  const sandboxWindow = { FX: {} };
  const sandboxDoc = {
    createElement() { const el = makeFakeVideo(); mindEls.push(el); return el; },
  };
  const savedWindow = globalThis.window;
  const savedDoc = globalThis.document;
  globalThis.window = sandboxWindow;
  globalThis.document = sandboxDoc;

  const run = new Function('window', 'document', 'fetch', 'Audio', jitSrc + '\nreturn window.FX;');

  // Case 1: exposes JIT with the documented API shape
  const FX = run(sandboxWindow, sandboxDoc, undefined, undefined);
  const api = ['create', 'config', 'pool', 'tick', 'ensure', 'dispose', 'flush', 'stats'];
  if (FX.JIT && api.every((m) => typeof FX.JIT[m] === 'function')) {
    console.log('  ✓ FX.JIT exposes full API');
    passed++;
  } else {
    console.log('  ✗ FX.JIT API incomplete');
    failed++;
  }

  // Case 2: isolated lane — missing-stop blacklist and pool/dispose lifecycle
  const jit = FX.JIT.create({ ahead: 1, behind: 0, missing: ['12', '24'] });
  jit.pool(3, [{ src: 'CLIPS/Nov3.mp4' }, { src: 'CLIPS/Nov3b.mp4' }]);
  jit.pool(4, [{ src: 'CLIPS/Nov4.mp4' }]);
  jit.pool(12, [{ src: 'CLIPS/clip12.mp4' }]); // known-bad gap
  jit.tick(3);
  const afterTick3 = jit.stats();
  if (afterTick3.current === '3' && afterTick3.held === 2) {
    console.log('  ✓ JIT prebuffers current + next (stop 3 → holds 2 pools)');
    passed++;
  } else {
    console.log(`  ✗ JIT tick state wrong: ${JSON.stringify(afterTick3)}`);
    failed++;
  }
  jit.pool(5, [{ src: 'CLIPS/Nov5.mp4' }]);
  jit.tick(5);
  const afterGap = jit.stats();
  if (afterGap.current === '5' && afterGap.held === 1) {
    console.log('  ✓ JIT skips blacklisted stop 12 / flushes stale pools (stop 5 → holds 1)');
    passed++;
  } else {
    console.log(`  ✗ JIT gap/dispose wrong: ${JSON.stringify(afterGap)}`);
    failed++;
  }
  jit.flush();
  if (jit.stats().held === 0) {
    console.log('  ✓ JIT flush() releases everything');
    passed++;
  } else {
    console.log('  ✗ JIT flush() left media held');
    failed++;
  }

  globalThis.window = savedWindow;
  globalThis.document = savedDoc;
} catch (err) {
  console.log(`  ✗ FX.JIT tests failed to execute — ${err.message}`);
  failed++;
}

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
