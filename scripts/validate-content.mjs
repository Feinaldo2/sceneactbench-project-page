#!/usr/bin/env node

import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..');
const scanRoots = ['src', 'public', 'docs', '.github', 'README.md', 'index.html', 'vite.config.ts'];
const textExtensions = new Set(['.css', '.html', '.json', '.md', '.mjs', '.svg', '.ts', '.tsx', '.yml']);
const forbiddenTerms = [
  ['W', 'PE'].join(''),
  ['W', 'ME'].join(''),
];
const requiredSections = [
  'tldr',
  'leaderboard',
  'benchmark',
  'tasks',
  'metrics',
  'explorer',
  'analysis',
  'resources',
  'citation',
];

async function collect(target) {
  const absolute = path.join(root, target);
  const entries = await readdir(absolute, { withFileTypes: true }).catch(() => null);
  if (!entries) return [absolute];
  const nested = await Promise.all(
    entries.map((entry) => collect(path.join(target, entry.name))),
  );
  return nested.flat();
}

const files = (await Promise.all(scanRoots.map(collect)))
  .flat()
  .filter((file) => textExtensions.has(path.extname(file)));

const violations = [];
for (const file of files) {
  const content = await readFile(file, 'utf8');
  for (const term of forbiddenTerms) {
    if (content.includes(term)) {
      violations.push(`${path.relative(root, file)} contains prohibited terminology ${term}.`);
    }
  }
}

const app = await readFile(path.join(root, 'src', 'App.tsx'), 'utf8');
for (const section of requiredSections) {
  if (!app.includes(`id="${section}"`)) {
    violations.push(`src/App.tsx is missing the #${section} navigation target.`);
  }
}

const vite = await readFile(path.join(root, 'vite.config.ts'), 'utf8');
if (!/base:\s*['"]\/sceneactbench-project-page\/['"]/.test(vite)) {
  violations.push('vite.config.ts must use the GitHub Pages project base "/sceneactbench-project-page/".');
}

const examplesManifest = JSON.parse(
  await readFile(path.join(root, 'public', 'data', 'examples.json'), 'utf8'),
);
if (examplesManifest.examples?.length !== 55) {
  violations.push('public/data/examples.json must contain 55 model × task examples.');
} else {
  const pairs = new Set(
    examplesManifest.examples.map((example) => `${example.task}:${example.modelId}`),
  );
  if (pairs.size !== 55) {
    violations.push('Every model × task example pair must be unique.');
  }
  for (const task of ['layout', 'camera', 'articulated', 'reconstruction', 'dynamic']) {
    const taskExamples = examplesManifest.examples.filter((example) => example.task === task);
    const modelCount = new Set(taskExamples.map((example) => example.modelId)).size;
    if (taskExamples.length !== 11 || modelCount !== 11) {
      violations.push(
        `Expected 11 unique model configurations for ${task}, found ${modelCount}.`,
      );
    }
  }
}

const serializedManifest = JSON.stringify(examplesManifest);
if (/\/Users\/|\/tmp\/|glb-placement-benchmark|llm3dbench/.test(serializedManifest)) {
  violations.push('public/data/examples.json leaks a local source path.');
}

const mediaFields = [
  'referenceImages',
  'outputImages',
  'keyframes',
  'lowPolyPreviews',
  'photorealisticPreviews',
];
const singleMediaFields = ['outputGlb', 'animatedGlb'];
for (const example of examplesManifest.examples ?? []) {
  const media = [
    ...mediaFields.flatMap((field) => example[field] ?? []),
    ...singleMediaFields.flatMap((field) => (example[field] ? [example[field]] : [])),
  ];
  for (const asset of media) {
    for (const source of [asset.src, asset.poster].filter(Boolean)) {
      const assetPath = path.join(root, 'public', source.replace(/^\//, ''));
      const assetStat = await stat(assetPath).catch(() => null);
      if (!assetStat?.isFile()) {
        violations.push(`${example.id} references missing asset ${source}.`);
      } else if (assetStat.size >= 95 * 1024 * 1024) {
        violations.push(`${example.id} references an asset at or above the 95 MiB safety limit.`);
      } else if (source.endsWith('.glb')) {
        const glb = await readFile(assetPath);
        const isGlb =
          glb.length >= 20 &&
          glb.toString('ascii', 0, 4) === 'glTF' &&
          glb.readUInt32LE(4) === 2 &&
          glb.readUInt32LE(8) === glb.length &&
          glb.toString('ascii', 16, 20) === 'JSON';
        if (!isGlb) {
          violations.push(`${example.id} references an invalid GLB container ${source}.`);
          continue;
        }
        if (example.task === 'articulated' || example.task === 'dynamic') {
          const jsonLength = glb.readUInt32LE(12);
          const document = JSON.parse(glb.toString('utf8', 20, 20 + jsonLength).trim());
          const hasAnimation =
            Array.isArray(document.animations) &&
            document.animations.some(
              (animation) =>
                Array.isArray(animation.channels) &&
                animation.channels.length > 0 &&
                Array.isArray(animation.samplers) &&
                animation.samplers.length > 0,
            );
          if (example.hasAnimation !== hasAnimation) {
            violations.push(`${example.id} has an incorrect hasAnimation flag.`);
          }
        }
      }
    }
  }
}

if (violations.length) {
  console.error(violations.join('\n'));
  process.exit(1);
}

console.log(`Validated ${files.length} content files and ${requiredSections.length} navigation targets.`);
