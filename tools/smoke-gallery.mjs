/**
 * Smoke test for spectrum gallery slideshow rendering.
 * Creates tiny test images via FFmpeg, then exercises buildGallerySlideshowFile
 * with various config combos: single image, multi-image fade, Ken Burns, shuffle.
 *
 * Usage: node tools/smoke-gallery.mjs
 * Requires: FFmpeg available (bundled or PATH)
 */

import { existsSync, statSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const tmpDir = path.join(root, '.test-gallery-tmp');
const { buildGallerySlideshowFile, resolveLayerOrder } = await import('../backend/render-engine.mjs');
const { FFMPEG } = await import('../backend/bin-resolver.mjs');

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', b => (stderr += b.toString()));
    child.on('error', reject);
    child.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`${cmd} exit ${code}: ${stderr.slice(0, 300)}`)),
    );
  });
}

async function generateTestImage(name, color = 'red') {
  const out = path.join(tmpDir, name);
  await run(FFMPEG, ['-y', '-f', 'lavfi', '-i', `color=c=${color}:s=64x64:d=1`, '-frames:v', '1', out]);
  return out;
}

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${label}`);
  } else {
    failed++;
    console.error(`  ✗ ${label}`);
  }
}

try {
  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  console.log('Generating test images...');
  const img1 = await generateTestImage('img1.png', 'red');
  const img2 = await generateTestImage('img2.png', 'blue');
  const img3 = await generateTestImage('img3.png', 'green');

  const baseConfig = {
    target: { width: 64, height: 64, fps: 10, resolution: '64x64' },
    spectrum: { gallery: {} },
  };

  // --- Test 1: disabled gallery returns empty ---
  console.log('\nTest 1: Gallery disabled');
  const r1 = await buildGallerySlideshowFile(
    { ...baseConfig, spectrum: { gallery: { enabled: false, images: [img1] } } },
    tmpDir,
    { id: 'test1' },
  );
  assert(r1 === '', 'returns empty string when gallery disabled');

  // --- Test 2: no images returns empty ---
  console.log('\nTest 2: No images');
  const r2 = await buildGallerySlideshowFile(
    { ...baseConfig, spectrum: { gallery: { enabled: true, images: [] } } },
    tmpDir,
    { id: 'test2' },
  );
  assert(r2 === '', 'returns empty when images array is empty');

  // --- Test 3: single image without Ken Burns returns path directly ---
  console.log('\nTest 3: Single image (no Ken Burns)');
  const r3 = await buildGallerySlideshowFile(
    { ...baseConfig, spectrum: { gallery: { enabled: true, images: [img1], kenBurns: false } } },
    tmpDir,
    { id: 'test3' },
  );
  assert(r3 === img1, 'returns original image path for single image without Ken Burns');

  // --- Test 4: single image with Ken Burns renders video ---
  console.log('\nTest 4: Single image with Ken Burns');
  const r4 = await buildGallerySlideshowFile(
    {
      ...baseConfig,
      spectrum: { gallery: { enabled: true, images: [img1], kenBurns: true, kenBurnsMode: 'zoom-in', duration: 2 } },
    },
    tmpDir,
    { id: 'test4' },
  );
  assert(r4 !== '' && r4 !== img1, 'returns generated video path');
  assert(existsSync(r4), 'output file exists');
  assert(statSync(r4).size > 100, 'output file has content');

  // --- Test 5: multi-image fade transition ---
  console.log('\nTest 5: Multi-image fade');
  const r5 = await buildGallerySlideshowFile(
    { ...baseConfig, spectrum: { gallery: { enabled: true, images: [img1, img2], transition: 'fade', duration: 2 } } },
    tmpDir,
    { id: 'test5' },
  );
  assert(r5 !== '', 'returns generated video path');
  assert(existsSync(r5), 'output file exists');
  assert(statSync(r5).size > 100, 'output file has content');

  // --- Test 6: 3 images with crossfade + Ken Burns ---
  console.log('\nTest 6: 3 images crossfade + Ken Burns');
  const r6 = await buildGallerySlideshowFile(
    {
      ...baseConfig,
      spectrum: {
        gallery: {
          enabled: true,
          images: [img1, img2, img3],
          transition: 'crossfade',
          duration: 2,
          kenBurns: true,
          kenBurnsMode: 'random',
        },
      },
    },
    tmpDir,
    { id: 'test6' },
  );
  assert(r6 !== '', 'returns generated video path');
  assert(existsSync(r6), 'output file exists');
  assert(statSync(r6).size > 100, 'output has content');

  // --- Test 7: shuffle doesn't crash ---
  console.log('\nTest 7: Shuffle enabled');
  const r7 = await buildGallerySlideshowFile(
    {
      ...baseConfig,
      spectrum: {
        gallery: { enabled: true, images: [img1, img2, img3], transition: 'slide', duration: 2, shuffle: true },
      },
    },
    tmpDir,
    { id: 'test7' },
  );
  assert(r7 !== '', 'returns generated video path with shuffle');
  assert(existsSync(r7), 'output file exists');

  // --- Test 8: invalid/missing files filtered ---
  console.log('\nTest 8: Invalid files filtered');
  const r8 = await buildGallerySlideshowFile(
    { ...baseConfig, spectrum: { gallery: { enabled: true, images: ['/nonexistent/file.png', img1] } } },
    tmpDir,
    { id: 'test8' },
  );
  assert(r8 === img1, 'filters invalid files, returns single valid image path');

  // --- Test 9: resolveLayerOrder integration ---
  console.log('\nTest 9: resolveLayerOrder');
  const FULL_DEFAULT = [
    'bumper',
    'particle',
    'logo',
    'cta',
    'spectrum',
    'lyrics',
    'watermark',
    'nowPlaying',
    'timestamp',
    'lowerThird',
  ];
  assert(JSON.stringify(resolveLayerOrder('')) === JSON.stringify(FULL_DEFAULT), 'default order (10 layers)');
  assert(
    JSON.stringify(resolveLayerOrder('spectrum,logo,bumper')) ===
      JSON.stringify([
        'spectrum',
        'logo',
        'bumper',
        'particle',
        'cta',
        'lyrics',
        'watermark',
        'nowPlaying',
        'timestamp',
        'lowerThird',
      ]),
    'custom order appends missing',
  );
  assert(
    JSON.stringify(resolveLayerOrder('bumper,particle,logo,cta,spectrum')) === JSON.stringify(FULL_DEFAULT),
    'old 5-layer config gets text layers appended',
  );

  console.log(`\n${'='.repeat(40)}`);
  console.log(`Results: ${passed} passed, ${failed} failed`);
  process.exitCode = failed > 0 ? 1 : 0;
} catch (error) {
  console.error('\nSmoke test crashed:', error.message);
  console.error(error.stack);
  process.exitCode = 1;
} finally {
  await rm(tmpDir, { recursive: true, force: true }).catch(() => {});
}
