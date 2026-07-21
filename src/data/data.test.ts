import { describe, expect, it } from 'vitest';
import { emptyExamplesManifest, parseExamplesManifest } from './examples';
import { hasPublishedScores, leaderboard } from './leaderboard';
import { metrics } from './metrics';
import { tasks } from './tasks';

describe('typed benchmark data', () => {
  it('contains the complete configuration roster', () => {
    expect(leaderboard).toHaveLength(11);
    expect(
      leaderboard.map((entry) => `${entry.model} ${entry.configuration}`),
    ).toEqual([
      'Doubao Seed 2.0 Pro High',
      'Claude Opus 4.6 High',
      'GPT 5.4 Medium',
      'GPT 5.4 High',
      'Qwen 3.7 Plus High',
      'Gemini 3.1 Pro High',
      'MiMo 2.5 High',
      'Kimi K2.6 Reason',
      'Step 3.7 Flash High',
      'Claude Sonnet 5 High',
      'MiniMax M3 High',
    ]);
    expect(hasPublishedScores()).toBe(true);
    expect(leaderboard[0].scores.overall).toBe(50.2);
  });

  it('keeps canonical task and metric semantics distinct', () => {
    expect(tasks.map((task) => task.id)).toEqual([
      'layout',
      'camera',
      'articulated',
      'reconstruction',
      'dynamic',
    ]);
    expect(metrics.find((metric) => metric.id === 'MPE')?.name).toBe('Maximum Part Error');
    expect(metrics.find((metric) => metric.id === 'MME')?.name).toBe('Maximum Mover Error');
    expect(metrics.find((metric) => metric.id === 'AME')?.name).toBe('Average Mover Error');
    expect(metrics.find((metric) => metric.id === 'LE')?.name).toBe('Layout Error');
    expect(tasks.find((task) => task.id === 'dynamic')?.primaryMetric).toBe('MME / LE');
  });

  it('accepts the empty curation manifest and rejects malformed input', () => {
    expect(parseExamplesManifest(emptyExamplesManifest)).toEqual(emptyExamplesManifest);
    expect(() => parseExamplesManifest({ schemaVersion: 2, examples: [] })).toThrow(
      /schema version 1/i,
    );
    expect(() =>
      parseExamplesManifest({
        ...emptyExamplesManifest,
        examples: [
          {
            id: 'dynamic-example',
            task: 'dynamic',
            modelId: 'model',
            title: 'Dynamic example',
            sourceInstance: 'scene',
            metrics: [],
            referenceImages: [],
            outputImages: [],
            lowPolyPreviews: [],
            photorealisticPreviews: [],
          },
        ],
      }),
    ).toThrow(/schema version 1/i);
  });
});
