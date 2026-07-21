#!/usr/bin/env node

import { copyFile, mkdtemp, readdir, rm, stat } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const assetsRoot = path.join(root, 'public', 'assets');
const thresholdMiB = Number(process.env.GLB_OPTIMIZE_MIN_MIB ?? 4);
const thresholdBytes = thresholdMiB * 1024 * 1024;
const executable = path.join(
  root,
  'node_modules',
  '.bin',
  process.platform === 'win32' ? 'gltf-transform.cmd' : 'gltf-transform',
);

async function collectGlbs(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const target = path.join(directory, entry.name);
      if (entry.isDirectory()) return collectGlbs(target);
      return entry.isFile() && entry.name.endsWith('.glb') ? [target] : [];
    }),
  );
  return nested.flat();
}

function run(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(executable, args, { stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`gltf-transform ${args[0]} exited with code ${code}`));
    });
  });
}

const candidates = [];
for (const file of await collectGlbs(assetsRoot)) {
  const size = (await stat(file)).size;
  if (size >= thresholdBytes) candidates.push({ file, size });
}

let beforeBytes = 0;
let afterBytes = 0;
for (const [index, candidate] of candidates.entries()) {
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'sceneactbench-glb-'));
  const resizedPath = path.join(temporary, 'resized.glb');
  const webpPath = path.join(temporary, 'textures.glb');
  const optimizedPath = path.join(temporary, 'optimized.glb');
  const relative = path.relative(root, candidate.file);
  console.log(`[${index + 1}/${candidates.length}] Optimizing ${relative}`);
  try {
    await run(['resize', candidate.file, resizedPath, '--width', '512', '--height', '512']);
    await run(['webp', resizedPath, webpPath, '--quality', '76']);
    await run(['draco', webpPath, optimizedPath]);
    const optimizedSize = (await stat(optimizedPath)).size;
    beforeBytes += candidate.size;
    afterBytes += optimizedSize;
    await copyFile(optimizedPath, candidate.file);
    console.log(
      `  ${(candidate.size / 1024 / 1024).toFixed(2)} MiB → ` +
        `${(optimizedSize / 1024 / 1024).toFixed(2)} MiB`,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

console.log(
  `Optimized ${candidates.length} GLBs: ` +
    `${(beforeBytes / 1024 / 1024).toFixed(1)} MiB → ` +
    `${(afterBytes / 1024 / 1024).toFixed(1)} MiB.`,
);
