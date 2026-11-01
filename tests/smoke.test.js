// tests/smoke.test.js — Smoke tests for hexa-studio
// Runtime prerequisites: Node.js >= 18.0.0 (uses built-in assert, fs, path modules only)
// Usage: npm test
// No external test framework required.

import assert from 'node:assert/strict';
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

console.log(`\n  Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
