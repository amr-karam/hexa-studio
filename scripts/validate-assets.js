// scripts/validate-assets.js — Asset validation tool for hexa-studio
// Runtime prerequisites: Node.js >= 18.0.0 (uses built-in fs, path modules only)
// Usage: npm run validate
// Validates that all referenced assets exist and checks for missing CLIPS.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

let errors = 0;
let warnings = 0;

// Check CLIPS directory
const clipsDir = path.join(ROOT, 'CLIPS');
if (fs.existsSync(clipsDir)) {
  const clips = fs.readdirSync(clipsDir).filter(f => f.endsWith('.mp4'));
  console.log(`  CLIPS: ${clips.length} video files found`);
  const expected = Array.from({ length: 27 }, (_, i) => `${i + 1}.mp4`);
  const missing = expected.filter(f => !clips.includes(f));
  if (missing.length > 0) {
    console.log(`  ⚠ Missing CLIPS: ${missing.join(', ')}`);
    warnings += missing.length;
  }
} else {
  console.log('  ⚠ CLIPS directory not found');
  warnings++;
}

// Check assets directories
const assetDirs = ['assets/tex', 'assets/tex-1k', 'assets/sky'];
for (const dir of assetDirs) {
  const fullPath = path.join(ROOT, dir);
  if (fs.existsSync(fullPath)) {
    const count = fs.readdirSync(fullPath).length;
    console.log(`  ${dir}: ${count} files`);
  } else {
    console.log(`  ✗ ${dir}: directory missing`);
    errors++;
  }
}

// Check media directory
const mediaDir = path.join(ROOT, 'media');
if (fs.existsSync(mediaDir)) {
  const mediaFiles = fs.readdirSync(mediaDir);
  console.log(`  media: ${mediaFiles.length} files`);
} else {
  console.log('  ⚠ media directory not found');
  warnings++;
}

// Check shared directory
const sharedDir = path.join(ROOT, 'shared');
if (fs.existsSync(sharedDir)) {
  const sharedFiles = fs.readdirSync(sharedDir);
  console.log(`  shared: ${sharedFiles.length} files`);
} else {
  console.log('  ⚠ shared directory not found');
  warnings++;
}

console.log(`\n  Validation: ${errors} errors, ${warnings} warnings\n`);
if (errors > 0) process.exit(1);
