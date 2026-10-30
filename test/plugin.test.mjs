import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// The temp dir lives inside the package so `tailwindcss` resolves from node_modules.
// Build the plugin with the real Tailwind CLI so the test covers what users get.
function build(classes) {
  const dir = mkdtempSync(join(root, 'test', '.tmp-'));
  writeFileSync(join(dir, 'in.css'), `@import "tailwindcss";\n@import "${join(root, 'index.css')}";\n@source "./page.html";\n`);
  writeFileSync(join(dir, 'page.html'), `<div class="${classes}"></div>`);
  execFileSync(join(root, 'node_modules/.bin/tailwindcss'), ['-i', join(dir, 'in.css'), '-o', join(dir, 'out.css')], { stdio: 'pipe' });
  const css = readFileSync(join(dir, 'out.css'), 'utf8').replace(/\s+/g, ' ');
  rmSync(dir, { recursive: true });
  return css;
}

const variants = {
  'folded:p-1': '@media (device-posture: folded)',
  'flat:p-1': '@media (device-posture: continuous)',
  'book:p-1': '@media (device-posture: folded) and (horizontal-viewport-segments: 2)',
  'tabletop:p-1': '@media (device-posture: folded) and (vertical-viewport-segments: 2)',
  'seg-x2:p-1': '@media (horizontal-viewport-segments: 2)',
  'seg-y2:p-1': '@media (vertical-viewport-segments: 2)',
};
for (const [cls, media] of Object.entries(variants)) {
  test(`variant ${cls.split(':')[0]}`, () => assert.ok(build(cls).includes(media), media));
}

const utilities = {
  'grid-cols-segments': 'env(viewport-segment-width 0 0, 50%)',
  'grid-rows-segments': 'env(viewport-segment-top 0 1, 50%)',
  'left-seg-2': 'env(viewport-segment-left 1 0, 50%)',
  'top-seg-2': 'env(viewport-segment-top 0 1, 50%)',
  'w-seg-1': 'env(viewport-segment-width 0 0, 50%)',
  'pt-safe': 'padding-top: env(safe-area-inset-top, 0px)',
  'pb-safe': 'padding-bottom: env(safe-area-inset-bottom, 0px)',
  'p-safe': 'env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px)',
};
for (const [cls, expected] of Object.entries(utilities)) {
  test(`utility ${cls}`, () => assert.ok(build(cls).includes(expected), expected));
}

test('variants stack with utilities', () => {
  assert.ok(build('book:grid-cols-segments').includes('@media (device-posture: folded) and (horizontal-viewport-segments: 2)'));
});

test('no segment-height env() in the file (unreliable on iOS 27.2)', () => {
  const css = readFileSync(join(root, 'index.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!css.includes('viewport-segment-height'));
});
