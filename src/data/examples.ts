import {
  taskIds,
  type ArticulatedExample,
  type BenchmarkExample,
  type DynamicExample,
  type ExamplesManifest,
  type TaskId,
} from './types';

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
    assetBase: candidate.assetBase,
    examples: candidate.examples,
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
