#!/usr/bin/env node

import { copyFile, mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const TASKS = new Set(['layout', 'camera', 'articulated', 'reconstruction', 'dynamic']);
const MEDIA_ARRAY_FIELDS = [
  'referenceImages',
  'outputImages',
  'keyframes',
  'lowPolyPreviews',
  'photorealisticPreviews',
];
const MEDIA_SINGLE_FIELDS = ['outputGlb', 'animatedGlb'];
const IMAGE_EXTENSIONS = new Set(['.avif', '.jpg', '.jpeg', '.png', '.webp']);
const ASSET_EXTENSIONS = new Set([...IMAGE_EXTENSIONS, '.glb']);
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_GLB_BYTES = 40 * 1024 * 1024;
const MAX_TOTAL_BYTES = 180 * 1024 * 1024;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const inputArg = args.find((arg) => !arg.startsWith('--'));

if (!inputArg) {
  console.error('Usage: npm run curate:examples -- /absolute/path/examples.json [--dry-run]');
  process.exit(1);
}

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const inputPath = path.resolve(inputArg);
const inputRoot = path.dirname(inputPath);
const outputAssetRoot = path.join(repositoryRoot, 'public', 'assets', 'examples');
const outputManifestPath = path.join(repositoryRoot, 'public', 'data', 'examples.json');

const raw = JSON.parse(await readFile(inputPath, 'utf8'));

if (raw.schemaVersion !== 1 || !Array.isArray(raw.examples)) {
  throw new Error('Expected schemaVersion 1 with an examples array.');
}

const modelIds = new Set([
  'doubao-seed-2-pro-high',
  'claude-opus-4-6-high',
  'gpt-5-4-medium',
  'gpt-5-4-high',
  'qwen-3-7-plus-high',
  'gemini-3-1-pro-high',
  'mimo-2-5-high',
  'kimi-k2-6-reason',
  'step-3-7-flash-high',
  'claude-sonnet-5-high',
  'minimax-m3-high',
]);

const seenIds = new Set();
let totalBytes = 0;

function assertSafeId(value, label) {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]*$/.test(value)) {
    throw new Error(`${label} must use lowercase kebab-case.`);
  }
}

async function curatePath(source, exampleId, expectedKind, suffix = '') {
  if (typeof source !== 'string' || source.length === 0) {
    throw new Error(`${exampleId}: every media src must be a non-empty local path.`);
  }
  if (source.startsWith('/assets/examples/')) return source;
  if (/^[a-z]+:\/\//i.test(source)) {
    throw new Error(`${exampleId}: remote media URLs are not accepted (${source}).`);
  }

  const absoluteSource = path.resolve(inputRoot, source);
  const relativeToInput = path.relative(inputRoot, absoluteSource);
  if (relativeToInput.startsWith('..') || path.isAbsolute(relativeToInput)) {
    throw new Error(`${exampleId}: asset escapes the curation directory (${source}).`);
  }

  const extension = path.extname(absoluteSource).toLowerCase();
  if (!ASSET_EXTENSIONS.has(extension)) {
    throw new Error(`${exampleId}: unsupported asset extension ${extension}.`);
  }
  if (expectedKind === 'image' && !IMAGE_EXTENSIONS.has(extension)) {
    throw new Error(`${exampleId}: expected an image but received ${extension}.`);
  }
  if (expectedKind === 'glb' && extension !== '.glb') {
    throw new Error(`${exampleId}: expected a .glb asset.`);
  }

  const sourceStat = await stat(absoluteSource);
  const perFileLimit = extension === '.glb' ? MAX_GLB_BYTES : MAX_IMAGE_BYTES;
  if (sourceStat.size > perFileLimit) {
    throw new Error(
      `${exampleId}: ${path.basename(source)} exceeds the ${Math.round(perFileLimit / 1024 / 1024)} MB limit.`,
    );
  }
  totalBytes += sourceStat.size;
  if (totalBytes > MAX_TOTAL_BYTES) {
    throw new Error('Curated assets exceed the 180 MB total budget.');
  }

  const safeStem = path
    .basename(absoluteSource, extension)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const outputName = `${safeStem || 'asset'}${suffix}${extension}`;
  const outputDirectory = path.join(outputAssetRoot, exampleId);
  const outputPath = path.join(outputDirectory, outputName);

  if (!dryRun) {
    await mkdir(outputDirectory, { recursive: true });
    await copyFile(absoluteSource, outputPath);
  }
  return `/assets/examples/${exampleId}/${outputName}`;
}

async function curateMedia(media, exampleId, expectedKind, index) {
  if (!media || typeof media !== 'object' || typeof media.alt !== 'string' || !media.alt.trim()) {
    throw new Error(`${exampleId}: media entries require meaningful alt text.`);
  }
  const curated = {
    ...media,
    src: await curatePath(media.src, exampleId, expectedKind, index ? `-${index}` : ''),
  };
  if (media.poster) {
    curated.poster = await curatePath(media.poster, exampleId, 'image', `-poster-${index || 1}`);
  }
  return curated;
}

const curatedExamples = [];
for (const example of raw.examples) {
  assertSafeId(example.id, 'Example id');
  if (seenIds.has(example.id)) throw new Error(`Duplicate example id: ${example.id}`);
  seenIds.add(example.id);
  if (!TASKS.has(example.task)) throw new Error(`${example.id}: unsupported task ${example.task}`);
  if (!modelIds.has(example.modelId)) {
    throw new Error(`${example.id}: modelId does not match a published configuration.`);
  }
  if (!Array.isArray(example.metrics)) throw new Error(`${example.id}: metrics must be an array.`);

  const curated = { ...example };
  for (const field of MEDIA_ARRAY_FIELDS) {
    if (curated[field] === undefined) continue;
    if (!Array.isArray(curated[field])) throw new Error(`${example.id}: ${field} must be an array.`);
    curated[field] = await Promise.all(
      curated[field].map((media, index) =>
        curateMedia(media, example.id, 'image', index + 1),
      ),
    );
  }
  for (const field of MEDIA_SINGLE_FIELDS) {
    if (curated[field] === undefined) continue;
    curated[field] = await curateMedia(curated[field], example.id, 'glb', 0);
  }

  if (example.task === 'camera' && MEDIA_SINGLE_FIELDS.some((field) => example[field])) {
    throw new Error(`${example.id}: Camera examples must use JSON pose and images, not GLB.`);
  }
  if (
    example.task === 'articulated' &&
    (typeof example.hasAnimation !== 'boolean' || !Array.isArray(example.keyframes))
  ) {
    throw new Error(
      `${example.id}: Articulated examples require hasAnimation and a keyframes array.`,
    );
  }
  if (
    example.task === 'dynamic' &&
    (typeof example.hasAnimation !== 'boolean' ||
      !Array.isArray(example.lowPolyPreviews) ||
      !Array.isArray(example.photorealisticPreviews))
  ) {
    throw new Error(
      `${example.id}: Dynamic examples require hasAnimation and both preview arrays.`,
    );
  }

  curatedExamples.push(curated);
}

const output = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  assetBase: '/assets/examples/',
  examples: curatedExamples,
};

if (!dryRun) {
  await mkdir(path.dirname(outputManifestPath), { recursive: true });
  await writeFile(outputManifestPath, `${JSON.stringify(output, null, 2)}\n`);
}

console.log(
  `${dryRun ? 'Validated' : 'Curated'} ${curatedExamples.length} examples (${(totalBytes / 1024 / 1024).toFixed(1)} MB).`,
);
