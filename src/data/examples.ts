import {
  taskIds,
  type ArticulatedExample,
  type BenchmarkExample,
  type DynamicExample,
  type ExamplesManifest,
  type MediaAsset,
  type TaskId,
} from './types';
import { withBase } from './assetPath';

export const emptyExamplesManifest: ExamplesManifest = {
  schemaVersion: 1,
  generatedAt: null,
  assetBase: '/assets/examples/',
  examples: [],
};

const isTaskId = (value: unknown): value is TaskId =>
  typeof value === 'string' && (taskIds as readonly string[]).includes(value);

const isExample = (value: unknown): value is BenchmarkExample => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<BenchmarkExample>;
  const baseIsValid =
    typeof candidate.id === 'string' &&
    isTaskId(candidate.task) &&
    typeof candidate.modelId === 'string' &&
    typeof candidate.title === 'string' &&
    typeof candidate.sourceInstance === 'string' &&
    Array.isArray(candidate.metrics) &&
    Array.isArray(candidate.referenceImages) &&
    Array.isArray(candidate.outputImages);
  if (!baseIsValid) return false;
  if (candidate.task === 'articulated') {
    const articulated = candidate as Partial<ArticulatedExample>;
    return (
      typeof articulated.hasAnimation === 'boolean' &&
      Array.isArray(articulated.keyframes)
    );
  }
  if (candidate.task === 'dynamic') {
    const dynamic = candidate as Partial<DynamicExample>;
    return (
      typeof dynamic.hasAnimation === 'boolean' &&
      Array.isArray(dynamic.lowPolyPreviews) &&
      Array.isArray(dynamic.photorealisticPreviews)
    );
  }
  return true;
};

const rebaseMedia = (asset: MediaAsset): MediaAsset => ({
  ...asset,
  src: withBase(asset.src),
  ...(asset.poster ? { poster: withBase(asset.poster) } : {}),
});

const rebaseExample = (example: BenchmarkExample): BenchmarkExample => {
  const referenceImages = example.referenceImages.map(rebaseMedia);
  const outputImages = example.outputImages.map(rebaseMedia);
  const referenceArtifacts = {
    ...(example.referenceGlb ? { referenceGlb: rebaseMedia(example.referenceGlb) } : {}),
    ...(example.referenceVideos
      ? { referenceVideos: example.referenceVideos.map(rebaseMedia) }
      : {}),
  };
  if (example.task === 'layout' || example.task === 'reconstruction') {
    return {
      ...example,
      referenceImages,
      outputImages,
      ...referenceArtifacts,
      ...(example.outputGlb ? { outputGlb: rebaseMedia(example.outputGlb) } : {}),
    };
  }
  if (example.task === 'camera') {
    return { ...example, referenceImages, outputImages, ...referenceArtifacts };
  }
  if (example.task === 'articulated') {
    return {
      ...example,
      referenceImages,
      outputImages,
      ...referenceArtifacts,
      keyframes: example.keyframes.map(rebaseMedia),
      ...(example.animatedGlb ? { animatedGlb: rebaseMedia(example.animatedGlb) } : {}),
    };
  }
  if (example.task === 'dynamic') {
    return {
      ...example,
      referenceImages,
      outputImages,
      ...referenceArtifacts,
      lowPolyPreviews: example.lowPolyPreviews.map(rebaseMedia),
      photorealisticPreviews: example.photorealisticPreviews.map(rebaseMedia),
      ...(example.animatedGlb ? { animatedGlb: rebaseMedia(example.animatedGlb) } : {}),
    };
  }
  throw new Error(`Unsupported example task: ${example.task}`);
};

export function parseExamplesManifest(value: unknown): ExamplesManifest {
  if (!value || typeof value !== 'object') {
    throw new Error('Examples manifest must be an object.');
  }

  const candidate = value as Partial<ExamplesManifest>;
  if (
    candidate.schemaVersion !== 1 ||
    typeof candidate.assetBase !== 'string' ||
    !Array.isArray(candidate.examples) ||
    !candidate.examples.every(isExample)
  ) {
    throw new Error('Examples manifest does not match schema version 1.');
  }

  return {
    schemaVersion: 1,
    generatedAt: typeof candidate.generatedAt === 'string' ? candidate.generatedAt : null,
    assetBase: withBase(candidate.assetBase),
    examples: candidate.examples.map(rebaseExample),
  };
}

export async function loadExamplesManifest(
  signal?: AbortSignal,
): Promise<ExamplesManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}data/examples.json`, { signal });
  if (!response.ok) {
    throw new Error(`Examples manifest request failed (${response.status}).`);
  }
  return parseExamplesManifest(await response.json());
}
